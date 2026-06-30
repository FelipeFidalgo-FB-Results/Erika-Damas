import { PROFILE_NAMES, PROFILES } from './quiz-data.js';

const WHATSAPP_NUMBER = '5512992531212';
const SUBMISSION_SOURCE = 'vercel-quiz-leads-v1';

export function normalizePhone(value) {
  return String(value || '').replace(/\D/g, '');
}

export function validateBrazilianMobilePhone(value) {
  const digits = normalizePhone(value);
  const local = digits.length === 13 && digits.startsWith('55') ? digits.slice(2) : digits;
  return {
    ok: /^[1-9]{2}9\d{8}$/.test(local),
    normalized: local || digits,
  };
}

export function validateLeadForm(form) {
  if (!form.nome.trim()) return 'Informe seu nome.';
  if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return 'Informe um e-mail válido.';
  if (!validateBrazilianMobilePhone(form.telefone).ok) {
    return 'Confira seu telefone/WhatsApp. Digite com DDD, por exemplo: (12) 99999-9999.';
  }
  return '';
}

export function createLeadId() {
  return `edq_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function getResultTitle(profileNumber) {
  const profile = PROFILES[profileNumber];
  return profile ? `${profile.title} ${profile.titleEm}`.trim() : '';
}

export function buildWhatsAppMessage(profileNumber) {
  const profileName = PROFILE_NAMES[profileNumber] || PROFILE_NAMES[5];
  return `Olá! Fiz o quiz da Dra. Erika e meu resultado foi: ${profileName}. Quero entender como funciona o acompanhamento.`;
}

export function buildWhatsAppLink(profileNumber) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildWhatsAppMessage(profileNumber))}`;
}

export function getUtmParams(search = globalThis.location?.search || '') {
  const params = new URLSearchParams(search);
  const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid'];
  return Object.fromEntries(keys.map((key) => [key, params.get(key) || '']).filter(([, value]) => value));
}

export function buildJourneyParams(contentName) {
  return {
    content_name: contentName,
    content_category: 'quiz_post_result',
  };
}

export function buildLeadPayload({ form, answers, profileNumber, leadId, context = {} }) {
  const browserContext = {
    createdAt: new Date().toISOString(),
    pageUrl: globalThis.location?.href || '',
    referrer: globalThis.document?.referrer || '',
    userAgent: globalThis.navigator?.userAgent || '',
    utm: getUtmParams(),
    ...context,
  };

  return {
    created_at: browserContext.createdAt,
    lead_id: leadId || createLeadId(),
    nome: form.nome.trim(),
    email: form.email.trim().toLowerCase(),
    telefone: validateBrazilianMobilePhone(form.telefone).normalized,
    resultado_id: String(profileNumber || ''),
    resultado_titulo: getResultTitle(profileNumber),
    perfil: PROFILE_NAMES[profileNumber] || '',
    whatsapp_url: buildWhatsAppLink(profileNumber),
    answers,
    utm: browserContext.utm,
    page_url: browserContext.pageUrl,
    referrer: browserContext.referrer,
    user_agent: browserContext.userAgent,
    submitted_from: SUBMISSION_SOURCE,
    consent_lgpd: true,
  };
}

export function computeProfile(answers = {}) {
  const scores = { E: 0, F: 0, H: 0, T: 0 };
  const add = (dimension, points) => { scores[dimension] += points; };

  if (['B', 'C', 'D'].includes(answers.p1)) add('H', 1);
  if (['A', 'B', 'C'].includes(answers.p2)) add('E', 1);
  if (answers.p2 === 'D') add('E', 2);
  if (answers.p3 === 'A') add('E', 1);
  if (answers.p4 === 'A') add('F', 2);
  if (['B', 'C'].includes(answers.p4)) add('F', 1);
  if (answers.p5 === 'A') add('F', 2);
  if (answers.p5 === 'B') add('F', 1);
  if (answers.p6 === 'A') { add('F', 1); add('H', 1); }
  if (answers.p6 === 'B') add('F', 1);
  if (answers.p7 === 'B') add('H', 1);
  if (answers.p7 === 'C') { add('F', 1); add('H', 1); }
  if (answers.p7 === 'D') add('F', 1);
  if (['B', 'C', 'D'].includes(answers.p8)) add('H', 2);
  if (answers.p9 === 'A') add('E', 1);
  if (answers.p9 === 'B') { add('E', 1); add('T', 1); }
  if (answers.p9 === 'C') add('T', 2);
  if (answers.p9 === 'D') { add('E', 1); add('T', 1); }
  if (answers.p10 === 'B') add('E', 1);
  if (answers.p10 === 'D') add('T', 2);
  if (answers.p10 === 'E') { add('E', 1); add('T', 1); }

  const [winner, runnerUp] = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (winner[1] < 4 || winner[1] - runnerUp[1] < 2) return 5;
  return { E: 1, F: 2, H: 3, T: 4 }[winner[0]] || 5;
}

