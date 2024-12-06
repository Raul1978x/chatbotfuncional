import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import serverless from 'serverless-http';
import express from 'express';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../src/app.module';

// Fallback para importaciones dinámicas
const dynamicImportFallback = {
  linkPreview: () => ({ default: {} }),
  classTransformer: () => ({ storage: {} }),
  jimp: () => ({}),
  qrcodeTerminal: () => ({}),
  sharp: () => ({})
};

// Sobrescribir require dinámico
const originalRequire = require;
(global as any).require = (moduleName: string) => {
  switch (moduleName) {
    case 'link-preview-js':
      return dynamicImportFallback.linkPreview();
    case 'class-transformer/storage':
      return dynamicImportFallback.classTransformer();
    case 'jimp':
      return dynamicImportFallback.jimp();
    case 'qrcode-terminal':
      return dynamicImportFallback.qrcodeTerminal();
    case 'sharp':
      return dynamicImportFallback.sharp();
    default:
      return originalRequire(moduleName);
  }
};

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
  try {
    if (!cachedHandler) {
      cachedHandler = await createHandler();
    }

    return await cachedHandler(event, context);
  } catch (error) {
    console.error('Netlify Function Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error', details: error.message })
    };
  }
};
