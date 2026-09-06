// Carrega variaveis do arquivo .env no ambiente de desenvolvimento.
require('dotenv').config();

// Libera requisições do aplicativo React Native em outras origens.
const cors = require('cors');
// Framework que cria o servidor e as rotas HTTP.
const express = require('express');
// Middleware que limita chamadas para evitar abuso da API.
const rateLimit = require('express-rate-limit');
// Rotas relacionadas a criacao e validacao das cruzadinhas.
const crosswordRouter = require('./routes/crosswords');

// Instancia principal da aplicacao Express.
const app = express();

// Considera o proxy da Vercel ao identificar o IP da requisicao.
app.set('trust proxy', 1);
// Le corpos JSON com tamanho maximo de 32 KB.
app.use(express.json({ limit: '32kb' }));
// Permite a origem definida em CORS_ORIGIN, ou todas durante o desenvolvimento.
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
// Restringe cada IP a 30 requisicoes por janela de 15 minutos.
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisicoes. Tente novamente mais tarde.' },
}));

// Rota usada pela Vercel e pelo cliente para verificar se o BFF esta ativo.
app.get('/health', (_request, response) => {
  response.status(200).json({ status: 'ok' });
});

// Registra as rotas com o prefixo /crosswords.
app.use('/crosswords', crosswordRouter);
// Mantem aliases curtos como /level/1 para clientes que usam esse contrato.
app.use('/', crosswordRouter);

// Trata JSON invalido e erros inesperados em uma unica resposta HTTP.
app.use((error, _request, response, _next) => {
  if (error instanceof SyntaxError && 'body' in error) {
    return response.status(400).json({ error: 'O corpo da requisicao deve ser um JSON valido.' });
  }

  console.error(error);
  return response.status(500).json({ error: 'Erro interno do servidor.' });
});

// Inicia o servidor somente quando este arquivo e executado diretamente.
if (require.main === module) {
  // Usa a porta definida pelo ambiente ou 3000 no computador local.
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`BFF rodando na porta ${port}`));
}

// Exporta a aplicacao para testes sem abrir uma porta fixa.
module.exports = app;
