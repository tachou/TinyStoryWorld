import type { Language, WordTile } from '@tiny-story-world/types';

// Re-export types consumers need
export type { Language, WordTile } from '@tiny-story-world/types';

/** A slot type that a template position can accept */
export type SlotType =
  | 'det' | 'noun' | 'noun_place'
  | 'verb_copula' | 'verb_intrans' | 'verb_trans'
  | 'adj' | 'adj_attributive_zh'
  | 'adv' | 'adv_manner' | 'adv_intensifier'
  | 'prep' | 'pronoun'
  | 'particle_de' | 'particle_le';

// ─── Word-class sets ─────────────────────────────────────────────────────

const DETERMINERS = new Set([
  'the', 'a', 'my', 'some', 'many',
  'un', 'une', 'des', 'du', 'de la', 'le', 'la',
  '一个', '这个', '那个', '一些', '很多',
]);

const PRONOUNS = new Set(['I', '我']);

const PREPOSITIONS_EN = new Set([
  'in the', 'on the', 'to the', 'with a', 'at the', 'under the',
  'next to', 'in front of', 'behind the', 'above the', 'near the',
  'inside the', 'around the', 'from the',
]);
const PREPOSITIONS_FR = new Set([
  'dans', 'sur', 'avec', 'pour', 'sous', 'à côté de',
  'devant', 'derrière', 'au-dessus de', 'près de',
  'autour de', 'vers', 'entre',
]);
const PREPOSITIONS_ZH = new Set(['在', '到']);

/** Chinese attributive adjectives — work naturally in adj 的 noun pattern */
const ATTRIBUTIVE_ADJ_ZH = new Set([
  '大', '小', '红', '蓝', '绿', '黄', '紫', '白', '黑',
  '开心', '伤心', '快', '慢', '高', '好笑', '漂亮',
  '新', '旧', '好', '勇敢', '强壮', '善良',
  '长', '短', '胖', '瘦', '亮', '暗', '干净', '脏',
  '甜', '酸', '苦', '老', '年轻', '圆', '方',
]);

/** Chinese location nouns — valid after 在/到 in locative templates */
const PLACES_ZH = new Set([
  '家', '学校', '树', '山', '河', '路', '公园', '花园',
  '天空', '地上', '海', '森林', '城市', '房子',
]);

// ─── Adverb categories ──────────────────────────────────────────────────

const INTENSIFIERS_EN = new Set(['very', 'really', 'too']);
const INTENSIFIERS_FR = new Set(['très', 'vraiment', 'bien']);
const INTENSIFIERS_ZH = new Set(['很', '真']);

/** Manner adverbs — naturally modify verbs (whitelist approach) */
const MANNER_EN = new Set([
  'quickly', 'slowly', 'happily', 'loudly', 'softly', 'fast', 'well',
  'outside', 'together', 'away',
]);
const MANNER_FR = new Set([
  'bien', 'vite', 'doucement', 'ensemble', 'dehors', 'lentement', 'fort',
]);

// ─── Verb categories ────────────────────────────────────────────────────

const COPULA_EN = new Set(['is']);
const COPULA_FR = new Set(['est']);
const COPULA_ZH = new Set(['是']);

function getCopulaSet(lang: Language): Set<string> {
  return lang === 'fr' ? COPULA_FR : lang === 'zh-Hans' ? COPULA_ZH : COPULA_EN;
}

const INTRANSITIVE_EN = new Set([
  'runs', 'jumps', 'sleeps', 'walks', 'sings', 'dances', 'flies',
  'swims', 'climbs', 'sits', 'stands', 'plays', 'grows', 'hides',
]);
const INTRANSITIVE_FR = new Set([
  'court', 'saute', 'dort', 'marche', 'chante', 'danse', 'vole',
  'nage', 'grimpe', 'joue', 'parle', 'pousse',
]);
const INTRANSITIVE_ZH = new Set([
  '跑', '跳', '飞', '游泳', '走', '坐', '站', '睡觉', '唱歌', '跳舞', '爬', '长',
  '画画', '做饭',
]);

const TRANSITIVE_EN = new Set([
  'eats', 'drinks', 'sees', 'likes', 'loves', 'has', 'reads',
  'cooks', 'draws', 'makes', 'gives', 'wants', 'finds', 'throws',
  'catches', 'builds', 'helps', 'opens', 'closes', 'rides',
]);
const TRANSITIVE_FR = new Set([
  'mange', 'boit', 'voit', 'aime', 'adore', 'lit',
  'cuisine', 'dessine', 'fait', 'veut', 'trouve',
  'lance', 'attrape', 'construit', 'aide', 'ouvre', 'ferme', 'porte', 'regarde',
]);
const TRANSITIVE_ZH = new Set([
  '吃', '喝', '看', '喜欢', '爱', '有', '读',
  '要', '找', '藏', '扔', '接', '建', '帮助', '开', '关', '骑',
]);

function getIntransitiveSet(lang: Language): Set<string> {
  return lang === 'fr' ? INTRANSITIVE_FR : lang === 'zh-Hans' ? INTRANSITIVE_ZH : INTRANSITIVE_EN;
}

function getTransitiveSet(lang: Language): Set<string> {
  return lang === 'fr' ? TRANSITIVE_FR : lang === 'zh-Hans' ? TRANSITIVE_ZH : TRANSITIVE_EN;
}

// ─── Agreement filters ──────────────────────────────────────────────────

/** French gender agreement */
const FEMININE_NOUNS_FR = new Set([
  'la maison', "l'école", 'la balle', 'la voiture', 'la fille',
  "l'étoile", 'la fleur', 'la pomme', "l'eau", 'la grenouille',
  'la chaussure', 'la poule', 'la pizza', 'la pluie', 'la neige',
  'la reine', 'la classe', 'la lune', 'maman',
]);
const ADJ_GENDER_INVARIANT_FR = new Set([
  'rouge', 'triste', 'rapide', 'drôle', 'calme', 'jaune',
  'orange', 'brave', 'minuscule',
]);

/** Chinese reduplicated adjectives — already intensified, can't take 很/真 */
const REDUPLICATED_ADJ_ZH = new Set(['小小']);

function hasChineseIntensifierConflict(combo: WordTile[], slots: SlotType[]): boolean {
  for (let i = 0; i < slots.length; i++) {
    if (slots[i] === 'adj' && REDUPLICATED_ADJ_ZH.has(combo[i].word)) {
      for (let j = 0; j < i; j++) {
        if (slots[j] === 'adv_intensifier') return true;
      }
    }
  }
  return false;
}

/** English uncountable (mass) nouns — cannot use "a" as determiner */
const UNCOUNTABLE_EN = new Set([
  'water', 'rain', 'snow', 'music', 'food', 'milk', 'juice', 'bread',
  'rice', 'grass', 'air', 'fire', 'ice', 'sand', 'dirt', 'mud',
]);

function hasEnglishUncountableConflict(combo: WordTile[], slots: SlotType[]): boolean {
  for (let i = 0; i < slots.length - 1; i++) {
    if (slots[i] === 'det' && combo[i].word === 'a') {
      for (let j = i + 1; j < slots.length; j++) {
        if (slots[j] === 'noun') {
          if (UNCOUNTABLE_EN.has(combo[j].word)) return true;
          break;
        }
      }
    }
  }
  return false;
}

function hasFrenchGenderConflict(combo: WordTile[], slots: SlotType[]): boolean {
  let nounWord: string | null = null;
  let adjWord: string | null = null;
  for (let i = 0; i < slots.length; i++) {
    if (slots[i] === 'noun') nounWord = combo[i].word;
    if (slots[i] === 'adj') adjWord = combo[i].word;
  }
  if (!nounWord || !adjWord) return false;
  if (FEMININE_NOUNS_FR.has(nounWord) && !ADJ_GENDER_INVARIANT_FR.has(adjWord)) {
    return true;
  }
  return false;
}

// ─── Slot → Tile mapping ────────────────────────────────────────────────

export function getTilesForSlot(tiles: WordTile[], slot: SlotType, lang: Language): WordTile[] {
  switch (slot) {
    case 'det':
      return tiles.filter(t => DETERMINERS.has(t.word));
    case 'noun':
      return tiles.filter(t => t.pos === 'noun');
    case 'verb_copula': {
      const copula = getCopulaSet(lang);
      return tiles.filter(t => t.pos === 'verb' && copula.has(t.word));
    }
    case 'verb_intrans': {
      const intrans = getIntransitiveSet(lang);
      return tiles.filter(t => t.pos === 'verb' && intrans.has(t.word));
    }
    case 'verb_trans': {
      const trans = getTransitiveSet(lang);
      return tiles.filter(t => t.pos === 'verb' && trans.has(t.word));
    }
    case 'adj':
      return tiles.filter(t => t.pos === 'adjective');
    case 'adj_attributive_zh':
      return tiles.filter(t => t.pos === 'adjective' && ATTRIBUTIVE_ADJ_ZH.has(t.word));
    case 'adv':
      return tiles.filter(t => t.pos === 'adverb');
    case 'adv_manner': {
      const manner = lang === 'fr' ? MANNER_FR : MANNER_EN;
      return tiles.filter(t => t.pos === 'adverb' && manner.has(t.word));
    }
    case 'adv_intensifier': {
      const intensifiers = lang === 'fr' ? INTENSIFIERS_FR : lang === 'zh-Hans' ? INTENSIFIERS_ZH : INTENSIFIERS_EN;
      return tiles.filter(t => t.pos === 'adverb' && intensifiers.has(t.word));
    }
    case 'pronoun':
      return tiles.filter(t => PRONOUNS.has(t.word));
    case 'particle_de':
      return tiles.filter(t => t.word === '的');
    case 'particle_le':
      return tiles.filter(t => t.word === '了');
    case 'noun_place':
      return tiles.filter(t => t.pos === 'noun' && PLACES_ZH.has(t.word));
    case 'prep': {
      const prepSet = lang === 'fr' ? PREPOSITIONS_FR : lang === 'zh-Hans' ? PREPOSITIONS_ZH : PREPOSITIONS_EN;
      return tiles.filter(t => prepSet.has(t.word));
    }
  }
}

// ─── Templates ──────────────────────────────────────────────────────────

export interface SentenceTemplate {
  slots: SlotType[];
}

export const TEMPLATES: Record<Language, SentenceTemplate[]> = {
  en: [
    { slots: ['det', 'noun', 'verb_intrans'] },
    { slots: ['det', 'adj', 'noun', 'verb_intrans'] },
    { slots: ['det', 'noun', 'verb_intrans', 'adv_manner'] },
    { slots: ['det', 'adj', 'noun', 'verb_intrans', 'adv_manner'] },
    { slots: ['det', 'noun', 'verb_trans', 'det', 'noun'] },
  ],
  fr: [
    { slots: ['noun', 'verb_intrans'] },
    { slots: ['noun', 'verb_intrans', 'adv_manner'] },
    { slots: ['noun', 'verb_trans', 'noun'] },
    { slots: ['noun', 'verb_copula', 'adj'] },
    { slots: ['noun', 'verb_copula', 'adv_intensifier', 'adj'] },
  ],
  'zh-Hans': [
    { slots: ['noun', 'verb_intrans'] },
    { slots: ['adj_attributive_zh', 'particle_de', 'noun', 'verb_intrans'] },
    { slots: ['noun', 'verb_intrans', 'particle_le'] },
    { slots: ['noun', 'verb_trans', 'noun'] },
    { slots: ['pronoun', 'verb_trans', 'noun'] },
    { slots: ['noun', 'prep', 'noun_place', 'verb_intrans'] },
    { slots: ['noun', 'adv_intensifier', 'adj'] },
  ],
};

// ─── Sentence generation ────────────────────────────────────────────────

const MAX_PER_TEMPLATE = 50;
const MAX_TOTAL = 200;

export interface GeneratedSentence {
  words: string[];
  tiles: WordTile[];
}

/**
 * Generate all valid sentences from the current tiles using templates.
 */
export function generateSentences(tiles: WordTile[], lang: Language): GeneratedSentence[] {
  const templates = TEMPLATES[lang];
  const results: GeneratedSentence[] = [];
  const seen = new Set<string>();

  for (const template of templates) {
    if (results.length >= MAX_TOTAL) break;

    const slotCandidates = template.slots.map(slot => getTilesForSlot(tiles, slot, lang));

    // Skip if any slot has no candidates
    if (slotCandidates.some(c => c.length === 0)) continue;

    const combos = cartesianProduct(slotCandidates, MAX_PER_TEMPLATE);

    for (const combo of combos) {
      if (results.length >= MAX_TOTAL) break;

      // Ensure no tile is used twice (by instanceId)
      const ids = combo.map(t => t.instanceId);
      if (new Set(ids).size !== ids.length) continue;

      // Language-specific agreement checks
      if (lang === 'fr' && hasFrenchGenderConflict(combo, template.slots)) continue;
      if (lang === 'en' && hasEnglishUncountableConflict(combo, template.slots)) continue;
      if (lang === 'zh-Hans' && hasChineseIntensifierConflict(combo, template.slots)) continue;

      const joiner = lang === 'zh-Hans' ? '' : ' ';
      const sentence = combo.map(t => t.word).join(joiner);

      if (seen.has(sentence)) continue;
      seen.add(sentence);

      results.push({
        words: combo.map(t => t.word),
        tiles: combo,
      });
    }
  }

  return results;
}

// ─── Helpers ────────────────────────────────────────────────────────────

function cartesianProduct(arrays: WordTile[][], limit: number): WordTile[][] {
  const results: WordTile[][] = [];

  function recurse(depth: number, current: WordTile[]) {
    if (results.length >= limit) return;
    if (depth === arrays.length) {
      results.push([...current]);
      return;
    }
    for (const item of arrays[depth]) {
      if (results.length >= limit) return;
      current.push(item);
      recurse(depth + 1, current);
      current.pop();
    }
  }

  recurse(0, []);
  return results;
}
