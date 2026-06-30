import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ASSETS, prefetchAsset } from './assets.js';
import { PROFILES, QUESTIONS } from './quiz-data.js';
import { buildLeadPayload, buildWhatsAppLink, computeProfile, createLeadId, getResultTitle, getUtmParams, validateBrazilianMobilePhone, validateLeadForm } from './quiz-core.js';
import { trackCustomPixel, trackPixel } from './tracking.js';
import './styles.css';

const QUIZ_CONFIG = { images: ASSETS };





const LOADING_MESSAGES = [
  'Organizando suas respostas...',
  'Identificando padrões predominantes...',
  'Preparando sua leitura personalizada...',
];

const PROFILE_IMAGE_KEYS = { 1: 'A', 2: 'B', 3: 'C', 4: 'D', 5: 'E' };

const QUIZ_LEAD_ENDPOINT = window.QUIZ_LEAD_ENDPOINT || '/api/lead';
const QUIZ_SUBMISSION_SOURCE = 'vercel-quiz-leads-v1';
const RESULT_LOADING_DELAY_MS = 900;









const RESULT_PROFILE_TRANSITIONS = {
  1: 'Quando existe esforço, mas a resposta continua abaixo do esperado, o mais importante é investigar o contexto antes de repetir outra estratégia.',
  2: 'Quando fome, energia e sono dificultam a constância, olhar o conjunto pode ser mais útil do que aumentar a restrição e a cobrança.',
  3: 'Quando o corpo parece mudar junto com uma nova fase da vida, esses sinais precisam ser organizados sem conclusões precipitadas.',
  4: 'Quando já existiram tratamentos e tentativas anteriores, compreender esse histórico é parte essencial do próximo passo.',
  5: 'Quando não existe um padrão predominante, uma consulta bem conduzida ajuda a transformar dúvidas dispersas em perguntas mais claras.',
};

const DOCTOR_BRIDGE_COPY = {
  introTitle: 'Prazer, eu sou a Dra. Erika Damas',
  introLead: 'Sou médica e atuo com emagrecimento médico, saúde da mulher, menopausa e terapias hormonais.',
  introParagraphs: [
    'Ao longo do atendimento, acompanho mulheres que tentam emagrecer, mas sentem que o corpo não responde como antes.',
    'Muitas também convivem com insônia, fogachos, queda de libido, ansiedade, queda de cabelo, inchaço, baixa energia ou mudanças que parecem ter começado junto de uma nova fase hormonal.',
    'Meu trabalho começa por escutar e organizar esse contexto.',
    'Em vez de olhar apenas para o peso ou para uma queixa isolada, eu procuro entender sua história, sua rotina, seus sintomas, o que você já tentou, como está seu sono, sua alimentação, seus exames disponíveis e o que pode fazer sentido investigar a partir disso.',
  ],
  formationItems: [
    'Graduação em Medicina',
    'Pós-graduação em Gastroenterologia',
    'Pós-graduação em Medicina de Família',
    'Pós-graduação em Medicina Estética',
    'Formação complementar em emagrecimento e terapias hormonais',
    'Capacitação em Endolaser Corporal',
  ],
  consultationTitle: 'Como funciona a minha consulta e o meu acompanhamento',
  consultationParagraphs: [
    'Na consulta, eu aprofundo as informações que o quiz apenas conseguiu sinalizar.',
    'O objetivo é entender sua história com mais clareza, identificar quais pontos precisam ser investigados e explicar quais possibilidades de acompanhamento fazem sentido para o seu caso.',
    'Quando indicado, o acompanhamento pode integrar consulta médica, bioimpedância, estratégia nutricional com nutricionista e outras condutas definidas de forma individualizada.',
    'Esse processo não começa por uma promessa pronta.',
    'Começa por compreender o que está acontecendo com você e, a partir disso, construir um caminho mais seguro para as próximas decisões.',
    'Se o resultado do quiz fez sentido para você, entre em contato para entender como funciona a consulta e quais possibilidades de acompanhamento podem ser consideradas no seu caso.',
  ],
  consultationSteps: [
    'Entender sua história',
    'Investigar pontos importantes',
    'Discutir possibilidades de acompanhamento',
  ],
  ctaTitle: 'Quero entender como funciona o acompanhamento',
  ctaSupport: 'Você falará com a equipe pelo WhatsApp. Ela explicará como funciona a consulta e as possibilidades de acompanhamento.',
  faqItems: [
    { question: 'O atendimento pode ser online?', answer: 'Sim. O atendimento pode ser presencial em São José dos Campos ou online.' },
    { question: 'Preciso ter exames antes da consulta?', answer: 'Não. Se você já tiver exames recentes, poderá apresentá-los. A necessidade de novos exames é avaliada durante a consulta.' },
    { question: 'Como funciona a consulta?', answer: 'A consulta organiza sua história, sintomas, rotina, objetivos, tratamentos anteriores e exames disponíveis para definir o que merece ser investigado.' },
    { question: 'O acompanhamento pode incluir nutricionista?', answer: 'Quando indicado, o acompanhamento pode integrar estratégia nutricional com nutricionista e outras condutas individualizadas.' },
  ],
};





function preloadResultImage(profileNumber) {
  const imgKey = PROFILE_IMAGE_KEYS[profileNumber];
  const img = imgKey ? QUIZ_CONFIG.images.results[imgKey] : null;
  if (!img || !img.src) return;
  const preload = new Image();
  preload.src = img.src;
}











async function submitLead(payload) {
  if (!QUIZ_LEAD_ENDPOINT) {
    throw new Error('Endpoint de captura ainda não configurado.');
  }
  try {
    const response = await fetch(QUIZ_LEAD_ENDPOINT, {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json;charset=utf-8' },
        body: JSON.stringify(payload),
    });
    const result = await response.json();

    if (!response.ok || !result || result.ok !== true) {
      throw new Error('Lead confirmation failed');
    }

    return result;
  } catch (error) {
    throw new Error('Não conseguimos salvar seus dados agora. Confira sua conexão e tente novamente.');
  }
}


/* ───────── PROFILE LOGIC ───────── */

/* ─────────────────────────────────────────────
   SCENE — bg image + dark overlay wrapper
   ───────────────────────────────────────────── */
function Scene({ imageKey, heavy, children, direction }) {
  const img = QUIZ_CONFIG.images[imageKey];
  const cls = direction === 'back' ? 'scene-enter-back' : 'scene-enter';
  return (
    <div className={"scene " + cls} key={imageKey}>
      <div
        className={"scene-bg" + (heavy ? ' heavy' : '')}
        style={{ backgroundImage: `url("${img.src}")` }}
        role="img"
        aria-label={img.alt}
      ></div>
      <div className="scene-grain" aria-hidden="true"></div>
      <div className="scene-content">{children}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SPLASH / INTRO
   ───────────────────────────────────────────── */
function Splash({ onStart }) {
  return (
    <Scene imageKey="intro" heavy>
      <div className="splash-top topbar">
        <div className="brand-mark">Dra. Erika Damas</div>
        <div className="splash-creds">CRM/RJ 82965-0<br/>CRM/SP 146601</div>
      </div>

      <div className="splash-body">
        <div className="eyebrow gold splash-eyebrow">
          <span className="ornament-line"></span>Quiz de contexto · 12 perguntas
        </div>
        <h1 className="serif-display splash-title">O que pode estar dificultando seu <em>emagrecimento?</em></h1>
        <p className="splash-lede">
          Responda 12 perguntas curtas sobre seu contexto, seus sinais e seu histórico para receber uma leitura educativa e personalizada.
        </p>

        <div className="splash-cta">
          <button className="btn btn-primary" onClick={onStart}>
            Começar o quiz
            <span className="btn-arrow">→</span>
          </button>
          <div className="splash-meta">
            <span><span className="dot"></span>3 minutos</span>
            <span><span className="dot"></span>Leitura personalizada</span>
            <span><span className="dot"></span>Resultado na hora</span>
          </div>
        </div>
      </div>

      <div className="footer-note">
        Conteúdo educativo · Não substitui consulta médica
      </div>
    </Scene>
  );
}

/* ─────────────────────────────────────────────
   QUESTION SCREEN
   ───────────────────────────────────────────── */
function QuestionScreen({ q, index, total, onSelect, onBack, direction }) {
  const [selectedKey, setSelectedKey] = useState(null);
  const pct = ((index + 1) / total) * 100;

  // reset selection on question change
  useEffect(() => { setSelectedKey(null); }, [q.id]);

  const handleClick = (key) => {
    if (selectedKey) return;
    setSelectedKey(key);
    // haptic
    if (navigator.vibrate) try { navigator.vibrate(15); } catch(e) {}
    setTimeout(() => onSelect(key), 520);
  };

  return (
    <Scene imageKey={q.image} heavy direction={direction}>
      <div className="topbar">
        <button className="topbar-back" onClick={onBack} aria-label="Voltar">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="10 13 5 8 10 3"></polyline>
          </svg>
        </button>
        <div className="brand-mark">Dra. Erika Damas</div>
        <div style={{width: 36}}></div>
      </div>

      <div className="q-progress-wrap">
        <div className="q-progress-label">
          <span>Pergunta {index + 1}</span>
          <span className="count"><b>{String(index + 1).padStart(2,'0')}</b> / {String(total).padStart(2,'0')}</span>
        </div>
        <div className="q-progress-bar">
          <div className="q-progress-fill" style={{ width: pct + '%' }}></div>
        </div>
      </div>

      <div className="q-body">
        <div className="q-copy-band">
          <h2 className="serif-display q-title">{q.title}</h2>
          {q.subtext && <p className="q-subtext">{q.subtext}</p>}
        </div>

        <div className="options" role="radiogroup">
          {q.options.map((opt) => {
            const isSelected = selectedKey === opt.key;
            const isDimmed = !!selectedKey && !isSelected;
            return (
              <button
                key={opt.key}
                className={"option" + (isSelected ? ' selected' : '') + (isDimmed ? ' dimmed' : '')}
                role="radio"
                aria-checked={isSelected}
                onClick={() => handleClick(opt.key)}
                disabled={!!selectedKey}
              >
                <span className="marker">{opt.key}</span>
                <span className="text">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </Scene>
  );
}

/* ─────────────────────────────────────────────
   ANALYSIS LOADER
   ───────────────────────────────────────────── */
function Analysis() {
  const [msgIdx, setMsgIdx] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setMsgIdx(i => (i + 1) % LOADING_MESSAGES.length);
        setFading(false);
      }, 400);
    }, 1400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="scene analysis scene-enter">
      <div className="scene-grain" aria-hidden="true"></div>
      <div className="scene-content analysis-inner">
        <div className="analysis-rings">
          <div className="ring3"></div>
          <div className="core"></div>
        </div>
        <h2 className="analysis-title">Analisando suas <em>respostas...</em></h2>
        <p className="analysis-msg" style={{ opacity: fading ? 0 : 0.78 }}>{LOADING_MESSAGES[msgIdx]}</p>
        <div className="analysis-bar"><div className="analysis-bar-fill"></div></div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   STORIES RESULT
   ───────────────────────────────────────────── */


function StoriesResult({ profileNumber, onRestart, leadPayload }) {
  const p = PROFILES[profileNumber];
  const imgKey = PROFILE_IMAGE_KEYS[profileNumber];
  const img = QUIZ_CONFIG.images.results[imgKey];
  const waLink = buildWhatsAppLink(profileNumber);
  const bridgeCopy = DOCTOR_BRIDGE_COPY;
  const profileTransition = RESULT_PROFILE_TRANSITIONS[profileNumber] || RESULT_PROFILE_TRANSITIONS[5];

  const resultTrackedRef = useRef(false);
  const observedEventsRef = useRef(new Set());
  const bridgeSectionRef = useRef(null);
  const doctorSectionRef = useRef(null);

  const buildJourneyParams = (contentName) => ({
    content_name: contentName,
    content_category: 'quiz_post_result',
  });

  useEffect(() => {
    if (resultTrackedRef.current) return;
    resultTrackedRef.current = true;
    trackCustomPixel('QuizResultViewed', buildJourneyParams('Quiz Dra Erika Resultado'));
  }, [profileNumber, leadPayload]);

  useEffect(() => {
    const trackSection = (eventName, contentName) => {
      if (observedEventsRef.current.has(eventName)) return;
      observedEventsRef.current.add(eventName);

      if (eventName === 'QuizBridgeStarted') {
        trackCustomPixel('QuizBridgeStarted', buildJourneyParams(contentName));
      }
      if (eventName === 'QuizDoctorSectionViewed') {
        trackCustomPixel('QuizDoctorSectionViewed', buildJourneyParams(contentName));
      }
    };

    const targets = [
      { element: bridgeSectionRef.current, eventName: 'QuizBridgeStarted', contentName: 'Quiz Dra Erika Ponte Pos Quiz' },
      { element: doctorSectionRef.current, eventName: 'QuizDoctorSectionViewed', contentName: 'Quiz Dra Erika Secao Medica' },
    ].filter(item => item.element);

    if (!targets.length) return;

    if (typeof IntersectionObserver === 'undefined') {
      targets.forEach(item => trackSection(item.eventName, item.contentName));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const target = targets.find(item => item.element === entry.target);
        if (!target) return;
        trackSection(target.eventName, target.contentName);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.35 });

    targets.forEach(item => observer.observe(item.element));
    return () => observer.disconnect();
  }, [profileNumber, leadPayload]);

  const handleContact = () => {
    trackCustomPixel('QuizWhatsAppClick', buildJourneyParams('Quiz Dra Erika WhatsApp'));
    trackPixel('Contact', {
      content_name: 'Quiz Dra Erika WhatsApp',
      content_category: 'quiz_post_result',
    });
  };

  return (
    <div className="scroll-result" key={"scroll-result-" + profileNumber}>
      <section className="scroll-result-hero">
        <div className="scroll-result-bg" style={{ backgroundImage: `url("${img.src}")` }} role="img" aria-label={img.alt}></div>
        <div className="scene-grain" aria-hidden="true"></div>
        <div className="scroll-result-topbar">
          <div className="brand-mark">Dra. Erika Damas</div>
          <button className="scroll-result-close" onClick={onRestart} aria-label="Refazer o quiz">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="3" x2="13" y2="13" /><line x1="13" y1="3" x2="3" y2="13" />
            </svg>
          </button>
        </div>
        <div className="scroll-result-hero-inner">
          <div className="scroll-result-kicker">Seu resultado</div>
          <h1 className="scroll-result-profile-name">{p.subtitle}</h1>
          <p className="scroll-result-conclusion">{p.title} <em>{p.titleEm}</em></p>
          <p className="scroll-result-tagline">{p.tagline}</p>
        </div>
      </section>

      <main className="scroll-result-body">
        {p.chapters.map((chapter, index) => {
          const chapterClasses = [
            'result-section',
            'result-story-chapter',
            index % 2 === 0 ? 'result-story-chapter--cream' : 'result-story-chapter--terra',
            chapter.support ? 'result-story-chapter--support' : '',
            chapter.heading.length > 72 ? 'result-story-chapter--long-title' : '',
          ].filter(Boolean).join(' ');

          return (
            <section
              className={chapterClasses}
              key={chapter.heading}
              ref={index === 0 ? bridgeSectionRef : null}
            >
              <h2>{chapter.heading}</h2>
              {chapter.paragraphs.map((paragraph, paragraphIndex) => <p key={paragraphIndex}>{paragraph}</p>)}
            </section>
          );
        })}

        <section className="result-section result-story-chapter result-story-chapter--terra result-story-chapter--support result-positioning-block">
          <h2>O acompanhamento mais completo de São José dos Campos</h2>
          <p>Acompanhamento médico contínuo com ajuste de dose, nutricionista inclusa, injetáveis complementares, bioimpedância e presença semanal no consultório.</p>
          <p>Eu acompanho você pessoalmente em cada etapa.</p>
        </section>

        <section className="result-section result-section--cream result-profile-transition">
          <h3>O resultado aponta uma direção. A consulta organiza o caminho.</h3>
          <p>{profileTransition}</p>
        </section>

        <section className="result-section result-section--cream result-doctor-bridge" ref={doctorSectionRef}>
          <div className="doctor-photo-card doctor-photo-only">
            <img className="doctor-photo" src={ASSETS.doctor.src} alt="Dra. Erika Damas" />
          </div>
          <div className="doctor-bridge-copy">
            <div className="result-section-label">Quem conduz</div>
            <h3 className="doctor-title-line">
              <span>Prazer, eu sou a</span>
              <span>Dra. Erika Damas</span>
            </h3>
            <p className="doctor-intro-lead">{bridgeCopy.introLead}</p>
            {bridgeCopy.introParagraphs.map((para, index) => <p key={index}>{para}</p>)}
            <div className="doctor-formation-grid" aria-label="Formação da Dra. Erika Damas">
              {bridgeCopy.formationItems.map((item, index) => (
                <div className="doctor-formation-item" key={index}>
                  <span className="doctor-formation-bullet" aria-hidden="true"></span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="result-section result-section--terra result-consultation result-consultation-intro">
          <h3>{bridgeCopy.consultationTitle}</h3>
          {bridgeCopy.consultationParagraphs.slice(0, 3).map((para, index) => <p key={index}>{para}</p>)}
          <div className="consultation-steps" aria-label="Etapas da consulta e acompanhamento">
            {bridgeCopy.consultationSteps.map((item, index) => (
              <div className="consultation-step" key={index}>
                <span>{index + 1}</span>
                <strong>{item}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="result-section result-section--cream result-consultation-closing">
          <h3>{bridgeCopy.consultationParagraphs[3]}</h3>
          {bridgeCopy.consultationParagraphs.slice(4).map((para, index) => <p key={index}>{para}</p>)}
        </section>

        <section className="result-section result-section--terra result-cta-band">
          <div className="whatsapp-bridge-cta">
            <div className="result-cta-label">Próximo passo</div>
            <h3>{bridgeCopy.ctaTitle}</h3>
            <p>{bridgeCopy.ctaSupport}</p>
            <a href={waLink} target="_blank" rel="noopener" className="btn btn-whatsapp" onClick={handleContact}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              <span>Entrar em contato</span>
            </a>
            <p className="whatsapp-support-copy">A mensagem já vai com o seu resultado para facilitar a conversa.</p>
          </div>
        </section>

        <section className="result-section result-section--cream result-faq">
          <div className="result-section-label">Dúvidas frequentes</div>
          <h3 className="result-faq-title">Antes de conversar com a equipe</h3>
          <div className="faq-list">
            {bridgeCopy.faqItems.map((item, index) => (
              <details className="faq-item" key={index}>
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <button className="result-restart" onClick={onRestart}>Refazer o quiz</button>
      </main>
    </div>
  );
}



function LeadCapture({ answers, profileNumber, onBack, onSuccess }) {
  const [form, setForm] = useState({ nome: '', email: '', telefone: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const pendingLeadIdRef = useRef('');

  const update = (field, value) => {
    setForm(current => ({ ...current, [field]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validation = validateLeadForm(form);
    if (validation) {
      setError(validation);
      return;
    }
    setSubmitting(true);
    try {
      const leadId = pendingLeadIdRef.current || createLeadId();
      pendingLeadIdRef.current = leadId;
      const payload = buildLeadPayload({ form, answers, profileNumber, leadId });
      await submitLead(payload);
      pendingLeadIdRef.current = '';
      trackPixel('Lead', {
        content_name: 'Quiz Dra Erika',
        content_category: 'quiz',
      });
      onSuccess(payload);
    } catch (err) {
      setError(err && err.message ? err.message : 'Não foi possível enviar seus dados. Tente novamente.');
      setSubmitting(false);
    }
  };

  return (
    <Scene imageKey="intro" heavy direction="fwd">
      <div className="topbar">
        <button className="topbar-back" onClick={onBack} aria-label="Voltar" disabled={submitting}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="10 13 5 8 10 3"></polyline>
          </svg>
        </button>
        <div className="brand-mark">Dra. Erika Damas</div>
        <div style={{width: 36}}></div>
      </div>

      <div className="lead-card">
        <div className="eyebrow gold">
          <span className="ornament-line"></span>Seu resultado está pronto
        </div>
        <h2 className="serif-display lead-title">Para receber sua análise, preencha seus dados.</h2>

        <form className="lead-form" onSubmit={handleSubmit}>
          <label className="lead-field">
            <span>Nome</span>
            <input value={form.nome} onChange={(e) => update('nome', e.target.value)} autoComplete="name" placeholder="Seu nome" disabled={submitting} />
          </label>
          <label className="lead-field">
            <span>E-mail</span>
            <input value={form.email} onChange={(e) => update('email', e.target.value)} autoComplete="email" inputMode="email" placeholder="voce@email.com" disabled={submitting} />
          </label>
          <label className="lead-field">
            <span>Telefone/WhatsApp</span>
            <input value={form.telefone} onChange={(e) => update('telefone', e.target.value)} autoComplete="tel" inputMode="tel" placeholder="(12) 99999-9999" disabled={submitting} />
          </label>
          {error && <div className="lead-error">{error}</div>}
          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? 'Enviando...' : 'Ver meu resultado'}
            <span className="btn-arrow">→</span>
          </button>
          <p className="lead-hint">Conteúdo educativo. Não substitui consulta médica.</p>
        </form>
      </div>
    </Scene>
  );
}

/* ─────────────────────────────────────────────
   APP
   ───────────────────────────────────────────── */
function App() {
  const isLocalPreview = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  const requestedPreview = Number(new URLSearchParams(window.location.search).get('preview_profile'));
  const previewProfile = isLocalPreview && requestedPreview >= 1 && requestedPreview <= 5 ? requestedPreview : null;
  const [step, setStep] = useState(previewProfile ? 'result' : 'hero');
  const [answers, setAnswers] = useState({});
  const [profile, setProfile] = useState(previewProfile);
  const [leadPayload, setLeadPayload] = useState(null);
  const [direction, setDirection] = useState('fwd');
  const total = QUESTIONS.length;

  const start = () => { prefetchAsset(ASSETS.q1); setDirection('fwd'); setStep(0); };

  const handleAnswer = (key) => {
    if (typeof step !== 'number') return;
    const q = QUESTIONS[step];
    if (step < total - 1) prefetchAsset(ASSETS[QUESTIONS[step + 1].image]);
    const newAnswers = { ...answers, [q.id]: key };
    setAnswers(newAnswers);
    setDirection('fwd');

    if (step < total - 1) {
      setStep(step + 1);
    } else {
      setStep('loading');
      const result = computeProfile(newAnswers);
      setTimeout(() => {
        preloadResultImage(result);
        setProfile(result);
        setStep('lead');
      }, RESULT_LOADING_DELAY_MS);
    }
  };

  const handleBack = () => {
    setDirection('back');
    if (typeof step === 'number' && step > 0) {
      setStep(step - 1);
    } else if (step === 0) {
      setStep('hero');
    }
  };

  const restart = () => {
    setDirection('fwd');
    setAnswers({});
    setProfile(null);
    setLeadPayload(null);
    setStep('hero');
  };

  if (step === 'hero')    return <Splash onStart={start} />;
  if (step === 'loading') return <Analysis />;
  if (step === 'lead' && profile) return <LeadCapture answers={answers} profileNumber={profile} onBack={() => setStep(total - 1)} onSuccess={(payload) => { setLeadPayload(payload); setStep('result'); }} />;
  if (step === 'result' && profile) return <StoriesResult profileNumber={profile} onRestart={restart} leadPayload={leadPayload} />;
  if (typeof step === 'number') {
    const q = QUESTIONS[step];
    return (
      <QuestionScreen
        key={q.id}
        q={q}
        index={step}
        total={total}
        onSelect={handleAnswer}
        onBack={handleBack}
        direction={direction}
      />
    );
  }
  return <Splash onStart={start} />;
}

createRoot(document.getElementById('shell')).render(<App />);
