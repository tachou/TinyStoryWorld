import type { WordEntry } from '@tiny-story-world/types';

let id = 0;
const w = (word: string, pos: WordEntry['pos']): WordEntry => ({
  id: `fr-${id++}`,
  word,
  pos,
  lang: 'fr',
});

export const frenchWords: WordEntry[] = [
  // Nouns (45)
  w('le chat', 'noun'), w('le chien', 'noun'), w('le poisson', 'noun'),
  w("l'oiseau", 'noun'), w("l'arbre", 'noun'), w('la maison', 'noun'),
  w("l'\u00e9cole", 'noun'), w('le livre', 'noun'), w('la balle', 'noun'),
  w('la voiture', 'noun'), w('maman', 'noun'), w('papa', 'noun'),
  w('le b\u00e9b\u00e9', 'noun'), w('le gar\u00e7on', 'noun'), w('la fille', 'noun'),
  w("l'ami", 'noun'), w('le soleil', 'noun'), w('la lune', 'noun'),
  w("l'\u00e9toile", 'noun'), w('la fleur', 'noun'), w('la pomme', 'noun'),
  w('le g\u00e2teau', 'noun'), w("l'eau", 'noun'), w('le lait', 'noun'),
  w("l'ours", 'noun'), w('le lapin', 'noun'), w('la grenouille', 'noun'),
  w('le singe', 'noun'), w('le chapeau', 'noun'), w('la chaussure', 'noun'),
  w('le cheval', 'noun'), w('la poule', 'noun'), w('le biscuit', 'noun'),
  w('la pizza', 'noun'), w('le camion', 'noun'), w('le bateau', 'noun'),
  w('la pluie', 'noun'), w('la neige', 'noun'), w('le nuage', 'noun'),
  w('le jardin', 'noun'), w('le roi', 'noun'), w('la reine', 'noun'),
  w('le dragon', 'noun'), w('le robot', 'noun'), w('la classe', 'noun'),

  // Verbs (35)
  w('court', 'verb'), w('saute', 'verb'), w('mange', 'verb'), w('boit', 'verb'),
  w('voit', 'verb'), w('aime', 'verb'), w('adore', 'verb'), w('a', 'verb'),
  w('est', 'verb'), w('joue', 'verb'), w('lit', 'verb'), w('dort', 'verb'),
  w('marche', 'verb'), w('chante', 'verb'), w('danse', 'verb'), w('vole', 'verb'),
  w('nage', 'verb'), w('grimpe', 'verb'), w('regarde', 'verb'), w('dessine', 'verb'),
  w('fait', 'verb'), w('donne', 'verb'), w('veut', 'verb'), w('cuisine', 'verb'),
  w('parle', 'verb'), w('trouve', 'verb'), w('cache', 'verb'), w('lance', 'verb'),
  w('attrape', 'verb'), w('construit', 'verb'), w('pousse', 'verb'), w('aide', 'verb'),
  w('ouvre', 'verb'), w('ferme', 'verb'), w('porte', 'verb'),

  // Adjectives (28)
  w('grand', 'adjective'), w('petit', 'adjective'), w('rouge', 'adjective'),
  w('bleu', 'adjective'), w('vert', 'adjective'), w('content', 'adjective'),
  w('triste', 'adjective'), w('rapide', 'adjective'), w('lent', 'adjective'),
  w('haut', 'adjective'), w('dr\u00f4le', 'adjective'), w('joli', 'adjective'),
  w('doux', 'adjective'), w('fort', 'adjective'), w('calme', 'adjective'),
  w('chaud', 'adjective'), w('froid', 'adjective'), w('nouveau', 'adjective'),
  w('vieux', 'adjective'), w('bon', 'adjective'), w('jaune', 'adjective'),
  w('violet', 'adjective'), w('orange', 'adjective'), w('brave', 'adjective'),
  w('rigolo', 'adjective'), w('minuscule', 'adjective'), w('gentil', 'adjective'),
  w('m\u00e9chant', 'adjective'),

  // Adverbs (15)
  w('vite', 'adverb'), w('lentement', 'adverb'), w('tr\u00e8s', 'adverb'),
  w('vraiment', 'adverb'), w('toujours', 'adverb'), w('jamais', 'adverb'),
  w('ici', 'adverb'), w('l\u00e0', 'adverb'), w('maintenant', 'adverb'),
  w("aujourd'hui", 'adverb'), w('joyeusement', 'adverb'), w('doucement', 'adverb'),
  w('dehors', 'adverb'), w('ensemble', 'adverb'), w('bien', 'adverb'),

  // Phrases (20)
  w('dans', 'phrase'), w('sur', 'phrase'), w('avec', 'phrase'),
  w('pour', 'phrase'), w('sous', 'phrase'), w('\u00e0 c\u00f4t\u00e9 de', 'phrase'),
  w('devant', 'phrase'), w('derri\u00e8re', 'phrase'), w('un', 'phrase'),
  w('une', 'phrase'), w('au-dessus de', 'phrase'), w('pr\u00e8s de', 'phrase'),
  w('autour de', 'phrase'), w('vers', 'phrase'), w('entre', 'phrase'),
  w('des', 'phrase'), w('du', 'phrase'), w('de la', 'phrase'),
  w('le', 'phrase'), w('la', 'phrase'),

  // Conjunctions (9)
  w('et', 'conjunction'), w('mais', 'conjunction'), w('ou', 'conjunction'),
  w('parce que', 'conjunction'), w('alors', 'conjunction'), w('puis', 'conjunction'),
  w('quand', 'conjunction'), w('pendant que', 'conjunction'), w('si', 'conjunction'),
];
