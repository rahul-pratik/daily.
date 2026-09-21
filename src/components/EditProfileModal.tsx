import React, { useState } from 'react';
import { X, Flame, Check, Upload, Save, Trophy, AtSign, Plus, RotateCcw, AlertCircle } from 'lucide-react';
import { User, AVAILABLE_INTERESTS, Challenge, DEFAULT_USER_AVATAR } from '../types';
import { vibrateLight } from '../services/haptics';
import { DailyStorageService } from '../services/storage';
import { isUsernameTakenInSupabase } from '../services/supabase';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onSave: (updated: Partial<User>) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSave,
}) => {
  const [name, setName] = useState(currentUser.name);
  const [username, setUsername] = useState(currentUser.username);
  const [avatar, setAvatar] = useState(currentUser.avatar);
  const [bio, setBio] = useState(currentUser.bio || '');
  const [interests, setInterests] = useState<string[]>(currentUser.interests || []);
  const [showChallengePicker, setShowChallengePicker] = useState(false);
  const [showMentionPicker, setShowMentionPicker] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);

  if (!isOpen) return null;

  // Retrieve user's completed or active challenges
  const allChallenges = DailyStorageService.getAllChallenges();
  const allUsers = DailyStorageService.getAllUsers().filter((u) => u.id !== currentUser.id);

  // Challenges user has participated in or completed
  const userChallenges = allChallenges.filter((c) =>
    (c.participantIds || []).includes(currentUser.id) ||
    c.createdBy === currentUser.id
  );
  const challengesToShow = userChallenges.length > 0 ? userChallenges : allChallenges;

  // Detect typing "challenge" or "@" in bio
  const handleBioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setBio(val);

    // Check if the user is typing "@"
    const lastAtIdx = val.lastIndexOf('@');
    if (lastAtIdx !== -1 && lastAtIdx === val.length - 1) {
      setShowMentionPicker(true);
      setShowChallengePicker(false);
      setMentionQuery('');
    } else if (lastAtIdx !== -1 && lastAtIdx > val.length - 15 && !val.slice(lastAtIdx).includes(' ')) {
      setShowMentionPicker(true);
      setMentionQuery(val.slice(lastAtIdx + 1).toLowerCase());
    } else {
      setShowMentionPicker(false);
    }

    // Check if user is typing "challenge" or "challenges"
    const lower = val.toLowerCase();
    const words = lower.split(/\s+/);
    const lastWord = words[words.length - 1] || '';
    if (lastWord === 'challenge' || lastWord === 'challenges' || lastWord.startsWith('challenge:')) {
      setShowChallengePicker(true);
      setShowMentionPicker(false);
    }
  };

  const handleSelectChallenge = (challenge: Challenge) => {
    vibrateLight();
    const challengeText = `🏆 Completed: ${challenge.title}`;
    // Replace "challenge" or "challenges" if at the end of bio, or append
    let newBio = bio.trim();
    if (newBio.toLowerCase().endsWith('challenges')) {
      newBio = newBio.slice(0, -'challenges'.length).trim();
    } else if (newBio.toLowerCase().endsWith('challenge')) {
      newBio = newBio.slice(0, -'challenge'.length).trim();
    }
    
    if (newBio.length > 0) {
      newBio += `\n${challengeText}`;
    } else {
      newBio = challengeText;
    }

    setBio(newBio.slice(0, 200));
    setShowChallengePicker(false);
  };

  const handleSelectMention = (targetUser: User) => {
    vibrateLight();
    const lastAtIdx = bio.lastIndexOf('@');
    let newBio = bio;
    if (lastAtIdx !== -1) {
      newBio = bio.slice(0, lastAtIdx) + `@${targetUser.username} `;
    } else {
      newBio += ` @${targetUser.username} `;
    }
    setBio(newBio.slice(0, 200));
    setShowMentionPicker(false);
  };

  const toggleInterest = (item: string) => {
    vibrateLight();
    if (interests.includes(item)) {
      setInterests(interests.filter((i) => i !== item));
    } else {
      setInterests([...interests, item]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setAvatar(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '') || currentUser.username.toLowerCase().replace(/[^a-z0-9_]/g, '');
    const currentClean = currentUser.username.toLowerCase().replace(/[^a-z0-9_]/g, '');

    if (cleanUsername !== currentClean) {
      setIsCheckingUsername(true);
      const isTaken = await isUsernameTakenInSupabase(cleanUsername, currentUser.id);
      setIsCheckingUsername(false);
      if (isTaken) {
        setUsernameError(`@${cleanUsername} is already registered by another creator. Please pick a unique handle.`);
        vibrateLight();
        return;
      }
    }

    onSave({
      name: name.trim() || currentUser.name,
      username: cleanUsername,
      avatar,
      bio: bio.trim(),
      interests,
      habits: currentUser.habits || [],
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#0A0A0A] border border-white/10 rounded-[32px] p-5 sm:p-6 shadow-2xl text-white my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div>
            <h2 className="font-black text-base text-white">Edit Profile</h2>
            <p className="text-[11px] text-white/50">Personal details & focus interests</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-white/40 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto py-3 space-y-4 pr-1 no-scrollbar">
          {/* Avatar */}
          <div className="flex flex-col items-center py-1">
            <div className="relative group">
              <img
                src={avatar}
                alt="Profile Avatar"
                referrerPolicy="no-referrer"
                className="w-18 h-18 rounded-full object-cover border-2 border-[#2F6FED] shadow-md ring-2 ring-[#2F6FED]/20"
              />
              <label className="absolute bottom-0 right-0 p-1.5 bg-[#2F6FED] hover:bg-blue-600 border border-black rounded-full text-white cursor-pointer shadow-md transition-all hover:scale-105 active:scale-95">
                <Upload className="w-3.5 h-3.5" />
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            <div className="flex items-center gap-2 mt-2.5">
              <label className="text-[11px] font-bold px-3 py-1 rounded-full bg-white/10 hover:bg-white/15 text-white cursor-pointer transition-colors flex items-center gap-1.5">
                <Upload className="w-3 h-3 text-[#2F6FED]" />
                Upload New Photo
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>

              {avatar !== DEFAULT_USER_AVATAR && (
                <button
                  type="button"
                  onClick={() => setAvatar(DEFAULT_USER_AVATAR)}
                  className="text-[11px] font-medium px-2.5 py-1 rounded-full text-white/50 hover:text-white/80 hover:bg-white/5 transition-colors"
                >
                  Reset to Default
                </button>
              )}
            </div>
          </div>

          {/* Name & Username */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-white/70 mb-1">Display Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 focus:border-[#2F6FED] rounded-xl text-xs text-white outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-white/70">
                  Username
                </label>
                {isCheckingUsername && (
                  <span className="text-[10px] text-[#2F6FED] font-medium animate-pulse">
                    Checking uniqueness...
                  </span>
                )}
              </div>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-white/40 font-mono text-xs">@</span>
                <input
                  type="text"
                  value={username.replace(/^@/, '')}
                  onChange={(e) => {
                    setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''));
                    if (usernameError) setUsernameError(null);
                  }}
                  className={`w-full pl-7 pr-3 py-2 bg-white/5 border rounded-xl text-xs text-white outline-none font-mono ${
                    usernameError ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-[#2F6FED]'
                  }`}
                />
              </div>
              {usernameError && (
                <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-red-400 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-400" />
                  <span>{usernameError}</span>
                </div>
              )}
            </div>
          </div>

          {/* Bio with Completed Challenges & @mentions */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-white/70">
                Bio
              </label>
              <span className="text-[10px] text-white/40 font-mono">{bio.length}/200</span>
            </div>

            <textarea
              value={bio}
              onChange={handleBioChange}
              rows={3}
              maxLength={200}
              placeholder="Tell your story, type @ to mention someone, or type 'challenges' to add your completed challenges..."
              className="w-full px-3 py-2 bg-white/5 border border-white/10 focus:border-[#2F6FED] rounded-xl text-xs text-white outline-none resize-none placeholder-white/30"
            />

            {/* Quick helper action chips */}
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <button
                type="button"
                onClick={() => {
                  vibrateLight();
                  setShowChallengePicker((prev) => !prev);
                  setShowMentionPicker(false);
                }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border flex items-center gap-1 cursor-pointer ${
                  showChallengePicker
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-white/5 text-white/70 hover:text-white border-white/10 hover:bg-white/10'
                }`}
              >
                <Trophy className="w-3 h-3 text-amber-400" />
                <span>+ Completed Challenge</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  vibrateLight();
                  setShowMentionPicker((prev) => !prev);
                  setShowChallengePicker(false);
                }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border flex items-center gap-1 cursor-pointer ${
                  showMentionPicker
                    ? 'bg-[#2F6FED]/20 text-[#5B8DEF] border-[#2F6FED]/40'
                    : 'bg-white/5 text-white/70 hover:text-white border-white/10 hover:bg-white/10'
                }`}
              >
                <AtSign className="w-3 h-3 text-[#2F6FED]" />
                <span>+ Mention User</span>
              </button>
            </div>

            {/* Completed Challenge Picker Dropdown */}
            {showChallengePicker && (
              <div className="p-2.5 rounded-2xl bg-[#141419] border border-amber-500/30 space-y-2 animate-in fade-in duration-150 shadow-xl">
                <div className="flex items-center justify-between pb-1 border-b border-white/10">
                  <div className="flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-[11px] font-bold text-white">Select Completed Challenge to Add</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowChallengePicker(false)}
                    className="text-white/40 hover:text-white p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>

                <div className="space-y-1 max-h-40 overflow-y-auto no-scrollbar pr-0.5">
                  {challengesToShow.map((challenge) => (
                    <button
                      key={challenge.id}
                      type="button"
                      onClick={() => handleSelectChallenge(challenge)}
                      className="w-full text-left p-2 rounded-xl bg-white/5 hover:bg-amber-500/15 border border-white/5 hover:border-amber-500/30 transition-all flex items-center justify-between gap-2 group cursor-pointer"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base shrink-0">{challenge.icon || '🏆'}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white group-hover:text-amber-300 truncate">
                            {challenge.title}
                          </p>
                          <p className="text-[10px] text-white/40 font-mono">
                            {challenge.durationDays} days • #{challenge.tag}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-amber-400 shrink-0 group-hover:underline">
                        + Add to Bio
                      </span>
                    </button>
                  ))}
                  {challengesToShow.length === 0 && (
                    <p className="text-xs text-white/40 text-center py-2">
                      No challenges found. Join and complete a challenge to showcase it!
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* User Mention Picker Dropdown */}
            {showMentionPicker && (
              <div className="p-2.5 rounded-2xl bg-[#141419] border border-[#2F6FED]/30 space-y-2 animate-in fade-in duration-150 shadow-xl">
                <div className="flex items-center justify-between pb-1 border-b border-white/10">
                  <div className="flex items-center gap-1.5">
                    <AtSign className="w-3.5 h-3.5 text-[#2F6FED]" />
                    <span className="text-[11px] font-bold text-white">Select User to Mention</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowMentionPicker(false)}
                    className="text-white/40 hover:text-white p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>

                <div className="space-y-1 max-h-40 overflow-y-auto no-scrollbar pr-0.5">
                  {allUsers
                    .filter((u) =>
                      mentionQuery
                        ? u.username.toLowerCase().includes(mentionQuery) ||
                          u.name.toLowerCase().includes(mentionQuery)
                        : true
                    )
                    .slice(0, 8)
                    .map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => handleSelectMention(user)}
                        className="w-full text-left p-2 rounded-xl bg-white/5 hover:bg-[#2F6FED]/15 border border-white/5 hover:border-[#2F6FED]/30 transition-all flex items-center justify-between gap-2 group cursor-pointer"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={user.avatar}
                            alt={user.name}
                            referrerPolicy="no-referrer"
                            className="w-6 h-6 rounded-full object-cover shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white group-hover:text-[#5B8DEF] truncate">
                              @{user.username}
                            </p>
                            <p className="text-[10px] text-white/40 truncate">{user.name}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-[#5B8DEF] shrink-0 group-hover:underline">
                          Insert
                        </span>
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>



          {/* Expanded Interests (30+ interests including gardening, singing, dancing, storytelling) */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-white/70 mb-1.5">
              Interests & Craft Areas ({interests.length} selected)
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto no-scrollbar p-1">
              {AVAILABLE_INTERESTS.map((item) => {
                const isSelected = interests.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleInterest(item)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-500 shadow-sm font-black'
                        : 'bg-white/5 text-white/60 border-white/10 hover:border-white/20'
                    }`}
                  >
                    {isSelected ? `✓ ${item}` : item}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center gap-2 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white/60"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-2/3 py-2.5 rounded-xl bg-[#2F6FED] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-[#2F6FED]/20 hover:bg-[#E5B842] transition-all min-h-[42px]"
            >
              <Save className="w-3.5 h-3.5" />
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
