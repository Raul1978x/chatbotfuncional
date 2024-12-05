import { ApiProperty } from '@nestjs/swagger';

export class StatusResponseDto {
  @ApiProperty({
    description: 'Estado actual de la conexión',
    enum: ['connected', 'connecting', 'disconnected'],
    example: 'connected',
  })
  status: 'connected' | 'connecting' | 'disconnected';

  @ApiProperty({
    description: 'Fecha y hora de la última actualización',
    example: '2024-05-12T10:30:00.000Z',
  })
  timestamp: string;
}
