import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume2, Download, FileText } from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface CallRecordingPlayerProps {
  recordingUrl: string;
  transcription?: string;
  duration?: number;
}

export const CallRecordingPlayer = ({ 
  recordingUrl, 
  transcription,
  duration 
}: CallRecordingPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration || 0);
  const [volume, setVolume] = useState(1);
  const [showTranscription, setShowTranscription] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setAudioDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("durationchange", updateDuration);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("durationchange", updateDuration);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const handleVolumeChange = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = value[0];
    setVolume(value[0]);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleDownload = () => {
    window.open(`${recordingUrl}.mp3`, "_blank");
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <audio ref={audioRef} src={`${recordingUrl}.mp3`} preload="metadata" />
        
        <div className="space-y-4">
          {/* Player Controls */}
          <div className="flex items-center gap-4">
            <Button
              size="icon"
              variant="outline"
              onClick={togglePlay}
              className="h-10 w-10 rounded-full"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4 ml-0.5" />
              )}
            </Button>

            <div className="flex-1 space-y-2">
              <Slider
                value={[currentTime]}
                max={audioDuration}
                step={0.1}
                onValueChange={handleSeek}
                className="cursor-pointer"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(audioDuration)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 w-32">
              <Volume2 className="h-4 w-4 text-muted-foreground" />
              <Slider
                value={[volume]}
                max={1}
                step={0.01}
                onValueChange={handleVolumeChange}
                className="cursor-pointer"
              />
            </div>

            <Button
              size="icon"
              variant="outline"
              onClick={handleDownload}
              title="Download gravação"
            >
              <Download className="h-4 w-4" />
            </Button>

            {transcription && (
              <Button
                size="icon"
                variant={showTranscription ? "default" : "outline"}
                onClick={() => setShowTranscription(!showTranscription)}
                title="Ver transcrição"
              >
                <FileText className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Transcription */}
          {showTranscription && transcription && (
            <div className="border rounded-lg p-4 bg-muted/30">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Transcrição da Chamada
              </h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {transcription}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
