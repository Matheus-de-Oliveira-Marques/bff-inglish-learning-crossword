const test = require('node:test');
const assert = require('node:assert/strict');
const geminiClient = require('../src/services/geminiClient');
const { generateCrossword, validateCrossword } = require('../src/services/crosswordService');

// Palavras compartilhando letras com a ancora, no mesmo formato que a IA deve devolver.
const BEGINNER_PUZZLE = {
  title: 'First Words',
  topic: 'basic everyday words',
  anchorWord: 'EVERYDAY',
  anchorClue: 'Simple words you see and use every day.',
  words: [
    { answer: 'BOOK', clue: 'Something you read.' },
    { answer: 'PHONE', clue: 'A device you use to call and message people.' },
    { answer: 'TABLE', clue: 'Furniture with a flat surface.' },
    { answer: 'CHAIR', clue: 'Something you sit on.' },
    { answer: 'DOOR', clue: 'You open this to enter or leave a room.' },
    { answer: 'WATER', clue: 'The clear liquid people drink.' },
  ],
};

const ADVANCED_PUZZLE = {
  title: 'Level Up',
  topic: 'useful intermediate vocabulary',
  anchorWord: 'PROGRESS',
  anchorClue: 'Common words that help you express ideas more clearly.',
  words: [
    { answer: 'OFFER', clue: 'Something that someone proposes or makes available.' },
    { answer: 'REASON', clue: 'Something that explains why something happens.' },
    { answer: 'GOAL', clue: 'Something you want to achieve.' },
    { answer: 'IMPORTANT', clue: 'Having great value or meaning.' },
    { answer: 'PROBLEM', clue: 'Something that needs to be solved.' },
    { answer: 'SUCCESS', clue: 'Achieving something you wanted to achieve.' },
  ],
};

// Substitui a chamada real ao Gemini por uma fila de respostas controlada pelo teste.
function fakeGemini(t, responses) {
  let callCount = 0;
  t.mock.method(geminiClient, 'requestPuzzle', async () => {
    const puzzle = responses[Math.min(callCount, responses.length - 1)];
    callCount += 1;
    return puzzle;
  });
  return () => callCount;
}

test('generates a crossword using the words returned by the AI', async (t) => {
  fakeGemini(t, [BEGINNER_PUZZLE]);
  const crossword = await generateCrossword({ level: 1 });

  assert.equal(crossword.level, 1);
  assert.equal(crossword.title, 'First Words');
  assert.equal(crossword.entries.length, 6);
  assert.equal(crossword.entries[0].direction, 'across');
  assert.equal(crossword.entries.filter((entry) => entry.direction === 'down').length, 5);
  assert.match(crossword.entries[0].answer, /^[A-Z]+$/);
});

test('uses distinct content for different levels', async (t) => {
  fakeGemini(t, [BEGINNER_PUZZLE]);
  const beginner = await generateCrossword({ level: 1 });

  fakeGemini(t, [ADVANCED_PUZZLE]);
  const advanced = await generateCrossword({ level: 25 });

  assert.notEqual(beginner.title, advanced.title);
  assert.notEqual(beginner.entries[0].answer, advanced.entries[0].answer);
});

test('retries when the AI returns words without enough crossings', async (t) => {
  const invalidPuzzle = {
    title: 'Broken',
    topic: 'no crossings',
    anchorWord: 'ZZZ',
    anchorClue: 'Not a real word.',
    words: [{ answer: 'QQQ', clue: 'Does not cross the anchor.' }],
  };

  const getCallCount = fakeGemini(t, [invalidPuzzle, BEGINNER_PUZZLE]);
  const crossword = await generateCrossword({ level: 2 });

  assert.equal(crossword.title, 'First Words');
  assert.equal(getCallCount(), 2);
});

test('rejects when the AI client cannot produce a puzzle', async (t) => {
  t.mock.method(geminiClient, 'requestPuzzle', async () => {
    throw new Error('GEMINI_API_KEY nao configurada.');
  });

  await assert.rejects(() => generateCrossword({ level: 3 }), /Nao foi possivel gerar a cruzadinha/);
});

test('only completes a level when every answer is correct', async (t) => {
  fakeGemini(t, [BEGINNER_PUZZLE]);
  const crossword = await generateCrossword({ level: 4 });
  const answers = crossword.entries.map((entry) => ({ entryId: entry.id, answer: entry.answer.toLowerCase() }));
  answers[2].answer = 'WRONG';

  const incomplete = await validateCrossword({ level: 4, answers });
  assert.equal(incomplete.results[2].correct, false);
  assert.equal(incomplete.completed, false);

  answers[2].answer = crossword.entries[2].answer;
  const complete = await validateCrossword({ level: 4, answers });
  assert.equal(complete.completed, true);
});

test('reuses the cached puzzle so validation matches the generated words', async (t) => {
  const getCallCount = fakeGemini(t, [BEGINNER_PUZZLE, ADVANCED_PUZZLE]);
  const crossword = await generateCrossword({ level: 5 });
  const answers = crossword.entries.map((entry) => ({ entryId: entry.id, answer: entry.answer }));

  const result = await validateCrossword({ level: 5, answers });
  assert.equal(result.completed, true);
  // A validacao nao deve chamar a IA novamente: reaproveita o quebra-cabeca gerado.
  assert.equal(getCallCount(), 1);
});

