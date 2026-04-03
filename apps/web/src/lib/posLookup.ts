/**
 * POS (Part of Speech) auto-detection for curriculum word uploads.
 *
 * Strategy:
 * 1. Look up the word in the built-in word pool for the given language.
 * 2. If found, return the pool's POS tag (authoritative).
 * 3. If not found, check the extended dictionary for common K-6 words.
 * 4. If still not found, return 'phrase' as a safe default.
 */

type PosTag = string; // 'noun' | 'verb' | 'adjective' | 'adverb' | 'phrase' | 'conjunction' | 'particle'

// ────────────────────────────────────────────────────
// English dictionary (pool words + ~80 extra common K-6 words)
// ────────────────────────────────────────────────────
const EN_POS = new Map<string, PosTag>([
  // From pool: nouns
  ['cat', 'noun'], ['dog', 'noun'], ['fish', 'noun'], ['bird', 'noun'],
  ['tree', 'noun'], ['house', 'noun'], ['school', 'noun'], ['book', 'noun'],
  ['ball', 'noun'], ['car', 'noun'], ['mom', 'noun'], ['dad', 'noun'],
  ['baby', 'noun'], ['boy', 'noun'], ['girl', 'noun'], ['friend', 'noun'],
  ['sun', 'noun'], ['moon', 'noun'], ['star', 'noun'], ['flower', 'noun'],
  ['apple', 'noun'], ['cake', 'noun'], ['water', 'noun'], ['milk', 'noun'],
  ['bear', 'noun'], ['rabbit', 'noun'], ['frog', 'noun'], ['monkey', 'noun'],
  ['hat', 'noun'], ['shoe', 'noun'], ['horse', 'noun'], ['chicken', 'noun'],
  ['cookie', 'noun'], ['pizza', 'noun'], ['truck', 'noun'], ['boat', 'noun'],
  ['rain', 'noun'], ['snow', 'noun'], ['cloud', 'noun'], ['garden', 'noun'],
  ['teacher', 'noun'], ['king', 'noun'], ['queen', 'noun'], ['dragon', 'noun'],
  ['robot', 'noun'],
  // From pool: verbs
  ['runs', 'verb'], ['jumps', 'verb'], ['eats', 'verb'], ['drinks', 'verb'],
  ['sees', 'verb'], ['likes', 'verb'], ['loves', 'verb'], ['has', 'verb'],
  ['is', 'verb'], ['plays', 'verb'], ['reads', 'verb'], ['sleeps', 'verb'],
  ['walks', 'verb'], ['sings', 'verb'], ['dances', 'verb'], ['flies', 'verb'],
  ['swims', 'verb'], ['climbs', 'verb'], ['sits', 'verb'], ['stands', 'verb'],
  ['cooks', 'verb'], ['draws', 'verb'], ['makes', 'verb'], ['gives', 'verb'],
  ['wants', 'verb'], ['finds', 'verb'], ['hides', 'verb'], ['throws', 'verb'],
  ['catches', 'verb'], ['builds', 'verb'], ['grows', 'verb'], ['helps', 'verb'],
  ['opens', 'verb'], ['closes', 'verb'], ['rides', 'verb'],
  // From pool: adjectives
  ['big', 'adjective'], ['small', 'adjective'], ['red', 'adjective'],
  ['blue', 'adjective'], ['green', 'adjective'], ['happy', 'adjective'],
  ['sad', 'adjective'], ['fast', 'adjective'], ['slow', 'adjective'],
  ['tall', 'adjective'], ['funny', 'adjective'], ['pretty', 'adjective'],
  ['soft', 'adjective'], ['loud', 'adjective'], ['quiet', 'adjective'],
  ['hot', 'adjective'], ['cold', 'adjective'], ['new', 'adjective'],
  ['old', 'adjective'], ['good', 'adjective'], ['yellow', 'adjective'],
  ['purple', 'adjective'], ['orange', 'adjective'], ['brave', 'adjective'],
  ['silly', 'adjective'], ['tiny', 'adjective'], ['strong', 'adjective'],
  ['kind', 'adjective'],
  // From pool: adverbs
  ['quickly', 'adverb'], ['slowly', 'adverb'], ['very', 'adverb'],
  ['really', 'adverb'], ['always', 'adverb'], ['never', 'adverb'],
  ['here', 'adverb'], ['there', 'adverb'], ['now', 'adverb'],
  ['today', 'adverb'], ['happily', 'adverb'], ['loudly', 'adverb'],
  ['softly', 'adverb'], ['outside', 'adverb'], ['together', 'adverb'],

  // Extended: extra common K-6 English words
  // Nouns
  ['family', 'noun'], ['mother', 'noun'], ['father', 'noun'], ['sister', 'noun'],
  ['brother', 'noun'], ['table', 'noun'], ['chair', 'noun'], ['door', 'noun'],
  ['window', 'noun'], ['bed', 'noun'], ['food', 'noun'], ['hand', 'noun'],
  ['eye', 'noun'], ['head', 'noun'], ['foot', 'noun'], ['name', 'noun'],
  ['day', 'noun'], ['night', 'noun'], ['morning', 'noun'], ['home', 'noun'],
  ['room', 'noun'], ['toy', 'noun'], ['game', 'noun'], ['story', 'noun'],
  ['picture', 'noun'], ['color', 'noun'], ['number', 'noun'], ['letter', 'noun'],
  ['pig', 'noun'], ['cow', 'noun'], ['duck', 'noun'], ['sheep', 'noun'],
  ['lion', 'noun'], ['tiger', 'noun'], ['elephant', 'noun'], ['ant', 'noun'],
  ['butterfly', 'noun'], ['grass', 'noun'], ['sky', 'noun'], ['river', 'noun'],
  ['mountain', 'noun'], ['sea', 'noun'], ['island', 'noun'],
  // Verbs (base forms)
  ['run', 'verb'], ['jump', 'verb'], ['eat', 'verb'], ['drink', 'verb'],
  ['see', 'verb'], ['like', 'verb'], ['love', 'verb'], ['have', 'verb'],
  ['play', 'verb'], ['read', 'verb'], ['sleep', 'verb'], ['walk', 'verb'],
  ['sing', 'verb'], ['dance', 'verb'], ['fly', 'verb'], ['swim', 'verb'],
  ['climb', 'verb'], ['sit', 'verb'], ['stand', 'verb'], ['cook', 'verb'],
  ['draw', 'verb'], ['make', 'verb'], ['give', 'verb'], ['want', 'verb'],
  ['find', 'verb'], ['hide', 'verb'], ['throw', 'verb'], ['catch', 'verb'],
  ['build', 'verb'], ['grow', 'verb'], ['help', 'verb'], ['open', 'verb'],
  ['close', 'verb'], ['ride', 'verb'], ['go', 'verb'], ['come', 'verb'],
  ['say', 'verb'], ['tell', 'verb'], ['think', 'verb'], ['know', 'verb'],
  ['look', 'verb'], ['put', 'verb'], ['take', 'verb'], ['get', 'verb'],
  ['write', 'verb'], ['listen', 'verb'], ['talk', 'verb'], ['stop', 'verb'],
  ['start', 'verb'], ['try', 'verb'], ['turn', 'verb'], ['move', 'verb'],
  ['carry', 'verb'], ['pull', 'verb'], ['push', 'verb'], ['wash', 'verb'],
  ['clean', 'verb'], ['paint', 'verb'], ['count', 'verb'], ['learn', 'verb'],
  // Adjectives
  ['little', 'adjective'], ['long', 'adjective'], ['short', 'adjective'],
  ['round', 'adjective'], ['white', 'adjective'], ['black', 'adjective'],
  ['pink', 'adjective'], ['brown', 'adjective'], ['nice', 'adjective'],
  ['mean', 'adjective'], ['clean', 'adjective'], ['dirty', 'adjective'],
  ['wet', 'adjective'], ['dry', 'adjective'], ['full', 'adjective'],
  ['empty', 'adjective'], ['hungry', 'adjective'], ['tired', 'adjective'],
  ['sick', 'adjective'], ['beautiful', 'adjective'], ['angry', 'adjective'],
  ['scared', 'adjective'], ['excited', 'adjective'], ['thick', 'adjective'],
  ['thin', 'adjective'], ['sweet', 'adjective'], ['sour', 'adjective'],
  // Adverbs
  ['fast', 'adverb'], ['well', 'adverb'], ['just', 'adverb'],
  ['too', 'adverb'], ['also', 'adverb'], ['often', 'adverb'],
  ['sometimes', 'adverb'], ['soon', 'adverb'], ['again', 'adverb'],
  ['away', 'adverb'], ['up', 'adverb'], ['down', 'adverb'],
]);

// ────────────────────────────────────────────────────
// French dictionary (pool words + ~60 extra common words)
// ────────────────────────────────────────────────────
const FR_POS = new Map<string, PosTag>([
  // From pool: nouns
  ['le chat', 'noun'], ['le chien', 'noun'], ['le poisson', 'noun'],
  ["l'oiseau", 'noun'], ["l'arbre", 'noun'], ['la maison', 'noun'],
  ["l'\u00e9cole", 'noun'], ['le livre', 'noun'], ['la balle', 'noun'],
  ['la voiture', 'noun'], ['maman', 'noun'], ['papa', 'noun'],
  ['le b\u00e9b\u00e9', 'noun'], ['le gar\u00e7on', 'noun'], ['la fille', 'noun'],
  ["l'ami", 'noun'], ['le soleil', 'noun'], ['la lune', 'noun'],
  ["l'\u00e9toile", 'noun'], ['la fleur', 'noun'], ['la pomme', 'noun'],
  ['le g\u00e2teau', 'noun'], ["l'eau", 'noun'], ['le lait', 'noun'],
  ["l'ours", 'noun'], ['le lapin', 'noun'], ['la grenouille', 'noun'],
  ['le singe', 'noun'], ['le chapeau', 'noun'], ['la chaussure', 'noun'],
  ['le cheval', 'noun'], ['la poule', 'noun'], ['le biscuit', 'noun'],
  ['la pizza', 'noun'], ['le camion', 'noun'], ['le bateau', 'noun'],
  ['la pluie', 'noun'], ['la neige', 'noun'], ['le nuage', 'noun'],
  ['le jardin', 'noun'], ['le roi', 'noun'], ['la reine', 'noun'],
  ['le dragon', 'noun'], ['le robot', 'noun'], ['la classe', 'noun'],
  // Extra nouns (without articles for CSV uploads)
  ['chat', 'noun'], ['chien', 'noun'], ['poisson', 'noun'], ['oiseau', 'noun'],
  ['arbre', 'noun'], ['maison', 'noun'], ['\u00e9cole', 'noun'], ['livre', 'noun'],
  ['balle', 'noun'], ['voiture', 'noun'], ['b\u00e9b\u00e9', 'noun'],
  ['gar\u00e7on', 'noun'], ['fille', 'noun'], ['ami', 'noun'], ['amie', 'noun'],
  ['soleil', 'noun'], ['lune', 'noun'], ['\u00e9toile', 'noun'], ['fleur', 'noun'],
  ['pomme', 'noun'], ['g\u00e2teau', 'noun'], ['eau', 'noun'], ['lait', 'noun'],
  ['ours', 'noun'], ['lapin', 'noun'], ['grenouille', 'noun'], ['singe', 'noun'],
  ['chapeau', 'noun'], ['chaussure', 'noun'], ['cheval', 'noun'], ['poule', 'noun'],
  ['biscuit', 'noun'], ['pizza', 'noun'], ['camion', 'noun'], ['bateau', 'noun'],
  ['pluie', 'noun'], ['neige', 'noun'], ['nuage', 'noun'], ['jardin', 'noun'],
  ['roi', 'noun'], ['reine', 'noun'], ['dragon', 'noun'], ['robot', 'noun'],
  ['classe', 'noun'], ['famille', 'noun'], ['m\u00e8re', 'noun'], ['p\u00e8re', 'noun'],
  ['s\u0153ur', 'noun'], ['fr\u00e8re', 'noun'], ['table', 'noun'], ['chaise', 'noun'],
  ['porte', 'noun'], ['fen\u00eatre', 'noun'], ['lit', 'noun'], ['main', 'noun'],
  ['\u0153il', 'noun'], ['t\u00eate', 'noun'], ['pied', 'noun'], ['nom', 'noun'],
  ['jour', 'noun'], ['nuit', 'noun'], ['matin', 'noun'],
  // From pool: verbs
  ['court', 'verb'], ['saute', 'verb'], ['mange', 'verb'], ['boit', 'verb'],
  ['voit', 'verb'], ['aime', 'verb'], ['adore', 'verb'], ['a', 'verb'],
  ['est', 'verb'], ['joue', 'verb'], ['lit', 'verb'], ['dort', 'verb'],
  ['marche', 'verb'], ['chante', 'verb'], ['danse', 'verb'], ['vole', 'verb'],
  ['nage', 'verb'], ['grimpe', 'verb'], ['regarde', 'verb'], ['dessine', 'verb'],
  ['fait', 'verb'], ['donne', 'verb'], ['veut', 'verb'], ['cuisine', 'verb'],
  ['parle', 'verb'], ['trouve', 'verb'], ['cache', 'verb'], ['lance', 'verb'],
  ['attrape', 'verb'], ['construit', 'verb'], ['pousse', 'verb'], ['aide', 'verb'],
  ['ouvre', 'verb'], ['ferme', 'verb'], ['porte', 'verb'],
  // Extra verbs (infinitives)
  ['courir', 'verb'], ['sauter', 'verb'], ['manger', 'verb'], ['boire', 'verb'],
  ['voir', 'verb'], ['aimer', 'verb'], ['jouer', 'verb'], ['lire', 'verb'],
  ['dormir', 'verb'], ['marcher', 'verb'], ['chanter', 'verb'], ['danser', 'verb'],
  ['voler', 'verb'], ['nager', 'verb'], ['regarder', 'verb'], ['dessiner', 'verb'],
  ['faire', 'verb'], ['donner', 'verb'], ['vouloir', 'verb'], ['parler', 'verb'],
  ['trouver', 'verb'], ['cacher', 'verb'], ['construire', 'verb'], ['aider', 'verb'],
  ['ouvrir', 'verb'], ['fermer', 'verb'], ['aller', 'verb'], ['venir', 'verb'],
  ['\u00e9crire', 'verb'], ['\u00e9couter', 'verb'],
  // From pool: adjectives
  ['grand', 'adjective'], ['petit', 'adjective'], ['rouge', 'adjective'],
  ['bleu', 'adjective'], ['vert', 'adjective'], ['content', 'adjective'],
  ['triste', 'adjective'], ['rapide', 'adjective'], ['lent', 'adjective'],
  ['haut', 'adjective'], ['dr\u00f4le', 'adjective'], ['joli', 'adjective'],
  ['doux', 'adjective'], ['fort', 'adjective'], ['calme', 'adjective'],
  ['chaud', 'adjective'], ['froid', 'adjective'], ['nouveau', 'adjective'],
  ['vieux', 'adjective'], ['bon', 'adjective'], ['jaune', 'adjective'],
  ['violet', 'adjective'], ['orange', 'adjective'], ['brave', 'adjective'],
  ['rigolo', 'adjective'], ['minuscule', 'adjective'], ['gentil', 'adjective'],
  ['m\u00e9chant', 'adjective'],
  // Extra adjectives
  ['blanc', 'adjective'], ['noir', 'adjective'], ['rose', 'adjective'],
  ['beau', 'adjective'], ['belle', 'adjective'], ['gros', 'adjective'],
  ['mauvais', 'adjective'], ['long', 'adjective'], ['court', 'adjective'],
  // From pool: adverbs
  ['vite', 'adverb'], ['lentement', 'adverb'], ['tr\u00e8s', 'adverb'],
  ['vraiment', 'adverb'], ['toujours', 'adverb'], ['jamais', 'adverb'],
  ['ici', 'adverb'], ['l\u00e0', 'adverb'], ['maintenant', 'adverb'],
  ["aujourd'hui", 'adverb'], ['joyeusement', 'adverb'], ['doucement', 'adverb'],
  ['dehors', 'adverb'], ['ensemble', 'adverb'], ['bien', 'adverb'],
]);

// ────────────────────────────────────────────────────
// Chinese dictionary (pool words + ~100 extra Sagebooks-level characters)
// ────────────────────────────────────────────────────
const ZH_POS = new Map<string, PosTag>([
  // From pool: nouns
  ['\u732b', 'noun'], ['\u72d7', 'noun'], ['\u9c7c', 'noun'], ['\u9e1f', 'noun'],
  ['\u6811', 'noun'], ['\u623f\u5b50', 'noun'], ['\u5b66\u6821', 'noun'], ['\u4e66', 'noun'],
  ['\u7403', 'noun'], ['\u8f66', 'noun'], ['\u5988\u5988', 'noun'], ['\u7238\u7238', 'noun'],
  ['\u5b9d\u5b9d', 'noun'], ['\u7537\u5b69', 'noun'], ['\u5973\u5b69', 'noun'], ['\u670b\u53cb', 'noun'],
  ['\u592a\u9633', 'noun'], ['\u6708\u4eae', 'noun'], ['\u661f\u661f', 'noun'], ['\u82b1', 'noun'],
  ['\u82f9\u679c', 'noun'], ['\u86cb\u7cd5', 'noun'], ['\u6c34', 'noun'], ['\u725b\u5976', 'noun'],
  ['\u718a', 'noun'], ['\u5154\u5b50', 'noun'], ['\u9752\u86d9', 'noun'], ['\u7334\u5b50', 'noun'],
  ['\u5e3d\u5b50', 'noun'], ['\u978b\u5b50', 'noun'], ['\u9a6c', 'noun'], ['\u9e21', 'noun'],
  ['\u997c\u5e72', 'noun'], ['\u6bd4\u8428', 'noun'], ['\u5361\u8f66', 'noun'], ['\u5c0f\u8239', 'noun'],
  ['\u96e8', 'noun'], ['\u96ea', 'noun'], ['\u4e91', 'noun'], ['\u82b1\u56ed', 'noun'],
  ['\u8001\u5e08', 'noun'], ['\u56fd\u738b', 'noun'], ['\u738b\u540e', 'noun'], ['\u9f99', 'noun'],
  ['\u673a\u5668\u4eba', 'noun'],
  // From pool: verbs
  ['\u8dd1', 'verb'], ['\u8df3', 'verb'], ['\u5403', 'verb'], ['\u559d', 'verb'],
  ['\u770b', 'verb'], ['\u559c\u6b22', 'verb'], ['\u7231', 'verb'], ['\u6709', 'verb'],
  ['\u662f', 'verb'], ['\u73a9', 'verb'], ['\u8bfb', 'verb'], ['\u7761\u89c9', 'verb'],
  ['\u8d70', 'verb'], ['\u5531\u6b4c', 'verb'], ['\u8df3\u821e', 'verb'], ['\u98de', 'verb'],
  ['\u6e38\u6cf3', 'verb'], ['\u722c', 'verb'], ['\u5750', 'verb'], ['\u7ad9', 'verb'],
  ['\u505a\u996d', 'verb'], ['\u753b\u753b', 'verb'], ['\u7ed9', 'verb'], ['\u8981', 'verb'],
  ['\u53bb', 'verb'], ['\u627e', 'verb'], ['\u85cf', 'verb'], ['\u6254', 'verb'],
  ['\u63a5', 'verb'], ['\u5efa', 'verb'], ['\u957f', 'verb'], ['\u5e2e\u52a9', 'verb'],
  ['\u5f00', 'verb'], ['\u5173', 'verb'], ['\u9a91', 'verb'],
  // From pool: adjectives
  ['\u5927', 'adjective'], ['\u5c0f', 'adjective'], ['\u7ea2', 'adjective'], ['\u84dd', 'adjective'],
  ['\u7eff', 'adjective'], ['\u5f00\u5fc3', 'adjective'], ['\u4f24\u5fc3', 'adjective'],
  ['\u5feb', 'adjective'], ['\u6162', 'adjective'], ['\u9ad8', 'adjective'],
  ['\u597d\u7b11', 'adjective'], ['\u6f02\u4eae', 'adjective'], ['\u8f6f', 'adjective'],
  ['\u54cd', 'adjective'], ['\u5b89\u9759', 'adjective'], ['\u70ed', 'adjective'],
  ['\u51b7', 'adjective'], ['\u65b0', 'adjective'], ['\u65e7', 'adjective'], ['\u597d', 'adjective'],
  ['\u9ec4', 'adjective'], ['\u7d2b', 'adjective'], ['\u6a59', 'adjective'],
  ['\u52c7\u6562', 'adjective'], ['\u50bb', 'adjective'], ['\u5c0f\u5c0f', 'adjective'],
  ['\u5f3a\u58ee', 'adjective'], ['\u5584\u826f', 'adjective'],
  // From pool: adverbs
  ['\u5feb\u5feb', 'adverb'], ['\u6162\u6162', 'adverb'], ['\u5f88', 'adverb'], ['\u771f', 'adverb'],
  ['\u603b\u662f', 'adverb'], ['\u4ece\u4e0d', 'adverb'], ['\u8fd9\u91cc', 'adverb'],
  ['\u90a3\u91cc', 'adverb'], ['\u73b0\u5728', 'adverb'], ['\u4eca\u5929', 'adverb'],
  ['\u5f00\u5fc3\u5730', 'adverb'], ['\u5927\u58f0\u5730', 'adverb'], ['\u8f7b\u8f7b\u5730', 'adverb'],
  ['\u5728\u5916\u9762', 'adverb'], ['\u4e00\u8d77', 'adverb'],
  // From pool: phrases/particles
  ['\u5728', 'phrase'], ['\u4e0a', 'phrase'], ['\u4e0b', 'phrase'], ['\u91cc', 'phrase'],
  ['\u7684', 'particle'], ['\u4e86', 'particle'],
  ['\u4e00\u4e2a', 'phrase'], ['\u8fd9\u4e2a', 'phrase'], ['\u90a3\u4e2a', 'phrase'],
  ['\u540e\u9762', 'phrase'], ['\u4e0a\u9762', 'phrase'], ['\u65c1\u8fb9', 'phrase'],
  ['\u91cc\u9762', 'phrase'], ['\u5468\u56f4', 'phrase'], ['\u4e2d\u95f4', 'phrase'],
  ['\u4e00\u4e9b', 'phrase'], ['\u5f88\u591a', 'phrase'], ['\u5230', 'phrase'],
  // From pool: conjunctions
  ['\u548c', 'conjunction'], ['\u4f46\u662f', 'conjunction'], ['\u6216\u8005', 'conjunction'],
  ['\u56e0\u4e3a', 'conjunction'], ['\u6240\u4ee5', 'conjunction'], ['\u8fd8\u6709', 'conjunction'],
  ['\u7136\u540e', 'conjunction'], ['\u5982\u679c', 'conjunction'], ['\u4e00\u8fb9', 'conjunction'],

  // Extended: extra Sagebooks-level characters & common words
  // Nouns
  ['\u4eba', 'noun'], ['\u5c71', 'noun'], ['\u706b', 'noun'], ['\u571f', 'noun'],
  ['\u77f3', 'noun'], ['\u98ce', 'noun'], ['\u7530', 'noun'], ['\u6728', 'noun'],
  ['\u53e3', 'noun'], ['\u76ee', 'noun'], ['\u8033', 'noun'], ['\u624b', 'noun'],
  ['\u5934', 'noun'], ['\u8eab', 'noun'], ['\u5fc3', 'noun'], ['\u5bb6', 'noun'],
  ['\u8def', 'noun'], ['\u6865', 'noun'], ['\u95e8', 'noun'], ['\u706f', 'noun'],
  ['\u7c73', 'noun'], ['\u83dc', 'noun'], ['\u8089', 'noun'], ['\u86cb', 'noun'],
  ['\u9762', 'noun'], ['\u5e8a', 'noun'], ['\u684c\u5b50', 'noun'], ['\u6905\u5b50', 'noun'],
  ['\u54e5\u54e5', 'noun'], ['\u59d0\u59d0', 'noun'], ['\u5f1f\u5f1f', 'noun'], ['\u59b9\u59b9', 'noun'],
  ['\u7237\u7237', 'noun'], ['\u5976\u5976', 'noun'], ['\u5c0f\u670b\u53cb', 'noun'],
  ['\u5e7c\u513f\u56ed', 'noun'], ['\u516c\u56ed', 'noun'], ['\u5546\u5e97', 'noun'],
  // Verbs
  ['\u6765', 'verb'], ['\u4e0a', 'verb'], ['\u4e0b', 'verb'], ['\u56de', 'verb'],
  ['\u8bf4', 'verb'], ['\u542c', 'verb'], ['\u5199', 'verb'], ['\u60f3', 'verb'],
  ['\u77e5\u9053', 'verb'], ['\u5b66', 'verb'], ['\u6559', 'verb'], ['\u5f97', 'verb'],
  ['\u80fd', 'verb'], ['\u4f1a', 'verb'], ['\u8ba9', 'verb'], ['\u7b49', 'verb'],
  ['\u62ff', 'verb'], ['\u653e', 'verb'], ['\u7a7f', 'verb'], ['\u6d17', 'verb'],
  ['\u4e70', 'verb'], ['\u5356', 'verb'], ['\u7b54', 'verb'], ['\u95ee', 'verb'],
  ['\u7b11', 'verb'], ['\u54ed', 'verb'], ['\u8ba4\u8bc6', 'verb'], ['\u8bb0\u4f4f', 'verb'],
  ['\u660e\u767d', 'verb'], ['\u5e0c\u671b', 'verb'],
  // Adjectives
  ['\u591a', 'adjective'], ['\u5c11', 'adjective'], ['\u957f', 'adjective'], ['\u77ed', 'adjective'],
  ['\u80d6', 'adjective'], ['\u7626', 'adjective'], ['\u767d', 'adjective'], ['\u9ed1', 'adjective'],
  ['\u7f8e', 'adjective'], ['\u4e11', 'adjective'], ['\u5bf9', 'adjective'], ['\u9519', 'adjective'],
  ['\u8fdc', 'adjective'], ['\u8fd1', 'adjective'], ['\u5e72\u51c0', 'adjective'], ['\u5feb\u4e50', 'adjective'],
  ['\u751f\u6c14', 'adjective'], ['\u5bb3\u6015', 'adjective'], ['\u96be\u8fc7', 'adjective'],
  // Adverbs
  ['\u4e5f', 'adverb'], ['\u90fd', 'adverb'], ['\u53c8', 'adverb'], ['\u5c31', 'adverb'],
  ['\u624d', 'adverb'], ['\u5df2\u7ecf', 'adverb'], ['\u6b63\u5728', 'adverb'],
  // Particles
  ['\u5417', 'particle'], ['\u5462', 'particle'], ['\u554a', 'particle'],
  ['\u7740', 'particle'], ['\u8fc7', 'particle'],
  // Measure words (classifiers) — treat as phrase
  ['\u53ea', 'phrase'], ['\u4e2a', 'phrase'], ['\u672c', 'phrase'], ['\u6761', 'phrase'],
  ['\u5757', 'phrase'], ['\u5f20', 'phrase'], ['\u628a', 'phrase'],
]);

const DICTIONARIES: Record<string, Map<string, PosTag>> = {
  en: EN_POS,
  fr: FR_POS,
  'zh-Hans': ZH_POS,
};

/**
 * Detect the part of speech for a word in the given language.
 * Returns the POS if found in the dictionary, or 'phrase' as default.
 */
export function detectPos(word: string, language: string): PosTag {
  const dict = DICTIONARIES[language];
  if (!dict) return 'phrase';

  // Try exact match first
  const lower = word.toLowerCase().trim();
  if (dict.has(lower)) return dict.get(lower)!;

  // For non-CJK: also try the original case (e.g. 'I' in English)
  const trimmed = word.trim();
  if (dict.has(trimmed)) return dict.get(trimmed)!;

  return 'phrase';
}

/**
 * Auto-tag an array of words with POS.
 * Only fills in POS for words that don't already have one.
 */
export function autoTagWords(
  words: { word: string; pos?: string; phonetic?: string }[],
  language: string
): { word: string; pos: string; phonetic?: string }[] {
  return words.map((w) => ({
    ...w,
    pos: w.pos || detectPos(w.word, language),
  }));
}
