import React from 'react';
import { MapPin, CheckCircle2, AlertTriangle } from 'lucide-react';

interface LocationCardProps {
  userBuilding: string;
  userFloor: string;
  userRoom: string;
  hasGps: boolean;
  detectedBuilding?: string;
  detectedFloor?: string;
  detectedRoom?: string;
  latitude?: number;
  longitude?: number;
  verified: boolean;
  compact?: boolean;
}

export const LocationCard: React.FC<LocationCardProps> = ({
  userBuilding,
  userFloor,
  userRoom,
  hasGps,
  detectedBuilding,
  detectedFloor,
  detectedRoom,
  latitude,
  longitude,
  verified,
  compact = false,
}) => {
  return (
    <div
      className={`bg-white border border-[#E2E8F0] rounded-lg ${
        compact ? 'p-4' : 'p-5'
      } flex flex-col gap-4`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#2563EB] shrink-0" />
          <h3 className="text-sm font-semibold text-[#0F172A]">
            {compact ? 'Location Detection' : 'Location Verification'}
          </h3>
        </div>

        {hasGps ? (
          verified ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0] text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>✓ Location Verified</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] text-xs font-semibold">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>⚠ Location mismatch</span>
            </span>
          )
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1] text-xs font-medium">
            <span>Manual Location Only</span>
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* User Selected Location */}
        <div className="p-3 rounded bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col gap-1">
          <span className="font-mono-tech text-[11px] text-[#64748B]">User Selected</span>
          <span className="text-sm font-semibold text-[#0F172A]">{userBuilding || '—'}</span>
          <span className="text-xs text-[#475569]">
            {userFloor} — {userRoom}
          </span>
        </div>

        {/* GPS Detected Location */}
        <div className="p-3 rounded bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col gap-1">
          <span className="font-mono-tech text-[11px] text-[#64748B]">GPS Detected</span>
          {hasGps ? (
            <>
              <span className="text-sm font-semibold text-[#0F172A]">
                {detectedBuilding || userBuilding}
              </span>
              <span className="text-xs text-[#475569]">
                {detectedFloor || userFloor} — {detectedRoom || userRoom}
                {latitude && longitude ? (
                  <span className="font-mono-tech text-[11px] text-[#64748B] ml-1">
                    ({latitude.toFixed(5)}, {longitude.toFixed(5)})
                  </span>
                ) : null}
              </span>
            </>
          ) : (
            <>
              <span className="text-sm font-medium text-[#64748B]">Not available</span>
              <span className="text-xs text-[#64748B]">No EXIF GPS metadata found in image</span>
            </>
          )}
        </div>
      </div>

      {/* Verification Status Summary Strip */}
      {hasGps && verified && (
        <div className="px-3.5 py-2.5 rounded bg-[#ECFDF5]/70 border border-[#A7F3D0] flex items-center gap-2.5 text-xs text-[#065F46]">
          <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
          <span>
            <strong>✓ Location verified:</strong> Selected room matches EXIF GPS geofence coordinates
            for {userBuilding} — {userRoom}.
          </span>
        </div>
      )}

      {hasGps && !verified && (
        <div className="px-3.5 py-2.5 rounded bg-[#FFFBEB] border border-[#FDE68A] flex items-center gap-2.5 text-xs text-[#92400E]">
          <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0" />
          <span>
            <strong>⚠ Location mismatch:</strong> Selected <strong>{userRoom}</strong>, while GPS
            indicates <strong>{detectedRoom || 'Lab 203'}</strong>. Your selected location is
            preserved for backend review.
          </span>
        </div>
      )}
    </div>
  );
};
