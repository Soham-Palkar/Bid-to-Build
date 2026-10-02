import React from 'react';
import { MapPin, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

interface LocationCardProps {
  userBuilding: string;
  userFloor: string | number;
  userRoom: string;
  userLocationName?: string;
  userLocationId?: string;
  hasGps: boolean;
  detectedBuilding?: string;
  detectedFloor?: string | number;
  detectedRoom?: string;
  detectedName?: string;
  latitude?: number | null;
  longitude?: number | null;
  altitude_m?: number | null;
  distance_m?: number | null;
  radius_m?: number;
  verified: boolean;
  compact?: boolean;
}

export const LocationCard: React.FC<LocationCardProps> = ({
  userBuilding,
  userFloor,
  userRoom,
  userLocationName,
  userLocationId,
  hasGps,
  detectedBuilding,
  detectedFloor,
  detectedRoom,
  detectedName,
  latitude,
  longitude,
  altitude_m,
  distance_m,
  radius_m = 5,
  verified,
  compact = false,
}) => {
  return (
    <div
      className={`bg-white border border-[#E2E8F0] rounded-lg ${
        compact ? 'p-4' : 'p-5'
      } flex flex-col gap-3.5`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#2563EB] shrink-0" />
          <h3 className="text-sm font-semibold text-[#0F172A]">
            Location Detection & Geofence Verification
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
              <span>⚠ GPS Mismatch</span>
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
          <div className="flex items-center justify-between">
            <span className="font-mono-tech text-[11px] text-[#64748B]">User Selected</span>
            {userLocationId && (
              <span className="font-mono-tech text-[10px] font-bold px-1.5 py-0.2 bg-[#E2E8F0] text-[#334155] rounded">
                {userLocationId}
              </span>
            )}
          </div>
          <span className="text-sm font-semibold text-[#0F172A]">
            {userLocationName || `${userBuilding} — ${userRoom}`}
          </span>
          <span className="text-xs text-[#475569]">
            {userFloor} · {userRoom}
          </span>
        </div>

        {/* GPS Detected Telemetry */}
        <div className="p-3 rounded bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col gap-1">
          <span className="font-mono-tech text-[11px] text-[#64748B]">GPS Telemetry Detected</span>
          {hasGps && latitude !== null && latitude !== undefined && longitude !== null && longitude !== undefined ? (
            <>
              <span className="text-sm font-semibold text-[#0F172A]">
                {detectedName || detectedBuilding || 'Campus Coordinates Lock'}
              </span>
              <div className="flex flex-wrap items-center gap-x-2 text-xs text-[#475569] font-mono-tech">
                <span>{latitude.toFixed(6)}, {longitude.toFixed(6)}</span>
                {altitude_m !== null && altitude_m !== undefined && (
                  <span className="text-[#64748B]">· Alt: {altitude_m.toFixed(1)}m</span>
                )}
              </div>
            </>
          ) : (
            <>
              <span className="text-sm font-medium text-[#64748B]">No EXIF GPS Metadata</span>
              <span className="text-xs text-[#64748B]">Complaint will be submitted using selected campus location.</span>
            </>
          )}
        </div>
      </div>

      {/* Distance & Verification Status Banner */}
      {hasGps && distance_m !== null && distance_m !== undefined && (
        <div className="flex items-center justify-between px-3 py-2 bg-[#F1F5F9] rounded border border-[#E2E8F0] text-xs">
          <span className="font-mono-tech text-[#475569]">
            Haversine Distance: <strong>{distance_m.toFixed(2)} m</strong> / {radius_m} m threshold
          </span>
          <span className={`font-semibold font-mono-tech ${verified ? 'text-[#059669]' : 'text-[#D97706]'}`}>
            {verified ? '✓ MATCH (<= 5m)' : '⚠ MISMATCH (> 5m)'}
          </span>
        </div>
      )}

      {/* Authoritative Selection Reminder */}
      {hasGps && verified && (
        <div className="px-3.5 py-2.5 rounded bg-[#ECFDF5]/80 border border-[#A7F3D0] flex items-center gap-2.5 text-xs text-[#065F46]">
          <ShieldCheck className="w-4 h-4 text-[#059669] shrink-0" />
          <span>
            <strong>✓ Location Verified:</strong> EXIF photo coordinates match selected location{' '}
            (within {radius_m}m geofence radius).
          </span>
        </div>
      )}

      {hasGps && !verified && (
        <div className="px-3.5 py-2.5 rounded bg-[#FFFBEB] border border-[#FDE68A] flex items-start gap-2.5 text-xs text-[#92400E]">
          <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
          <div>
            <strong>⚠ GPS Mismatch:</strong> Detected location is{' '}
            <strong>{distance_m !== null && distance_m !== undefined ? `${distance_m.toFixed(1)} m` : 'further than 5 m'}</strong> away from selected campus location.
            <div className="text-[11px] text-[#B45309] mt-0.5">
              Selected location (<strong>{userLocationName || userRoom}</strong>) remains authoritative.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
