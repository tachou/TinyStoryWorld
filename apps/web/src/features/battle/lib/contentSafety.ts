/**
 * Content safety blocklist for Battle Stories input.
 * Prevents students from entering inappropriate fighter names, settings, or twists.
 */

const BLOCKED_WORDS = [
  // Violence
  'kill', 'murder', 'die', 'death', 'blood', 'gore', 'stab', 'shoot', 'gun',
  'knife', 'bomb', 'explode', 'torture', 'war', 'weapon', 'suicide', 'poison',
  // Profanity (common)
  'damn', 'hell', 'crap', 'ass', 'butt',
  // Slurs & hate (abbreviated for safety — expand as needed)
  'stupid', 'idiot', 'dumb', 'hate', 'ugly', 'fat',
  // Adult content
  'sexy', 'naked', 'nude', 'drug', 'alcohol', 'beer', 'wine', 'drunk',
  // Scary
  'demon', 'devil', 'satan', 'zombie', 'corpse', 'cemetery',
  // French equivalents
  'tuer', 'mort', 'sang', 'arme', 'bombe', 'drogue', 'alcool', 'diable',
  'stupide', 'idiot', 'moche', 'détester',
  // French profanity
  'merde', 'putain', 'connard', 'salaud', 'enculer', 'foutre', 'bordel',
  'salope', 'pute', 'nique', 'chier', 'couille', 'batard',
  // Chinese equivalents
  '\u6740', '\u6B7B', '\u8840', '\u67AA', '\u5200', '\u70B8', '\u6BD2', '\u9B3C',
  '\u7B28', '\u4E11', '\u80D6', '\u6068',
];

// Compile patterns — whole word match for Latin, character match for CJK
const LATIN_PATTERN = new RegExp(
  `\\b(${BLOCKED_WORDS.filter((w) => /^[a-zàâéèêëïôùûüç]+$/i.test(w)).join('|')})\\b`,
  'i'
);

const CJK_CHARS = BLOCKED_WORDS.filter((w) => /[\u4e00-\u9fff]/.test(w));

/**
 * Check if input contains blocked content.
 * Returns the first matched blocked term, or null if clean.
 */
export function checkContentSafety(text: string): string | null {
  const normalized = text.toLowerCase().trim();

  // Check Latin words
  const latinMatch = normalized.match(LATIN_PATTERN);
  if (latinMatch) {
    return latinMatch[1];
  }

  // Check CJK characters
  for (const char of CJK_CHARS) {
    if (normalized.includes(char)) {
      return char;
    }
  }

  return null;
}

/**
 * Validate all fields in a matchup for content safety.
 * Returns an error message or null if all clean.
 */
export function validateMatchupSafety(matchup: {
  fighterA: string;
  fighterB: string;
  setting: string;
  twist: string;
}): string | null {
  const fields = [
    { name: 'Fighter A', value: matchup.fighterA },
    { name: 'Fighter B', value: matchup.fighterB },
    { name: 'Setting', value: matchup.setting },
    { name: 'Twist', value: matchup.twist },
  ];

  for (const field of fields) {
    const blocked = checkContentSafety(field.value);
    if (blocked) {
      return `${field.name} contains inappropriate content. Please choose different words.`;
    }
  }

  return null;
}
