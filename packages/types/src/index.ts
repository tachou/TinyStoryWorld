export type UserRole = 'student' | 'teacher' | 'parent' | 'admin' | 'editor';

export type Language = 'en' | 'fr' | 'zh-Hans';

export type ReadingStage = 'emergent' | 'beginner' | 'in-transition' | 'competent' | 'experienced';

export type PartOfSpeech = 'noun' | 'verb' | 'adjective' | 'adverb' | 'determiner' | 'preposition' | 'conjunction' | 'pronoun' | 'particle';

export interface WordTile {
  word: string;
  pos: PartOfSpeech;
  instanceId: string;
}
