import { Handler } from '@netlify/functions';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../src/app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

let app;

async function bootstrap() {
  const expressApp = express();
  const adapter = new ExpressAdapter(expressApp);
  
  app = await NestFactory.create(AppModule, adapter);
  app.enableCors();
  await app.init();
  
  return expressApp;
}

export const handler: Handler = async (event, context) => {
  try {
    const expressApp = app ? app.getHttpAdapter().getInstance() : await bootstrap();
    
    // Convert event to express request
    const request = {
      method: event.httpMethod,
      path: event.path,
      headers: event.headers,
      body: event.body,
      query: event.queryStringParameters || {},
    };

    return new Promise((resolve, reject) => {
      const response = {
        statusCode: 200,
        headers: {},
        body: '',
      };

      expressApp(request, response, (err) => {
        if (err) {
          console.error('Error:', err);
          reject({
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error' }),
          });
        } else {
          resolve({
            statusCode: response.statusCode,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Headers': 'Content-Type',
              'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            },
            body: response.body,
          });
        }
      });
    });
  } catch (error) {
    console.error('Bootstrap Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server Initialization Error' }),
    };
  }
};
