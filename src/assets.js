export const ASSET_FILES = {
  intro: { src: '/assets/images/intro.webp', alt: "Consultório premium com plantas e luz natural" },
  q1: { src: '/assets/images/question-1.webp', alt: "Close-up de mãos femininas maduras" },
  q2: { src: '/assets/images/question-2.webp', alt: "Café e agenda sobre uma mesa" },
  q3: { src: '/assets/images/question-3.webp', alt: "Mulher caminhando em parque com luz natural" },
  q4: { src: '/assets/images/question-4.webp', alt: "Mesa minimalista com prato e água" },
  q5: { src: '/assets/images/question-5.webp', alt: "Chocolate amargo em prato sofisticado" },
  q6: { src: '/assets/images/question-6.webp', alt: "Café em luz dourada" },
  q7: { src: '/assets/images/question-7.webp', alt: "Silhueta feminina contra uma janela" },
  q8: { src: '/assets/images/question-8.webp', alt: "Livros e óculos em luz nostálgica" },
  q9: { src: '/assets/images/question-9.webp', alt: "Roupas em tons neutros em um closet" },
  q10: { src: '/assets/images/question-10.webp', alt: "Mulher diante do espelho em luz natural" },
  r1: { src: '/assets/images/result-1.webp', alt: "Floresta com raios de luz dourada" },
  r2: { src: '/assets/images/result-2.webp', alt: "Onda do mar em luz dourada" },
  r3: { src: '/assets/images/result-3.webp', alt: "Floresta iluminada em equilíbrio natural" },
  r4: { src: '/assets/images/result-4.webp', alt: "Porta entreaberta com luz entrando" },
  r5: { src: '/assets/images/result-5.webp', alt: "Amanhecer sobre as montanhas" },
  doctor: { src: '/assets/images/doctor.webp', alt: "Dra. Erika Damas" },
};

export const ASSETS = {
  intro: ASSET_FILES.intro,
  q1: ASSET_FILES.q1, q2: ASSET_FILES.q2, q3: ASSET_FILES.q3, q4: ASSET_FILES.q4, q5: ASSET_FILES.q5,
  q6: ASSET_FILES.q6, q7: ASSET_FILES.q7, q8: ASSET_FILES.q8, q9: ASSET_FILES.q9, q10: ASSET_FILES.q10,
  results: { A: ASSET_FILES.r1, B: ASSET_FILES.r2, C: ASSET_FILES.r3, D: ASSET_FILES.r4, E: ASSET_FILES.r5 },
  doctor: ASSET_FILES.doctor,
};

export function prefetchAsset(asset) {
  if (!asset?.src || typeof Image === 'undefined') return;
  const image = new Image();
  image.decoding = 'async';
  image.src = asset.src;
}
