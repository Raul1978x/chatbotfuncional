import { Test, TestingModule } from '@nestjs/testing';
import { Middleware } from './middleware.service';
import { ProcessedMessage } from '../../whatsapp/whatsapp.service';
import { ClientConfigManager } from '../config/client-config.manager';

describe('Middleware', () => {
  let middleware: Middleware;
  let configManager: ClientConfigManager;

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

  const mockConfig = {
    clientId: '1234567890',
    settings: {
      language: 'es',
      timezone: 'UTC',
      activeModules: ['default'],
    }
  };

  const mockConfigManager = {
    getConfig: jest.fn().mockResolvedValue(mockConfig),
    setConfig: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Middleware,
        {
          provide: ClientConfigManager,
          useValue: mockConfigManager,
        },
      ],
    }).compile();

    middleware = module.get<Middleware>(Middleware);
    configManager = module.get<ClientConfigManager>(ClientConfigManager);
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  describe('interceptRequest', () => {
    it('should process message successfully', async () => {
      const result = await middleware.interceptRequest(mockMessage);

      expect(result).toBeDefined();
      expect(result.config).toEqual(mockConfig);
      expect(result.metadata).toBeDefined();
      expect(result.metadata.messageType).toBe('conversation');
      expect(result.metadata.processedAt).toBeDefined();
    });

    it('should handle invalid phone number', async () => {
      const invalidMessage = {
        ...mockMessage,
        from: 'invalid@s.whatsapp.net',
      };

      await expect(middleware.interceptRequest(invalidMessage)).rejects.toThrow();
    });

    it('should handle missing client config', async () => {
      mockConfigManager.getConfig.mockRejectedValueOnce(new Error('Config not found'));

      await expect(middleware.interceptRequest(mockMessage)).rejects.toThrow();
    });

    it('should handle message without text', async () => {
      const messageWithoutText = {
        ...mockMessage,
        text: '',
        message: {
          imageMessage: {
            caption: 'image caption',
          },
        },
      };

      const result = await middleware.interceptRequest(messageWithoutText);

      expect(result).toBeDefined();
      expect(result.metadata.messageType).toBe('imageMessage');
    });
  });
});
