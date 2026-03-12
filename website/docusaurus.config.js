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
          routeBasePath: '/',
          sidebarPath: require.resolve('./sidebars.js'),
        },
        blog: false,
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
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
            to: '/api',
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
              { label: 'Getting Started', to: '/getting-started' },
              { label: 'Configuration', to: '/configuration' },
              { label: 'Error Handling', to: '/error-handling' },
              { label: 'Recipes', to: '/recipes' },
            ],
          },
          {
            title: 'Modules',
            items: [
              { label: 'Users', to: '/guides/users' },
              { label: 'Keys', to: '/guides/keys' },
              { label: 'Subusers', to: '/guides/subusers' },
              { label: 'Buckets', to: '/guides/buckets' },
              { label: 'Quota', to: '/guides/quota' },
              { label: 'Rate Limits', to: '/guides/ratelimit' },
              { label: 'Usage', to: '/guides/usage' },
              { label: 'Info', to: '/guides/info' },
              { label: 'API Reference', to: '/api' },
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
