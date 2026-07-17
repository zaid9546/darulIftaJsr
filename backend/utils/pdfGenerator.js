const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");

// ── Font paths ─────────────────────────────────────────
const FONTS = {
  // regular: path.join(__dirname, '../assets/fonts/NotoSans-Regular.ttf'),
  // bold:    path.join(__dirname, '../assets/fonts/NotoSans-Bold.ttf'),
  rtl: path.join(__dirname, "../assets/fonts/NotoNaskhArabic-Regular.ttf"),
  rtlBold: path.join(__dirname, "../assets/fonts/NotoNaskhArabic-Bold.ttf"),
};

// ── Color Palette ──────────────────────────────────────
const COLORS = {
  primary: "#065f46", // Deep green
  secondary: "#059669", // Medium green
  accent: "#10b981", // Light green
  dark: "#0f172a", // Near black
  text: "#1e293b", // Dark text
  muted: "#64748b", // Gray
  light: "#f0fdf4", // Light green bg
  border: "#a7f3d0", // Green border
  white: "#ffffff",
  stamp: "#047857", // Stamp green
};

// ── Page Margins ───────────────────────────────────────
const MARGIN = { top: 60, bottom: 60, left: 60, right: 60 };

// ════════════════════════════════════════════════════
//  MAIN GENERATOR FUNCTION
// ════════════════════════════════════════════════════
const generateFatwaPDF = (fatwa) => {
  return new Promise((resolve, reject) => {
    try {
      const isRTL = ["urdu", "hindi"].includes(fatwa.language);

      // ── Create PDF document ──────────────────────
      const doc = new PDFDocument({
        size: "A4",
        margins: MARGIN,
        info: {
          Title: `Fatwa - ${fatwa.fatwaNumber || "Draft"}`,
          Author: "Fatwa Management System",
          Subject: "Official Islamic Ruling",
          Keywords: `fatwa, islamic, ruling, ${fatwa.category}`,
          Creator: "FatwaMS v1.0",
        },
      });

      // ── Register fonts ───────────────────────────
      if (fs.existsSync(FONTS.regular) && fs.existsSync(FONTS.bold)) {
        doc.registerFont("Regular", FONTS.regular);
        doc.registerFont("Bold", FONTS.bold);
      } else {
        doc.registerFont("Regular", "Helvetica");
        doc.registerFont("Bold", "Helvetica-Bold");
      }

      // ── Collect PDF buffer ───────────────────────
      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // ════════════════════════════════════════════
      //  BUILD PDF CONTENT
      // ════════════════════════════════════════════

      buildHeader(doc, fatwa, isRTL);
      buildMetaBar(doc, fatwa);
      buildQuestionSection(doc, fatwa, isRTL);

      if (fatwa.answer?.text) {
        buildAnswerSection(doc, fatwa, isRTL);
      }

      if (fatwa.answer?.references?.length > 0) {
        buildReferencesSection(doc, fatwa);
      }

      if (fatwa.approval?.isApproved) {
        buildApprovalStamp(doc, fatwa);
      }

      buildFooter(doc, fatwa);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

// ════════════════════════════════════════════════════
//  SECTION BUILDERS
// ════════════════════════════════════════════════════

// ── 1. Official Header ──────────────────────────────
const buildHeader = (doc, fatwa, isRTL) => {
  const pageWidth = doc.page.width;
  const usable = pageWidth - MARGIN.left - MARGIN.right;

  // ── Green gradient header bar ────────────────────
  doc.rect(0, 0, pageWidth, 130).fill(COLORS.primary);

  // ── Decorative inner bar ─────────────────────────
  doc.rect(0, 125, pageWidth, 5).fill(COLORS.accent);

  // ── Organisation name (top center) ──────────────
  doc
    .fillColor(COLORS.white)
    .font("Helvetica-Bold")
    .fontSize(22)
    .text("FATWA MANAGEMENT SYSTEM", MARGIN.left, 30, {
      width: usable,
      align: "center",
    });

  // ── Arabic Bismillah ─────────────────────────────
  doc
    .fillColor("#a7f3d0")
    .fontSize(14)
    .font(fs.existsSync(FONTS.rtl) ? FONTS.rtl : "Helvetica")
    .text("بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ", MARGIN.left, 60, {
      width: usable,
      align: "center",
      features: ["rtla"],
    });

  // ── Subtitle ─────────────────────────────────────
  doc
    .fillColor("#d1fae5")
    .font("Regular")
    .fontSize(11)
    .text(
      "In the Name of Allah, the Most Gracious, the Most Merciful",
      MARGIN.left,
      88,
      {
        width: usable,
        align: "center",
      },
    );

  doc.moveDown(4);
};

// ── 2. Fatwa Meta Bar ───────────────────────────────
const buildMetaBar = (doc, fatwa) => {
  const pageWidth = doc.page.width;
  const usable = pageWidth - MARGIN.left - MARGIN.right;
  const y = doc.y + 10;

  // ── Light green background box ───────────────────
  doc.rect(MARGIN.left, y, usable, 56).fill(COLORS.light).stroke(COLORS.border);

  const colW = usable / 3;

  // ── Fatwa Number ─────────────────────────────────
  doc
    .fillColor(COLORS.muted)
    .font("Regular")
    .fontSize(8)
    .text("FATWA NUMBER", MARGIN.left + 12, y + 10, { width: colW });

  doc
    .fillColor(COLORS.primary)
    .font("Bold")
    .fontSize(13)
    .text(fatwa.fatwaNumber || "PENDING", MARGIN.left + 12, y + 22, {
      width: colW,
    });

  // ── Fatwa Date ───────────────────────────────────
  const fmtDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      : "—";

  doc
    .fillColor(COLORS.muted)
    .font("Regular")
    .fontSize(8)
    .text("DATE ISSUED", MARGIN.left + colW + 12, y + 10, { width: colW });

  doc
    .fillColor(COLORS.dark)
    .font("Bold")
    .fontSize(12)
    .text(fmtDate(fatwa.fatwaDate), MARGIN.left + colW + 12, y + 22, {
      width: colW,
    });

  // ── Category ─────────────────────────────────────
  doc
    .fillColor(COLORS.muted)
    .font("Regular")
    .fontSize(8)
    .text("CATEGORY", MARGIN.left + colW * 2 + 12, y + 10, { width: colW });

  doc
    .fillColor(COLORS.dark)
    .font("Bold")
    .fontSize(12)
    .text(
      (fatwa.category || "General").toUpperCase(),
      MARGIN.left + colW * 2 + 12,
      y + 22,
      { width: colW },
    );

  doc.y = y + 70;
};

// ── 3. Question Section ─────────────────────────────
const buildQuestionSection = (doc, fatwa, isRTL) => {
  const usable = doc.page.width - MARGIN.left - MARGIN.right;

  // ── Section Label ────────────────────────────────
  sectionLabel(doc, "QUESTION (السؤال)", COLORS.primary);

  // ── Question Box ─────────────────────────────────
  const qStartY = doc.y;
  const qText = fatwa.questionText || "";

  // Estimate height
  const estimatedLines = Math.ceil(qText.length / 80);
  const boxHeight = Math.max(60, estimatedLines * (isRTL ? 28 : 18) + 24);

  doc
    .rect(MARGIN.left, qStartY, usable, boxHeight)
    .fill("#f8fafc")
    .stroke("#e2e8f0");

  // ── Question Text ────────────────────────────────
  const qFont = isRTL && fs.existsSync(FONTS.rtl) ? "RTL" : "Regular";
  const qAlign = isRTL ? "right" : "left";
  const qFontSz = isRTL ? 14 : 12;

  doc
    .fillColor(COLORS.text)
    .font(qFont)
    .fontSize(qFontSz)
    .text(qText, MARGIN.left + 12, qStartY + 12, {
      width: usable - 24,
      align: qAlign,
      features: isRTL ? ["rtla", "arab"] : [],
      lineGap: isRTL ? 10 : 4,
    });

  doc.y = qStartY + boxHeight + 16;
};

// ── 4. Answer Section ───────────────────────────────
const buildAnswerSection = (doc, fatwa, isRTL) => {
  const usable = doc.page.width - MARGIN.left - MARGIN.right;

  sectionLabel(doc, "ANSWER / RULING (الجواب)", COLORS.secondary);

  const aStartY = doc.y;
  const aText = fatwa.answer?.text || "";
  const lines = Math.ceil(aText.length / 75);
  const boxH = Math.max(80, lines * (isRTL ? 30 : 18) + 32);

  // ── Answer Box ───────────────────────────────────
  doc
    .rect(MARGIN.left, aStartY, usable, boxH)
    .fill("#ffffff")
    .stroke(COLORS.border);

  // ── Green left border accent ─────────────────────
  doc.rect(MARGIN.left, aStartY, 4, boxH).fill(COLORS.accent);

  const aFont = isRTL && fs.existsSync(FONTS.rtl) ? "RTL" : "Regular";
  const aAlign = isRTL ? "right" : "left";
  const aFontSz = isRTL ? 14 : 12;

  doc
    .fillColor(COLORS.text)
    .font(aFont)
    .fontSize(aFontSz)
    .text(aText, MARGIN.left + 16, aStartY + 14, {
      width: usable - 28,
      align: aAlign,
      features: isRTL ? ["rtla", "arab"] : [],
      lineGap: isRTL ? 10 : 4,
    });

  doc.y = aStartY + boxH + 10;

  // ── Answered By ──────────────────────────────────
  if (fatwa.answer?.answeredBy?.name) {
    doc
      .fillColor(COLORS.muted)
      .font("Regular")
      .fontSize(10)
      .text(
        `— Answered by: ${fatwa.answer.answeredBy.name}` +
          (fatwa.answer.answeredBy.specialization
            ? ` · ${fatwa.answer.answeredBy.specialization}`
            : ""),
        MARGIN.left,
        doc.y + 4,
        { align: "right", width: usable },
      );
  }

  doc.moveDown(1.5);
};

// ── 5. References Section ───────────────────────────
const buildReferencesSection = (doc, fatwa) => {
  const usable = doc.page.width - MARGIN.left - MARGIN.right;

  sectionLabel(doc, "REFERENCES (المصادر)", COLORS.muted);

  const refs = fatwa.answer?.references || [];
  const startY = doc.y;
  const boxH = refs.length * 20 + 24;

  doc.rect(MARGIN.left, startY, usable, boxH).fill("#f8fafc").stroke("#e2e8f0");

  refs.forEach((ref, i) => {
    doc
      .fillColor(COLORS.text)
      .font("Regular")
      .fontSize(10)
      .text(`${i + 1}.  ${ref}`, MARGIN.left + 16, startY + 12 + i * 20, {
        width: usable - 32,
      });
  });

  doc.y = startY + boxH + 20;
};

// ── 6. Approval Stamp ───────────────────────────────
const buildApprovalStamp = (doc, fatwa) => {
  const pageWidth = doc.page.width;
  const usable = pageWidth - MARGIN.left - MARGIN.right;

  // ── Add new page if less than 200pt remaining ────
  if (doc.y > doc.page.height - 240) {
    doc.addPage();
  }

  sectionLabel(doc, "OFFICIAL APPROVAL STAMP (ختم التصديق)", COLORS.primary);

  const stampY = doc.y;
  const stampH = 160;
  const stampX = MARGIN.left + usable * 0.1;
  const stampW = usable * 0.8;

  // ── Outer stamp box ──────────────────────────────
  doc.rect(stampX, stampY, stampW, stampH).lineWidth(3).stroke(COLORS.stamp);

  // ── Inner dashed border ──────────────────────────
  doc
    .rect(stampX + 6, stampY + 6, stampW - 12, stampH - 12)
    .dash(4, { space: 4 })
    .stroke(COLORS.accent)
    .undash();

  // ── Light green fill ─────────────────────────────
  doc.rect(stampX + 7, stampY + 7, stampW - 14, stampH - 14).fill(COLORS.light);

  // ── Top label ────────────────────────────────────
  doc
    .fillColor(COLORS.primary)
    .font("Bold")
    .fontSize(12)
    .text("✦  OFFICIAL FATWA STAMP  ✦", stampX, stampY + 18, {
      width: stampW,
      align: "center",
    });

  // ── Divider line ─────────────────────────────────
  doc
    .moveTo(stampX + 20, stampY + 38)
    .lineTo(stampX + stampW - 20, stampY + 38)
    .lineWidth(1)
    .stroke(COLORS.border);

  // ── Fatwa number (large) ─────────────────────────
  doc
    .fillColor(COLORS.stamp)
    .font("Bold")
    .fontSize(18)
    .text(fatwa.fatwaNumber || "—", stampX, stampY + 46, {
      width: stampW,
      align: "center",
    });

  // ── Divider ──────────────────────────────────────
  doc
    .moveTo(stampX + 20, stampY + 74)
    .lineTo(stampX + stampW - 20, stampY + 74)
    .lineWidth(1)
    .stroke(COLORS.border);

  // ── Stamp details (3 columns) ────────────────────
  const colW = stampW / 3;

  const fmtDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—";

  // Date
  doc
    .fillColor(COLORS.muted)
    .font("Regular")
    .fontSize(8)
    .text("DATE", stampX + 10, stampY + 84, { width: colW, align: "center" });
  doc
    .fillColor(COLORS.dark)
    .font("Bold")
    .fontSize(10)
    .text(fmtDate(fatwa.fatwaDate), stampX + 10, stampY + 96, {
      width: colW,
      align: "center",
    });

  // Approved By
  doc
    .fillColor(COLORS.muted)
    .font("Regular")
    .fontSize(8)
    .text("APPROVED BY", stampX + colW, stampY + 84, {
      width: colW,
      align: "center",
    });
  doc
    .fillColor(COLORS.dark)
    .font("Bold")
    .fontSize(10)
    .text(fatwa.approval?.approvedBy?.name || "—", stampX + colW, stampY + 96, {
      width: colW,
      align: "center",
    });

  // Stamp Code
  doc
    .fillColor(COLORS.muted)
    .font("Regular")
    .fontSize(8)
    .text("STAMP CODE", stampX + colW * 2, stampY + 84, {
      width: colW,
      align: "center",
    });
  doc
    .fillColor(COLORS.stamp)
    .font("Bold")
    .fontSize(9)
    .text(fatwa.approval?.stampCode || "—", stampX + colW * 2, stampY + 96, {
      width: colW,
      align: "center",
    });

  // ── Footer note ──────────────────────────────────
  doc
    .fillColor(COLORS.muted)
    .font("Regular")
    .fontSize(8)
    .text(
      "✦ This Fatwa has been reviewed and approved by the Central Fatwa Board ✦",
      stampX,
      stampY + 135,
      { width: stampW, align: "center" },
    );

  doc.y = stampY + stampH + 24;
};

// ── 7. Footer ───────────────────────────────────────
const buildFooter = (doc, fatwa) => {
  const pageWidth = doc.page.width;
  const pageH = doc.page.height;

  // ── Footer bar ───────────────────────────────────
  doc.rect(0, pageH - 50, pageWidth, 50).fill(COLORS.primary);

  const fmtDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : new Date().toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });

  doc
    .fillColor(COLORS.white)
    .font("Regular")
    .fontSize(9)
    .text(
      `Fatwa Management System  |  ${fatwa.fatwaNumber || "DRAFT"}  |  Generated: ${fmtDate(new Date())}`,
      MARGIN.left,
      pageH - 32,
      { width: pageWidth - MARGIN.left * 2, align: "center" },
    );
};

// ════════════════════════════════════════════════════
//  SHARED HELPERS
// ════════════════════════════════════════════════════

// ── Section label with left accent bar ─────────────
const sectionLabel = (doc, text, color) => {
  const usable = doc.page.width - MARGIN.left - MARGIN.right;
  const y = doc.y + 8;

  doc.rect(MARGIN.left, y, 4, 18).fill(color);

  doc
    .fillColor(color)
    .font("Bold")
    .fontSize(11)
    .text(text.toUpperCase(), MARGIN.left + 12, y + 2, {
      width: usable - 12,
    });

  doc.moveDown(0.8);
};

// ════════════════════════════════════════════════════
//  BULK PDF GENERATOR (ZIP of multiple PDFs)
// ════════════════════════════════════════════════════
const generateBulkPDF = async (fatwas) => {
  const archiver = require("archiver");

  const { Readable } = require("stream");

  return new Promise(async (resolve, reject) => {
    try {
      const archive = archiver("zip", { zlib: { level: 9 } });
      const chunks = [];

      archive.on("data", (c) => chunks.push(c));
      archive.on("end", () => resolve(Buffer.concat(chunks)));
      archive.on("error", reject);

      for (const fatwa of fatwas) {
        const pdfBuffer = await generateFatwaPDF(fatwa);
        const filename = `${fatwa.fatwaNumber || `fatwa-${fatwa._id}`}.pdf`;

        archive.append(pdfBuffer, { name: filename });
      }

      archive.finalize();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { generateFatwaPDF, generateBulkPDF };
