import React from 'react';

/**
 * Enables smooth horizontal scrolling using vertical mouse wheel delta
 * for containers that overflow horizontally.
 */
export const handleHorizontalWheelScroll = (e: React.WheelEvent<HTMLElement>) => {
  if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && e.deltaY !== 0) {
    e.currentTarget.scrollLeft += e.deltaY * 0.8;
  }
};

/**
 * Standard CSS classes for any horizontal scroll container in the app
 * ensuring it works smoothly on touch, trackpad, and mouse devices without shrinking chips.
 */
export const HORIZONTAL_SCROLL_CONTAINER_CLASS =
  'w-full flex items-center gap-2 overflow-x-auto whitespace-nowrap flex-nowrap touch-pan-x overscroll-x-contain no-scrollbar select-none py-1';
