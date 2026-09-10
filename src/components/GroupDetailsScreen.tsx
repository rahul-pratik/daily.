import React, { useState } from 'react';
import {
  ArrowLeft,
  Users,
  Shield,
  Crown,
  UserMinus,
  UserPlus,
  Image as ImageIcon,
  Pin,
  Search,
  Check,
  Globe,
  X,
  Sparkles,
} from 'lucide-react';
import { Group, User, Message } from '../types';
import { vibrateLight, vibrateStreakMilestone } from '../services/haptics';

interface GroupDetailsScreenProps {
  group: Group;
  currentUser: User;
  allUsers: User[];
  messages: Message[];
  onBack: () => void;
  onAddMembers: (newMemberIds: string[]) => void;
  onRemoveMember: (memberId: string) => void;
  onToggleAdmin: (memberId: string) => void;
  onExpandPhoto: (photoUrl: string) => void;
  onTogglePinMessage?: (messageId: string) => void;
  onViewUser?: (user: {
    id: string;
    name: string;
    username: string;
    avatar: string;
    currentStreak: number;
  }) => void;
}

export const GroupDetailsScreen: React.FC<GroupDetailsScreenProps> = ({
  group,
  currentUser,
  allUsers,
  messages,
  onBack,
  onAddMembers,
  onRemoveMember,
  onToggleAdmin,
  onExpandPhoto,
  onTogglePinMessage,
  onViewUser,
}) => {
  const [isAddMembersOpen, setIsAddMembersOpen] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [selectedNewMemberIds, setSelectedNewMemberIds] = useState<string[]>([]);
  const [memberFilterQuery, setMemberFilterQuery] = useState('');
  const [memberPendingRemove, setMemberPendingRemove] = useState<User | null>(null);

  const adminIds = group.adminIds && group.adminIds.length > 0
    ? group.adminIds
    : [group.createdBy];

  const isCurrentUserAdmin = Boolean(
    adminIds.includes(currentUser.id) || group.createdBy === currentUser.id
  );

  // Group members list
  const currentMemberIds = group.memberIds || [];
  const groupMembers = currentMemberIds.map((id) => {
    const found = allUsers.find((u) => u.id === id);
    if (found) return found;
    return {
      id,
      name: id === currentUser.id ? currentUser.name : 'Community Member',
      username: id === currentUser.id ? currentUser.username : 'member',
      avatar: id === currentUser.id ? currentUser.avatar : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      bio: '',
      joinedDate: 'Recently',
      currentStreak: 1,
      longestStreak: 1,
      proofCount: 1,
      totalProofsCount: 1,
      habits: [],
      interests: [],
      isPrivate: false,
      followersCount: 0,
      followingCount: 0,
      totalPosts: 1,
      activityDates: [],
      followedUserIds: [],
    } as unknown as User;
  });

  const filteredGroupMembers = groupMembers.filter((m) => {
    if (!memberFilterQuery.trim()) return true;
    const q = memberFilterQuery.toLowerCase();
    return m.name.toLowerCase().includes(q) || m.username.toLowerCase().includes(q);
  });

  // Photos uploaded in this group
  const groupPhotos: { url: string; messageId: string; isPinned: boolean }[] = [];
  messages.forEach((m) => {
    if (m.groupId === group.id && m.imageUrl) {
      groupPhotos.push({
        url: m.imageUrl,
        messageId: m.id,
        isPinned: Boolean(m.isPinned),
      });
    }
  });

  // Non-member users for adding
  const availableToAdd = allUsers.filter((u) => !currentMemberIds.includes(u.id) && u.id !== currentUser.id);

  const filteredAvailableToAdd = availableToAdd.filter((u) => {
    if (!memberSearchQuery.trim()) return true;
    const q = memberSearchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      (u.bio && u.bio.toLowerCase().includes(q)) ||
      (u.habits && u.habits.some((h) => h.toLowerCase().includes(q))) ||
      (u.interests && u.interests.some((i) => i.toLowerCase().includes(q)))
    );
  });

  const toggleSelectNewMember = (userId: string) => {
    vibrateLight();
    setSelectedNewMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleConfirmAddMembers = () => {
    if (selectedNewMemberIds.length === 0) return;
    vibrateStreakMilestone();
    onAddMembers(selectedNewMemberIds);
    setSelectedNewMemberIds([]);
    setMemberSearchQuery('');
    setIsAddMembersOpen(false);
  };

  const creatorUser = allUsers.find((u) => u.id === group.createdBy);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#050505] text-white overflow-y-auto">
      {/* Top Header */}
      <div className="sticky top-0 z-20 px-4 py-3 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/10 flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            vibrateLight();
            onBack();
          }}
          className="p-2 -ml-2 text-white/70 hover:text-white rounded-xl hover:bg-white/10 transition-colors flex items-center gap-1 text-xs font-semibold"
          aria-label="Back to chat"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Chat</span>
        </button>

        <h2 className="font-bold text-sm text-white truncate max-w-[200px]">
          {group.name}
        </h2>

        <div className="w-8" />
      </div>

      <div className="p-4 space-y-5 max-w-lg mx-auto w-full">
        {/* Group Profile Overview */}
        <div className="bg-[#0e0e12] border border-white/10 rounded-3xl p-5 flex flex-col items-center text-center relative overflow-hidden shadow-xl">
          <div className="relative mb-3">
            <img
              src={group.avatar}
              alt={group.name}
              referrerPolicy="no-referrer"
              className="w-20 h-20 rounded-3xl object-cover border-2 border-blue-500/40 shadow-lg shadow-blue-500/10"
            />
            {isCurrentUserAdmin && (
              <div
                className="absolute -bottom-1 -right-1 bg-amber-500 text-black p-1.5 rounded-xl shadow-md border-2 border-[#0e0e12]"
                title="You are an admin"
              >
                <Crown className="w-3.5 h-3.5 fill-current" />
              </div>
            )}
          </div>

          <h1 className="font-black text-lg text-white tracking-tight">
            {group.name}
          </h1>

          <div className="flex items-center gap-2 mt-1 flex-wrap justify-center">
            <span className="text-[11px] bg-blue-500/15 border border-blue-500/30 text-blue-300 font-bold px-2.5 py-0.5 rounded-full">
              #{group.category || 'General'}
            </span>
            <span className="text-[11px] bg-white/5 border border-white/10 text-white/60 font-semibold px-2.5 py-0.5 rounded-full">
              {currentMemberIds.length} member{currentMemberIds.length !== 1 ? 's' : ''}
            </span>
            {isCurrentUserAdmin ? (
              <span className="text-[11px] bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Crown className="w-3 h-3 fill-current" />
                <span>You are Admin</span>
              </span>
            ) : (
              <span className="text-[11px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold px-2.5 py-0.5 rounded-full">
                Member
              </span>
            )}
          </div>

          {group.description && (
            <p className="text-xs text-white/70 mt-2.5 max-w-sm leading-relaxed">
              {group.description}
            </p>
          )}

          {group.pinnedTopic && (
            <div className="w-full mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-left flex items-start gap-2">
              <Pin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider block">
                  Pinned Topic & Goal
                </span>
                <p className="text-xs text-white font-medium mt-0.5">
                  {group.pinnedTopic}
                </p>
              </div>
            </div>
          )}

          <div className="mt-3 text-[10px] text-white/40 font-mono">
            Created by {creatorUser ? `@${creatorUser.username}` : 'Founder'} • {group.createdAt || 'Active'}
          </div>
        </div>

        {/* SHARED PHOTOS SECTION: Show all photos being uploaded in this group */}
        <div className="bg-[#0e0e12] border border-white/10 rounded-3xl p-4 space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300">
                <ImageIcon className="w-4 h-4" />
              </div>
              <h3 className="font-black text-sm text-white">
                Shared Photos & Proof
              </h3>
            </div>
            <span className="text-xs font-mono bg-white/5 px-2 py-0.5 rounded-full text-white/50 border border-white/10">
              {groupPhotos.length} photo{groupPhotos.length !== 1 ? 's' : ''}
            </span>
          </div>

          {groupPhotos.length > 0 ? (
            <div className="grid grid-cols-3 gap-2 pt-1">
              {groupPhotos.map((photo, idx) => (
                <div
                  key={idx}
                  className="aspect-square rounded-2xl overflow-hidden border border-white/10 bg-black/50 relative group"
                >
                  <button
                    type="button"
                    onClick={() => {
                      vibrateLight();
                      onExpandPhoto(photo.url);
                    }}
                    className="w-full h-full block"
                  >
                    <img
                      src={photo.url}
                      alt={`Group photo ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </button>

                  {/* Pin badge if pinned */}
                  {photo.isPinned && (
                    <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-md border border-amber-500/50 text-amber-300 text-[9px] font-bold flex items-center gap-1 shadow-md">
                      <Pin className="w-2.5 h-2.5 fill-amber-300" />
                      <span>Pinned</span>
                    </div>
                  )}

                  {/* Admin toggle pin button */}
                  {isCurrentUserAdmin && onTogglePinMessage && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        vibrateLight();
                        onTogglePinMessage(photo.messageId);
                      }}
                      className={`absolute top-2 right-2 p-1.5 rounded-lg backdrop-blur-md transition-all ${
                        photo.isPinned
                          ? 'bg-amber-500/90 text-black shadow-md'
                          : 'bg-black/60 opacity-0 group-hover:opacity-100 text-white hover:bg-black/80'
                      }`}
                      title={photo.isPinned ? 'Unpin photo' : 'Pin photo'}
                    >
                      <Pin className={`w-3 h-3 ${photo.isPinned ? 'fill-black' : ''}`} />
                    </button>
                  )}

                  <div
                    onClick={() => {
                      vibrateLight();
                      onExpandPhoto(photo.url);
                    }}
                    className="absolute inset-x-0 bottom-0 py-1 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold cursor-pointer"
                  >
                    View
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 px-4 text-center rounded-2xl bg-white/[0.02] border border-dashed border-white/10">
              <ImageIcon className="w-8 h-8 text-white/20 mx-auto mb-2" />
              <p className="text-xs font-bold text-white/70">No photos shared yet</p>
              <p className="text-[11px] text-white/40 mt-0.5">
                Photos, progress snapshots, and proof receipts uploaded to this chat will appear here.
              </p>
            </div>
          )}
        </div>

        {/* MEMBERS & ADMIN MANAGEMENT SECTION */}
        <div className="bg-[#0e0e12] border border-white/10 rounded-3xl p-4 space-y-4 shadow-xl">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-300">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-black text-sm text-white">
                  Group Members
                </h3>
                <span className="text-[10px] text-white/40">
                  {currentMemberIds.length} members total
                </span>
              </div>
            </div>

            {/* ADMIN ONLY: Add new members button */}
            {isCurrentUserAdmin && (
              <button
                type="button"
                onClick={() => {
                  vibrateLight();
                  setIsAddMembersOpen(true);
                }}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-blue-500/20 active:scale-95"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add Members</span>
              </button>
            )}
          </div>

          {/* Admin Capabilities Notice */}
          {isCurrentUserAdmin ? (
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-[11px]">
                You have admin privileges. You can add new members, assign other admins, or remove members.
              </span>
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs text-white/50 flex items-center gap-2">
              <Shield className="w-4 h-4 text-white/40 shrink-0" />
              <span className="text-[11px]">
                Admins can manage group members and settings.
              </span>
            </div>
          )}

          {/* Member Search within group */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={memberFilterQuery}
              onChange={(e) => setMemberFilterQuery(e.target.value)}
              placeholder="Search group members..."
              className="w-full pl-8 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:border-blue-500 outline-none transition-colors"
            />
          </div>

          {/* Member List */}
          <div className="space-y-2">
            {filteredGroupMembers.map((member) => {
              const isMemberAdmin = adminIds.includes(member.id);
              const isCreator = member.id === group.createdBy;
              const isSelf = member.id === currentUser.id;

              return (
                <div
                  key={member.id}
                  className="p-2.5 bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 rounded-2xl flex items-center justify-between gap-3 transition-colors"
                >
                  <div
                    className="flex items-center gap-3 min-w-0 cursor-pointer"
                    onClick={() => {
                      if (onViewUser) {
                        onViewUser({
                          id: member.id,
                          name: member.name,
                          username: member.username,
                          avatar: member.avatar,
                          currentStreak: member.currentStreak || 1,
                        });
                      }
                    }}
                  >
                    <div className="relative">
                      <img
                        src={member.avatar}
                        alt={member.name}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-2xl object-cover border border-white/10 shrink-0"
                      />
                      {isMemberAdmin && (
                        <div className="absolute -top-1 -right-1 bg-amber-500 text-black p-0.5 rounded-md text-[9px] shadow-sm">
                          <Crown className="w-2.5 h-2.5 fill-current" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-xs font-bold text-white truncate">
                          {member.name}
                        </p>
                        {isSelf && (
                          <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.2 rounded font-semibold">
                            You
                          </span>
                        )}
                        {isCreator && (
                          <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.2 rounded font-semibold">
                            Creator
                          </span>
                        )}
                        {isMemberAdmin && !isCreator && (
                          <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-semibold">
                            Admin
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-white/40 truncate">
                        @{member.username} • <span className="text-[#2F6FED]">🔥{member.currentStreak || 1}d</span>
                      </p>
                    </div>
                  </div>

                  {/* ADMIN ONLY CONTROLS: Show remove and assign admin buttons if current user is admin */}
                  {isCurrentUserAdmin && !isCreator && !isSelf && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Assign / Dismiss Admin Button */}
                      <button
                        type="button"
                        onClick={() => {
                          vibrateLight();
                          onToggleAdmin(member.id);
                        }}
                        className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-colors flex items-center gap-1 ${
                          isMemberAdmin
                            ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25'
                            : 'bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10'
                        }`}
                        title={isMemberAdmin ? 'Dismiss as Admin' : 'Assign as Admin'}
                      >
                        <Crown className="w-3 h-3" />
                        <span>{isMemberAdmin ? 'Demote' : 'Make Admin'}</span>
                      </button>

                      {/* Remove Member Button */}
                      <button
                        type="button"
                        onClick={() => {
                          vibrateLight();
                          setMemberPendingRemove(member);
                        }}
                        className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-400 transition-colors"
                        title="Remove from group"
                        aria-label={`Remove ${member.name} from group`}
                      >
                        <UserMinus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Confirmation Modal: Remove Member */}
      {memberPendingRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-[#0e0e12] border border-white/15 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
              <UserMinus className="w-5 h-5" />
            </div>

            <div className="text-center space-y-1">
              <h4 className="font-bold text-sm text-white">
                Remove {memberPendingRemove.name}?
              </h4>
              <p className="text-xs text-white/60">
                They will be removed from this group chat and won't be able to send or view new messages.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setMemberPendingRemove(null)}
                className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  vibrateStreakMilestone();
                  onRemoveMember(memberPendingRemove.id);
                  setMemberPendingRemove(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors shadow-lg shadow-rose-600/20"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD MEMBERS MODAL: Search members all across the world */}
      {isAddMembersOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#0A0A0A] border-t sm:border border-white/10 rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl text-white max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-white">Add Members to Group</h3>
                  <span className="text-[10px] text-white/40">
                    Find and invite members from across the world
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsAddMembersOpen(false);
                  setSelectedNewMemberIds([]);
                  setMemberSearchQuery('');
                }}
                className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full text-white/40 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Global Member Search Bar */}
            <div className="p-4 border-b border-white/5 space-y-2 bg-[#0d0d10]">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  placeholder="Search members all across the world..."
                  className="w-full pl-9 pr-8 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-white/40 focus:border-blue-500 outline-none transition-colors"
                />
                {memberSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setMemberSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <p className="text-[10px] text-white/40 flex items-center gap-1">
                <Globe className="w-3 h-3 text-blue-400" />
                <span>Invited members will receive an instant group invite notification.</span>
              </p>
            </div>

            {/* Search Results */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-64 no-scrollbar">
              {filteredAvailableToAdd.length === 0 ? (
                <div className="py-8 text-center text-xs text-white/40">
                  {memberSearchQuery ? `No members found matching "${memberSearchQuery}".` : 'All available members are already in this group.'}
                </div>
              ) : (
                filteredAvailableToAdd.map((u) => {
                  const isSelected = selectedNewMemberIds.includes(u.id);
                  return (
                    <div
                      key={u.id}
                      onClick={() => toggleSelectNewMember(u.id)}
                      className={`p-2.5 rounded-2xl flex items-center justify-between cursor-pointer border transition-all ${
                        isSelected
                          ? 'bg-blue-500/10 border-blue-500/30'
                          : 'bg-white/5 hover:bg-white/10 border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={u.avatar}
                          alt={u.name}
                          referrerPolicy="no-referrer"
                          className="w-8 h-8 rounded-full object-cover border border-white/10 shrink-0"
                        />
                        <div className="truncate">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-bold text-white truncate">
                              {u.name}
                            </p>
                            <span className="text-[9px] bg-white/10 text-white/60 px-1 rounded">
                              🌍 Global
                            </span>
                          </div>
                          <p className="text-[10px] text-white/40 truncate">
                            @{u.username} • <span className="text-[#2F6FED]">🔥{u.currentStreak || 1}d</span>
                          </p>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                          isSelected
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'border-white/20 text-transparent'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-white/5 bg-[#0a0a0a]">
              <button
                type="button"
                disabled={selectedNewMemberIds.length === 0}
                onClick={handleConfirmAddMembers}
                className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20"
              >
                <UserPlus className="w-4 h-4" />
                <span>
                  Invite {selectedNewMemberIds.length} Member{selectedNewMemberIds.length !== 1 ? 's' : ''} to Group
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
