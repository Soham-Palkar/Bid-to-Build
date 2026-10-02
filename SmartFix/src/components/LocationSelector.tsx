import React, { useEffect, useState } from 'react';
import { MapPin, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { getLocations, type CampusLocation } from '../services/api';

interface LocationSelectorProps {
  value: string; // location_id
  onChange: (locationId: string, locationObj?: CampusLocation) => void;
  error?: string;
  disabled?: boolean;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  value,
  onChange,
  error,
  disabled = false,
}) => {
  const [locations, setLocations] = useState<CampusLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchCampusLocations = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await getLocations();
      setLocations(data);
      if (data.length > 0 && !value) {
        onChange(data[0].location_id, data[0]);
      } else if (value) {
        const current = data.find((l) => l.location_id === value);
        if (current) {
          onChange(current.location_id, current);
        }
      }
    } catch {
      setFetchError('Failed to load campus locations from backend.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampusLocations();
  }, []);

  const selectedLoc = locations.find((l) => l.location_id === value);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const locId = e.target.value;
    const loc = locations.find((l) => l.location_id === locId);
    onChange(locId, loc);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="location-select" className="text-xs font-semibold text-[#334155]">
          Select Location / Lab <span className="text-[#DC2626]">*</span>
        </label>

        {isLoading ? (
          <div className="h-10 px-3 rounded border border-[#CBD5E1] bg-[#F8FAFC] flex items-center gap-2 text-xs text-[#64748B]">
            <Loader2 className="w-4 h-4 animate-spin text-[#2563EB]" />
            <span>Loading campus locations from database...</span>
          </div>
        ) : fetchError ? (
          <div className="p-3 rounded border border-[#FECACA] bg-[#FEF2F2] flex items-center justify-between gap-2 text-xs text-[#991B1B]">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0" />
              <span>{fetchError}</span>
            </div>
            <button
              type="button"
              onClick={fetchCampusLocations}
              className="px-2 py-1 rounded bg-white border border-[#FECACA] font-semibold text-[#DC2626] hover:bg-[#FEE2E2] transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3 h-3 inline mr-1" />
              Retry
            </button>
          </div>
        ) : (
          <div className="relative">
            <select
              id="location-select"
              value={value}
              onChange={handleSelectChange}
              disabled={disabled}
              className={`w-full h-10 px-3 pr-8 rounded border bg-white text-sm text-[#0F172A] focus:outline-none cursor-pointer ${
                error
                  ? 'border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/15'
                  : 'border-[#CBD5E1] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15'
              }`}
            >
              {locations.map((loc) => (
                <option key={loc.location_id} value={loc.location_id}>
                  {loc.location_name}
                </option>
              ))}
            </select>
          </div>
        )}

        {error && <span className="text-xs text-[#DC2626]">{error}</span>}
      </div>

      {/* Selected Location Information Card */}
      {selectedLoc && (
        <div className="p-3.5 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] flex items-start gap-3">
          <MapPin className="w-5 h-5 text-[#2563EB] shrink-0 mt-0.5" />
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[#1E3A8A]">
                {selectedLoc.location_name}
              </span>
              <span className="font-mono-tech text-[11px] font-semibold text-[#2563EB] bg-white px-2 py-0.5 rounded border border-[#BFDBFE]">
                {selectedLoc.location_id}
              </span>
            </div>
            <span className="text-xs text-[#1E40AF] mt-0.5">
              {selectedLoc.building}
            </span>
            <span className="font-mono-tech text-[11px] text-[#3B82F6] mt-0.5">
              Floor {selectedLoc.floor} • {selectedLoc.room} (GPS Target: {selectedLoc.latitude.toFixed(6)}, {selectedLoc.longitude.toFixed(6)})
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
