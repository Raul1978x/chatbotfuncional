import { Injectable } from '@nestjs/common';
import { ProcessedMessage } from '../../whatsapp/whatsapp.service';
import { ModuleManager } from '../modules/module.manager';
import { ModuleExecutionContext } from '../modules/interfaces/chatbot-module.interface';
import { Middleware } from '../middleware/middleware.service';

@Injectable()
export class ChatbotService {
  constructor(
    private readonly moduleManager: ModuleManager,
    private readonly middleware: Middleware
  ) {}

  async handleMessage(message: ProcessedMessage): Promise<void> {
    try {
      const { config, metadata } = await this.middleware.interceptRequest(message);
      const defaultModule = config.settings.activeModules[0] || 'default';
      
      const context: ModuleExecutionContext = {
        text: message.text,
        from: message.from,
        timestamp: new Date(message.timestamp).toISOString(),
        key: {
          remoteJid: message.key.remoteJid || '',
          fromMe: message.key.fromMe || false
        },
        message: message.message,
        clientConfig: config
      };

      await this.moduleManager.executeModule(defaultModule, context);
    } catch (error) {
      throw error;
    }
  }
}
