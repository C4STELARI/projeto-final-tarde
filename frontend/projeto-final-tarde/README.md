# Projeto Final

Aplicação de rede social feita com React, React Router e Express.

## Executar localmente

Na raiz do repositório, instale as dependências do backend:

```powershell
cd backend
npm install
Copy-Item .env.example .env
```

Edite `backend/.env` e defina `ADMIN_EMAIL` e `ADMIN_PASSWORD` para sua conta.
Esse arquivo é ignorado pelo Git e não deve ser compartilhado.

Inicie a API:

```powershell
npm start
```

Em outro terminal, inicie o frontend:

```powershell
cd frontend/projeto-final-tarde
npm install
npm run dev
```

A API fica em `http://localhost:3000` e o frontend em `http://localhost:5173`.
O feed, o perfil e as configurações precisam da API em execução.

As publicações e informações do perfil são salvas localmente em
`backend/data/store.json`. As fotos enviadas ficam em `backend/uploads`.
Esses dados locais são ignorados pelo Git.
