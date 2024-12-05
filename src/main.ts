import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  try {
    // Crear la aplicación con opciones específicas
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log', 'debug'],
      cors: true,
      abortOnError: false
    });

    // Configurar CORS de manera más específica
    app.enableCors({
      origin: [
        'http://localhost:3000', 
        'https://chatbot-dashboard-rst-argentinas-projects.vercel.app',
        process.env.FRONTEND_URL || '*'
      ],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'Accept', 
        'X-Requested-With'
      ],
      credentials: true,
    });

    // Configurar Swagger
    const config = new DocumentBuilder()
      .setTitle('WhatsApp Bot API')
      .setDescription('API para el bot de WhatsApp usando Baileys')
      .setVersion('1.0')
      .addTag('WhatsApp')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);

    // Obtener el puerto del entorno o usar el valor por defecto
    const port = process.env.PORT || 3000;
    
    // Iniciar el servidor
    await app.listen(port);
    logger.log(`Application is running on: ${await app.getUrl()}`);
    
    // Log de variables de entorno (sin valores sensibles)
    logger.debug('Environment:', {
      NODE_ENV: process.env.NODE_ENV,
      PORT: port,
      FRONTEND_URL: process.env.FRONTEND_URL
    });

  } catch (error) {
    logger.error('Error bootstrapping application:', error);
    process.exit(1);
  }
}

// Manejar rechazos de promesas no capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Manejar excepciones no capturadas
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

bootstrap();
