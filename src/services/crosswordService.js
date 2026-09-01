// Catalogo local: nivel, titulo, tema, palavra horizontal, pista e palavras verticais.
const PUZZLES = {
  1: ['First Words', 'everyday objects', 'PENCIL', 'You use this to write or draw.', [['PEN', 'A tool that writes with ink.'], ['EEL', 'A long fish with a snake-like body.'], ['NINE', 'The number after eight.'], ['CUP', 'A small container for drinking.'], ['ICE', 'Frozen water.'], ['LION', 'A large wild cat.']]],
  2: ['My Family', 'family and home', 'FAMILY', 'Parents, children, and close relatives.', [['FISH', 'An animal that lives in water.'], ['APRON', 'Clothing worn to protect your clothes while cooking.'], ['MOTHER', 'A female parent.'], ['MILK', 'A white drink from cows.'], ['LAMP', 'An electric light you can place on a table.'], ['YARN', 'Thick thread used for knitting.']]],
  3: ['Animal World', 'animals and nature', 'ANIMALS', 'Living creatures that are not plants.', [['ANT', 'A small insect that lives in colonies.'], ['NEST', 'A bird builds this home for its eggs.'], ['IGUANA', 'A large lizard that lives in warm places.'], ['MOSS', 'A small green plant that grows in damp places.'], ['LAMB', 'A young sheep.'], ['SNAIL', 'A small animal that carries a shell.']]],
  4: ['Weather Report', 'weather', 'WEATHER', 'Conditions outside, such as sun, rain, or wind.', [['WATER', 'The clear liquid that people drink.'], ['EAGLE', 'A large bird with strong wings.'], ['THUNDER', 'The loud sound heard during a storm.'], ['TOWEL', 'Cloth used to dry your body or hands.'], ['HAIL', 'Small balls of ice that fall from clouds.'], ['RAIN', 'Water that falls from clouds.']]],
  5: ['Travel Time', 'travel and transport', 'TRAVEL', 'To go from one place to another.', [['TRAIN', 'A long vehicle that runs on rails.'], ['RIVER', 'A large natural stream of water.'], ['AIRPORT', 'A place where airplanes arrive and leave.'], ['VAN', 'A medium road vehicle for people or goods.'], ['ELEVATOR', 'A machine that carries people between floors.'], ['LUGGAGE', 'Bags and suitcases used for traveling.']]],
  6: ['Culture Club', 'culture and learning', 'CULTURE', 'The ideas, customs, and arts of a group of people.', [['CURTAIN', 'Fabric that covers a window.'], ['UMBRELLA', 'You use this to stay dry in the rain.'], ['TURTLE', 'A reptile with a hard shell.'], ['TUBA', 'A large brass instrument with a deep sound.'], ['RULER', 'A tool for measuring and drawing straight lines.'], ['TULIP', 'A colorful flower with a cup-shaped bloom.']]],
  7: ['Science Lab', 'science', 'SCIENCE', 'The study of the natural world through evidence.', [['SENSOR', 'A device that detects changes in its environment.'], ['CIRCUIT', 'A path that electricity follows.'], ['ISOTOPE', 'A form of an element with a different number of neutrons.'], ['NEUTRON', 'A particle in an atom with no electric charge.'], ['CELL', 'The smallest unit of living matter.'], ['ECLIPSE', 'An event when one object in space blocks another.']]],
  8: ['Workplace Words', 'business and work', 'BUSINESS', 'Work that involves buying, selling, or providing services.', [['BUDGET', 'A plan for how to spend money.'], ['USAGE', 'The way something is used.'], ['INVOICE', 'A document asking for payment.'], ['NEGOTIATE', 'To discuss in order to reach an agreement.'], ['STRATEGY', 'A plan designed to achieve a goal.'], ['STAFF', 'The employees of an organization.']]],
  9: ['Knowledge Quest', 'academic vocabulary', 'KNOWLEDGE', 'Information and understanding gained through learning.', [['KERNEL', 'The central part of a seed or a small piece of data.'], ['ORBIT', 'The path an object follows around a planet or star.'], ['WISDOM', 'The ability to make good decisions based on experience.'], ['LITERATURE', 'Written works, especially those with artistic value.'], ['EQUATION', 'A mathematical statement showing two values are equal.'], ['GENE', 'A unit of information passed from parents to children.']]],
  10: ['The Challenge', 'advanced practice', 'CHALLENGE', 'A difficult task that tests your ability.', [['CHEMISTRY', 'The science of substances and how they change.'], ['HYPOTHESIS', 'An idea that can be tested through research.'], ['ALGORITHM', 'A set of steps for solving a problem.'], ['LINGUISTIC', 'Related to language or the study of language.'], ['NAVIGATE', 'To plan or direct the route of a journey.'], ['ETHICS', 'Principles that guide right and wrong behavior.']]],
};

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

  throw new Error('O catalogo local nao possui palavras suficientes para esta grade.');
}

// Retorna a cruzadinha completa de um nivel do catalogo local.
function generateCrossword({ level }) {
  // Busca a definicao do nivel pela chave numerica.
  const puzzle = PUZZLES[level];
  if (!puzzle) throw new Error('Nivel de cruzadinha nao encontrado.');

  // Separa os dados compactos do catalogo e monta as entradas da grade.
  const [title, topic, answer, clue, words] = puzzle;
  return { level, title, topic, entries: createEntries([answer, clue], words) };
}

// Remove espacos e ignora diferenca entre maiusculas e minusculas na tentativa.
function normalizeAnswer(answer) {
  return answer.trim().toUpperCase();
}

// Compara todas as tentativas enviadas pelo usuario com as respostas oficiais.
function validateCrossword({ level, answers }) {
  // Obtem as respostas corretas para o nivel solicitado.
  const crossword = generateCrossword({ level });
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
