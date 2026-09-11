// Framework usado para agrupar as rotas deste recurso.
const express = require('express');
// Funcoes de negocio que geram e validam as cruzadinhas via IA.
const { generateCrossword, validateCrossword } = require('../services/crosswordService');

// Roteador que sera registrado com o prefixo /crosswords no app principal.
const router = express.Router();

// Retorna a cruzadinha gerada pela IA para o nivel informado na URL.
router.post(['/levels/:level', '/level/:level'], async (request, response, next) => {
  // Converte o parametro de texto da URL em numero inteiro.
  const level = Number.parseInt(request.params.level, 10);

  // Impede que o cliente solicite um nivel invalido.
  if (!Number.isInteger(level) || level < 1) {
    return response.status(400).json({ error: 'O nivel deve ser um numero inteiro maior ou igual a 1.' });
  }

  try {
    // Monta a grade com palavras e pistas geradas pela IA.
    const crossword = await generateCrossword({ level });
    return response.status(200).json(crossword);
  } catch (error) {
    return next(error);
  }
});

// Confere as palavras digitadas pelo usuario no nivel solicitado.
router.post(['/levels/:level/validate', '/level/:level/validate'], async (request, response, next) => {
  // Identifica o nivel que o usuario esta tentando concluir.
  const level = Number.parseInt(request.params.level, 10);
  // Le a lista de respostas enviada no corpo JSON da requisicao.
  const answers = request.body?.answers;

  // Impede que o cliente envie um nivel invalido.
  if (!Number.isInteger(level) || level < 1) {
    return response.status(400).json({ error: 'O nivel deve ser um numero inteiro maior ou igual a 1.' });
  }

  // Garante que cada resposta tenha o id da palavra e o texto digitado.
  if (!Array.isArray(answers) || answers.some((answer) => !answer || !Number.isInteger(answer.entryId) || typeof answer.answer !== 'string')) {
    return response.status(400).json({ error: 'Envie answers como uma lista de entryId e answer.' });
  }

  try {
    // Retorna cada acerto e completed=true apenas se todas estiverem corretas.
    return response.status(200).json(await validateCrossword({ level, answers }));
  } catch (error) {
    return next(error);
  }
});

// Disponibiliza as rotas para o arquivo app.js.
module.exports = router;
