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
      abortOnError: false // Prevenir que la app se cierre en errores de inicialización
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

    // Configurar CORS de manera más permisiva para desarrollo
    app.enableCors({
      origin: '*', // Permitir todos los orígenes
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    });

    // Obtener el puerto del entorno o usar el valor por defecto
    const port = process.env.PORT || 3003;
    
    // Iniciar el servidor
    await app.listen(port);
    logger.log(`Application is running on: ${await app.getUrl()}`);
    
    // Log de variables de entorno (sin valores sensibles)
    logger.debug('Environment:', {
      NODE_ENV: process.env.NODE_ENV,
      PORT: port,
      FRONTEND_URL_SET: !!process.env.FRONTEND_URL
    });

  } catch (error) {
    logger.error('Error bootstrapping application:', error);
    // No lanzar el error, solo registrarlo
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
