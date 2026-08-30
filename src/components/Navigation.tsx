import React from 'react';
import { Home, Flame, PlusCircle, Compass, User as UserIcon, MessageSquare, Bell } from 'lucide-react';
import { NavigationTab, User } from '../types';

interface NavigationProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  currentUser: User;
  onOpenDMs: () => void;
  unreadMessagesCount: number;
  onOpenCreate: () => void;
}

export const TopHeader: React.FC<{
  currentUser: User;
  onOpenDMs: () => void;
  unreadCount: number;
  onSelectTab: (tab: NavigationTab) => void;
  onOpenNotifications?: () => void;
  unreadNotificationsCount?: number;
}> = ({
  currentUser,
  onOpenDMs,
  unreadCount,
  onSelectTab,
  onOpenNotifications = () => {},
  unreadNotificationsCount = 0,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full bg-[#050505]/95 backdrop-blur-md border-b border-white/5 px-4 py-3 flex items-center justify-between">
      {/* Brand Logo */}
      <button 
        onClick={() => onSelectTab('home')}
        className="flex flex-col text-left cursor-pointer select-none group min-h-[44px] justify-center focus:outline-none"
      >
        <div className="flex items-center gap-1.5">
          <h1 className="text-xl font-black tracking-tighter text-white">
            DAILY<span className="text-[#D4AF37]">.</span>
          </h1>
        </div>
        <p className="text-[9px] uppercase tracking-widest text-white/40 font-semibold leading-none mt-0.5">
          Show up. Show the work.
        </p>
      </button>

      {/* Right controls: Streak Counter pill + Notification Bell + DM button */}
      <div className="flex items-center gap-2">
        {/* Streak Pill */}
        <button
          onClick={() => onSelectTab('streak')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:border-[#D4AF37]/40 transition-colors text-xs font-bold text-[#D4AF37] min-h-[40px] active:scale-95"
          title="View your streak history"
        >
          <Flame className="w-4 h-4 text-[#D4AF37] fill-[#D4AF37] animate-pulse shrink-0" />
          <span className="whitespace-nowrap">{currentUser.currentStreak}d Streak</span>
        </button>

        {/* Notifications Icon */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white transition-all active:scale-95 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Notifications"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#D4AF37] text-black font-black text-[9px] rounded-full flex items-center justify-center shadow-md animate-pulse">
              {unreadNotificationsCount}
            </span>
          )}
        </button>

        {/* Direct Messages Icon */}
        <button
          onClick={onOpenDMs}
          className="relative p-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white transition-all active:scale-95 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Direct Messages"
          title="Messages & Groups"
        >
          <MessageSquare className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#D4AF37] text-black font-black text-[9px] rounded-full flex items-center justify-center animate-bounce shadow-md">
              {unreadCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};

export const BottomNavigation: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  onOpenCreate,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 max-w-lg mx-auto bg-[#0A0A0A]/95 backdrop-blur-lg border-t border-white/5 px-2 sm:px-4 pt-1.5 pb-[max(0.6rem,env(safe-area-inset-bottom))]">
      <div className="flex items-center justify-between text-white/40">
        {/* Today */}
        <button
          onClick={() => onSelectTab('home')}
          className={`flex flex-col items-center justify-center min-w-[54px] min-h-[48px] p-1 transition-all active:scale-95 ${
            currentTab === 'home'
              ? 'text-[#D4AF37]'
              : 'text-white/40 hover:text-white/80'
          }`}
          aria-label="Today Feed"
        >
          <Home className={`w-5 h-5 ${currentTab === 'home' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[9px] mt-1 font-bold uppercase tracking-tighter">Today</span>
        </button>

        {/* Challenges */}
        <button
          onClick={() => onSelectTab('streak')}
          className={`flex flex-col items-center justify-center min-w-[54px] min-h-[48px] p-1 transition-all active:scale-95 ${
            currentTab === 'streak'
              ? 'text-[#D4AF37]'
              : 'text-white/40 hover:text-white/80'
          }`}
          aria-label="Challenges and Accountability"
        >
          <Flame className={`w-5 h-5 ${currentTab === 'streak' ? 'text-[#D4AF37] fill-[#D4AF37]' : 'stroke-2'}`} />
          <span className="text-[9px] mt-1 font-bold uppercase tracking-tighter">Challenges</span>
        </button>

        {/* Center Create Button */}
        <div className="relative -top-2 flex items-center justify-center">
          <button
            onClick={onOpenCreate}
            className="w-12 h-12 min-w-[48px] min-h-[48px] bg-[#D4AF37] rounded-full flex items-center justify-center text-black shadow-lg shadow-[#D4AF37]/30 hover:scale-105 active:scale-95 transition-transform"
            aria-label="What did you do today?"
            title="What did you do today?"
          >
            <PlusCircle className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Explore */}
        <button
          onClick={() => onSelectTab('discover')}
          className={`flex flex-col items-center justify-center min-w-[54px] min-h-[48px] p-1 transition-all active:scale-95 ${
            currentTab === 'discover'
              ? 'text-[#D4AF37]'
              : 'text-white/40 hover:text-white/80'
          }`}
          aria-label="Explore Proof & People"
        >
          <Compass className={`w-5 h-5 ${currentTab === 'discover' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[9px] mt-1 font-bold uppercase tracking-tighter">Explore</span>
        </button>

        {/* Profile */}
        <button
          onClick={() => onSelectTab('profile')}
          className={`flex flex-col items-center justify-center min-w-[54px] min-h-[48px] p-1 transition-all active:scale-95 ${
            currentTab === 'profile'
              ? 'text-[#D4AF37]'
              : 'text-white/40 hover:text-white/80'
          }`}
          aria-label="Your Profile & Proof Timeline"
        >
          <div className="relative">
            {currentUser.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                referrerPolicy="no-referrer"
                className={`w-5 h-5 rounded-full object-cover border transition-all ${
                  currentTab === 'profile' ? 'border-[#D4AF37] ring-2 ring-[#D4AF37]/50' : 'border-white/30'
                }`}
              />
            ) : (
              <UserIcon className="w-5 h-5" />
            )}
          </div>
          <span className="text-[9px] mt-1 font-bold uppercase tracking-tighter">Profile</span>
        </button>
      </div>
    </nav>
  );
};
