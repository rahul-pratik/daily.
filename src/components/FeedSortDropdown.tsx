import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUpDown,
  ChevronDown,
  Camera,
  MessageSquare,
  Sparkles,
  Users,
  Flame,
  Globe,
  Trophy,
  CheckSquare,
  Square,
  Check,
} from 'lucide-react';
import { vibrateLight } from '../services/haptics';

export type FeedContentType = 'proofs' | 'tweets';
export type FeedCategory = 'all' | 'following' | 'interests' | 'communities' | 'challenges';

export const FEED_CATEGORIES: {
  id: FeedCategory;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'all', label: 'All', icon: Sparkles },
  { id: 'following', label: 'Following', icon: Users },
  { id: 'interests', label: 'Interests', icon: Flame },
  { id: 'communities', label: 'Communities', icon: Globe },
  { id: 'challenges', label: 'Challenges', icon: Trophy },
];

interface FeedSortDropdownProps {
  selectedSortFilters: string[];
  onSelectSortFilters: (filters: string[]) => void;
  className?: string;
}

export const FeedSortDropdown: React.FC<FeedSortDropdownProps> = ({
  selectedSortFilters,
  onSelectSortFilters,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleSortFilter = (filterKey: string) => {
    vibrateLight();
    if (selectedSortFilters.includes(filterKey)) {
      const next = selectedSortFilters.filter((k) => k !== filterKey);
      onSelectSortFilters(next.length > 0 ? next : ['proofs:all', 'tweets:all']);
    } else {
      onSelectSortFilters([...selectedSortFilters, filterKey]);
    }
  };

  const applyPreset = (preset: string[]) => {
    vibrateLight();
    onSelectSortFilters(preset);
  };

  const resetFilters = () => {
    vibrateLight();
    onSelectSortFilters(['proofs:all', 'tweets:all']);
  };

  const getSortButtonSummary = () => {
    const hasProofsAll = selectedSortFilters.includes('proofs:all');
    const hasTweetsAll = selectedSortFilters.includes('tweets:all');

    if (selectedSortFilters.length === 2 && hasProofsAll && hasTweetsAll) {
      return 'All Feed';
    }
    if (selectedSortFilters.length === 1 && hasProofsAll) {
      return 'Proofs';
    }
    if (selectedSortFilters.length === 1 && hasTweetsAll) {
      return 'Tweets';
    }
    if (selectedSortFilters.length === 1) {
      const [t, c] = selectedSortFilters[0].split(':');
      const tLabel = t === 'proofs' ? 'Proofs' : 'Tweets';
      const cLabel = c.charAt(0).toUpperCase() + c.slice(1);
      return `${tLabel}: ${cLabel}`;
    }
    if (selectedSortFilters.length <= 2) {
      return selectedSortFilters
        .map((k) => {
          const [t, c] = k.split(':');
          return `${t === 'proofs' ? 'Proofs' : 'Tweets'} (${c})`;
        })
        .join(' + ');
    }
    return `${selectedSortFilters.length} Filters`;
  };

  return (
    <div className={`relative shrink-0 ${className}`} ref={dropdownRef}>
      <button
        id="feed-sort-by-button"
        type="button"
        onClick={() => {
          vibrateLight();
          setIsOpen((prev) => !prev);
        }}
        className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold text-white/90 transition-all shadow-sm active:scale-95 cursor-pointer min-h-[40px]"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        title="Sort & Filter Feed"
      >
        <ArrowUpDown className="w-3.5 h-3.5 text-[#2F6FED]" />
        <span className="hidden sm:inline text-white/50 font-normal">Sort:</span>
        <span className="font-bold text-white max-w-[95px] truncate">
          {getSortButtonSummary()}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-white/50 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-white' : ''
          }`}
        />
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div
          id="feed-sort-by-menu"
          className="absolute right-0 top-full mt-2 w-[340px] sm:w-[380px] max-w-[calc(100vw-24px)] bg-[#12141c] border border-white/15 rounded-2xl shadow-2xl shadow-black/90 backdrop-blur-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-3 max-h-[85vh] overflow-y-auto no-scrollbar"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div>
              <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                <ArrowUpDown className="w-3.5 h-3.5 text-[#2F6FED]" />
                <span>Filter & Sort Stream</span>
              </h4>
              <p className="text-[10px] text-white/50">
                Select multiple options for Proofs & Tweets
              </p>
            </div>
            <button
              type="button"
              onClick={resetFilters}
              className="text-[11px] font-bold text-white/60 hover:text-white px-2 py-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            >
              Reset to All
            </button>
          </div>

          {/* Quick Filters */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">
              Quick Filter
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => applyPreset(['proofs:all'])}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border cursor-pointer flex items-center gap-1.5 ${
                  selectedSortFilters.length === 1 && selectedSortFilters.includes('proofs:all')
                    ? 'bg-[#2F6FED] text-white border-[#2F6FED]'
                    : 'bg-white/5 text-white/80 border-white/10 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Camera className="w-3 h-3 text-white" />
                <span>Proofs Only</span>
              </button>

              <button
                type="button"
                onClick={() => applyPreset(['tweets:all'])}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border cursor-pointer flex items-center gap-1.5 ${
                  selectedSortFilters.length === 1 && selectedSortFilters.includes('tweets:all')
                    ? 'bg-sky-500 text-black border-sky-500'
                    : 'bg-white/5 text-white/80 border-white/10 hover:bg-white/10 hover:text-white'
                }`}
              >
                <MessageSquare className="w-3 h-3 text-sky-300" />
                <span>Tweets Only</span>
              </button>

              <button
                type="button"
                onClick={() => applyPreset(['proofs:all', 'tweets:all'])}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border cursor-pointer flex items-center gap-1.5 ${
                  selectedSortFilters.length === 2 &&
                  selectedSortFilters.includes('proofs:all') &&
                  selectedSortFilters.includes('tweets:all')
                    ? 'bg-white text-black border-white'
                    : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
                }`}
              >
                <span>All Feed (Default)</span>
              </button>
            </div>
          </div>

          {/* Two Sections: Proofs and Tweets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {/* SECTION 1: PROOFS */}
            <div className="space-y-1.5 p-2 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center justify-between pb-1 border-b border-white/5">
                <div className="flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-[#2F6FED]" />
                  <span className="text-xs font-black text-white">Proofs</span>
                </div>
                <span className="text-[9px] text-white/40 font-mono">With photo</span>
              </div>

              <div className="space-y-1">
                {FEED_CATEGORIES.map((cat) => {
                  const key = `proofs:${cat.id}`;
                  const isSelected = selectedSortFilters.includes(key);
                  const Icon = cat.icon;
                  return (
                    <button
                      key={key}
                      id={`feed-sort-${key}`}
                      type="button"
                      onClick={() => toggleSortFilter(key)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                        isSelected
                          ? 'bg-[#2F6FED]/20 border-[#2F6FED] text-white shadow-sm'
                          : 'border-transparent text-white/70 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-[#2F6FED]' : 'text-white/40'}`} />
                        <span className="truncate">{cat.label}</span>
                      </div>
                      {isSelected ? (
                        <CheckSquare className="w-3.5 h-3.5 text-[#2F6FED] shrink-0" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-white/20 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SECTION 2: TWEETS */}
            <div className="space-y-1.5 p-2 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center justify-between pb-1 border-b border-white/5">
                <div className="flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
                  <span className="text-xs font-black text-white">Tweets</span>
                </div>
                <span className="text-[9px] text-white/40 font-mono">No photo</span>
              </div>

              <div className="space-y-1">
                {FEED_CATEGORIES.map((cat) => {
                  const key = `tweets:${cat.id}`;
                  const isSelected = selectedSortFilters.includes(key);
                  const Icon = cat.icon;
                  return (
                    <button
                      key={key}
                      id={`feed-sort-${key}`}
                      type="button"
                      onClick={() => toggleSortFilter(key)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                        isSelected
                          ? 'bg-sky-500/20 border-sky-400 text-white shadow-sm'
                          : 'border-transparent text-white/70 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-sky-400' : 'text-white/40'}`} />
                        <span className="truncate">{cat.label}</span>
                      </div>
                      {isSelected ? (
                        <CheckSquare className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-white/20 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Dropdown Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <span className="text-[11px] text-white/60 font-medium">
              {selectedSortFilters.length} {selectedSortFilters.length === 1 ? 'filter' : 'filters'} active
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 rounded-lg bg-[#2F6FED] hover:bg-[#255bd1] text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
