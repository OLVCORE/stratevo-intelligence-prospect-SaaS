/**
 * TWILIO VIDEO CALL COMPONENT
 * 
 * Professional video calling powered by Twilio Video API
 * Superior quality and reliability compared to Jitsi
 */

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Video, VideoOff, Mic, MicOff, PhoneOff, Monitor, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { connect, createLocalVideoTrack, createLocalAudioTrack, Room, LocalVideoTrack, LocalAudioTrack, RemoteParticipant } from 'twilio-video';

interface TwilioVideoCallProps {
  roomName: string;
  userName: string;
  onCallEnd?: () => void;
}

export function TwilioVideoCall({ roomName, userName, onCallEnd }: TwilioVideoCallProps) {
  const { toast } = useToast();
  
  const [room, setRoom] = useState<Room | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [participants, setParticipants] = useState<RemoteParticipant[]>([]);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);
  const localVideoTrack = useRef<LocalVideoTrack | null>(null);
  const localAudioTrack = useRef<LocalAudioTrack | null>(null);
  
  useEffect(() => {
    joinRoom();
    
    return () => {
      leaveRoom();
    };
  }, []);
  
  /**
   * Join Twilio Video Room
   */
  const joinRoom = async () => {
    try {
      setIsConnecting(true);
      
      // Get access token from backend
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/twilio-video-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          identity: userName,
          roomName: roomName
        })
      });
      
      if (!response.ok) {
        throw new Error('Falha ao obter token do Twilio');
      }
      
      const { token } = await response.json();
      
      // Create local tracks
      const videoTrack = await createLocalVideoTrack({
        width: 1280,
        height: 720
      });
      
      const audioTrack = await createLocalAudioTrack();
      
      localVideoTrack.current = videoTrack;
      localAudioTrack.current = audioTrack;
      
      // Attach local video
      if (localVideoRef.current && videoTrack) {
        videoTrack.attach(localVideoRef.current);
      }
      
      // Connect to room
      const connectedRoom = await connect(token, {
        name: roomName,
        tracks: [videoTrack, audioTrack],
        audio: true,
        video: { width: 1280, height: 720 },
        networkQuality: {
          local: 3,
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
      
      setRoom(connectedRoom);
      setIsConnecting(false);
      
      toast({
        title: '✅ Conectado à videochamada!',
        description: `Sala: ${connectedRoom.name}`
      });
      
      // Handle participants
      connectedRoom.participants.forEach(attachParticipant);
      
      connectedRoom.on('participantConnected', (participant) => {
        console.log(`👤 ${participant.identity} entrou`);
        attachParticipant(participant);
        toast({
          title: `${participant.identity} entrou na call`,
          duration: 3000
        });
      });
      
      connectedRoom.on('participantDisconnected', (participant) => {
        console.log(`👋 ${participant.identity} saiu`);
        detachParticipant(participant);
      });
      
    } catch (error) {
      console.error('❌ Erro ao conectar:', error);
      setIsConnecting(false);
      toast({
        title: 'Erro ao conectar',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      });
    }
  };
  
  /**
   * Attach participant video/audio
   */
  const attachParticipant = (participant: RemoteParticipant) => {
    setParticipants(prev => [...prev, participant]);
    
    const participantDiv = document.createElement('div');
    participantDiv.id = `participant-${participant.sid}`;
    participantDiv.className = 'relative rounded-lg overflow-hidden bg-gray-900 aspect-video';
    
    // Attach existing tracks
    participant.tracks.forEach((publication) => {
      if (publication.track) {
        participantDiv.appendChild(publication.track.attach());
      }
    });
    
    // Handle future tracks
    participant.on('trackSubscribed', (track) => {
      participantDiv.appendChild(track.attach());
    });
    
    remoteVideoRef.current?.appendChild(participantDiv);
  };
  
  /**
   * Detach participant
   */
  const detachParticipant = (participant: RemoteParticipant) => {
    setParticipants(prev => prev.filter(p => p.sid !== participant.sid));
    
    const participantDiv = document.getElementById(`participant-${participant.sid}`);
    if (participantDiv) {
      participantDiv.remove();
    }
  };
  
  /**
   * Leave room
   */
  const leaveRoom = () => {
    if (room) {
      room.disconnect();
      setRoom(null);
    }
    
    if (localVideoTrack.current) {
      localVideoTrack.current.stop();
      localVideoTrack.current = null;
    }
    
    if (localAudioTrack.current) {
      localAudioTrack.current.stop();
      localAudioTrack.current = null;
    }
    
    if (onCallEnd) {
      onCallEnd();
    }
  };
  
  /**
   * Toggle video
   */
  const toggleVideo = () => {
    if (localVideoTrack.current) {
      if (isVideoEnabled) {
        localVideoTrack.current.disable();
      } else {
        localVideoTrack.current.enable();
      }
      setIsVideoEnabled(!isVideoEnabled);
    }
  };
  
  /**
   * Toggle audio
   */
  const toggleAudio = () => {
    if (localAudioTrack.current) {
      if (isAudioEnabled) {
        localAudioTrack.current.disable();
      } else {
        localAudioTrack.current.enable();
      }
      setIsAudioEnabled(!isAudioEnabled);
    }
  };
  
  return (
    <Card className="bg-gray-900 border-gray-700 p-4">
      <div className="space-y-4">
        {/* Remote Participants */}
        <div 
          ref={remoteVideoRef}
          className="grid grid-cols-2 gap-4 min-h-[400px]"
        >
          {participants.length === 0 && !isConnecting && (
            <div className="col-span-2 flex items-center justify-center bg-gray-800 rounded-lg">
              <p className="text-gray-400">Aguardando outros participantes...</p>
            </div>
          )}
        </div>
        
        {/* Local Video */}
        <div className="relative">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-48 h-32 rounded-lg object-cover bg-gray-800"
          />
          <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-xs text-white">
            Você
          </div>
        </div>
        
        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          <Button
            variant={isVideoEnabled ? 'default' : 'destructive'}
            size="lg"
            onClick={toggleVideo}
            className="rounded-full w-14 h-14"
          >
            {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </Button>
          
          <Button
            variant={isAudioEnabled ? 'default' : 'destructive'}
            size="lg"
            onClick={toggleAudio}
            className="rounded-full w-14 h-14"
          >
            {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </Button>
          
          <Button
            variant="destructive"
            size="lg"
            onClick={leaveRoom}
            className="rounded-full w-14 h-14"
          >
            <PhoneOff className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Status */}
        {isConnecting && (
          <div className="text-center text-gray-400 text-sm">
            Conectando à sala {roomName}...
          </div>
        )}
        
        {room && (
          <div className="text-center text-green-400 text-sm">
            ✅ Conectado | {participants.length} participante(s)
          </div>
        )}
      </div>
    </Card>
  );
}

