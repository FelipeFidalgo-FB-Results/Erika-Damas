export const PIXEL_EVENTS = [
  'PageView',
  'Lead',
  'Contact',
  'QuizResultViewed',
  'QuizBridgeStarted',
  'QuizDoctorSectionViewed',
  'QuizWhatsAppClick',
];

export function trackPixel(eventName, params = {}) {
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    window.fbq('track', eventName, params);
  }
}

export function trackCustomPixel(eventName, params = {}) {
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    window.fbq('trackCustom', eventName, params);
  }
}

