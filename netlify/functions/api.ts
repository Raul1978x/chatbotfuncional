import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../src/app.module';
import serverless from 'serverless-http';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

let cachedServer: Handler;

async function bootstrap(): Promise<Handler> {
  const expressApp = express();
  const adapter = new ExpressAdapter(expressApp);
  
  const app = await NestFactory.create(AppModule, adapter);
  await app.init();

  return serverless(expressApp);
}

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  if (!cachedServer) {
    cachedServer = await bootstrap();
  }
  return cachedServer(event, context);
};
