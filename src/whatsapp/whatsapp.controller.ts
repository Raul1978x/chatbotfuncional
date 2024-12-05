import { Controller, Get, Post, Body, Res } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { SendMessageDto, MessageResponseDto } from './dto/send-message.dto';
import { StatusResponseDto } from './dto/status-response.dto';

@ApiTags('WhatsApp')
@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Get('status')
  @ApiOperation({ summary: 'Obtener estado de la conexión' })
  @ApiResponse({
    status: 200,
    description: 'Estado de la conexión obtenido correctamente',
    type: StatusResponseDto,
  })
  getStatus(): StatusResponseDto {
    return this.whatsappService.getConnectionStatus();
  }

  @Get('qr')
  @ApiOperation({ summary: 'Obtener código QR para iniciar sesión' })
  @ApiResponse({
    status: 200,
    description: 'Imagen del código QR',
    content: {
      'image/png': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Código QR no disponible',
  })
  async getQR(@Res() res: Response) {
    try {
      const qrPath = path.join(process.cwd(), 'qr-code.png');
      
      if (fs.existsSync(qrPath)) {
        return res.sendFile(qrPath);
      } else {
        return res.status(404).json({ 
          message: 'QR no disponible. Por favor inicie sesión primero.' 
        });
      }
    } catch (error) {
      return res.status(500).json({ 
        message: 'Error al obtener el código QR',
        error: error.message 
      });
    }
  }

  @Post('send')
  @ApiOperation({ summary: 'Enviar mensaje de WhatsApp' })
  @ApiBody({ type: SendMessageDto })
  @ApiResponse({
    status: 200,
    description: 'Mensaje enviado correctamente',
    type: MessageResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Error al enviar el mensaje',
    type: MessageResponseDto,
  })
  async sendMessage(@Body() body: SendMessageDto): Promise<MessageResponseDto> {
    return this.whatsappService.sendMessage(body.number, body.message);
  }
}
