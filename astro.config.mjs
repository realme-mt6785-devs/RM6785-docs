// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import remarkGithubAlerts from 'remark-github-alerts';
import "remark-github-alerts/styles/github-colors-light.css";
import "remark-github-alerts/styles/github-colors-dark-class.css";

// https://astro.build/config
export default defineConfig({
  markdown: {
    remarkPlugins: [remarkGithubAlerts],
  },
  site: 'https://realme-mt6785-devs.github.io',
  base: '/RM6785-docs',
  integrations: [
    starlight({
      title: 'RM6785 Docs',
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/realme-mt6785-devs/realme-mt6785-devs.github.io' }],
      favicon: '/favicon.jpg',
      customCss: ['./src/styles/custom.css'],
      sidebar: [
        {
          label: 'Main',
          items: [
            // Each item here is one entry in the navigation menu.
            { label: 'Main Page', slug: 'index' },
          ],
        },
        {
          label: 'Guides',
          autogenerate: { directory: 'guides' },
        },
        {
          label: 'Troubleshooting',
          autogenerate: { directory: 'troubleshooting' },
        },
        {
          label: 'Appendix',
          autogenerate: { directory: 'appendix' },
        },
      ],
    }),
  ],
});
