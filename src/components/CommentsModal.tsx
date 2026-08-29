import React, { useState } from 'react';
import { X, Send, Flame, Heart } from 'lucide-react';
import { Post, User } from '../types';

interface CommentsModalProps {
  post: Post | null;
  currentUser: User;
  onClose: () => void;
  onAddComment: (postId: string, content: string) => void;
}

export const CommentsModal: React.FC<CommentsModalProps> = ({
  post,
  currentUser,
  onClose,
  onAddComment,
}) => {
  const [commentText, setCommentText] = useState('');

  if (!post) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(post.id, commentText.trim());
    setCommentText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#0A0A0A] border-t sm:border border-white/10 rounded-t-[32px] sm:rounded-[32px] max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-white animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-black text-sm text-white">Comments</h3>
            <span className="text-xs text-white/40 font-mono">
              ({post.comments?.length || 0})
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Close comments"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Post owner caption preview */}
        <div className="p-4 bg-white/[0.02] border-b border-white/5 flex items-start gap-3">
          <img
            src={post.userAvatar}
            alt={post.username}
            referrerPolicy="no-referrer"
            className="w-8 h-8 rounded-full object-cover border border-white/10 mt-0.5"
          />
          <div className="flex-1 text-xs">
            <span className="font-bold text-white mr-1.5">{post.username}</span>
            <span className="text-white/80">{post.content}</span>
            <span className="block text-[10px] text-white/40 mt-1 font-mono">{post.createdAt}</span>
          </div>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[160px] max-h-[360px]">
          {post.comments && post.comments.length > 0 ? (
            post.comments.map((comment) => (
              <div key={comment.id} className="flex items-start gap-3 group">
                <div className="relative">
                  <img
                    src={comment.userAvatar}
                    alt={comment.username}
                    referrerPolicy="no-referrer"
                    className="w-7 h-7 rounded-full object-cover border border-white/10"
                  />
                  {comment.userStreak > 0 && (
                    <span className="absolute -bottom-1 -right-1 bg-black text-[8px] text-[#D4AF37] px-0.5 rounded border border-[#D4AF37]/40 font-black">
                      🔥{comment.userStreak}
                    </span>
                  )}
                </div>
                <div className="flex-1 text-xs">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="font-bold text-white">{comment.username}</span>
                    <span className="text-[10px] text-white/40 font-mono">{comment.createdAt}</span>
                  </div>
                  <p className="text-white/80 leading-relaxed">{comment.content}</p>
                </div>
                <button className="text-white/30 hover:text-[#D4AF37] opacity-0 group-hover:opacity-100 transition-opacity p-1">
                  <Heart className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-white/40 text-xs">
              No comments yet. Start the conversation!
            </div>
          )}
        </div>

        {/* Comment input form */}
        <form onSubmit={handleSubmit} className="p-3 border-t border-white/5 bg-[#0A0A0A] flex items-center gap-2">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            referrerPolicy="no-referrer"
            className="w-7 h-7 rounded-full object-cover border border-white/10"
          />
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder={`Add a comment as ${currentUser.username}...`}
            className="flex-1 px-3 py-2 bg-white/5 border border-white/10 focus:border-[#D4AF37] rounded-xl text-xs text-white placeholder-white/30 outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={!commentText.trim()}
            className="p-2 bg-[#D4AF37] hover:bg-[#D4AF37]/90 disabled:opacity-30 text-black font-bold rounded-xl transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
