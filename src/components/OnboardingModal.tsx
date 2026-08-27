import React, { useState } from 'react';
import { Flame, Sparkles, User as UserIcon, Check, ArrowRight, Upload } from 'lucide-react';
import { User, AVAILABLE_INTERESTS, AVAILABLE_HABITS } from '../types';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: (updatedUser: Partial<User>) => void;
  initialUser: User;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&auto=format&fit=crop&q=80',
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onComplete,
  initialUser,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState(initialUser.name || '');
  const [username, setUsername] = useState(initialUser.username || '');
  const [avatar, setAvatar] = useState(initialUser.avatar || PRESET_AVATARS[0]);
  const [bio, setBio] = useState(initialUser.bio || '');
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    initialUser.interests || ['Coding', 'AI', 'Fitness']
  );
  const [selectedHabits, setSelectedHabits] = useState<string[]>(
    initialUser.habits || ['Gym', 'Build Projects', 'Read']
  );

  if (!isOpen) return null;

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const toggleHabit = (habit: string) => {
    if (selectedHabits.includes(habit)) {
      setSelectedHabits(selectedHabits.filter((h) => h !== habit));
    } else {
      setSelectedHabits([...selectedHabits, habit]);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleFinish = () => {
    onComplete({
      name: name.trim() || 'Daily Creator',
      username: username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '') || 'creator',
      avatar,
      bio: bio.trim() || 'Posting daily updates & staying consistent 🔥',
      interests: selectedInterests.length > 0 ? selectedInterests : ['Coding', 'AI'],
      habits: selectedHabits.length > 0 ? selectedHabits : ['Build Projects', 'Read'],
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-md bg-[#0A0A0A] border border-white/10 rounded-[32px] p-6 shadow-2xl relative text-white my-8">
        {/* Progress indicator */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Flame className="w-4 h-4 text-[#FF4D00] fill-[#FF4D00]" />
            </div>
            <span className="font-bold text-xs uppercase tracking-wider text-white/50">
              Welcome to Daily
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  s === step
                    ? 'w-6 bg-[#FF4D00]'
                    : s < step
                    ? 'w-3 bg-[#FF4D00]/50'
                    : 'w-3 bg-white/10'
                }`}
              />
            ))}
          </div>
        </div>

        {/* STEP 1: Profile Details */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-black text-white">Create your profile</h2>
              <p className="text-xs text-white/50 mt-1">
                Tell the community about yourself and start your daily streak.
              </p>
            </div>

            {/* Avatar picker */}
            <div className="flex flex-col items-center py-2">
              <div className="relative group">
                <div className="w-20 h-20 rounded-full overflow-hidden border border-white/15 shadow-lg">
                  <img
                    src={avatar}
                    alt="Avatar Preview"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <label className="absolute bottom-0 right-0 p-1.5 bg-black border border-white/20 hover:border-[#FF4D00] rounded-full text-white cursor-pointer shadow-md">
                  <Upload className="w-3.5 h-3.5" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Avatar presets */}
              <p className="text-[10px] uppercase tracking-wider text-white/40 mt-2 mb-1.5 font-bold">Or choose a preset avatar:</p>
              <div className="flex items-center gap-2">
                {PRESET_AVATARS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAvatar(preset)}
                    className={`w-7 h-7 rounded-full overflow-hidden border transition-all ${
                      avatar === preset
                        ? 'border-[#FF4D00] scale-110 ring-2 ring-[#FF4D00]/40'
                        : 'border-white/10 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={preset}
                      alt="preset"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Name input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Rivera"
                className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 focus:border-[#FF4D00] rounded-2xl text-xs text-white placeholder-white/30 outline-none transition-colors"
              />
            </div>

            {/* Username input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1">Username</label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-white/40 text-xs">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="alexrivera"
                  className="w-full pl-7 pr-3.5 py-2.5 bg-white/5 border border-white/10 focus:border-[#FF4D00] rounded-2xl text-xs text-white placeholder-white/30 outline-none transition-colors"
                />
              </div>
            </div>

            {/* Bio input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1">Short Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="What are you working on or building daily?"
                rows={2}
                maxLength={140}
                className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 focus:border-[#FF4D00] rounded-2xl text-xs text-white placeholder-white/30 outline-none transition-colors resize-none"
              />
              <span className="text-[10px] font-mono text-white/30 block text-right">
                {bio.length}/140
              </span>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!name.trim() || !username.trim()}
              className="w-full mt-2 py-3 rounded-2xl bg-[#FF4D00] text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#FF4D00]/90 active:scale-[0.99] transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-[#FF4D00]/20"
            >
              Continue to Interests <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: Interests */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-black text-white">What are your interests?</h2>
              <p className="text-xs text-white/50 mt-1">
                We’ll recommend people with matching curiosities and passions.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 py-2">
              {AVAILABLE_INTERESTS.map((interest) => {
                const isSelected = selectedInterests.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`px-3.5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 border ${
                      isSelected
                        ? 'bg-[#FF4D00] text-black border-[#FF4D00] shadow-md shadow-[#FF4D00]/20'
                        : 'bg-white/5 text-white/60 border-white/10 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    {interest}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setStep(1)}
                className="w-1/3 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white/70 font-bold text-xs border border-white/10 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={selectedInterests.length === 0}
                className="w-2/3 py-3 rounded-2xl bg-[#FF4D00] text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#FF4D00]/90 active:scale-[0.99] transition-all disabled:opacity-30 shadow-lg shadow-[#FF4D00]/20"
              >
                Next: Daily Habits <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Habits / Goals */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-black text-white">Daily habits & goals</h2>
              <p className="text-xs text-white/50 mt-1">
                Select the daily practices you want to track and share.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 py-2">
              {AVAILABLE_HABITS.map((habit) => {
                const isSelected = selectedHabits.includes(habit);
                return (
                  <button
                    key={habit}
                    type="button"
                    onClick={() => toggleHabit(habit)}
                    className={`px-3.5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 border ${
                      isSelected
                        ? 'bg-white text-black border-white shadow-md'
                        : 'bg-white/5 text-white/60 border-white/10 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    {habit}
                  </button>
                );
              })}
            </div>

            <div className="bg-[#FF4D00]/10 border border-[#FF4D00]/20 rounded-2xl p-3.5 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-[#FF4D00] shrink-0 mt-0.5" />
              <p className="text-xs text-white/80 leading-relaxed">
                <strong className="text-white">One post every day.</strong> Posting increases your streak and inspires your network to stay locked in.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setStep(2)}
                className="w-1/3 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white/70 font-bold text-xs border border-white/10 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleFinish}
                className="w-2/3 py-3 rounded-2xl bg-[#FF4D00] text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#FF4D00]/90 active:scale-[0.99] transition-all shadow-lg shadow-[#FF4D00]/20"
              >
                <Flame className="w-4 h-4 fill-black" />
                Launch Daily
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
