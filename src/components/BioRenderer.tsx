import React from 'react';
import { Trophy } from 'lucide-react';
import { User, Challenge } from '../types';
import { DailyStorageService } from '../services/storage';
import { vibrateLight } from '../services/haptics';

interface BioRendererProps {
  bio?: string;
  onViewUser?: (user: { id: string; name: string; username: string; avatar: string; streak?: number }) => void;
  onOpenChallenge?: (challengeId: string) => void;
  className?: string;
}

export const BioRenderer: React.FC<BioRendererProps> = ({
  bio,
  onViewUser,
  onOpenChallenge,
  className = '',
}) => {
  if (!bio || !bio.trim()) return null;

  // Regex to match @username mentions
  const mentionRegex = /(@[a-zA-Z0-9_]+)/g;

  // Split lines
  const lines = bio.split('\n');

  const handleMentionClick = (e: React.MouseEvent, usernameWithAt: string) => {
    e.stopPropagation();
    vibrateLight();
    const cleanUsername = usernameWithAt.replace('@', '').toLowerCase().trim();
    const allUsers = DailyStorageService.getAllUsers();
    let matched = allUsers.find(
      (u) => u.username.toLowerCase() === cleanUsername
    );
    if (!matched) {
      const currentUser = DailyStorageService.getCurrentUser();
      if (currentUser.username.toLowerCase() === cleanUsername) {
        matched = currentUser;
      }
    }

    if (onViewUser) {
      if (matched) {
        onViewUser({
          id: matched.id,
          name: matched.name,
          username: matched.username,
          avatar: matched.avatar,
          streak: matched.currentStreak,
        });
      } else {
        // Fallback user profile with that username so profile modal opens
        onViewUser({
          id: `user_${cleanUsername}`,
          name: cleanUsername.charAt(0).toUpperCase() + cleanUsername.slice(1),
          username: cleanUsername,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanUsername}`,
          streak: 1,
        });
      }
    }
  };

  const handleChallengeClick = (e: React.MouseEvent, line: string) => {
    e.stopPropagation();
    vibrateLight();
    if (!onOpenChallenge) return;

    const rawText = line.replace(/^(🏆|completed:|challenge:|\[|\])/gi, '').trim().toLowerCase();
    const allChallenges = DailyStorageService.getAllChallenges();

    // Look for exact or partial match in challenge title, tag, or id
    const matched = allChallenges.find(
      (c) =>
        c.title.toLowerCase().includes(rawText) ||
        rawText.includes(c.title.toLowerCase()) ||
        c.tag.toLowerCase().includes(rawText) ||
        rawText.includes(c.tag.toLowerCase()) ||
        c.id === rawText
    );

    if (matched) {
      onOpenChallenge(matched.id);
    } else if (allChallenges.length > 0) {
      // Direct to first active challenge if query was generic
      onOpenChallenge(allChallenges[0].id);
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
            <button
              key={lineIdx}
              type="button"
              onClick={(e) => handleChallengeClick(e, line)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 hover:border-amber-500/45 text-amber-300 font-medium text-[11px] my-0.5 cursor-pointer transition-all group text-left"
              title="Click to redirect to this challenge"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0 group-hover:scale-110 transition-transform" />
              <span className="underline decoration-amber-400/40 group-hover:decoration-amber-400">
                {line.replace(/^\[|\]$/g, '').trim()}
              </span>
            </button>
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
                    title={`View @${part.replace('@', '')}'s profile`}
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
