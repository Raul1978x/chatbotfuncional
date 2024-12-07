import { Injectable, Logger } from '@nestjs/common';
import { ProcessedMessage } from '../../whatsapp/whatsapp.service';
import { ClientConfig } from '../interfaces/client-config.interface';
import { ClientConfigManager } from '../config/client-config.manager';

interface InterceptResult {
  config: ClientConfig;
  metadata: {
    messageType: string;
    processedAt: number;
    [key: string]: any;
  };
}

@Injectable()
export class Middleware {
  private readonly logger = new Logger(Middleware.name);

  constructor(private readonly configManager: ClientConfigManager) {}

  public async interceptRequest(message: ProcessedMessage): Promise<InterceptResult> {
    try {
      // Validar el número de teléfono
      this.validatePhoneNumber(message.from);

      // Validar el timestamp
      this.validateTimestamp(message.timestamp);

      // Obtener la configuración del cliente
      const clientId = this.extractClientId(message.from);
      const config = await this.configManager.getConfig(clientId);

      // Preparar los metadatos del mensaje
      const metadata = this.prepareMessageMetadata(message);

      return { config, metadata };
    } catch (error) {
      this.logger.error('Error in middleware:', error);
      throw error;
    }
  }

  private validatePhoneNumber(phoneNumber: string): void {
    const phoneRegex = /^[0-9]+@s\.whatsapp\.net$/;
    if (!phoneRegex.test(phoneNumber)) {
      throw new Error('Invalid phone number format');
    }
  }

  private validateTimestamp(timestamp: number): void {
    const now = Date.now();
    const fiveMinutesAgo = now - 5 * 60 * 1000;
    const fiveMinutesFromNow = now + 5 * 60 * 1000;

    if (timestamp < fiveMinutesAgo || timestamp > fiveMinutesFromNow) {
      throw new Error('Message timestamp is outside acceptable range');
    }
  }

  private extractClientId(from: string): string {
    return from.split('@')[0];
  }

  private prepareMessageMetadata(message: ProcessedMessage): InterceptResult['metadata'] {
    return {
      messageType: this.determineMessageType(message),
      processedAt: Date.now(),
      hasMedia: this.hasMedia(message),
    };
  }

  private determineMessageType(message: ProcessedMessage): string {
    if (!message.message) return 'unknown';
    return Object.keys(message.message)[0] || 'unknown';
  }

  private hasMedia(message: ProcessedMessage): boolean {
    if (!message.message) return false;
    const mediaTypes = ['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage'];
    return mediaTypes.some(type => type in message.message);
  }
}
