import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://yidonghu.github.io',
  build: {
    format: 'directory',
  },
  markdown: {
    shikiConfig: {
      theme: 'github-dark-dimmed',
      wrap: true,
    },
  },
});
