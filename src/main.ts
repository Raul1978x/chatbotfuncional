import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  try {
    // Crear la aplicación con opciones específicas
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log', 'debug'],
      cors: true,
      abortOnError: false
    });

    // Añadir ValidationPipe global
    app.useGlobalPipes(new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true
    }));

    // Configurar CORS de manera más específica
    app.enableCors({
      origin: [
        'http://localhost:3000', 
        'http://localhost:3001', 
        'https://chatbot-funcional.vercel.app',
        'https://whatsapp-chatbot-frontend.vercel.app'
      ],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'Accept', 
        'X-Requested-With',
        'Origin',
        'Access-Control-Request-Method',
        'Access-Control-Request-Headers'
      ],
      credentials: true,
      maxAge: 3600
    });

    // Configurar Swagger
    const config = new DocumentBuilder()
      .setTitle('WhatsApp Bot API')
      .setDescription('API para el bot de WhatsApp usando Baileys')
      .setVersion('1.0')
      .addTag('WhatsApp')
      .addServer('https://chatbot-funcional-714i40cwx-raul1978xs-projects.vercel.app/api', 'Vercel Deployment')
      .addServer('http://localhost:3000/api', 'Local Development')
      .addBearerAuth() // Añadir soporte para autenticación Bearer
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document, {
      swaggerOptions: {
        docExpansion: 'none',
        filter: true,
        showRequestDuration: true
      }
    });

    // Obtener el puerto del entorno o usar el valor por defecto
    const port = process.env.PORT || 3000;
    
    // Iniciar el servidor
    await app.listen(port);
    logger.log(`Application is running on: ${await app.getUrl()}`);
    logger.log(`Swagger available at: ${await app.getUrl()}/api`);
    
  } catch (error) {
    console.error('Error during bootstrap', error);
    process.exit(1);
  }
}

bootstrap();

// Manejar rechazos de promesas no capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});
