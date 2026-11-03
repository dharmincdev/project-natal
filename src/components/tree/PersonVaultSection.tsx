'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  VaultAttachment,
  VaultAttachmentType,
} from '@/types/tree';
import {
  LEGACY_SILENT_WAV_DATA_URL,
  SEED_AUDIO_DATA_URL,
} from '@/data/fixtures/smith-family';
import {
  Mic,
  FileUp,
  Play,
  Pause,
  Trash2,
  FileText,
  Award,
  Image as ImageIcon,
  Volume2,
  Archive,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AudioRecorder from './AudioRecorder';
import DocumentUploader from './DocumentUploader';

export function resolvePlayableAudioUrl(url: string): string {
  if (!url || url.trim() === '' || url === LEGACY_SILENT_WAV_DATA_URL) {
    return SEED_AUDIO_DATA_URL;
  }
  return url;
}

type PersonVaultSectionProps = {
  personName: string;
  attachments: VaultAttachment[];
  onAddAttachment: (attachment: VaultAttachment) => void;
  onRemoveAttachment: (attachmentId: string) => void;
  isEditable: boolean;
};

export default function PersonVaultSection({
  personName,
  attachments = [],
  onAddAttachment,
  onRemoveAttachment,
  isEditable,
}: PersonVaultSectionProps) {
  const [activeMode, setActiveMode] = useState<'none' | 'audio' | 'document'>('none');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [playbackProgress, setPlaybackProgress] = useState<number>(0);
  const [loadedDurations, setLoadedDurations] = useState<Record<string, number>>({});

  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const activeAttachmentIdRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
    };
  }, []);

  const handleTogglePlay = (att: VaultAttachment) => {
    // Pause if currently playing this attachment
    if (playingId === att.id) {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
      }
      setPlayingId(null);
      return;
    }

    // Resume if same attachment was paused mid-stream
    if (
      activeAttachmentIdRef.current === att.id &&
      currentAudioRef.current &&
      currentAudioRef.current.currentTime > 0 &&
      !currentAudioRef.current.ended
    ) {
      currentAudioRef.current
        .play()
        .then(() => {
          setPlayingId(att.id);
        })
        .catch(() => {
          setPlayingId(null);
        });
      return;
    }

    // Stop any previous audio instance
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }

    const playableUrl = resolvePlayableAudioUrl(att.url);
    const audio = new Audio(playableUrl);
    audio.preload = 'auto';
    currentAudioRef.current = audio;
    activeAttachmentIdRef.current = att.id;
    setCurrentTime(0);
    setPlaybackProgress(0);

    audio.onloadedmetadata = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setLoadedDurations((prev) => ({
          ...prev,
          [att.id]: Math.max(1, Math.round(audio.duration)),
        }));
      }
    };

    audio.ontimeupdate = () => {
      const cur = audio.currentTime || 0;
      const total =
        Number.isFinite(audio.duration) && audio.duration > 0
          ? audio.duration
          : att.durationSeconds || 4;
      setCurrentTime(cur);
      setPlaybackProgress(Math.min(100, Math.round((cur / total) * 100)));
    };

    audio.onended = () => {
      setPlayingId(null);
      setCurrentTime(0);
      setPlaybackProgress(0);
      activeAttachmentIdRef.current = null;
    };

    let retriedWithFallback = false;
    audio.onerror = () => {
      if (!retriedWithFallback && audio.src !== SEED_AUDIO_DATA_URL) {
        retriedWithFallback = true;
        audio.src = SEED_AUDIO_DATA_URL;
        audio
          .play()
          .then(() => setPlayingId(att.id))
          .catch(() => {
            setPlayingId(null);
            activeAttachmentIdRef.current = null;
          });
        return;
      }
      setPlayingId(null);
      activeAttachmentIdRef.current = null;
    };

    audio
      .play()
      .then(() => {
        setPlayingId(att.id);
      })
      .catch(() => {
        if (!retriedWithFallback && audio.src !== SEED_AUDIO_DATA_URL) {
          retriedWithFallback = true;
          audio.src = SEED_AUDIO_DATA_URL;
          audio
            .play()
            .then(() => setPlayingId(att.id))
            .catch(() => setPlayingId(null));
        } else {
          setPlayingId(null);
        }
      });
  };

  const handleDownload = (att: VaultAttachment) => {
    const a = document.createElement('a');
    a.href = att.type === 'audio' ? resolvePlayableAudioUrl(att.url) : att.url;
    a.download = att.fileName || `${att.title.toLowerCase().replace(/\s+/g, '_')}`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const getAttachmentIcon = (type: VaultAttachmentType) => {
    switch (type) {
      case 'audio':
        return <Volume2 className="w-4 h-4 text-rose-500" />;
      case 'certificate':
        return <Award className="w-4 h-4 text-amber-500" />;
      case 'photo_archive':
        return <ImageIcon className="w-4 h-4 text-purple-500" />;
      case 'document':
      default:
        return <FileText className="w-4 h-4 text-blue-500" />;
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4 border-t pt-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Archive className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground/80">
            Memories & Document Vault
          </h3>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-semibold">
            {attachments.length}
          </Badge>
        </div>

        {isEditable && activeMode === 'none' && (
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveMode('audio')}
              className="h-7 text-xs px-2 gap-1 text-rose-600 border-rose-200 dark:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              title="Record Voice Story"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Record</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveMode('document')}
              className="h-7 text-xs px-2 gap-1 text-blue-600 border-blue-200 dark:border-blue-900 hover:bg-blue-50 dark:hover:bg-blue-950/40"
              title="Upload Document or Certificate"
            >
              <FileUp className="w-3.5 h-3.5" />
              <span>Upload</span>
            </Button>
          </div>
        )}
      </div>

      {/* Embedded Modes */}
      {activeMode === 'audio' && (
        <AudioRecorder
          personName={personName}
          onSaveAudio={(newAtt) => {
            onAddAttachment(newAtt);
            setActiveMode('none');
          }}
          onCancel={() => setActiveMode('none')}
        />
      )}

      {activeMode === 'document' && (
        <DocumentUploader
          personName={personName}
          onSaveDocument={(newAtt) => {
            onAddAttachment(newAtt);
            setActiveMode('none');
          }}
          onCancel={() => setActiveMode('none')}
        />
      )}

      {/* Attachments List */}
      {attachments.length > 0 ? (
        <div className="space-y-2.5">
          {attachments.map((att) => {
            const isAudio = att.type === 'audio';
            const isPlaying = playingId === att.id;

            return (
              <div
                key={att.id}
                className="p-3 rounded-xl border bg-card/70 hover:bg-card transition-all flex items-start justify-between gap-3 shadow-2xs"
              >
                <div className="flex items-start gap-3 min-w-0">
                  {/* Action Icon / Play Button */}
                  {isAudio ? (
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => handleTogglePlay(att)}
                      className={`w-9 h-9 rounded-full shrink-0 transition-colors ${
                        isPlaying
                          ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                          : 'bg-background hover:bg-rose-50 hover:text-rose-600'
                      }`}
                      title={isPlaying ? 'Pause audio' : 'Play voice memory'}
                    >
                      {isPlaying ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4 ml-0.5" />
                      )}
                    </Button>
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-muted/60 border flex items-center justify-center shrink-0">
                      {getAttachmentIcon(att.type)}
                    </div>
                  )}

                  {/* Title & Metadata */}
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {att.title}
                      </p>
                      <Badge
                        variant="outline"
                        className="text-[9px] px-1 py-0 uppercase font-bold tracking-wider capitalize text-muted-foreground"
                      >
                        {att.type.replace('_', ' ')}
                      </Badge>
                    </div>

                    {att.description && (
                      <p className="text-[11px] text-muted-foreground line-clamp-1 leading-snug">
                        {att.description}
                      </p>
                    )}

                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground pt-0.5">
                      {isAudio && (att.durationSeconds || loadedDurations[att.id]) && (
                        <span>
                          Duration: {formatDuration(att.durationSeconds || loadedDurations[att.id])}
                        </span>
                      )}
                      {isPlaying && (
                        <span className="inline-flex items-center gap-1 text-rose-500 font-medium">
                          <span className="inline-flex items-end gap-0.5 h-2.5" aria-hidden="true">
                            <span className="w-0.5 h-1.5 bg-rose-500 animate-pulse rounded-full" />
                            <span className="w-0.5 h-2.5 bg-rose-500 animate-pulse rounded-full" />
                            <span className="w-0.5 h-1 bg-rose-500 animate-pulse rounded-full" />
                          </span>
                          <span>Playing ({formatDuration(Math.max(1, Math.floor(currentTime)) || 1)})</span>
                        </span>
                      )}
                      {att.fileName && <span>{att.fileName}</span>}
                      {att.recordedAt && (
                        <span>
                          {new Date(att.recordedAt).toLocaleDateString(undefined, {
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      )}
                    </div>

                    {isAudio && isPlaying && (
                      <div
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={playbackProgress}
                        className="w-full h-1 bg-muted rounded-full overflow-hidden mt-1.5"
                      >
                        <div
                          className="h-full bg-rose-500 transition-all duration-150"
                          style={{ width: `${Math.max(8, playbackProgress)}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDownload(att)}
                    className="w-7 h-7 text-muted-foreground hover:text-primary"
                    title="Open / Download attachment"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </Button>

                  {isEditable && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        if (confirm(`Delete "${att.title}"?`)) {
                          if (playingId === att.id && currentAudioRef.current) {
                            currentAudioRef.current.pause();
                            setPlayingId(null);
                          }
                          onRemoveAttachment(att.id);
                        }
                      }}
                      className="w-7 h-7 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      title="Remove attachment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        activeMode === 'none' && (
          <div className="p-4 rounded-xl border border-dashed text-center text-xs text-muted-foreground space-y-1 bg-muted/10">
            <Archive className="w-5 h-5 mx-auto text-muted-foreground/60 mb-1" />
            <p className="font-medium">Vault is currently empty</p>
            <p className="text-[11px]">
              {isEditable
                ? 'Record a voice story or upload birth/marriage certificates above.'
                : 'No audio stories or documents uploaded yet.'}
            </p>
          </div>
        )
      )}
    </div>
  );
}
