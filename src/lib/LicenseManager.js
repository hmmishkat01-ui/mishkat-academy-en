// ============================================================
//  Mishkat IT Academy — License Manager v3
//  Strong tamper-proof + expiry system
// ============================================================

const LICENSE_KEY   = 'mishkat_lic_v3';
const SECRET_A      = 'MISHKAT_IT_2025_XJ9Z';
const SECRET_B      = 'MA_SECURE_9F2K_7PQR';

// ── Strong hash (two-pass) ───────────────────────────────────
function hashA(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) ^ str.charCodeAt(i);
    h = h & h;
  }
  return Math.abs(h).toString(16).toUpperCase().padStart(16, '0');
}

function hashB(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
    h = h & h;
  }
  return (h >>> 0).toString(16).toUpperCase().padStart(8, '0');
}

// ── Generate token from all fields ───────────────────────────
function generateToken(clientName, phone, issuedAt, expiresAt, licenseType) {
  const raw = [
    SECRET_A,
    clientName.trim().toLowerCase(),
    phone.trim(),
    issuedAt,
    expiresAt,
    licenseType,
    SECRET_B
  ].join('||');
  return hashA(raw) + hashB(raw);
}

// ── Check if license is still valid ─────────────────────────
export function isLicenseActivated() {
  try {
    const stored = localStorage.getItem(LICENSE_KEY);
    if (!stored) return false;

    const data = JSON.parse(stored);
    const { clientName, phone, issuedAt, expiresAt, licenseType, token, activated } = data;

    if (!activated || !clientName || !phone || !issuedAt || !expiresAt || !licenseType || !token)
      return false;

    // 1. Verify token (tamper check)
    const expected = generateToken(clientName, phone, issuedAt, expiresAt, licenseType);
    if (token !== expected) return false;

    // 2. Check expiry (permanent licenses have expiresAt = 'PERMANENT')
    if (expiresAt !== 'PERMANENT') {
      const now = new Date();
      const exp = new Date(expiresAt);
      if (now > exp) return false;
    }

    return true;
  } catch {
    return false;
  }
}

// ── Get expiry info for showing countdown ───────────────────
export function getLicenseStatus() {
  try {
    const stored = localStorage.getItem(LICENSE_KEY);
    if (!stored) return null;
    const data = JSON.parse(stored);

    if (data.expiresAt === 'PERMANENT') {
      return { type: 'permanent', daysLeft: null, clientName: data.clientName, licenseType: data.licenseType };
    }

    const now      = new Date();
    const exp      = new Date(data.expiresAt);
    const msLeft   = exp - now;
    const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));

    return {
      type        : data.licenseType,
      daysLeft    : daysLeft > 0 ? daysLeft : 0,
      expired     : daysLeft <= 0,
      clientName  : data.clientName,
      expiresAt   : data.expiresAt,
      licenseType : data.licenseType
    };
  } catch {
    return null;
  }
}

// ── Activate from JSON file ──────────────────────────────────
export function activateLicense(jsonData) {
  try {
    const { clientName, phone, issuedAt, expiresAt, licenseType, token } = jsonData;

    if (!clientName || !phone || !issuedAt || !expiresAt || !licenseType || !token)
      return { success: false, message: 'Invalid license file. Required fields missing.' };

    // Verify token
    const expected = generateToken(clientName, phone, issuedAt, expiresAt, licenseType);
    if (token !== expected)
      return { success: false, message: 'License file is invalid or has been tampered with.' };

    // Check expiry on activation
    if (expiresAt !== 'PERMANENT') {
      const now = new Date();
      const exp = new Date(expiresAt);
      if (now > exp)
        return { success: false, message: 'This license has already expired.' };
    }

    // Save
    localStorage.setItem(LICENSE_KEY, JSON.stringify({
      ...jsonData,
      activated   : true,
      activatedAt : new Date().toISOString()
    }));

    const typeLabel = {
      trial     : 'Trial',
      monthly   : 'Monthly',
      yearly    : 'Yearly',
      permanent : 'Permanent'
    }[licenseType] || licenseType;

    return {
      success : true,
      message : `Welcome, ${clientName}! ${typeLabel} license activated successfully.`
    };
  } catch {
    return { success: false, message: 'Could not read license file. Please try again.' };
  }
}
