export const SELECTED_SITES_BASE_URL =
  'https://action-shift-one-seat-v2.never86-d-9722.chatgpt.site';

export const SELECTED_SITES_CONTACT_URL = `${SELECTED_SITES_BASE_URL}/contact`;

export const SELECTED_SITES_CHECK_URLS = {
  invoices: `${SELECTED_SITES_BASE_URL}/check/invoices`,
  labor: `${SELECTED_SITES_BASE_URL}/check/labor`,
  menu: `${SELECTED_SITES_BASE_URL}/check/menu`,
} as const;
