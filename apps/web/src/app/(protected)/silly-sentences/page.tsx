'use client';

import { SillySentencesGame } from '@/features/silly-sentences/components/SillySentencesGame';
import { CurriculumBadge } from '@/components/CurriculumBadge';

export default function SillySentencesPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-center mb-3">
        <CurriculumBadge />
      </div>
      <SillySentencesGame />
    </div>
  );
}
