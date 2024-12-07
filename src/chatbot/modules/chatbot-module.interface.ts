import { ProcessedMessage } from '../../whatsapp/whatsapp.service';
import { ClientConfig } from '../config/client-config.interface';

export interface ModuleContext {
  message: ProcessedMessage;
  config: ClientConfig;
  metadata: {
    messageType: string;
    processedAt: number;
    [key: string]: any;
  };
}

export interface ChatbotModule {
  name: string;
  description: string;
  requiredConfig: string[];
  execute: (context: ModuleContext) => Promise<string>;
}
