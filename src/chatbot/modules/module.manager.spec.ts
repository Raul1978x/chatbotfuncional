import { Test, TestingModule } from '@nestjs/testing';
import { ModuleManager } from './module.manager';
import { ChatbotModule, ModuleContext } from './chatbot-module.interface';
import { ProcessedMessage } from '../../whatsapp/whatsapp.service';
import { ClientConfig } from '../config/client-config.interface';

describe('ModuleManager', () => {
  let moduleManager: ModuleManager;

  const mockMessage: ProcessedMessage = {
    text: 'test message',
    from: '1234567890@s.whatsapp.net',
    timestamp: Date.now(),
    key: {
      remoteJid: '1234567890@s.whatsapp.net',
      fromMe: false,
      id: '123',
      participant: null,
    },
    message: {
      conversation: 'test message'
    }
  };

  const mockConfig: ClientConfig = {
    clientId: '1234567890',
    settings: {
      language: 'es',
      timezone: 'UTC',
      activeModules: ['test'],
    }
  };

  const mockModuleContext: ModuleContext = {
    message: mockMessage,
    config: mockConfig,
    metadata: {
      messageType: 'text',
      processedAt: Date.now(),
    },
  };

  const testModule: ChatbotModule = {
    name: 'test',
    description: 'Test module',
    requiredConfig: [],
    execute: jest.fn().mockResolvedValue('Test response'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ModuleManager],
    }).compile();

    moduleManager = module.get<ModuleManager>(ModuleManager);
  });

  it('should be defined', () => {
    expect(moduleManager).toBeDefined();
  });

  describe('registerModule', () => {
    it('should register module successfully', () => {
      moduleManager.registerModule(testModule.name, testModule);
      expect(moduleManager['modules'].has(testModule.name)).toBeTruthy();
    });

    it('should not register duplicate module', () => {
      moduleManager.registerModule(testModule.name, testModule);
      try {
        moduleManager.registerModule(testModule.name, testModule);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('executeModule', () => {
    it('should execute module successfully', async () => {
      moduleManager.registerModule(testModule.name, testModule);

      const response = await moduleManager.executeModule(
        testModule.name,
        mockMessage,
        mockConfig
      );

      expect(response).toBe('Test response');
    });

    it('should throw error for non-existent module', async () => {
      await expect(
        moduleManager.executeModule('nonexistent', mockMessage, mockConfig)
      ).rejects.toThrow();
    });

    it('should handle module execution error', async () => {
      moduleManager.registerModule(testModule.name, testModule);
      (testModule.execute as jest.Mock).mockRejectedValueOnce(new Error('Execution error'));

      await expect(
        moduleManager.executeModule(testModule.name, mockMessage, mockConfig)
      ).rejects.toThrow('Execution error');
    });
  });
});
