'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic, 
  Square, 
  Play, 
  Pause, 
  RotateCcw, 
  Check, 
  Volume2, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { VaultAttachment } from '@/types/tree';
import { v4 as uuidv4 } from 'uuid';

type AudioRecorderProps = {
  personName: string;
  onSaveAudio: (attachment: VaultAttachment) => void;
  onCancel: () => void;
};

export default function AudioRecorder({
  personName,
  onSaveAudio,
  onCancel,
}: AudioRecorderProps) {
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'recorded'>('idle');
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [title, setTitle] = useState(`Voice Memory of ${personName}`);
  const [description, setDescription] = useState('');
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (audioUrl && audioUrl.startsWith('blob:')) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    setPermissionError(null);
    audioChunksRef.current = [];
    setTimerSeconds(0);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone access is not supported in this browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Url = reader.result as string;
          setAudioUrl(base64Url);
          setRecordingState('recorded');
        };

        // Stop all tracks to turn off mic indicator
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setRecordingState('recording');

      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.warn('Microphone error, falling back to simulated mode:', err);
      setPermissionError(
        'Microphone unavailable or blocked. You can still test with a simulated voice memory below.'
      );
    }
  };

  const handleSimulateRecording = () => {
    setRecordingState('recording');
    setTimerSeconds(0);
    timerIntervalRef.current = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev >= 6) {
          stopRecordingSimulated();
          return 6;
        }
        return prev + 1;
      });
    }, 500);
  };

  const stopRecordingSimulated = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    // Synthetic audio beep data URL
    const syntheticAudioUrl =
      'data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YRAAAACAgICAgICAgICAgICAgICA';
    setAudioUrl(syntheticAudioUrl);
    setRecordingState('recorded');
    setTimerSeconds(15);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.stop();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    } else {
      stopRecordingSimulated();
    }
  };

  const resetRecording = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setRecordingState('idle');
    setTimerSeconds(0);
    setAudioUrl(null);
    setIsPlaying(false);
  };

  const togglePlayback = () => {
    if (!audioElementRef.current && audioUrl) {
      const audio = new Audio(audioUrl);
      audioElementRef.current = audio;
      audio.onended = () => setIsPlaying(false);
      audio.play();
      setIsPlaying(true);
    } else if (audioElementRef.current) {
      if (isPlaying) {
        audioElementRef.current.pause();
        setIsPlaying(false);
      } else {
        audioElementRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleSave = () => {
    if (!audioUrl) return;

    const attachment: VaultAttachment = {
      id: `att-${uuidv4().substring(0, 8)}`,
      type: 'audio',
      title: title.trim() || `Voice Memory (${formatTime(timerSeconds)})`,
      description: description.trim() || undefined,
      url: audioUrl,
      durationSeconds: timerSeconds || 12,
      recordedAt: new Date().toISOString(),
      uploadedAt: new Date().toISOString(),
    };

    onSaveAudio(attachment);
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-4 rounded-xl border bg-card space-y-4 text-foreground">
      <div className="flex items-center justify-between border-b pb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider">Record Oral History</h4>
            <p className="text-[11px] text-muted-foreground">Capture stories, voices, and laughter directly</p>
          </div>
        </div>
      </div>

      {permissionError && (
        <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p>{permissionError}</p>
            {recordingState === 'idle' && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleSimulateRecording}
                className="h-6 text-[10px] bg-background text-amber-900 dark:text-amber-200 mt-1"
              >
                Use Simulated Audio Recording
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Recording Stage */}
      {recordingState === 'idle' && !permissionError && (
        <div className="p-6 text-center space-y-3 bg-muted/20 rounded-xl border border-dashed">
          <div className="w-12 h-12 rounded-full bg-rose-500 text-white mx-auto flex items-center justify-center shadow-md">
            <Mic className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold">Ready to Record Voice Story</p>
            <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
              Preserve your loved one's voice, accent, and storytelling for future generations.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-1">
            <Button
              size="sm"
              onClick={startRecording}
              className="h-8 text-xs font-semibold gap-1.5 bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Start Recording</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleSimulateRecording}
              className="h-8 text-xs font-normal"
            >
              Simulate Voice
            </Button>
          </div>
        </div>
      )}

      {recordingState === 'recording' && (
        <div className="p-5 text-center space-y-3 bg-rose-500/5 rounded-xl border border-rose-500/30">
          <div className="flex items-center justify-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-600 animate-ping" />
            <span className="text-xs font-bold text-rose-600 uppercase tracking-widest">
              Live Recording
            </span>
          </div>

          <div className="text-3xl font-mono font-bold tracking-tight text-foreground">
            {formatTime(timerSeconds)}
          </div>

          {/* Sound wave visualizer animation */}
          <div className="flex items-center justify-center gap-1 h-8">
            {[40, 75, 100, 60, 90, 45, 80, 65, 95, 50, 70, 85].map((h, i) => (
              <div
                key={i}
                className="w-1 bg-rose-500 rounded-full animate-pulse"
                style={{
                  height: `${h}%`,
                  animationDelay: `${(i * 0.1).toFixed(1)}s`,
                  animationDuration: '0.8s',
                }}
              />
            ))}
          </div>

          <Button
            size="sm"
            onClick={stopRecording}
            className="h-8 text-xs font-semibold gap-1.5 bg-foreground text-background shadow-xs hover:bg-foreground/90"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Stop & Review</span>
          </Button>
        </div>
      )}

      {recordingState === 'recorded' && (
        <div className="space-y-3">
          {/* Audio Preview Card */}
          <div className="p-3 rounded-xl border bg-muted/40 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Button
                size="icon"
                variant="outline"
                onClick={togglePlayback}
                className="w-8 h-8 rounded-full bg-background shrink-0"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
              </Button>
              <div>
                <p className="text-xs font-semibold flex items-center gap-1">
                  <Volume2 className="w-3.5 h-3.5 text-primary" />
                  Recorded Audio Clip
                </p>
                <p className="text-[11px] text-muted-foreground font-mono">
                  Length: {formatTime(timerSeconds)}
                </p>
              </div>
            </div>

            <Button
              size="sm"
              variant="ghost"
              onClick={resetRecording}
              className="text-xs h-7 text-muted-foreground hover:text-foreground gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Re-record</span>
            </Button>
          </div>

          {/* Form details */}
          <div className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="audio-title" className="text-xs font-semibold">
                Memory Title
              </Label>
              <Input
                id="audio-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Grandma's Childhood in Ireland"
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="audio-desc" className="text-xs font-semibold text-muted-foreground">
                Notes / Context (Optional)
              </Label>
              <Input
                id="audio-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Who was present, location, or prompt..."
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-1 border-t">
            <Button size="sm" variant="outline" onClick={onCancel} className="text-xs h-8">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              className="text-xs h-8 font-semibold gap-1 bg-primary text-primary-foreground"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Voice Memory</span>
            </Button>
          </div>
        </div>
      )}

      {recordingState === 'idle' && (
        <div className="flex justify-end pt-1">
          <Button size="sm" variant="ghost" onClick={onCancel} className="text-xs h-7">
            Close
          </Button>
        </div>
      )}
    </div>
  );
}
