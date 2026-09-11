// Camada fina sobre o SDK do Gemini, isolada para facilitar a substituicao em testes.
const geminiModel = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

// Formato estrito que a resposta da IA deve seguir (usa os literais do enum Type do SDK).
const puzzleResponseSchema = {
  type: 'OBJECT',
  properties: {
    title: { type: 'STRING' },
    topic: { type: 'STRING' },
    anchorWord: { type: 'STRING' },
    anchorClue: { type: 'STRING' },
    words: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          answer: { type: 'STRING' },
          clue: { type: 'STRING' },
        },
        required: ['answer', 'clue'],
      },
    },
  },
  required: ['title', 'topic', 'anchorWord', 'anchorClue', 'words'],
};

let genAI;
// Cria o cliente sob demanda: adia o require do SDK ate a primeira chamada real.
function getClient() {
  if (genAI === undefined) {
    const { GoogleGenAI } = require('@google/genai');
    genAI = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;
  }
  return genAI;
}

// Chama a API do Gemini e devolve o JSON bruto retornado pelo modelo.
async function requestPuzzle(prompt) {
  const client = getClient();
  if (!client) throw new Error('GEMINI_API_KEY nao configurada.');

  const response = await client.models.generateContent({
    model: geminiModel,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: puzzleResponseSchema,
      temperature: 0.9,
    },
  });

  try {
    return JSON.parse(response.text);
  } catch {
    throw new Error('A IA retornou uma resposta que nao e um JSON valido.');
  }
}

module.exports = { requestPuzzle };

