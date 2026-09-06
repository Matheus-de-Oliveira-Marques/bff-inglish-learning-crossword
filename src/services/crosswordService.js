// Catalogo local: nivel, titulo, tema, palavra horizontal, pista e palavras verticais.
const PUZZLES = {
  1: [
    'First Words',
    'basic everyday words',
    'EVERYDAY',
    'Simple words you see and use every day.',
    [
      ['BOOK', 'Something you read.'],
      ['PHONE', 'A device you use to call and message people.'],
      ['TABLE', 'Furniture with a flat surface.'],
      ['CHAIR', 'Something you sit on.'],
      ['DOOR', 'You open this to enter or leave a room.'],
      ['WATER', 'The clear liquid people drink.'],
    ],
  ],

  2: [
    'My Home',
    'home and household',
    'HOME',
    'Words for things you find around your home.',
    [
      ['ROOM', 'A space inside a house or apartment.'],
      ['BED', 'A piece of furniture you sleep on.'],
      ['LAMP', 'Something that gives light.'],
      ['KITCHEN', 'The room where you prepare food.'],
      ['WINDOW', 'An opening in a wall that lets in light.'],
      ['TOWEL', 'Something you use to dry yourself.'],
    ],
  ],

  3: [
    'Food & Drinks',
    'common food and drinks',
    'FOOD',
    'Words for food, drinks, and everyday meals.',
    [
      ['BREAD', 'Food made from flour and baked.'],
      ['MILK', 'A white drink that comes from cows.'],
      ['APPLE', 'A round fruit that can be red or green.'],
      ['RICE', 'Small grains commonly eaten with meals.'],
      ['COFFEE', 'A hot drink made from roasted beans.'],
      ['CHEESE', 'Food made from milk.'],
    ],
  ],

  4: [
    'My Family',
    'family and relationships',
    'FAMILY',
    'Words for people in your family and close relationships.',
    [
      ['MOTHER', 'Your female parent.'],
      ['FATHER', 'Your male parent.'],
      ['BROTHER', 'A boy or man who has the same parents as you.'],
      ['SISTER', 'A girl or woman who has the same parents as you.'],
      ['BABY', 'A very young child.'],
      ['FRIEND', 'A person you like and trust.'],
    ],
  ],

  5: [
    'Around Town',
    'places in a city',
    'CITY',
    'Words for places you visit in your everyday life.',
    [
      ['STORE', 'A place where you buy things.'],
      ['SCHOOL', 'A place where people learn.'],
      ['PARK', 'A public place with grass, trees, and open space.'],
      ['BANK', 'A place where people keep and manage money.'],
      ['HOTEL', 'A place where travelers can stay.'],
      ['MARKET', 'A place where people buy food and other products.'],
    ],
  ],

  6: [
    'Getting Around',
    'transport and travel',
    'TRAVEL',
    'Words for moving from one place to another.',
    [
      ['CAR', 'A vehicle used to travel on roads.'],
      ['BUS', 'A large vehicle that carries passengers.'],
      ['TRAIN', 'A vehicle that travels on railway tracks.'],
      ['PLANE', 'A vehicle that flies through the air.'],
      ['TAXI', 'A car you pay to take you somewhere.'],
      ['TICKET', 'Something that allows you to travel or enter a place.'],
    ],
  ],

  7: [
    'Daily Life',
    'common actions and routines',
    'ROUTINE',
    'Words for things you do during a normal day.',
    [
      ['WAKE', 'To stop sleeping.'],
      ['EAT', 'To put food in your mouth and swallow it.'],
      ['WORK', 'To do a job or activity.'],
      ['WALK', 'To move by putting one foot in front of the other.'],
      ['SLEEP', 'To rest with your eyes closed.'],
      ['START', 'To begin doing something.'],
    ],
  ],

  8: [
    'Feelings',
    'emotions and feelings',
    'FEELINGS',
    'Words for emotions and how people feel.',
    [
      ['HAPPY', 'Feeling good or pleased.'],
      ['SAD', 'Feeling unhappy.'],
      ['ANGRY', 'Feeling very upset or annoyed.'],
      ['TIRED', 'Needing to rest or sleep.'],
      ['EXCITED', 'Feeling very happy about something that will happen.'],
      ['WORRIED', 'Feeling nervous about something.'],
    ],
  ],

  9: [
    'At Work',
    'work and communication',
    'WORK',
    'Useful words for jobs, tasks, and communication.',
    [
      ['MEETING', 'A time when people come together to talk about something.'],
      ['EMAIL', 'A message sent electronically.'],
      ['TASK', 'A piece of work that needs to be done.'],
      ['TEAM', 'A group of people working together.'],
      ['PLAN', 'Something you decide to do in the future.'],
      ['HELP', 'To make something easier for someone.'],
    ],
  ],

  10: [
    'Level Up',
    'useful intermediate vocabulary',
    'PROGRESS',
    'Common words that help you express ideas more clearly.',
    [
      ['CHOICE', 'Something you decide between two or more options.'],
      ['REASON', 'Something that explains why something happens.'],
      ['CHANGE', 'To make something different.'],
      ['IMPORTANT', 'Having great value or meaning.'],
      ['PROBLEM', 'Something that needs to be solved.'],
      ['SUCCESS', 'Achieving something you wanted to achieve.'],
    ],
  ],
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
