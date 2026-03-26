// @ts-check

const repo = process.env.GITHUB_REPOSITORY ?? 'nycanshu/radosgw-admin';
const [defaultOrgName, defaultProjectName] = repo.split('/');
const orgName = process.env.DOCS_ORG ?? defaultOrgName ?? 'nycanshu';
const projectName = process.env.DOCS_PROJECT ?? defaultProjectName ?? 'radosgw-admin';
const customDomain = process.env.DOCS_DOMAIN;
const url = customDomain ? `https://${customDomain}` : `https://${orgName}.github.io`;
const baseUrl = customDomain ? '/' : `/${projectName}/`;

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'radosgw-admin',
  headTags: [],
  plugins: [
    [
      '@docusaurus/plugin-pwa',
      {
        debug: false,
        offlineModeActivationStrategies: ['appInstalled', 'standalone', 'queryString', 'always'],
        pwaHead: [
          { tagName: 'link', rel: 'manifest', href: '/radosgw-admin/manifest.json' },
          { tagName: 'meta', name: 'theme-color', content: '#7c5bf0' },
          { tagName: 'link', rel: 'apple-touch-icon', href: '/radosgw-admin/img/icons/apple-touch.png' },
        ],
      },
    ],
  ],
  tagline: 'Node.js SDK for the Ceph RADOS Gateway Admin Ops API',
  url,
  baseUrl,
  organizationName: orgName,
  projectName,
  favicon: 'img/mascot/nav-light.webp',
  trailingSlash: false,
  onBrokenLinks: 'throw',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },
  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath: '/docs',
          sidebarPath: require.resolve('./sidebars.js'),
        },
        blog: false,
        theme: {
          customCss: [
            require.resolve('./src/css/custom.css'),
            require.resolve('./src/css/landing.css'),
          ],
        },
      }),
    ],
  ],
  themes: [
    ['@easyops-cn/docusaurus-search-local', {
      hashed: true,
      indexDocs: true,
      indexPages: false,
      language: ['en'],
      highlightSearchTermsOnTargetPage: true,
    }],
  ],
  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      metadata: [
        { name: 'keywords', content: 'ceph, radosgw, rados gateway, rgw admin, rgw admin ops, ceph admin api, rook-ceph, openshift data foundation, odf, node.js, sdk, bucket management, user management, quota, rate limit, kubernetes storage' },
        { name: 'author', content: 'nycanshu' },
        { property: 'og:site_name', content: 'radosgw-admin' },
      ],

      tableOfContents: {
        minHeadingLevel: 2,
        maxHeadingLevel: 4,
      },

      colorMode: {
        defaultMode: 'dark',
        respectPrefersColorScheme: true,
      },

      announcementBar: {
        id: 'star_repo',
        content:
          'If you find radosgw-admin useful, <a href="https://github.com/nycanshu/radosgw-admin" target="_blank">give it a star on GitHub</a>',
        isCloseable: true,
      },

      navbar: {
        title: 'radosgw-admin',
        logo: {
          alt: 'radosgw-admin mascot',
          src: 'img/mascot/nav-light.webp',
          srcDark: 'img/mascot/nav-dark.webp',
          height: 36,
          width: 36,
          style: { objectFit: 'contain' },
        },
        hideOnScroll: false,
        items: [
          {
            type: 'dropdown',
            label: 'Docs',
            position: 'left',
            items: [
              { type: 'doc', docId: 'getting-started', label: 'Getting Started' },
              { type: 'doc', docId: 'configuration', label: 'Configuration' },
              { type: 'doc', docId: 'error-handling', label: 'Error Handling' },
              { type: 'doc', docId: 'recipes', label: 'Recipes' },
            ],
          },
          {
            type: 'dropdown',
            label: 'Modules',
            position: 'left',
            items: [
              { type: 'doc', docId: 'guides/users', label: 'Users' },
              { type: 'doc', docId: 'guides/keys', label: 'Keys' },
              { type: 'doc', docId: 'guides/subusers', label: 'Subusers' },
              { type: 'doc', docId: 'guides/buckets', label: 'Buckets' },
              { type: 'doc', docId: 'guides/quota', label: 'Quota' },
              { type: 'doc', docId: 'guides/ratelimit', label: 'Rate Limits' },
              { type: 'doc', docId: 'guides/usage', label: 'Usage' },
              { type: 'doc', docId: 'guides/info', label: 'Info' },
            ],
          },
          {
            to: '/docs/api',
            label: 'API',
            position: 'left',
          },
          {
            type: 'search',
            position: 'right',
          },
          {
            href: 'https://github.com/nycanshu/radosgw-admin',
            position: 'right',
            className: 'header-github-link',
            'aria-label': 'GitHub repository',
            label: 'GitHub',
          },
          {
            href: 'https://www.npmjs.com/package/radosgw-admin',
            position: 'right',
            label: 'npm',
            className: 'header-npm-link',
          },
        ],
      },

      footer: {
        style: 'dark',
        links: [
          {
            title: 'Documentation',
            items: [
              { label: 'Getting Started', to: '/docs/getting-started' },
              { label: 'Configuration', to: '/docs/configuration' },
              { label: 'Error Handling', to: '/docs/error-handling' },
              { label: 'Recipes', to: '/docs/recipes' },
            ],
          },
          {
            title: 'Modules',
            items: [
              { label: 'Users', to: '/docs/guides/users' },
              { label: 'Keys', to: '/docs/guides/keys' },
              { label: 'Subusers', to: '/docs/guides/subusers' },
              { label: 'Buckets', to: '/docs/guides/buckets' },
              { label: 'Quota', to: '/docs/guides/quota' },
            ],
          },
          {
            title: 'More Modules',
            items: [
              { label: 'Rate Limits', to: '/docs/guides/ratelimit' },
              { label: 'Usage', to: '/docs/guides/usage' },
              { label: 'Info', to: '/docs/guides/info' },
              { label: 'API Reference', to: '/docs/api' },
            ],
          },
          {
            title: 'Project',
            items: [
              {
                label: 'GitHub',
                href: 'https://github.com/nycanshu/radosgw-admin',
              },
              {
                label: 'npm',
                href: 'https://www.npmjs.com/package/radosgw-admin',
              },
              {
                label: 'Issues',
                href: 'https://github.com/nycanshu/radosgw-admin/issues',
              },
              {
                label: 'Changelog',
                href: 'https://github.com/nycanshu/radosgw-admin/releases',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} radosgw-admin · Apache-2.0 License`,
      },

      prism: {
        theme: require('prism-react-renderer').themes.github,
        darkTheme: require('prism-react-renderer').themes.oneDark,
        additionalLanguages: ['bash', 'json'],
      },
    }),
};

module.exports = config;
