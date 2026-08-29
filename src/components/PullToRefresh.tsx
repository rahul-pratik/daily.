import React, { useState, useRef, useEffect, useCallback } from 'react';
import { RefreshCw, Flame, Check, ArrowDown } from 'lucide-react';
import { vibratePullThreshold, vibrateRefreshComplete } from '../services/haptics';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
  pullText?: string;
  releaseText?: string;
  refreshingText?: string;
  completedText?: string;
  disabled?: boolean;
  className?: string;
  showManualButton?: boolean;
}

const PULL_THRESHOLD = 70; // px needed to trigger refresh
const MAX_PULL = 110; // max px indicator can be pulled down

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  pullText = 'Pull down to refresh',
  releaseText = 'Release to reload stream',
  refreshingText = 'Refreshing daily streams...',
  completedText = 'Stream updated • Just now',
  disabled = false,
  className = '',
  showManualButton = false,
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const startXRef = useRef(0);
  const currentYRef = useRef(0);
  const hasVibratedRef = useRef(false);
  const isRefreshingRef = useRef(false);

  isRefreshingRef.current = isRefreshing;

  const triggerRefreshAction = useCallback(async () => {
    if (isRefreshingRef.current) return;
    setIsRefreshing(true);
    setPullDistance(56); // Hold at comfortable spinner height
    try {
      await onRefresh();
    } catch {
      // Graceful error handling
    } finally {
      vibrateRefreshComplete();
      setIsCompleted(true);
      setTimeout(() => {
        setIsCompleted(false);
        setIsRefreshing(false);
        setPullDistance(0);
        hasVibratedRef.current = false;
      }, 700);
    }
  }, [onRefresh]);

  // Touch Gesture Handling
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (disabled || isRefreshing) return;
    const scrollTop = window.scrollY || document.documentElement.scrollTop || containerRef.current?.scrollTop || 0;
    if (scrollTop <= 1) {
      startYRef.current = e.touches[0].clientY;
      startXRef.current = e.touches[0].clientX;
      setIsDragging(true);
      hasVibratedRef.current = false;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging || disabled || isRefreshing) return;
    const currentY = e.touches[0].clientY;
    const currentX = e.touches[0].clientX;
    const diffY = currentY - startYRef.current;
    const diffX = Math.abs(currentX - startXRef.current);

    // If scrolling horizontally more than vertically, ignore
    if (diffX > diffY && diffY < 30) {
      return;
    }

    const scrollTop = window.scrollY || document.documentElement.scrollTop || containerRef.current?.scrollTop || 0;

    if (diffY > 0 && scrollTop <= 1) {
      // Resistance curve: logarithmic / fractional damping
      const dampedDistance = Math.min(MAX_PULL, Math.pow(diffY, 0.85) * 1.8);
      setPullDistance(dampedDistance);

      if (dampedDistance >= PULL_THRESHOLD && !hasVibratedRef.current) {
        vibratePullThreshold();
        hasVibratedRef.current = true;
      } else if (dampedDistance < PULL_THRESHOLD) {
        hasVibratedRef.current = false;
      }
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
      triggerRefreshAction();
    } else if (!isRefreshing) {
      setPullDistance(0);
      hasVibratedRef.current = false;
    }
  };

  // Mouse Drag Fallback for Desktop Testing
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || isRefreshing) return;
    const scrollTop = window.scrollY || document.documentElement.scrollTop || containerRef.current?.scrollTop || 0;
    if (scrollTop <= 1) {
      startYRef.current = e.clientY;
      setIsDragging(true);
      hasVibratedRef.current = false;
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || disabled || isRefreshing) return;
    const diffY = e.clientY - startYRef.current;
    const scrollTop = window.scrollY || document.documentElement.scrollTop || containerRef.current?.scrollTop || 0;

    if (diffY > 0 && scrollTop <= 1) {
      const dampedDistance = Math.min(MAX_PULL, Math.pow(diffY, 0.85) * 1.8);
      setPullDistance(dampedDistance);

      if (dampedDistance >= PULL_THRESHOLD && !hasVibratedRef.current) {
        vibratePullThreshold();
        hasVibratedRef.current = true;
      }
    }
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
      triggerRefreshAction();
    } else if (!isRefreshing) {
      setPullDistance(0);
      hasVibratedRef.current = false;
    }
  };

  const progress = Math.min(1, pullDistance / PULL_THRESHOLD);
  const rotationDeg = progress * 360;
  const isThresholdMet = pullDistance >= PULL_THRESHOLD;

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className={`relative w-full select-none ${className}`}
    >
      {/* Pull down indicator visual block */}
      <div
        style={{
          height: `${pullDistance}px`,
          opacity: pullDistance > 8 ? 1 : 0,
          transition: isDragging ? 'none' : 'height 0.28s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.2s ease',
        }}
        className="w-full overflow-hidden flex flex-col items-center justify-center pointer-events-none"
      >
        <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 shadow-lg shadow-black/40 text-white transform transition-transform">
          {isCompleted ? (
            <>
              <div className="w-5 h-5 rounded-full bg-emerald-500 text-black flex items-center justify-center animate-in zoom-in-75 duration-200">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <span className="text-[11px] font-bold text-emerald-400">
                {completedText}
              </span>
            </>
          ) : isRefreshing ? (
            <>
              <div className="relative w-5 h-5 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white/20 border-t-[#D4AF37] rounded-full animate-spin" />
                <Flame className="w-2.5 h-2.5 text-[#D4AF37] absolute fill-[#D4AF37]" />
              </div>
              <span className="text-[11px] font-extrabold text-white animate-pulse">
                {refreshingText}
              </span>
            </>
          ) : (
            <>
              <div
                style={{
                  transform: `rotate(${rotationDeg}deg)`,
                  transition: 'transform 0.05s linear',
                }}
                className={`w-5 h-5 rounded-full flex items-center justify-center ${
                  isThresholdMet
                    ? 'bg-[#D4AF37] text-black shadow-md shadow-[#D4AF37]/30'
                    : 'bg-white/10 text-white/70'
                }`}
              >
                {isThresholdMet ? (
                  <Flame className="w-3 h-3 fill-black" />
                ) : (
                  <ArrowDown className="w-3 h-3 stroke-[2.5]" />
                )}
              </div>
              <span
                className={`text-[11px] font-bold tracking-tight transition-colors ${
                  isThresholdMet ? 'text-[#D4AF37]' : 'text-white/70'
                }`}
              >
                {isThresholdMet ? releaseText : pullText}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Content wrapper with slight vertical offset during active pull */}
      <div
        style={{
          transform: isDragging || isRefreshing ? `translateY(${Math.min(pullDistance * 0.35, 24)}px)` : 'none',
          transition: isDragging ? 'none' : 'transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
      >
        {children}
      </div>

      {/* Optional quick manual reload button at the top/bottom for quick tap */}
      {showManualButton && (
        <div className="text-center py-2">
          <button
            type="button"
            disabled={isRefreshing}
            onClick={triggerRefreshAction}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-bold text-white/50 hover:text-white transition-colors disabled:opacity-40"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-[#D4AF37]' : ''}`} />
            <span>Reload Stream</span>
          </button>
        </div>
      )}
    </div>
  );
};
