import React, { useState } from 'react';
import { X, Flame, Check, Upload, Save } from 'lucide-react';
import { User, AVAILABLE_INTERESTS, AVAILABLE_HABITS } from '../types';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onSave: (updated: Partial<User>) => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&auto=format&fit=crop&q=80',
];

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSave,
}) => {
  const [name, setName] = useState(currentUser.name);
  const [username, setUsername] = useState(currentUser.username);
  const [avatar, setAvatar] = useState(currentUser.avatar);
  const [bio, setBio] = useState(currentUser.bio);
  const [interests, setInterests] = useState<string[]>(currentUser.interests || []);
  const [habits, setHabits] = useState<string[]>(currentUser.habits || []);

  if (!isOpen) return null;

  const toggleInterest = (item: string) => {
    if (interests.includes(item)) {
      setInterests(interests.filter((i) => i !== item));
    } else {
      setInterests([...interests, item]);
    }
  };

  const toggleHabit = (item: string) => {
    if (habits.includes(item)) {
      setHabits(habits.filter((h) => h !== item));
    } else {
      setHabits([...habits, item]);
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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name: name.trim() || currentUser.name,
      username: username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '') || currentUser.username,
      avatar,
      bio: bio.trim(),
      interests,
      habits,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-md bg-[#0A0A0A] border border-white/10 rounded-[32px] p-5 sm:p-6 shadow-2xl text-white my-6 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <h2 className="font-black text-base text-white">Edit Profile & Tags</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-white/40 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto py-3 space-y-4 pr-1">
          {/* Avatar */}
          <div className="flex flex-col items-center py-1">
            <div className="relative">
              <img
                src={avatar}
                alt="Profile Avatar"
                referrerPolicy="no-referrer"
                className="w-18 h-18 rounded-full object-cover border-2 border-[#FF4D00] shadow-md"
              />
              <label className="absolute bottom-0 right-0 p-1.5 bg-black border border-white/20 hover:border-[#FF4D00] rounded-full text-white cursor-pointer shadow-md">
                <Upload className="w-3.5 h-3.5" />
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            {/* Presets */}
            <div className="flex items-center gap-1.5 mt-2">
              {PRESET_AVATARS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setAvatar(p)}
                  className={`w-6 h-6 rounded-full overflow-hidden border transition-all ${
                    avatar === p ? 'border-[#FF4D00] scale-110' : 'border-white/10 opacity-60'
                  }`}
                >
                  <img src={p} alt="preset" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1">Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 bg-white/5 border border-white/10 focus:border-[#FF4D00] rounded-xl text-xs text-white outline-none"
            />
          </div>

          {/* Username */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3.5 py-2 bg-white/5 border border-white/10 focus:border-[#FF4D00] rounded-xl text-xs text-white outline-none"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={2}
              maxLength={140}
              className="w-full px-3.5 py-2 bg-white/5 border border-white/10 focus:border-[#FF4D00] rounded-xl text-xs text-white outline-none resize-none"
            />
          </div>

          {/* Interests */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">Interests</label>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_INTERESTS.map((item) => {
                const isSelected = interests.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleInterest(item)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border ${
                      isSelected
                        ? 'bg-[#FF4D00] text-black border-[#FF4D00]'
                        : 'bg-white/5 text-white/60 border-white/10'
                    }`}
                  >
                    {isSelected ? `✓ ${item}` : item}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Habits */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">Daily Habits</label>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_HABITS.map((item) => {
                const isSelected = habits.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleHabit(item)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border ${
                      isSelected
                        ? 'bg-white text-black border-white'
                        : 'bg-white/5 text-white/60 border-white/10'
                    }`}
                  >
                    {isSelected ? `✓ ${item}` : item}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white/60"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-2/3 py-2.5 rounded-xl bg-[#FF4D00] text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-[#FF4D00]/20 hover:bg-[#FF4D00]/90 transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
