# Arquitetura

O projeto e dividido em duas partes neste repo: API backend e UI frontend.
Um agent externo pode consumir o JSON e abrir os tunels, mas nao faz parte
deste repositorio.

## Componentes

- **API Backend** (`backend/main.py`)
  - Servico FastAPI com:
    - `GET /health` para checagem de saude
    - `GET /config` para ler configuracao
    - `PUT /config` para validar e salvar configuracao
    - `GET /port-check?port=XXXX` para checar uso de porta local
  - Persiste o JSON em `/data/tunnel_conf.json`.
  - Restringe acesso por IP usando `ALLOW_CIDRS`.

- **UI Frontend** (`frontend/src/App.jsx`)
  - UI de pagina unica para gerenciar o config.
  - Fala com o backend via `/api/*` (proxy do Nginx).
  - Faz validacao e import/export do JSON.

- **Agent (externo, opcional)**
  - Consumiria o mesmo JSON e abriria os tunels SSH.
  - Nao esta incluso neste repositorio.

## Fluxo de Dados

1. O frontend carrega o config via `GET /api/config`.
2. O usuario edita os tunnels e salva via `PUT /api/config`.
3. O backend grava o JSON em `/data/tunnel_conf.json`.
4. Opcional: um agent externo le o mesmo JSON e inicia os tunels SSH.

## Implantacao

- O Docker Compose sobe backend, frontend (Nginx) e um volume `/data` compartilhado.
- Um agent, se usado, deve ser implantado separadamente.
