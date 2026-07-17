import { useState, useEffect } from "react";
import axiosInstance from "../utils/axiosInstance";

// ── Add BulkExportButton component (inside the file) ──
const BulkExportButton = ({ filters }) => {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleBulkExport = async () => {
    setLoading(true);
    setError('');
    try {
      const payload = {};
      if (filters.status)   payload.status   = filters.status;
      if (filters.language) payload.language = filters.language;
      if (filters.category) payload.category = filters.category;

      const res = await axiosInstance.post('/pdf/bulk-export', payload, {
        responseType: 'blob',
        timeout:      60000,    // 60s for bulk
      });

      const blob      = new Blob([res.data], { type: 'application/zip' });
      const url       = URL.createObjectURL(blob);
      const link      = document.createElement('a');
      const date      = new Date().toISOString().slice(0, 10);
      link.href       = url;
      link.download   = `fatwas-export-${date}.zip`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => URL.revokeObjectURL(url), 5000);

    } catch (err) {
      setError('Bulk export failed. Try with fewer filters.');
      setTimeout(() => setError(''), 4000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        style={{
          background:   loading ? '#6b7280' : '#065f46',
          color:        '#fff',
          border:       'none',
          padding:      '9px 18px',
          borderRadius: '8px',
          cursor:       loading ? 'not-allowed' : 'pointer',
          fontWeight:   '700',
          fontSize:     '13px',
          display:      'flex',
          alignItems:   'center',
          gap:          '8px',
        }}
        onClick={handleBulkExport}
        disabled={loading}
        title="Export filtered Fatwas as ZIP of PDFs"
      >
        {loading ? '⏳ Exporting...' : '📦 Bulk Export PDFs'}
      </button>
      {error && (
        <p style={{ fontSize: '12px', color: '#b91c1c', margin: '4px 0 0' }}>
          ⚠️ {error}
        </p>
      )}
    </div>
  );
};


export default BulkExportButton;