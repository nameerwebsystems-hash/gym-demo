/**
 * KRONOS APEX - Dynamic Landing Page & Parameter Engine
 * Safely decodes URL parameters, sanitizes inputs, enforces strict fallbacks,
 * truncates business names (max 25 chars with ...), and safely injects into DOM elements.
 */

// Strict Fallback Constants
const FALLBACK_BUSINESS = "KRONOS APEX";
const FALLBACK_ADDRESS = "1126 S Gilbert Rd, Suite 104, Mesa, AZ 85204";
const FALLBACK_LOCATION = "Mesa, AZ";
const FALLBACK_COLOR = "#FF1E27";
const FALLBACK_PCOLOR = "#FF8C00";
const FALLBACK_PHONE = "+1 (480) 555-0198";
const FALLBACK_EMAIL = "concierge@kronosapex.com";
const FALLBACK_SUB = "A sanctuary where uncompromising biomechanics, calibrated competition iron, and infrared recovery collide to sculpt the elite human form.";
const FALLBACK_CTA = "EXPLORE MEMBERSHIPS";
const MAX_BUSINESS_LENGTH = 25;

/**
 * Safely decodes a URI component.
 * Handles '+', '%20', and malformed percent-escapes gracefully with fallbacks.
 * @param {string|null} val 
 * @returns {string}
 */
function safeDecodeParam(val) {
  if (typeof val !== 'string' || !val) return '';
  const unplussed = val.replace(/\+/g, ' ');
  try {
    return decodeURIComponent(unplussed);
  } catch (e) {
    try {
      return decodeURI(unplussed);
    } catch (e2) {
      try {
        return decodeURIComponent(unplussed.replace(/%(?![0-9a-fA-F]{2})/g, '%25'));
      } catch (e3) {
        return unplussed;
      }
    }
  }
}

/**
 * Sanitizes input strings by stripping HTML/script/style tags and control characters.
 * @param {string} str 
 * @returns {string}
 */
function sanitizeInput(str) {
  if (typeof str !== 'string' || !str) return '';
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim();
}

/**
 * Escapes special HTML characters when assembling HTML fragments.
 * @param {string} str 
 * @returns {string}
 */
function escapeHTML(str) {
  if (typeof str !== 'string' || !str) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  return str.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Truncates business name to a strict maximum length (default: 25 chars) and appends '...' if exceeded.
 * @param {string} name 
 * @param {number} maxLen 
 * @returns {string}
 */
function truncateBusinessName(name, maxLen = MAX_BUSINESS_LENGTH) {
  if (!name || typeof name !== 'string') return '';
  const trimmed = name.trim();
  if (trimmed.length > maxLen) {
    return trimmed.slice(0, maxLen).trim() + '...';
  }
  return trimmed;
}

/**
 * Normalizes and validates hex color strings.
 * Handles '#HEX', 'HEX', '%23HEX', 3-digit '#RGB', and 6-digit '#RRGGBB'.
 * @param {string|null} raw 
 * @param {string|null} fallback 
 * @returns {string|null}
 */
function normalizeHexColor(raw, fallback = null) {
  if (!raw) return fallback;
  let clean = sanitizeInput(safeDecodeParam(raw)).trim();
  if (!clean) return fallback;
  if (!clean.startsWith('#')) clean = '#' + clean;
  if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(clean)) {
    if (clean.length === 4) {
      clean = '#' + clean[1] + clean[1] + clean[2] + clean[2] + clean[3] + clean[3];
    }
    return clean.toUpperCase();
  }
  return fallback;
}

/**
 * Converts Hex color string to RGB object.
 * @param {string} hex 
 * @returns {{r: number, g: number, b: number}|null}
 */
function hexToRgb(hex) {
  if (!hex) return null;
  let c = hex.replace('#', '').trim();
  if (c.length === 3) {
    c = c.split('').map(x => x + x).join('');
  }
  if (c.length !== 6) return null;
  const num = parseInt(c, 16);
  if (isNaN(num)) return null;
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

/**
 * Converts HSL values to a Hex color string.
 */
function hslToHex(h, s, l) {
  let c = (1 - Math.abs(2 * l - 1)) * s;
  let x = c * (1 - Math.abs((h / 60) % 2 - 1));
  let m = l - c / 2;
  let r = 0, g = 0, b = 0;

  if (0 <= h && h < 60) { r = c; g = x; b = 0; }
  else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
  else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
  else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
  else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
  else if (300 <= h && h < 360) { r = c; g = 0; b = x; }

  let rHex = Math.round((r + m) * 255).toString(16).padStart(2, '0');
  let gHex = Math.round((g + m) * 255).toString(16).padStart(2, '0');
  let bHex = Math.round((b + m) * 255).toString(16).padStart(2, '0');

  return `#${rHex}${gHex}${bHex}`.toUpperCase();
}

/**
 * Derives a complementary/harmonious secondary color.
 */
function getComplementarySecondaryColor(hexColor) {
  const clean = (hexColor || '').replace('#', '').toLowerCase();
  const curated = {
    'ff1e27': '#FF8C00',
    'dc2626': '#FF8C00',
    'ef4444': '#FBBF24',
    '2563eb': '#00F5D4',
    '3b82f6': '#06B6D4',
    '00f5d4': '#8B5CF6',
    '10b981': '#A3E635',
    '059669': '#F59E0B',
    'f59e0b': '#EF4444',
    'd97706': '#DC2626',
    '8b5cf6': '#EC4899',
    'ec4899': '#8B5CF6'
  };

  if (curated[clean]) return curated[clean];

  const rgb = hexToRgb(hexColor);
  if (!rgb) return '#FF8C00';

  let r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255;
  let max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  let shiftedH = ((h * 360) + 38) % 360;
  let shiftedS = Math.min(Math.max(s, 0.90), 1.0);
  let shiftedL = Math.min(Math.max(l, 0.52), 0.65);

  return hslToHex(shiftedH, shiftedS, shiftedL);
}

/**
 * Dynamic Font Contrast Engine (WCAG Luminance calculation).
 */
function getContrastColor(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#FFFFFF';
  const lum = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return lum > 0.55 ? '#000000' : '#FFFFFF';
}

/**
 * Main URL Query Parameter Engine:
 * Reads ?business=...&color=...&pcolor=...&address=... etc.,
 * decodes safely, sanitizes, enforces strict fallbacks, truncates business name (max 25 chars with ...),
 * removes address from navbar/header area entirely, and safely updates the DOM and CSS variables.
 */
function initDynamicLandingPage() {
  if (typeof window === 'undefined') return;

  // Support standard search (?key=val) and hash query params (#home?key=val)
  let searchStr = window.location.search;
  if (!searchStr && window.location.hash && window.location.hash.includes('?')) {
    searchStr = '?' + window.location.hash.split('?')[1];
  }
  const params = new URLSearchParams(searchStr || '');

  // 1. Business Name (?business= or ?name=)
  const rawBusiness = params.get('business') || params.get('name');
  const decodedBusiness = safeDecodeParam(rawBusiness);
  const sanitizedBusiness = sanitizeInput(decodedBusiness);

  // Apply strict fallback if parameter is missing or empty
  const fullBusinessName = sanitizedBusiness && sanitizedBusiness.length > 0 ? sanitizedBusiness : FALLBACK_BUSINESS;

  // Truncate excessively long business names (max 25 characters with ... if exceeded)
  const businessName = truncateBusinessName(fullBusinessName, MAX_BUSINESS_LENGTH);
  window.__DYNAMIC_BRAND_NAME = businessName;
  window.__FULL_BRAND_NAME = fullBusinessName;

  // Header Sub-brand split (e.g. before dashes or colons if applicable)
  let headerBrandName = businessName;
  if (businessName.includes(' - ')) {
    headerBrandName = businessName.split(' - ')[0].trim();
  } else if (businessName.includes(' : ')) {
    headerBrandName = businessName.split(' : ')[0].trim();
  } else if (businessName.includes(':')) {
    headerBrandName = businessName.split(':')[0].trim();
  } else if (businessName.includes(' — ')) {
    headerBrandName = businessName.split(' — ')[0].trim();
  }

  // Update Document Title
  document.title = `${businessName} | Interactive 3D Preview`;

  // Two-tone split for navbar brand title
  const navParts = headerBrandName.split(' ');
  const navFirst = navParts[0] || headerBrandName;
  const navRest = navParts.slice(1).join(' ');

  // Inject clean business title into navbar: #business-title (Max 25 chars, no address)
  const busTitleEl = document.getElementById('business-title');
  if (busTitleEl) {
    if (navRest) {
      busTitleEl.innerHTML = `${escapeHTML(navFirst)} <span class="font-light brand-accent-span" style="color:var(--primary);">${escapeHTML(navRest)}</span>`;
    } else {
      busTitleEl.textContent = headerBrandName;
    }
    busTitleEl.setAttribute('title', fullBusinessName);
  }

  // Update all other .brand-title elements (excluding #business-title to prevent DOM disruption)
  document.querySelectorAll('.brand-title').forEach(el => {
    if (el !== busTitleEl && !busTitleEl?.contains(el)) {
      el.textContent = businessName;
    }
  });

  // Update preloader brand text
  const preloaderBrand = document.getElementById('preloader-brand');
  if (preloaderBrand) {
    preloaderBrand.textContent = businessName;
  }

  // Update Hero Gym Highlight
  const heroHighlight = document.getElementById('hero-brand-highlight');
  if (heroHighlight) {
    heroHighlight.innerHTML = `<span class="brand-title">${escapeHTML(businessName)}</span>`;
  }

  // Update .brand-title-split (except #business-title or its parent)
  document.querySelectorAll('.brand-title-split').forEach(el => {
    if (el === busTitleEl || el.contains(busTitleEl)) return;
    if (navRest) {
      el.innerHTML = `${escapeHTML(navFirst)} <span class="font-light brand-accent-span" style="color:var(--primary);">${escapeHTML(navRest)}</span>`;
    } else {
      el.textContent = headerBrandName;
    }
  });

  // 2. Primary Theme Color (?color= or ?primary=)
  const rawColor = params.get('color') || params.get('primary') || params.get('primaryColor') || params.get('themeColor');
  const hexColor = normalizeHexColor(rawColor, FALLBACK_COLOR);
  const rgb = hexToRgb(hexColor) || { r: 255, g: 30, b: 39 };
  const contrastText = getContrastColor(hexColor);

  // 3. Secondary / Particle Color (?pcolor= or ?particleColor=)
  const rawPColor = params.get('pcolor') || params.get('particleColor') || params.get('secondaryColor') || params.get('secondary');
  let hexPColor = normalizeHexColor(rawPColor, null);
  if (!hexPColor) {
    hexPColor = getComplementarySecondaryColor(hexColor);
  }

  const secRgb = hexToRgb(hexPColor) || { r: 255, g: 140, b: 0 };
  const secContrastText = getContrastColor(hexPColor);

  // Apply CSS Variables to :root
  if (document.documentElement) {
    document.documentElement.style.setProperty('--primary', hexColor);
    document.documentElement.style.setProperty('--primary-color', hexColor);
    document.documentElement.style.setProperty('--accent-color', hexColor);
    document.documentElement.style.setProperty('--primary-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
    document.documentElement.style.setProperty('--contrast-text', contrastText);
    document.documentElement.style.setProperty('--contrast-badge-text', contrastText);

    document.documentElement.style.setProperty('--secondary', hexPColor);
    document.documentElement.style.setProperty('--secondary-color', hexPColor);
    document.documentElement.style.setProperty('--particle-color', hexPColor);
    document.documentElement.style.setProperty('--secondary-rgb', `${secRgb.r}, ${secRgb.g}, ${secRgb.b}`);
    document.documentElement.style.setProperty('--sec-contrast-text', secContrastText);
  }

  // Preloader visual styling
  const preloaderBar = document.getElementById('preloader-bar');
  if (preloaderBar) preloaderBar.style.background = hexColor;
  const preloaderIcon = document.getElementById('preloader-icon-box');
  if (preloaderIcon) {
    preloaderIcon.style.borderColor = hexColor;
    preloaderIcon.style.background = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.12)`;
    const pIcon = preloaderIcon.querySelector('i');
    if (pIcon) pIcon.style.color = hexColor;
  }

  // 4. Dynamic Address & Location (?address= or ?loc= / ?location= or ?city=)
  // FULL address only appears in Sanctuary Headquarters / contact section, NEVER in the top header.
  const rawAddress = params.get('address') || params.get('loc');
  const decodedAddress = safeDecodeParam(rawAddress);
  const sanitizedAddress = sanitizeInput(decodedAddress);

  const rawLoc = params.get('location') || params.get('city');
  const decodedLoc = safeDecodeParam(rawLoc);
  const sanitizedLoc = sanitizeInput(decodedLoc);

  let fullAddress = FALLBACK_ADDRESS;
  let shortLocation = FALLBACK_LOCATION;

  if (sanitizedAddress && sanitizedAddress.length > 0) {
    fullAddress = sanitizedAddress;
    if (sanitizedLoc && sanitizedLoc.length > 0) {
      shortLocation = sanitizedLoc;
    } else {
      const commaParts = fullAddress.split(',');
      if (commaParts.length >= 2) {
        shortLocation = commaParts.slice(-2).join(',').trim();
      } else {
        shortLocation = fullAddress;
      }
    }
  } else if (sanitizedLoc && sanitizedLoc.length > 0) {
    shortLocation = sanitizedLoc;
    fullAddress = `100 Athletic Way, Suite 100, ${shortLocation}`;
  }

  // Inject into Sanctuary Headquarters / contact section ONLY
  const contactAddrEl = document.getElementById('contact-address-text');
  if (contactAddrEl) {
    contactAddrEl.textContent = fullAddress;
  }
  const busAddressEl = document.getElementById('business-address');
  if (busAddressEl) {
    busAddressEl.textContent = fullAddress;
    busAddressEl.setAttribute('title', fullAddress);
  }
  const mapsLink = document.getElementById('contact-maps-link');
  if (mapsLink) {
    mapsLink.href = `https://maps.google.com/?q=${encodeURIComponent(fullAddress)}`;
  }

  // Update brand location and city labels in body/footer
  document.querySelectorAll('.brand-location:not(#business-address), .city-name').forEach(el => {
    el.textContent = shortLocation;
  });
  document.querySelectorAll('.location-full-text').forEach(el => {
    el.innerHTML = `The #1 Gym in <span class="city-name font-bold text-white">${escapeHTML(shortLocation)}</span>`;
  });

  // 5. Dynamic Phone (?phone=)
  const rawPhone = params.get('phone');
  const decodedPhone = safeDecodeParam(rawPhone);
  const sanitizedPhone = sanitizeInput(decodedPhone);
  const cleanPhone = sanitizedPhone || FALLBACK_PHONE;
  const cleanPhoneDigits = cleanPhone.replace(/[^0-9]/g, '') || "14805550198";

  window.__DYNAMIC_PHONE_DISPLAY = cleanPhone;
  window.__DYNAMIC_PHONE_DIGITS = cleanPhoneDigits;

  const phoneLink = document.getElementById('contact-phone-link');
  const phoneText = document.getElementById('contact-phone-text');
  if (phoneText) phoneText.textContent = cleanPhone;
  if (phoneLink) phoneLink.href = `tel:${cleanPhoneDigits}`;

  const waNav = document.getElementById('nav-whatsapp-link');
  if (waNav) waNav.href = `https://wa.me/${cleanPhoneDigits}?text=Hello!%20I%20would%20like%20to%20inquire%20about%20a%20VIP%20membership.`;
  const waMobile = document.getElementById('mobile-whatsapp-link');
  if (waMobile) waMobile.href = `https://wa.me/${cleanPhoneDigits}`;
  const waContact = document.getElementById('contact-whatsapp-link');
  if (waContact) waContact.href = `https://wa.me/${cleanPhoneDigits}?text=Hello!%20I'd%20like%20to%20connect%20with%20your%20coaching%20team.`;

  // 6. Dynamic Email (?email=)
  const rawEmail = params.get('email');
  const decodedEmail = safeDecodeParam(rawEmail);
  const sanitizedEmail = sanitizeInput(decodedEmail);
  const cleanEmail = sanitizedEmail || FALLBACK_EMAIL;
  window.__DYNAMIC_EMAIL = cleanEmail;

  const emailLink = document.getElementById('contact-email-link');
  const emailText = document.getElementById('contact-email-text');
  if (emailText) emailText.textContent = cleanEmail;
  if (emailLink) emailLink.href = `mailto:${cleanEmail}`;

  // 7. Subtitle (?sub=)
  const rawSub = params.get('sub');
  const decodedSub = safeDecodeParam(rawSub);
  const sanitizedSub = sanitizeInput(decodedSub);
  const cleanSub = sanitizedSub || FALLBACK_SUB;

  document.querySelectorAll('.hero-subtitle, #hero-subtitle').forEach(el => {
    el.textContent = cleanSub;
  });

  // 8. Call To Action (?cta=)
  const rawCta = params.get('cta');
  const decodedCta = safeDecodeParam(rawCta);
  const sanitizedCta = sanitizeInput(decodedCta);
  const cleanCta = sanitizedCta || FALLBACK_CTA;

  document.querySelectorAll('.main-cta-btn .cta-text, #hero-cta-btn .cta-text').forEach(el => {
    el.textContent = cleanCta;
  });

  // 9. Particle Engine color update
  if (window.particleEngine && typeof window.particleEngine.setParticleColor === 'function') {
    window.particleEngine.setParticleColor(hexPColor, hexColor);
  }

  // 10. Ambient Backdrop radial vignette
  const ambientVignette = document.getElementById('ambient-vignette');
  if (ambientVignette) {
    ambientVignette.style.background = `radial-gradient(circle at 50% 0%, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.08) 0%, transparent 65%)`;
  }

  // 11. Dynamic theme CSS style tag injection across buttons, badges, highlights, and borders
  let styleOverride = document.getElementById('dynamic-theme-override');
  if (!styleOverride) {
    styleOverride = document.createElement('style');
    styleOverride.id = 'dynamic-theme-override';
    document.head.appendChild(styleOverride);
  }
  styleOverride.textContent = `
    :root {
      --primary: ${hexColor};
      --primary-color: ${hexColor};
      --accent-color: ${hexColor};
      --primary-rgb: ${rgb.r}, ${rgb.g}, ${rgb.b};
      --contrast-text: ${contrastText};
      --contrast-badge-text: ${contrastText};

      --secondary: ${hexPColor};
      --secondary-color: ${hexPColor};
      --particle-color: ${hexPColor};
      --secondary-rgb: ${secRgb.r}, ${secRgb.g}, ${secRgb.b};
      --sec-contrast-text: ${secContrastText};
    }

    /* 1. Primary Buttons & CTAs */
    #hero-cta-btn, .main-cta-btn, #contact-submit-btn, #cart-checkout-btn,
    [onclick*="openMembershipModal"].bg-crimson-600,
    [onclick*="openMembershipModal"].bg-gradient-to-r,
    #membership-modal button[type="submit"],
    #contact-form button[type="submit"] {
      background: var(--primary) !important;
      background-color: var(--primary) !important;
      color: var(--contrast-text) !important;
      border: 1px solid rgba(255, 255, 255, 0.15) !important;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.45) !important;
      text-shadow: none !important;
    }
    #hero-cta-btn *, .main-cta-btn *, #contact-submit-btn *, #cart-checkout-btn *,
    [onclick*="openMembershipModal"].bg-crimson-600 *,
    [onclick*="openMembershipModal"].bg-gradient-to-r *,
    #membership-modal button[type="submit"] *,
    #contact-form button[type="submit"] * {
      color: var(--contrast-text) !important;
    }
    #hero-cta-btn:hover, .main-cta-btn:hover, #contact-submit-btn:hover, #cart-checkout-btn:hover {
      filter: brightness(1.08);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.6) !important;
    }

    /* 2. Badges */
    #cart-counter-badge, #mobile-cart-badge, .popular-tier-badge, .product-badge {
      background-color: var(--primary) !important;
      color: var(--contrast-text) !important;
    }

    /* 3. Highlights & Typography */
    .highlight, #hero-brand-highlight, .brand-accent-span, .text-primary-accent {
      color: var(--primary) !important;
      -webkit-text-fill-color: var(--primary) !important;
      text-shadow: none !important;
      filter: none !important;
    }
    .text-crimson-400, .text-crimson-500, .text-crimson-600 {
      color: var(--primary) !important;
    }

    /* 4. Active Navigation and Filter Buttons */
    .nav-link.bg-crimson-600, .gallery-filter-btn.active, .shop-filter-btn.active, .gender-btn.active,
    #billing-monthly-btn.bg-crimson-600, #billing-annual-btn.bg-crimson-600 {
      background: var(--primary) !important;
      background-color: var(--primary) !important;
      color: var(--contrast-text) !important;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.45) !important;
    }
    .nav-link.bg-crimson-600 *, .gallery-filter-btn.active *, .shop-filter-btn.active *, .gender-btn.active *,
    #billing-monthly-btn.bg-crimson-600 *, #billing-annual-btn.bg-crimson-600 * {
      color: var(--contrast-text) !important;
    }

    /* 5. Borders */
    .border-crimson-500, .border-crimson-600, .border-crimson-800, [class*="border-crimson"] {
      border-color: var(--primary) !important;
    }
    .hover\\:border-crimson-500:hover {
      border-color: var(--primary) !important;
    }
    .focus\\:border-crimson-500:focus {
      border-color: var(--primary) !important;
    }
    .focus\\:ring-crimson-500:focus {
      --tw-ring-color: var(--primary) !important;
    }
    #toast {
      border-color: rgba(var(--primary-rgb), 0.4) !important;
    }
    #toast-icon {
      background-color: var(--primary) !important;
      color: var(--contrast-text) !important;
    }
    input[type=range] {
      accent-color: var(--primary) !important;
    }
    ::selection {
      background-color: var(--primary) !important;
      color: var(--contrast-text) !important;
    }

    /* 6. Secondary Accent Styling */
    #hero-status-badge {
      border: 1px solid var(--secondary) !important;
      color: var(--secondary) !important;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.4) !important;
    }
    .stat-unit {
      color: var(--secondary) !important;
    }
    #cyber-grid {
      background-size: 55px 55px;
      background-image: 
        linear-gradient(to right, rgba(${secRgb.r}, ${secRgb.g}, ${secRgb.b}, 0.10) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(${secRgb.r}, ${secRgb.g}, ${secRgb.b}, 0.10) 1px, transparent 1px);
      mask-image: radial-gradient(circle at 50% 35%, black 40%, transparent 85%);
      -webkit-mask-image: radial-gradient(circle at 50% 35%, black 40%, transparent 85%);
    }
    .secondary-ghost-btn:hover {
      border-color: var(--primary) !important;
    }
  `;

  // 12. Ensure Three.js Canvas scales correctly with updated layout
  if (typeof window.__resizeThreeCanvas === 'function') {
    window.__resizeThreeCanvas();
  }
}

// Module export for Node/Jest unit testing environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    FALLBACK_BUSINESS,
    FALLBACK_ADDRESS,
    FALLBACK_LOCATION,
    FALLBACK_COLOR,
    FALLBACK_PCOLOR,
    FALLBACK_PHONE,
    FALLBACK_EMAIL,
    FALLBACK_SUB,
    FALLBACK_CTA,
    MAX_BUSINESS_LENGTH,
    safeDecodeParam,
    sanitizeInput,
    escapeHTML,
    truncateBusinessName,
    normalizeHexColor,
    hexToRgb,
    hslToHex,
    getComplementarySecondaryColor,
    getContrastColor,
    initDynamicLandingPage
  };
}

// Attach globally in browser
if (typeof window !== 'undefined') {
  window.safeDecodeParam = safeDecodeParam;
  window.sanitizeInput = sanitizeInput;
  window.escapeHTML = escapeHTML;
  window.truncateBusinessName = truncateBusinessName;
  window.normalizeHexColor = normalizeHexColor;
  window.initDynamicLandingPage = initDynamicLandingPage;
}
