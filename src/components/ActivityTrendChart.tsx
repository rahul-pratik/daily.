import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { TrendingUp, Activity, Flame, Calendar, Award, Zap, ChevronRight } from 'lucide-react';
import { User, Post, ChallengeProgressPost, PersonalHabit } from '../types';
import { DailyStorageService, getTodayDateString } from '../services/storage';

interface ActivityTrendChartProps {
  user: User;
  posts?: Post[];
  challenges?: ChallengeProgressPost[];
  habits?: PersonalHabit[];
  className?: string;
  onOpenDayDetails?: (dateStr: string) => void;
}

type MetricView = 'combined' | 'posts' | 'habits' | 'streak';

interface DayDataPoint {
  dateStr: string;
  shortLabel: string; // e.g. "Aug 3", "Sep 1"
  dayNumber: number;
  isActive: boolean;
  postsCount: number;
  communityCount: number;
  challengeCount: number;
  habitsCount: number;
  messagesCount: number;
  activityScore: number;
  runningStreak: number;
}

export const ActivityTrendChart: React.FC<ActivityTrendChartProps> = ({
  user,
  posts = [],
  challenges = [],
  habits = [],
  className = '',
  onOpenDayDetails,
}) => {
  const [metricView, setMetricView] = useState<MetricView>('combined');
  const [hoveredDay, setHoveredDay] = useState<DayDataPoint | null>(null);

  // Compute 30-day chronological dataset
  const chartData = useMemo(() => {
    const data: DayDataPoint[] = [];
    const today = new Date();
    const allPosts = posts.length > 0 ? posts : DailyStorageService.getAllPosts();
    const allHabits = habits.length > 0 ? habits : DailyStorageService.getPersonalHabits();
    const allChallenges = challenges.length > 0 ? challenges : DailyStorageService.getAllChallengeProgressPosts();
    const allMessages = DailyStorageService.getAllMessages();

    let currentStreakCount = 0;

    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const shortLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      // Count posts on this date
      const userPostsOnDay = allPosts.filter((p) => {
        if (p.userId !== user.id) return false;
        if (i === 0 && (p.createdAt === 'Just now' || p.createdAt.includes('m ago') || p.createdAt.includes('h ago'))) {
          return true;
        }
        return p.createdAt.includes(dateStr) || (p as any).postDate === dateStr;
      });

      // Count challenge posts on this date
      const userChallengesOnDay = allChallenges.filter((cp) => {
        if (cp.userId !== user.id && cp.userId !== 'user_me') return false;
        if (i === 0 && (cp.createdAt === 'Just now' || cp.createdAt.includes('m ago') || cp.createdAt.includes('h ago'))) {
          return true;
        }
        return cp.postDate === dateStr;
      });

      // Count habits completed on this date
      const habitsOnDay = allHabits.filter((h) => h.completedDates?.includes(dateStr));

      // Messages exchanged on this day
      const messagesOnDay = allMessages.filter(
        (m) => m.senderId === user.id || m.receiverId === user.id
      ).length > 0 ? 1 : 0;

      // Activity list from user profile
      const hasUserActivityDate = user.activityDates?.includes(dateStr);

      const postsCount = userPostsOnDay.length;
      const challengeCount = userChallengesOnDay.length;
      const habitsCount = habitsOnDay.length;
      const isDayActive = hasUserActivityDate || postsCount > 0 || challengeCount > 0 || habitsCount > 0;

      if (isDayActive) {
        currentStreakCount += 1;
      } else {
        currentStreakCount = 0;
      }

      // Activity score: weighted formula (post = 10pts, challenge = 8pts, habit = 4pts, active = 3pts)
      const activityScore =
        postsCount * 10 +
        challengeCount * 8 +
        habitsCount * 4 +
        (isDayActive ? 3 : 0) +
        messagesOnDay * 2;

      data.push({
        dateStr,
        shortLabel,
        dayNumber: 30 - i,
        isActive: isDayActive,
        postsCount,
        communityCount: userPostsOnDay.filter((p) => Boolean(p.communityId)).length,
        challengeCount,
        habitsCount,
        messagesCount: messagesOnDay,
        activityScore,
        runningStreak: currentStreakCount,
      });
    }

    return data;
  }, [user, posts, challenges, habits]);

  // Aggregate 30-Day Metrics
  const stats = useMemo(() => {
    const activeDaysCount = chartData.filter((d) => d.isActive).length;
    const consistencyRate = Math.round((activeDaysCount / 30) * 100);
    const totalProofs = chartData.reduce((acc, d) => acc + d.postsCount, 0);
    const totalScore = chartData.reduce((acc, d) => acc + d.activityScore, 0);
    const peakScore = Math.max(...chartData.map((d) => d.activityScore), 0);
    const bestStreak = Math.max(...chartData.map((d) => d.runningStreak), 0);
    const avgScorePerDay = (totalScore / 30).toFixed(1);

    return {
      activeDaysCount,
      consistencyRate,
      totalProofs,
      totalScore,
      peakScore,
      bestStreak,
      avgScorePerDay,
    };
  }, [chartData]);

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: DayDataPoint = payload[0].payload;
      return (
        <div className="bg-[#121212]/95 border border-[#D4AF37]/30 backdrop-blur-md rounded-2xl p-3.5 shadow-2xl text-white min-w-[190px] animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
            <span className="text-xs font-mono font-bold text-[#D4AF37]">{data.dateStr}</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-white/80">
              {data.isActive ? 'Active Day 🔥' : 'Rest Day'}
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-white/60">Activity Score:</span>
              <span className="font-bold text-[#D4AF37]">{data.activityScore} pts</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60">Discipline Proofs:</span>
              <span className="font-bold text-white">{data.postsCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60">Challenges Done:</span>
              <span className="font-bold text-emerald-400">{data.challengeCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60">Habits Checked:</span>
              <span className="font-bold text-blue-400">{data.habitsCount}</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-white/5">
              <span className="text-white/60">Streak at Day:</span>
              <span className="font-bold text-amber-400">{data.runningStreak} days 🔥</span>
            </div>
          </div>

          {onOpenDayDetails && (
            <div className="mt-2.5 pt-2 border-t border-white/10 text-[10px] text-white/50 text-center font-medium flex items-center justify-center gap-1">
              <span>Click to view day diary</span>
              <ChevronRight className="w-3 h-3 text-[#D4AF37]" />
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`bg-white/5 border border-white/5 rounded-[28px] p-5 shadow-xl space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white tracking-tight flex items-center gap-1.5">
              <span>Activity Trend</span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20">
                30 Days
              </span>
            </h3>
            <p className="text-[11px] text-white/50">
              Consistency frequency & output momentum
            </p>
          </div>
        </div>

        {/* Metric Selector Pills */}
        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setMetricView('combined')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors whitespace-nowrap ${
              metricView === 'combined'
                ? 'bg-[#D4AF37] text-black font-black shadow-sm'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Activity Score
          </button>
          <button
            onClick={() => setMetricView('posts')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors whitespace-nowrap ${
              metricView === 'posts'
                ? 'bg-[#D4AF37] text-black font-black shadow-sm'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Proofs & Posts
          </button>
          <button
            onClick={() => setMetricView('streak')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors whitespace-nowrap ${
              metricView === 'streak'
                ? 'bg-[#D4AF37] text-black font-black shadow-sm'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Streak Line
          </button>
        </div>
      </div>

      {/* 4 Summary Stat Mini-Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-black/30 border border-white/5 rounded-2xl p-3">
          <div className="flex items-center justify-between text-white/50 text-[10px] font-bold mb-1">
            <span>Consistency</span>
            <Flame className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-lg font-black text-white">{stats.consistencyRate}%</div>
          <div className="text-[10px] text-white/40">{stats.activeDaysCount}/30 active days</div>
        </div>

        <div className="bg-black/30 border border-white/5 rounded-2xl p-3">
          <div className="flex items-center justify-between text-white/50 text-[10px] font-bold mb-1">
            <span>Proofs Logged</span>
            <Activity className="w-3.5 h-3.5 text-[#D4AF37]" />
          </div>
          <div className="text-lg font-black text-[#D4AF37]">{stats.totalProofs}</div>
          <div className="text-[10px] text-white/40">Verified submissions</div>
        </div>

        <div className="bg-black/30 border border-white/5 rounded-2xl p-3">
          <div className="flex items-center justify-between text-white/50 text-[10px] font-bold mb-1">
            <span>Peak Day</span>
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-lg font-black text-emerald-400">{stats.peakScore} pts</div>
          <div className="text-[10px] text-white/40">Highest output day</div>
        </div>

        <div className="bg-black/30 border border-white/5 rounded-2xl p-3">
          <div className="flex items-center justify-between text-white/50 text-[10px] font-bold mb-1">
            <span>Best Run</span>
            <Award className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-lg font-black text-blue-400">{stats.bestStreak}d</div>
          <div className="text-[10px] text-white/40">Max unbroken streak</div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-[210px] w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {metricView === 'streak' ? (
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
              onClick={(e: any) => {
                if (e && e.activePayload && e.activePayload[0] && onOpenDayDetails) {
                  onOpenDayDetails(e.activePayload[0].payload.dateStr);
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis
                dataKey="shortLabel"
                stroke="rgba(255,255,255,0.3)"
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                interval={4}
              />
              <YAxis
                stroke="rgba(255,255,255,0.3)"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="runningStreak"
                stroke="#F59E0B"
                strokeWidth={2.5}
                dot={{ r: 2, fill: '#F59E0B' }}
                activeDot={{ r: 5, fill: '#D4AF37', stroke: '#000', strokeWidth: 2 }}
              />
            </LineChart>
          ) : (
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
              onClick={(e: any) => {
                if (e && e.activePayload && e.activePayload[0] && onOpenDayDetails) {
                  onOpenDayDetails(e.activePayload[0].payload.dateStr);
                }
              }}
            >
              <defs>
                <linearGradient id="activityGoldGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#D4AF37" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="postsBlueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#60A5FA" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis
                dataKey="shortLabel"
                stroke="rgba(255,255,255,0.3)"
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                interval={4}
              />
              <YAxis
                stroke="rgba(255,255,255,0.3)"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey={metricView === 'posts' ? 'postsCount' : 'activityScore'}
                stroke={metricView === 'posts' ? '#60A5FA' : '#D4AF37'}
                strokeWidth={2.5}
                fillOpacity={1}
                fill={metricView === 'posts' ? 'url(#postsBlueGradient)' : 'url(#activityGoldGradient)'}
                activeDot={{ r: 5, fill: '#fff', stroke: '#D4AF37', strokeWidth: 2 }}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Footer prompt */}
      <div className="flex items-center justify-between text-[11px] text-white/50 pt-1 border-t border-white/5">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
          <span>Tap any point on the chart to jump into that day’s diary</span>
        </div>
        <span className="font-mono text-white/40">30d Rolling Window</span>
      </div>
    </div>
  );
};
