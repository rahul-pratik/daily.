import React, { useState } from 'react';
import {
  X,
  User,
  BarChart3,
  Bookmark,
  FileText,
  ShieldAlert,
  RotateCcw,
  Edit3,
  ChevronRight,
  Sparkles,
  Layers,
  Heart,
  MessageSquare,
  Flame,
  AlertTriangle,
} from 'lucide-react';
import { User as UserType, Post, PostDraft } from '../types';
import { vibrateLight, vibrateStreakMilestone } from '../services/haptics';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserType;
  userPosts: Post[];
  savedPosts: Post[];
  drafts: PostDraft[];
  onOpenEditProfile: () => void;
  onOpenDossier: () => void;
  onOpenAnalytics: () => void;
  onOpenSaved: () => void;
  onOpenDrafts: () => void;
  onResetData: () => void;
}

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  userPosts,
  savedPosts,
  drafts,
  onOpenEditProfile,
  onOpenDossier,
  onOpenAnalytics,
  onOpenSaved,
  onOpenDrafts,
  onResetData,
}) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  if (!isOpen) return null;

  const totalLikes = userPosts.reduce((acc, p) => acc + (p.likesCount || 0), 0);
  const totalComments = userPosts.reduce((acc, p) => acc + (p.comments?.length || 0), 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#0A0A0A] border-t sm:border border-white/15 rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl text-white max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <span>Settings & Tools</span>
            </h2>
            <p className="text-[11px] text-white/50">Manage dossier, analytics, saved items & account</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Quick User Summary */}
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="text-xs font-black text-white">{currentUser.name}</h3>
                <p className="text-[11px] text-white/50 font-mono">@{currentUser.username}</p>
              </div>
            </div>

            <button
              onClick={() => {
                vibrateLight();
                onClose();
                onOpenEditProfile();
              }}
              className="px-3 py-1.5 rounded-xl bg-[#2F6FED]/15 hover:bg-[#2F6FED]/25 text-[#2F6FED] border border-[#2F6FED]/30 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>
          </div>

          {/* Reset Confirmation Notice if active */}
          {showResetConfirm && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-white animate-in fade-in space-y-2">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-red-300">Reset All Demo Data?</h4>
                  <p className="text-[11px] text-white/70 mt-0.5">
                    This will restore sample users, posts, groups, and notifications to their initial states.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2 justify-end">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white/70 hover:text-white rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    vibrateStreakMilestone();
                    onResetData();
                    setShowResetConfirm(false);
                    onClose();
                  }}
                  className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold"
                >
                  Confirm Reset
                </button>
              </div>
            </div>
          )}

          {/* Feature Hub Section */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-white/40 px-1">
              Personal Tools & Hubs
            </span>

            {/* 1. Person Dossier */}
            <button
              type="button"
              onClick={() => {
                vibrateLight();
                onClose();
                onOpenDossier();
              }}
              className="w-full p-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-[#2F6FED]/40 transition-all flex items-center justify-between text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 group-hover:scale-105 transition-transform">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-white group-hover:text-[#2F6FED] transition-colors">
                      Person Dossier
                    </span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#2F6FED]/15 text-[#2F6FED] border border-[#2F6FED]/30">
                      Pillars & Diary
                    </span>
                  </div>
                  <p className="text-[10px] text-white/50 mt-0.5">
                    Core identity pillars, proof chronology & daily timeline
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>

            {/* 2. Analytics & Insights */}
            <button
              type="button"
              onClick={() => {
                vibrateLight();
                onClose();
                onOpenAnalytics();
              }}
              className="w-full p-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 transition-all flex items-center justify-between text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 group-hover:scale-105 transition-transform">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-white group-hover:text-cyan-300 transition-colors">
                      Analytics & Insights
                    </span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                      {totalLikes} likes • {totalComments} comments
                    </span>
                  </div>
                  <p className="text-[10px] text-white/50 mt-0.5">
                    Engagement trends, post reach, and interaction statistics
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>

            {/* 3. Saved Proofs */}
            <button
              type="button"
              onClick={() => {
                vibrateLight();
                onClose();
                onOpenSaved();
              }}
              className="w-full p-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 transition-all flex items-center justify-between text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 group-hover:scale-105 transition-transform">
                  <Bookmark className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-white group-hover:text-purple-300 transition-colors">
                      Saved Proofs
                    </span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
                      {savedPosts.length} saved
                    </span>
                  </div>
                  <p className="text-[10px] text-white/50 mt-0.5">
                    Bookmarked inspirations, methods, and routines
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>

            {/* 4. Drafts & Scheduled Queue */}
            <button
              type="button"
              onClick={() => {
                vibrateLight();
                onClose();
                onOpenDrafts();
              }}
              className="w-full p-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 transition-all flex items-center justify-between text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 group-hover:scale-105 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-white group-hover:text-amber-300 transition-colors">
                      Drafts & Scheduled
                    </span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      {drafts.length} drafts
                    </span>
                  </div>
                  <p className="text-[10px] text-white/50 mt-0.5">
                    Queued proofs, scheduled releases, and unfinished drafts
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>
          </div>

          {/* Account & Storage Actions */}
          <div className="space-y-2 pt-2 border-t border-white/5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-white/40 px-1">
              Account Management
            </span>

            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="w-full p-3.5 rounded-2xl bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 hover:border-red-500/30 transition-all flex items-center justify-between text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-red-300 group-hover:text-red-200">
                    Reset Demo Data
                  </span>
                  <p className="text-[10px] text-white/40 mt-0.5">
                    Restore sample users, initial posts & challenge states
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-red-400/40 group-hover:text-red-400 shrink-0" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
