import React from 'react';
import type { ComplaintStatus } from '../types';

interface StatusBadgeProps {
  status: ComplaintStatus;
  size?: 'sm' | 'md';
}

const STATUS_STYLES: Record<
  ComplaintStatus,
  {
    container: string;
    dot: string;
  }
> = {
  Reported: {
    container: 'bg-[#F0F9FF] text-[#0369A1] border-[#BAE6FD]',
    dot: 'bg-[#0284C7]',
  },
  Assigned: {
    container: 'bg-[#EEF2FF] text-[#4338CA] border-[#C7D2FE]',
    dot: 'bg-[#6366F1]',
  },
  'In Progress': {
    container: 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]',
    dot: 'bg-[#D97706]',
  },
  Resolved: {
    container: 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]',
    dot: 'bg-[#059669]',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const style = STATUS_STYLES[status] || STATUS_STYLES.Reported;
  const sizeClasses =
    size === 'sm' ? 'px-2 py-0.5 text-[11px] leading-[14px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded border whitespace-nowrap shrink-0 ${style.container} ${sizeClasses}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot} ${
          status === 'In Progress' ? 'animate-pulse' : ''
        }`}
        aria-hidden="true"
      />
      <span>{status}</span>
    </span>
  );
};
