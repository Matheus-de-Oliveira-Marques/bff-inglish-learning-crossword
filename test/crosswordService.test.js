const test = require('node:test');
const assert = require('node:assert/strict');
const { generateCrossword, validateCrossword } = require('../src/services/crosswordService');

test('generates a local crossword for every level', () => {
  for (let level = 1; level <= 10; level += 1) {
    const crossword = generateCrossword({ level });

    assert.equal(crossword.level, level);
    assert.equal(crossword.entries.length, 6);
    assert.equal(crossword.entries[0].direction, 'across');
    assert.equal(crossword.entries.filter((entry) => entry.direction === 'down').length, 5);
    assert.match(crossword.entries[0].answer, /^[A-Z]+$/);
  }
});

test('uses distinct content for beginner and advanced levels', () => {
  const beginner = generateCrossword({ level: 1 });
  const advanced = generateCrossword({ level: 10 });

  assert.notEqual(beginner.title, advanced.title);
  assert.notEqual(beginner.entries[0].answer, advanced.entries[0].answer);
});

test('does not repeat answers across generated levels', () => {
  const answers = [];
  for (let level = 1; level <= 10; level += 1) {
    answers.push(...generateCrossword({ level }).entries.map((entry) => entry.answer));
  }

  assert.equal(new Set(answers).size, answers.length);
});

test('only completes a level when every answer is correct', () => {
  const crossword = generateCrossword({ level: 1 });
  const answers = crossword.entries.map((entry) => ({ entryId: entry.id, answer: entry.answer.toLowerCase() }));
  answers[2].answer = 'WRONG';

  const incomplete = validateCrossword({ level: 1, answers });
  assert.equal(incomplete.results[2].correct, false);
  assert.equal(incomplete.completed, false);

  answers[2].answer = crossword.entries[2].answer;
  const complete = validateCrossword({ level: 1, answers });
  assert.equal(complete.completed, true);
});

test('rejects an unknown level', () => {
  assert.throws(() => generateCrossword({ level: 11 }), /Nivel de cruzadinha nao encontrado/);
});