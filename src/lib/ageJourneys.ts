/**
 * Ninho Age Journey System
 *
 * Defines behavior emphasis, development milestones, stimulation activities,
 * and watchpoints for each age bucket. This is the intelligence layer that
 * drives Crescer, Saúde priorities, and growth interpretation.
 *
 * Sources:
 *  - WHO child development guidelines
 *  - Caderneta da Criança / Ministério da Saúde
 *  - Denver Developmental Screening Test II
 *  - Nurturing Care Framework (WHO/UNICEF)
 */

// ─── Age Bucket ────────────────────────────────────────────────────────────

export type AgeJourneyBucket =
  | 'newborn_0_2m'
  | 'infant_2_4m'
  | 'infant_4_6m'
  | 'infant_6_9m'
  | 'infant_9_12m'
  | 'toddler_12_18m'
  | 'toddler_18_24m'
  | 'child_2_3y'
  | 'child_3_4y'
  | 'child_4_6y';

export function getJourneyBucket(ageMonths: number): AgeJourneyBucket {
  if (ageMonths < 2)  return 'newborn_0_2m';
  if (ageMonths < 4)  return 'infant_2_4m';
  if (ageMonths < 6)  return 'infant_4_6m';
  if (ageMonths < 9)  return 'infant_6_9m';
  if (ageMonths < 12) return 'infant_9_12m';
  if (ageMonths < 18) return 'toddler_12_18m';
  if (ageMonths < 24) return 'toddler_18_24m';
  if (ageMonths < 36) return 'child_2_3y';
  if (ageMonths < 48) return 'child_3_4y';
  return 'child_4_6y';
}

export function getJourneyLabel(bucket: AgeJourneyBucket): string {
  const labels: Record<AgeJourneyBucket, string> = {
    newborn_0_2m:    '0–2 meses',
    infant_2_4m:     '2–4 meses',
    infant_4_6m:     '4–6 meses',
    infant_6_9m:     '6–9 meses',
    infant_9_12m:    '9–12 meses',
    toddler_12_18m:  '12–18 meses',
    toddler_18_24m:  '18–24 meses',
    child_2_3y:      '2–3 anos',
    child_3_4y:      '3–4 anos',
    child_4_6y:      '4–6 anos',
  };
  return labels[bucket];
}

export function getPhaseLabel(ageMonths: number): string {
  if (ageMonths < 1)  return 'Recém-nascido';
  if (ageMonths < 3)  return 'Primeiro trimestre';
  if (ageMonths < 6)  return 'Segundo trimestre';
  if (ageMonths < 9)  return 'Terceiro trimestre';
  if (ageMonths < 12) return 'Quarto trimestre';
  if (ageMonths < 18) return '1 a 1½ ano';
  if (ageMonths < 24) return '1½ a 2 anos';
  if (ageMonths < 36) return '2 a 3 anos';
  if (ageMonths < 48) return '3 a 4 anos';
  if (ageMonths < 72) return '4 a 6 anos';
  return `${Math.floor(ageMonths / 12)} anos`;
}

// ─── Milestone Types ───────────────────────────────────────────────────────

export type MilestoneDomain = 'motor' | 'linguagem' | 'social' | 'cognitivo';

export interface Milestone {
  id: string;
  domain: MilestoneDomain;
  emoji: string;
  label: string;
  description: string;
  ageHint: string;
}

export interface StimulationActivity {
  id: string;
  domain: MilestoneDomain;
  emoji: string;
  title: string;
  why: string;
  how: string;
}

export interface WatchPoint {
  id: string;
  domain: MilestoneDomain;
  description: string;
}

export interface JourneyPhase {
  bucket: AgeJourneyBucket;
  label: string;
  phaseSummary: string;
  /** What defines this phase from a care perspective */
  careContext: string;
  /** Growth tracking relevance: high/medium/low */
  growthRelevance: 'high' | 'medium' | 'low';
  milestones: Milestone[];
  stimulation: StimulationActivity[];
  watchpoints: WatchPoint[];
}

// ─── Journey Data ──────────────────────────────────────────────────────────

const journeys: Record<AgeJourneyBucket, JourneyPhase> = {

  newborn_0_2m: {
    bucket: 'newborn_0_2m',
    label: '0–2 meses',
    phaseSummary: 'Adaptação ao mundo exterior. Interação, alimentação e sono dominam.',
    careContext: 'Feeding, diaper tracking, birth baseline, first vaccines, first consultation.',
    growthRelevance: 'high',
    milestones: [
      { id: 'visual-track-0', domain: 'motor', emoji: '👁️', label: 'Segue objetos com os olhos', description: 'Acompanha objetos e rostos a 20–30 cm de distância.', ageHint: '0–2m' },
      { id: 'social-smile-0', domain: 'social', emoji: '😄', label: 'Sorriso social', description: 'Sorri em resposta ao rosto familiar, especialmente nos olhos.', ageHint: '6–8 sem' },
      { id: 'vocalize-0', domain: 'linguagem', emoji: '🗣️', label: 'Vocaliza', description: 'Emite sons guturais, gorjeios e sons de vogais.', ageHint: '0–2m' },
      { id: 'head-lift-0', domain: 'motor', emoji: '💪', label: 'Eleva a cabeça brevemente', description: 'Levanta a cabeça por alguns segundos em decúbito ventral.', ageHint: '0–2m' },
      { id: 'startle-0', domain: 'motor', emoji: '⚡', label: 'Reflexo de Moro', description: 'Reação de susto a sons ou movimentos bruscos — reflexo normal.', ageHint: '0–2m' },
    ],
    stimulation: [
      {
        id: 'stim-talk-0',
        domain: 'linguagem', emoji: '🗣️',
        title: 'Fale e cante',
        why: 'A voz familiar é o maior estímulo de linguagem e segurança nos primeiros meses.',
        how: 'Converse durante as trocas, mamadas e banho. Cante músicas de ninar. Use tom calmo e variado.',
      },
      {
        id: 'stim-eyes-0',
        domain: 'motor', emoji: '👁️',
        title: 'Contato visual',
        why: 'O rastreamento visual é a base do desenvolvimento motor ocular e social.',
        how: 'Posicione o rosto a 20–30 cm. Mova lentamente para os lados. Espere a resposta.',
      },
      {
        id: 'stim-tummy-0',
        domain: 'motor', emoji: '🤱',
        title: 'Tempo de barriga (tummy time)',
        why: 'Fortalece pescoço e ombros — base para o controle de cabeça e futuro engatinhar.',
        how: 'Comece com 1–2 minutos após as mamadas (não depois). Aumente gradualmente.',
      },
      {
        id: 'stim-touch-0',
        domain: 'social', emoji: '🤲',
        title: 'Toque e colo',
        why: 'O contato pele a pele regula temperatura, batimentos, e promove vínculo.',
        how: 'Carregue, faça massagem suave, use contato pele a pele quando possível.',
      },
    ],
    watchpoints: [
      { id: 'wp-smile-0', domain: 'social', description: 'Ausência de sorriso social após 2 meses: leve para a consulta.' },
      { id: 'wp-visual-0', domain: 'motor', description: 'Não segue objetos com os olhos: mencione ao pediatra.' },
      { id: 'wp-hypotonia-0', domain: 'motor', description: 'Tônus muito baixo (bebê "mole demais"): discutir na consulta.' },
    ],
  },

  infant_2_4m: {
    bucket: 'infant_2_4m',
    label: '2–4 meses',
    phaseSummary: 'Fase das vacinas dos 2 meses. Motor e interação social se desenvolvem rapidamente.',
    careContext: 'Vaccines at 2 months, growth follow-up, sleep emergence, feeding rhythm.',
    growthRelevance: 'high',
    milestones: [
      { id: 'head-control-2', domain: 'motor', emoji: '💪', label: 'Sustenta a cabeça', description: 'Segura a cabeça firme e estável por vários segundos.', ageHint: '3–4m' },
      { id: 'hands-open-2', domain: 'motor', emoji: '✋', label: 'Abre e fecha mãos', description: 'Coordenação motora fina inicial. Tenta alcançar objetos.', ageHint: '3–4m' },
      { id: 'laugh-loud-2', domain: 'social', emoji: '😂', label: 'Ri em voz alta', description: 'Risos audíveis em resposta a interações.', ageHint: '3–4m' },
      { id: 'babble-2', domain: 'linguagem', emoji: '🗣️', label: 'Balbucia vogais e sílabas', description: '"aaah", "uuu", "mama" — início das sílabas.', ageHint: '3–4m' },
      { id: 'recognize-face-2', domain: 'social', emoji: '😊', label: 'Reconhece cuidadores', description: 'Reage de forma diferente ao rosto dos pais.', ageHint: '2–4m' },
    ],
    stimulation: [
      {
        id: 'stim-object-2',
        domain: 'cognitivo', emoji: '🔴',
        title: 'Objetos coloridos em movimento',
        why: 'Estimula rastreamento visual e início da coordenação mão-olho.',
        how: 'Mova brinquedos coloridos lentamente na linha de visão. Deixe tentar alcançar.',
      },
      {
        id: 'stim-response-2',
        domain: 'linguagem', emoji: '🔄',
        title: 'Conversas de ida e volta',
        why: 'O bebê aprende turnos de comunicação ao receber resposta aos seus sons.',
        how: 'Quando vocalizar, responda com voz animada. Espere. Responda de novo.',
      },
      {
        id: 'stim-tummy-2',
        domain: 'motor', emoji: '🏋️',
        title: 'Tummy time progressivo',
        why: 'Aumentar o tempo estimula força de pescoço e core.',
        how: 'Aumente para 3–5 minutos, 3–5 vezes ao dia. Apoie se precisar.',
      },
    ],
    watchpoints: [
      { id: 'wp-head-2', domain: 'motor', description: 'Não sustenta cabeça aos 4 meses: mencione ao pediatra.' },
      { id: 'wp-laugh-2', domain: 'social', description: 'Não ri nem vocaliza aos 4 meses: leve para avaliação.' },
    ],
  },

  infant_4_6m: {
    bucket: 'infant_4_6m',
    label: '4–6 meses',
    phaseSummary: 'Motor grosso avança. Começa a rolar. Interesse pelo mundo aumenta.',
    careContext: 'Vaccines at 4 and 6 months, growth follow-up, sleep patterns, feeding.',
    growthRelevance: 'high',
    milestones: [
      { id: 'roll-4', domain: 'motor', emoji: '🔄', label: 'Rola supino → prono', description: 'Gira de costas para a barriga.', ageHint: '4–6m' },
      { id: 'grab-4', domain: 'motor', emoji: '✋', label: 'Pega objetos com ambas mãos', description: 'Preensão bilateral. Transfere de mão em mão.', ageHint: '5–6m' },
      { id: 'recognize-people-4', domain: 'social', emoji: '🤝', label: 'Reconhece rostos familiares', description: 'Reage diferente a conhecidos e estranhos.', ageHint: '4–6m' },
      { id: 'syllables-4', domain: 'linguagem', emoji: '🗣️', label: 'Produz sílabas repetidas', description: '"ba-ba", "ma-ma", "da-da" — sem significado ainda.', ageHint: '5–6m' },
      { id: 'mirror-4', domain: 'cognitivo', emoji: '🪞', label: 'Interesse no espelho', description: 'Sorri e vocaliza para o próprio reflexo.', ageHint: '4–6m' },
    ],
    stimulation: [
      {
        id: 'stim-textures-4',
        domain: 'cognitivo', emoji: '🧸',
        title: 'Objetos de texturas diferentes',
        why: 'Exploração sensorial alimenta conexões cognitivas.',
        how: 'Ofereça objetos de diferentes texturas (suave, liso, áspero) para explorar.',
      },
      {
        id: 'stim-mirror-4',
        domain: 'social', emoji: '🪞',
        title: 'Brincar com espelho',
        why: 'Estimula autoconsciência e expressão social.',
        how: 'Mostre o reflexo. Nomeie partes do corpo. Faça expressões.',
      },
      {
        id: 'stim-sit-4',
        domain: 'motor', emoji: '🧘',
        title: 'Preparação para sentar',
        why: 'Fortalecer core e equilíbrio prepara para sentar sem apoio.',
        how: 'Segure sentado com leve apoio. Brinque nessa posição. Não force.',
      },
    ],
    watchpoints: [
      { id: 'wp-roll-4', domain: 'motor', description: 'Não rola aos 6 meses: mencione na consulta.' },
      { id: 'wp-babble-4', domain: 'linguagem', description: 'Não balbucia nem vocaliza aos 6 meses: avalie com pediatra.' },
      { id: 'wp-social-4', domain: 'social', description: 'Não sorri nem responde a rostos familiares: leve para avaliação.' },
    ],
  },

  infant_6_9m: {
    bucket: 'infant_6_9m',
    label: '6–9 meses',
    phaseSummary: 'Maior independência motora. Sentado, início de locomoção. Alimentação complementar começa.',
    careContext: 'Growth, vaccines, symptom logging, complementary feeding context.',
    growthRelevance: 'high',
    milestones: [
      { id: 'sit-6', domain: 'motor', emoji: '🧘', label: 'Senta sem apoio', description: 'Equilíbrio sentado independente por pelo menos 10 segundos.', ageHint: '6–8m' },
      { id: 'object-permanence-6', domain: 'cognitivo', emoji: '🧠', label: 'Permanência do objeto', description: 'Procura objeto que foi escondido — entende que existe fora da visão.', ageHint: '7–9m' },
      { id: 'pincer-6', domain: 'motor', emoji: '👌', label: 'Início do pincer grip', description: 'Começa a pegar objetos pequenos com polegar e indicador.', ageHint: '8–9m' },
      { id: 'recognize-name-6', domain: 'linguagem', emoji: '📣', label: 'Responde ao próprio nome', description: 'Vira a cabeça quando chamado pelo nome.', ageHint: '6–8m' },
      { id: 'stranger-anxiety-6', domain: 'social', emoji: '😟', label: 'Ansiedade com estranhos', description: 'Reage com desconforto a pessoas não familiares. Normal nesta fase.', ageHint: '6–9m' },
    ],
    stimulation: [
      {
        id: 'stim-books-6',
        domain: 'linguagem', emoji: '📚',
        title: 'Livros com imagens',
        why: 'Nomear figuras e objetos é um dos estímulos de linguagem mais eficazes.',
        how: 'Mostre imagens simples. Nomeie: "vaca!", "olha o cachorro!". Espere resposta.',
      },
      {
        id: 'stim-blocks-6',
        domain: 'cognitivo', emoji: '🏗️',
        title: 'Empilhar e derrubar',
        why: 'Causa e efeito e coordenação mão-olho se desenvolvem fortemente.',
        how: 'Empilhe 2–3 blocos. Deixe derrubar. Repita. Comemore.',
      },
      {
        id: 'stim-peekaboo-6',
        domain: 'cognitivo', emoji: '🙈',
        title: 'Esconde-esconde',
        why: 'Reforça permanência do objeto e interação social lúdica.',
        how: 'Cubra o rosto e revele. Use pano para esconder brinquedos.',
      },
    ],
    watchpoints: [
      { id: 'wp-sit-6', domain: 'motor', description: 'Não senta sem apoio aos 9 meses: mencione ao pediatra.' },
      { id: 'wp-babble-6', domain: 'linguagem', description: 'Não balbucia silabicamente aos 9 meses: discutir na consulta.' },
      { id: 'wp-point-6', domain: 'cognitivo', description: 'Não aponta nem faz gesto de "tchau" aos 9 meses: avalie.' },
    ],
  },

  infant_9_12m: {
    bucket: 'infant_9_12m',
    label: '9–12 meses',
    phaseSummary: 'Início da marcha e das primeiras palavras com significado. Comunicação intencional.',
    careContext: 'Vaccines at 12 months, growth, consultations, development milestones.',
    growthRelevance: 'high',
    milestones: [
      { id: 'crawl-9', domain: 'motor', emoji: '🐛', label: 'Engatinha', description: 'Locomoção no chão de forma coordenada. Alternância de mãos e joelhos.', ageHint: '8–10m' },
      { id: 'pull-stand-9', domain: 'motor', emoji: '🆙', label: 'Fica de pé com apoio', description: 'Puxa-se para ficar em pé segurando móveis.', ageHint: '9–11m' },
      { id: 'mama-dada-9', domain: 'linguagem', emoji: '🗣️', label: '"Mamã" e "papá" com sentido', description: 'Usa os sons direcionados às pessoas certas.', ageHint: '9–12m' },
      { id: 'wave-9', domain: 'social', emoji: '👋', label: 'Dá tchau', description: 'Acena em resposta ou espontaneamente em contexto social.', ageHint: '9–12m' },
      { id: 'point-9', domain: 'cognitivo', emoji: '☝️', label: 'Aponta para objetos', description: 'Gesto de apontar para pedir ou mostrar algo. Comunicação intencional.', ageHint: '9–12m' },
    ],
    stimulation: [
      {
        id: 'stim-words-9',
        domain: 'linguagem', emoji: '💬',
        title: 'Nomear o cotidiano',
        why: 'Exposição repetida a palavras em contexto real acelera o vocabulário.',
        how: 'Nomeie tudo: "aqui está sua fralda", "vamos comer", "olha o cachorro". Simples e repetitivo.',
      },
      {
        id: 'stim-imitate-9',
        domain: 'social', emoji: '🔁',
        title: 'Imitar gestos',
        why: 'Imitação é a base do aprendizado social e da linguagem.',
        how: 'Bata palmas, faça "tchau". Espere a imitação. Reforce com risos.',
      },
      {
        id: 'stim-explore-9',
        domain: 'motor', emoji: '🏃',
        title: 'Exploração livre e segura',
        why: 'Locomoção livre desenvolve equilíbrio, força e confiança motora.',
        how: 'Crie espaço seguro. Deixe engatinhar, escalar objetos baixos, explorar.',
      },
    ],
    watchpoints: [
      { id: 'wp-walk-9', domain: 'motor', description: 'Não fica de pé com apoio nem engatinha aos 12 meses: avalie.' },
      { id: 'wp-point-9', domain: 'cognitivo', description: 'Não aponta nem busca atenção conjunta aos 12 meses: mencione ao pediatra.' },
      { id: 'wp-word-9', domain: 'linguagem', description: 'Sem nenhuma palavra com significado aos 12 meses: discutir com pediatra.' },
    ],
  },

  toddler_12_18m: {
    bucket: 'toddler_12_18m',
    label: '12–18 meses',
    phaseSummary: 'Primeiros passos e explosão de vocabulário. Exploração e autonomia crescentes.',
    careContext: 'Vaccines at 15 months, consultations, growth, language development.',
    growthRelevance: 'medium',
    milestones: [
      { id: 'walk-12', domain: 'motor', emoji: '🚶', label: 'Anda sozinho', description: 'Passos independentes sem apoio. Marcha ainda instável — normal.', ageHint: '11–14m' },
      { id: 'words-12', domain: 'linguagem', emoji: '💬', label: '5–10 palavras com significado', description: '"Água", "mais", "não", "papai"... Vocabulário em expansão.', ageHint: '12–15m' },
      { id: 'object-use-12', domain: 'cognitivo', emoji: '🥄', label: 'Uso funcional de objetos', description: 'Usa colher, escova de cabelo, copo com tampa — função intencional.', ageHint: '12–15m' },
      { id: 'social-play-12', domain: 'social', emoji: '👶', label: 'Brinca perto de outras crianças', description: 'Jogo paralelo — ainda não é colaborativo, mas há interesse pelo outro.', ageHint: '12–18m' },
      { id: 'follow-simple-12', domain: 'linguagem', emoji: '👂', label: 'Segue instruções simples', description: '"Vem cá", "pega o brinquedo" — compreensão de comandos básicos.', ageHint: '12–15m' },
    ],
    stimulation: [
      {
        id: 'stim-books-12',
        domain: 'linguagem', emoji: '📚',
        title: 'Leitura conjunta diária',
        why: 'Leitura regular é o melhor preditor de vocabulário e linguagem avançada.',
        how: 'Leia todos os dias. Aponte e nomeie. Faça sons. Pergunte "onde está o…?".',
      },
      {
        id: 'stim-pretend-12',
        domain: 'cognitivo', emoji: '🎭',
        title: 'Jogo de faz de conta simples',
        why: 'O jogo simbólico emergente suporta linguagem, criatividade e cognição.',
        how: 'Alimente um boneco. "Beba" o chá do copoze. Durma o ursinho.',
      },
      {
        id: 'stim-movement-12',
        domain: 'motor', emoji: '⚽',
        title: 'Movimento livre e exploração',
        why: 'Equilíbrio, coordenação e força se desenvolvem pela prática natural.',
        how: 'Deixe caminhar em superfícies variadas. Brincar com bola. Subir degraus com apoio.',
      },
    ],
    watchpoints: [
      { id: 'wp-walk-12', domain: 'motor', description: 'Não anda sozinho aos 15 meses: avalie com pediatra.' },
      { id: 'wp-words-12', domain: 'linguagem', description: 'Menos de 5 palavras aos 15 meses: mencione na consulta.' },
      { id: 'wp-point-12', domain: 'cognitivo', description: 'Não aponta para objetos de interesse: discutir com pediatra.' },
    ],
  },

  toddler_18_24m: {
    bucket: 'toddler_18_24m',
    label: '18–24 meses',
    phaseSummary: 'Linguagem em explosão. Autonomia e ego em desenvolvimento. Jogo mais rico.',
    careContext: 'Vaccines at 18 months, consultations, language growth, behavior.',
    growthRelevance: 'medium',
    milestones: [
      { id: 'run-18', domain: 'motor', emoji: '🏃', label: 'Corre (com quedas)', description: 'Início da corrida — coordenação em desenvolvimento, quedas são normais.', ageHint: '18–24m' },
      { id: 'words-50-18', domain: 'linguagem', emoji: '💬', label: '50+ palavras e frases de 2 palavras', description: '"Mamã água", "mais leite" — início das combinações.', ageHint: '18–24m' },
      { id: 'pretend-play-18', domain: 'cognitivo', emoji: '🎭', label: 'Jogo simbólico rico', description: 'Faz de conta com bonecos, animais, situações do cotidiano.', ageHint: '18–24m' },
      { id: 'parallel-play-18', domain: 'social', emoji: '🤝', label: 'Começa a interagir em jogo', description: 'Além do jogo paralelo, começa a interagir brevemente com outras crianças.', ageHint: '20–24m' },
      { id: 'self-feed-18', domain: 'motor', emoji: '🥄', label: 'Come sozinho com colher', description: 'Autonomia crescente na alimentação — ainda com ajuda.', ageHint: '18–24m' },
    ],
    stimulation: [
      {
        id: 'stim-narrate-18',
        domain: 'linguagem', emoji: '🔊',
        title: 'Narrar o cotidiano',
        why: 'Expor a criança a linguagem contextualizada acelera vocabulário.',
        how: '"Agora estamos lavando as mãos com sabão. Água quentinha!" — descreva tudo.',
      },
      {
        id: 'stim-choice-18',
        domain: 'social', emoji: '🤔',
        title: 'Oferecer escolhas simples',
        why: 'Autonomia e decisão reduzem birras e desenvolvem autorregulação.',
        how: '"Quer a maçã ou a banana?" — escolhas simples entre dois itens.',
      },
      {
        id: 'stim-read-18',
        domain: 'linguagem', emoji: '📖',
        title: 'Livros com histórias curtas',
        why: 'Sequência narrativa começa a fazer sentido — atenção se estende.',
        how: 'Leia livros curtos. Pergunte "o que aconteceu?". Deixe virar as páginas.',
      },
    ],
    watchpoints: [
      { id: 'wp-phrases-18', domain: 'linguagem', description: 'Sem frases de 2 palavras aos 24 meses: avalie com pediatra.' },
      { id: 'wp-play-18', domain: 'cognitivo', description: 'Ausência de jogo simbólico aos 24 meses: discutir na consulta.' },
      { id: 'wp-regression-18', domain: 'linguagem', description: 'Regressão de habilidades já adquiridas: mencione ao pediatra.' },
    ],
  },

  child_2_3y: {
    bucket: 'child_2_3y',
    label: '2–3 anos',
    phaseSummary: 'Linguagem avança rapidamente. Independência, birras e jogo social se desenvolvem.',
    careContext: 'Consultations, vaccines at 4 years approaching, behavior, language, social.',
    growthRelevance: 'medium',
    milestones: [
      { id: 'run-2', domain: 'motor', emoji: '🏃', label: 'Corre e sobe escadas', description: 'Motor grosso avançado. Sobe escadas alternando os pés com apoio.', ageHint: '2–3a' },
      { id: 'sentences-2', domain: 'linguagem', emoji: '💬', label: 'Frases de 3–4 palavras', description: '"Eu quero o carro azul." — gramática emergente.', ageHint: '2–3a' },
      { id: 'imaginary-friend-2', domain: 'cognitivo', emoji: '🧸', label: 'Jogo de faz de conta elaborado', description: 'Cria cenários, amigos imaginários, papéis de adulto.', ageHint: '2–3a' },
      { id: 'cooperative-play-2', domain: 'social', emoji: '🤝', label: 'Jogo cooperativo simples', description: 'Começa a brincar COM outras crianças, não apenas ao lado.', ageHint: '2–3a' },
      { id: 'potty-2', domain: 'motor', emoji: '🚽', label: 'Controle esfincteriano', description: 'Processo gradual de deixar as fraldas durante o dia.', ageHint: '2–3a' },
    ],
    stimulation: [
      {
        id: 'stim-stories-2',
        domain: 'linguagem', emoji: '📚',
        title: 'Contar histórias juntos',
        why: 'Narrativa, vocabulário e criatividade se desenvolvem intensamente.',
        how: 'Leia e depois peça para a criança "contar" de volta. Invente finais alternativos.',
      },
      {
        id: 'stim-drawing-2',
        domain: 'cognitivo', emoji: '🎨',
        title: 'Desenho e pintura livres',
        why: 'Expressão criativa, controle motor fino e cognição.',
        how: 'Ofereça papel, giz de cera, tinta. Sem modelo fixo. Elogie o processo.',
      },
      {
        id: 'stim-roles-2',
        domain: 'social', emoji: '👨‍👩‍👧',
        title: 'Brincadeira de papéis',
        why: 'Simular papéis sociais desenvolve empatia e compreensão de regras.',
        how: 'Brinque de mercado, médico, cozinha. Assuma papéis junto com a criança.',
      },
    ],
    watchpoints: [
      { id: 'wp-phrases-2', domain: 'linguagem', description: 'Não forma frases de 2+ palavras aos 2,5 anos: avalie com pediatra.' },
      { id: 'wp-social-2', domain: 'social', description: 'Dificuldade persistente com interação social: mencione na consulta.' },
      { id: 'wp-fall-2', domain: 'motor', description: 'Quedas frequentes ou dificuldade motora significativa: avalie.' },
    ],
  },

  child_3_4y: {
    bucket: 'child_3_4y',
    label: '3–4 anos',
    phaseSummary: 'Vocabulário rico, perguntas sem parar, jogo cooperativo e habilidades motoras finas.',
    careContext: 'Consultations, medications if relevant, symptoms, vaccines at 4 years.',
    growthRelevance: 'low',
    milestones: [
      { id: 'balance-3', domain: 'motor', emoji: '🧗', label: 'Equilíbrio em um pé', description: 'Fica em um pé por alguns segundos.', ageHint: '3–4a' },
      { id: 'sentences-3', domain: 'linguagem', emoji: '💬', label: 'Sentenças complexas', description: 'Conta histórias, usa passado e futuro, faz perguntas elaboradas.', ageHint: '3–4a' },
      { id: 'draw-person-3', domain: 'cognitivo', emoji: '✏️', label: 'Desenha pessoa com detalhes', description: 'Cabeça, olhos, braços — figura humana reconhecível.', ageHint: '3–4a' },
      { id: 'coop-games-3', domain: 'social', emoji: '🎲', label: 'Segue regras de jogos simples', description: 'Jogos com turnos e regras básicas.', ageHint: '3–4a' },
      { id: 'toilet-3', domain: 'motor', emoji: '🚽', label: 'Controle esfincteriano diurno', description: 'Usa o banheiro de forma independente durante o dia.', ageHint: '3a' },
    ],
    stimulation: [
      {
        id: 'stim-questions-3',
        domain: 'cognitivo', emoji: '❓',
        title: 'Responder às perguntas',
        why: 'A fase do "por quê" é uma explosão cognitiva — ignorar bloqueia curiosidade.',
        how: 'Responda com honestidade, no nível dela. "Não sei, vamos descobrir juntos?"',
      },
      {
        id: 'stim-board-3',
        domain: 'social', emoji: '🎲',
        title: 'Jogos de tabuleiro simples',
        why: 'Turnos, regras e lidar com frustração de perder são aprendizados sociais essenciais.',
        how: 'Jogue jogos de memória, dominó de figuras. Reforce o processo, não só a vitória.',
      },
      {
        id: 'stim-outdoor-3',
        domain: 'motor', emoji: '🌳',
        title: 'Brincadeiras ao ar livre',
        why: 'Motor grosso, equilíbrio e exposição à natureza beneficiam saúde e desenvolvimento.',
        how: 'Parques, jardim, bicicleta com rodinhas. Minimize telas neste tempo.',
      },
    ],
    watchpoints: [
      { id: 'wp-story-3', domain: 'linguagem', description: 'Não conta histórias simples aos 4 anos: mencione ao pediatra.' },
      { id: 'wp-friends-3', domain: 'social', description: 'Não demonstra interesse em outras crianças: discutir na consulta.' },
    ],
  },

  child_4_6y: {
    bucket: 'child_4_6y',
    label: '4–6 anos',
    phaseSummary: 'Fase escolar. Letramento emergente, regulação emocional e convivência social.',
    careContext: 'Vaccines at 4 and 5 years, consultations, medications, behavioral support.',
    growthRelevance: 'low',
    milestones: [
      { id: 'skip-4', domain: 'motor', emoji: '🦘', label: 'Pula e corre coordenado', description: 'Salto em um pé, corrida coordenada, controle de bola.', ageHint: '4–5a' },
      { id: 'write-name-4', domain: 'cognitivo', emoji: '✏️', label: 'Escreve o próprio nome', description: 'Motor fino para escrita básica emergindo.', ageHint: '4–5a' },
      { id: 'regulate-4', domain: 'social', emoji: '😤', label: 'Começa a regular emoções', description: 'Usa palavras para expressar sentimentos, tolera frustração melhor.', ageHint: '4–6a' },
      { id: 'read-prep-4', domain: 'linguagem', emoji: '📖', label: 'Consciência fonológica', description: 'Rimas, sons, letras — base para leitura emergente.', ageHint: '4–6a' },
      { id: 'friends-4', domain: 'social', emoji: '👫', label: 'Amizades intencionais', description: 'Prefere brincar com certas crianças — amizades reais começam.', ageHint: '4–6a' },
    ],
    stimulation: [
      {
        id: 'stim-reading-4',
        domain: 'linguagem', emoji: '📚',
        title: 'Leitura conjunta com perguntas',
        why: 'Compreensão leitora e vocabulário se desenvolvem pela conversa sobre livros.',
        how: 'Leia e discuta: "O que você acha que vai acontecer?", "Por que ele fez isso?"',
      },
      {
        id: 'stim-emotions-4',
        domain: 'social', emoji: '😊',
        title: 'Nomear emoções',
        why: 'Vocabulário emocional é base de regulação e empatia.',
        how: 'Nomeie o que sente: "você parece com raiva". Valide e ajude a nomear.',
      },
      {
        id: 'stim-rules-4',
        domain: 'cognitivo', emoji: '🎯',
        title: 'Jogos com regras',
        why: 'Seguir regras, lidar com perder e cooperar são aprendizados fundamentais.',
        how: 'Jogos de cartas, tabuleiro, damas. Mantenha o foco no processo.',
      },
    ],
    watchpoints: [
      { id: 'wp-reading-4', domain: 'linguagem', description: 'Dificuldade persistente com sons e letras aos 5–6 anos: avalie.' },
      { id: 'wp-social-4', domain: 'social', description: 'Isolamento social significativo ou dificuldade de convivência: mencione na consulta.' },
      { id: 'wp-motor-4', domain: 'motor', description: 'Dificuldade motora fina ou grossa significativa: discutir com pediatra.' },
    ],
  },
};

// ─── Public API ────────────────────────────────────────────────────────────

export function getJourneyPhase(ageMonths: number): JourneyPhase {
  return journeys[getJourneyBucket(ageMonths)];
}

export function getMilestones(ageMonths: number): Milestone[] {
  return journeys[getJourneyBucket(ageMonths)].milestones;
}

export function getStimulation(ageMonths: number): StimulationActivity[] {
  return journeys[getJourneyBucket(ageMonths)].stimulation;
}

export function getWatchpoints(ageMonths: number): WatchPoint[] {
  return journeys[getJourneyBucket(ageMonths)].watchpoints;
}

export const DOMAIN_COLORS: Record<MilestoneDomain, string> = {
  motor:     'hsl(152,15%,55%)',
  linguagem: 'hsl(200,40%,50%)',
  social:    'hsl(270,12%,52%)',
  cognitivo: 'hsl(32,80%,57%)',
};

export const DOMAIN_LABELS: Record<MilestoneDomain, string> = {
  motor:     '💪 Motor',
  linguagem: '🗣️ Linguagem',
  social:    '🤝 Social',
  cognitivo: '🧠 Cognitivo',
};
