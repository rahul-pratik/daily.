import React from 'react';
import { Sparkles, Compass, MessageSquare, PlusCircle, Search, Filter, Flame, Users, Bookmark } from 'lucide-react';

interface EmptyStateIllustrationProps {
  type: 'feed' | 'following' | 'interests' | 'messages' | 'search' | 'saved' | 'collections';
  title: string;
  description: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyStateIllustration: React.FC<EmptyStateIllustrationProps> = ({
  type,
  title,
  description,
  primaryAction,
  secondaryAction,
}) => {
  const renderGraphic = () => {
    switch (type) {
      case 'feed':
      case 'following':
        return (
          <div className="relative w-24 h-24 mx-auto mb-4 flex items-center justify-center">
            {/* Ambient golden glow circle */}
            <div className="absolute inset-0 rounded-full bg-[#D4AF37]/10 blur-xl animate-pulse" />
            <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-white/10 to-white/[0.02] border border-white/15 p-4 flex flex-col items-center justify-center shadow-2xl">
              <div className="w-10 h-10 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
                <Flame className="w-5 h-5 fill-[#D4AF37]" />
              </div>
              <div className="flex gap-1 mt-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
                <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
              </div>
            </div>
          </div>
        );

      case 'interests':
        return (
          <div className="relative w-24 h-24 mx-auto mb-4 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-[#D4AF37]/10 blur-xl" />
            <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-white/10 to-white/[0.02] border border-white/15 p-4 flex flex-col items-center justify-center shadow-2xl">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-[#D4AF37]">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="text-[9px] font-bold text-white/50 mt-1 uppercase tracking-wider">Interests</span>
            </div>
          </div>
        );

      case 'messages':
        return (
          <div className="relative w-24 h-24 mx-auto mb-4 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-[#D4AF37]/10 blur-xl animate-pulse" />
            <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-white/10 to-white/[0.02] border border-white/15 p-4 flex flex-col items-center justify-center shadow-2xl">
              <div className="w-10 h-10 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-1 mt-2">
                <span className="w-2 h-1 rounded-full bg-[#D4AF37]" />
                <span className="w-3 h-1 rounded-full bg-white/40" />
              </div>
            </div>
          </div>
        );

      case 'search':
        return (
          <div className="relative w-24 h-24 mx-auto mb-4 flex items-center justify-center">
            <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-white/10 to-white/[0.02] border border-white/15 p-4 flex flex-col items-center justify-center shadow-2xl">
              <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white/70">
                <Search className="w-5 h-5" />
              </div>
            </div>
          </div>
        );

      case 'collections':
        return (
          <div className="relative w-24 h-24 mx-auto mb-4 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-[#D4AF37]/10 blur-xl" />
            <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-white/10 to-white/[0.02] border border-white/15 p-4 flex flex-col items-center justify-center shadow-2xl">
              <div className="w-10 h-10 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] text-lg">
                📁
              </div>
              <span className="text-[9px] font-bold text-white/50 mt-1 uppercase tracking-wider">Proof Box</span>
            </div>
          </div>
        );

      case 'saved':
      default:
        return (
          <div className="relative w-24 h-24 mx-auto mb-4 flex items-center justify-center">
            <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-white/10 to-white/[0.02] border border-white/15 p-4 flex flex-col items-center justify-center shadow-2xl">
              <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white/70">
                <Bookmark className="w-5 h-5" />
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="py-12 px-6 text-center bg-gradient-to-b from-white/[0.04] to-transparent rounded-[32px] border border-white/10 my-4 shadow-xl">
      {renderGraphic()}

      <h3 className="font-black text-white text-base tracking-tight">{title}</h3>
      <p className="text-xs text-white/60 mt-1.5 max-w-sm mx-auto leading-relaxed">
        {description}
      </p>

      {(primaryAction || secondaryAction) && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-2.5">
          {primaryAction && (
            <button
              onClick={primaryAction.onClick}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#D4AF37] text-black font-black text-xs hover:bg-[#c49f2f] transition-all shadow-lg shadow-[#D4AF37]/20 flex items-center justify-center gap-2 active:scale-95 min-h-[42px]"
            >
              {primaryAction.icon}
              <span>{primaryAction.label}</span>
            </button>
          )}

          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors border border-white/10 active:scale-95 min-h-[42px]"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
