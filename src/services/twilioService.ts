/**
 * TWILIO SERVICE - Unified Twilio Integration
 * 
 * Handles:
 * 1. Video Calls (Twilio Video API)
 * 2. WhatsApp Messaging (Twilio WhatsApp API)
 * 3. SMS (Twilio SMS API)
 */

import { Client } from 'twilio';
import { connect, createLocalTracks, Room } from 'twilio-video';

// Types
export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  apiKeySid: string;
  apiKeySecret: string;
  whatsappNumber: string;
}

export interface VideoRoomConfig {
  roomName: string;
  userName: string;
  audio?: boolean;
  video?: boolean;
}

export interface WhatsAppMessage {
  to: string; // Formato: +5511999999999
  body: string;
  mediaUrl?: string;
}

/**
 * Twilio Service Class
 */
export class TwilioService {
  private config: TwilioConfig;
  private client: Client | null = null;
  private currentRoom: Room | null = null;
  
  constructor() {
    this.config = {
      accountSid: import.meta.env.VITE_TWILIO_ACCOUNT_SID || '',
      authToken: import.meta.env.VITE_TWILIO_AUTH_TOKEN || '',
      apiKeySid: import.meta.env.VITE_TWILIO_API_KEY_SID || '',
      apiKeySecret: import.meta.env.VITE_TWILIO_API_KEY_SECRET || '',
      whatsappNumber: import.meta.env.VITE_TWILIO_WHATSAPP_NUMBER || '',
    };
    
    // Initialize Twilio client (server-side only - para WhatsApp/SMS)
    if (this.config.accountSid && this.config.authToken) {
      try {
        this.client = new Client(this.config.accountSid, this.config.authToken);
      } catch (error) {
        console.warn('⚠️ Twilio client não pôde ser inicializado (ok para Video):', error);
      }
    }
  }
  
  /**
   * Validate configuration
   */
  isConfigured(): boolean {
    return !!(
      this.config.accountSid &&
      this.config.authToken &&
      this.config.apiKeySid &&
      this.config.apiKeySecret
    );
  }
  
  /**
   * Get access token for Video Room
   */
  async getVideoAccessToken(identity: string, roomName: string): Promise<string> {
    // In production, this should call your backend
    // For now, we'll use the frontend approach (less secure but works)
    
    if (!this.isConfigured()) {
      throw new Error('Twilio não está configurado. Verifique as variáveis de ambiente.');
    }
    
    // Call backend Edge Function to generate token
    const response = await fetch('/api/twilio/video-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identity, roomName })
    });
    
    if (!response.ok) {
      throw new Error('Falha ao obter token do Twilio');
    }
    
    const { token } = await response.json();
    return token;
  }
  
  /**
   * Join Video Room
   */
  async joinVideoRoom(config: VideoRoomConfig): Promise<Room> {
    try {
      console.log('📹 Conectando à sala de vídeo...', config.roomName);
      
      // Get access token
      const token = await this.getVideoAccessToken(config.userName, config.roomName);
      
      // Create local tracks (audio + video)
      const localTracks = await createLocalTracks({
        audio: config.audio !== false,
        video: config.video !== false ? { width: 1280, height: 720 } : false
      });
      
      // Connect to room
      const room = await connect(token, {
        name: config.roomName,
        tracks: localTracks,
        audio: config.audio !== false,
        video: config.video !== false,
        networkQuality: {
          local: 3, // 1-3, higher = more detailed
          remote: 1
        },
        bandwidthProfile: {
          video: {
            mode: 'collaboration',
            maxSubscriptionBitrate: 2500000,
          }
        },
        preferredVideoCodecs: ['VP8', 'H264'],
      });
      
      this.currentRoom = room;
      
      console.log('✅ Conectado à sala:', room.name);
      
      // Setup event listeners
      this.setupRoomListeners(room);
      
      return room;
      
    } catch (error) {
      console.error('❌ Erro ao conectar:', error);
      throw error;
    }
  }
  
  /**
   * Setup room event listeners
   */
  private setupRoomListeners(room: Room) {
    // Participant connected
    room.on('participantConnected', (participant) => {
      console.log(`👤 Participante conectado: ${participant.identity}`);
    });
    
    // Participant disconnected
    room.on('participantDisconnected', (participant) => {
      console.log(`👋 Participante saiu: ${participant.identity}`);
    });
    
    // Room disconnected
    room.on('disconnected', (room) => {
      console.log('📴 Desconectado da sala');
      room.localParticipant.tracks.forEach((publication) => {
        const track = publication.track;
        if (track) {
          track.stop();
        }
      });
    });
  }
  
  /**
   * Leave Video Room
   */
  leaveVideoRoom() {
    if (this.currentRoom) {
      this.currentRoom.disconnect();
      this.currentRoom = null;
      console.log('✅ Saiu da sala de vídeo');
    }
  }
  
  /**
   * Send WhatsApp Message
   */
  async sendWhatsAppMessage(message: WhatsAppMessage): Promise<any> {
    if (!this.client) {
      throw new Error('Twilio client não inicializado');
    }
    
    if (!this.config.whatsappNumber) {
      throw new Error('Número WhatsApp Twilio não configurado');
    }
    
    try {
      console.log('📱 Enviando WhatsApp para:', message.to);
      
      const twilioMessage = await this.client.messages.create({
        from: this.config.whatsappNumber,
        to: `whatsapp:${message.to}`,
        body: message.body,
        ...(message.mediaUrl && { mediaUrl: [message.mediaUrl] })
      });
      
      console.log('✅ WhatsApp enviado:', twilioMessage.sid);
      
      return {
        sid: twilioMessage.sid,
        status: twilioMessage.status,
        dateSent: twilioMessage.dateCreated
      };
      
    } catch (error) {
      console.error('❌ Erro ao enviar WhatsApp:', error);
      throw error;
    }
  }
  
  /**
   * Send SMS
   */
  async sendSMS(to: string, body: string): Promise<any> {
    if (!this.client) {
      throw new Error('Twilio client não inicializado');
    }
    
    try {
      const message = await this.client.messages.create({
        from: this.config.whatsappNumber.replace('whatsapp:', ''),
        to: to,
        body: body
      });
      
      return {
        sid: message.sid,
        status: message.status
      };
      
    } catch (error) {
      console.error('❌ Erro ao enviar SMS:', error);
      throw error;
    }
  }
}

/**
 * Singleton instance
 */
export const twilioService = new TwilioService();

/**
 * Helper: Check if Twilio is configured
 */
export function isTwilioConfigured(): boolean {
  return twilioService.isConfigured();
}

