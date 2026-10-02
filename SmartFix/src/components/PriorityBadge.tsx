import React from 'react';
import type { PriorityLevel } from '../types';

interface PriorityBadgeProps {
  priority: PriorityLevel;
  size?: 'sm' | 'md';
  showLabelPrefix?: boolean;
}

const PRIORITY_STYLES: Record<
  PriorityLevel,
  {
    container: string;
    dot: string;
    label: string;
  }
> = {
  Critical: {
    container: 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]',
    dot: 'bg-[#DC2626]',
    label: 'Critical',
  },
  High: {
    container: 'bg-[#FFF7ED] text-[#9A3412] border-[#FED7AA]',
    dot: 'bg-[#EA580C]',
    label: 'High',
  },
  Medium: {
    container: 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]',
    dot: 'bg-[#D97706]',
    label: 'Medium',
  },
  Low: {
    container: 'bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]',
    dot: 'bg-[#16A34A]',
    label: 'Low',
  },
};

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  priority,
  size = 'md',
  showLabelPrefix = false,
}) => {
  const style = PRIORITY_STYLES[priority] || PRIORITY_STYLES.Low;
  const sizeClasses =
    size === 'sm' ? 'px-2 py-0.5 text-[11px] leading-[14px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded border whitespace-nowrap shrink-0 ${style.container} ${sizeClasses}`}
    >
      <span
        className={`w-2 h-2 rounded-full shrink-0 ${style.dot} ${
          priority === 'Critical' ? 'animate-pulse' : ''
        }`}
        aria-hidden="true"
      />
      <span>
        {style.label}
        {showLabelPrefix ? ' Priority' : ''}
      </span>
    </span>
  );
};
