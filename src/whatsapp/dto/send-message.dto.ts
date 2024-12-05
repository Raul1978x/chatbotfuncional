import { ApiProperty } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({
    description: 'Número de teléfono del destinatario',
    example: '1234567890',
  })
  number: string;

  @ApiProperty({
    description: 'Mensaje a enviar',
    example: '¡Hola! Este es un mensaje de prueba.',
  })
  message: string;
}

export class MessageResponseDto {
  @ApiProperty({
    description: 'Indica si el mensaje se envió correctamente',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Mensaje de éxito o error',
    example: 'Mensaje enviado correctamente',
  })
  message?: string;

  @ApiProperty({
    description: 'Mensaje de error si algo falla',
    example: 'Error al enviar el mensaje',
  })
  error?: string;
}
