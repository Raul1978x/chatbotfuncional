import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../src/app.module';
import serverless from 'serverless-http';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

let cachedServer: any;

async function bootstrap() {
  const expressApp = express();
  const adapter = new ExpressAdapter(expressApp);
  
  const app = await NestFactory.create(AppModule, adapter);
  app.enableCors();
  await app.init();

  const handler = serverless(expressApp);
  return handler;
}

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  if (!cachedServer) {
    cachedServer = await bootstrap();
  }

  const result = await cachedServer(event, context);
  
  return {
    statusCode: result.statusCode,
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
    },
    body: result.body
  };
};
