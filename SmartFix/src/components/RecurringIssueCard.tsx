import React from 'react';
import { Repeat, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface RecurringIssueCardProps {
  isRecurring: boolean;
  previousCount: number;
  locationRoom: string;
  category: string;
  advisory?: string;
}

export const RecurringIssueCard: React.FC<RecurringIssueCardProps> = ({
  isRecurring,
  previousCount,
  locationRoom,
  category,
  advisory,
}) => {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Repeat className="w-4 h-4 text-[#D97706] shrink-0" />
          <h3 className="text-sm font-semibold text-[#0F172A]">Recurring Issue Analysis</h3>
        </div>

        {isRecurring ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A] text-xs font-semibold">
            <AlertTriangle className="w-3.5 h-3.5 text-[#D97706] shrink-0" />
            <span>⚠ RECURRING ISSUE</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0] text-xs font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>Isolated Incident</span>
          </span>
        )}
      </div>

      {isRecurring ? (
        <div className="flex flex-col gap-3">
          <div className="p-3.5 rounded bg-[#FFFBEB]/60 border border-[#FDE68A] flex flex-col gap-2">
            <p className="text-sm font-semibold text-[#92400E]">
              This location has received {previousCount} previous {category} complaints.
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-[#475569]">
              <span>
                Location: <strong className="text-[#0F172A]">{locationRoom}</strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Category: <strong className="text-[#0F172A]">{category}</strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Previous complaints:{' '}
                <strong className="font-mono-tech text-[#0F172A]">{previousCount}</strong>
              </span>
            </div>
          </div>

          {advisory && (
            <div className="p-3 rounded bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#475569]">
              <span className="font-semibold text-[#0F172A] block mb-0.5">
                Root-Cause Maintenance Note:
              </span>
              {advisory}
            </div>
          )}
        </div>
      ) : (
        <div className="p-3.5 rounded bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#64748B]">
          No recurring issue detected for {locationRoom} ({category}).
        </div>
      )}
    </div>
  );
};
