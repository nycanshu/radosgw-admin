import Layout from '@theme/Layout';
import useBaseUrl from '@docusaurus/useBaseUrl';

export default function NotFound() {
  return (
    <Layout title="404 — Page Not Found">
      <div className="not-found">
        <img
          src={useBaseUrl('/img/radosgw-admin-light-logo-removebg-preview.png')}
          alt="radosgw-admin mascot"
          className="not-found-mascot not-found-mascot-light"
        />
        <img
          src={useBaseUrl('/img/radosgw-admin-dark-log-removebg-preview.png')}
          alt="radosgw-admin mascot"
          className="not-found-mascot not-found-mascot-dark"
        />
        <h1 className="not-found-code">404</h1>
        <p className="not-found-title">Well this is embarrassing…</p>
        <p className="not-found-desc">
          The page you’re looking for isn’t here. Feel free to return to the home page or browse the docs to find what you need.
        </p>
        <div className="not-found-actions">
          <a href={useBaseUrl('/')} className="not-found-btn not-found-btn-primary">
            Go Home
          </a>
          <a href={useBaseUrl('/docs/getting-started')} className="not-found-btn not-found-btn-secondary">
            Read the Docs
          </a>
        </div>
      </div>
    </Layout>
  );
}
