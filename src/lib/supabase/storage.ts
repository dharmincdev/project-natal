import { v4 as uuidv4 } from 'uuid';
import { getSupabaseBrowserClient } from './client';
import { SEED_AUDIO_DATA_URL } from '@/data/fixtures/smith-family';

export type StorageBucketName = 'vault-audio' | 'vault-docs' | 'avatars';

export type UploadVaultAssetOptions = {
  bucket: StorageBucketName;
  treeId?: string;
  personId?: string;
  file: Blob | File;
  fileName: string;
  contentType?: string;
  fallbackDataUrl?: string;
};

export type UploadVaultAssetResult = {
  url: string;
  storageMode: 'supabase-storage' | 'base64-fallback';
  path?: string;
};

/**
 * Ensures a persisted asset URL is never an ephemeral browser `blob:http...` URL (AGENTS.md §3).
 */
export function assertNotBlobUrl(url: string): string {
  if (!url || url.trim().startsWith('blob:')) {
    throw new Error('EPHEMERAL_BLOB_URL_FORBIDDEN: Never persist browser blob: URLs to database or storage.');
  }
  return url;
}

/**
 * Converts a Blob or File to a Base64 Data URL for offline-first demo fallback.
 */
export async function blobToDataUrl(blob: Blob, fallbackDataUrl = SEED_AUDIO_DATA_URL): Promise<string> {
  if (!blob || blob.size === 0) {
    return fallbackDataUrl;
  }

  if (typeof FileReader !== 'undefined') {
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string' && reader.result.startsWith('data:')) {
          resolve(reader.result);
        } else {
          resolve(fallbackDataUrl);
        }
      };
      reader.onerror = () => resolve(fallbackDataUrl);
      reader.readAsDataURL(blob);
    });
  }

  // Node.js / Vitest environment fallback
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = blob.type || 'application/octet-stream';
    return `data:${mimeType};base64,${base64}`;
  } catch {
    return fallbackDataUrl;
  }
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80) || 'asset';
}

/**
 * Uploads an audio story, historical document, or avatar to Supabase Storage (`vault-audio`,
 * `vault-docs`, `avatars`) when configured and authenticated, with graceful Base64 Data URL
 * fallback for offline/unauthenticated demo mode (PRO-29).
 */
export async function uploadVaultAsset(
  options: UploadVaultAssetOptions
): Promise<UploadVaultAssetResult> {
  const {
    bucket,
    treeId = 'default-tree',
    personId = 'person',
    file,
    fileName,
    contentType,
    fallbackDataUrl = SEED_AUDIO_DATA_URL,
  } = options;

  const client = getSupabaseBrowserClient();
  if (client && file && file.size > 0) {
    try {
      const {
        data: { user },
      } = await client.auth.getUser();

      if (user) {
        const safeName = sanitizeFileName(fileName);
        const objectPath = `${treeId}/${personId}/${uuidv4().slice(0, 8)}-${safeName}`;

        const { error: uploadError } = await client.storage.from(bucket).upload(objectPath, file, {
          contentType: contentType || file.type || 'application/octet-stream',
          upsert: false,
        });

        if (!uploadError) {
          const { data: publicUrlData } = client.storage.from(bucket).getPublicUrl(objectPath);
          if (publicUrlData?.publicUrl) {
            return {
              url: assertNotBlobUrl(publicUrlData.publicUrl),
              storageMode: 'supabase-storage',
              path: objectPath,
            };
          }
        }
      }
    } catch {
      // Fall through to offline-first Base64 Data URL fallback
    }
  }

  const dataUrl = await blobToDataUrl(file, fallbackDataUrl);
  return {
    url: assertNotBlobUrl(dataUrl),
    storageMode: 'base64-fallback',
  };
}

