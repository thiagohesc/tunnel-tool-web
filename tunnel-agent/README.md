# Tunnel Agent

## Estrutura

- `tunnel_agent.py`: script principal do agent.
- `conf_files/tunnel-agent.service`: unidade `systemd` padrao.
- `conf_files/tunnel-agent.timer`: unidade `systemd` padrao.
- `Makefile`: instala/remove unidades `systemd`.

## Execucao manual

```bash
python3 tunnel_agent.py conf_files/conf.json
```

Sem argumento, o script usa por padrao:

```text
conf_files/conf.json
```

## Systemd

Dentro de `tunnel-agent/`:

```bash
make install
make status
make logs
```

Para remover:

```bash
make uninstall
```

## Recomendado reiniciar serviços apos make install
```bash
sudo systemctl restart tunnel-agent.service
sudo systemctl restart tunnel-agent.timer
```
