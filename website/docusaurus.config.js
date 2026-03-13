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
  tagline: 'Modern TypeScript SDK for the Ceph RGW Admin Ops API',
  url,
  baseUrl,
  organizationName: orgName,
  projectName,
  favicon: 'img/favicon.svg',
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
  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      colorMode: {
        defaultMode: 'dark',
        respectPrefersColorScheme: true,
      },

      announcementBar: {
        id: 'star_repo',
        content:
          '⭐ If you find radosgw-admin useful, <a href="https://github.com/nycanshu/radosgw-admin" target="_blank">star it on GitHub</a>',
        backgroundColor: 'transparent',
        isCloseable: true,
      },

      navbar: {
        title: 'radosgw-admin',
        hideOnScroll: false,
        items: [
          {
            type: 'doc',
            docId: 'getting-started',
            label: 'Docs',
            position: 'left',
          },
          {
            type: 'doc',
            docId: 'modules',
            label: 'Modules',
            position: 'left',
          },
          {
            to: '/docs/api',
            label: 'API',
            position: 'left',
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
