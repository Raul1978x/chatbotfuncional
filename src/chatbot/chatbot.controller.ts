import { Controller } from '@nestjs/common';
import { ProcessedMessage } from '../whatsapp/whatsapp.service';
import { ChatbotService } from './services/chatbot.service';

@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  async receiveMessage(message: ProcessedMessage): Promise<void> {
    await this.chatbotService.handleMessage(message);
  }
}
