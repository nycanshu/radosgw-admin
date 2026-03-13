import { useState, useCallback, useEffect, useRef } from 'react';
import Layout from '@theme/Layout';
import Head from '@docusaurus/Head';
import CodeBlock from '@theme/CodeBlock';
import useBaseUrl from '@docusaurus/useBaseUrl';

/* ── Hooks ──────────────────────────────────────────────────────────────── */

/** Fires `callback` once when `ref` element enters the viewport */
function useInView(ref, options = {}) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        observer.disconnect();
      }
    }, { threshold: 0.15, ...options });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return inView;
}

/** Counts from 0 → target when `active` becomes true */
function useCounter(target, active, duration = 1200) {
  const [display, setDisplay] = useState('0');
  useEffect(() => {
    if (!active) return;
    const numeric = parseInt(target.replace(/\D/g, ''), 10);
    const suffix = target.replace(/[0-9]/g, '');
    if (numeric === 0) { setDisplay('0' + suffix); return; }
    let start;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.floor(eased * numeric) + suffix);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [active]);
  return display;
}

/* ── Data ───────────────────────────────────────────────────────────────── */

const features = [
  {
    icon: '⬡',
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
  { name: 'users',     ops: 'create, get, modify, delete, list, suspend, enable' },
  { name: 'keys',      ops: 'generate, revoke' },
  { name: 'subusers',  ops: 'create, modify, remove' },
  { name: 'buckets',   ops: 'list, getInfo, delete, transferOwnership, verifyIndex' },
  { name: 'quota',     ops: 'getUserQuota, setUserQuota, getBucketQuota, setBucketQuota' },
  { name: 'rateLimit', ops: 'getUserLimit, setUserLimit, getBucketLimit, getGlobal' },
  { name: 'usage',     ops: 'get, trim' },
  { name: 'info',      ops: 'get (cluster FSID & backends)' },
];

const stats = [
  { value: '8',    label: 'Modules' },
  { value: '45+',  label: 'Methods' },
  { value: '0',    label: 'Dependencies' },
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

/* ── Components ─────────────────────────────────────────────────────────── */

function CopyInstall() {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText('npm install radosgw-admin');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const clipboardIcon = (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );

  const checkIcon = (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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

function StatCard({ value, label }) {
  const ref = useRef(null);
  const inView = useInView(ref);
  const display = useCounter(value, inView);
  return (
    <div ref={ref} className="stat-card">
      <div className="stat-value">{display}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function AnimatedSection({ className, children, delay = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref);
  return (
    <div
      ref={ref}
      className={`${className} scroll-reveal ${inView ? 'is-visible' : ''}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────────────── */

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
      description="Zero-dependency TypeScript client for the Ceph RADOS Gateway Admin Ops REST API. Manage users, buckets, quotas, and more — with full type safety."
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

      {/* ─── HERO ──────────────────────────────────────────────────────── */}
      <header className="hero-section">
        <div className="hero-glow" />
        <div className="hero-glow hero-glow--secondary" />
        <div className="hero-grid" />
        {/* Floating orbs */}
        <div className="hero-orb hero-orb--1" />
        <div className="hero-orb hero-orb--2" />
        <div className="hero-orb hero-orb--3" />
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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '6px' }}>
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              GitHub
            </a>
          </div>
        </div>
      </header>

      {/* ─── STATS ─────────────────────────────────────────────────────── */}
      <section className="stats-section">
        <div className="stats-grid">
          {stats.map((s) => (
            <StatCard key={s.label} value={s.value} label={s.label} />
          ))}
        </div>
      </section>

      {/* ─── FEATURES ──────────────────────────────────────────────────── */}
      <section className="features-section">
        <div className="section-container">
          <AnimatedSection className="">
            <h2 className="section-title">Built for production</h2>
            <p className="section-subtitle">
              Everything you need to manage Ceph RGW at scale, nothing you don't.
            </p>
          </AnimatedSection>
          <div className="features-grid">
            {features.map((f, i) => (
              <AnimatedSection key={f.title} className="feature-card" delay={i * 80}>
                <div className="feature-icon">{f.icon}</div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CODE EXAMPLE ──────────────────────────────────────────────── */}
      <section className="code-section">
        <div className="section-container code-layout">
          <AnimatedSection className="code-text">
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
          </AnimatedSection>
          <AnimatedSection className="code-block-wrapper" delay={150}>
            <CodeBlock language="typescript" title="example.ts">
              {quickExample}
            </CodeBlock>
          </AnimatedSection>
        </div>
      </section>

      {/* ─── MODULES ───────────────────────────────────────────────────── */}
      <section className="modules-section">
        <div className="section-container">
          <AnimatedSection className="">
            <h2 className="section-title">Full API coverage</h2>
            <p className="section-subtitle">
              8 modules covering every RGW Admin Ops endpoint.
            </p>
          </AnimatedSection>
          <div className="modules-grid">
            {modules.map((m, i) => (
              <AnimatedSection key={m.name} className="" delay={i * 60}>
                <a
                  href={useBaseUrl(`/docs/guides/${m.name === 'rateLimit' ? 'ratelimit' : m.name}`)}
                  className="module-card"
                >
                  <div className="module-name">rgw.{m.name}</div>
                  <div className="module-ops">{m.ops}</div>
                </a>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── COMPATIBILITY ─────────────────────────────────────────────── */}
      <section className="compat-section">
        <div className="section-container">
          <AnimatedSection className="">
            <h2 className="section-title">Works everywhere</h2>
          </AnimatedSection>
          <div className="compat-grid">
            {[
              { label: 'Runtime',  items: 'Node.js 18+ · Bun' },
              { label: 'Format',   items: 'ESM · CommonJS' },
              { label: 'Ceph',     items: 'Pacific+ · Squid · Reef' },
              { label: 'Platform', items: 'Rook · ODF · Bare metal' },
            ].map((c, i) => (
              <AnimatedSection key={c.label} className="compat-card" delay={i * 80}>
                <div className="compat-label">{c.label}</div>
                <div className="compat-items">{c.items}</div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ───────────────────────────────────────────────────────── */}
      <section className="cta-section">
        <div className="cta-glow" />
        <div className="section-container cta-container">
          <AnimatedSection className="">
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
          </AnimatedSection>
        </div>
      </section>
    </Layout>
  );
}
