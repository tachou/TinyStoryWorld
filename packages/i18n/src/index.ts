import type { Language } from '@tiny-story-world/types';

export type { Language } from '@tiny-story-world/types';

export interface LocaleStrings {
  appTitle: string;
  selectLanguage: string;
  instructionLanguage: string;
  tapToStart: string;
  pinyinToggle: string;
  posToggle: string;
  play: string;
  submit: string;
  clearAll: string;
  newRound: string;
  home: string;
  trayFull: string;
  needMoreTiles: string;
  clearConfirm: string;
  yes: string;
  no: string;
  correct: string;
  incorrect: string;
  partial: string;
  noNounOrVerb: string;
  noNoun: string;
  noVerb: string;
  nounBeforeVerb: string;
  danglingPhrase: string;
  tileCount: string;
  legend: string;
  noun: string;
  verb: string;
  adjective: string;
  adverb: string;
  phrase: string;
  conjunction: string;
  allWordsUsed: string;
  // Settings
  settings: string;
  highContrastMode: string;
  ttsProviderLabel: string;
  browser: string;
  cloud: string;
  changePin: string;
  enterPin: string;
  incorrectPin: string;
  pinChanged: string;
  close: string;
  // Word list upload
  uploadWordList: string;
  customWords: string;
  defaultWords: string;
  uploadFile: string;
  listName: string;
  preview: string;
  confirmUpload: string;
  // Progress
  viewProgress: string;
  totalSentences: string;
  correctPercent: string;
  sentencesToday: string;
  streak: string;
  perLanguage: string;
  last30Days: string;
  mostUsedWords: string;
  noDataYet: string;
  // Badges
  badgeGallery: string;
  badgeEarned: string;
  locked: string;
  badgeFirstSentence: string;
  badgeFirstSentenceDesc: string;
  badgeCorrect10: string;
  badgeCorrect10Desc: string;
  badgeCorrect50: string;
  badgeCorrect50Desc: string;
  badgeCorrect100: string;
  badgeCorrect100Desc: string;
  badgePolyglot: string;
  badgePolyglotDesc: string;
  badgeStreak5: string;
  badgeStreak5Desc: string;
  badgeStreak10: string;
  badgeStreak10Desc: string;
  badgeDaily5: string;
  badgeDaily5Desc: string;
  // Tap-to-hear
  tapToHearOn: string;
  tapToHearOff: string;
  // Help
  helpButton: string;
  helpTitle: string;
  showAll: string;
  nSentences: string;
  noSentences: string;
}

const locales: Record<Language, LocaleStrings> = {
  en: {
    appTitle: 'Silly Sentences',
    selectLanguage: 'Choose Your Language!',
    instructionLanguage: 'Instructions in:',
    tapToStart: 'Tap a tile to start building sentences!',
    pinyinToggle: 'Pinyin',
    posToggle: 'POS',
    play: 'Play',
    submit: 'Submit',
    clearAll: 'Clear All',
    newRound: 'New Words',
    home: 'Home',
    trayFull: 'Your sentence is full!',
    needMoreTiles: 'Add at least 3 words first!',
    clearConfirm: 'Remove all words from your sentence?',
    yes: 'Yes',
    no: 'No',
    correct: 'Awesome sentence!',
    incorrect: 'Hmm, try moving the action word.',
    partial: 'Almost! Can you add one more word?',
    noNounOrVerb: 'A sentence needs a naming word and an action word!',
    noNoun: 'Try adding a naming word (like cat or dog)!',
    noVerb: 'Try adding an action word (like runs or eats)!',
    nounBeforeVerb: 'Try putting the naming word before the action word!',
    danglingPhrase: 'Almost! Can you add one more word after that?',
    tileCount: 'words',
    legend: 'Word Types',
    noun: 'Noun',
    verb: 'Verb',
    adjective: 'Adjective',
    adverb: 'Adverb',
    phrase: 'Phrase',
    conjunction: 'Joining',
    allWordsUsed: 'All words are in your sentence!',
    settings: 'Settings',
    highContrastMode: 'High Contrast',
    ttsProviderLabel: 'Voice',
    browser: 'Browser',
    cloud: 'Cloud',
    changePin: 'Change PIN',
    enterPin: 'Enter PIN',
    incorrectPin: 'Incorrect PIN, try again!',
    pinChanged: 'PIN changed!',
    close: 'Close',
    uploadWordList: 'Word Lists',
    customWords: 'Your Lists',
    defaultWords: 'Default Words',
    uploadFile: 'Upload New List',
    listName: 'List name',
    preview: 'Preview',
    confirmUpload: 'Confirm Upload',
    viewProgress: 'Progress',
    totalSentences: 'Total',
    correctPercent: 'Correct',
    sentencesToday: 'Today',
    streak: 'Day streak',
    perLanguage: 'By Language',
    last30Days: 'Last 30 Days',
    mostUsedWords: 'Most Used Words',
    noDataYet: 'No data yet. Start building sentences!',
    badgeGallery: 'Badges',
    badgeEarned: 'Badge Earned!',
    locked: 'Locked',
    badgeFirstSentence: 'First Sentence',
    badgeFirstSentenceDesc: 'Built your very first sentence!',
    badgeCorrect10: 'Grammar Star',
    badgeCorrect10Desc: '10 correct sentences!',
    badgeCorrect50: 'Sentence Master',
    badgeCorrect50Desc: '50 correct sentences!',
    badgeCorrect100: 'Word Wizard',
    badgeCorrect100Desc: '100 correct sentences!',
    badgePolyglot: 'Polyglot',
    badgePolyglotDesc: 'Tried all three languages!',
    badgeStreak5: 'On Fire',
    badgeStreak5Desc: '5 correct in a row!',
    badgeStreak10: 'Unstoppable',
    badgeStreak10Desc: '10 correct in a row!',
    badgeDaily5: 'Busy Builder',
    badgeDaily5Desc: '5 sentences in one day!',
    tapToHearOn: 'Tap tiles to hear words',
    tapToHearOff: 'Word sounds off',
    helpButton: 'Help',
    helpTitle: "Here's a sentence you can make!",
    showAll: 'Show All',
    nSentences: 'sentences found',
    noSentences: 'These tiles are tricky! Try dragging some to the tray.',
  },
  fr: {
    appTitle: 'Silly Sentences',
    selectLanguage: 'Choisis ta langue !',
    instructionLanguage: 'Instructions en :',
    tapToStart: 'Appuie sur un mot pour construire des phrases !',
    pinyinToggle: 'Pinyin',
    posToggle: 'POS',
    play: 'Jouer',
    submit: 'Valider',
    clearAll: 'Tout effacer',
    newRound: 'Nouveaux mots',
    home: 'Accueil',
    trayFull: 'Ta phrase est complète !',
    needMoreTiles: 'Ajoute au moins 3 mots !',
    clearConfirm: 'Retirer tous les mots de ta phrase ?',
    yes: 'Oui',
    no: 'Non',
    correct: 'Superbe phrase !',
    incorrect: "Essaie de changer l'ordre.",
    partial: 'Presque ! Ajoute un mot.',
    noNounOrVerb: 'Une phrase a besoin d\u2019un nom et d\u2019un verbe !',
    noNoun: 'Ajoute un nom (comme le chat ou la fleur) !',
    noVerb: 'Ajoute un verbe (comme mange ou court) !',
    nounBeforeVerb: 'Essaie de mettre le nom avant le verbe !',
    danglingPhrase: 'Presque ! Ajoute un mot après celui-là !',
    tileCount: 'mots',
    legend: 'Types de mots',
    noun: 'Nom',
    verb: 'Verbe',
    adjective: 'Adjectif',
    adverb: 'Adverbe',
    phrase: 'Expression',
    conjunction: 'Liaison',
    allWordsUsed: 'Tous les mots sont dans ta phrase !',
    settings: 'Réglages',
    highContrastMode: 'Contraste élevé',
    ttsProviderLabel: 'Voix',
    browser: 'Navigateur',
    cloud: 'Cloud',
    changePin: 'Changer le PIN',
    enterPin: 'Entrer le PIN',
    incorrectPin: 'PIN incorrect, réessaie !',
    pinChanged: 'PIN changé !',
    close: 'Fermer',
    uploadWordList: 'Listes de mots',
    customWords: 'Vos listes',
    defaultWords: 'Mots par défaut',
    uploadFile: 'Ajouter une liste',
    listName: 'Nom de la liste',
    preview: 'Aperçu',
    confirmUpload: 'Confirmer',
    viewProgress: 'Progrès',
    totalSentences: 'Total',
    correctPercent: 'Correct',
    sentencesToday: "Aujourd'hui",
    streak: 'Jours consécutifs',
    perLanguage: 'Par langue',
    last30Days: '30 derniers jours',
    mostUsedWords: 'Mots les plus utilisés',
    noDataYet: 'Pas encore de données. Commence à construire !',
    badgeGallery: 'Badges',
    badgeEarned: 'Badge obtenu !',
    locked: 'Verrouillé',
    badgeFirstSentence: 'Première phrase',
    badgeFirstSentenceDesc: 'Tu as construit ta première phrase !',
    badgeCorrect10: 'Étoile de grammaire',
    badgeCorrect10Desc: '10 phrases correctes !',
    badgeCorrect50: 'Maître des phrases',
    badgeCorrect50Desc: '50 phrases correctes !',
    badgeCorrect100: 'Magicien des mots',
    badgeCorrect100Desc: '100 phrases correctes !',
    badgePolyglot: 'Polyglotte',
    badgePolyglotDesc: 'Tu as essayé les trois langues !',
    badgeStreak5: 'En feu',
    badgeStreak5Desc: '5 correctes de suite !',
    badgeStreak10: 'Inarrêtable',
    badgeStreak10Desc: '10 correctes de suite !',
    badgeDaily5: 'Constructeur assidu',
    badgeDaily5Desc: '5 phrases en un jour !',
    tapToHearOn: 'Touche une tuile pour entendre le mot',
    tapToHearOff: 'Sons désactivés',
    helpButton: 'Aide',
    helpTitle: 'Voici une phrase possible !',
    showAll: 'Tout afficher',
    nSentences: 'phrases trouvées',
    noSentences: 'Ces tuiles sont difficiles ! Essaie d\u2019en glisser dans le plateau.',
  },
  'zh-Hans': {
    appTitle: 'Silly Sentences',
    selectLanguage: '选择你的语言！',
    instructionLanguage: '指导语言：',
    tapToStart: '点击词语开始造句！',
    pinyinToggle: '拼音',
    posToggle: '词性',
    play: '播放',
    submit: '提交',
    clearAll: '全部清除',
    newRound: '新词语',
    home: '首页',
    trayFull: '你的句子已满！',
    needMoreTiles: '至少添加三个词！',
    clearConfirm: '清除句子中的所有词语？',
    yes: '是',
    no: '否',
    correct: '太棒了！',
    incorrect: '试试调换顺序！',
    partial: '差不多，再加一个！',
    noNounOrVerb: '句子需要名词和动词！',
    noNoun: '试试加一个名词（比如猫或狗）！',
    noVerb: '试试加一个动词（比如吃或跑）！',
    nounBeforeVerb: '试试把名词放在动词前面！',
    danglingPhrase: '差不多！再加一个词吧！',
    tileCount: '个词',
    legend: '词类',
    noun: '名词',
    verb: '动词',
    adjective: '形容词',
    adverb: '副词',
    phrase: '短语',
    conjunction: '连词',
    allWordsUsed: '所有词语都在句子里了！',
    settings: '设置',
    highContrastMode: '高对比度',
    ttsProviderLabel: '语音',
    browser: '浏览器',
    cloud: '云端',
    changePin: '修改PIN',
    enterPin: '输入PIN',
    incorrectPin: 'PIN不正确，再试一次！',
    pinChanged: 'PIN已修改！',
    close: '关闭',
    uploadWordList: '词表',
    customWords: '你的词表',
    defaultWords: '默认词语',
    uploadFile: '上传新词表',
    listName: '词表名称',
    preview: '预览',
    confirmUpload: '确认上传',
    viewProgress: '进度',
    totalSentences: '总计',
    correctPercent: '正确率',
    sentencesToday: '今天',
    streak: '连续天数',
    perLanguage: '按语言',
    last30Days: '近 30 天',
    mostUsedWords: '最常用词语',
    noDataYet: '还没有数据。开始造句吧！',
    badgeGallery: '徽章',
    badgeEarned: '获得徽章！',
    locked: '未解锁',
    badgeFirstSentence: '第一句',
    badgeFirstSentenceDesc: '你造出了第一句话！',
    badgeCorrect10: '语法之星',
    badgeCorrect10Desc: '10句正确！',
    badgeCorrect50: '造句大师',
    badgeCorrect50Desc: '50句正确！',
    badgeCorrect100: '词语魔法师',
    badgeCorrect100Desc: '100句正确！',
    badgePolyglot: '多语达人',
    badgePolyglotDesc: '你尝试了三种语言！',
    badgeStreak5: '火力全开',
    badgeStreak5Desc: '连续5句正确！',
    badgeStreak10: '势不可挡',
    badgeStreak10Desc: '连续10句正确！',
    badgeDaily5: '勤奋建造者',
    badgeDaily5Desc: '一天内造了5句！',
    tapToHearOn: '点击方块听发音',
    tapToHearOff: '发音已关闭',
    helpButton: '帮助',
    helpTitle: '这是你可以造的句子！',
    showAll: '显示全部',
    nSentences: '个句子',
    noSentences: '这些字块有点难！试试把一些拖到托盘里。',
  },
};

/**
 * Get localized strings for a given language.
 */
export function t(lang: Language): LocaleStrings {
  return locales[lang];
}

/**
 * Get a specific localized string by key.
 */
export function tKey(lang: Language, key: keyof LocaleStrings): string {
  return locales[lang][key];
}
