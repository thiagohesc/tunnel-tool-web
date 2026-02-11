# Configuracao

Este projeto usa um unico arquivo JSON para definir os tunels SSH.
O backend le e grava em `/data/tunnel_conf.json` (controlado por `DATA_DIR`).
A UI le e grava o mesmo JSON via API. Se voce usa um agent externo,
ele deve consumir o mesmo esquema (este repo nao inclui o agent).

## Esquema

Chaves no nivel raiz:
- `schema_version` (numero, opcional)
- `tunnels` (lista, obrigatoria)

Cada item de tunnel:
- `name` (texto, obrigatorio)
- `tags` (lista de textos, opcional)
- `enabled` (booleano, opcional, padrao: `true`)
- `local_port` (numero, obrigatorio, 1-65535)
- `dest_host` (texto, obrigatorio, endereco IP)
- `dest_port` (numero, obrigatorio, 1-65535)
- `ssh_user` (texto, obrigatorio)
- `ssh_host` (texto, obrigatorio, endereco IP)
- `ssh_port` (numero, opcional, 1-65535; o frontend sugere `22`)

## Exemplo

```json
{
  "schema_version": 1,
  "tunnels": [
    {
      "name": "Tunnel principal",
      "tags": ["monitoring"],
      "enabled": true,
      "local_port": 99999,
      "dest_host": "10.1.1.10",
      "dest_port": 10050,
      "ssh_user": "user",
      "ssh_host": "10.1.1.12",
      "ssh_port": 22
    }
  ]
}
```

## Variaveis de ambiente (backend)

O backend usa estas variaveis:

- `DATA_DIR` (padrao: `/data`): diretorio onde o `tunnel_conf.json` e salvo.
- `API_PORT` (padrao: `3001`): porta do servidor FastAPI.
- `ALLOW_CIDRS` (padrao: `127.0.0.1/32,::1/128`): lista de CIDRs permitidos para acesso.
- `CORS_ORIGINS` (padrao vazio): origens permitidas para CORS, separadas por virgula.

No `docker-compose.yml`, esses valores podem ser sobrescritos via `.env` ou variaveis
de ambiente do host.
