// Cliente fino sobre o SDK do Gemini, usado para gerar dinamicamente o conteudo de cada nivel.
const geminiClient = require('./geminiClient');

// Guarda em memoria o ultimo quebra-cabeca gerado por nivel, para a validacao usar as mesmas palavras.
const puzzleCache = new Map();
// Tempo que um nivel gerado permanece valido para ser respondido.
const CACHE_TTL_MS = 30 * 60 * 1000;
// Quantidade de palavras candidatas pedidas a IA para garantir cruzamentos suficientes.
const CANDIDATE_WORD_COUNT = 10;
// Numero de tentativas antes de desistir de gerar uma grade valida.
const MAX_GENERATION_ATTEMPTS = 3;

// Monta o pedido enviado a IA, escalando a dificuldade conforme o nivel.
function buildPrompt(level) {
  return [
    'You are creating content for an English vocabulary crossword game for Portuguese-speaking learners.',
    `Generate original crossword content for difficulty level ${level} (1 is beginner, higher numbers mean more advanced and longer vocabulary).`,
    'Rules:',
    '- Provide one main horizontal word ("anchorWord"): an English word using only letters A-Z, uppercase, no spaces or hyphens, plus an "anchorClue" written in English.',
    `- Provide at least ${CANDIDATE_WORD_COUNT} candidate words in "words", each with an "answer" (English word, only letters A-Z, uppercase, no spaces) and a short English "clue".`,
    '- Every candidate answer must share at least one letter with "anchorWord" so it can cross it in a crossword grid.',
    '- All answers (anchorWord and every candidate) must be different from each other.',
    '- Increase vocabulary difficulty and word length as the level number increases.',
    '- Respond only with JSON matching the provided schema.',
  ].join('\n');
}

// Constroi seis entradas conectadas, usando a palavra principal horizontal como ancora.
function createEntries(anchor, words) {
  // Posicao fixa da palavra principal em uma grade de 12 x 12.
  const anchorRow = 5;
  const anchorColumn = 1;
  // Evita usar a mesma coluna da ancora para duas palavras verticais.
  const usedAnchorIndexes = new Set();
  // A primeira entrada e sempre a palavra horizontal principal.
  const entries = [{ id: 1, answer: anchor[0], clue: anchor[1], row: anchorRow, column: anchorColumn, direction: 'across' }];

  for (const [answer, clue] of words) {
    // Localiza uma letra em comum ainda livre para cruzar a palavra vertical.
    const anchorIndex = [...anchor[0]].findIndex((letter, index) => !usedAnchorIndexes.has(index) && answer.includes(letter));
    if (anchorIndex === -1) continue;

    // Calcula a linha inicial para que as letras iguais se encontrem na grade.
    const wordIndex = answer.indexOf(anchor[0][anchorIndex]);
    entries.push({ id: entries.length + 1, answer, clue, row: anchorRow - wordIndex, column: anchorColumn + anchorIndex, direction: 'down' });
    usedAnchorIndexes.add(anchorIndex);
    // Cada nivel usa uma palavra horizontal e cinco verticais.
    if (entries.length === 6) return entries;
  }

  throw new Error('As palavras geradas pela IA nao possuem cruzamentos suficientes para esta grade.');
}

// Remove espacos e ignora diferenca entre maiusculas e minusculas na tentativa.
function normalizeAnswer(answer) {
  return String(answer || '').trim().toUpperCase();
}

// Descarta candidatos invalidos ou repetidos antes de montar a grade.
function sanitizeWords(words, alreadyUsed) {
  const seen = new Set(alreadyUsed);
  const sanitized = [];

  for (const candidate of Array.isArray(words) ? words : []) {
    const answer = normalizeAnswer(candidate?.answer);
    const clue = String(candidate?.clue || '').trim();
    // So aceita palavras compostas apenas por letras, com pista e ainda nao usadas.
    if (!/^[A-Z]+$/.test(answer) || !clue || seen.has(answer)) continue;

    seen.add(answer);
    sanitized.push([answer, clue]);
  }

  return sanitized;
}

// Pede a IA um novo quebra-cabeca e valida o formato antes de montar a grade.
async function buildPuzzleFromGemini(level) {
  const puzzle = await geminiClient.requestPuzzle(buildPrompt(level));

  const anchorWord = normalizeAnswer(puzzle?.anchorWord);
  const anchorClue = String(puzzle?.anchorClue || '').trim();
  if (!/^[A-Z]+$/.test(anchorWord) || !anchorClue) {
    throw new Error('A IA retornou uma palavra principal invalida.');
  }

  const words = sanitizeWords(puzzle?.words, [anchorWord]);
  const entries = createEntries([anchorWord, anchorClue], words);

  return {
    level,
    title: String(puzzle?.title || '').trim() || `Level ${level}`,
    topic: String(puzzle?.topic || '').trim(),
    entries,
  };
}

// Gera a cruzadinha de um nivel via Gemini, tentando novamente em caso de resposta invalida.
async function generateCrossword({ level }) {
  // Reaproveita o quebra-cabeca ja gerado para que a validacao use as mesmas palavras.
  const cached = puzzleCache.get(level);
  if (cached && cached.expiresAt > Date.now()) return cached.crossword;

  let lastError;
  for (let attempt = 1; attempt <= MAX_GENERATION_ATTEMPTS; attempt += 1) {
    try {
      const crossword = await buildPuzzleFromGemini(level);
      puzzleCache.set(level, { crossword, expiresAt: Date.now() + CACHE_TTL_MS });
      return crossword;
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(`Nao foi possivel gerar a cruzadinha do nivel ${level}: ${lastError?.message || 'erro desconhecido'}`);
}

// Compara todas as tentativas enviadas pelo usuario com as respostas oficiais.
async function validateCrossword({ level, answers }) {
  // Obtem as respostas corretas para o nivel solicitado (usa o cache quando disponivel).
  const crossword = await generateCrossword({ level });
  // Permite localizar rapidamente a tentativa pelo id de cada palavra.
  const answersByEntryId = new Map(answers.map((answer) => [answer.entryId, answer.answer]));
  // Gera o resultado individual de cada entrada da cruzadinha.
  const results = crossword.entries.map((entry) => ({
    entryId: entry.id,
    correct: normalizeAnswer(answersByEntryId.get(entry.id) || '') === entry.answer,
  }));

  return {
    level,
    results,
    // O app deve liberar o proximo nivel apenas quando todos os resultados forem verdadeiros.
    completed: results.every((result) => result.correct),
  };
}

// Exporta as funcoes usadas pelas rotas e pelos testes.
module.exports = { generateCrossword, validateCrossword };
