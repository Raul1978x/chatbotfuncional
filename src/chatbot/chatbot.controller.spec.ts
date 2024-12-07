import { Test, TestingModule } from '@nestjs/testing';
import { ChatbotController } from './chatbot.controller';
import { Middleware } from './middleware/middleware.service';
import { ModuleManager } from './modules/module.manager';
import { ProcessedMessage } from '../whatsapp/whatsapp.service';
import { ClientConfig } from './config/client-config.interface';

describe('ChatbotController', () => {
  let controller: ChatbotController;
  let middleware: Middleware;
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
      activeModules: ['default'],
    }
  };

  const mockMiddleware = {
    interceptRequest: jest.fn().mockResolvedValue({
      config: mockConfig,
      metadata: {
        messageType: 'text',
        processedAt: Date.now(),
      },
    }),
  };

  const mockModuleManager = {
    executeModule: jest.fn().mockResolvedValue('Response message'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatbotController,
        {
          provide: Middleware,
          useValue: mockMiddleware,
        },
        {
          provide: ModuleManager,
          useValue: mockModuleManager,
        },
      ],
    }).compile();

    controller = module.get<ChatbotController>(ChatbotController);
    middleware = module.get<Middleware>(Middleware);
    moduleManager = module.get<ModuleManager>(ModuleManager);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('receiveMessage', () => {
    it('should process message successfully', async () => {
      const response = await controller.receiveMessage(mockMessage);

      expect(middleware.interceptRequest).toHaveBeenCalledWith(mockMessage);
      expect(moduleManager.executeModule).toHaveBeenCalledWith(
        'default',
        mockMessage,
        mockConfig
      );
      expect(response).toBe('Response message');
    });

    it('should handle middleware error', async () => {
      mockMiddleware.interceptRequest.mockRejectedValueOnce(
        new Error('Middleware error')
      );

      await expect(controller.receiveMessage(mockMessage)).rejects.toThrow(
        'Middleware error'
      );
    });

    it('should handle module execution error', async () => {
      mockModuleManager.executeModule.mockRejectedValueOnce(
        new Error('Module error')
      );

      await expect(controller.receiveMessage(mockMessage)).rejects.toThrow(
        'Module error'
      );
    });
  });
});
