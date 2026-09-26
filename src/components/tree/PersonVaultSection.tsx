'use client';

import React, { useState, useRef } from 'react';
import { 
  VaultAttachment, 
  VaultAttachmentType 
} from '@/types/tree';
import { 
  Mic, 
  FileUp, 
  Play, 
  Pause, 
  Trash2, 
  ExternalLink, 
  FileText, 
  Award, 
  Image as ImageIcon, 
  Volume2, 
  Archive, 
  Download,
  Calendar,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AudioRecorder from './AudioRecorder';
import DocumentUploader from './DocumentUploader';

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

  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const handleTogglePlay = (att: VaultAttachment) => {
    if (playingId === att.id) {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
      }
      setPlayingId(null);
    } else {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
      }

      const audio = new Audio(att.url);
      currentAudioRef.current = audio;
      audio.onended = () => setPlayingId(null);
      audio.onerror = () => {
        alert('Could not play audio attachment.');
        setPlayingId(null);
      };
      audio.play();
      setPlayingId(att.id);
    }
  };

  const handleDownload = (att: VaultAttachment) => {
    const a = document.createElement('a');
    a.href = att.url;
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
                      {isAudio && att.durationSeconds && (
                        <span>Duration: {formatDuration(att.durationSeconds)}</span>
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
