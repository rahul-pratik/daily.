import React, { useState, useEffect } from 'react';
import { Plus, Music, Sparkles, X, Send, Trash2, Check, MessageCircle, Heart } from 'lucide-react';
import { User, UserNote } from '../types';
import { DailyStorageService } from '../services/storage';
import { vibrateLight } from '../services/haptics';

interface DirectMessageNotesBarProps {
  currentUser: User;
  allUsers: User[];
  onOpenChatWithUser: (userId: string, initialMessage?: string) => void;
}

export const DirectMessageNotesBar: React.FC<DirectMessageNotesBarProps> = ({
  currentUser,
  allUsers,
  onOpenChatWithUser,
}) => {
  const [notes, setNotes] = useState<UserNote[]>([]);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<UserNote | null>(null);
  const [noteText, setNoteText] = useState('');
  const [musicTitle, setMusicTitle] = useState('');
  const [showMusicInput, setShowMusicInput] = useState(false);
  const [replyText, setReplyText] = useState('');

  // Load notes
  const loadNotes = () => {
    const all = DailyStorageService.getAllUserNotes();
    setNotes(all);
  };

  useEffect(() => {
    loadNotes();
  }, []);

  const currentUserNote = notes.find((n) => n.userId === currentUser.id);

  // Other users' notes
  const otherNotes = notes.filter((n) => n.userId !== currentUser.id);

  const handleOpenMyComposer = () => {
    vibrateLight();
    if (currentUserNote) {
      setNoteText(currentUserNote.text);
      setMusicTitle(currentUserNote.musicTitle || '');
      setShowMusicInput(Boolean(currentUserNote.musicTitle));
    } else {
      setNoteText('');
      setMusicTitle('');
      setShowMusicInput(false);
    }
    setIsComposerOpen(true);
  };

  const handleSaveMyNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    vibrateLight();

    DailyStorageService.saveCurrentUserNote(
      noteText.trim(),
      musicTitle.trim() || undefined
    );
    setIsComposerOpen(false);
    loadNotes();
  };

  const handleDeleteMyNote = () => {
    vibrateLight();
    DailyStorageService.deleteCurrentUserNote();
    setIsComposerOpen(false);
    loadNotes();
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNote || !replyText.trim()) return;
    vibrateLight();

    const targetUserId = selectedNote.userId;
    const textToSend = `Replying to your note "${selectedNote.text}": ${replyText.trim()}`;

    // Send DM via storage & open chat
    DailyStorageService.sendMessage({
      receiverId: targetUserId,
      text: textToSend,
    });

    const target = selectedNote;
    setSelectedNote(null);
    setReplyText('');
    onOpenChatWithUser(target.userId);
  };

  return (
    <div className="w-full bg-[#0d0d0d] border-b border-white/5 py-3 px-3">
      {/* Horizontal Carousel */}
      <div className="flex items-start gap-4 overflow-x-auto no-scrollbar pb-1 px-1">
        {/* 1. YOUR NOTE ITEM (1st position) */}
        <div className="flex flex-col items-center shrink-0 w-20 relative">
          {/* Thought Bubble over Avatar */}
          <button
            onClick={handleOpenMyComposer}
            className="mb-1.5 px-2.5 py-1 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-[11px] text-white/90 max-w-[84px] text-center shadow-md relative transition-all active:scale-95 group flex flex-col items-center"
          >
            {currentUserNote ? (
              <span className="truncate w-full block font-medium leading-tight text-white">
                {currentUserNote.text}
              </span>
            ) : (
              <span className="text-white/60 text-[10px] leading-tight block">
                Share a thought...
              </span>
            )}
            {/* Thought Cloud Pointer Tail */}
            <div className="w-2 h-2 bg-white/10 border-r border-b border-white/15 rotate-45 -mb-2 mt-0.5 rounded-sm" />
          </button>

          {/* User Avatar with '+' Badge */}
          <div className="relative cursor-pointer" onClick={handleOpenMyComposer}>
            <img
              src={currentUser.avatar}
              alt="Your avatar"
              className="w-14 h-14 rounded-full object-cover border-2 border-white/20 hover:border-[#D4AF37] transition-all p-0.5 bg-black"
              referrerPolicy="no-referrer"
            />
            {!currentUserNote && (
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white text-black font-black flex items-center justify-center text-xs shadow-md border-2 border-[#0A0A0A]">
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            )}
            {currentUserNote && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#D4AF37] text-black font-bold flex items-center justify-center text-[10px] shadow border-2 border-[#0A0A0A]">
                ✨
              </div>
            )}
          </div>

          <span className="text-[11px] text-white/60 mt-1 font-medium truncate w-full text-center">
            Your note
          </span>
        </div>

        {/* 2. FRIENDS' NOTES ITEMS */}
        {otherNotes.map((note) => {
          return (
            <div
              key={note.id}
              onClick={() => {
                vibrateLight();
                setSelectedNote(note);
              }}
              className="flex flex-col items-center shrink-0 w-20 cursor-pointer group"
            >
              {/* Thought Bubble with optional music icon */}
              <div className="mb-1.5 px-2.5 py-1 rounded-2xl bg-[#1c1c1e] group-hover:bg-[#2c2c2e] border border-white/15 text-[11px] text-white max-w-[86px] text-center shadow-lg relative transition-all active:scale-95 flex flex-col items-center">
                {note.musicTitle && (
                  <div className="flex items-center gap-0.5 text-[9px] font-mono text-white/70 truncate w-full mb-0.5">
                    <span className="text-white/80 font-bold">III</span>
                    <span className="truncate">{note.musicTitle}</span>
                  </div>
                )}
                <span className="truncate w-full block font-medium leading-tight text-white/95">
                  {note.text}
                </span>
                {/* Pointer Tail */}
                <div className="w-2 h-2 bg-[#1c1c1e] group-hover:bg-[#2c2c2e] border-r border-b border-white/15 rotate-45 -mb-2 mt-0.5 rounded-sm" />
              </div>

              {/* Friend Avatar */}
              <div className="relative">
                <img
                  src={note.userAvatar}
                  alt={note.userName}
                  className="w-14 h-14 rounded-full object-cover border-2 border-white/10 group-hover:border-white/40 transition-all p-0.5 bg-black shadow-md"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Friend Name */}
              <span className="text-[11px] text-white/70 mt-1 font-medium truncate w-full text-center group-hover:text-white">
                {note.userName}
              </span>
            </div>
          );
        })}
      </div>

      {/* --- CREATE / EDIT MY NOTE MODAL --- */}
      {isComposerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-[#18181b] border border-white/15 rounded-3xl p-5 shadow-2xl space-y-4 text-white relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <span>{currentUserNote ? 'Edit your note' : 'New note'}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-white/60">
                  Words only
                </span>
              </h3>
              <button
                onClick={() => setIsComposerOpen(false)}
                className="p-1 rounded-full text-white/40 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Note bubble preview & avatar */}
            <div className="flex flex-col items-center py-2">
              <div className="mb-2 px-3 py-1.5 rounded-2xl bg-white/10 border border-white/20 text-xs text-white max-w-[200px] text-center shadow-lg relative">
                {noteText.trim() ? (
                  <span>{noteText}</span>
                ) : (
                  <span className="text-white/40 italic">Share a thought...</span>
                )}
                <div className="w-2.5 h-2.5 bg-white/10 border-r border-b border-white/20 rotate-45 -mb-2.5 mt-0.5 mx-auto rounded-sm" />
              </div>
              <img
                src={currentUser.avatar}
                alt="My avatar"
                className="w-16 h-16 rounded-full object-cover border-2 border-[#D4AF37] p-0.5 bg-black"
                referrerPolicy="no-referrer"
              />
            </div>

            <form onSubmit={handleSaveMyNote} className="space-y-3">
              <div>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value.slice(0, 60))}
                  placeholder="Share what's on your mind... (max 60 characters, words only)"
                  rows={2}
                  maxLength={60}
                  className="w-full p-3 bg-white/5 border border-white/10 focus:border-[#D4AF37] rounded-2xl text-xs text-white placeholder-white/40 outline-none resize-none"
                  autoFocus
                />
                <div className="flex justify-between items-center text-[10px] text-white/40 mt-1 px-1">
                  <span>Visible to followers for 24h</span>
                  <span>{noteText.length}/60</span>
                </div>
              </div>

              {/* Optional Music track tag */}
              {showMusicInput ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 p-2 bg-white/5 border border-white/10 rounded-xl">
                    <Music className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <input
                      type="text"
                      value={musicTitle}
                      onChange={(e) => setMusicTitle(e.target.value)}
                      placeholder="Add song title (e.g. Faasla • Madhur Sharma)"
                      className="bg-transparent text-xs text-white outline-none flex-1 placeholder-white/30"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setMusicTitle('');
                        setShowMusicInput(false);
                      }}
                      className="text-white/40 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowMusicInput(true)}
                  className="text-[11px] text-white/60 hover:text-white flex items-center gap-1.5 px-2 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-colors"
                >
                  <Music className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Attach music title caption</span>
                </button>
              )}

              <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                {currentUserNote && (
                  <button
                    type="button"
                    onClick={handleDeleteMyNote}
                    className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold transition-colors flex items-center justify-center"
                    title="Delete Note"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="submit"
                  disabled={!noteText.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#bfa035] disabled:opacity-40 text-black font-black text-xs transition-all shadow-md shadow-[#D4AF37]/20 active:scale-95"
                >
                  Share Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- VIEW FRIEND'S NOTE & QUICK REPLY MODAL --- */}
      {selectedNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-[#18181b] border border-white/15 rounded-3xl p-5 shadow-2xl space-y-4 text-white relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <img
                  src={selectedNote.userAvatar}
                  alt={selectedNote.userName}
                  className="w-8 h-8 rounded-full object-cover border border-white/20"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h4 className="text-xs font-bold text-white">{selectedNote.userName}</h4>
                  <span className="text-[10px] text-white/50 font-mono">@{selectedNote.userUsername}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedNote(null)}
                className="p-1 rounded-full text-white/40 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Note display bubble */}
            <div className="bg-[#242428] border border-white/10 rounded-2xl p-4 shadow-md space-y-2 text-center">
              {selectedNote.musicTitle && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[10px] font-mono text-[#D4AF37]">
                  <Music className="w-3 h-3" />
                  <span>{selectedNote.musicTitle}</span>
                </div>
              )}
              <p className="text-sm font-semibold text-white leading-relaxed">
                "{selectedNote.text}"
              </p>
            </div>

            {/* Quick DM Reply Input */}
            <form onSubmit={handleSendReply} className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Send message to ${selectedNote.userName}...`}
                className="flex-1 px-3.5 py-2.5 bg-white/5 border border-white/10 focus:border-[#D4AF37] rounded-xl text-xs text-white placeholder-white/40 outline-none"
                autoFocus
              />
              <button
                type="submit"
                disabled={!replyText.trim()}
                className="p-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#c4a132] disabled:opacity-40 text-black font-bold transition-all min-h-[38px] min-w-[38px] flex items-center justify-center active:scale-95"
                title="Send Reply"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
