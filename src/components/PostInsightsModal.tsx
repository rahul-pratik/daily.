import React, { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
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

  if (!isOpen || !post) return null;

  const likesCount = post.likesCount || 0;
  const commentsCount = post.comments?.length || 0;
  const sharesCount = post.sharesCount ?? Math.max(Math.floor(likesCount * 0.25), 1);
  const viewsCount =
    post.viewsCount ?? Math.max(likesCount * 6 + commentsCount * 8 + 35, 12);

  const totalInteractions = likesCount + commentsCount + sharesCount;
  const engagementRate =
    viewsCount > 0 ? ((totalInteractions / viewsCount) * 100).toFixed(1) : '0.0';
  const likeRate = viewsCount > 0 ? ((likesCount / viewsCount) * 100).toFixed(1) : '0.0';

  // 7-day trend simulation data for recharts
  const chartData = useMemo(() => {
    const days = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7 (Today)'];
    // Proportions scaling up to the current totals
    const viewSteps = [0.12, 0.28, 0.45, 0.62, 0.78, 0.9, 1.0];
    const likeSteps = [0.15, 0.32, 0.5, 0.68, 0.82, 0.92, 1.0];
    const shareSteps = [0.08, 0.2, 0.4, 0.6, 0.75, 0.88, 1.0];
    const commentSteps = [0.1, 0.25, 0.45, 0.65, 0.8, 0.9, 1.0];

    return days.map((day, idx) => ({
      day,
      views: Math.max(1, Math.round(viewsCount * viewSteps[idx])),
      likes: Math.max(0, Math.round(likesCount * likeSteps[idx])),
      shares: Math.max(0, Math.round(sharesCount * shareSteps[idx])),
      comments: Math.max(0, Math.round(commentsCount * commentSteps[idx])),
    }));
  }, [viewsCount, likesCount, sharesCount, commentsCount]);

  // Dynamic performance tier calculation
  const numRate = parseFloat(engagementRate);
  let performanceTier = 'Good';
  let tierBadgeColor = 'bg-blue-500/10 text-blue-400 border-blue-500/30';
  let tierHeadline = 'Solid Community Reach';

  if (numRate >= 18 || totalInteractions >= 50) {
    performanceTier = 'Top 5% Viral';
    tierBadgeColor = 'bg-[#FF4D00]/20 text-[#FF4D00] border-[#FF4D00]/50';
    tierHeadline = 'Outstanding Streak Momentum! 🚀';
  } else if (numRate >= 10 || totalInteractions >= 20) {
    performanceTier = 'Top 15% High Performer';
    tierBadgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    tierHeadline = 'High Engagement Rate 🔥';
  }

  // Estimated traffic source distribution based on tags and streak
  const followerRatio = 64;
  const discoverRatio = post.tags && post.tags.length > 0 ? 26 : 18;
  const sharedRatio = 100 - followerRatio - discoverRatio;

  const handleCopyLink = () => {
    vibrateLight();
    const fakeUrl = `${window.location.origin}/#post-${post.id}`;
    navigator.clipboard?.writeText(fakeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id="post-insights-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#0D0D0D] border border-white/15 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] text-white animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FF4D00]/10 border border-[#FF4D00]/30 flex items-center justify-center text-[#FF4D00]">
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
        <div className="flex-1 overflow-y-auto p-5 space-y-5 no-scrollbar">
          {/* Post Summary Preview Banner */}
          <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-3">
            {post.imageUrl ? (
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-black flex-shrink-0 border border-white/10">
                <img
                  src={post.imageUrl}
                  alt="Post preview"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 text-white/40">
                <Zap className="w-6 h-6 text-[#FF4D00]" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-[11px] text-white/50 mb-0.5">
                <span className="flex items-center gap-1 font-medium text-white/70">
                  <Calendar className="w-3 h-3" />
                  {post.createdAt}
                </span>
                {post.isDailyStreakPost && (
                  <span className="text-[#FF4D00] font-bold flex items-center gap-0.5 bg-[#FF4D00]/10 px-2 py-0.2 rounded-full">
                    🔥 Day {post.userStreak}
                  </span>
                )}
              </div>
              <p className="text-xs text-white/90 line-clamp-2 leading-snug">
                {post.content}
              </p>
            </div>
          </div>

          {/* 7-Day Performance Line Chart Section */}
          <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#FF4D00]" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  7-Day Performance Trend
                </h3>
              </div>
              {/* Metric filter buttons */}
              <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 text-[10px]">
                <button
                  onClick={() => setActiveMetricView('all')}
                  className={`px-2 py-0.5 rounded-lg transition-colors font-medium ${
                    activeMetricView === 'all'
                      ? 'bg-white/20 text-white'
                      : 'text-white/40 hover:text-white'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setActiveMetricView('views')}
                  className={`px-2 py-0.5 rounded-lg transition-colors font-medium ${
                    activeMetricView === 'views'
                      ? 'bg-[#FF4D00] text-black font-bold'
                      : 'text-white/40 hover:text-white'
                  }`}
                >
                  Views
                </button>
                <button
                  onClick={() => setActiveMetricView('likes')}
                  className={`px-2 py-0.5 rounded-lg transition-colors font-medium ${
                    activeMetricView === 'likes'
                      ? 'bg-red-500 text-white font-bold'
                      : 'text-white/40 hover:text-white'
                  }`}
                >
                  Likes
                </button>
                <button
                  onClick={() => setActiveMetricView('shares')}
                  className={`px-2 py-0.5 rounded-lg transition-colors font-medium ${
                    activeMetricView === 'shares'
                      ? 'bg-blue-500 text-white font-bold'
                      : 'text-white/40 hover:text-white'
                  }`}
                >
                  Shares
                </button>
              </div>
            </div>

            {/* Recharts LineChart */}
            <div className="h-52 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis
                    dataKey="day"
                    stroke="rgba(255,255,255,0.3)"
                    fontSize={10}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="rgba(255,255,255,0.3)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#141414',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '12px',
                      fontSize: '11px',
                      color: '#ffffff',
                      boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                    }}
                    labelStyle={{ color: '#FF4D00', fontWeight: 'bold', marginBottom: '4px' }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }}
                    iconType="circle"
                  />
                  {(activeMetricView === 'all' || activeMetricView === 'views') && (
                    <Line
                      type="monotone"
                      dataKey="views"
                      name="Views"
                      stroke="#FF4D00"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: '#FF4D00' }}
                      activeDot={{ r: 5 }}
                    />
                  )}
                  {(activeMetricView === 'all' || activeMetricView === 'likes') && (
                    <Line
                      type="monotone"
                      dataKey="likes"
                      name="Likes & Reactions"
                      stroke="#EF4444"
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#EF4444' }}
                      activeDot={{ r: 5 }}
                    />
                  )}
                  {(activeMetricView === 'all' || activeMetricView === 'shares') && (
                    <Line
                      type="monotone"
                      dataKey="shares"
                      name="Shares & Forwards"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#3B82F6' }}
                      activeDot={{ r: 5 }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
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
                Unique feed & search impressions
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
                <Share2 className="w-4 h-4 text-[#FF4D00]" />
              </div>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-black text-white tracking-tight">
                  {sharesCount.toLocaleString()}
                </span>
                <span className="text-[10px] text-[#FF4D00] font-semibold">
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
                <TrendingUp className="w-4 h-4 text-[#FF4D00]" />
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
                className="bg-gradient-to-r from-[#FF4D00] to-amber-400 h-full rounded-full"
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
                className="h-full bg-[#FF4D00] rounded-full"
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
                <span className="w-2 h-2 rounded-full bg-[#FF4D00]" />
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

          {onSharePost && (
            <button
              id="insights-share-post-btn"
              onClick={() => {
                onClose();
                onSharePost(post);
              }}
              className="flex-1 py-2.5 px-3 rounded-xl bg-[#FF4D00] hover:bg-[#FF4D00]/90 text-black text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-[#FF4D00]/20 min-h-[40px]"
            >
              <Share2 className="w-3.5 h-3.5 text-black" />
              <span>Share to Groups</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
