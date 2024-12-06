import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener mensaje de bienvenida' })
  @ApiResponse({ 
    status: 200, 
    description: 'Mensaje de bienvenida retornado exitosamente',
    type: String 
  })
  getHello(): string {
    return this.appService.getHello();
  }
}
