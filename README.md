# Frontend do Tunnel Tool

Este frontend oferece uma UI para gerenciar a configuracao de tunels no backend.
Ele e servido por Nginx e faz proxy das requisicoes da API para `/api`.

## Como funciona
- A UI chama `/api/*`.
- O Nginx faz proxy de `/api` para o servico `api` no Docker Compose.

## Rodar com Docker Compose
Na raiz do repo:
```bash
mkdir -p /data
docker compose up --build
```
Depois acesse:
- http://127.0.0.1:8081

## Build local (opcional)
```bash
cd frontend
npm install
npm run build
```
A build de producao e servida pelo Nginx no Dockerfile.

## Notas
- A base da API e fixa em `/api` (ver `src/App.jsx`).
- Se voce acessar a API diretamente, precisa liberar o acesso no backend
  (configure `ALLOW_CIDRS` e, se necessario, `CORS_ORIGINS`).
