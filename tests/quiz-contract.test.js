import assert from 'node:assert/strict';
import test from 'node:test';

import { PROFILE_NAMES, QUESTIONS } from '../src/quiz-data.js';
import {
  buildJourneyParams,
  buildLeadPayload,
  computeProfile,
  formatLeadCreatedAt,
  validateBrazilianMobilePhone,
} from '../src/quiz-core.js';
import { PIXEL_EVENTS } from '../src/tracking.js';

test('preserves the twelve-question quiz and CRM profile labels', () => {
  assert.equal(QUESTIONS.length, 12);
  assert.deepEqual(PROFILE_NAMES, {
    1: 'Resistência Metabólica',
    2: 'Desregulação Metabólica',
    3: 'Desequilíbrio Hormonal',
    4: 'Protocolo Incompleto',
    5: 'Ponto de Partida',
  });
});

test('preserves representative scoring outcomes and neutral fallback', () => {
  assert.equal(computeProfile({}), 5);
  assert.equal(computeProfile({ p2: 'D', p3: 'A', p9: 'A' }), 1);
  assert.equal(computeProfile({ p4: 'A', p5: 'A' }), 2);
  assert.equal(computeProfile({ p1: 'B', p6: 'A', p8: 'B' }), 3);
  assert.equal(computeProfile({ p9: 'C', p10: 'D' }), 4);
});

test('normalizes valid Brazilian mobile numbers', () => {
  assert.deepEqual(validateBrazilianMobilePhone('(12) 99999-9999'), {
    ok: true,
    normalized: '12999999999',
  });
  assert.deepEqual(validateBrazilianMobilePhone('+55 12 99999-9999'), {
    ok: true,
    normalized: '12999999999',
  });
  assert.equal(validateBrazilianMobilePhone('1234').ok, false);
});

test('formats lead creation time in Sao Paulo for the CRM sheet', () => {
  assert.equal(
    formatLeadCreatedAt(new Date('2026-06-30T22:53:00.000Z')),
    '30/06/2026 às 19h53',
  );
});

test('builds CRM payload with profile name rather than profile number', () => {
  const payload = buildLeadPayload({
    form: { nome: '  Maria  ', email: 'MARIA@EXAMPLE.COM ', telefone: '(12) 99999-9999' },
    answers: { p1: 'B' },
    profileNumber: 3,
    leadId: 'lead_test',
    context: {
      createdAt: '2026-06-30T12:00:00.000Z',
      pageUrl: 'https://erika-damas-quiz.vercel.app/',
      referrer: '',
      userAgent: 'test',
      utm: { utm_source: 'meta' },
    },
  });

  assert.equal(payload.nome, 'Maria');
  assert.equal(payload.email, 'maria@example.com');
  assert.equal(payload.telefone, '12999999999');
  assert.equal(payload.perfil, 'Desequilíbrio Hormonal');
  assert.equal(payload.resultado_id, '3');
  assert.equal(payload.created_at, '30/06/2026 às 09h00');
});

test('keeps journey tracking privacy-safe', () => {
  const params = buildJourneyParams('Quiz Dra Erika Resultado');
  assert.deepEqual(params, {
    content_name: 'Quiz Dra Erika Resultado',
    content_category: 'quiz_post_result',
  });
  assert.equal('resultado_id' in params, false);
  assert.equal('resultado_titulo' in params, false);
  assert.equal('lead_id' in params, false);
  assert.deepEqual(PIXEL_EVENTS, [
    'PageView',
    'Lead',
    'Contact',
    'QuizResultViewed',
    'QuizBridgeStarted',
    'QuizDoctorSectionViewed',
    'QuizWhatsAppClick',
  ]);
});

