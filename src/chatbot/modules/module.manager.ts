import { Injectable, Logger, Type } from '@nestjs/common';
import { ModuleNotFoundError, ModuleNotActiveError } from '../errors/module.errors';
import { ProcessedMessage } from '../../whatsapp/whatsapp.service';
import { ClientConfig } from '../interfaces/client-config.interface';
import { ChatbotModule, ModuleExecutionContext } from './interfaces/chatbot-module.interface';

// Interfaces
interface ModuleMetadata {
  description: string;
  version: string;
  dependencies?: string[];
  config?: Record<string, any>;
}

interface ModuleInfo extends ModuleMetadata {
  name: string;
}

@Injectable()
export class ModuleManager {
  private readonly logger = new Logger(ModuleManager.name);
  private modules: Map<string, ChatbotModule> = new Map();
  private moduleMetadata: Map<string, ModuleMetadata> = new Map();

  constructor() {
    this.logger.log('ModuleManager initialized');
  }

  registerModule(
    moduleName: string, 
    moduleInstance: ChatbotModule,
    metadata: ModuleMetadata = { description: '', version: '1.0.0', dependencies: [] }
  ): void {
    this.validateModule(moduleInstance);
    this.modules.set(moduleName, moduleInstance);
    this.moduleMetadata.set(moduleName, metadata);
    this.logger.log(`Module registered: ${moduleName} v${metadata.version}`);
  }

  isModuleActive(moduleName: string, clientConfig: ClientConfig): boolean {
    if (!clientConfig?.settings?.activeModules) {
      this.logger.warn(`No active modules configured for client`);
      return false;
    }
    return clientConfig.settings.activeModules.includes(moduleName);
  }

  async executeModule(moduleName: string, context: ModuleExecutionContext): Promise<string> {
    const module = this.modules.get(moduleName);
    
    if (!module) {
      throw new ModuleNotFoundError(moduleName);
    }

    if (!this.isModuleActive(moduleName, context.clientConfig)) {
      throw new ModuleNotActiveError(moduleName);
    }

    try {
      this.logger.debug(`Executing module: ${moduleName}`);
      const response = await module.execute(context);
      this.logger.debug(`Module ${moduleName} executed successfully`);
      return response;
    } catch (error) {
      this.logger.error(`Error executing module ${moduleName}:`, error);
      throw error;
    }
  }

  private validateModule(module: ChatbotModule): void {
    if (!module || typeof module.execute !== 'function') {
      throw new Error('Invalid module: must implement execute() method');
    }
  }

  getModuleInfo(moduleName: string): ModuleInfo | null {
    const metadata = this.moduleMetadata.get(moduleName);
    if (!metadata) return null;

    return {
      name: moduleName,
      ...metadata
    };
  }

  getAllModules(): ModuleInfo[] {
    return Array.from(this.moduleMetadata.entries()).map(([name, metadata]) => ({
      name,
      ...metadata
    }));
  }
}
