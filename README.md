# BFF English Learning Crossword

BFF em Node.js para um aplicativo React Native de aprendizado de ingles por cruzadinhas. O backend possui um catalogo local de palavras e dicas em ingles, organizado em dez niveis, sem depender de IA ou servicos pagos.

## Configuracao

1. Instale e execute:

```bash
npm install
npm run dev
```

O servidor inicia em `http://localhost:3000` por padrao. Para um dispositivo fisico React Native, use o endereco IP local da maquina em vez de `localhost`.

## Deploy na Vercel

O arquivo `vercel.json` e a funcao `api/index.js` configuram o Express para rodar como uma funcao serverless. Na Vercel, importe este repositorio e mantenha o diretorio raiz como a pasta do projeto.

A Vercel instalara as dependencias usando o `package-lock.json`. Nenhuma chave de API e necessaria nesta versao local. Nao envie o arquivo `.env` ao Git: ele e destinado somente ao desenvolvimento local.

Depois do deploy, a URL publica sera semelhante a:

```text
https://seu-projeto.vercel.app
```

Use estas rotas:

```text
GET  https://seu-projeto.vercel.app/health
POST https://seu-projeto.vercel.app/crosswords/levels/1
POST https://seu-projeto.vercel.app/crosswords/levels/1/validate
```

## Endpoints

`GET /health` confirma que o BFF esta disponivel.

`POST /crosswords/levels/:level` retorna a cruzadinha cadastrada para um nivel de `1` a `10`. A requisicao nao precisa de corpo.

Tambem existe o alias curto `POST /level/:level`, por exemplo `POST /level/1`.

`POST /crosswords/levels/:level/validate` valida as palavras preenchidas. Envie as respostas que estao na grade:

O alias curto equivalente e `POST /level/:level/validate`.

```json
{
	"answers": [
		{ "entryId": 1, "answer": "PENCIL" },
		{ "entryId": 2, "answer": "PEN" }
	]
}
```

A resposta retorna o resultado de cada palavra e permite avancar apenas quando todas estiverem corretas:

```json
{
	"level": 1,
	"results": [
		{ "entryId": 1, "correct": true },
		{ "entryId": 2, "correct": false }
	],
	"completed": false
}
```

No React Native, envie as palavras preenchidas a cada tentativa e libere o proximo nivel somente se `completed` for `true`.

Exemplo de resposta:

```json
{
	"level": 3,
	"title": "Food Basics",
	"topic": "food",
	"entries": [
		{
			"id": 1,
			"answer": "APPLE",
			"clue": "A round fruit that can be red or green.",
			"row": 2,
			"column": 1,
			"direction": "across"
		}
	]
}
```

As coordenadas sao baseadas em zero, em uma grade de `12 x 12`. As dicas e respostas sao em ingles para sustentar a dinamica duplex: o usuario le a dica em ingles e preenche a resposta em ingles.

## Qualidade

```bash
npm test
```

Cada nivel possui seis palavras conectadas em uma grade de `12 x 12`, com pistas e respostas em ingles. Para ampliar o conteudo, adicione novos registros ao catalogo em `src/services/crosswordService.js`. Para testar localmente, continue usando `npm start`; a Vercel usa `api/index.js` como entrada serverless.