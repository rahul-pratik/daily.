import React from 'react';
import { Trophy, AtSign } from 'lucide-react';
import { User } from '../types';
import { DailyStorageService } from '../services/storage';
import { vibrateLight } from '../services/haptics';

interface BioRendererProps {
  bio?: string;
  onViewUser?: (user: { id: string; name: string; username: string; avatar: string; streak?: number }) => void;
  className?: string;
}

export const BioRenderer: React.FC<BioRendererProps> = ({
  bio,
  onViewUser,
  className = '',
}) => {
  if (!bio || !bio.trim()) return null;

  // Regex to split by @username or [Completed: ...] or 🏆 Completed: ...
  // Match @username
  const mentionRegex = /(@[a-zA-Z0-9_]+)/g;

  // Split lines or tokens
  const lines = bio.split('\n');

  const handleMentionClick = (e: React.MouseEvent, usernameWithAt: string) => {
    e.stopPropagation();
    vibrateLight();
    const cleanUsername = usernameWithAt.replace('@', '').toLowerCase();
    const allUsers = DailyStorageService.getAllUsers();
    const matched = allUsers.find(
      (u) => u.username.toLowerCase() === cleanUsername
    );
    if (matched && onViewUser) {
      onViewUser({
        id: matched.id,
        name: matched.name,
        username: matched.username,
        avatar: matched.avatar,
        streak: matched.currentStreak,
      });
    }
  };

  return (
    <div className={`text-xs text-white/80 leading-relaxed space-y-1 ${className}`}>
      {lines.map((line, lineIdx) => {
        // Check if line represents a completed challenge tag
        const isChallengeLine =
          line.toLowerCase().includes('completed:') ||
          line.toLowerCase().includes('🏆') ||
          line.toLowerCase().includes('challenge:');

        if (isChallengeLine) {
          return (
            <div
              key={lineIdx}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 font-medium text-[11px] my-0.5"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{line.replace(/^\[|\]$/g, '').trim()}</span>
            </div>
          );
        }

        // Render line with clickable @mentions
        const parts = line.split(mentionRegex);
        return (
          <p key={lineIdx} className="break-words">
            {parts.map((part, partIdx) => {
              if (part.startsWith('@')) {
                return (
                  <button
                    key={partIdx}
                    type="button"
                    onClick={(e) => handleMentionClick(e, part)}
                    className="text-[#5B8DEF] hover:text-white hover:underline font-bold transition-colors inline-flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>{part}</span>
                  </button>
                );
              }
              return <span key={partIdx}>{part}</span>;
            })}
          </p>
        );
      })}
    </div>
  );
};
