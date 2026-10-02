import React from 'react';
import { Check, Clock } from 'lucide-react';
import type { ComplaintStatus, ComplaintTimelineItem } from '../types';

interface ComplaintTimelineProps {
  currentStatus: ComplaintStatus;
  timeline: ComplaintTimelineItem[];
  assignedWorkerName?: string;
}

const ORDERED_STAGES: ComplaintStatus[] = ['Reported', 'Assigned', 'In Progress', 'Resolved'];

const DEFAULT_NOTES: Record<ComplaintStatus, string> = {
  Reported: 'Complaint submitted and verified by automated safety rules.',
  Assigned: 'Assigned to maintenance specialist.',
  'In Progress': 'Maintenance work is underway on site.',
  Resolved: 'Awaiting completion and safety clearance verification.',
};

export const ComplaintTimeline: React.FC<ComplaintTimelineProps> = ({
  currentStatus,
  timeline,
  assignedWorkerName,
}) => {
  const currentIndex = ORDERED_STAGES.indexOf(currentStatus);

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 flex flex-col gap-5">
      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#2563EB] shrink-0" />
          <h3 className="text-sm font-semibold text-[#0F172A]">Complaint Timeline</h3>
        </div>
        <span className="font-mono-tech text-[11px] text-[#64748B]">
          Stage {Math.max(1, currentIndex + 1)} of 4
        </span>
      </div>

      <div className="relative pl-6 flex flex-col gap-4">
        {/* Continuous vertical line */}
        <div className="absolute left-[11px] top-2 bottom-4 w-0.5 bg-[#E2E8F0]" />

        {ORDERED_STAGES.map((stage, idx) => {
          const matchedEntry = timeline.find((t) => t.status === stage);
          const isCompleted = idx < currentIndex || (stage === 'Resolved' && currentStatus === 'Resolved');
          const isCurrent = idx === currentIndex && currentStatus !== 'Resolved';
          const isPending = idx > currentIndex;

          const stageTitle =
            stage === 'Assigned' && assignedWorkerName && (isCompleted || isCurrent)
              ? `Assigned to ${assignedWorkerName}`
              : stage;

          const noteText =
            matchedEntry?.note ||
            (stage === 'Assigned' && assignedWorkerName
              ? `Assigned to ${assignedWorkerName}`
              : DEFAULT_NOTES[stage]);

          return (
            <div
              key={stage}
              className={`relative flex items-start gap-3 ${isPending ? 'opacity-60' : ''}`}
            >
              {/* Step Indicator Node */}
              <div
                className={`relative z-10 -ml-6 w-6 h-6 rounded-full flex items-center justify-center shrink-0 border ${
                  isCompleted
                    ? 'bg-[#059669] border-[#059669] text-white'
                    : isCurrent
                    ? 'bg-[#2563EB] border-[#2563EB] text-white ring-4 ring-[#2563EB]/15'
                    : 'bg-white border-[#CBD5E1] text-[#64748B]'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                ) : isCurrent ? (
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#94A3B8]" />
                )}
              </div>

              {/* Step Content Box */}
              <div
                className={`flex-1 rounded-lg p-3.5 border ${
                  isCurrent
                    ? 'bg-[#F0F9FF]/60 border-[#BAE6FD]'
                    : 'bg-[#F8FAFC] border-[#E2E8F0]'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[#0F172A]">{stageTitle}</span>
                    {isCurrent && (
                      <span className="px-2 py-0.5 rounded bg-[#2563EB] text-white text-[10px] font-semibold">
                        Current Status
                      </span>
                    )}
                  </div>
                  <span className="font-mono-tech text-xs text-[#64748B]">
                    {matchedEntry?.timestamp || (isPending ? 'Pending' : 'Recorded')}
                  </span>
                </div>
                <p className="text-xs text-[#475569] leading-relaxed">{noteText}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
