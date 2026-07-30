// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
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
          items: [{ autogenerate: { directory: 'guides' } }],
        },
        {
          label: 'Troubleshooting',
          items: [{ autogenerate: { directory: 'troubleshooting' } }],
        },
        {
          label: 'Appendix',
          items: [{ autogenerate: { directory: 'appendix' } }],
        },
      ],
    }),
  ],
});
