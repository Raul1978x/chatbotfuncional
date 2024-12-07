import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import NodeCache from 'node-cache';

@Injectable()
export class ClientConfigManager {
  private cache: NodeCache;

  constructor(private readonly prisma: PrismaService) {
    // Inicializar el caché con un tiempo de vida de 1 hora
    this.cache = new NodeCache({ stdTTL: 3600 });
  }

  async getConfig(phoneNumber: string): Promise<any> {
    // Intentar obtener la configuración desde el caché
    const cachedConfig = this.cache.get(phoneNumber);
    if (cachedConfig) {
      return cachedConfig;
    }

    // Si no está en caché, buscar en la base de datos
    const config = await this.prisma.clientConfig.findUnique({
      where: { phoneNumber },
    });

    if (config) {
      // Actualizar el caché con la nueva configuración
      this.updateCache(phoneNumber, config);
      return config;
    }

    // Si no existe configuración, crear una por defecto
    return this.createDefaultConfig(phoneNumber);
  }

  updateCache(phoneNumber: string, config: any): void {
    this.cache.set(phoneNumber, config);
  }

  private async createDefaultConfig(phoneNumber: string): Promise<any> {
    const defaultConfig = {
      phoneNumber,
      activeModules: ['support'], // Módulo de soporte activado por defecto
      settings: {
        language: 'es',
        timezone: 'UTC',
      },
    };

    // Guardar la configuración por defecto en la base de datos
    const savedConfig = await this.prisma.clientConfig.create({
      data: defaultConfig,
    });

    // Actualizar el caché
    this.updateCache(phoneNumber, savedConfig);
    return savedConfig;
  }
}
