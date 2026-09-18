import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUpDown,
  Search,
  X,
  Check,
  Sparkles,
  Flame,
  ChevronDown,
} from 'lucide-react';
import { AVAILABLE_INTERESTS } from '../types';
import { vibrateLight } from '../services/haptics';

interface ProfileSortByDropdownProps {
  selectedInterest: string | null;
  searchQuery: string;
  onSelectInterest: (interest: string | null) => void;
  onSearchQueryChange: (query: string) => void;
  userInterests?: string[];
  currentTabName?: string;
  className?: string;
}

export const ProfileSortByDropdown: React.FC<ProfileSortByDropdownProps> = ({
  selectedInterest,
  searchQuery,
  onSelectInterest,
  onSearchQueryChange,
  userInterests = [],
  currentTabName = 'Items',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicked outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
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

  // Combine user's specific interests with common AVAILABLE_INTERESTS
  const allInterestOptions = Array.from(
    new Set([
      ...userInterests.map((i) => i.trim()),
      ...AVAILABLE_INTERESTS,
    ])
  ).filter(Boolean);

  const filteredInterests = allInterestOptions.filter((item) =>
    item.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeLabel = selectedInterest
    ? selectedInterest
    : searchQuery.trim()
    ? `"${searchQuery.slice(0, 10)}..."`
    : 'Sort by Interest';

  const isFiltered = Boolean(selectedInterest || searchQuery.trim());

  return (
    <div className={`relative shrink-0 ${className}`} ref={dropdownRef}>
      <button
        type="button"
        id="profile-sort-by-interest-btn"
        onClick={() => {
          vibrateLight();
          setIsOpen((prev) => !prev);
        }}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
          isFiltered
            ? 'bg-[#2F6FED]/20 border-[#2F6FED] text-[#5B8DEF]'
            : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/70 hover:text-white'
        }`}
        title="Sort & Search by Interests"
      >
        <ArrowUpDown className="w-3.5 h-3.5 text-[#2F6FED] shrink-0" />
        <span className="max-w-[100px] sm:max-w-[130px] truncate">{activeLabel}</span>
        <ChevronDown
          className={`w-3 h-3 text-white/40 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-white' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          id="profile-sort-by-menu"
          className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-[#12141c] border border-white/15 rounded-2xl shadow-2xl shadow-black/90 p-3 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-2.5 max-h-[80vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#2F6FED]" />
              <span className="text-xs font-black text-white">Filter {currentTabName}</span>
            </div>
            {isFiltered && (
              <button
                type="button"
                onClick={() => {
                  vibrateLight();
                  onSelectInterest(null);
                  onSearchQueryChange('');
                }}
                className="text-[10px] text-white/50 hover:text-white font-bold cursor-pointer hover:underline"
              >
                Clear
              </button>
            )}
          </div>

          {/* Search Input in Dropdown */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              placeholder="Search by interest, keyword, #tag..."
              className="w-full pl-8 pr-7 py-1.5 bg-white/5 hover:bg-white/[0.08] focus:bg-black/50 border border-white/10 rounded-xl text-xs text-white placeholder-white/40 outline-none focus:border-[#2F6FED] transition-all"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchQueryChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Interest Chips List */}
          <div className="space-y-1 overflow-y-auto max-h-56 pr-1 no-scrollbar">
            {/* "All" reset option */}
            <button
              type="button"
              onClick={() => {
                vibrateLight();
                onSelectInterest(null);
                onSearchQueryChange('');
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                !selectedInterest && !searchQuery.trim()
                  ? 'bg-white text-black border-white font-black'
                  : 'border-transparent text-white/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span>All {currentTabName}</span>
              {!selectedInterest && !searchQuery.trim() && <Check className="w-3.5 h-3.5 text-black" />}
            </button>

            {filteredInterests.map((interest) => {
              const isSelected = selectedInterest?.toLowerCase() === interest.toLowerCase();
              return (
                <button
                  key={interest}
                  type="button"
                  onClick={() => {
                    vibrateLight();
                    onSelectInterest(isSelected ? null : interest);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                    isSelected
                      ? 'bg-[#2F6FED]/20 border-[#2F6FED] text-white font-bold'
                      : 'border-transparent text-white/70 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-[#2F6FED] text-[10px]">#</span>
                    <span className="truncate">{interest}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#2F6FED] shrink-0" />}
                </button>
              );
            })}

            {filteredInterests.length === 0 && (
              <div className="text-center py-4 text-xs text-white/40">
                <span>No matching interests found</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
