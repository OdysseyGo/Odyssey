import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'Odyssey',
  tagline: '',
  favicon: 'img/icon.jpeg',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://odysseygo.github.io/',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: 'Odyssey/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'OdysseyGO', // Usually your GitHub org/user name.
  projectName: 'Odyssey', // Usually your repo name.

  onBrokenLinks: 'throw',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    colorMode: {
      defaultMode: 'dark', 
      disableSwitch: true, 
      respectPrefersColorScheme: false, 
    },
    navbar: {
      title: 'Odyssey',
      logo: {
        alt: 'Odyssey App Logo',
        src: 'img/icon.jpeg', // This uses the same icon from your static folder
      },
      items: [
        // LEFT SIDE NAVIGATION
        {
          to: '/about', 
          label: 'About Us', 
          position: 'left',
        },
        {
          to: '/team', 
          label: 'Team', 
          position: 'left',
        },
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar', 
          position: 'left',
          label: 'Documentation',
        },

        {
          href: '/media',
          label: 'Media',
          position: 'left',
        },
        
        // RIGHT SIDE NAVIGATION
        {
          href: '#', // Placeholder for  App Store link
          label: 'Download App',
          position: 'right',
          className: 'button button--primary', 
        },
      ],
    },
  },
};

export default config;
