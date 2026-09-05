import React, { useState } from 'react';
import { X, Send, Copy, Check, Users, MessageSquare, ShieldCheck, Sparkles } from 'lucide-react';
import { User, Group } from '../types';
import { DailyStorageService } from '../services/storage';
import { vibrateLight, vibrateStreakMilestone } from '../services/haptics';

interface ShareProfileIdModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
}

export const ShareProfileIdModal: React.FC<ShareProfileIdModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [activeCategory, setActiveCategory] = useState<'chats' | 'groups'>('chats');
  const [copiedId, setCopiedId] = useState(false);
  const [sentTargetId, setSentTargetId] = useState<string | null>(null);

  if (!isOpen) return null;

  const users = DailyStorageService.getAllUsers().filter((u) => u.id !== currentUser.id);
  const groups = DailyStorageService.getAllGroups();

  const handleCopyId = () => {
    vibrateLight();
    navigator.clipboard?.writeText(currentUser.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleSendToChat = (user: User) => {
    vibrateStreakMilestone();
    const shareText = `👋 Connect with me on Daily!\n👤 ${currentUser.name} (@${currentUser.username})\n🆔 User ID: ${currentUser.id}\nCheck out my daily proofs and progress!`;
    
    DailyStorageService.sendMessage({
      receiverId: user.id,
      text: shareText,
    });

    setSentTargetId(user.id);
    setTimeout(() => setSentTargetId(null), 2500);
  };

  const handleSendToGroup = (group: Group) => {
    vibrateStreakMilestone();
    const shareText = `👋 Squad check-in! Here's my profile ID to connect:\n👤 ${currentUser.name} (@${currentUser.username})\n🆔 User ID: ${currentUser.id}`;
    
    DailyStorageService.sendMessage({
      groupId: group.id,
      text: shareText,
    });

    setSentTargetId(group.id);
    setTimeout(() => setSentTargetId(null), 2500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#0A0A0A] border-t sm:border border-white/15 rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl text-white max-h-[88vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-white flex items-center gap-1.5">
              <span>Share Profile ID</span>
            </h2>
            <p className="text-[11px] text-white/50">Send your ID card to direct chats & groups</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Card Preview */}
        <div className="p-4 border-b border-white/5 bg-gradient-to-r from-blue-950/20 via-black to-slate-900/20">
          <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-full overflow-hidden border border-white/20 shrink-0">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs font-black text-white truncate">{currentUser.name}</h3>
                <p className="text-[11px] text-white/60 font-mono">@{currentUser.username}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#2F6FED]/15 text-[#2F6FED] border border-[#2F6FED]/30">
                    ID: {currentUser.id}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleCopyId}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all flex items-center gap-1 shrink-0 border border-white/10"
              title="Copy User ID"
            >
              {copiedId ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy ID</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Category Tabs: Chats vs Groups */}
        <div className="p-3 border-b border-white/5 flex gap-2">
          <button
            type="button"
            onClick={() => {
              vibrateLight();
              setActiveCategory('chats');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeCategory === 'chats'
                ? 'bg-white text-black shadow-sm'
                : 'bg-white/5 text-white/60 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Direct Chats ({users.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              vibrateLight();
              setActiveCategory('groups');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeCategory === 'groups'
                ? 'bg-white text-black shadow-sm'
                : 'bg-white/5 text-white/60 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Groups & Squads ({groups.length})</span>
          </button>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {activeCategory === 'chats' ? (
            users.length > 0 ? (
              users.map((user) => {
                const isSent = sentTargetId === user.id;
                return (
                  <div
                    key={user.id}
                    className="p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-white/10 transition-all flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 shrink-0">
                        <img
                          src={user.avatar}
                          alt={user.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">
                          {user.name}
                        </h4>
                        <p className="text-[11px] text-white/50 font-mono truncate">
                          @{user.username}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSendToChat(user)}
                      disabled={isSent}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        isSent
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-[#2F6FED] hover:bg-[#2861d6] text-white shadow-sm active:scale-95'
                      }`}
                    >
                      {isSent ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Sent!</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Send ID</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-xs text-white/40">
                No active contacts yet.
              </div>
            )
          ) : groups.length > 0 ? (
            groups.map((group) => {
              const isSent = sentTargetId === group.id;
              return (
                <div
                  key={group.id}
                  className="p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-white/10 transition-all flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0 text-lg">
                      {group.category === 'Running'
                        ? '🏃'
                        : group.category === 'Coding'
                        ? '💻'
                        : group.category === 'Gym'
                        ? '🏋️'
                        : '🔥'}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">{group.name}</h4>
                      <p className="text-[11px] text-white/50 truncate">
                        {group.memberCount || group.memberIds?.length || 1} members
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSendToGroup(group)}
                    disabled={isSent}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isSent
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-[#2F6FED] hover:bg-[#2861d6] text-white shadow-sm active:scale-95'
                    }`}
                  >
                    {isSent ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Sent!</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Send to Group</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-xs text-white/40">No groups joined yet.</div>
          )}
        </div>
      </div>
    </div>
  );
};
