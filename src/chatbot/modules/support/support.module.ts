import { Injectable, Logger } from '@nestjs/common';
import { ChatbotModule, ModuleExecutionContext } from '../interfaces/chatbot-module.interface';

interface ResponseMap {
  [key: string]: string;
}

interface LanguageResponses {
  [key: string]: ResponseMap;
}

@Injectable()
export class SupportModule implements ChatbotModule {
  private readonly logger = new Logger(SupportModule.name);
  private readonly responses: LanguageResponses = {
    es: {
      ayuda: '¿En qué puedo ayudarte? Puedes preguntarme sobre:\n' +
            '1. 📦 Productos\n' +
            '2. 🛠️ Servicios\n' +
            '3. 🕒 Horarios\n' +
            '4. 📞 Contacto\n' +
            '5. 📋 Estado de pedido',
      productos: '🛍️ Nuestros productos principales son:\n' +
                '1. Producto A - $100\n' +
                '2. Producto B - $200\n' +
                '3. Producto C - $300\n\n' +
                'Para más detalles sobre un producto específico, escribe su nombre.',
      servicios: '🔧 Ofrecemos los siguientes servicios:\n' +
                '1. Servicio de instalación\n' +
                '2. Mantenimiento preventivo\n' +
                '3. Soporte técnico\n' +
                '4. Consultoría\n\n' +
                'Para más información sobre un servicio, escribe su nombre.',
      horarios: '🕒 Nuestros horarios de atención son:\n' +
               'Lunes a Viernes: 9:00 AM - 6:00 PM\n' +
               'Sábados: 10:00 AM - 2:00 PM\n' +
               'Domingos: Cerrado',
      contacto: '📞 Puedes contactarnos a través de:\n' +
               'Teléfono: +1234567890\n' +
               'Email: soporte@empresa.com\n' +
               'Dirección: Calle Principal #123',
      default: 'Lo siento, no entiendo tu consulta. Escribe "ayuda" para ver las opciones disponibles.'
    },
    en: {
      help: 'How can I help you? You can ask me about:\n' +
           '1. 📦 Products\n' +
           '2. 🛠️ Services\n' +
           '3. 🕒 Hours\n' +
           '4. 📞 Contact\n' +
           '5. 📋 Order Status',
      products: '🛍️ Our main products are:\n' +
               '1. Product A - $100\n' +
               '2. Product B - $200\n' +
               '3. Product C - $300\n\n' +
               'For more details about a specific product, type its name.',
      services: '🔧 We offer the following services:\n' +
               '1. Installation service\n' +
               '2. Preventive maintenance\n' +
               '3. Technical support\n' +
               '4. Consulting\n\n' +
               'For more information about a service, type its name.',
      hours: '🕒 Our business hours are:\n' +
             'Monday to Friday: 9:00 AM - 6:00 PM\n' +
             'Saturday: 10:00 AM - 2:00 PM\n' +
             'Sunday: Closed',
      contact: '📞 You can contact us through:\n' +
              'Phone: +1234567890\n' +
              'Email: support@company.com\n' +
              'Address: Main Street #123',
      default: 'Sorry, I don\'t understand your query. Type "help" to see available options.'
    }
  };

  public async execute(context: ModuleExecutionContext): Promise<string> {
    try {
      const { text, clientConfig } = context;
      const language = clientConfig.settings.language || 'es';
      const responses = this.responses[language] || this.responses['es'];
      
      // Convertir el texto a minúsculas y eliminar espacios extra
      const normalizedText = text.toLowerCase().trim();
      
      // Buscar una respuesta que coincida con el texto
      const response = responses[normalizedText] || responses['default'];
      
      return response;
    } catch (error) {
      this.logger.error('Error in SupportModule:', error);
      return 'Lo siento, ha ocurrido un error. Por favor, intenta de nuevo más tarde.';
    }
  }
}
