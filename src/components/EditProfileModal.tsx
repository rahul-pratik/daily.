import React, { useState } from 'react';
import { X, Flame, Check, Upload, Save, Award, Sparkles } from 'lucide-react';
import { User, AVAILABLE_INTERESTS, AVAILABLE_HABITS, AVAILABLE_DISCIPLINE_MILESTONES } from '../types';
import { vibrateLight } from '../services/haptics';

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
  const [disciplineMilestones, setDisciplineMilestones] = useState<string[]>(
    currentUser.disciplineMilestones || ['dawn_riser', 'deep_work', 'code_ship']
  );

  if (!isOpen) return null;

  const toggleInterest = (item: string) => {
    vibrateLight();
    if (interests.includes(item)) {
      setInterests(interests.filter((i) => i !== item));
    } else {
      setInterests([...interests, item]);
    }
  };

  const toggleHabit = (item: string) => {
    vibrateLight();
    if (habits.includes(item)) {
      setHabits(habits.filter((h) => h !== item));
    } else {
      setHabits([...habits, item]);
    }
  };

  const toggleMilestone = (id: string) => {
    vibrateLight();
    if (disciplineMilestones.includes(id)) {
      setDisciplineMilestones(disciplineMilestones.filter((m) => m !== id));
    } else {
      if (disciplineMilestones.length >= 3) {
        setDisciplineMilestones([...disciplineMilestones.slice(1), id]);
      } else {
        setDisciplineMilestones([...disciplineMilestones, id]);
      }
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
      disciplineMilestones: disciplineMilestones.slice(0, 3),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#0A0A0A] border border-white/10 rounded-[32px] p-5 sm:p-6 shadow-2xl text-white my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div>
            <h2 className="font-black text-base text-white">Edit Profile & Disciplines</h2>
            <p className="text-[11px] text-white/50">Personal details, 3 milestones & focus interests</p>
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
            <div className="relative">
              <img
                src={avatar}
                alt="Profile Avatar"
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-full object-cover border-2 border-[#D4AF37] shadow-md"
              />
              <label className="absolute bottom-0 right-0 p-1 bg-black border border-white/20 hover:border-[#D4AF37] rounded-full text-white cursor-pointer shadow-md">
                <Upload className="w-3 h-3" />
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
                    avatar === p ? 'border-[#D4AF37] scale-110' : 'border-white/10 opacity-60'
                  }`}
                >
                  <img src={p} alt="preset" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                </button>
              ))}
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
                className="w-full px-3 py-2 bg-white/5 border border-white/10 focus:border-[#D4AF37] rounded-xl text-xs text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-white/70 mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 focus:border-[#D4AF37] rounded-xl text-xs text-white outline-none"
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-white/70 mb-1">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={2}
              maxLength={140}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 focus:border-[#D4AF37] rounded-xl text-xs text-white outline-none resize-none"
            />
          </div>

          {/* 3 DISCIPLINE MILESTONES (NEW) */}
          <div className="p-3 rounded-2xl bg-[#D4AF37]/5 border border-[#D4AF37]/20 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-[#D4AF37] flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" />
                3 Discipline Milestones ({disciplineMilestones.length}/3)
              </label>
              <span className="text-[10px] text-white/50">Showcased on profile</span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto no-scrollbar p-1">
              {AVAILABLE_DISCIPLINE_MILESTONES.map((milestone) => {
                const isSelected = disciplineMilestones.includes(milestone.id);
                return (
                  <button
                    key={milestone.id}
                    type="button"
                    onClick={() => toggleMilestone(milestone.id)}
                    className={`p-2 rounded-xl text-left border transition-all flex items-center gap-2 ${
                      isSelected
                        ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-white shadow-sm'
                        : 'bg-white/[0.03] border-white/10 text-white/60 hover:text-white'
                    }`}
                  >
                    <span className="text-base">{milestone.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold truncate">{milestone.title}</p>
                      <p className="text-[9px] text-[#D4AF37] truncate">{milestone.category}</p>
                    </div>
                    {isSelected && <Check className="w-3 h-3 text-[#D4AF37] stroke-[3]" />}
                  </button>
                );
              })}
            </div>
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

          {/* Habits */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-white/70 mb-1.5">
              Daily Core Habits
            </label>
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
                        ? 'bg-white text-black border-white font-black'
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
              className="w-2/3 py-2.5 rounded-xl bg-[#D4AF37] text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-[#D4AF37]/20 hover:bg-[#E5B842] transition-all min-h-[42px]"
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
