import { Controller, Get, Post, Body, Res, Query } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { SendMessageDto, MessageResponseDto } from './dto/send-message.dto';
import { StatusResponseDto } from './dto/status-response.dto';

@ApiTags('WhatsApp')
@Controller('api/whatsapp')
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
  @ApiOperation({ summary: 'Obtener código QR de WhatsApp' })
  @ApiResponse({ status: 200, description: 'Código QR generado' })
  @ApiResponse({ status: 404, description: 'Código QR no disponible' })
  async getQR(@Res() res: Response, @Query('force') force?: boolean) {
    try {
      // Si se solicita forzar regeneración
      if (force) {
        await this.whatsappService.forceQRRegeneration();
      }

      const qrPath = path.join(process.cwd(), 'qr-code.png');
      
      // Verificar si el archivo existe localmente
      if (fs.existsSync(qrPath)) {
        const qrBuffer = fs.readFileSync(qrPath);
        const base64QR = qrBuffer.toString('base64');
        return res.json({ 
          qr: `data:image/png;base64,${base64QR}`,
          source: 'file'
        });
      }

      // Intentar obtener el QR del servicio
      const qr = await this.whatsappService.getCurrentQR();
      
      if (qr) {
        return res.json({ 
          qr, 
          source: 'service',
          connectionStatus: this.whatsappService.getConnectionStatus()
        });
      }

      // Si no hay QR disponible, intentar regenerar
      await this.whatsappService.forceQRRegeneration();

      // Último intento de obtener QR
      const fallbackQR = await this.whatsappService.getCurrentQR();
      if (fallbackQR) {
        return res.json({ 
          qr: fallbackQR, 
          source: 'fallback',
          connectionStatus: this.whatsappService.getConnectionStatus()
        });
      }

      // Si aún no hay QR
      return res.status(404).json({ 
        message: 'QR no disponible. No se pudo generar un código QR.',
        connectionStatus: this.whatsappService.getConnectionStatus()
      });
    } catch (error) {
      console.error('Error en la generación de QR:', error);
      return res.status(500).json({ 
        message: 'Error crítico al obtener el código QR',
        error: error.message,
        connectionStatus: this.whatsappService.getConnectionStatus()
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
