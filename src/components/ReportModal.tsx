import React, { useState } from 'react';
import { Flag, X, CheckCircle2, ShieldAlert, AlertTriangle } from 'lucide-react';
import { Post, ReportReason } from '../types';

interface ReportModalProps {
  isOpen: boolean;
  post: Post | null;
  onClose: () => void;
  onConfirmReport: (postId: string, reason: ReportReason, details?: string) => void;
}

const REPORT_OPTIONS: { id: ReportReason; label: string; description: string }[] = [
  {
    id: 'spam',
    label: 'Spam or Promotional',
    description: 'Repetitive messages, commercial ads, or automated link spam.',
  },
  {
    id: 'misleading',
    label: 'Fake Streak or Misleading',
    description: 'Inaccurate check-in, fake milestone claim, or stolen media.',
  },
  {
    id: 'inappropriate',
    label: 'Inappropriate or Sensitive',
    description: 'Explicit imagery, dangerous activities, or suggestive material.',
  },
  {
    id: 'harassment',
    label: 'Harassment or Hostility',
    description: 'Targeted attacks, offensive language, or discouraging comments.',
  },
  {
    id: 'other',
    label: 'Other Issue',
    description: 'Violates community guidelines or personal safety.',
  },
];

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  post,
  onClose,
  onConfirmReport,
}) => {
  const [selectedReason, setSelectedReason] = useState<ReportReason>('spam');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen || !post) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmReport(post.id, selectedReason, additionalDetails);
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setAdditionalDetails('');
      setSelectedReason('spam');
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#0A0A0A] border-t sm:border border-white/10 rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl text-white">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <Flag className="w-4 h-4 fill-red-400/20" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white">Report Post</h2>
              <span className="text-[10px] text-white/40 font-mono">
                Post by @{post.username}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Close report dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSubmitted ? (
          <div className="p-8 text-center space-y-3 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-white">Report Received</h3>
            <p className="text-xs text-white/60 max-w-xs mx-auto">
              Thank you for keeping Daily authentic and safe. Our moderation team has flagged this post for review.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white/80 block">
                Why are you reporting this post?
              </label>
              <p className="text-[11px] text-white/40">
                Your report remains anonymous to the creator.
              </p>
            </div>

            {/* Reasons List */}
            <div className="space-y-2 max-h-[42vh] overflow-y-auto pr-1">
              {REPORT_OPTIONS.map((opt) => {
                const isSelected = selectedReason === opt.id;
                return (
                  <button
                    type="button"
                    key={opt.id}
                    onClick={() => setSelectedReason(opt.id)}
                    className={`w-full text-left p-3 rounded-2xl border transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'bg-red-500/10 border-red-500/40 text-white shadow-lg shadow-red-500/5'
                        : 'bg-white/5 border-white/5 hover:border-white/10 text-white/70'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'border-red-500 bg-red-500 text-black'
                          : 'border-white/30'
                      }`}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>

                    <div>
                      <span className="text-xs font-bold block text-white">
                        {opt.label}
                      </span>
                      <span className="text-[11px] text-white/40 mt-0.5 block leading-snug">
                        {opt.description}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Additional note */}
            <div>
              <label className="text-[11px] font-semibold text-white/50 block mb-1">
                Additional context (optional)
              </label>
              <textarea
                value={additionalDetails}
                onChange={(e) => setAdditionalDetails(e.target.value)}
                placeholder="Help us understand the issue..."
                rows={2}
                maxLength={200}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-red-500/50 resize-none"
              />
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-2 pt-2 border-t border-white/5">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white transition-colors min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 active:scale-95 text-xs font-black text-white transition-all shadow-lg shadow-red-500/20 min-h-[44px] flex items-center justify-center gap-1.5"
              >
                <Flag className="w-3.5 h-3.5 fill-white" />
                <span>Submit Report</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
