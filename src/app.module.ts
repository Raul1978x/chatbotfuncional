import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PrismaModule } from './prisma/prisma.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { ChatbotModule } from './chatbot/chatbot.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local']
    }),
    EventEmitterModule.forRoot(),
    PrismaModule,
    WhatsappModule,
    ChatbotModule
  ],
  controllers: [AppController, HealthController],
  providers: [AppService]
})
export class AppModule {}
