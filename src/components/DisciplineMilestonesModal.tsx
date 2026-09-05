import React, { useState } from 'react';
import { X, ShieldCheck, Check, Sparkles, Award } from 'lucide-react';
import { DisciplineMilestone, AVAILABLE_DISCIPLINE_MILESTONES } from '../types';
import { vibrateLight, vibrateStreakMilestone } from '../services/haptics';

interface DisciplineMilestonesModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMilestoneIds: string[];
  onSaveMilestones: (milestoneIds: string[]) => void;
}

export const DisciplineMilestonesModal: React.FC<DisciplineMilestonesModalProps> = ({
  isOpen,
  onClose,
  selectedMilestoneIds = [],
  onSaveMilestones,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(selectedMilestoneIds || []);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  if (!isOpen) return null;

  const categories = ['All', 'Focus', 'Physical', 'Mindset', 'Craft', 'Creative'];

  const filteredMilestones = categoryFilter === 'All'
    ? AVAILABLE_DISCIPLINE_MILESTONES
    : AVAILABLE_DISCIPLINE_MILESTONES.filter((m) => m.category === categoryFilter);

  const toggleMilestone = (id: string) => {
    vibrateLight();
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      if (selectedIds.length >= 3) {
        // Replace the oldest or prevent exceeding 3
        const next = [...selectedIds.slice(1), id];
        setSelectedIds(next);
      } else {
        setSelectedIds([...selectedIds, id]);
      }
    }
  };

  const handleSave = () => {
    vibrateStreakMilestone();
    onSaveMilestones(selectedIds.slice(0, 3));
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#0D0D0D] border border-white/15 rounded-[32px] p-5 sm:p-6 shadow-2xl relative text-white my-auto max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#2F6FED]/15 border border-[#2F6FED]/30 flex items-center justify-center text-[#2F6FED] shadow-inner">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-white flex items-center gap-1.5">
                Apply Discipline Milestones
              </h3>
              <p className="text-[11px] text-white/50">
                Showcase up to 3 core discipline badges on your public profile
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Counter & Active Slots Preview */}
        <div className="py-3 border-b border-white/5">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-bold text-white/70 uppercase tracking-wider text-[10px]">
              Profile Showcase Slots ({selectedIds.length}/3 Applied)
            </span>
            <span className="text-[10px] text-[#2F6FED] font-semibold">
              {selectedIds.length === 3 ? '✓ 3 Slots Full' : `Select ${3 - selectedIds.length} more`}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map((slotIdx) => {
              const milestoneId = selectedIds[slotIdx];
              const milestone = AVAILABLE_DISCIPLINE_MILESTONES.find((m) => m.id === milestoneId);

              if (milestone) {
                return (
                  <div
                    key={slotIdx}
                    onClick={() => toggleMilestone(milestone.id)}
                    className="p-2 rounded-2xl bg-[#2F6FED]/10 border border-[#2F6FED]/40 text-left relative group cursor-pointer hover:border-red-400/50 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg">{milestone.icon}</span>
                      <span className="text-[9px] font-black text-[#2F6FED] bg-black/50 px-1.5 py-0.5 rounded">
                        #{slotIdx + 1}
                      </span>
                    </div>
                    <p className="font-black text-xs text-white truncate mt-1">{milestone.title}</p>
                    <p className="text-[9px] text-[#2F6FED] truncate">{milestone.category}</p>
                  </div>
                );
              }

              return (
                <div
                  key={slotIdx}
                  className="p-2 rounded-2xl bg-white/[0.03] border border-dashed border-white/15 text-center flex flex-col items-center justify-center min-h-[64px]"
                >
                  <span className="text-white/20 text-xs font-bold">Slot {slotIdx + 1}</span>
                  <span className="text-[9px] text-white/40">Empty</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Filters */}
        <div className="py-2.5 flex gap-1.5 overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                vibrateLight();
                setCategoryFilter(cat);
              }}
              className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all border min-h-[32px] ${
                categoryFilter === cat
                  ? 'bg-blue-600 text-white border-blue-500 shadow-sm font-black'
                  : 'bg-white/5 text-white/60 border-white/10 hover:border-white/20 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Milestones Grid */}
        <div className="flex-1 overflow-y-auto py-2 space-y-2 pr-1 no-scrollbar max-h-[42vh]">
          {filteredMilestones.map((milestone) => {
            const isSelected = selectedIds.includes(milestone.id);
            const selectionIndex = selectedIds.indexOf(milestone.id);

            return (
              <div
                key={milestone.id}
                onClick={() => toggleMilestone(milestone.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 relative ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#2F6FED]/15 to-transparent border-[#2F6FED] shadow-md shadow-[#2F6FED]/10'
                    : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.07] hover:border-white/20'
                }`}
              >
                <div className="w-11 h-11 rounded-2xl bg-black/60 border border-white/10 flex items-center justify-center text-2xl shrink-0 shadow-sm">
                  {milestone.icon}
                </div>

                <div className="flex-1 min-w-0 pr-8">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-black text-white">{milestone.title}</h4>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                      {milestone.category}
                    </span>
                  </div>
                  <p className="text-[11px] font-semibold text-[#2F6FED] mt-0.5">
                    {milestone.headline}
                  </p>
                  <p className="text-[10px] text-white/50 leading-relaxed mt-0.5">
                    {milestone.description}
                  </p>
                </div>

                {/* Selected Check Indicator */}
                <div className="absolute top-3.5 right-3.5">
                  {isSelected ? (
                    <div className="w-6 h-6 rounded-full bg-[#2F6FED] text-white font-black text-xs flex items-center justify-center shadow-md">
                      {selectionIndex + 1}
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border border-white/20 hover:border-white/40 flex items-center justify-center" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-white/10 flex items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="w-1/3 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white/70 transition-colors min-h-[44px]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="w-2/3 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all min-h-[44px]"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Apply 3 Milestones ({selectedIds.length}/3)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
