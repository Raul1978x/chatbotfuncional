import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import serverless from 'serverless-http';
import express from 'express';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../src/app.module';

let cachedHandler: any = null;

async function createHandler() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await app.init();

  const expressApp = express();
  expressApp.use(await serverless(app.getHttpAdapter().getInstance()));

  return serverless(expressApp);
}

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  if (!cachedHandler) {
    cachedHandler = await createHandler();
  }

  return cachedHandler(event, context);
};
