import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  TrendingUp,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Sparkles,
  Flame,
  Award,
  Users,
  Compass,
  ArrowUpRight,
  Check,
  Copy,
  BarChart3,
  Calendar,
  Layers,
  Zap,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { Post } from '../types';
import { vibrateLight } from '../services/haptics';

interface PostInsightsModalProps {
  isOpen: boolean;
  post: Post | null;
  onClose: () => void;
  onSharePost?: (post: Post) => void;
}

export const PostInsightsModal: React.FC<PostInsightsModalProps> = ({
  isOpen,
  post,
  onClose,
  onSharePost,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeMetricView, setActiveMetricView] = useState<'all' | 'views' | 'likes' | 'shares'>('all');
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Safe fallback if post is missing so screen is NEVER black
  const safePost: Post = post || {
    id: 'demo_insights',
    userId: 'user_me',
    name: 'Your Daily Progress',
    username: 'alexrivera',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    userStreak: 7,
    content: 'Overall account daily consistency & engagement overview.',
    tags: ['DailyHabits', 'Streak', 'Analytics'],
    likesCount: 67,
    likedByMe: true,
    viewsCount: 412,
    sharesCount: 18,
    comments: [],
    createdAt: 'Today',
    isDailyStreakPost: true,
  };

  const likesCount = safePost.likesCount || 0;
  const commentsCount = safePost.comments?.length || 0;
  const sharesCount = safePost.sharesCount ?? Math.max(Math.floor(likesCount * 0.25), 1);
  const viewsCount =
    safePost.viewsCount ?? Math.max(likesCount * 6 + commentsCount * 8 + 35, 12);

  const totalInteractions = likesCount + commentsCount + sharesCount;
  const engagementRate =
    viewsCount > 0 ? ((totalInteractions / viewsCount) * 100).toFixed(1) : '0.0';
  const likeRate = viewsCount > 0 ? ((likesCount / viewsCount) * 100).toFixed(1) : '0.0';

  // 7-day trend simulation data
  const days = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7 (Today)'];
  const viewSteps = [0.14, 0.29, 0.46, 0.63, 0.79, 0.91, 1.0];
  const likeSteps = [0.16, 0.33, 0.52, 0.69, 0.83, 0.93, 1.0];
  const shareSteps = [0.09, 0.22, 0.42, 0.62, 0.76, 0.89, 1.0];

  const chartData = days.map((day, idx) => ({
    day,
    shortDay: `D${idx + 1}`,
    views: Math.max(1, Math.round(viewsCount * viewSteps[idx])),
    likes: Math.max(0, Math.round(likesCount * likeSteps[idx])),
    shares: Math.max(0, Math.round(sharesCount * shareSteps[idx])),
  }));

  // Dynamic performance tier calculation
  const numRate = parseFloat(engagementRate);
  let performanceTier = 'Good';
  let tierBadgeColor = 'bg-blue-500/20 text-blue-400 border-blue-500/40';
  let tierHeadline = 'Solid Community Reach';

  if (numRate >= 18 || totalInteractions >= 50) {
    performanceTier = 'Top 5% Viral';
    tierBadgeColor = 'bg-[#2F6FED]/20 text-[#2F6FED] border-[#2F6FED]/50';
    tierHeadline = 'Outstanding Streak Momentum! 🚀';
  } else if (numRate >= 10 || totalInteractions >= 20) {
    performanceTier = 'Top 15% High Performer';
    tierBadgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    tierHeadline = 'High Engagement Rate 🔥';
  }

  // Estimated traffic source distribution
  const followerRatio = 64;
  const discoverRatio = safePost.tags && safePost.tags.length > 0 ? 26 : 18;
  const sharedRatio = 100 - followerRatio - discoverRatio;

  // Max value for SVG line graph scaling
  const maxViews = Math.max(...chartData.map((d) => d.views), 10);
  const maxLikes = Math.max(...chartData.map((d) => d.likes), 1);
  const maxShares = Math.max(...chartData.map((d) => d.shares), 1);

  // Helper to generate SVG points string
  const svgWidth = 440;
  const svgHeight = 160;
  const paddingX = 30;
  const paddingY = 20;
  const chartW = svgWidth - paddingX * 2;
  const chartH = svgHeight - paddingY * 2;

  const getPoints = (key: 'views' | 'likes' | 'shares', maxVal: number) => {
    return chartData
      .map((d, i) => {
        const x = paddingX + (i / (chartData.length - 1)) * chartW;
        const y = svgHeight - paddingY - (d[key] / maxVal) * chartH;
        return `${x},${y}`;
      })
      .join(' ');
  };

  return (
    <div
      id="post-insights-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#0F0F0F] border border-white/15 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] text-white animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/[0.03]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                Post Engagement & Analytics
              </h2>
              <p className="text-[11px] text-white/50">Performance metrics over last 7 days</p>
            </div>
          </div>
          <button
            id="close-insights-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 no-scrollbar bg-[#0F0F0F]">
          {/* Post Summary Preview Banner */}
          <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-3">
            {safePost.imageUrl ? (
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-black flex-shrink-0 border border-white/10">
                <img
                  src={safePost.imageUrl}
                  alt="Post preview"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 text-white/40">
                <Zap className="w-6 h-6 text-[#2F6FED]" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-[11px] text-white/50 mb-0.5">
                <span className="flex items-center gap-1 font-medium text-white/70">
                  <Calendar className="w-3 h-3" />
                  {safePost.createdAt}
                </span>
                {safePost.isDailyStreakPost && (
                  <span className="text-[#2F6FED] font-bold flex items-center gap-0.5 bg-[#2F6FED]/10 px-2 py-0.2 rounded-full">
                    🔥 Day {safePost.userStreak}
                  </span>
                )}
              </div>
              <p className="text-xs text-white/90 line-clamp-2 leading-snug">
                {safePost.content}
              </p>
            </div>
          </div>

          {/* 7-Day Performance Line Chart Section */}
          <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#2F6FED]" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  7-Day Performance Trend
                </h3>
              </div>
              {/* Metric filter buttons */}
              <div className="flex items-center gap-1 bg-black/50 p-1 rounded-xl border border-white/10 text-[10px]">
                <button
                  onClick={() => setActiveMetricView('all')}
                  className={`px-2 py-0.5 rounded-lg transition-colors font-bold ${
                    activeMetricView === 'all'
                      ? 'bg-white text-black'
                      : 'text-white/40 hover:text-white'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setActiveMetricView('views')}
                  className={`px-2 py-0.5 rounded-lg transition-colors font-bold ${
                    activeMetricView === 'views'
                      ? 'bg-[#2F6FED] text-white'
                      : 'text-white/40 hover:text-white'
                  }`}
                >
                  Views
                </button>
                <button
                  onClick={() => setActiveMetricView('likes')}
                  className={`px-2 py-0.5 rounded-lg transition-colors font-bold ${
                    activeMetricView === 'likes'
                      ? 'bg-red-500 text-white'
                      : 'text-white/40 hover:text-white'
                  }`}
                >
                  Likes
                </button>
                <button
                  onClick={() => setActiveMetricView('shares')}
                  className={`px-2 py-0.5 rounded-lg transition-colors font-bold ${
                    activeMetricView === 'shares'
                      ? 'bg-blue-500 text-white'
                      : 'text-white/40 hover:text-white'
                  }`}
                >
                  Shares
                </button>
              </div>
            </div>

            {/* High-contrast, Guaranteed-rendered Responsive SVG Line Chart */}
            <div className="relative w-full bg-black/40 rounded-xl p-3 border border-white/5 overflow-hidden">
              <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-44 overflow-visible">
                {/* Horizontal Grid lines */}
                {[0.25, 0.5, 0.75, 1].map((ratio) => (
                  <line
                    key={ratio}
                    x1={paddingX}
                    y1={svgHeight - paddingY - ratio * chartH}
                    x2={svgWidth - paddingX}
                    y2={svgHeight - paddingY - ratio * chartH}
                    stroke="rgba(255,255,255,0.07)"
                    strokeDasharray="4 4"
                  />
                ))}

                {/* Base line */}
                <line
                  x1={paddingX}
                  y1={svgHeight - paddingY}
                  x2={svgWidth - paddingX}
                  y2={svgHeight - paddingY}
                  stroke="rgba(255,255,255,0.15)"
                />

                {/* Views Line (Orange) */}
                {(activeMetricView === 'all' || activeMetricView === 'views') && (
                  <>
                    <polyline
                      fill="none"
                      stroke="#2F6FED"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={getPoints('views', maxViews)}
                    />
                    {chartData.map((d, i) => {
                      const cx = paddingX + (i / (chartData.length - 1)) * chartW;
                      const cy = svgHeight - paddingY - (d.views / maxViews) * chartH;
                      return (
                        <circle
                          key={`v-dot-${i}`}
                          cx={cx}
                          cy={cy}
                          r={hoveredPoint === i ? 6 : 3.5}
                          fill="#2F6FED"
                          stroke="#000"
                          strokeWidth="2"
                          className="cursor-pointer transition-all"
                          onMouseEnter={() => setHoveredPoint(i)}
                          onMouseLeave={() => setHoveredPoint(null)}
                        />
                      );
                    })}
                  </>
                )}

                {/* Likes Line (Red) */}
                {(activeMetricView === 'all' || activeMetricView === 'likes') && (
                  <>
                    <polyline
                      fill="none"
                      stroke="#EF4444"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={getPoints('likes', maxViews)}
                    />
                    {chartData.map((d, i) => {
                      const cx = paddingX + (i / (chartData.length - 1)) * chartW;
                      const cy = svgHeight - paddingY - (d.likes / maxViews) * chartH;
                      return (
                        <circle
                          key={`l-dot-${i}`}
                          cx={cx}
                          cy={cy}
                          r={hoveredPoint === i ? 5 : 3}
                          fill="#EF4444"
                          stroke="#000"
                          strokeWidth="1.5"
                        />
                      );
                    })}
                  </>
                )}

                {/* Shares Line (Blue) */}
                {(activeMetricView === 'all' || activeMetricView === 'shares') && (
                  <>
                    <polyline
                      fill="none"
                      stroke="#3B82F6"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={getPoints('shares', maxViews)}
                    />
                    {chartData.map((d, i) => {
                      const cx = paddingX + (i / (chartData.length - 1)) * chartW;
                      const cy = svgHeight - paddingY - (d.shares / maxViews) * chartH;
                      return (
                        <circle
                          key={`s-dot-${i}`}
                          cx={cx}
                          cy={cy}
                          r={hoveredPoint === i ? 5 : 2.5}
                          fill="#3B82F6"
                          stroke="#000"
                          strokeWidth="1.5"
                        />
                      );
                    })}
                  </>
                )}

                {/* X Axis Day Labels */}
                {chartData.map((d, i) => {
                  const x = paddingX + (i / (chartData.length - 1)) * chartW;
                  return (
                    <text
                      key={`lbl-${i}`}
                      x={x}
                      y={svgHeight - 4}
                      textAnchor="middle"
                      fill="rgba(255,255,255,0.4)"
                      fontSize="9"
                      fontWeight="bold"
                    >
                      {d.shortDay}
                    </text>
                  );
                })}
              </svg>

              {/* Chart Legend */}
              <div className="flex items-center justify-center gap-4 mt-2 pt-2 border-t border-white/5 text-[10px]">
                <div className="flex items-center gap-1.5 text-white/70">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#2F6FED]" />
                  <span>Views ({viewsCount})</span>
                </div>
                <div className="flex items-center gap-1.5 text-white/70">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <span>Likes ({likesCount})</span>
                </div>
                <div className="flex items-center gap-1.5 text-white/70">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span>Shares ({sharesCount})</span>
                </div>
              </div>
            </div>
          </div>

          {/* Key Metric Highlights (4 Cards Grid) */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Views */}
            <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between text-white/50 mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Total Views</span>
                <Eye className="w-4 h-4 text-blue-400" />
              </div>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-black text-white tracking-tight">
                  {viewsCount.toLocaleString()}
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center">
                  <ArrowUpRight className="w-2.5 h-2.5" /> Organic
                </span>
              </div>
              <p className="text-[10px] text-white/40 mt-1">
                Feed impressions & discovery
              </p>
            </div>

            {/* Likes */}
            <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between text-white/50 mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Likes & Fire</span>
                <Heart className="w-4 h-4 text-red-500 fill-red-500/20" />
              </div>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-black text-white tracking-tight">
                  {likesCount.toLocaleString()}
                </span>
                <span className="text-[10px] text-white/50 font-medium">
                  ({likeRate}%)
                </span>
              </div>
              <p className="text-[10px] text-white/40 mt-1">
                Streak encouragement reactions
              </p>
            </div>

            {/* Comments */}
            <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between text-white/50 mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Comments</span>
                <MessageCircle className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-black text-white tracking-tight">
                  {commentsCount.toLocaleString()}
                </span>
                <span className="text-[10px] text-white/50 font-medium">
                  replies
                </span>
              </div>
              <p className="text-[10px] text-white/40 mt-1">
                Active community conversations
              </p>
            </div>

            {/* Shares */}
            <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between text-white/50 mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Shares</span>
                <Share2 className="w-4 h-4 text-[#2F6FED]" />
              </div>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-black text-white tracking-tight">
                  {sharesCount.toLocaleString()}
                </span>
                <span className="text-[10px] text-[#2F6FED] font-semibold">
                  forwards
                </span>
              </div>
              <p className="text-[10px] text-white/40 mt-1">
                Sent to friends & habit groups
              </p>
            </div>
          </div>

          {/* Engagement Rate Score Card */}
          <div className="p-4 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl border border-white/15 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#2F6FED]" />
                <span className="text-xs font-bold text-white uppercase tracking-wide">
                  Overall Engagement Rate
                </span>
              </div>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${tierBadgeColor}`}>
                {performanceTier}
              </span>
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <div>
                <span className="text-3xl font-black text-white tracking-tight">
                  {engagementRate}%
                </span>
                <p className="text-xs text-white/60 font-medium mt-0.5">{tierHeadline}</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-white/50">Total Interactions</span>
                <p className="text-sm font-bold text-white">{totalInteractions} actions</p>
              </div>
            </div>

            {/* Visual Bar representation */}
            <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden flex gap-0.5">
              <div
                style={{ width: `${Math.min(100, Math.max(15, numRate * 4))}%` }}
                className="bg-gradient-to-r from-[#2F6FED] to-amber-400 h-full rounded-full"
              />
            </div>
          </div>

          {/* Audience Discovery Breakdown */}
          <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                Discovery Sources
              </span>
              <span className="text-[10px] text-white/40 font-medium">Estimated breakdown</span>
            </div>

            {/* Segmented Bar */}
            <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden flex gap-1 p-0.5">
              <div
                style={{ width: `${followerRatio}%` }}
                className="h-full bg-blue-500 rounded-full"
                title="Followers Home Feed"
              />
              <div
                style={{ width: `${discoverRatio}%` }}
                className="h-full bg-[#2F6FED] rounded-full"
                title="Discover & Tag Search"
              />
              <div
                style={{ width: `${sharedRatio}%` }}
                className="h-full bg-emerald-500 rounded-full"
                title="Direct & Group Shares"
              />
            </div>

            {/* Legend */}
            <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
              <div className="flex items-center gap-1.5 text-white/70">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="truncate">Feed ({followerRatio}%)</span>
              </div>
              <div className="flex items-center gap-1.5 text-white/70">
                <span className="w-2 h-2 rounded-full bg-[#2F6FED]" />
                <span className="truncate">Discover ({discoverRatio}%)</span>
              </div>
              <div className="flex items-center gap-1.5 text-white/70">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="truncate">Shares ({sharedRatio}%)</span>
              </div>
            </div>
          </div>

          {/* Actionable Streak Insight Tip */}
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-white/80 space-y-1">
              <p className="font-bold text-emerald-300">Streak Boost Tip</p>
              <p className="leading-relaxed text-white/70 text-[11px]">
                Posting your daily progress consistently before noon builds higher visibility across your habit clubs and encourages group check-ins!
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-5 py-3.5 border-t border-white/10 bg-white/[0.02] flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-white/10 min-h-[40px]"
          >
            Close
          </button>

          {onSharePost && safePost && (
            <button
              id="insights-share-post-btn"
              onClick={() => {
                onClose();
                onSharePost(safePost);
              }}
              className="flex-1 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/20 min-h-[40px]"
            >
              <Share2 className="w-3.5 h-3.5 text-white" />
              <span>Share to Groups</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
