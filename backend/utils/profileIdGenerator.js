// ════════════════════════════════════════════════════
//  Profile ID Generator
//  Format: FMS-<ROLE_PREFIX>-<YEAR>-<6_CHAR_UNIQUE>
//  Example: FMS-ADM-2026-X7K9P2  (Super Admin)
//           FMS-MFT-2026-A3B8C1  (Mufti)
//           FMS-USR-2026-Z2M5N9  (Free User)
// ════════════════════════════════════════════════════

const ROLE_PREFIXES = {
  super_admin: "ADM",
  mufti:       "MFT",
  free:        "USR",
};

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0,O,1,I (confusing)

const generateUniqueChars = (length = 6) => {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return result;
};

const generateProfileId = (role = "free") => {
  const prefix = ROLE_PREFIXES[role] || "USR";
  const year   = new Date().getFullYear();
  const unique = generateUniqueChars(6);
  return `FMS-${prefix}-${year}-${unique}`;
};

module.exports = { generateProfileId };
