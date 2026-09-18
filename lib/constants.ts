// Single source of truth for public-facing brand info.
// Used in JSON-LD, email templates, contact page, and the footer.
//
// Keep this in sync with /impressum (the legal page), since the Impressum
// is the legally binding version and must reflect the real values.

export const SITE_NAME = "Bachata Vienna";

// Public email shown to users (contact page, email footers, JSON-LD).
// This is the address users can actually reach the instructor at.
export const PUBLIC_CONTACT_EMAIL = "dusaliev.marat@gmail.com";

// Social handles
export const INSTAGRAM_HANDLE = "_maratikooo_";
export const INSTAGRAM_URL = `https://instagram.com/${INSTAGRAM_HANDLE}`;
export const YOUTUBE_HANDLE = "bachatavienna";
export const YOUTUBE_URL = `https://youtube.com/@${YOUTUBE_HANDLE}`;
export const WHATSAPP_NUMBER = "+4366565174122";
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, "")}`;

export const CITY = "Vienna";
export const COUNTRY = "Austria";
