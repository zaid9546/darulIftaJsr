import { useState, useEffect } from "react";
import ModalWrapper from "./ModalWrapper";
import axiosInstance from "../../utils/axiosInstance";

const AssignModal = ({ question, actionLoading, onClose, onAssign }) => {
  const [muftis, setMuftis] = useState([]);
  const [selectedMuftis, setSelectedMuftis] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [fetchErr, setFetchErr] = useState("");

  const isRTL = ["urdu", "hindi"].includes(question.language);

  // ── Fetch active muftis ────────────────────────────
  useEffect(() => {
    axiosInstance
      .get("/users/muftis") // GET /api/users/muftis — built in Step 8
      .then((res) => setMuftis(res.data.data || []))
      .catch(() => setFetchErr("Failed to load Mufti list."))
      .finally(() => setFetching(false));
  }, []);

  const toggleMufti = (id) => {
  setSelectedMuftis((prev) => {
    if (prev.includes(id)) {
      return prev.filter((item) => item !== id);
    }

    return [...prev, id];
  });
};

const handleSubmit = (e) => {
  e.preventDefault();

  if (selectedMuftis.length === 0) return;

  onAssign({
    muftiIds: selectedMuftis,
  });
};

  return (
    <ModalWrapper title="📋 Assign to Mufti" onClose={onClose}>
      {/* Question Preview */}
      <div style={s.qPreviewBox}>
        <p style={s.qLabel}>❓ Question</p>
        <p
          style={{
            ...s.qText,
            direction: isRTL ? "rtl" : "ltr",
            textAlign: isRTL ? "right" : "left",
            fontFamily: isRTL ? "'Noto Nastaliq Urdu', serif" : "inherit",
            fontSize: isRTL ? "16px" : "14px",
            lineHeight: isRTL ? "2.2" : "1.6",
          }}
        >
          {question.questionText}
        </p>
        <div style={s.metaRow}>
          <span style={s.metaPill}>🌍 {question.language}</span>
          <span style={s.metaPill}>📂 {question.category}</span>
        </div>
      </div>

      {/* Mufti Selector */}
      {fetching ? (
        <div style={s.center}>⏳ Loading Muftis...</div>
      ) : fetchErr ? (
        <div style={s.errMsg}>⚠️ {fetchErr}</div>
      ) : muftis.length === 0 ? (
        <div style={s.errMsg}>
          No active Muftis available. Please add a Mufti first.
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={s.form}>
          <label style={s.label}>👨‍⚖️ Select Mufti</label>
          <div style={s.muftiList}>
            {muftis.map((m) => (
              <label
                key={m._id}
                style={{
                  ...s.muftiCard,
                  ...(selectedMuftis.includes(m._id)
                    ? s.muftiCardSelected
                    : {}),
                }}
              >
                <input
                  type="checkbox"
                  name="mufti"
                  value={m._id}
                  checked={selectedMuftis.includes(m._id)}
                  onChange={() => toggleMufti(m._id)}
                  style={{ display: "none" }}
                />
                <div style={s.muftiAvatar}>
                  {m.name.charAt(0).toUpperCase()}
                </div>
                <div style={s.muftiInfo}>
                  <strong style={s.muftiName}>{m.name}</strong>
                  {m.specialization && (
                    <span style={s.muftiSpec}>{m.specialization}</span>
                  )}
                  <div style={s.muftiLangs}>
                    {m.languages?.map((l) => (
                      <span key={l} style={s.langChip}>
                        {l}
                      </span>
                    ))}
                  </div>
                </div>
                {selectedMuftis.includes(m._id) && (
                  <span style={s.checkMark}>✅</span>
                )}
              </label>
            ))}
          </div>

          <button
            type="submit"
            style={{
              ...s.submitBtn,
              opacity: selectedMuftis.length === 0 || actionLoading ? 0.6 : 1,
            }}
            disabled={selectedMuftis.length === 0 || actionLoading}
          >
            {actionLoading
  ? '⏳ Assigning...'
  : `📋 Assign to ${selectedMuftis.length} Mufti(s)`}
          </button>
        </form>
      )}
    </ModalWrapper>
  );
};

const s = {
  qPreviewBox: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "16px",
    marginBottom: "20px",
  },
  qLabel: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    margin: "0 0 8px",
  },
  qText: {
    fontSize: "14px",
    color: "#1e293b",
    margin: "0 0 12px",
    lineHeight: "1.6",
  },
  metaRow: { display: "flex", gap: "8px" },
  metaPill: {
    fontSize: "12px",
    background: "#e2e8f0",
    color: "#475569",
    padding: "2px 10px",
    borderRadius: "999px",
    fontWeight: "600",
  },
  center: { textAlign: "center", padding: "20px", color: "#64748b" },
  errMsg: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#b91c1c",
    padding: "12px",
    borderRadius: "8px",
    fontSize: "14px",
  },
  form: { display: "flex", flexDirection: "column", gap: "16px" },
  label: { fontSize: "13px", fontWeight: "700", color: "#374151" },
  muftiList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    maxHeight: "260px",
    overflowY: "auto",
  },
  muftiCard: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "12px 14px",
    border: "1.5px solid #e2e8f0",
    borderRadius: "10px",
    cursor: "pointer",
    transition: "all 0.15s",
    background: "#fafafa",
  },
  muftiCardSelected: {
    borderColor: "#10b981",
    background: "#f0fdf4",
    boxShadow: "0 0 0 3px #10b98125",
  },
  muftiAvatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "#10b981",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "800",
    fontSize: "18px",
    flexShrink: 0,
  },
  muftiInfo: { flex: 1 },
  muftiName: {
    fontSize: "14px",
    color: "#0f172a",
    display: "block",
    marginBottom: "2px",
  },
  muftiSpec: {
    fontSize: "12px",
    color: "#64748b",
    display: "block",
    marginBottom: "4px",
  },
  muftiLangs: { display: "flex", gap: "4px", flexWrap: "wrap" },
  langChip: {
    fontSize: "10px",
    background: "#eff6ff",
    color: "#1d4ed8",
    padding: "2px 6px",
    borderRadius: "4px",
    fontWeight: "600",
  },
  checkMark: { fontSize: "18px" },
  submitBtn: {
    background: "#10b981",
    color: "#fff",
    border: "none",
    padding: "13px",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
    marginTop: "4px",
  },
};

export default AssignModal;
