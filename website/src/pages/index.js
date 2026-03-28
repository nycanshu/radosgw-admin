import { useState, useCallback, useEffect, useRef } from 'react';
import Layout from '@theme/Layout';
import Head from '@docusaurus/Head';
import CodeBlock from '@theme/CodeBlock';
import useBaseUrl from '@docusaurus/useBaseUrl';
import { useColorMode } from '@docusaurus/theme-common';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

/* ── Hooks ──────────────────────────────────────────────────────────────── */

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

const stats = [
  { value: '8',    label: 'Modules' },
  { value: '40+',  label: 'Methods' },
  { value: '0',    label: 'Transitive Deps' },
  { value: '324+', label: 'Tests' },
];

const techStack = [
  { name: 'Ceph Pacific+',  img: '/img/logos/ceph.svg' },
  { name: 'Rook',           img: '/img/logos/rook.svg' },
  { name: 'Kubernetes',     img: '/img/logos/kubernetes.svg' },
  { name: 'OpenShift / ODF', img: '/img/logos/openshift.svg' },
  { name: 'Node.js 18+',   img: '/img/logos/nodejs.svg' },
  { name: 'Bun',            img: '/img/logos/bun.svg' },
  { name: 'TypeScript',     img: '/img/logos/typescript.svg' },
];

const featureBlocks = [
  {
    title: 'No Dependency Hell',
    desc: "SigV4 signing uses only the built-in node:crypto module. The single runtime dep is undici — Node.js's own HTTP client, maintained by the Node.js core team, with zero transitive deps. Install radosgw-admin, get one extra package.",
    code: `import { RadosGWAdminClient } from 'radosgw-admin';

const rgw = new RadosGWAdminClient({
  host: 'https://rgw.example.com',
  accessKey: process.env.RGW_ACCESS_KEY,
  secretKey: process.env.RGW_SECRET_KEY,
});

// Create a user in one call
const user = await rgw.users.create({
  uid: 'alice',
  displayName: 'Alice',
});`,
    highlights: [
      { color: '#a78bfa', text: 'Built-in node:crypto for signing' },
      { color: '#6d4de6', text: '0 transitive dependencies' },
      { color: '#8b5cf6', text: 'No aws-sdk, no axios, no node-fetch' },
    ],
  },
  {
    title: 'Typed Errors That Help',
    desc: 'Catch specific error classes with real Ceph error codes. No more parsing error strings or guessing what HTTP 404 means.',
    code: `import { RGWNotFoundError, RGWRateLimitError }
  from 'radosgw-admin';

try {
  await rgw.users.get({ uid: 'alice' });
} catch (err) {
  if (err instanceof RGWNotFoundError) {
    console.log(err.code);   // 'NoSuchUser'
    console.log(err.status); // 404
  }
  if (err instanceof RGWRateLimitError) {
    // Automatically retried with backoff
  }
}`,
    highlights: [
      { color: '#a78bfa', text: '6 specific error classes' },
      { color: '#6d4de6', text: 'Automatic retry on 429 & 5xx' },
      { color: '#8b5cf6', text: 'Typed code field on every error' },
    ],
  },
  {
    title: 'Observe Everything',
    desc: 'Add logging, Prometheus metrics, or audit trails via request hooks. No monkey-patching, no middleware \u2014 just callbacks.',
    code: `const rgw = new RadosGWAdminClient({
  host: 'https://rgw.example.com',
  accessKey: '...',
  secretKey: '...',
  onBeforeRequest: (ctx) => {
    console.log(\`\${ctx.method} \${ctx.path}\`);
  },
  onAfterResponse: (ctx) => {
    histogram.observe(ctx.duration);
  },
});`,
    highlights: [
      { color: '#a78bfa', text: 'onBeforeRequest / onAfterResponse' },
      { color: '#6d4de6', text: 'Hook errors never break requests' },
      { color: '#8b5cf6', text: 'Works across all 8 modules' },
    ],
  },
];

const modules = [
  { name: 'users',     ops: 'create, get, modify, delete, list, suspend, enable, getByAccessKey, getStats' },
  { name: 'keys',      ops: 'generate, revoke' },
  { name: 'subusers',  ops: 'create, modify, remove' },
  { name: 'buckets',   ops: 'list, listByUser, getInfo, delete, transferOwnership, removeOwnership, verifyIndex' },
  { name: 'quota',     ops: 'getUserQuota, setUserQuota, enableUserQuota, disableUserQuota, getBucketQuota, setBucketQuota, enableBucketQuota, disableBucketQuota' },
  { name: 'rateLimit', ops: 'getUserLimit, setUserLimit, disableUserLimit, getBucketLimit, setBucketLimit, disableBucketLimit, getGlobal, setGlobal' },
  { name: 'usage',     ops: 'get, trim' },
  { name: 'info',      ops: 'get (cluster FSID & backends)' },
];

const faqItems = [
  {
    q: 'What is the Ceph RADOS Gateway Admin Ops API?',
    a: 'The Ceph RADOS Gateway (RGW) Admin Ops API is a REST interface built into Ceph that lets administrators manage users, access keys, buckets, quotas, and rate limits programmatically. It is separate from the S3-compatible data API \u2014 it is specifically for cluster administration.',
  },
  {
    q: 'How do I manage Ceph RGW users from Node.js?',
    a: 'Install radosgw-admin (npm install radosgw-admin), create a RadosGWAdminClient with your RGW host and admin credentials, then call rgw.users.create(), rgw.users.get(), rgw.users.suspend(), and other methods. The SDK covers the full user lifecycle.',
  },
  {
    q: 'Does radosgw-admin work with Rook-Ceph?',
    a: 'Yes. radosgw-admin works with any Ceph RGW instance including Rook-Ceph on Kubernetes. Point the host to your RGW service endpoint (e.g. http://rook-ceph-rgw-my-store.rook-ceph.svc) and provide admin credentials from the Kubernetes secret.',
  },
  {
    q: 'Does it work with OpenShift Data Foundation (ODF)?',
    a: 'Yes. OpenShift Data Foundation uses Ceph RGW internally. radosgw-admin connects to the ODF RGW endpoint the same way as any other Ceph cluster.',
  },
  {
    q: 'Does it have any third-party dependencies?',
    a: 'Just one: undici — the HTTP client library maintained by the Node.js core team and used internally by Node.js itself for its built-in fetch. It has zero transitive dependencies. SigV4 signing still uses only the built-in node:crypto module.',
  },
  {
    q: 'What Node.js version is required?',
    a: 'Node.js 18 or later. The SDK uses native fetch and node:crypto which are stable from Node.js 18 onwards. It also works with Bun.',
  },
  {
    q: 'Which package managers are supported?',
    a: 'All of them \u2014 npm, yarn, pnpm, and bun. Install with: npm install radosgw-admin, yarn add radosgw-admin, pnpm add radosgw-admin, or bun add radosgw-admin.',
  },
];

/* ── Components ─────────────────────────────────────────────────────────── */

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

function CopyInstall() {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText('npm install radosgw-admin');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

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
        {copied ? (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        )}
      </span>
    </button>
  );
}

function StatPill({ value, label }) {
  const ref = useRef(null);
  const inView = useInView(ref);
  const display = useCounter(value, inView);
  return (
    <div ref={ref} className="stat-pill">
      <span className="stat-pill-value">{display}</span>
      <span className="stat-pill-label">{label}</span>
    </div>
  );
}

function FeatureBlock({ feature, index }) {
  const isReversed = index % 2 === 1;
  return (
    <AnimatedSection className={`feature-block ${isReversed ? 'feature-block--reversed' : ''}`}>
      <div className="feature-block-text">
        <h3 className="feature-block-title">{feature.title}</h3>
        <p className="feature-block-desc">{feature.desc}</p>
        <div className="feature-block-highlights">
          {feature.highlights.map((h) => (
            <div key={h.text} className="feature-block-highlight">
              <span className="feature-block-dot" style={{ background: h.color }} />
              {h.text}
            </div>
          ))}
        </div>
      </div>
      <div className="feature-block-code">
        <CodeBlock language="typescript">
          {feature.code}
        </CodeBlock>
      </div>
    </AnimatedSection>
  );
}

function ModuleRow({ mod, index }) {
  const href = useBaseUrl(`/docs/guides/${mod.name === 'rateLimit' ? 'ratelimit' : mod.name}`);
  const methods = mod.ops.split(', ');
  return (
    <AnimatedSection className="" delay={index * 50}>
      <a href={href} className="module-row">
        <div className="module-row-name">rgw.{mod.name}</div>
        <div className="module-row-methods">
          {methods.map((m) => (
            <span key={m} className="module-method-chip">{m}</span>
          ))}
        </div>
      </a>
    </AnimatedSection>
  );
}

function FAQItem({ item, isOpen, onToggle }) {
  return (
    <div className={`faq-item ${isOpen ? 'faq-item--open' : ''}`}>
      <button className="faq-trigger" onClick={onToggle} type="button" aria-expanded={isOpen}>
        <span>{item.q}</span>
        <svg className="faq-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      <div className="faq-answer-wrap">
        <p className="faq-answer">{item.a}</p>
      </div>
    </div>
  );
}

function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState(-1);
  return (
    <div className="faq-list">
      {faqItems.map((item, i) => (
        <AnimatedSection key={item.q} className="" delay={i * 60}>
          <FAQItem
            item={item}
            isOpen={openIndex === i}
            onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
          />
        </AnimatedSection>
      ))}
    </div>
  );
}

function HeroIllustration() {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const webpSrc    = useBaseUrl(isDark ? '/img/hero/dark.webp'     : '/img/hero/light.webp');
  const webpSrc800 = useBaseUrl(isDark ? '/img/hero/dark-800.webp' : '/img/hero/light-800.webp');
  const jpgSrc     = useBaseUrl(isDark ? '/img/hero/dark.jpg'      : '/img/hero/light.jpg');
  return (
    <div className="hero-illustration-wrap">
      <picture>
        <source
          srcSet={`${webpSrc800} 800w, ${webpSrc} 1392w`}
          sizes="(max-width: 996px) 100vw, 1392px"
          type="image/webp"
        />
        <img
          src={jpgSrc}
          alt="radosgw-admin — Ceph RGW admin operations illustrated"
          className="hero-illustration"
          width="1392"
          height="459"
          fetchPriority="high"
        />
      </picture>
    </div>
  );
}

function TechPill({ tech, delay }) {
  const src = useBaseUrl(tech.img);
  return (
    <AnimatedSection className="works-with-pill" delay={delay}>
      <img src={src} alt={tech.name} className="works-with-img" loading="lazy" height="18" width="18" />
      {tech.name}
    </AnimatedSection>
  );
}

function Squiggle() {
  return (
    <svg
      className="hero-squiggle"
      viewBox="0 0 230 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2 9 Q30 2 58 9 Q86 16 114 9 Q142 2 170 9 Q198 16 228 9"
        stroke="url(#squiggle-grad)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <defs>
        <linearGradient id="squiggle-grad" x1="0" y1="0" x2="230" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#7c5bf0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ── Page ───────────────────────────────────────────────────────────────── */

export default function Home() {
  const { siteConfig } = useDocusaurusContext();
  const siteUrl = siteConfig.url;
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareSourceCode',
    name: 'radosgw-admin',
    description: 'Node.js SDK for the Ceph RADOS Gateway Admin Ops API. Manage users, buckets, quotas, rate limits and access keys \u2014 8 modules, 40+ methods, full TypeScript.',
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
      title="radosgw-admin — Node.js SDK for Ceph RADOS Gateway Admin Ops"
      description="Node.js SDK for the Ceph RADOS Gateway Admin Ops API. Manage users, buckets, quotas, rate limits programmatically. TypeScript, ESM + CJS, Rook-Ceph ready."
    >
      <Head>
        <meta name="keywords" content="ceph, radosgw, rados gateway, rgw admin, rgw admin ops, ceph admin api, s3, object storage, rook ceph, openshift data foundation, node.js, typescript, sdk, bucket management, user management, quota, rate limit" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="radosgw-admin — Node.js SDK for Ceph RADOS Gateway Admin Ops" />
        <meta property="og:description" content="Manage Ceph RGW users, buckets, quotas, rate limits and access keys from Node.js. 8 modules, 40+ methods, full TypeScript." />
        <meta property="og:image" content={`${siteUrl}/img/og-image.png`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="radosgw-admin — Node.js SDK for Ceph RADOS Gateway Admin Ops" />
        <meta name="twitter:description" content="Node.js SDK for the Ceph RADOS Gateway Admin Ops API. Full TypeScript, works with Rook-Ceph and ODF." />
        <meta name="twitter:image" content={`${siteUrl}/img/og-image.png`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <link rel="canonical" href={`${siteUrl}/`} />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqItems.map(f => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
          })),
        })}</script>
      </Head>

      {/* ─── HERO ──────────────────────────────────────────────────────── */}
      <header className="hero-section">
        <div className="hero-glow" />
        <div className="hero-glow hero-glow--secondary" />
        <div className="hero-grid" />
        <div className="hero-orb hero-orb--1" />
        <div className="hero-orb hero-orb--2" />
        <div className="hero-orb hero-orb--3" />

        <div className="hero-badge">
          <span className="hero-badge-dot" />
          Open Source &middot; Apache-2.0
        </div>

        <HeroIllustration />

        <div className="hero-inner">
          <div className="hero-content">
            <h1 className="hero-title">
              Ceph Admin Ops.{' '}
              <span className="hero-emphasis">
                Effortlessly.
                <Squiggle />
              </span>
            </h1>
            <p className="hero-subtitle">
              The Node.js SDK that covers every RADOS Gateway Admin endpoint.
              No transitive deps. Full TypeScript.
            </p>

            <div className="hero-stats">
              {stats.map(s => (
                <StatPill key={s.label} value={s.value} label={s.label} />
              ))}
            </div>

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
                aria-label="View on GitHub (opens in new tab)"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '6px' }}>
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                GitHub
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* ─── MAIN CONTENT ──────────────────────────────────────────────── */}
      <main>

      {/* ─── WORKS WITH ────────────────────────────────────────────────── */}
      <section className="works-with-section">
        <div className="section-container">
          <AnimatedSection className="">
            <p className="works-with-label">Works with your stack</p>
          </AnimatedSection>
          <div className="works-with-row">
            {techStack.map((tech, i) => (
              <TechPill key={tech.name} tech={tech} delay={i * 50} />
            ))}
          </div>
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
          {featureBlocks.map((f, i) => (
            <FeatureBlock key={f.title} feature={f} index={i} />
          ))}
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
          <div className="modules-list">
            {modules.map((m, i) => (
              <ModuleRow key={m.name} mod={m} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ───────────────────────────────────────────────────────── */}
      <section className="faq-section">
        <div className="section-container">
          <AnimatedSection className="">
            <h2 className="section-title">Frequently asked questions</h2>
          </AnimatedSection>
          <FAQAccordion />
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
            <div className="hero-actions" style={{ justifyContent: 'center' }}>
              <a href={useBaseUrl('/docs/getting-started')} className="hero-btn hero-btn-primary">
                Read the Docs
              </a>
              <a
                href="https://www.npmjs.com/package/radosgw-admin"
                className="hero-btn hero-btn-secondary"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View on npm (opens in new tab)"
              >
                View on npm
              </a>
            </div>
          </AnimatedSection>
        </div>
      </section>

      </main>
    </Layout>
  );
}
