import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import { GiscusConfig } from './src/components/Comment'


const config: Config = {
  title: 'Moonlit',
  tagline: '欢迎来到Moonlit, 我是Too_young',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://alexritian.github.io/',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'AlexRITIAN', // Usually your GitHub org/user name.
  projectName: 'alexritian.github.io', // Usually your repo name.
  trailingSlash: false,

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'zh-Hans',
    locales: ['zh-Hans', 'en'],
    path: 'i18n'
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
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    docs: {
      sidebar: {
        autoCollapseCategories: true,
        hideable: true
      },
    },
    // Replace with your project's social card
    image: 'img/moonlit-social-card.jpg',
    navbar: {
      title: 'Moonlit',
      logo: {
        alt: 'Moonlit Logo',
        src: 'img/logo.svg',
      },
      items: [
        // {
        //   type: 'docSidebar',
        //   sidebarId: 'docSidebar',
        //   position: 'left',
        //   label: 'Docs',
        // },
        { to: '/blog', label: 'Blog', position: 'left' },
        { 
          to: 'docs/dairy', 
          label: 'Dairy', 
          position: 'left' 
        },
        {
          href: 'https://github.com/AlexRITIAN',
          position: 'right',
          className: 'header-github-link',
          'aria-label': 'Github profile',
        },
        {
          href: 'https://steamcommunity.com/profiles/76561198097104630/',
          position: 'right',
          className: 'header-steam-link',
          'aria-label': 'Steam',
        },
        {
          type: 'localeDropdown',
          position: 'right'
        }
      ],
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['java', 'groovy', 'yaml'], // 添加你需要的语言支持
      magicComments: [
        {
          className: 'theme-code-block-highlighted-line',
          line: 'highlight-next-line',
          block: { start: 'highlight-start', end: 'highlight-end' },
        },
        {
          className: 'code-block-error-line',
          line: 'This will error',
        },
      ],
    },
    giscus: {
      repo: 'AlexRITIAN/alexritian.github.io',
      repoId: 'R_kgDOGl6flg',
      category: 'General',
      categoryId: 'DIC_kwDOGl6fls4Cf37N',
      theme: 'light',
      darkTheme: 'dark_dimmed',
    } satisfies Partial<GiscusConfig>,
    colorMode: {
      defaultMode: 'dark', // 设置默认模式为 Dark 模式
      disableSwitch: true, // 禁用模式切换
      respectPrefersColorScheme: false, // 不尊重用户系统的颜色模式
    },
    font: {
      bodyFontFamily: ["JetBrains Mono", "LXGW WenKai Mono"],
      headerFontFamily: ["JetBrains Mono", "LXGW WenKai Mono"],
    },
    metadata: [
      {
        name: 'description', content: 'this is Too_Young website, Moonlit'
      },
      {
        name: 'keywords', content: 'spring, springboot, too_young, moonlit, gradle, jooq, zsh'
      },
    ]
  } satisfies Preset.ThemeConfig,
  plugins: [
    // require.resolve("@cmfcmf/docusaurus-search-local"),
    'plugin-image-zoom'
  ],
};

export default config;
