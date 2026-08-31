import React, { useState } from 'react';
import { X, FolderPlus, Sparkles, Image as ImageIcon, Check, Plus } from 'lucide-react';
import { Post, ProofCollection } from '../types';
import { vibrateLight } from '../services/haptics';

interface CreateCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  userPosts: Post[];
  onCreateCollection: (params: {
    name: string;
    description?: string;
    icon?: string;
    coverImageUrl?: string;
    initialPostIds?: string[];
  }) => void;
}

const PRESET_ICONS = ['🏃‍♂️', '💻', '🏋️‍♂️', '🎨', '📚', '⚡️', '🧘‍♀️', '☕️', '🎯', '🚀', '💡', '🧠', '🧗', '🔥'];

const PRESET_COVERS = [
  'https://images.unsplash.com/photo-1502224562085-639556652f33?w=800&auto=format&fit=crop&q=80', // Running
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format&fit=crop&q=80', // Coding
  'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80', // Gym
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80', // Design
  'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=800&auto=format&fit=crop&q=80', // Reading
  'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&auto=format&fit=crop&q=80', // Mindfulness
];

export const CreateCollectionModal: React.FC<CreateCollectionModalProps> = ({
  isOpen,
  onClose,
  userPosts,
  onCreateCollection,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('🏃‍♂️');
  const [selectedCover, setSelectedCover] = useState(PRESET_COVERS[0]);
  const [selectedPostIds, setSelectedPostIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const togglePostSelection = (postId: string) => {
    vibrateLight();
    setSelectedPostIds((prev) =>
      prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId]
    );
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a collection title (e.g. Running, Coding, Gym).');
      return;
    }

    onCreateCollection({
      name: name.trim(),
      description: description.trim() || undefined,
      icon: selectedIcon,
      coverImageUrl: selectedCover,
      initialPostIds: selectedPostIds,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 animate-in fade-in">
      <div className="bg-[#0A0A0A] border border-white/10 w-full max-w-lg rounded-[32px] overflow-hidden flex flex-col max-h-[90vh] shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <FolderPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">Create Proof Collection</h2>
              <p className="text-[11px] text-white/50">Group your photos & proofs by activity</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleCreate} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold">
              {error}
            </div>
          )}

          {/* Collection Name & Icon */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-white/60 mb-1.5 block">
              Collection Title
            </label>
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-xl shrink-0">
                {selectedIcon}
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="e.g. Running, Coding, Strength Training..."
                maxLength={40}
                className="flex-1 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm font-semibold focus:outline-none focus:border-blue-500 transition-colors"
                autoFocus
              />
            </div>
          </div>

          {/* Icon Picker */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-white/60 mb-1.5 block">
              Select Icon
            </label>
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              {PRESET_ICONS.map((icon) => (
                <button
                  type="button"
                  key={icon}
                  onClick={() => {
                    vibrateLight();
                    setSelectedIcon(icon);
                  }}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all shrink-0 border ${
                    selectedIcon === icon
                      ? 'bg-blue-500/20 border-blue-500 scale-105'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-white/60 mb-1.5 block">
              Description (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Morning 5ks, marathon prep & pacing splits"
              maxLength={120}
              className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-xs font-medium focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Cover Photo */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-white/60 mb-1.5 block">
              Cover Image
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_COVERS.map((cover, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    vibrateLight();
                    setSelectedCover(cover);
                  }}
                  className={`relative aspect-video rounded-xl overflow-hidden cursor-pointer border transition-all ${
                    selectedCover === cover
                      ? 'border-blue-500 ring-2 ring-blue-500/50 scale-[1.02]'
                      : 'border-white/10 hover:border-white/30 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={cover}
                    alt="Cover Option"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  {selectedCover === cover && (
                    <div className="absolute inset-0 bg-blue-600/30 flex items-center justify-center">
                      <Check className="w-5 h-5 text-white stroke-[3]" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Assign existing proofs */}
          {userPosts.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-white/60">
                  Add Proofs ({selectedPostIds.length} selected)
                </label>
                <span className="text-[10px] text-white/40">Tap proofs to include</span>
              </div>
              <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1 bg-black/30 rounded-2xl border border-white/5">
                {userPosts.map((post) => {
                  const isSelected = selectedPostIds.includes(post.id);
                  return (
                    <div
                      key={post.id}
                      onClick={() => togglePostSelection(post.id)}
                      className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer border transition-all ${
                        isSelected
                          ? 'border-blue-500 ring-2 ring-blue-500/50'
                          : 'border-white/10 hover:border-white/20 opacity-75 hover:opacity-100'
                      }`}
                    >
                      {post.imageUrl ? (
                        <img
                          src={post.imageUrl}
                          alt="Proof"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full p-2 bg-white/5 flex flex-col justify-between text-[9px] text-white/70">
                          <span className="text-[#D4AF37] font-bold">🔥</span>
                          <span className="line-clamp-2">{post.content}</span>
                        </div>
                      )}

                      {isSelected && (
                        <div className="absolute inset-0 bg-blue-600/40 flex items-center justify-center">
                          <Check className="w-5 h-5 text-white stroke-[3]" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-blue-600 text-white font-bold text-xs uppercase tracking-wider hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 active:scale-95"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Create Collection</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
