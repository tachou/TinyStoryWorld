import type { WordEntry } from '@tiny-story-world/types';

let id = 0;
const w = (word: string, pos: WordEntry['pos']): WordEntry => ({
  id: `en-${id++}`,
  word,
  pos,
  lang: 'en',
});

export const englishWords: WordEntry[] = [
  // Nouns (45)
  w('cat', 'noun'), w('dog', 'noun'), w('fish', 'noun'), w('bird', 'noun'),
  w('tree', 'noun'), w('house', 'noun'), w('school', 'noun'), w('book', 'noun'),
  w('ball', 'noun'), w('car', 'noun'), w('mom', 'noun'), w('dad', 'noun'),
  w('baby', 'noun'), w('boy', 'noun'), w('girl', 'noun'), w('friend', 'noun'),
  w('sun', 'noun'), w('moon', 'noun'), w('star', 'noun'), w('flower', 'noun'),
  w('apple', 'noun'), w('cake', 'noun'), w('water', 'noun'), w('milk', 'noun'),
  w('bear', 'noun'), w('rabbit', 'noun'), w('frog', 'noun'), w('monkey', 'noun'),
  w('hat', 'noun'), w('shoe', 'noun'), w('horse', 'noun'), w('chicken', 'noun'),
  w('cookie', 'noun'), w('pizza', 'noun'), w('truck', 'noun'), w('boat', 'noun'),
  w('rain', 'noun'), w('snow', 'noun'), w('cloud', 'noun'), w('garden', 'noun'),
  w('teacher', 'noun'), w('king', 'noun'), w('queen', 'noun'), w('dragon', 'noun'),
  w('robot', 'noun'),

  // Verbs (35)
  w('runs', 'verb'), w('jumps', 'verb'), w('eats', 'verb'), w('drinks', 'verb'),
  w('sees', 'verb'), w('likes', 'verb'), w('loves', 'verb'), w('has', 'verb'),
  w('is', 'verb'), w('plays', 'verb'), w('reads', 'verb'), w('sleeps', 'verb'),
  w('walks', 'verb'), w('sings', 'verb'), w('dances', 'verb'), w('flies', 'verb'),
  w('swims', 'verb'), w('climbs', 'verb'), w('sits', 'verb'), w('stands', 'verb'),
  w('cooks', 'verb'), w('draws', 'verb'), w('makes', 'verb'), w('gives', 'verb'),
  w('wants', 'verb'), w('finds', 'verb'), w('hides', 'verb'), w('throws', 'verb'),
  w('catches', 'verb'), w('builds', 'verb'), w('grows', 'verb'), w('helps', 'verb'),
  w('opens', 'verb'), w('closes', 'verb'), w('rides', 'verb'),

  // Adjectives (28)
  w('big', 'adjective'), w('small', 'adjective'), w('red', 'adjective'),
  w('blue', 'adjective'), w('green', 'adjective'), w('happy', 'adjective'),
  w('sad', 'adjective'), w('fast', 'adjective'), w('slow', 'adjective'),
  w('tall', 'adjective'), w('funny', 'adjective'), w('pretty', 'adjective'),
  w('soft', 'adjective'), w('loud', 'adjective'), w('quiet', 'adjective'),
  w('hot', 'adjective'), w('cold', 'adjective'), w('new', 'adjective'),
  w('old', 'adjective'), w('good', 'adjective'), w('yellow', 'adjective'),
  w('purple', 'adjective'), w('orange', 'adjective'), w('brave', 'adjective'),
  w('silly', 'adjective'), w('tiny', 'adjective'), w('strong', 'adjective'),
  w('kind', 'adjective'),

  // Adverbs (15)
  w('quickly', 'adverb'), w('slowly', 'adverb'), w('very', 'adverb'),
  w('really', 'adverb'), w('always', 'adverb'), w('never', 'adverb'),
  w('here', 'adverb'), w('there', 'adverb'), w('now', 'adverb'),
  w('today', 'adverb'), w('happily', 'adverb'), w('loudly', 'adverb'),
  w('softly', 'adverb'), w('outside', 'adverb'), w('together', 'adverb'),

  // Phrases (18)
  w('in the', 'phrase'), w('on the', 'phrase'), w('to the', 'phrase'),
  w('with a', 'phrase'), w('at the', 'phrase'), w('under the', 'phrase'),
  w('next to', 'phrase'), w('in front of', 'phrase'), w('a', 'phrase'),
  w('the', 'phrase'), w('behind the', 'phrase'), w('above the', 'phrase'),
  w('near the', 'phrase'), w('inside the', 'phrase'), w('around the', 'phrase'),
  w('from the', 'phrase'), w('some', 'phrase'), w('many', 'phrase'),

  // Pronouns / Determiners
  w('I', 'phrase'), w('my', 'phrase'),

  // Conjunctions (9)
  w('and', 'conjunction'), w('but', 'conjunction'), w('or', 'conjunction'),
  w('because', 'conjunction'), w('so', 'conjunction'), w('then', 'conjunction'),
  w('when', 'conjunction'), w('while', 'conjunction'), w('if', 'conjunction'),
];
