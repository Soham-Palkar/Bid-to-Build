import React, { useState, useEffect } from 'react';
import { UserPlus, CheckCircle2, Mail, AlertTriangle, Loader2 } from 'lucide-react';
import type { Worker } from '../types';

interface WorkerAssignmentProps {
  workers: Worker[];
  currentWorker?: Worker;
  emailSent?: boolean;
  onAssign: (workerId: number) => Promise<{
    worker: Worker;
    email_sent: boolean;
  }>;
}

export const WorkerAssignment: React.FC<WorkerAssignmentProps> = ({
  workers,
  currentWorker,
  emailSent,
  onAssign,
}) => {
  const [selectedId, setSelectedId] = useState<number>(
    currentWorker?.id || workers[0]?.id || 1
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    worker: Worker;
    emailSent: boolean;
  } | null>(
    currentWorker
      ? {
          worker: currentWorker,
          emailSent: emailSent ?? true,
        }
      : null
  );

  useEffect(() => {
    if (currentWorker) {
      setSelectedId(currentWorker.id);
      setFeedback({
        worker: currentWorker,
        emailSent: emailSent ?? true,
      });
    } else if (workers.length > 0 && !selectedId) {
      setSelectedId(workers[0].id);
    }
  }, [currentWorker, emailSent, workers]);

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await onAssign(selectedId);
      setFeedback({
        worker: res.worker,
        emailSent: res.email_sent,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
        <div className="flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-[#2563EB] shrink-0" />
          <h3 className="text-sm font-semibold text-[#0F172A]">Assign Maintenance Worker</h3>
        </div>
        <span className="font-mono-tech text-[11px] text-[#64748B]">Dispatch</span>
      </div>

      <form onSubmit={handleAssignSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="worker-select" className="text-xs font-semibold text-[#334155]">
            Select Worker
          </label>
          <select
            id="worker-select"
            value={selectedId}
            onChange={(e) => setSelectedId(Number(e.target.value))}
            className="w-full h-10 px-3 rounded border border-[#CBD5E1] bg-white text-sm text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15"
          >
            {workers.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} — {w.specialization}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-10 px-4 rounded bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-60 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Assigning Worker...</span>
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              <span>Assign Worker</span>
            </>
          )}
        </button>
      </form>

      {/* Assignment & Email Notification Status (Sections 38 & 39) */}
      {feedback && (
        <div className="p-3.5 rounded bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col gap-2.5">
          <div className="flex items-start gap-2 text-xs text-[#047857]">
            <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0 mt-0.5" />
            <div className="flex flex-col">
              <span className="font-semibold">✓ Worker assigned successfully</span>
              <span className="text-[#0F172A] font-medium mt-0.5">
                {feedback.worker.name} · {feedback.worker.specialization}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-[#E2E8F0] flex flex-col gap-1">
            <span className="font-mono-tech text-[10px] text-[#64748B]">Worker Notification</span>
            {feedback.emailSent ? (
              <div className="flex items-center gap-1.5 text-xs text-[#047857] font-medium">
                <Mail className="w-3.5 h-3.5 text-[#059669] shrink-0" />
                <span>
                  ✓ Email sent successfully ({feedback.worker.email})
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-[#B45309] font-medium">
                <AlertTriangle className="w-3.5 h-3.5 text-[#D97706] shrink-0" />
                <span>⚠ Assignment saved. Email notification could not be sent.</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
