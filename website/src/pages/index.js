import React, { useState, useCallback } from 'react';
import Layout from '@theme/Layout';
import Head from '@docusaurus/Head';
import CodeBlock from '@theme/CodeBlock';
import useBaseUrl from '@docusaurus/useBaseUrl';

const features = [
  {
    icon: '🔒',
    title: 'Zero Dependencies',
    desc: 'No runtime deps. Just node:crypto for AWS SigV4 signing. Minimal attack surface, minimal bundle.',
  },
  {
    icon: '⚡',
    title: 'Full TypeScript',
    desc: 'Strict types everywhere — no any. Autocomplete every method, param, and response field.',
  },
  {
    icon: '📦',
    title: 'ESM + CJS',
    desc: 'Dual build with proper exports map. Works in Node.js, Bun, and bundlers out of the box.',
  },
  {
    icon: '🛡️',
    title: 'Typed Errors',
    desc: 'Catch RGWNotFoundError, RGWAuthError, RGWConflictError — not generic HTTP status codes.',
  },
  {
    icon: '🔄',
    title: 'Auto Case Transform',
    desc: 'Send camelCase, receive camelCase. The SDK handles snake_case conversion to/from RGW.',
  },
  {
    icon: '✅',
    title: 'Input Validation',
    desc: 'Validates params before hitting the network. Fail fast with clear error messages.',
  },
];

const modules = [
  { name: 'users', ops: 'create, get, modify, delete, list, suspend, enable' },
  { name: 'keys', ops: 'generate, revoke' },
  { name: 'subusers', ops: 'create, modify, remove' },
  { name: 'buckets', ops: 'list, getInfo, delete, transferOwnership, verifyIndex' },
  { name: 'quota', ops: 'getUserQuota, setUserQuota, getBucketQuota, setBucketQuota' },
  { name: 'rateLimit', ops: 'getUserLimit, setUserLimit, getBucketLimit, getGlobal' },
  { name: 'usage', ops: 'get, trim' },
  { name: 'info', ops: 'get (cluster FSID & backends)' },
];

const stats = [
  { value: '8', label: 'Modules' },
  { value: '45+', label: 'Methods' },
  { value: '0', label: 'Dependencies' },
  { value: '280+', label: 'Tests' },
];

const quickExample = `import { RadosGWAdminClient } from 'radosgw-admin';

const rgw = new RadosGWAdminClient({
  host: 'https://ceph-rgw.example.com',
  accessKey: process.env.RGW_ACCESS_KEY,
  secretKey: process.env.RGW_SECRET_KEY,
});

// Create a user
const user = await rgw.users.create({
  uid: 'alice',
  displayName: 'Alice',
});

// Set a 10 GB quota
await rgw.quota.setUserQuota({
  uid: 'alice',
  maxSize: '10G',
  maxObjects: 50000,
  enabled: true,
});

// List all buckets
const buckets = await rgw.buckets.list();`;

function CopyInstall() {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText('npm install radosgw-admin');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const clipboardIcon = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );

  const checkIcon = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );

  return (
    <button
      className={`hero-install ${copied ? 'hero-install--copied' : ''}`}
      onClick={handleCopy}
      type="button"
      aria-label="Copy install command"
    >
      <span className="hero-install-prompt">$</span>
      <span className="hero-install-text">npm install radosgw-admin</span>
      <span className="hero-install-icon">
        {copied ? checkIcon : clipboardIcon}
      </span>
    </button>
  );
}

export default function Home() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareSourceCode',
    name: 'radosgw-admin',
    description: 'Modern TypeScript SDK for the Ceph RADOS Gateway Admin Ops REST API. Zero dependencies, full type safety, ESM + CJS.',
    codeRepository: 'https://github.com/nycanshu/radosgw-admin',
    programmingLanguage: ['TypeScript', 'JavaScript'],
    runtimePlatform: 'Node.js',
    license: 'https://opensource.org/licenses/Apache-2.0',
    author: {
      '@type': 'Person',
      name: 'nycanshu',
      url: 'https://github.com/nycanshu',
    },
  };

  return (
    <Layout
      title="Modern TypeScript SDK for Ceph RGW Admin"
      description="Zero-dependency TypeScript client for the Ceph RADOS Gateway Admin Ops REST API. Manage users, buckets, quotas, rate limits with full type safety."
    >
      <Head>
        <meta name="keywords" content="ceph, radosgw, rados gateway, rgw admin, s3, object storage, typescript, sdk, ceph admin api, bucket management, rook ceph, openshift data foundation" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="radosgw-admin — TypeScript SDK for Ceph RGW" />
        <meta property="og:description" content="Zero-dependency TypeScript client for the Ceph RADOS Gateway Admin Ops REST API. 8 modules, 45+ methods, full type safety." />
        <meta property="og:image" content="https://nycanshu.github.io/radosgw-admin/img/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="radosgw-admin — TypeScript SDK for Ceph RGW" />
        <meta name="twitter:description" content="Zero-dependency TypeScript client for the Ceph RADOS Gateway Admin Ops REST API." />
        <link rel="canonical" href="https://nycanshu.github.io/radosgw-admin/" />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Head>
      {/* ─── HERO ─── */}
      <header className="hero-section">
        <div className="hero-glow" />
        <div className="hero-grid" />
        <div className="hero-content">
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            Open Source &middot; Apache-2.0
          </div>
          <h1 className="hero-title">
            The modern SDK for<br />
            <span className="hero-gradient-text">Ceph Object Storage</span>
          </h1>
          <p className="hero-subtitle">
            A zero-dependency TypeScript client for the Ceph RADOS Gateway Admin Ops API.
            <br />
            Manage users, buckets, quotas, and more — with full type safety.
          </p>
          <CopyInstall />
          <div className="hero-actions">
            <a href={useBaseUrl('/docs/getting-started')} className="hero-btn hero-btn-primary">
              Get Started
            </a>
            <a
              href="https://github.com/nycanshu/radosgw-admin"
              className="hero-btn hero-btn-secondary"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          </div>
        </div>
      </header>

      {/* ─── STATS ─── */}
      <section className="stats-section">
        <div className="stats-grid">
          {stats.map((s) => (
            <div key={s.label} className="stat-card">
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section className="features-section">
        <div className="section-container">
          <h2 className="section-title">Built for production</h2>
          <p className="section-subtitle">
            Everything you need to manage Ceph RGW at scale, nothing you don't.
          </p>
          <div className="features-grid">
            {features.map((f) => (
              <div key={f.title} className="feature-card">
                <div className="feature-icon">{f.icon}</div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CODE EXAMPLE ─── */}
      <section className="code-section">
        <div className="section-container code-layout">
          <div className="code-text">
            <h2 className="section-title">Simple, intuitive API</h2>
            <p className="section-subtitle">
              Every module follows the same pattern. Autocomplete guides you through
              every method and parameter.
            </p>
            <div className="code-highlights">
              <div className="code-highlight-item">
                <span className="code-highlight-dot" style={{ background: '#2dd4bf' }} />
                Typed inputs and outputs
              </div>
              <div className="code-highlight-item">
                <span className="code-highlight-dot" style={{ background: '#818cf8' }} />
                Human-readable sizes ("10G", "500M")
              </div>
              <div className="code-highlight-item">
                <span className="code-highlight-dot" style={{ background: '#f472b6' }} />
                Validation before network calls
              </div>
            </div>
          </div>
          <div className="code-block-wrapper">
            <CodeBlock language="typescript" title="example.ts">
              {quickExample}
            </CodeBlock>
          </div>
        </div>
      </section>

      {/* ─── MODULES ─── */}
      <section className="modules-section">
        <div className="section-container">
          <h2 className="section-title">Full API coverage</h2>
          <p className="section-subtitle">
            8 modules covering every RGW Admin Ops endpoint.
          </p>
          <div className="modules-grid">
            {modules.map((m) => (
              <a
                key={m.name}
                href={useBaseUrl(`/docs/guides/${m.name === 'rateLimit' ? 'ratelimit' : m.name}`)}
                className="module-card"
              >
                <div className="module-name">rgw.{m.name}</div>
                <div className="module-ops">{m.ops}</div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ─── COMPATIBILITY ─── */}
      <section className="compat-section">
        <div className="section-container">
          <h2 className="section-title">Works everywhere</h2>
          <div className="compat-grid">
            <div className="compat-card">
              <div className="compat-label">Runtime</div>
              <div className="compat-items">Node.js 18+ &middot; Bun</div>
            </div>
            <div className="compat-card">
              <div className="compat-label">Format</div>
              <div className="compat-items">ESM &middot; CommonJS</div>
            </div>
            <div className="compat-card">
              <div className="compat-label">Ceph</div>
              <div className="compat-items">Pacific+ &middot; Squid &middot; Reef</div>
            </div>
            <div className="compat-card">
              <div className="compat-label">Platform</div>
              <div className="compat-items">Rook &middot; ODF &middot; Bare metal</div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="cta-section">
        <div className="cta-glow" />
        <div className="section-container cta-container">
          <h2 className="cta-title">Ready to get started?</h2>
          <p className="cta-subtitle">
            Install in seconds. Ship your first RGW integration in minutes.
          </p>
          <div className="hero-actions">
            <a href={useBaseUrl('/docs/getting-started')} className="hero-btn hero-btn-primary">
              Read the Docs
            </a>
            <a
              href="https://www.npmjs.com/package/radosgw-admin"
              className="hero-btn hero-btn-secondary"
              target="_blank"
              rel="noopener noreferrer"
            >
              View on npm
            </a>
          </div>
        </div>
      </section>
    </Layout>
  );
}
