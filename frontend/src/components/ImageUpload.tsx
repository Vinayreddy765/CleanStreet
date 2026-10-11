import React, { useRef, useState, useCallback } from 'react';
import { Upload, X, RefreshCw, ImageIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_TYPES_LABEL = 'JPEG, PNG, or WebP';
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export type UploadState =
  | { status: 'idle' }
  | { status: 'validating'; file: File }
  | { status: 'uploading'; file: File; progress: number; previewUrl: string }
  | { status: 'done'; file: File; key: string; viewUrl: string; previewUrl: string }
  | { status: 'error'; message: string; file?: File };

interface Props {
  /** Label shown above the drop zone */
  label?: string;
  /** Whether the field is required */
  optional?: boolean;
  /** Called whenever the upload state changes — parent uses this to read the key */
  onChange: (state: UploadState) => void;
  /** Disable the control (e.g. while the form is submitting) */
  disabled?: boolean;
}

export function ImageUpload({ label, optional = true, onChange, disabled = false }: Props) {
  const [state, setState] = useState<UploadState>({ status: 'idle' });
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function update(next: UploadState) {
    setState(next);
    onChange(next);
  }

  function validateFile(file: File): string | null {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `Unsupported file type (${file.type || 'unknown'}). Please use ${ALLOWED_TYPES_LABEL}.`;
    }
    if (file.size > MAX_BYTES) {
      return `File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum size is 5 MB.`;
    }
    return null;
  }

  const handleFile = useCallback(
    async (file: File) => {
      // 1. Client-side validation
      const validationError = validateFile(file);
      if (validationError) {
        update({ status: 'error', message: validationError, file });
        return;
      }

      // 2. Create a local preview URL while we upload
      const previewUrl = URL.createObjectURL(file);
      update({ status: 'validating', file });

      try {
        // 3. Ask the backend for a presigned PUT URL
        const { uploadUrl, key, viewUrl } = await api.getPresignedUploadUrl(
          file.type,
          file.size
        );

        update({ status: 'uploading', file, progress: 0, previewUrl });

        // 4. Upload directly to S3 — no AWS credentials in the browser
        await api.uploadToS3(uploadUrl, file, (pct) => {
          setState((prev) => {
            const next: UploadState =
              prev.status === 'uploading'
                ? { ...prev, progress: pct }
                : prev;
            // Don't call onChange on every progress tick to avoid noise
            return next;
          });
        });

        // 5. Done — store the object key; use viewUrl for the preview
        update({ status: 'done', file, key, viewUrl, previewUrl: viewUrl });
        URL.revokeObjectURL(previewUrl); // free the blob URL now we have a real one
      } catch (err) {
        URL.revokeObjectURL(previewUrl);
        update({
          status: 'error',
          message: err instanceof Error ? err.message : 'Upload failed',
          file,
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  function reset() {
    if (state.status === 'uploading' || state.status === 'done') {
      // Free the preview object URL if it's still a blob
      if ('previewUrl' in state && state.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(state.previewUrl);
      }
    }
    update({ status: 'idle' });
    // Reset the file input so the same file can be re-selected
    if (inputRef.current) inputRef.current.value = '';
  }

  // --- Drag-and-drop handlers ---
  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    if (!disabled) setDragging(true);
  }
  function onDragLeave() { setDragging(false); }
  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }
  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  const isActive = state.status === 'uploading' || state.status === 'validating';
  const isDone = state.status === 'done';
  const isError = state.status === 'error';
  const isIdle = state.status === 'idle';

  return (
    <div>
      {label && (
        <p className="label">
          {label}{' '}
          {optional && <span className="text-gray-400 font-normal">(optional)</span>}
        </p>
      )}

      {/* Preview pane — shown when uploading or done */}
      {(isDone || state.status === 'uploading') && (
        <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
          {'previewUrl' in state && state.previewUrl && (
            <img
              src={state.previewUrl}
              alt="Preview"
              className="w-full max-h-48 object-cover"
            />
          )}

          {/* Uploading overlay */}
          {state.status === 'uploading' && (
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-2">
              <div className="w-3/4 bg-white/30 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-200"
                  style={{ width: `${state.progress}%` }}
                />
              </div>
              <p className="text-white text-xs font-medium">{state.progress}% uploaded</p>
            </div>
          )}

          {/* Done badge + actions */}
          {isDone && (
            <div className="absolute top-2 right-2 flex gap-1.5">
              <span className="flex items-center gap-1 bg-green-600 text-white text-xs font-medium px-2 py-1 rounded-full shadow">
                <CheckCircle2 className="w-3 h-3" /> Uploaded
              </span>
            </div>
          )}

          {/* File name row */}
          <div className="flex items-center justify-between px-3 py-2 bg-white border-t border-gray-100">
            <span className="text-xs text-gray-600 truncate max-w-[200px]">
              {'file' in state ? state.file.name : ''}
            </span>
            <div className="flex gap-2 shrink-0">
              {isDone && (
                <button
                  type="button"
                  onClick={() => { reset(); setTimeout(() => inputRef.current?.click(), 50); }}
                  disabled={disabled}
                  className="text-xs text-brand-600 font-medium hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Replace
                </button>
              )}
              <button
                type="button"
                onClick={reset}
                disabled={disabled || isActive}
                className="text-xs text-gray-500 hover:text-red-600 flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drop zone — shown when idle, validating, or errored */}
      {!isDone && state.status !== 'uploading' && (
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label="Upload image — click or drag and drop"
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => !disabled && inputRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' || e.key === ' ' ? inputRef.current?.click() : undefined}
          className={[
            'flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 transition-colors cursor-pointer',
            dragging
              ? 'border-brand-500 bg-brand-50'
              : isError
              ? 'border-red-300 bg-red-50'
              : 'border-gray-300 bg-gray-50 hover:border-brand-400 hover:bg-brand-50',
            disabled ? 'opacity-50 cursor-not-allowed' : '',
          ].join(' ')}
        >
          {isActive ? (
            <div className="w-6 h-6 border-2 border-brand-300 border-t-brand-600 rounded-full animate-spin" />
          ) : isError ? (
            <AlertCircle className="w-7 h-7 text-red-400" />
          ) : (
            <div className={`p-2 rounded-xl ${dragging ? 'bg-brand-100' : 'bg-gray-100'}`}>
              {isIdle ? (
                <ImageIcon className="w-6 h-6 text-gray-400" />
              ) : (
                <Upload className="w-6 h-6 text-brand-500" />
              )}
            </div>
          )}

          {isActive ? (
            <p className="text-sm text-gray-500">Preparing upload…</p>
          ) : isError ? (
            <div className="text-center">
              <p className="text-sm font-medium text-red-700">{state.message}</p>
              <p className="text-xs text-red-500 mt-0.5">Click or drag to try again</p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-sm text-gray-600">
                <span className="font-medium text-brand-700">Click to upload</span>{' '}
                or drag and drop
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{ALLOWED_TYPES_LABEL} · max 5 MB</p>
            </div>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="sr-only"
        onChange={onInputChange}
        disabled={disabled}
        aria-hidden="true"
      />
    </div>
  );
}

/** Helper: returns the S3 key if the upload is complete, otherwise undefined */
export function getUploadKey(state: UploadState): string | undefined {
  return state.status === 'done' ? state.key : undefined;
}
