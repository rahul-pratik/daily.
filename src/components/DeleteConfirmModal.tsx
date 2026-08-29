import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Post } from '../types';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  post: Post | null;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  post,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="delete-confirm-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-[#111111] border border-white/15 rounded-3xl p-5 sm:p-6 shadow-2xl text-white space-y-4 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Alert Icon & Heading */}
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1 flex-1">
            <h3 className="text-base font-bold text-white tracking-tight">
              Delete this post?
            </h3>
            <p className="text-xs text-white/60 leading-relaxed">
              This will remove this proof-of-work receipt and reset your daily check-in status for today.
            </p>
          </div>
        </div>

        {/* Post preview snippet if available */}
        {post && (
          <div className="p-3 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-3">
            {post.imageUrl && (
              <img
                src={post.imageUrl}
                alt="Post thumbnail"
                referrerPolicy="no-referrer"
                className="w-11 h-11 rounded-xl object-cover border border-white/10 shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white/80 line-clamp-2 leading-tight">
                {post.content}
              </p>
              <span className="text-[10px] text-[#FF4D00] font-semibold mt-0.5 block">
                🔥 Day {post.userStreak} Check-in
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 pt-2">
          <button
            id="cancel-delete-btn"
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all min-h-[42px]"
          >
            Cancel
          </button>
          <button
            id="confirm-delete-btn"
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 py-3 px-4 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition-all min-h-[42px] shadow-lg shadow-red-500/25 flex items-center justify-center gap-1.5 active:scale-95"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Post</span>
          </button>
        </div>
      </div>
    </div>
  );
};
