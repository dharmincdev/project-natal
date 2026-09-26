'use client';

import React, { useState, useRef } from 'react';
import { 
  FileUp, 
  FileText, 
  Award, 
  Image as ImageIcon, 
  Check, 
  X, 
  UploadCloud,
  FileCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { VaultAttachment, VaultAttachmentType } from '@/types/tree';
import { v4 as uuidv4 } from 'uuid';

type DocumentUploaderProps = {
  personName: string;
  onSaveDocument: (attachment: VaultAttachment) => void;
  onCancel: () => void;
};

export default function DocumentUploader({
  personName,
  onSaveDocument,
  onCancel,
}: DocumentUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [docType, setDocType] = useState<VaultAttachmentType>('certificate');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelected = (selectedFile: File) => {
    setErrorMsg(null);
    // Limit to 5MB for base64 storage
    if (selectedFile.size > 5 * 1024 * 1024) {
      setErrorMsg('File size must be under 5 MB.');
      return;
    }

    setFile(selectedFile);
    if (!title) {
      // Auto-populate clean title from filename
      const baseName = selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setTitle(`${baseName}`);
    }

    // Determine type from filename heuristics
    const lowerName = selectedFile.name.toLowerCase();
    if (lowerName.includes('cert') || lowerName.includes('birth') || lowerName.includes('marriage')) {
      setDocType('certificate');
    } else if (selectedFile.type.startsWith('image/')) {
      setDocType('photo_archive');
    } else {
      setDocType('document');
    }

    // Read as Data URL
    const reader = new FileReader();
    reader.onload = () => {
      setDataUrl(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleSave = () => {
    if (!file && !dataUrl) {
      setErrorMsg('Please select a file to upload.');
      return;
    }

    const attachment: VaultAttachment = {
      id: `att-${uuidv4().substring(0, 8)}`,
      type: docType,
      title: title.trim() || file?.name || 'Historical Document',
      description: description.trim() || undefined,
      url: dataUrl || '',
      fileName: file?.name,
      fileSize: file?.size,
      uploadedAt: new Date().toISOString(),
    };

    onSaveDocument(attachment);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="p-4 rounded-xl border bg-card space-y-4 text-foreground">
      <div className="flex items-center justify-between border-b pb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
            <FileUp className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider">Upload Record or Document</h4>
            <p className="text-[11px] text-muted-foreground">Attach historical certificates, census records, and heirlooms</p>
          </div>
        </div>
      </div>

      {errorMsg && (
        <p className="text-xs text-rose-500 font-medium bg-rose-50 dark:bg-rose-950/30 p-2 rounded-lg border border-rose-200 dark:border-rose-900">
          {errorMsg}
        </p>
      )}

      {/* Drag & Drop Area */}
      {!file ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`p-6 text-center rounded-xl border-2 border-dashed cursor-pointer transition-all ${
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/30'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.txt"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileSelected(e.target.files[0]);
              }
            }}
          />
          <UploadCloud className="w-8 h-8 text-primary mx-auto mb-2 opacity-80" />
          <p className="text-xs font-semibold">Click to choose or drag document here</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Supports PDF, JPG, PNG, WEBP, or TXT (up to 5 MB)
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Selected File Info */}
          <div className="p-3 rounded-xl border bg-muted/40 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <FileCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate">{file.name}</p>
                <p className="text-[11px] text-muted-foreground font-mono">
                  {formatFileSize(file.size)}
                </p>
              </div>
            </div>

            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                setFile(null);
                setDataUrl(null);
              }}
              className="w-7 h-7 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Document Category */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Document Category</Label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setDocType('certificate')}
                className={`p-2 rounded-lg border text-left flex items-center gap-1.5 transition-colors ${
                  docType === 'certificate'
                    ? 'border-primary bg-primary/10 text-primary font-semibold'
                    : 'border-input hover:bg-muted/40 text-muted-foreground'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>Certificate</span>
              </button>
              <button
                type="button"
                onClick={() => setDocType('document')}
                className={`p-2 rounded-lg border text-left flex items-center gap-1.5 transition-colors ${
                  docType === 'document'
                    ? 'border-primary bg-primary/10 text-primary font-semibold'
                    : 'border-input hover:bg-muted/40 text-muted-foreground'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Record</span>
              </button>
              <button
                type="button"
                onClick={() => setDocType('photo_archive')}
                className={`p-2 rounded-lg border text-left flex items-center gap-1.5 transition-colors ${
                  docType === 'photo_archive'
                    ? 'border-primary bg-primary/10 text-primary font-semibold'
                    : 'border-input hover:bg-muted/40 text-muted-foreground'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Photo</span>
              </button>
            </div>
          </div>

          {/* Title & Notes */}
          <div className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="doc-title" className="text-xs font-semibold">
                Document Title
              </Label>
              <Input
                id="doc-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. 1945 Birth Certificate, Marriage License, Military Discharge"
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="doc-desc" className="text-xs font-semibold text-muted-foreground">
                Notes & Historical Context (Optional)
              </Label>
              <Input
                id="doc-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Issued by Cook County Records Office, original kept in family safe"
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* Action buttons */}
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
              <span>Save to Vault</span>
            </Button>
          </div>
        </div>
      )}

      {!file && (
        <div className="flex justify-end pt-1">
          <Button size="sm" variant="ghost" onClick={onCancel} className="text-xs h-7">
            Close
          </Button>
        </div>
      )}
    </div>
  );
}
