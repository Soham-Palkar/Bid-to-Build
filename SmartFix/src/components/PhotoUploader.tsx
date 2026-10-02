import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Upload,
  CheckCircle2,
  MapPin,
  AlertTriangle,
  X,
  Camera,
  Image as ImageIcon,
  RefreshCw,
  FolderOpen,
  Sparkles,
} from 'lucide-react';
import { formatFileSize } from '../utils/formatters';

export interface UploadedPhotoState {
  file: File | null;
  previewUrl: string;
  filename: string;
  sizeLabel: string;
  gpsMode: 'verified' | 'mismatch' | 'none';
  captureSource?: 'camera' | 'upload' | 'sample';
}

interface PhotoUploaderProps {
  value: UploadedPhotoState | null;
  onChange: (photo: UploadedPhotoState | null) => void;
  category?: string;
  error?: string;
}

const SAMPLE_PHOTOS: Record<string, { url: string; name: string; size: string }> = {
  Electrical: {
    url: '/src/assets/images/incident_electrical_spark_1790921884186.jpg',
    name: 'wire_switchboard_hazard.jpg',
    size: '2.4 MB',
  },
  Plumbing: {
    url: '/src/assets/images/incident_plumbing_leak_1790921897370.jpg',
    name: 'valve_pipe_leak_r101.jpg',
    size: '1.8 MB',
  },
  default: {
    url: '/src/assets/images/incident_hvac_vent_1790921909791.jpg',
    name: 'campus_maintenance_evidence.jpg',
    size: '2.1 MB',
  },
};

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  value,
  onChange,
  category = 'Electrical',
  error,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraFileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [imgFallback, setImgFallback] = useState(false);

  // Live Camera Modal / Viewfinder State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStartingCamera, setIsStartingCamera] = useState(false);

  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, [stopCameraStream]);

  const startCamera = useCallback(
    async (mode: 'environment' | 'user' = facingMode) => {
      setCameraError(null);
      setIsStartingCamera(true);
      stopCameraStream();

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setIsStartingCamera(false);
        setCameraError(
          'Live browser camera stream is not supported on this device. Use the Device Camera Capture button below.'
        );
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
      } catch {
        setCameraError(
          'Camera access was blocked or no webcam was found. You can capture using your mobile device camera or upload from files.'
        );
      } finally {
        setIsStartingCamera(false);
      }
    },
    [facingMode, stopCameraStream]
  );

  const handleOpenCamera = () => {
    setUploadError(null);
    setIsCameraOpen(true);
    setTimeout(() => {
      startCamera(facingMode);
    }, 50);
  };

  const handleCloseCamera = () => {
    stopCameraStream();
    setIsCameraOpen(false);
    setCameraError(null);
  };

  const handleSwitchCameraFacing = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  const handleCaptureFrame = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

    canvas.toBlob(
      (blob) => {
        const timestamp = new Date().toISOString().slice(11, 19).replace(/:/g, '');
        const filename = `camera_capture_${timestamp}.jpg`;
        const file = blob
          ? new File([blob], filename, { type: 'image/jpeg' })
          : null;

        onChange({
          file,
          previewUrl: dataUrl,
          filename,
          sizeLabel: file ? formatFileSize(file.size) : '1.4 MB',
          gpsMode: 'verified',
          captureSource: 'camera',
        });
        handleCloseCamera();
      },
      'image/jpeg',
      0.9
    );
  };

  const processFile = (file: File, source: 'camera' | 'upload' = 'upload') => {
    setUploadError(null);
    setImgFallback(false);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError('Unsupported file format. Please upload JPG, JPEG, PNG, or WEBP.');
      return;
    }

    if (file.size > MAX_BYTES) {
      setUploadError('File exceeds maximum size of 5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      const lower = file.name.toLowerCase();
      const gpsMode: 'verified' | 'mismatch' | 'none' = lower.includes('nogps')
        ? 'none'
        : lower.includes('mismatch')
        ? 'mismatch'
        : 'verified';

      onChange({
        file,
        previewUrl: dataUrl,
        filename: file.name,
        sizeLabel: formatFileSize(file.size),
        gpsMode,
        captureSource: source,
      });
      if (isCameraOpen) {
        handleCloseCamera();
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    source: 'camera' | 'upload' = 'upload'
  ) => {
    const selected = e.target.files?.[0];
    if (selected) {
      processFile(selected, source);
    }
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      processFile(dropped, 'upload');
    }
  };

  const handleUseSamplePhoto = (mode: 'verified' | 'mismatch' | 'none' = 'verified') => {
    setUploadError(null);
    setImgFallback(false);
    const sample = SAMPLE_PHOTOS[category] || SAMPLE_PHOTOS.default;
    onChange({
      file: null,
      previewUrl: sample.url,
      filename: sample.name,
      sizeLabel: sample.size,
      gpsMode: mode,
      captureSource: 'sample',
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-xs font-semibold text-[#334155]">
          Visual Photo Evidence <span className="text-[#DC2626]">*</span>
        </label>
        <button
          type="button"
          onClick={() => handleUseSamplePhoto('verified')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#2563EB] hover:text-[#1D4ED8] transition-colors cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Load Sample Geotagged Photo</span>
        </button>
      </div>

      {/* Hidden File Inputs for File Manager & Native Device Camera */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        onChange={(e) => handleFileChange(e, 'upload')}
        className="hidden"
      />
      <input
        ref={cameraFileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        onChange={(e) => handleFileChange(e, 'camera')}
        className="hidden"
      />

      {/* Live Camera Viewfinder Panel */}
      {isCameraOpen && (
        <div className="border border-[#CBD5E1] rounded-lg bg-[#0F172A] p-4 text-white flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#DC2626] animate-pulse" />
              <span className="font-mono-tech text-xs font-semibold">
                Live Device Camera Viewfinder (Geo-Telemetry Active)
              </span>
            </div>
            <button
              type="button"
              onClick={handleCloseCamera}
              className="p-1 rounded hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {!cameraError ? (
            <div className="relative w-full aspect-video max-h-72 bg-black rounded overflow-hidden border border-slate-700 flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {isStartingCamera && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-xs font-mono-tech">
                  Initializing device camera...
                </div>
              )}
              <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded font-mono-tech text-[10px] text-[#6EE7B7]">
                GPS LOCK: 19.12345° N, 72.87654° E
              </div>
            </div>
          ) : (
            <div className="p-4 rounded bg-slate-800 border border-slate-700 flex flex-col items-center text-center gap-3">
              <AlertTriangle className="w-6 h-6 text-[#FBBF24]" />
              <p className="text-xs text-slate-200 max-w-md">{cameraError}</p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => cameraFileInputRef.current?.click()}
                  className="px-3.5 py-2 rounded bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Open Native Device Camera</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleUseSamplePhoto('verified');
                    handleCloseCamera();
                  }}
                  className="px-3.5 py-2 rounded bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Use Simulated Camera Snapshot</span>
                </button>
              </div>
            </div>
          )}

          {!cameraError && (
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={handleSwitchCameraFacing}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Switch Camera</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => cameraFileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Mobile Native Shutter</span>
                </button>
                <button
                  type="button"
                  onClick={handleCaptureFrame}
                  className="px-4 py-2 rounded bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Capture Photo</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {!value ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isDragging
              ? 'border-[#2563EB] bg-[#F0F9FF]'
              : error || uploadError
              ? 'border-[#DC2626] bg-[#FEF2F2]/40'
              : 'border-[#CBD5E1] bg-[#F8FAFC]'
          }`}
        >
          {/* Dual Action Buttons matching Reference Image 3: Camera + File Manager */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 mb-4">
            <button
              type="button"
              onClick={handleOpenCamera}
              className="h-10 px-4 rounded bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
            >
              <Camera className="w-4 h-4 shrink-0" />
              <span>Take / Click Photo (Use Camera)</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="h-10 px-4 rounded border border-[#CBD5E1] bg-white hover:bg-[#F1F5F9] text-[#0F172A] text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <FolderOpen className="w-4 h-4 text-[#2563EB] shrink-0" />
              <span>Upload from Device (Browse Files)</span>
            </button>
          </div>

          <p className="text-xs text-[#64748B]">
            Or drag and drop an image file here · Geo-location telemetry auto-links to campus floor
            plans when captured on-site
          </p>
          <p className="font-mono-tech text-[11px] text-[#64748B] mt-1.5">
            JPG, JPEG, PNG, WEBP · Maximum 5 MB
          </p>
        </div>
      ) : (
        <div className="border border-[#E2E8F0] rounded-lg bg-[#F8FAFC] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 min-w-0 flex-1">
            {/* Image Preview with Resilient Fallback */}
            <div className="relative w-full sm:w-40 h-28 rounded border border-[#CBD5E1] overflow-hidden bg-[#0F172A] shrink-0">
              {!imgFallback ? (
                <img
                  src={value.previewUrl}
                  alt="Uploaded maintenance issue evidence preview"
                  referrerPolicy="no-referrer"
                  onError={() => setImgFallback(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-white/80 p-2 text-center bg-slate-800">
                  <ImageIcon className="w-5 h-5 mb-1 text-[#60A5FA]" />
                  <span className="text-[10px] font-mono-tech truncate w-full">
                    {value.filename}
                  </span>
                </div>
              )}
              <span className="absolute top-1.5 left-1.5 bg-[#DC2626] text-white font-mono-tech text-[9px] font-bold px-1.5 py-0.5 rounded">
                {value.captureSource === 'camera' ? 'CAMERA SNAPSHOT' : 'HAZARD SNAPSHOT'}
              </span>
            </div>

            {/* Metadata Readout */}
            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono-tech text-xs font-semibold text-[#0F172A] truncate">
                  {value.filename}
                </span>
                <span className="text-xs text-[#64748B]" aria-hidden="true">
                  ·
                </span>
                <span className="font-mono-tech text-xs text-[#64748B] whitespace-nowrap">
                  {value.sizeLabel}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-medium text-[#059669]">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>
                  ✓ {value.captureSource === 'camera' ? 'Camera photo captured' : 'Image uploaded'}{' '}
                  · EXIF Verified
                </span>
              </div>

              {/* EXIF GPS Status Indicator (Section 13) */}
              {value.gpsMode !== 'none' ? (
                <div className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0284C7] mt-0.5">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span>📍 Location data detected (GPS: 19.12345° N, 72.87654° E)</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 text-xs font-medium text-[#D97706] mt-0.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>⚠ Location data not found (Manual location will be used)</span>
                </div>
              )}

              {/* Retake / Replace & EXIF GPS Controls */}
              <div className="flex flex-wrap items-center gap-2 pt-1.5">
                <button
                  type="button"
                  onClick={handleOpenCamera}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:underline cursor-pointer"
                >
                  <Camera className="w-3 h-3" />
                  <span>Retake with Camera</span>
                </button>
                <span className="text-xs text-[#CBD5E1]">|</span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:underline cursor-pointer"
                >
                  <Upload className="w-3 h-3" />
                  <span>Replace from Device</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] text-[#64748B]">EXIF GPS State:</span>
                <button
                  type="button"
                  onClick={() => onChange({ ...value, gpsMode: 'verified' })}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                    value.gpsMode === 'verified'
                      ? 'bg-[#2563EB] text-white'
                      : 'bg-white border border-[#CBD5E1] text-[#475569] hover:text-[#0F172A]'
                  }`}
                >
                  GPS Match
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ ...value, gpsMode: 'mismatch' })}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                    value.gpsMode === 'mismatch'
                      ? 'bg-[#D97706] text-white'
                      : 'bg-white border border-[#CBD5E1] text-[#475569] hover:text-[#0F172A]'
                  }`}
                >
                  GPS Mismatch
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ ...value, gpsMode: 'none' })}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                    value.gpsMode === 'none'
                      ? 'bg-[#475569] text-white'
                      : 'bg-white border border-[#CBD5E1] text-[#475569] hover:text-[#0F172A]'
                  }`}
                >
                  No GPS Data
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onChange(null)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-[#E2E8F0] bg-white text-xs font-medium text-[#DC2626] hover:bg-[#FEF2F2] transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Remove</span>
          </button>
        </div>
      )}

      {(uploadError || error) && (
        <p className="text-xs font-medium text-[#DC2626]">{uploadError || error}</p>
      )}
    </div>
  );
};
