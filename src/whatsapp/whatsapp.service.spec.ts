import { Test, TestingModule } from '@nestjs/testing';
import { WhatsappService } from './whatsapp.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { WASocket, BaileysEventEmitter } from '@whiskeysockets/baileys';
import { proto } from '@whiskeysockets/baileys/WAProto';
import { ChatbotController } from '../chatbot/chatbot.controller';

jest.mock('@whiskeysockets/baileys');
jest.mock('../chatbot/chatbot.controller');

describe('WhatsappService', () => {
  let service: WhatsappService;
  let eventEmitter: EventEmitter2;
  let mockSocket: jest.Mocked<Partial<WASocket>>;
  let chatbotController: jest.Mocked<ChatbotController>;

  const mockMessage = {
    key: {
      remoteJid: '1234567890@s.whatsapp.net',
      fromMe: false,
      id: '123',
      participant: null,
    } as proto.IMessageKey,
    message: {
      conversation: 'test message',
    },
    messageTimestamp: Date.now(),
  };

  beforeEach(async () => {
    mockSocket = {
      ev: {
        on: jest.fn(),
        off: jest.fn(),
        removeAllListeners: jest.fn(),
        emit: jest.fn(),
        process: jest.fn(),
        buffer: jest.fn(),
        createBufferedFunction: jest.fn(),
        flush: jest.fn(),
        isBuffering: jest.fn(),
      },
      sendMessage: jest.fn(),
      end: jest.fn(),
    } as unknown as jest.Mocked<Partial<WASocket>>;

    mockSocket.sendMessage.mockResolvedValue({} as proto.WebMessageInfo);
    mockSocket.end.mockImplementation(async () => {});

    jest.spyOn(require('@whiskeysockets/baileys'), 'makeWASocket')
      .mockReturnValue(mockSocket as WASocket);

    chatbotController = {
      handleMessage: jest.fn(),
    } as unknown as jest.Mocked<ChatbotController>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WhatsappService,
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
        {
          provide: ChatbotController,
          useValue: chatbotController,
        },
      ],
    }).compile();

    service = module.get<WhatsappService>(WhatsappService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
    service['socket'] = mockSocket as WASocket;
    service['isConnected'] = true;  // Set connection status
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendMessage', () => {
    it('should send message successfully', async () => {
      const to = '1234567890@s.whatsapp.net';
      const text = 'Hello World';

      await service.sendMessage(to, text);
      expect(mockSocket.sendMessage).toHaveBeenCalledWith(to, { text });
    });

    it('should handle send error', async () => {
      mockSocket.sendMessage.mockRejectedValue(new Error('Send error'));
      
      await expect(
        service.sendMessage('1234567890@s.whatsapp.net', 'test')
      ).rejects.toThrow('Send error');
    });

    it('should throw error when not connected', async () => {
      service['isConnected'] = false;
      
      await expect(
        service.sendMessage('1234567890@s.whatsapp.net', 'test')
      ).rejects.toThrow('WhatsApp is not connected');
    });
  });

  describe('close', () => {
    it('should close connection successfully', async () => {
      await service.close();
      expect(mockSocket.end).toHaveBeenCalled();
    });

    it('should handle close error', async () => {
      const error = new Error('Close error');
      mockSocket.end.mockImplementation(async () => { throw error; });

      await expect(service.close()).rejects.toThrow('Close error');
    });
  });

  describe('onMessage', () => {
    it('should process message successfully', async () => {
      const processedMessage = {
        text: 'test message',
        from: '1234567890@s.whatsapp.net',
        key: mockMessage.key,
      };

      jest.spyOn(service as any, 'processMessage').mockReturnValue(processedMessage);

      const message = service['processMessage'](mockMessage);
      expect(message).toBeDefined();
      expect(message!.text).toBe('test message');
      expect(message!.from).toBe('1234567890@s.whatsapp.net');
      expect(message!.key).toBeDefined();
    });

    it('should handle invalid message format', async () => {
      const invalidMessage = {
        key: {
          remoteJid: 'invalid',
          fromMe: false,
          id: '123',
        } as proto.IMessageKey,
        message: null,
        messageTimestamp: Date.now(),
      };

      const result = service['processMessage'](invalidMessage);
      expect(result).toBeNull();
    });
  });
});
