import { useEffect } from 'react';

const ModalWrapper = ({ children, title, onClose, maxWidth = '560px' }) => {

  // ── Close on Escape key ────────────────────────────
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // ── Prevent body scroll while modal open ──────────
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div style={s.backdrop} onClick={onClose}>
      <div
        style={{ ...s.modal, maxWidth }}
        onClick={(e) => e.stopPropagation()} // Prevent close on inner click
      >
        {/* ── Modal Header ──────────────────────────── */}
        <div style={s.header}>
          <h2 style={s.title}>{title}</h2>
          <button style={s.closeBtn} onClick={onClose} title="Close (Esc)">
            ✕
          </button>
        </div>

        {/* ── Modal Body ────────────────────────────── */}
        <div style={s.body}>
          {children}
        </div>
      </div>
    </div>
  );
};

const s = {
  backdrop: {
    position:        'fixed',
    inset:           0,
    background:      'rgba(15, 23, 42, 0.7)',
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    zIndex:          1000,
    padding:         '20px',
    backdropFilter:  'blur(4px)',
  },
  modal: {
    background:   '#fff',
    borderRadius: '16px',
    width:        '100%',
    boxShadow:    '0 25px 60px rgba(0,0,0,0.4)',
    maxHeight:    '90vh',
    overflow:     'hidden',
    display:      'flex',
    flexDirection:'column',
    animation:    'modalIn 0.2s ease',
  },
  header: {
    display:         'flex',
    justifyContent:  'space-between',
    alignItems:      'center',
    padding:         '20px 24px',
    borderBottom:    '1px solid #f1f5f9',
    flexShrink:      0,
  },
  title: {
    fontSize:   '18px',
    fontWeight: '700',
    color:      '#0f172a',
    margin:     0,
  },
  closeBtn: {
    background:   'none',
    border:       'none',
    fontSize:     '18px',
    cursor:       'pointer',
    color:        '#94a3b8',
    padding:      '4px 8px',
    borderRadius: '6px',
    lineHeight:   1,
  },
  body: {
    padding:    '24px',
    overflowY:  'auto',
    flexGrow:   1,
  },
};

export default ModalWrapper;
