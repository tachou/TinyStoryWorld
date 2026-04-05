'use client';

import { Fragment, useCallback, useState, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  TouchSensor,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { Language, WordTile } from '@tiny-story-world/types';
import { WordTileComponent } from '@tiny-story-world/ui';
import { SentenceTray } from '@tiny-story-world/ui';
import { PosLegend } from '@tiny-story-world/ui';
import { t } from '@tiny-story-world/i18n';
import { speakSentence, speakWord, stopSpeech, preloadVoices } from '@tiny-story-world/audio';
import { useGameStore } from '../store/gameStore';
import { useLanguageStore } from '@/stores/languageStore';

// ─── Draggable Tile (word pool) ─────────────────────────────────────────

function DraggablePoolTile({ tile, hasCurriculum }: { tile: WordTile; hasCurriculum: boolean }) {
  const addToTray = useGameStore((s) => s.addToTray);
  const language = useGameStore((s) => s.language);
  const showPinyin = useGameStore((s) => s.showPinyin);
  const showPos = useGameStore((s) => s.showPos);
  const tapToHearEnabled = useGameStore((s) => s.tapToHearEnabled);
  const isPlaying = useGameStore((s) => s.isPlaying);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: tile.instanceId,
    data: { tile, area: 'pool' },
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform), zIndex: isDragging ? 50 : undefined }
    : undefined;

  const handleClick = () => {
    if (tapToHearEnabled && language) {
      speakWord(tile.word, language, isPlaying);
    }
    addToTray(tile.instanceId);
  };

  return (
    <WordTileComponent
      ref={setNodeRef}
      tile={tile}
      onClick={handleClick}
      isDragging={isDragging}
      showPinyin={showPinyin}
      showPos={showPos}
      isChinese={language === 'zh-Hans'}
      hasCurriculum={hasCurriculum}
      style={style}
      aria-description="Click to add to sentence."
      {...attributes}
      {...listeners}
    />
  );
}

// ─── Sortable Tray Tile ─────────────────────────────────────────────────

function SortableTrayTile({ tile, index, hasCurriculum }: { tile: WordTile; index: number; hasCurriculum: boolean }) {
  const removeFromTray = useGameStore((s) => s.removeFromTray);
  const highlightedTileIndex = useGameStore((s) => s.highlightedTileIndex);
  const feedback = useGameStore((s) => s.feedback);
  const language = useGameStore((s) => s.language);
  const sentenceTray = useGameStore((s) => s.sentenceTray);
  const showPinyin = useGameStore((s) => s.showPinyin);
  const showPos = useGameStore((s) => s.showPos);
  const tapToHearEnabled = useGameStore((s) => s.tapToHearEnabled);
  const isPlaying = useGameStore((s) => s.isPlaying);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: tile.instanceId,
    data: { tile, area: 'tray', index },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  const isHighlighted = highlightedTileIndex === index;
  const isError = feedback?.errorTileIds?.includes(tile.instanceId);
  const capitalize = index === 0 && (language === 'en' || language === 'fr');

  const handleClick = () => {
    if (tapToHearEnabled && language) {
      speakWord(tile.word, language, isPlaying);
    }
    removeFromTray(tile.instanceId);
  };

  return (
    <WordTileComponent
      ref={setNodeRef}
      tile={tile}
      onClick={handleClick}
      isHighlighted={isHighlighted}
      isError={isError}
      isDragging={isDragging}
      capitalize={capitalize}
      showPinyin={showPinyin}
      showPos={showPos}
      isChinese={language === 'zh-Hans'}
      hasCurriculum={hasCurriculum}
      style={style}
      aria-description={`Word ${index + 1} of ${sentenceTray.length}. Click to remove.`}
      {...attributes}
      {...listeners}
    />
  );
}

// ─── Main Game Screen ───────────────────────────────────────────────────

function GameScreen() {
  const language = useGameStore((s) => s.language!);
  const uiLanguage = useGameStore((s) => s.uiLanguage);
  const wordPool = useGameStore((s) => s.wordPool);
  const sentenceTray = useGameStore((s) => s.sentenceTray);
  const feedback = useGameStore((s) => s.feedback);
  const isPlaying = useGameStore((s) => s.isPlaying);
  const setIsPlaying = useGameStore((s) => s.setIsPlaying);
  const setHighlightedTileIndex = useGameStore((s) => s.setHighlightedTileIndex);
  const submitSentence = useGameStore((s) => s.submitSentence);
  const clearTray = useGameStore((s) => s.clearTray);
  const startNewRound = useGameStore((s) => s.startNewRound);
  const goHome = useGameStore((s) => s.goHome);
  const reorderTray = useGameStore((s) => s.reorderTray);
  const addToTray = useGameStore((s) => s.addToTray);
  const insertTileAt = useGameStore((s) => s.insertTileAt);

  const activeWords = useLanguageStore((s) => s.activeWords);
  const hasCurriculum = activeWords.length > 0;

  const locale = t(uiLanguage);

  const [activeTile, setActiveTile] = useState<WordTile | null>(null);
  const [insertPreviewIndex, setInsertPreviewIndex] = useState<number | null>(null);

  // Preload TTS voices
  useEffect(() => {
    preloadVoices();
    const handler = () => preloadVoices();
    window.speechSynthesis?.addEventListener('voiceschanged', handler);
    return () => window.speechSynthesis?.removeEventListener('voiceschanged', handler);
  }, []);

  const { setNodeRef: trayDropRef, isOver: isTrayOver } = useDroppable({ id: 'sentence-tray' });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const data = active.data.current as { tile: WordTile; area: string } | undefined;
    if (data) setActiveTile(data.tile);
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) {
      setInsertPreviewIndex(null);
      return;
    }

    const activeData = active.data.current as { area: string } | undefined;
    const overData = over.data.current as { area?: string; index?: number } | undefined;

    // Only show insert preview when dragging from pool into tray
    if (activeData?.area === 'pool' && overData?.area === 'tray' && overData.index !== undefined) {
      setInsertPreviewIndex(overData.index);
    } else if (activeData?.area === 'pool' && over.id === 'sentence-tray') {
      setInsertPreviewIndex(sentenceTray.length);
    } else {
      setInsertPreviewIndex(null);
    }
  }, [sentenceTray.length]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTile(null);
    setInsertPreviewIndex(null);

    if (!over) return;

    const activeData = active.data.current as { tile: WordTile; area: string; index?: number } | undefined;
    const overData = over.data.current as { area?: string; index?: number } | undefined;

    if (!activeData) return;

    // Pool → Tray
    if (activeData.area === 'pool') {
      if (overData?.area === 'tray' && overData.index !== undefined) {
        insertTileAt(active.id as string, overData.index);
      } else if (over.id === 'sentence-tray') {
        addToTray(active.id as string);
      }
      return;
    }

    // Tray → Tray (reorder)
    if (activeData.area === 'tray' && overData?.area === 'tray') {
      if (activeData.index !== undefined && overData.index !== undefined && activeData.index !== overData.index) {
        reorderTray(activeData.index, overData.index);
      }
    }
  }, [addToTray, insertTileAt, reorderTray]);

  const handlePlaySentence = () => {
    if (sentenceTray.length === 0) return;
    speakSentence(sentenceTray, language, {
      onStart: () => setIsPlaying(true),
      onEnd: () => {
        setIsPlaying(false);
        setHighlightedTileIndex(null);
      },
      onHighlight: (idx) => setHighlightedTileIndex(idx),
    });
  };

  const tileIds = sentenceTray.map((t) => t.instanceId);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-purple-700">{locale.appTitle}</h2>
          <PosLegend
            title={locale.legend}
            labels={{
              noun: locale.noun,
              verb: locale.verb,
              adjective: locale.adjective,
              adverb: locale.adverb,
            }}
          />
        </div>

        {/* Sentence Tray */}
        <SentenceTray
          trayRef={trayDropRef}
          isOver={isTrayOver}
          showGap={insertPreviewIndex !== null}
          feedbackResult={feedback?.result ?? null}
          tileCount={sentenceTray.length}
          tileCountLabel={locale.tileCount}
          trayFullLabel={locale.trayFull}
        >
          <SortableContext items={tileIds} strategy={horizontalListSortingStrategy}>
            {sentenceTray.map((tile, i) => (
              <Fragment key={tile.instanceId}>
                {insertPreviewIndex === i && (
                  <div
                    className="w-14 h-12 md:w-16 md:h-14 rounded-xl border-2 border-dashed border-purple-400 bg-purple-100/50 flex-shrink-0 transition-all duration-200"
                  />
                )}
                <SortableTrayTile tile={tile} index={i} hasCurriculum={hasCurriculum} />
              </Fragment>
            ))}
            {insertPreviewIndex !== null && insertPreviewIndex >= sentenceTray.length && (
              <div
                key="insert-gap-end"
                className="w-14 h-12 md:w-16 md:h-14 rounded-xl border-2 border-dashed border-purple-400 bg-purple-100/50 flex-shrink-0 transition-all duration-200"
              />
            )}
          </SortableContext>
        </SentenceTray>

        {/* Feedback */}
        {feedback && (
          <div
            className={`text-center py-3 px-4 rounded-xl font-semibold text-lg ${
              feedback.result === 'correct'
                ? 'bg-green-100 text-green-700'
                : feedback.result === 'partial'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-orange-100 text-orange-700'
            }`}
          >
            {feedback.hint}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={handlePlaySentence}
            disabled={sentenceTray.length === 0 || isPlaying}
            className="px-6 py-3 bg-purple-600 text-white font-bold rounded-2xl shadow-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {'\uD83D\uDD0A'} {locale.play}
          </button>
          <button
            onClick={submitSentence}
            disabled={sentenceTray.length < 2}
            className="px-6 py-3 bg-green-600 text-white font-bold rounded-2xl shadow-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {'\u2705'} {locale.submit}
          </button>
          <button
            onClick={clearTray}
            disabled={sentenceTray.length === 0}
            className="px-6 py-3 bg-red-100 text-red-700 font-bold rounded-2xl shadow-md hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {locale.clearAll}
          </button>
          <button
            onClick={startNewRound}
            className="px-6 py-3 bg-indigo-100 text-indigo-700 font-bold rounded-2xl shadow-md hover:bg-indigo-200 transition-colors"
          >
            {'\uD83D\uDD04'} {locale.newRound}
          </button>
        </div>

        {/* Word Pool */}
        <section className="px-3 md:px-6 pt-2" aria-label="Word pool">
          <div className="flex flex-wrap gap-2 md:gap-3 justify-center p-4 bg-gray-50 rounded-2xl border border-gray-200 min-h-[120px]">
            {wordPool.length > 0 ? (
              wordPool.map((tile) => (
                <DraggablePoolTile key={tile.instanceId} tile={tile} hasCurriculum={hasCurriculum} />
              ))
            ) : (
              <p className="text-gray-400 text-sm italic">{locale.allWordsUsed}</p>
            )}
          </div>
        </section>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeTile && (
          <WordTileComponent
            tile={activeTile}
            isDragging
            showPinyin={useGameStore.getState().showPinyin}
            showPos={useGameStore.getState().showPos}
            isChinese={language === 'zh-Hans'}
            hasCurriculum={hasCurriculum}
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}

// ─── Main Export ────────────────────────────────────────────────────────

export function SillySentencesGame() {
  const gameLanguage = useGameStore((s) => s.language);
  const globalLanguage = useLanguageStore((s) => s.language);
  const setLanguage = useGameStore((s) => s.setLanguage);

  // Sync global language → game store: initialize on mount and when global language changes
  useEffect(() => {
    if (!gameLanguage || gameLanguage !== globalLanguage) {
      setLanguage(globalLanguage);
    }
  }, [globalLanguage, gameLanguage, setLanguage]);

  return gameLanguage ? <GameScreen /> : null;
}
