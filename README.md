# DRAKSYON ANIMES - Vercel Deploy

## Como fazer deploy na Vercel

### 1. Suba para o GitHub
1. Crie um repositório novo no GitHub
2. Faça upload de TODOS os arquivos desta pasta (mantendo a estrutura)

### 2. Conecte na Vercel
1. Acesse [vercel.com](https://vercel.com) e faça login com GitHub
2. Clique em "Add New Project"
3. Selecione o repositório que você criou
4. Clique em "Deploy" (sem alterar nada)

### 3. Pronto!
A Vercel vai instalar as dependências e fazer o deploy automaticamente.

## Estrutura do Projeto
```
draksyon-vercel/
├── api/                    ← Serverless Functions (backend)
│   ├── _utils.js           ← Utilitários compartilhados
│   ├── categorias.js       ← GET /api/categorias
│   ├── detalhes.js         ← GET /api/detalhes?anime=slug
│   ├── dublados.js         ← GET /api/dublados?page=1
│   ├── lancamentos.js      ← GET /api/lancamentos?page=1
│   ├── legendados.js       ← GET /api/legendados?page=1
│   ├── pesquisar.js        ← GET /api/pesquisar?q=texto
│   ├── player.js           ← GET /api/player?link=url
│   ├── genero/
│   │   └── [genero].js     ← GET /api/genero/:genero?page=1
│   └── s2/                 ← Servidor 2 (Animes Online)
│       ├── categorias.js
│       ├── detalhes.js
│       ├── dublados.js
│       ├── lancamentos.js
│       ├── legendados.js
│       ├── pesquisar.js
│       ├── player.js
│       └── genero/
│           └── [genero].js
├── public/                 ← Arquivos estáticos (frontend)
│   ├── index.html
│   ├── detalhes.html
│   └── player-animes.html
├── package.json
├── vercel.json
└── README.md
```
