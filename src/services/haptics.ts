/**
 * Tactile Haptic Vibration Feedback Utilities
 * Uses navigator.vibrate safely with graceful fallback for unsupported devices/browsers.
 */

export const triggerVibration = (pattern: number | number[]): boolean => {
  if (
    typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    typeof navigator.vibrate === 'function'
  ) {
    try {
      return navigator.vibrate(pattern);
    } catch {
      // Gracefully handle any security policy or permission errors
      return false;
    }
  }
  return false;
};

/** Subtle tactile pulse on successful post submission */
export const vibratePostSubmit = () => {
  triggerVibration([40, 60, 40]);
};

/** Celebratory rhythmic vibration pattern when streak milestone triggers */
export const vibrateStreakCelebration = () => {
  triggerVibration([60, 50, 80, 50, 110]);
};

/** Milestone alias */
export const vibrateStreakMilestone = () => {
  triggerVibration([60, 50, 80, 50, 110]);
};

/** Light single tap for quick interactions */
export const vibrateLight = () => {
  triggerVibration(30);
};

/** Success interaction tactile vibration */
export const vibrateSuccess = () => {
  triggerVibration([40, 50, 60]);
};

/** Subtle haptic tick when pull-to-refresh reaches trigger threshold */
export const vibratePullThreshold = () => {
  triggerVibration(25);
};

/** Refresh completed haptic notification */
export const vibrateRefreshComplete = () => {
  triggerVibration([20, 40, 30]);
};
