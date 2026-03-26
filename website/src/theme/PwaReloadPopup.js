import React from 'react';

export default function PwaReloadPopup({ onReload }) {
  return (
    <div style={{
      position: 'fixed',
      bottom: '1.25rem',
      right: '1.25rem',
      background: '#7c5bf0',
      color: '#fff',
      padding: '0.75rem 1.25rem',
      borderRadius: '10px',
      boxShadow: '0 4px 16px rgba(124,91,240,0.35)',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      zIndex: 9999,
      fontSize: '0.875rem',
      fontWeight: 500,
    }}>
      <span>New version available</span>
      <button
        onClick={onReload}
        style={{
          background: '#fff',
          color: '#7c5bf0',
          border: 'none',
          borderRadius: '6px',
          padding: '0.3rem 0.75rem',
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: '0.8rem',
        }}
      >
        Reload
      </button>
    </div>
  );
}
