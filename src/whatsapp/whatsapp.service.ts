import { Injectable, Logger } from '@nestjs/common';
import makeWASocket, {
  DisconnectReason,
  WASocket,
  proto,
  BaileysEventMap,
  WAMessageKey,
  useMultiFileAuthState,
  UserFacingSocketConfig,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import { join } from 'path';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ChatbotService } from '../chatbot/services/chatbot.service';

export interface ProcessedMessage {
  text: string;
  from: string;
  timestamp: number;
  key: WAMessageKey;
  message?: proto.IMessage;
}

export interface StatusResponseDto {
  status: 'connected' | 'disconnected' | 'connecting';
  timestamp: string;
}

@Injectable()
export class WhatsappService {
  private socket: WASocket;
  private readonly logger = new Logger(WhatsappService.name);
  private qrCode: string;
  private isConnected = false;
  private connectionAttempts = 0;
  private readonly MAX_QR_ATTEMPTS = 5;
  private readonly AUTH_FOLDER = 'auth_info';

  constructor(
    private eventEmitter: EventEmitter2,
    private readonly chatbotService: ChatbotService
  ) {}

  public async connect(): Promise<void> {
    try {
      const { state, saveCreds } = await useMultiFileAuthState(
        join(process.cwd(), this.AUTH_FOLDER)
      );

      const config = {
        printQRInTerminal: true,
        auth: state,
        logger: pino({ level: 'silent' }) as any,
      } as UserFacingSocketConfig;

      this.socket = makeWASocket(config);

      this.setupEventListeners(saveCreds);
    } catch (error) {
      this.logger.error('Error connecting to WhatsApp:', error);
      throw error;
    }
  }

  private setupEventListeners(saveCreds: () => Promise<void>): void {
    if (!this.socket) {
      throw new Error('Socket not initialized');
    }

    // Manejar eventos de conexión
    this.socket.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        this.handleQRCode(qr);
      }

      if (connection === 'close') {
        const shouldReconnect =
          (lastDisconnect?.error as Boom)?.output?.statusCode !==
          DisconnectReason.loggedOut;

        if (shouldReconnect) {
          await this.handleReconnect();
        }
      } else if (connection === 'open') {
        this.handleSuccessfulConnection();
      }
    });

    // Manejar eventos de credenciales
    this.socket.ev.on('creds.update', async () => {
      await saveCreds();
    });

    // Manejar eventos de mensajes
    this.socket.ev.on('messages.upsert', async (m) => {
      const message = m.messages[0];
      if (!message?.key?.fromMe && m.type === 'notify') {
        await this.handleIncomingMessage(message);
      }
    });

    // Suscribirse a todos los eventos disponibles para logging
    const eventTypes = ['connection.update', 'creds.update', 'messages.upsert'] as const;
    eventTypes.forEach((event) => {
      this.socket.ev.on(event, (...args) => {
        this.logger.debug(`Event ${event}:`, args);
      });
    });
  }

  private async handleQRCode(qr: string): Promise<void> {
    this.qrCode = qr;
    this.connectionAttempts++;

    if (this.connectionAttempts > this.MAX_QR_ATTEMPTS) {
      this.logger.error('Max QR code generation attempts reached');
      throw new Error('Max QR code generation attempts reached');
    }

    this.logger.log(`QR Code generated (attempt ${this.connectionAttempts}/${this.MAX_QR_ATTEMPTS})`);
  }

  private async handleReconnect(): Promise<void> {
    this.logger.log('Reconnecting to WhatsApp...');
    await this.connect();
  }

  private handleSuccessfulConnection(): void {
    this.isConnected = true;
    this.connectionAttempts = 0;
    this.logger.log('Connected to WhatsApp');
  }

  private async handleIncomingMessage(message: proto.IWebMessageInfo): Promise<void> {
    try {
      const processedMessage = this.processMessage(message);
      if (processedMessage) {
        await this.chatbotService.handleMessage(processedMessage);
      }
    } catch (error) {
      this.logger.error('Error processing incoming message:', error);
    }
  }

  private processMessage(message: proto.IWebMessageInfo): ProcessedMessage | null {
    if (!message.message) return null;

    const messageType = Object.keys(message.message)[0];
    const messageContent = message.message[messageType];

    if (typeof messageContent !== 'object') return null;

    let text = '';
    if ('text' in messageContent) {
      text = messageContent.text as string;
    } else if ('caption' in messageContent) {
      text = messageContent.caption as string;
    }

    if (!text) return null;

    return {
      text,
      from: message.key.remoteJid || '',
      timestamp: message.messageTimestamp as number,
      key: message.key,
      message: message.message,
    };
  }

  public getConnectionStatus(): StatusResponseDto {
    return {
      status: this.isConnected ? 'connected' : 'disconnected' as 'connected' | 'disconnected' | 'connecting',
      timestamp: new Date().toISOString()
    };
  }

  public async getCurrentQR(): Promise<string> {
    return this.qrCode;
  }

  public async forceQRRegeneration(): Promise<void> {
    this.connectionAttempts = 0;
    await this.connect();
  }

  public async sendMessage(to: string, message: string): Promise<any> {
    try {
      if (!this.isConnected) {
        throw new Error('WhatsApp is not connected');
      }

      const formattedNumber = `${to}@s.whatsapp.net`;
      const result = await this.socket.sendMessage(formattedNumber, { text: message });
      
      return {
        success: true,
        messageId: result.key.id,
        timestamp: result.messageTimestamp
      };
    } catch (error) {
      this.logger.error('Error sending message:', error);
      throw error;
    }
  }

  public getQRCode(): string {
    return this.qrCode;
  }

  public isWhatsAppConnected(): boolean {
    return this.isConnected;
  }

  public async close(): Promise<void> {
    try {
      if (!this.socket) {
        throw new Error('Socket not initialized');
      }
      await this.socket.end(undefined);
      this.isConnected = false;
      this.logger.log('WhatsApp connection closed');
    } catch (error) {
      this.logger.error('Error closing WhatsApp connection:', error);
      throw error;
    }
  }
}
