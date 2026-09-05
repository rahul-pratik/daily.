import React, { useState } from 'react';
import { X, Search, UserPlus, UserCheck, MessageSquare, Flame } from 'lucide-react';
import { User } from '../types';
import { DailyStorageService } from '../services/storage';
import { vibrateLight } from '../services/haptics';

interface UserConnectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'followers' | 'following';
  currentUser: User;
  onToggleFollow?: (userId: string) => void;
  onSendDM?: (targetUser: { id: string; name: string; username: string; avatar: string; streak: number }) => void;
  onUserSelect?: (user: User) => void;
}

export const UserConnectionsModal: React.FC<UserConnectionsModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'followers',
  currentUser,
  onToggleFollow,
  onSendDM,
  onUserSelect,
}) => {
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const allUsers = DailyStorageService.getAllUsers();

  // Following: users whose ID is in currentUser.followedUserIds
  const followingUsers = allUsers.filter(
    (u) => u.id !== currentUser.id && currentUser.followedUserIds.includes(u.id)
  );

  // Followers: users who follow currentUser (or sample users if array is empty)
  let followerUsers = allUsers.filter(
    (u) => u.id !== currentUser.id && (u.followedUserIds?.includes(currentUser.id) || ['user_sarah', 'user_elena', 'user_marcus'].includes(u.id))
  );

  // Filter based on active tab
  const activeList = activeTab === 'followers' ? followerUsers : followingUsers;

  // Filter based on search query
  const filteredList = activeList.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      u.name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      (u.bio && u.bio.toLowerCase().includes(q))
    );
  });

  const handleToggle = (userId: string) => {
    vibrateLight();
    if (onToggleFollow) {
      onToggleFollow(userId);
    } else {
      DailyStorageService.toggleFollowUser(userId);
    }
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
            <h2 className="text-base font-black text-white">Connections</h2>
            <p className="text-[11px] text-white/50">@{currentUser.username}'s network</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="p-3 border-b border-white/5 flex gap-2">
          <button
            type="button"
            onClick={() => {
              vibrateLight();
              setActiveTab('followers');
            }}
            className={`flex-1 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'followers'
                ? 'bg-white text-black shadow-md'
                : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            <span>Followers</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full ${
                activeTab === 'followers'
                  ? 'bg-black/10 text-black font-bold'
                  : 'bg-white/10 text-white/70'
              }`}
            >
              {currentUser.followersCount || followerUsers.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              vibrateLight();
              setActiveTab('following');
            }}
            className={`flex-1 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'following'
                ? 'bg-white text-black shadow-md'
                : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            <span>Following</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full ${
                activeTab === 'following'
                  ? 'bg-black/10 text-black font-bold'
                  : 'bg-white/10 text-white/70'
              }`}
            >
              {currentUser.followingCount || followingUsers.length}
            </span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-4 py-2 border-b border-white/5">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-white/40 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${activeTab}...`}
              className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 focus:border-[#2F6FED] rounded-xl text-xs text-white placeholder-white/40 outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 text-xs text-white/40 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredList.length > 0 ? (
            filteredList.map((user) => {
              const isFollowing = currentUser.followedUserIds.includes(user.id);
              return (
                <div
                  key={user.id}
                  className="p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-white/10 transition-all flex items-center justify-between gap-3"
                >
                  <div
                    onClick={() => {
                      if (onUserSelect) onUserSelect(user);
                    }}
                    className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                  >
                    <div className="w-11 h-11 rounded-full overflow-hidden border border-white/10 shrink-0 bg-white/5">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold text-white truncate hover:text-[#2F6FED] transition-colors">
                          {user.name}
                        </h4>
                      </div>
                      <p className="text-[11px] text-white/50 truncate font-mono">@{user.username}</p>
                      {user.bio && (
                        <p className="text-[10px] text-white/60 truncate mt-0.5">{user.bio}</p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {onSendDM && (
                      <button
                        onClick={() => {
                          vibrateLight();
                          onClose();
                          onSendDM({
                            id: user.id,
                            name: user.name,
                            username: user.username,
                            avatar: user.avatar,
                            streak: user.currentStreak,
                          });
                        }}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 transition-colors"
                        title={`Message @${user.username}`}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => handleToggle(user.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 min-h-[34px] ${
                        isFollowing
                          ? 'bg-white/10 hover:bg-red-500/20 text-white/80 hover:text-red-400 border border-white/10 hover:border-red-500/30'
                          : 'bg-[#2F6FED] hover:bg-[#2861d6] text-white shadow-sm'
                      }`}
                    >
                      {isFollowing ? (
                        <>
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Following</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Follow</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-xs text-white/40 space-y-1">
              <p className="font-semibold text-white/60">
                {searchQuery
                  ? `No users matching "${searchQuery}"`
                  : activeTab === 'followers'
                  ? 'No followers yet'
                  : 'Not following anyone yet'}
              </p>
              <p className="text-[11px]">
                {activeTab === 'followers'
                  ? 'Share your profile to build your network!'
                  : 'Discover creators in the feed and start connecting.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
