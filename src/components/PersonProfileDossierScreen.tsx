import React, { useState } from 'react';
import {
  CheckCircle2,
  Share2,
  ArrowLeft,
  Calendar,
  Sparkles,
  TrendingUp,
  Plus,
  X,
  Clock,
  ChevronRight,
  Filter,
  Check,
  Zap,
} from 'lucide-react';
import { vibrateLight, vibrateStreakMilestone } from '../services/haptics';

/**
 * Design tokens for this component:
 *   Base:      black / white only. No gold, amber, emerald, or gradients.
 *   Accent:    one signal blue (#2F6FED) — reserved for "active" / "needs
 *              your attention" / "verified". Everything structural stays
 *              grayscale so the blue keeps its meaning.
 *   Dark mode: bg-black, surfaces bg-white/[0.03]-[0.05], borders white/10.
 *   Light mode: bg-white, surfaces black/[0.02]-[0.04], borders black/10.
 */

export type FocusPillar = 'building' | 'fitness' | 'learning';

export interface TimelineMilestone {
  id: string;
  pillar: FocusPillar;
  pillarLabel: string;
  pillarIcon: string;
  dayNumber: number;
  dayLabel: string;
  title: string;
  note?: string;
  dateStr?: string;
  isKeyMilestone?: boolean;
}

interface PersonProfileDossierScreenProps {
  onBack?: () => void;
  onOpenCreatePost?: () => void;
}

export const PersonProfileDossierScreen: React.FC<PersonProfileDossierScreenProps> = ({
  onBack,
  onOpenCreatePost,
}) => {
  // Active pillar filter: 'all' or specific pillar ('building', 'fitness', 'learning')
  const [activePillar, setActivePillar] = useState<FocusPillar | 'all'>('building');
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<TimelineMilestone | null>(null);
  const [isAddMilestoneOpen, setIsAddMilestoneOpen] = useState(false);

  // New milestone form state
  const [newDayNum, setNewDayNum] = useState<string>('43');
  const [newPillar, setNewPillar] = useState<FocusPillar>('building');
  const [newTitle, setNewTitle] = useState<string>('');
  const [newNote, setNewNote] = useState<string>('');

  // Initial timeline entries exactly as specified:
  // Day 42 — shipped landing page
  // Day 35 — first 10 users
  // Day 27 — fixed authentication
  // Day 18 — started backend
  // Day 1 — "I'm building my first product."
  // Plus companion entries for Fitness and Learning
  const [timelineItems, setTimelineItems] = useState<TimelineMilestone[]>([
    // Building milestones
    {
      id: 'tl_b_42',
      pillar: 'building',
      pillarLabel: 'Building',
      pillarIcon: '💻',
      dayNumber: 42,
      dayLabel: 'Day 42',
      title: 'shipped landing page',
      note: 'Deployed modern responsive marketing page with waitlist form and automated welcome email flow.',
      dateStr: 'Today',
      isKeyMilestone: true,
    },
    {
      id: 'tl_b_35',
      pillar: 'building',
      pillarLabel: 'Building',
      pillarIcon: '💻',
      dayNumber: 35,
      dayLabel: 'Day 35',
      title: 'first 10 users',
      note: 'Onboarded first 10 beta testers from Twitter & community threads. Collected valuable UX telemetry.',
      dateStr: '7 days ago',
      isKeyMilestone: true,
    },
    {
      id: 'tl_b_27',
      pillar: 'building',
      pillarLabel: 'Building',
      pillarIcon: '💻',
      dayNumber: 27,
      dayLabel: 'Day 27',
      title: 'fixed authentication',
      note: 'Migrated session handling to JWT with automated token refresh and secure cookies.',
      dateStr: '15 days ago',
      isKeyMilestone: false,
    },
    {
      id: 'tl_b_18',
      pillar: 'building',
      pillarLabel: 'Building',
      pillarIcon: '💻',
      dayNumber: 18,
      dayLabel: 'Day 18',
      title: 'started backend',
      note: 'Architected REST endpoints, connected database schemas, and structured error handlers.',
      dateStr: '24 days ago',
      isKeyMilestone: false,
    },
    {
      id: 'tl_b_1',
      pillar: 'building',
      pillarLabel: 'Building',
      pillarIcon: '💻',
      dayNumber: 1,
      dayLabel: 'Day 1',
      title: '"I\'m building my first product."',
      note: 'Committed first repo commit. Decided to build, measure, and document the entire journey in public.',
      dateStr: '42 days ago',
      isKeyMilestone: true,
    },

    // Fitness milestones
    {
      id: 'tl_f_38',
      pillar: 'fitness',
      pillarLabel: 'Fitness',
      pillarIcon: '🏋️',
      dayNumber: 38,
      dayLabel: 'Day 38',
      title: '8K morning tempo run',
      note: 'Consistent 5:14/km cadence along the river loop. Heart rate steady under 160 bpm.',
      dateStr: '4 days ago',
      isKeyMilestone: true,
    },
    {
      id: 'tl_f_24',
      pillar: 'fitness',
      pillarLabel: 'Fitness',
      pillarIcon: '🏋️',
      dayNumber: 24,
      dayLabel: 'Day 24',
      title: 'hit 5K sub-25 min (24m30s)',
      note: 'Pushed past the 25-minute 5K threshold. Negative splits on the final 1.5 km.',
      dateStr: '18 days ago',
      isKeyMilestone: true,
    },
    {
      id: 'tl_f_12',
      pillar: 'fitness',
      pillarLabel: 'Fitness',
      pillarIcon: '🏋️',
      dayNumber: 12,
      dayLabel: 'Day 12',
      title: 'first 3K continuous non-stop run',
      note: 'Ran full distance without pause or walking breaks. Breathing rhythm locked in.',
      dateStr: '30 days ago',
      isKeyMilestone: false,
    },
    {
      id: 'tl_f_2',
      pillar: 'fitness',
      pillarLabel: 'Fitness',
      pillarIcon: '🏋️',
      dayNumber: 2,
      dayLabel: 'Day 2',
      title: 'new running shoes & pacing plan',
      note: 'Picked up daily road trainers and logged target zone-2 heart rate intervals.',
      dateStr: '41 days ago',
      isKeyMilestone: false,
    },

    // Learning milestones
    {
      id: 'tl_l_31',
      pillar: 'learning',
      pillarLabel: 'Learning',
      pillarIcon: '🧠',
      dayNumber: 31,
      dayLabel: 'Day 31',
      title: 'async generators & decorators in Python',
      note: 'Wrote asynchronous API rate-limiters and context managers for concurrent background tasks.',
      dateStr: '11 days ago',
      isKeyMilestone: true,
    },
    {
      id: 'tl_l_20',
      pillar: 'learning',
      pillarLabel: 'Learning',
      pillarIcon: '🧠',
      dayNumber: 20,
      dayLabel: 'Day 20',
      title: 'dataclasses & type hints deep dive',
      note: 'Refactored raw dictionary payloads into strict dataclasses with pydantic validation.',
      dateStr: '22 days ago',
      isKeyMilestone: false,
    },
    {
      id: 'tl_l_14',
      pillar: 'learning',
      pillarLabel: 'Learning',
      pillarIcon: '🧠',
      dayNumber: 14,
      dayLabel: 'Day 14',
      title: 'automated scraper & parser script',
      note: 'Built robust web crawler with error retries and automated CSV exports.',
      dateStr: '28 days ago',
      isKeyMilestone: false,
    },
    {
      id: 'tl_l_5',
      pillar: 'learning',
      pillarLabel: 'Learning',
      pillarIcon: '🧠',
      dayNumber: 5,
      dayLabel: 'Day 5',
      title: 'completed Python syntax & control flow basics',
      note: 'Solved 25 basic algorithms covering list comprehensions, recursion, and sets.',
      dateStr: '37 days ago',
      isKeyMilestone: false,
    },
  ]);

  // Filtered timeline based on active pillar, sorted descending by dayNumber
  const displayedTimeline = (
    activePillar === 'all'
      ? timelineItems
      : timelineItems.filter((t) => t.pillar === activePillar)
  ).slice().sort((a, b) => b.dayNumber - a.dayNumber);

  const handleShareProfile = () => {
    vibrateLight();
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSelectPillar = (pillar: FocusPillar | 'all') => {
    vibrateLight();
    setActivePillar(pillar);
  };

  const handleAddMilestoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    vibrateStreakMilestone();
    const day = parseInt(newDayNum, 10) || 43;
    const pillarMeta = {
      building: { label: 'Building', icon: '💻' },
      fitness: { label: 'Fitness', icon: '🏋️' },
      learning: { label: 'Learning', icon: '🧠' },
    }[newPillar];

    const newMilestone: TimelineMilestone = {
      id: `tl_custom_${Date.now()}`,
      pillar: newPillar,
      pillarLabel: pillarMeta.label,
      pillarIcon: pillarMeta.icon,
      dayNumber: day,
      dayLabel: `Day ${day}`,
      title: newTitle.trim(),
      note: newNote.trim() || undefined,
      dateStr: 'Just now',
      isKeyMilestone: true,
    };

    setTimelineItems((prev) => [newMilestone, ...prev]);
    setNewTitle('');
    setNewNote('');
    setIsAddMilestoneOpen(false);
  };

  return (
    <div
      id="person-profile-dossier-screen"
      className="min-h-full pb-24 bg-white dark:bg-black text-black dark:text-white transition-colors"
    >
      {/* Top Header Navigation */}
      <div className="sticky top-0 z-20 bg-white/95 dark:bg-black/95 backdrop-blur-md border-b border-black/10 dark:border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={() => {
                vibrateLight();
                onBack();
              }}
              className="p-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] text-black/70 dark:text-white/70 transition-colors active:scale-95"
              aria-label="Go back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-black/40 dark:text-white/40">
                Person Dossier
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#2F6FED]" />
            </div>
            <h1 className="text-base font-semibold text-black dark:text-white truncate">
              Rahul
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShareProfile}
            className="p-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] text-black/70 dark:text-white/70 transition-colors active:scale-95 text-xs flex items-center gap-1.5"
            aria-label="Share Rahul's Dossier"
            title="Copy link to dossier"
          >
            {copiedLink ? (
              <>
                <Check className="w-4 h-4 text-[#2F6FED]" />
                <span className="text-[11px] font-medium text-[#2F6FED] font-mono">Copied</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span className="text-[11px] font-medium hidden sm:inline">Share</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-5 max-w-lg mx-auto space-y-5">
        {/* ========================================================
            PERSON IDENTITY CARD (ChallengeDailyProofProgressBar tokens)
            ======================================================== */}
        <div className="bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-3xl p-4 sm:p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {/* Avatar with verified signal blue badge */}
              <div className="relative shrink-0">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80"
                  alt="Rahul"
                  className="w-14 h-14 rounded-2xl object-cover border border-black/10 dark:border-white/10"
                  referrerPolicy="no-referrer"
                />
                <CheckCircle2
                  className="w-4 h-4 text-[#2F6FED] bg-white dark:bg-black rounded-full absolute -bottom-1 -right-1"
                  aria-label="Verified Creator"
                />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-semibold text-black dark:text-white truncate">
                    Rahul
                  </h2>
                  <span className="text-[11px] font-medium text-[#2F6FED] bg-[#2F6FED]/10 px-2 py-0.5 rounded-full font-mono">
                    @rahul
                  </span>
                </div>
                <p className="text-xs text-black/60 dark:text-white/60 mt-1 leading-relaxed">
                  Building products, running 10K, and learning Python in public.
                </p>
              </div>
            </div>

            {/* Active Streak Pill */}
            <div className="px-3 py-1 rounded-full bg-[#2F6FED]/10 text-[#2F6FED] text-xs font-medium flex items-center gap-1.5 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2F6FED]" />
              <span className="font-mono font-semibold">42d streak</span>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-2 bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 rounded-2xl p-3 text-center">
            <div>
              <span className="text-base font-semibold font-mono text-black dark:text-white block">
                42
              </span>
              <span className="text-[10px] font-medium text-black/50 dark:text-white/50 uppercase tracking-wider">
                Days Active
              </span>
            </div>
            <div>
              <span className="text-base font-semibold font-mono text-[#2F6FED] block">
                3
              </span>
              <span className="text-[10px] font-medium text-black/50 dark:text-white/50 uppercase tracking-wider">
                Pillars
              </span>
            </div>
            <div>
              <span className="text-base font-semibold font-mono text-black dark:text-white block">
                100%
              </span>
              <span className="text-[10px] font-medium text-black/50 dark:text-white/50 uppercase tracking-wider">
                Daily Proofs
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================
            THREE FOCUS PILLARS (Interactive Click Targets)
            Building → 💻 | Fitness → 🏋️ | Learning → 🧠
            ======================================================== */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs px-1">
            <span className="font-medium text-black/50 dark:text-white/50">
              Focus pillars
            </span>
            {activePillar !== 'all' && (
              <button
                onClick={() => handleSelectPillar('all')}
                className="text-[11px] font-medium text-[#2F6FED] hover:underline"
              >
                Show all
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            {/* Building → 💻 */}
            <button
              id="pillar-btn-building"
              onClick={() => handleSelectPillar('building')}
              className={`p-3 rounded-2xl text-left transition-all border ${
                activePillar === 'building'
                  ? 'bg-black/[0.05] dark:bg-white/[0.08] border-[#2F6FED] shadow-sm'
                  : 'bg-black/[0.02] dark:bg-white/[0.03] border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-lg">💻</span>
                {activePillar === 'building' ? (
                  <span className="w-2 h-2 rounded-full bg-[#2F6FED]" />
                ) : (
                  <span className="text-[10px] text-black/30 dark:text-white/30 font-mono">
                    Active
                  </span>
                )}
              </div>
              <div className="font-semibold text-xs text-black dark:text-white">
                Building
              </div>
              <div className="text-[10px] text-black/50 dark:text-white/50 font-mono mt-0.5">
                Building → 💻
              </div>
            </button>

            {/* Fitness → 🏋️ */}
            <button
              id="pillar-btn-fitness"
              onClick={() => handleSelectPillar('fitness')}
              className={`p-3 rounded-2xl text-left transition-all border ${
                activePillar === 'fitness'
                  ? 'bg-black/[0.05] dark:bg-white/[0.08] border-[#2F6FED] shadow-sm'
                  : 'bg-black/[0.02] dark:bg-white/[0.03] border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-lg">🏋️</span>
                {activePillar === 'fitness' ? (
                  <span className="w-2 h-2 rounded-full bg-[#2F6FED]" />
                ) : (
                  <span className="text-[10px] text-black/30 dark:text-white/30 font-mono">
                    Active
                  </span>
                )}
              </div>
              <div className="font-semibold text-xs text-black dark:text-white">
                Fitness
              </div>
              <div className="text-[10px] text-black/50 dark:text-white/50 font-mono mt-0.5">
                Fitness → 🏋️
              </div>
            </button>

            {/* Learning → 🧠 */}
            <button
              id="pillar-btn-learning"
              onClick={() => handleSelectPillar('learning')}
              className={`p-3 rounded-2xl text-left transition-all border ${
                activePillar === 'learning'
                  ? 'bg-black/[0.05] dark:bg-white/[0.08] border-[#2F6FED] shadow-sm'
                  : 'bg-black/[0.02] dark:bg-white/[0.03] border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-lg">🧠</span>
                {activePillar === 'learning' ? (
                  <span className="w-2 h-2 rounded-full bg-[#2F6FED]" />
                ) : (
                  <span className="text-[10px] text-black/30 dark:text-white/30 font-mono">
                    Active
                  </span>
                )}
              </div>
              <div className="font-semibold text-xs text-black dark:text-white">
                Learning
              </div>
              <div className="text-[10px] text-black/50 dark:text-white/50 font-mono mt-0.5">
                Learning → 🧠
              </div>
            </button>
          </div>

          {/* Active Filter Notice */}
          {activePillar !== 'all' && (
            <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-[#2F6FED]/5 border border-[#2F6FED]/20 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2F6FED]" />
                <span className="text-black/80 dark:text-white/80 font-medium">
                  Showing <strong className="capitalize text-[#2F6FED]">{activePillar}</strong> related stuff only
                </span>
              </div>
              <button
                onClick={() => handleSelectPillar('all')}
                className="text-[10px] text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white underline font-mono"
              >
                Reset filter
              </button>
            </div>
          )}
        </div>

        {/* ========================================================
            PROGRESS TIMELINE
            Day 42 — shipped landing page
            Day 35 — first 10 users
            Day 27 — fixed authentication
            Day 18 — started backend
            Day 1 — "I'm building my first product."
            ======================================================== */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between text-xs px-1">
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-black dark:text-white">
                Progress timeline
              </h3>
              <span className="text-[10px] font-mono text-black/50 dark:text-white/50">
                ({displayedTimeline.length})
              </span>
            </div>

            <button
              onClick={() => {
                vibrateLight();
                setIsAddMilestoneOpen(true);
              }}
              className="py-1 px-2.5 rounded-lg bg-black/[0.03] dark:bg-white/[0.04] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] text-xs font-medium text-black/70 dark:text-white/70 flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log update</span>
            </button>
          </div>

          {/* Timeline Container */}
          <div className="bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-3xl p-4 sm:p-5">
            {displayedTimeline.length === 0 ? (
              <div className="text-center py-8 text-black/40 dark:text-white/40 text-xs">
                No updates logged for this focus area yet.
              </div>
            ) : (
              <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-black/10 dark:before:bg-white/10">
                {displayedTimeline.map((item, idx) => {
                  const isBuilding = item.pillar === 'building';
                  return (
                    <div
                      key={item.id}
                      id={`timeline-item-${item.id}`}
                      onClick={() => {
                        vibrateLight();
                        setSelectedMilestone(
                          selectedMilestone?.id === item.id ? null : item
                        );
                      }}
                      className="relative group cursor-pointer"
                    >
                      {/* Node Bullet */}
                      <span
                        className={`absolute -left-6 top-1.5 w-[9px] h-[9px] rounded-full border-2 border-white dark:border-black transition-all ${
                          item.isKeyMilestone
                            ? 'bg-[#2F6FED] ring-2 ring-[#2F6FED]/20'
                            : 'bg-black/30 dark:bg-white/30 group-hover:bg-[#2F6FED]'
                        }`}
                      />

                      {/* Content Card */}
                      <div className="p-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 hover:border-black/15 dark:hover:border-white/15 transition-all">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Day Badge in Mono */}
                            <span className="font-mono text-xs font-semibold text-black dark:text-white">
                              {item.dayLabel}
                            </span>
                            <span className="text-black/30 dark:text-white/30">—</span>
                            {/* Title */}
                            <span className="text-xs font-medium text-black dark:text-white">
                              {item.title}
                            </span>
                          </div>

                          {/* Track Icon / Pill */}
                          <span className="text-[11px] font-mono text-black/40 dark:text-white/40 shrink-0">
                            {item.pillarIcon}
                          </span>
                        </div>

                        {/* Optional detail note */}
                        {item.note && (
                          <p className="text-[11px] text-black/60 dark:text-white/60 mt-1.5 leading-relaxed">
                            {item.note}
                          </p>
                        )}

                        {/* Footer metadata */}
                        <div className="flex items-center justify-between text-[10px] font-mono text-black/40 dark:text-white/40 mt-2 pt-1.5 border-t border-black/5 dark:border-white/5">
                          <span className="capitalize">{item.pillarLabel}</span>
                          <span>{item.dateStr || `${item.dayNumber} days logged`}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Action button to share or post new proof */}
        {onOpenCreatePost && (
          <div className="pt-2">
            <button
              onClick={() => {
                vibrateLight();
                onOpenCreatePost();
              }}
              className="w-full py-3 px-4 rounded-2xl bg-[#2F6FED] hover:bg-[#2861d6] text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 min-h-[44px] shadow-sm active:scale-[0.99]"
            >
              <Zap className="w-4 h-4" />
              <span>Post daily proof for Rahul</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================
          ADD MILESTONE / UPDATE MODAL
          ======================================================== */}
      {isAddMilestoneOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-t-3xl sm:rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#2F6FED]" />
                <h3 className="text-sm font-semibold text-black dark:text-white">
                  Log New Progress Milestone
                </h3>
              </div>
              <button
                onClick={() => setIsAddMilestoneOpen(false)}
                className="p-1 rounded-lg text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddMilestoneSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-medium text-black/60 dark:text-white/60 block mb-1">
                  Focus Track
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['building', 'fitness', 'learning'] as FocusPillar[]).map((p) => {
                    const meta = {
                      building: { icon: '💻', name: 'Building' },
                      fitness: { icon: '🏋️', name: 'Fitness' },
                      learning: { icon: '🧠', name: 'Learning' },
                    }[p];
                    return (
                      <button
                        type="button"
                        key={p}
                        onClick={() => setNewPillar(p)}
                        className={`p-2 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 transition-all ${
                          newPillar === p
                            ? 'bg-[#2F6FED]/10 border-[#2F6FED] text-[#2F6FED]'
                            : 'bg-black/[0.02] dark:bg-white/[0.03] border-black/10 dark:border-white/10 text-black/70 dark:text-white/70'
                        }`}
                      >
                        <span>{meta.icon}</span>
                        <span>{meta.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-black/60 dark:text-white/60 block mb-1">
                  Day Number
                </label>
                <input
                  type="number"
                  value={newDayNum}
                  onChange={(e) => setNewDayNum(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/10 dark:border-white/10 text-xs font-mono text-black dark:text-white focus:outline-none focus:border-[#2F6FED]"
                  placeholder="e.g. 43"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-black/60 dark:text-white/60 block mb-1">
                  Milestone Headline
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/10 dark:border-white/10 text-xs text-black dark:text-white focus:outline-none focus:border-[#2F6FED]"
                  placeholder='e.g. launched billing & Stripe webhook'
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-black/60 dark:text-white/60 block mb-1">
                  Detailed Note (Optional)
                </label>
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/10 dark:border-white/10 text-xs text-black dark:text-white focus:outline-none focus:border-[#2F6FED]"
                  placeholder="Add context, telemetry, or proof link..."
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#2F6FED] hover:bg-[#2861d6] text-white font-semibold text-xs transition-colors"
                >
                  Save Milestone
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddMilestoneOpen(false)}
                  className="py-2.5 px-4 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] text-black/70 dark:text-white/70 font-medium text-xs hover:bg-black/[0.06] dark:hover:bg-white/[0.08]"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
