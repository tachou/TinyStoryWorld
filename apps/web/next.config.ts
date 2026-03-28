import type { NextConfig } from 'next';

const config: NextConfig = {
  transpilePackages: [
    '@tiny-story-world/ui',
    '@tiny-story-world/types',
    '@tiny-story-world/i18n',
    '@tiny-story-world/sentence-engine',
    '@tiny-story-world/audio',
    '@tiny-story-world/db',
  ],
};

export default config;
