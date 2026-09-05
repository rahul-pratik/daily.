import React, { useState } from 'react';
import {
  X,
  Bell,
  Heart,
  MessageSquare,
  UserPlus,
  Flame,
  ShieldCheck,
  CheckCheck,
  Trash2,
  Sparkles,
  ArrowRight,
  Filter,
  Trophy,
} from 'lucide-react';
import { AppNotification, NotificationType, User, Post } from '../types';
import { vibrateLight } from '../services/haptics';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  currentUser: User;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onViewPost?: (postId: string) => void;
  onViewUser?: (user: { id: string; name: string; username: string; avatar: string; streak: number }) => void;
  onOpenCommunity?: (communityId: string) => void;
  onOpenChallenge?: (challengeId: string) => void;
  onToggleFollow?: (userId: string) => void;
  onOpenStreakFreezeAlert?: () => void;
}

type NotificationFilter = 'all' | 'unread' | 'like' | 'comment' | 'follow' | 'challenge';

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  currentUser,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  onViewPost,
  onViewUser,
  onOpenCommunity,
  onOpenChallenge,
  onToggleFollow,
  onOpenStreakFreezeAlert,
}) => {
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>('all');

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'unread') return !n.isRead;
    if (activeFilter === 'like') return n.type === 'like';
    if (activeFilter === 'comment') return n.type === 'comment';
    if (activeFilter === 'follow') return n.type === 'follow';
    if (activeFilter === 'challenge') return n.type === 'challenge_invite';
    return true;
  });

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'like':
        return (
          <div className="w-5 h-5 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
            <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
          </div>
        );
      case 'comment':
        return (
          <div className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <MessageSquare className="w-3 h-3" />
          </div>
        );
      case 'follow':
        return (
          <div className="w-5 h-5 rounded-full bg-[#2F6FED]/20 border border-[#2F6FED]/40 flex items-center justify-center text-[#2F6FED]">
            <UserPlus className="w-3 h-3" />
          </div>
        );
      case 'challenge_invite':
        return (
          <div className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Trophy className="w-3 h-3" />
          </div>
        );
      case 'community_request':
      case 'community_approved':
        return (
          <div className="w-5 h-5 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
            <ShieldCheck className="w-3 h-3" />
          </div>
        );
      case 'streak_freeze_used':
        return (
          <div className="w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <ShieldCheck className="w-3 h-3 text-cyan-400" />
          </div>
        );
      case 'streak_freeze_earned':
        return (
          <div className="w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Sparkles className="w-3 h-3 text-cyan-400" />
          </div>
        );
      case 'challenge_badge':
        return (
          <div className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
            <Trophy className="w-3 h-3 text-amber-400" />
          </div>
        );
      case 'streak_milestone':
      default:
        return (
          <div className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-[#2F6FED]">
            <Flame className="w-3 h-3 fill-[#2F6FED]" />
          </div>
        );
    }
  };

  const handleNotificationClick = (n: AppNotification) => {
    vibrateLight();
    if (!n.isRead) {
      onMarkAsRead(n.id);
    }

    if (n.type === 'streak_freeze_used' && onOpenStreakFreezeAlert) {
      onOpenStreakFreezeAlert();
      onClose();
      return;
    }

    if (n.targetId && onOpenChallenge && n.type === 'challenge_invite') {
      onOpenChallenge(n.targetId);
      onClose();
    } else if (n.targetId && onViewPost && (n.type === 'like' || n.type === 'comment')) {
      onViewPost(n.targetId);
      onClose();
    } else if (n.targetId && onOpenCommunity && (n.type === 'community_approved' || n.type === 'community_request')) {
      onOpenCommunity(n.targetId);
      onClose();
    } else if (n.actorId && n.actorId !== 'system' && onViewUser) {
      onViewUser({
        id: n.actorId,
        name: n.actorName,
        username: n.actorUsername,
        avatar: n.actorAvatar,
        streak: n.actorStreak || 1,
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 animate-in fade-in">
      <div className="bg-[#0A0A0A] border border-white/10 w-full max-w-lg rounded-[32px] overflow-hidden flex flex-col max-h-[90vh] shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#2F6FED]/10 border border-[#2F6FED]/30 flex items-center justify-center text-[#2F6FED]">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white">Notifications</h2>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-[#2F6FED] text-white font-black text-[10px]">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-[11px] text-white/50">Interactions, cheers & activity updates</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {notifications.length > 0 && (
              <>
                {unreadCount > 0 && (
                  <button
                    onClick={() => {
                      vibrateLight();
                      onMarkAllAsRead();
                    }}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors text-xs font-bold flex items-center gap-1 min-h-[38px]"
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-4 h-4 text-[#2F6FED]" />
                  </button>
                )}
                <button
                  onClick={() => {
                    vibrateLight();
                    onClearAll();
                  }}
                  className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-white/60 hover:text-red-400 transition-colors text-xs min-h-[38px]"
                  title="Clear all notifications"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="px-4 py-2.5 border-b border-white/5 flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-white/[0.02]">
          {[
            { id: 'all', label: 'All', count: notifications.length },
            { id: 'unread', label: 'Unread', count: unreadCount },
            { id: 'like', label: 'Likes ❤️' },
            { id: 'comment', label: 'Comments 💬' },
            { id: 'follow', label: 'Follows 👥' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                vibrateLight();
                setActiveFilter(tab.id as NotificationFilter);
              }}
              className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all border ${
                activeFilter === tab.id
                  ? 'bg-[#2F6FED] text-white border-[#2F6FED]'
                  : 'bg-white/5 text-white/60 border-white/10 hover:text-white hover:border-white/20'
              }`}
            >
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && tab.count > 0 && (
                <span className="ml-1 opacity-80 text-[9px]">({tab.count})</span>
              )}
            </button>
          ))}
        </div>

        {/* Notification List Stream */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((n) => {
              const isFollowingActor = currentUser.followedUserIds.includes(n.actorId);
              return (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 relative group ${
                    n.isRead
                      ? 'bg-white/[0.02] border-white/5 hover:bg-white/5 hover:border-white/15'
                      : 'bg-white/[0.06] border-[#2F6FED]/30 hover:border-[#2F6FED]/50 shadow-md shadow-black/40'
                  }`}
                >
                  {/* Actor Avatar with badge */}
                  <div className="relative shrink-0">
                    <img
                      src={n.actorAvatar}
                      alt={n.actorName}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full object-cover border border-white/10"
                    />
                    <div className="absolute -bottom-1 -right-1">
                      {getNotificationIcon(n.type)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-xs text-white leading-snug">
                        <span className="font-bold text-white group-hover:text-[#2F6FED] transition-colors mr-1">
                          {n.actorName}
                        </span>
                        <span className="text-white/80">{n.message}</span>
                      </p>
                      <span className="text-[10px] text-white/40 whitespace-nowrap shrink-0">
                        {n.createdAt}
                      </span>
                    </div>

                    {/* Preview snippet or target image */}
                    {n.targetPreview && (
                      <p className="text-[11px] text-white/50 bg-black/40 px-2.5 py-1 rounded-lg border border-white/5 mt-1.5 line-clamp-1 italic">
                        "{n.targetPreview}"
                      </p>
                    )}

                    {/* Follow Back button if follow notification */}
                    {n.type === 'follow' && onToggleFollow && n.actorId !== currentUser.id && (
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            vibrateLight();
                            onToggleFollow(n.actorId);
                          }}
                          className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                            isFollowingActor
                              ? 'bg-white/10 text-white/80 border border-white/10'
                              : 'bg-[#2F6FED] text-white shadow-md shadow-[#2F6FED]/20'
                          }`}
                        >
                          {isFollowingActor ? 'Following' : 'Follow Back'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Target Thumbnail if post image exists */}
                  {n.targetImage && (
                    <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-white/10 bg-white/5">
                      <img
                        src={n.targetImage}
                        alt="Post Preview"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Unread indicator dot */}
                  {!n.isRead && (
                    <span className="w-2 h-2 rounded-full bg-[#2F6FED] absolute top-3.5 right-3 shadow-sm shadow-[#2F6FED]" />
                  )}
                </div>
              );
            })
          ) : (
            <div className="py-16 px-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3 text-white/40">
                <Bell className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-sm">No notifications yet</h3>
              <p className="text-xs text-white/50 mt-1 max-w-xs mx-auto">
                {activeFilter === 'unread'
                  ? 'All caught up! You have zero unread notifications.'
                  : 'When people like your proofs, comment, or start following you, updates will show up here.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
