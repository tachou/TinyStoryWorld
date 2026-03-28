import type { WordEntry } from '@tiny-story-world/types';

let id = 0;
const w = (word: string, pos: WordEntry['pos'], phonetic?: string): WordEntry => ({
  id: `zh-${id++}`,
  word,
  pos,
  lang: 'zh-Hans',
  phonetic,
});

export const chineseWords: WordEntry[] = [
  // Nouns (45)
  w('\u732b', 'noun', 'm\u0101o'), w('\u72d7', 'noun', 'g\u01d2u'),
  w('\u9c7c', 'noun', 'y\u00fa'), w('\u9e1f', 'noun', 'ni\u01ceo'),
  w('\u6811', 'noun', 'sh\u00f9'), w('\u623f\u5b50', 'noun', 'f\u00e1ngzi'),
  w('\u5b66\u6821', 'noun', 'xu\u00e9xi\u00e0o'), w('\u4e66', 'noun', 'sh\u016b'),
  w('\u7403', 'noun', 'qi\u00fa'), w('\u8f66', 'noun', 'ch\u0113'),
  w('\u5988\u5988', 'noun', 'm\u0101ma'), w('\u7238\u7238', 'noun', 'b\u00e0ba'),
  w('\u5b9d\u5b9d', 'noun', 'b\u01ceo bao'), w('\u7537\u5b69', 'noun', 'n\u00e1nh\u00e1i'),
  w('\u5973\u5b69', 'noun', 'n\u01dah\u00e1i'), w('\u670b\u53cb', 'noun', 'p\u00e9ngyou'),
  w('\u592a\u9633', 'noun', 't\u00e0iy\u00e1ng'), w('\u6708\u4eae', 'noun', 'yu\u00e8liang'),
  w('\u661f\u661f', 'noun', 'x\u012bngxing'), w('\u82b1', 'noun', 'hu\u0101'),
  w('\u82f9\u679c', 'noun', 'p\u00ednggu\u01d2'), w('\u86cb\u7cd5', 'noun', 'd\u00e0ng\u0101o'),
  w('\u6c34', 'noun', 'shu\u01d0'), w('\u725b\u5976', 'noun', 'ni\u00fan\u01cei'),
  w('\u718a', 'noun', 'xi\u00f3ng'), w('\u5154\u5b50', 'noun', 't\u00f9zi'),
  w('\u9752\u86d9', 'noun', 'q\u012bngw\u0101'), w('\u7334\u5b50', 'noun', 'h\u00f3uzi'),
  w('\u5e3d\u5b50', 'noun', 'm\u00e0ozi'), w('\u978b\u5b50', 'noun', 'xi\u00e9zi'),
  w('\u9a6c', 'noun', 'm\u01ce'), w('\u9e21', 'noun', 'j\u012b'),
  w('\u997c\u5e72', 'noun', 'b\u01d0ngg\u0101n'), w('\u6bd4\u8428', 'noun', 'b\u01d0s\u00e0'),
  w('\u5361\u8f66', 'noun', 'k\u01ce ch\u0113'), w('\u5c0f\u8239', 'noun', 'xi\u01ceo chu\u00e1n'),
  w('\u96e8', 'noun', 'y\u01d4'), w('\u96ea', 'noun', 'xu\u011b'),
  w('\u4e91', 'noun', 'y\u00fan'), w('\u82b1\u56ed', 'noun', 'hu\u0101yu\u00e1n'),
  w('\u8001\u5e08', 'noun', 'l\u01ceosh\u012b'), w('\u56fd\u738b', 'noun', 'gu\u00f3w\u00e1ng'),
  w('\u738b\u540e', 'noun', 'w\u00e1ngh\u00f2u'), w('\u9f99', 'noun', 'l\u00f3ng'),
  w('\u673a\u5668\u4eba', 'noun', 'j\u012bq\u00edr\u00e9n'),

  // Verbs (35)
  w('\u8dd1', 'verb', 'p\u01ceo'), w('\u8df3', 'verb', 'ti\u00e0o'),
  w('\u5403', 'verb', 'ch\u012b'), w('\u559d', 'verb', 'h\u0113'),
  w('\u770b', 'verb', 'k\u00e0n'), w('\u559c\u6b22', 'verb', 'x\u01d0huan'),
  w('\u7231', 'verb', '\u00e0i'), w('\u6709', 'verb', 'y\u01d2u'),
  w('\u662f', 'verb', 'sh\u00ec'), w('\u73a9', 'verb', 'w\u00e1n'),
  w('\u8bfb', 'verb', 'd\u00fa'), w('\u7761\u89c9', 'verb', 'shu\u00ecji\u00e0o'),
  w('\u8d70', 'verb', 'z\u01d2u'), w('\u5531\u6b4c', 'verb', 'ch\u00e0ngg\u0113'),
  w('\u8df3\u821e', 'verb', 'ti\u00e0ow\u01d4'), w('\u98de', 'verb', 'f\u0113i'),
  w('\u6e38\u6cf3', 'verb', 'y\u00f3uy\u01d2ng'), w('\u722c', 'verb', 'p\u00e1'),
  w('\u5750', 'verb', 'zu\u00f2'), w('\u7ad9', 'verb', 'zh\u00e0n'),
  w('\u505a\u996d', 'verb', 'zu\u00f2f\u00e0n'), w('\u753b\u753b', 'verb', 'hu\u00e0hu\u00e0'),
  w('\u7ed9', 'verb', 'g\u011bi'), w('\u8981', 'verb', 'y\u00e0o'),
  w('\u53bb', 'verb', 'q\u00f9'), w('\u627e', 'verb', 'zh\u01ceo'),
  w('\u85cf', 'verb', 'c\u00e1ng'), w('\u6254', 'verb', 'r\u0113ng'),
  w('\u63a5', 'verb', 'ji\u0113'), w('\u5efa', 'verb', 'ji\u00e0n'),
  w('\u957f', 'verb', 'zh\u01ceng'), w('\u5e2e\u52a9', 'verb', 'b\u0101ngzh\u00f9'),
  w('\u5f00', 'verb', 'k\u0101i'), w('\u5173', 'verb', 'gu\u0101n'),
  w('\u9a91', 'verb', 'q\u00ed'),

  // Adjectives (28)
  w('\u5927', 'adjective', 'd\u00e0'), w('\u5c0f', 'adjective', 'xi\u01ceo'),
  w('\u7ea2', 'adjective', 'h\u00f3ng'), w('\u84dd', 'adjective', 'l\u00e1n'),
  w('\u7eff', 'adjective', 'l\u01dc'), w('\u5f00\u5fc3', 'adjective', 'k\u0101ix\u012bn'),
  w('\u4f24\u5fc3', 'adjective', 'sh\u0101ngx\u012bn'), w('\u5feb', 'adjective', 'ku\u00e0i'),
  w('\u6162', 'adjective', 'm\u00e0n'), w('\u9ad8', 'adjective', 'g\u0101o'),
  w('\u597d\u7b11', 'adjective', 'h\u01ceox\u00ec\u00e0o'), w('\u6f02\u4eae', 'adjective', 'pi\u00e0oliang'),
  w('\u8f6f', 'adjective', 'ru\u01cen'), w('\u54cd', 'adjective', 'xi\u01ceng'),
  w('\u5b89\u9759', 'adjective', '\u0101nj\u00ecng'), w('\u70ed', 'adjective', 'r\u00e8'),
  w('\u51b7', 'adjective', 'l\u011bng'), w('\u65b0', 'adjective', 'x\u012bn'),
  w('\u65e7', 'adjective', 'ji\u00f9'), w('\u597d', 'adjective', 'h\u01ceo'),
  w('\u9ec4', 'adjective', 'hu\u00e1ng'), w('\u7d2b', 'adjective', 'z\u01d0'),
  w('\u6a59', 'adjective', 'ch\u00e9ng'), w('\u52c7\u6562', 'adjective', 'y\u01d2ngg\u01cen'),
  w('\u50bb', 'adjective', 'sh\u01ce'), w('\u5c0f\u5c0f', 'adjective', 'xi\u01ceox\u01ceo'),
  w('\u5f3a\u58ee', 'adjective', 'qi\u00e1ngzhu\u00e0ng'), w('\u5584\u826f', 'adjective', 'sh\u00e0nli\u00e1ng'),

  // Adverbs (15)
  w('\u5feb\u5feb', 'adverb', 'ku\u00e0iku\u00e0i'), w('\u6162\u6162', 'adverb', 'm\u00e0nm\u00e0n'),
  w('\u5f88', 'adverb', 'h\u011bn'), w('\u771f', 'adverb', 'zh\u0113n'),
  w('\u603b\u662f', 'adverb', 'z\u01d2ngsh\u00ec'), w('\u4ece\u4e0d', 'adverb', 'c\u00f3ngb\u00f9'),
  w('\u8fd9\u91cc', 'adverb', 'zh\u00e8l\u01d0'), w('\u90a3\u91cc', 'adverb', 'n\u00e0l\u01d0'),
  w('\u73b0\u5728', 'adverb', 'xi\u00e0nz\u00e0i'), w('\u4eca\u5929', 'adverb', 'j\u012bnti\u0101n'),
  w('\u5f00\u5fc3\u5730', 'adverb', 'k\u0101ix\u012bn de'), w('\u5927\u58f0\u5730', 'adverb', 'd\u00e0sh\u0113ng de'),
  w('\u8f7b\u8f7b\u5730', 'adverb', 'q\u012bngq\u012bng de'), w('\u5728\u5916\u9762', 'adverb', 'z\u00e0i w\u00e0imi\u00e0n'),
  w('\u4e00\u8d77', 'adverb', 'y\u00ecq\u01d0'),

  // Pronouns
  w('\u6211', 'phrase', 'w\u01d2'),

  // Particles/Phrases (18)
  w('\u5728', 'phrase', 'z\u00e0i'), w('\u4e0a', 'phrase', 'sh\u00e0ng'),
  w('\u4e0b', 'phrase', 'xi\u00e0'), w('\u91cc', 'phrase', 'l\u01d0'),
  w('\u7684', 'particle', 'de'), w('\u4e86', 'particle', 'le'),
  w('\u4e00\u4e2a', 'phrase', 'y\u00ed g\u00e8'), w('\u8fd9\u4e2a', 'phrase', 'zh\u00e8ge'),
  w('\u90a3\u4e2a', 'phrase', 'n\u00e0ge'), w('\u540e\u9762', 'phrase', 'h\u00f2umi\u00e0n'),
  w('\u4e0a\u9762', 'phrase', 'sh\u00e0ngmi\u00e0n'), w('\u65c1\u8fb9', 'phrase', 'p\u00e1ngbi\u0101n'),
  w('\u91cc\u9762', 'phrase', 'l\u01d0mi\u00e0n'), w('\u5468\u56f4', 'phrase', 'zh\u014duw\u00e9i'),
  w('\u4e2d\u95f4', 'phrase', 'zh\u014dngji\u0101n'), w('\u4e00\u4e9b', 'phrase', 'y\u00ecxi\u0113'),
  w('\u5f88\u591a', 'phrase', 'h\u011bn du\u014d'), w('\u5230', 'phrase', 'd\u00e0o'),

  // Conjunctions (9)
  w('\u548c', 'conjunction', 'h\u00e9'), w('\u4f46\u662f', 'conjunction', 'd\u00e0nsh\u00ec'),
  w('\u6216\u8005', 'conjunction', 'hu\u00f2zh\u011b'), w('\u56e0\u4e3a', 'conjunction', 'y\u012bnw\u00e8i'),
  w('\u6240\u4ee5', 'conjunction', 'su\u01d2y\u01d0'), w('\u8fd8\u6709', 'conjunction', 'h\u00e1iy\u01d2u'),
  w('\u7136\u540e', 'conjunction', 'r\u00e1nh\u00f2u'), w('\u5982\u679c', 'conjunction', 'r\u00fagu\u01d2'),
  w('\u4e00\u8fb9', 'conjunction', 'y\u00ecbi\u0101n'),
];
