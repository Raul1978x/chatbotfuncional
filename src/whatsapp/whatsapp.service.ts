import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as makeWASocket from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import * as path from 'path';
import * as fs from 'fs';
import * as qrcode from 'qrcode';
import { DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';

@Injectable()
export class WhatsappService implements OnModuleInit {
  private readonly logger = new Logger(WhatsappService.name);
  private client: any;
  private connectionStatus: 'disconnected' | 'connecting' | 'connected' = 'disconnected';
  private currentQR: string | null = null;
  private qrGenerationAttempts = 0;
  private readonly MAX_QR_ATTEMPTS = 3;

  async onModuleInit() {
    try {
      await this.connectToWhatsApp();
    } catch (error) {
      this.logger.error('Error durante la inicialización del módulo', error);
    }
  }

  getConnectionStatus() {
    return {
      status: this.connectionStatus,
      qrAvailable: !!this.currentQR,
      qrGenerationAttempts: this.qrGenerationAttempts,
      timestamp: new Date().toISOString()
    };
  }

  async sendMessage(number: string, message: string) {
    try {
      if (!this.client || this.connectionStatus !== 'connected') {
        throw new Error('WhatsApp no está conectado');
      }

      // Asegurarse que el número tenga el formato correcto
      const formattedNumber = number.includes('@s.whatsapp.net') 
        ? number 
        : `${number.replace(/[^\d]/g, '')}@s.whatsapp.net`;

      await this.client.sendMessage(formattedNumber, {
        text: message
      });

      return {
        success: true,
        message: 'Mensaje enviado correctamente'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  getClient() {
    return this.client;
  }

  async getCurrentQR(): Promise<string | null> {
    try {
      // Incrementar contador de intentos
      this.qrGenerationAttempts++;

      // Reiniciar intentos si se supera el máximo
      if (this.qrGenerationAttempts > this.MAX_QR_ATTEMPTS) {
        this.logger.error('Máximo de intentos de generación de QR alcanzado');
        this.qrGenerationAttempts = 0;
        return null;
      }

      // Si no hay cliente, intentar reconectar
      if (!this.client) {
        this.logger.warn('Cliente de WhatsApp no inicializado. Intentando reconectar...');
        await this.connectToWhatsApp();
      }

      return this.currentQR;
    } catch (error) {
      this.logger.error('Error al obtener QR actual:', error);
      return null;
    }
  }

  async forceQRRegeneration() {
    try {
      this.logger.log('Forzando regeneración de QR...');
      
      // Reiniciar estado de conexión
      this.connectionStatus = 'disconnected';
      this.currentQR = null;
      
      // Desconectar cliente actual si existe
      if (this.client) {
        this.client.ev.removeAllListeners('connection.update');
        this.client.logout();
      }

      // Reconectar
      await this.connectToWhatsApp();
    } catch (error) {
      this.logger.error('Error al forzar regeneración de QR:', error);
    }
  }

  async connectToWhatsApp() {
    try {
      this.connectionStatus = 'connecting';
      const authPath = path.join(process.cwd(), 'auth_info_baileys');
      const { state, saveCreds } = await useMultiFileAuthState(authPath);

      // Configuración de logger personalizada
      const logger = {
        info: (msg: string) => this.logger.log(msg),
        warn: (msg: string) => this.logger.warn(msg),
        error: (msg: string) => this.logger.error(msg),
        child: () => logger // Agregamos un método child que devuelve el mismo logger
      };

      this.client = makeWASocket.default({
        auth: state,
        printQRInTerminal: true,
        logger: logger
      });

      // Manejar eventos de conexión
      this.client.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
        this.logger.log(`Estado de conexión: ${connection}`);

        if (qr) {
          this.logger.log('Generando código QR...');
          try {
            // Almacenar el QR para acceso posterior
            this.currentQR = qr;
            this.qrGenerationAttempts = 0;

            // Opcional: Guardar QR como archivo (para depuración)
            const qrPath = path.join(process.cwd(), 'qr-code.png');
            await qrcode.toFile(qrPath, qr, {
              type: 'png',
              width: 800,
              margin: 1,
              errorCorrectionLevel: 'H'
            });
          } catch (err) {
            this.logger.error('Error al procesar QR:', err);
          }
        }

        if (connection === 'close') {
          this.connectionStatus = 'disconnected';
          const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
          this.logger.log(`Conexión cerrada. Reconectando: ${shouldReconnect}`);
          
          if (shouldReconnect) {
            await this.connectToWhatsApp();
          }
        } else if (connection === 'open') {
          this.connectionStatus = 'connected';
          this.currentQR = null;
          this.qrGenerationAttempts = 0;
          this.logger.log('¡Conexión establecida!');
        }
      });

      // Guardar credenciales
      this.client.ev.on('creds.update', saveCreds);

      // Manejar mensajes entrantes
      this.client.ev.on('messages.upsert', async ({ messages }) => {
        const message = messages[0];
        
        if (!message?.message || message.key.fromMe) return;

        const messageText = message.message.conversation || 
                          message.message.extendedTextMessage?.text || 
                          '';

        const remoteJid = message.key.remoteJid;

        // Procesar comandos
        switch(messageText.toLowerCase()) {
          case 'hola':
            await this.client.sendMessage(remoteJid, {
              text: '👋 ¡Hola! Soy un bot de WhatsApp. ¿En qué puedo ayudarte?'
            });
            break;
          case 'ayuda':
            await this.client.sendMessage(remoteJid, {
              text: `🤖 *Comandos disponibles:*\n\n` +
                   `- *hola*: Saludo inicial\n` +
                   `- *ayuda*: Muestra este mensaje\n` +
                   `- *info*: Información sobre el bot`
            });
            break;
          default:
            await this.client.sendMessage(remoteJid, {
              text: '❓ No entiendo ese comando. Escribe *ayuda* para ver los comandos disponibles.'
            });
        }
      });
    } catch (error) {
      this.logger.error('Error al conectar a WhatsApp:', error);
      this.connectionStatus = 'disconnected';
      throw error;
    }
  }
}
