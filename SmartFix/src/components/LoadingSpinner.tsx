import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  label?: string;
  fullPage?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  label = 'Loading complaints...',
  fullPage = false,
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 text-[#64748B] ${
        fullPage ? 'min-h-[60vh]' : 'py-12'
      }`}
    >
      <Loader2 className="w-6 h-6 text-[#2563EB] animate-spin" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
};
