import { useState } from 'react';
import axiosInstance from '../utils/axiosInstance';

const DownloadPDFButton = ({
  fatwaId,
  fatwaNumber,
  variant  = 'download',   // 'download' | 'preview' | 'icon'
  size     = 'md',         // 'sm' | 'md' | 'lg'
  disabled = false,
}) => {
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState(false);

  // ── Handle PDF Download ────────────────────────────
  const handleDownload = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const endpoint = `/pdf/fatwa/${fatwaId}`;

      const response = await axiosInstance.get(endpoint, {
        responseType: 'blob',               // Important — receive binary data
        timeout:      30000,                // 30s timeout for large PDFs
      });

      // ── Create download link ─────────────────────
      const blob      = new Blob([response.data], { type: 'application/pdf' });
      const url       = URL.createObjectURL(blob);
      const link      = document.createElement('a');
      link.href       = url;
      link.download   = fatwaNumber ? `${fatwaNumber}.pdf` : `fatwa-${fatwaId}.pdf`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // ── Cleanup object URL ───────────────────────
      setTimeout(() => URL.revokeObjectURL(url), 5000);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);

    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to generate PDF. Please try again.';
      setError(msg);
      setTimeout(() => setError(''), 4000);
      console.error('PDF Download Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Handle Preview in Browser ──────────────────────
  const handlePreview = () => {
    const token = localStorage.getItem('token');
    const url   = `${import.meta.env.VITE_API_URL}/pdf/fatwa/${fatwaId}/preview`;

    // Open with auth header via URL token param (for browser preview)
    const previewUrl = token ? `${url}?token=${token}` : url;
    window.open(previewUrl, '_blank', 'noopener,noreferrer');
  };

  // ── Size Styles ────────────────────────────────────
  const sizes = {
    sm: { padding: '5px 12px', fontSize: '12px', gap: '6px' },
    md: { padding: '9px 18px', fontSize: '14px', gap: '8px' },
    lg: { padding: '13px 26px', fontSize: '16px', gap: '10px' },
  };

  const sz = sizes[size] || sizes.md;

  // ── Icon-only variant ──────────────────────────────
  if (variant === 'icon') {
    return (
      <div style={{ display: 'inline-flex', gap: '6px', flexDirection: 'column' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            style={{ ...s.iconBtn, opacity: (loading || disabled) ? 0.6 : 1 }}
            onClick={handleDownload}
            disabled={loading || disabled}
            title={`Download PDF — ${fatwaNumber}`}
          >
            {loading ? '⏳' : success ? '✅' : '📥'}
          </button>
          <button
            style={s.iconBtn}
            onClick={handlePreview}
            disabled={disabled}
            title="Preview PDF in browser"
          >
            👁️
          </button>
        </div>
        {error && <span style={s.errText}>{error}</span>}
      </div>
    );
  }

  // ── Full button variants ───────────────────────────
  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>

        {/* ── Download Button ──────────────────────── */}
        <button
          style={{
            ...s.downloadBtn,
            ...sz,
            opacity: (loading || disabled) ? 0.65 : 1,
            cursor:  (loading || disabled) ? 'not-allowed' : 'pointer',
          }}
          onClick={handleDownload}
          disabled={loading || disabled}
          aria-label={`Download PDF for ${fatwaNumber}`}
        >
          {loading  && <span style={s.spinner} />}
          {!loading && <span>{success ? '✅' : '📥'}</span>}
          <span>
            {loading ? 'Generating PDF...' : success ? 'Downloaded!' : 'Download PDF'}
          </span>
        </button>

        {/* ── Preview Button (md + lg only) ───────── */}
        {size !== 'sm' && (
          <button
            style={{ ...s.previewBtn, ...sz }}
            onClick={handlePreview}
            disabled={disabled}
            aria-label="Preview PDF in browser"
          >
            <span>🔍</span>
            <span>Preview</span>
          </button>
        )}
      </div>

      {/* ── Error Message ────────────────────────── */}
      {error && (
        <span style={s.errText}>⚠️ {error}</span>
      )}
    </div>
  );
};

const s = {
  downloadBtn: {
    display:        'inline-flex',
    alignItems:     'center',
    gap:            '8px',
    background:     '#065f46',
    color:          '#fff',
    border:         'none',
    borderRadius:   '8px',
    fontWeight:     '700',
    transition:     'background 0.2s, transform 0.1s',
    whiteSpace:     'nowrap',
  },
  previewBtn: {
    display:        'inline-flex',
    alignItems:     'center',
    gap:            '8px',
    background:     '#f0fdf4',
    color:          '#065f46',
    border:         '1.5px solid #6ee7b7',
    borderRadius:   '8px',
    fontWeight:     '700',
    cursor:         'pointer',
    transition:     'background 0.2s',
    whiteSpace:     'nowrap',
  },
  iconBtn: {
    background:   '#f0fdf4',
    border:       '1.5px solid #6ee7b7',
    borderRadius: '6px',
    padding:      '5px 8px',
    cursor:       'pointer',
    fontSize:     '16px',
    lineHeight:   1,
  },
  spinner: {
    display:     'inline-block',
    width:       '14px',
    height:      '14px',
    border:      '2px solid rgba(255,255,255,0.3)',
    borderTop:   '2px solid #fff',
    borderRadius:'50%',
    animation:   'spin 0.7s linear infinite',
    flexShrink:  0,
  },
  errText: {
    fontSize:  '12px',
    color:     '#b91c1c',
    display:   'block',
    maxWidth:  '280px',
  },
};

export default DownloadPDFButton;
