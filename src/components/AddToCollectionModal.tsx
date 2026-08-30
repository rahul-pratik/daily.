import React from 'react';
import { X, FolderPlus, Check, Plus, Folder } from 'lucide-react';
import { Post, ProofCollection } from '../types';
import { vibrateLight } from '../services/haptics';

interface AddToCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post | null;
  collections: ProofCollection[];
  onTogglePostInCollection: (collectionId: string, postId: string) => void;
  onOpenCreateCollection: () => void;
}

export const AddToCollectionModal: React.FC<AddToCollectionModalProps> = ({
  isOpen,
  onClose,
  post,
  collections,
  onTogglePostInCollection,
  onOpenCreateCollection,
}) => {
  if (!isOpen || !post) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 animate-in fade-in">
      <div className="bg-[#0A0A0A] border border-white/10 w-full max-w-md rounded-[32px] overflow-hidden flex flex-col max-h-[85vh] shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
              <Folder className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white">Add to Collection</h2>
              <p className="text-[10px] text-white/50">Sort this proof into your activity groups</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Post Preview */}
        <div className="p-3 bg-white/[0.02] border-b border-white/5 flex items-center gap-3">
          {post.imageUrl ? (
            <img
              src={post.imageUrl}
              alt="Proof"
              referrerPolicy="no-referrer"
              className="w-12 h-12 rounded-xl object-cover border border-white/10 shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-base shrink-0">
              🔥
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs text-white line-clamp-2 leading-tight">{post.content}</p>
            <span className="text-[9px] text-[#D4AF37] font-bold mt-0.5 block">
              {post.tags.map((t) => `#${t}`).join(' ')}
            </span>
          </div>
        </div>

        {/* Collections List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {collections.length > 0 ? (
            collections.map((col) => {
              const isInCollection = col.postIds.includes(post.id);
              return (
                <div
                  key={col.id}
                  onClick={() => {
                    vibrateLight();
                    onTogglePostInCollection(col.id, post.id);
                  }}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    isInCollection
                      ? 'bg-[#D4AF37]/15 border-[#D4AF37]/40 text-white'
                      : 'bg-white/5 border-white/5 hover:bg-white/10 text-white/80'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-lg shrink-0">
                      {col.icon || '📁'}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs text-white truncate">{col.name}</h4>
                      <p className="text-[10px] text-white/50">
                        {col.postIds.length} {col.postIds.length === 1 ? 'proof' : 'proofs'}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
                      isInCollection
                        ? 'bg-[#D4AF37] border-[#D4AF37] text-black'
                        : 'border-white/20 bg-white/5 text-transparent'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8">
              <p className="text-xs text-white/50">No collections created yet.</p>
            </div>
          )}

          {/* New Collection CTA */}
          <button
            onClick={() => {
              onClose();
              onOpenCreateCollection();
            }}
            className="w-full p-3 rounded-2xl border border-dashed border-white/20 hover:border-[#D4AF37]/50 text-white/70 hover:text-white flex items-center justify-center gap-2 text-xs font-bold transition-all bg-white/[0.02] hover:bg-white/5 mt-3 min-h-[44px]"
          >
            <Plus className="w-4 h-4 text-[#D4AF37]" />
            <span>Create New Collection</span>
          </button>
        </div>
      </div>
    </div>
  );
};
