'use client';

import { forwardRef, useCallback } from 'react';
import type { KeyboardEvent, CSSProperties } from 'react';
import type { WordTile, PartOfSpeech } from '@tiny-story-world/types';
import { POS_COLORS } from '@tiny-story-world/types';

export interface WordTileProps {
  tile: WordTile;
  onClick?: () => void;
  isHighlighted?: boolean;
  isError?: boolean;
  isDragging?: boolean;
  capitalize?: boolean;
  /** Show pinyin/phonetic annotation (Chinese) */
  showPinyin?: boolean;
  /** Show POS label badge */
  showPos?: boolean;
  /** Whether the current language is Chinese (affects font size) */
  isChinese?: boolean;
  /** Whether a curriculum is active (to show bonus word indicators) */
  hasCurriculum?: boolean;
  style?: CSSProperties;
  className?: string;
  'aria-description'?: string;
}

export const WordTileComponent = forwardRef<HTMLDivElement, WordTileProps>(
  function WordTileComponent(
    {
      tile,
      onClick,
      isHighlighted,
      isError,
      isDragging,
      capitalize,
      showPinyin = false,
      showPos = false,
      isChinese = false,
      hasCurriculum = false,
      style,
      className = '',
      'aria-description': ariaDescription,
      ...props
    },
    ref
  ) {
    const colors = POS_COLORS[tile.pos];
    const textSizeClass = isChinese ? 'text-2xl md:text-3xl' : 'text-base md:text-lg';
    const displayWord = capitalize
      ? tile.word.charAt(0).toUpperCase() + tile.word.slice(1)
      : tile.word;

    // A "bonus word" is one not from the curriculum (only relevant when a curriculum is active)
    const isBonusWord = hasCurriculum && tile.fromCurriculum === false;

    const bgColorClass = isError
      ? 'bg-orange-200 border-orange-400'
      : isHighlighted
        ? 'bg-yellow-300 border-yellow-500 ring-2 ring-yellow-400'
        : isBonusWord
          ? `${colors.bg} border-dashed border-gray-400 opacity-75`
          : `${colors.bg} ${colors.border}`;

    const handleKeyDown = useCallback(
      (e: KeyboardEvent<HTMLDivElement>) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      },
      [onClick]
    );

    return (
      <div
        ref={ref}
        style={style}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        className={`
          inline-flex items-center gap-1.5
          px-4 py-2.5 rounded-2xl
          border-2 ${bgColorClass}
          font-bold text-gray-700
          select-none
          ${isDragging ? 'opacity-50 scale-105 shadow-xl' : 'shadow-md hover:shadow-lg'}
          ${onClick ? 'cursor-pointer hover:scale-105 active:scale-95' : ''}
          ${isHighlighted ? 'animate-pulse scale-110' : ''}
          ${isError ? 'animate-[shake_0.5s_ease-in-out]' : ''}
          transition-all duration-150 ease-out
          min-w-[44px] min-h-[44px] justify-center
          focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2
          ${className}
        `}
        role="button"
        aria-label={`${tile.word} - ${tile.pos}`}
        aria-description={ariaDescription}
        tabIndex={0}
        {...props}
      >
        {isBonusWord && (
          <span
            className="text-[10px] font-medium text-gray-500 bg-white/70 rounded px-1"
            aria-hidden="true"
            title="Bonus word (not in your word list)"
          >
            +
          </span>
        )}
        {showPos && !isBonusWord && (
          <span
            className="text-[10px] uppercase font-medium text-gray-500 bg-white/50 rounded px-1"
            aria-hidden="true"
          >
            {colors.label}
          </span>
        )}
        {tile.phonetic && showPinyin ? (
          <ruby className={textSizeClass}>
            {displayWord}
            <rp>(</rp>
            <rt className="text-[10px] font-normal text-gray-500">{tile.phonetic}</rt>
            <rp>)</rp>
          </ruby>
        ) : (
          <span className={textSizeClass}>{displayWord}</span>
        )}
      </div>
    );
  }
);
