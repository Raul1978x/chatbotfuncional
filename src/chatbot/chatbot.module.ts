import { Module } from '@nestjs/common';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './services/chatbot.service';
import { Middleware } from './middleware/middleware.service';
import { ClientConfigManager } from './config/client-config.manager';
import { ModuleManager } from './modules/module.manager';
import { SupportModule } from './modules/support/support.module';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [ChatbotController],
  providers: [
    ChatbotService,
    Middleware,
    ClientConfigManager,
    ModuleManager,
    SupportModule,
    PrismaService,
  ],
  exports: [ModuleManager, Middleware, ChatbotService] 
})
export class ChatbotModule {
  constructor(
    private readonly moduleManager: ModuleManager,
    private readonly supportModule: SupportModule,
  ) {
    // Registrar módulos disponibles
    this.moduleManager.registerModule('support', this.supportModule);
  }
}
