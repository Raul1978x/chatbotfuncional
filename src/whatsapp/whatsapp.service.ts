import { Injectable, OnModuleInit } from '@nestjs/common';
import { makeWASocket, DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import * as path from 'path';
import * as qrcode from 'qrcode';
import * as fs from 'fs';

@Injectable()
export class WhatsappService implements OnModuleInit {
  private client: any;
  private connectionStatus: 'disconnected' | 'connecting' | 'connected' = 'disconnected';

  async onModuleInit() {
    await this.connectToWhatsApp();
  }

  getConnectionStatus() {
    return {
      status: this.connectionStatus,
      timestamp: new Date().toISOString()
    };
  }

  async sendMessage(number: string, message: string) {
    try {
      if (!this.client || this.connectionStatus !== 'connected') {
        throw new Error('WhatsApp no está conectado');
      }

      // Asegurarse que el número tenga el formato correcto
      const formattedNumber = number.includes('@s.whatsapp.net') 
        ? number 
        : `${number.replace(/[^\d]/g, '')}@s.whatsapp.net`;

      await this.client.sendMessage(formattedNumber, {
        text: message
      });

      return {
        success: true,
        message: 'Mensaje enviado correctamente'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async connectToWhatsApp() {
    try {
      this.connectionStatus = 'connecting';
      const authPath = path.join(process.cwd(), 'auth_info_baileys');
      const { state, saveCreds } = await useMultiFileAuthState(authPath);

      this.client = makeWASocket({
        auth: state,
        printQRInTerminal: true,
      });

      // Manejar eventos de conexión
      this.client.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
        if (qr) {
          console.log('Generando código QR...');
          try {
            const qrPath = path.join(process.cwd(), 'qr-code.png');
            console.log('Ruta del QR:', qrPath);
            
            // Asegurarse de que el archivo anterior sea eliminado si existe
            if (fs.existsSync(qrPath)) {
              fs.unlinkSync(qrPath);
            }
            
            // Generar el nuevo QR
            await qrcode.toFile(qrPath, qr, {
              type: 'png',
              width: 800,
              margin: 1,
              errorCorrectionLevel: 'H'
            });
            
            if (fs.existsSync(qrPath)) {
              console.log('¡Código QR guardado exitosamente en:', qrPath);
            } else {
              console.error('Error: El archivo QR no se creó');
            }
          } catch (err) {
            console.error('Error al guardar el QR:', err);
          }
        }

        if (connection === 'close') {
          this.connectionStatus = 'disconnected';
          const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
          console.log('Conexión cerrada. Reconectando:', shouldReconnect);
          if (shouldReconnect) {
            await this.connectToWhatsApp();
          }
        } else if (connection === 'open') {
          this.connectionStatus = 'connected';
          console.log('¡Conexión establecida!');
        }
      });

      // Guardar credenciales cuando se actualicen
      this.client.ev.on('creds.update', saveCreds);

      // Manejar mensajes entrantes
      this.client.ev.on('messages.upsert', async ({ messages }) => {
        const message = messages[0];
        
        if (!message?.message || message.key.fromMe) return;

        const messageText = message.message.conversation || 
                          message.message.extendedTextMessage?.text || 
                          '';

        const remoteJid = message.key.remoteJid;

        // Procesar comandos
        switch(messageText.toLowerCase()) {
          case 'hola':
            await this.client.sendMessage(remoteJid, {
              text: '👋 ¡Hola! Soy un bot de WhatsApp. ¿En qué puedo ayudarte?'
            });
            break;
          case 'ayuda':
            await this.client.sendMessage(remoteJid, {
              text: `🤖 *Comandos disponibles:*\n\n` +
                   `- *hola*: Saludo inicial\n` +
                   `- *ayuda*: Muestra este mensaje\n` +
                   `- *info*: Información sobre el bot`
            });
            break;
          default:
            await this.client.sendMessage(remoteJid, {
              text: '❓ No entiendo ese comando. Escribe *ayuda* para ver los comandos disponibles.'
            });
        }
      });
    } catch (error) {
      console.error('Error en la conexión:', error);
      this.connectionStatus = 'disconnected';
      throw error;
    }
  }
}
