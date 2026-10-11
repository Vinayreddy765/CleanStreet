import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, Send } from 'lucide-react';
import { api } from '../lib/api';
import { WasteCategory, Severity, CATEGORY_LABELS, SEVERITY_LABELS } from '../lib/types';
import { ImageUpload, UploadState, getUploadKey } from '../components/ImageUpload';

interface Props {
  onNavigate: (page: 'reports') => void;
}

interface FormState {
  location: string;
  category: WasteCategory | '';
  severity: Severity | '';
  description: string;
}

const INITIAL: FormState = {
  location: '',
  category: '',
  severity: '',
  description: '',
};

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-red-600 text-xs mt-1">{msg}</p>;
}

export function ReportForm({ onNavigate }: Props) {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [photoUpload, setPhotoUpload] = useState<UploadState>({ status: 'idle' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  function set(field: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function validate(): boolean {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.location.trim()) e.location = 'Location is required';
    if (!form.category) e.category = 'Category is required';
    if (!form.severity) e.severity = 'Severity is required';
    if (!form.description.trim()) e.description = 'Description is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    // Block submission while a photo upload is in flight
    if (photoUpload.status === 'uploading' || photoUpload.status === 'validating') {
      setApiError('Please wait for the photo upload to finish.');
      return;
    }

    setSubmitting(true);
    setApiError(null);
    try {
      const photoKey = getUploadKey(photoUpload);
      await api.createReport({
        location: form.location.trim(),
        category: form.category as WasteCategory,
        severity: form.severity as Severity,
        description: form.description.trim(),
        // Store the S3 object key as photoUrl — backend field is unchanged
        ...(photoKey && { photoUrl: photoKey }),
      });
      setSuccess(true);
      setForm(INITIAL);
      setPhotoUpload({ status: 'idle' });
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="card text-center py-10 space-y-4">
          <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto" />
          <h2 className="text-xl font-bold text-gray-900">Report Submitted!</h2>
          <p className="text-gray-500 text-sm">
            Thank you for helping keep our streets clean. Your report has been logged and will be reviewed.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button className="btn-secondary" onClick={() => setSuccess(false)}>
              Submit another report
            </button>
            <button className="btn-primary" onClick={() => onNavigate('reports')}>
              View all reports
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Report Litter</h2>
        <p className="text-sm text-gray-500 mt-1">Help us identify and clean up roadside waste in your area.</p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-5" noValidate>
        {/* Location */}
        <div>
          <label className="label" htmlFor="location">
            Location / Street Name <span className="text-red-500">*</span>
          </label>
          <input
            id="location"
            type="text"
            className={`input ${errors.location ? 'border-red-400 focus:ring-red-500 focus:border-red-500' : ''}`}
            placeholder="e.g. Oak Street & 5th Avenue"
            value={form.location}
            onChange={(e) => set('location', e.target.value)}
            maxLength={500}
          />
          <FieldError msg={errors.location} />
        </div>

        {/* Category + Severity */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="category">
              Waste Category <span className="text-red-500">*</span>
            </label>
            <select
              id="category"
              className={`input ${errors.category ? 'border-red-400' : ''}`}
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
            >
              <option value="">Select category…</option>
              {(Object.entries(CATEGORY_LABELS) as [WasteCategory, string][]).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
            <FieldError msg={errors.category} />
          </div>

          <div>
            <label className="label" htmlFor="severity">
              Severity <span className="text-red-500">*</span>
            </label>
            <select
              id="severity"
              className={`input ${errors.severity ? 'border-red-400' : ''}`}
              value={form.severity}
              onChange={(e) => set('severity', e.target.value)}
            >
              <option value="">Select severity…</option>
              {(Object.entries(SEVERITY_LABELS) as [Severity, string][]).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
            <FieldError msg={errors.severity} />
          </div>
        </div>

        {/* Severity guide */}
        <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3 space-y-1">
          <p className="font-medium text-gray-600">Severity guide:</p>
          <p><span className="text-blue-600 font-medium">Low</span> — Small amount, not blocking paths</p>
          <p><span className="text-amber-600 font-medium">Medium</span> — Noticeable pile, may be a nuisance</p>
          <p><span className="text-red-600 font-medium">High</span> — Large amount, hazardous, or blocking access</p>
        </div>

        {/* Description */}
        <div>
          <label className="label" htmlFor="description">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            rows={4}
            className={`input resize-none ${errors.description ? 'border-red-400' : ''}`}
            placeholder="Describe the waste, its extent, and any hazards…"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            maxLength={2000}
          />
          <div className="flex justify-between mt-1">
            <FieldError msg={errors.description} />
            <span className="text-xs text-gray-400 ml-auto">{form.description.length}/2000</span>
          </div>
        </div>

        {/* Photo upload */}
        <ImageUpload
          label="Photo"
          optional
          onChange={setPhotoUpload}
          disabled={submitting}
        />

        {/* Upload-in-flight warning */}
        {(photoUpload.status === 'uploading' || photoUpload.status === 'validating') && (
          <p className="text-xs text-amber-600 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
            Photo is uploading — submission will be enabled when it finishes.
          </p>
        )}

        {/* API error */}
        {apiError && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{apiError}</span>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="btn-primary"
            disabled={
              submitting ||
              photoUpload.status === 'uploading' ||
              photoUpload.status === 'validating'
            }
          >
            <Send className="w-4 h-4" />
            {submitting ? 'Submitting…' : 'Submit Report'}
          </button>
        </div>
      </form>
    </div>
  );
}
