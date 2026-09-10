import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Play, Pause, Volume2, Sparkles, AlertCircle } from 'lucide-react';
import { vibrateLight } from '../services/haptics';
import { generateWaveformBars, createSyntheticAudioDataUrl } from '../utils/audio';

interface VoiceMessageWaveformVisualizerProps {
  audioUrl?: string;
  duration?: number;
  isCurrentUser: boolean;
  messageId?: string;
}

export const VoiceMessageWaveformVisualizer: React.FC<VoiceMessageWaveformVisualizerProps> = ({
  audioUrl: initialAudioUrl,
  duration = 4,
  isCurrentUser,
  messageId = 'voice_msg',
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState<number>(duration || 4);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [hoverPosition, setHoverPosition] = useState<number | null>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [audioSrc, setAudioSrc] = useState<string>(initialAudioUrl || '');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const waveformRef = useRef<HTMLDivElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const [waveMotionTick, setWaveMotionTick] = useState<number>(0);

  // Generate deterministic bar heights for this voice message
  const bars = useMemo(() => {
    return generateWaveformBars(messageId + (initialAudioUrl || ''), 28);
  }, [messageId, initialAudioUrl]);

  // Ensure valid audio source (fallback to synthetic voice data if none provided)
  useEffect(() => {
    if (initialAudioUrl && initialAudioUrl.trim().length > 0) {
      setAudioSrc(initialAudioUrl);
    } else {
      const fallbackUrl = createSyntheticAudioDataUrl(duration || 4);
      setAudioSrc(fallbackUrl);
    }
  }, [initialAudioUrl, duration]);

  // Setup HTMLAudioElement
  useEffect(() => {
    if (!audioSrc) return;

    const audio = new Audio(audioSrc);
    audio.preload = 'metadata';
    audio.playbackRate = playbackRate;
    audioRef.current = audio;

    const onLoadedMetadata = () => {
      if (audio.duration && Number.isFinite(audio.duration) && audio.duration > 0) {
        setTotalDuration(Math.round(audio.duration));
      }
    };

    const onTimeUpdate = () => {
      if (!isScrubbing) {
        setCurrentTime(audio.currentTime);
      }
    };

    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      try {
        audio.currentTime = 0;
      } catch {}
    };

    const onError = () => {
      // Re-generate robust playable synthetic fallback
      const fallbackUrl = createSyntheticAudioDataUrl(duration || 4);
      setAudioSrc(fallbackUrl);
    };

    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audio.src = '';
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [audioSrc]);

  // Handle live waveform animation loop while playing
  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      return;
    }

    let start = performance.now();
    const animate = (now: number) => {
      setWaveMotionTick((now - start) / 1000);
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlaying]);

  // Toggle Play / Pause - with full replay support to play once again after finishing
  const togglePlay = () => {
    vibrateLight();
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      // If audio completed or is near the end, rewind to start so it can be played once again!
      if (
        audio.ended ||
        audio.currentTime >= (audio.duration || totalDuration) - 0.1 ||
        Math.abs(audio.currentTime - (audio.duration || totalDuration)) < 0.2
      ) {
        audio.currentTime = 0;
        setCurrentTime(0);
      }
      audio.playbackRate = playbackRate;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch((err) => {
            console.warn('Audio play error, falling back:', err);
            // Autoplay policy or corrupt media: recreate synthetic audio and play
            const fallback = createSyntheticAudioDataUrl(totalDuration || 4);
            setAudioSrc(fallback);
            setTimeout(() => {
              if (audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.playbackRate = playbackRate;
                audioRef.current
                  .play()
                  .then(() => setIsPlaying(true))
                  .catch(() => setIsPlaying(false));
              }
            }, 60);
          });
      }
    }
  };

  // Toggle Playback Rate (1x -> 2x -> 1.5x -> 1x)
  const togglePlaybackRate = (e: React.MouseEvent) => {
    e.stopPropagation();
    vibrateLight();
    const nextRate = playbackRate === 1 ? 2 : playbackRate === 2 ? 1.5 : 1;
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  // Seek / Scrub Handler
  const handleWaveformInteraction = useCallback(
    (clientX: number) => {
      if (!waveformRef.current || !audioRef.current) return;
      const rect = waveformRef.current.getBoundingClientRect();
      const clickRatio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const targetTime = clickRatio * (totalDuration || 4);
      setCurrentTime(targetTime);
      audioRef.current.currentTime = targetTime;
    },
    [totalDuration]
  );

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsScrubbing(true);
    handleWaveformInteraction(e.clientX);
    vibrateLight();
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!waveformRef.current) return;
    const rect = waveformRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverPosition(ratio);
    if (isScrubbing) {
      handleWaveformInteraction(e.clientX);
    }
  };

  const handleMouseLeave = () => {
    setHoverPosition(null);
    setIsScrubbing(false);
  };

  const handleMouseUp = () => {
    setIsScrubbing(false);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setIsScrubbing(true);
    if (e.touches.length > 0) {
      handleWaveformInteraction(e.touches[0].clientX);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length > 0) {
      handleWaveformInteraction(e.touches[0].clientX);
    }
  };

  const handleTouchEnd = () => {
    setIsScrubbing(false);
  };

  const progressRatio = totalDuration > 0 ? Math.min(1, currentTime / totalDuration) : 0;

  const formatSeconds = (secs: number) => {
    const s = Math.max(0, Math.floor(secs));
    const m = Math.floor(s / 60);
    const remainder = s % 60;
    return `${m}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  return (
    <div
      className="flex flex-col gap-1.5 py-1.5 px-2 select-none w-full max-w-[290px] sm:max-w-[320px]"
      onMouseUp={handleMouseUp}
    >
      {/* Top Play Control and Waveform Visualizer */}
      <div className="flex items-center gap-2.5">
        {/* Play/Pause Button with pulse feedback */}
        <button
          type="button"
          onClick={togglePlay}
          className={`relative w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all shadow-md group ${
            isCurrentUser
              ? 'bg-white text-[#2F6FED] hover:bg-white/95 hover:scale-105 active:scale-95'
              : 'bg-[#2F6FED] text-white hover:bg-blue-600 hover:scale-105 active:scale-95'
          }`}
          aria-label={isPlaying ? 'Pause voice message' : 'Play voice message'}
          title={isPlaying ? 'Pause' : 'Play voice note'}
        >
          {isPlaying && (
            <span
              className={`absolute inset-0 rounded-full animate-ping opacity-30 ${
                isCurrentUser ? 'bg-white' : 'bg-blue-400'
              }`}
            />
          )}
          {isPlaying ? (
            <Pause className="w-4 h-4 fill-current z-10 transition-transform" />
          ) : (
            <Play className="w-4 h-4 fill-current ml-0.5 z-10 transition-transform" />
          )}
        </button>

        {/* Waveform Bars Container (Interactive Scrubbing) */}
        <div
          ref={waveformRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="flex-1 h-9 flex items-center gap-[2.5px] cursor-pointer relative py-1 px-0.5 rounded-lg group/waveform"
          title="Click or drag to seek in voice message"
        >
          {bars.map((originalHeight, idx) => {
            const barRatio = idx / (bars.length - 1);
            const isPassed = barRatio <= progressRatio;
            const isAtPlayhead = Math.abs(barRatio - progressRatio) < 1 / bars.length;

            // Compute dynamic speech oscillation when audio is playing
            let dynamicHeight = originalHeight;
            if (isPlaying) {
              const oscillation = Math.sin(waveMotionTick * 10 + idx * 0.7) * 22;
              if (isAtPlayhead) {
                dynamicHeight = Math.min(100, Math.max(25, originalHeight + oscillation * 1.5));
              } else if (isPassed) {
                dynamicHeight = Math.min(100, Math.max(20, originalHeight + oscillation * 0.4));
              }
            }

            // Hover indicator preview
            const isHovered = hoverPosition !== null && barRatio <= hoverPosition;

            return (
              <div
                key={idx}
                style={{ height: `${dynamicHeight}%` }}
                className={`flex-1 rounded-full transition-[height,background-color] duration-75 min-w-[2px] ${
                  isPassed
                    ? isCurrentUser
                      ? 'bg-white shadow-xs'
                      : 'bg-[#2F6FED] shadow-xs'
                    : isHovered
                    ? isCurrentUser
                      ? 'bg-white/70'
                      : 'bg-[#2F6FED]/70'
                    : isCurrentUser
                    ? 'bg-white/30'
                    : 'bg-white/20'
                } ${isAtPlayhead && isPlaying ? 'ring-1 ring-white/60 scale-y-110' : ''}`}
              />
            );
          })}
        </div>

        {/* Playback Rate (1x / 2x Speed Button) */}
        <button
          type="button"
          onClick={togglePlaybackRate}
          className={`px-2 py-1 rounded-lg text-[11px] font-mono font-black shrink-0 transition-all border shadow-xs active:scale-95 ${
            isCurrentUser
              ? 'bg-white/25 hover:bg-white/35 text-white border-white/40'
              : 'bg-white/10 hover:bg-white/15 text-white border-white/15'
          } ${playbackRate !== 1 ? 'ring-1 ring-amber-400/60 text-amber-300' : ''}`}
          title="Toggle voice message speed (1x, 2x)"
          aria-label={`Playback speed: ${playbackRate}x`}
        >
          {playbackRate}x
        </button>
      </div>

      {/* Bottom Metadata & Timestamps */}
      <div className="flex items-center justify-between px-1 text-[10px] font-mono leading-none">
        <div className="flex items-center gap-1.5">
          <span className={isCurrentUser ? 'text-white font-semibold' : 'text-white/80 font-medium'}>
            {isPlaying ? formatSeconds(currentTime) : formatSeconds(totalDuration)}
          </span>
          {isPlaying && (
            <span className={isCurrentUser ? 'text-white/60' : 'text-white/40'}>
              / {formatSeconds(totalDuration)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {isPlaying && (
            <span className="flex items-center gap-0.5 text-[9px] text-emerald-400 font-semibold animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Playing</span>
            </span>
          )}
          <span
            className={`flex items-center gap-1 ${
              isCurrentUser ? 'text-white/80' : 'text-white/50'
            }`}
          >
            <Volume2 className={`w-3 h-3 ${isPlaying ? 'animate-bounce text-emerald-400' : ''}`} />
            <span>Voice</span>
          </span>
        </div>
      </div>
    </div>
  );
};
