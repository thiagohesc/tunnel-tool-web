#!/usr/bin/env python3
"""Agent para garantir túneis SSH locais com base em um arquivo JSON."""
from __future__ import annotations

import json
import logging
import socket
import subprocess
import sys
from logging.handlers import RotatingFileHandler
from pathlib import Path
from typing import Any

BASE_DIR = Path(__file__).resolve().parent
DEFAULT_CONFIG = BASE_DIR / "conf_files" / "conf.json"
FALLBACK_CONFIG = BASE_DIR / "conf_files" / "tunnel_conf.json"
LOG_FILE = BASE_DIR / "logs" / "tunnels.log"
MAX_LOG_SIZE = 5 * 1024 * 1024  # 20 MB
BACKUP_COUNT = 5


def setup_logger() -> logging.Logger:
    """Configura e retorna o logger com rotação de arquivo."""
    logger = logging.getLogger("tunnel_agent")
    logger.setLevel(logging.INFO)

    if logger.handlers:
        return logger

    LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
    formatter = logging.Formatter("%(asctime)s - %(message)s")
    handler = RotatingFileHandler(
        str(LOG_FILE),
        maxBytes=MAX_LOG_SIZE,
        backupCount=BACKUP_COUNT,
        encoding="utf-8",
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    return logger


def port_is_up(port: int, host: str = "127.0.0.1", timeout_s: float = 3.0) -> bool:
    """Retorna True se a porta local estiver aceitando conexão TCP."""
    try:
        with socket.create_connection((host, port), timeout=timeout_s):
            return True
    except OSError:
        return False


def resolve_config_path(argv: list[str]) -> Path:
    """Resolve o caminho do arquivo de configuração a partir dos argumentos."""
    if len(argv) > 2:
        raise ValueError("Uso: python3 tunnel_agent.py [config.json]")
    if len(argv) == 2:
        return Path(argv[1])
    if DEFAULT_CONFIG.exists():
        return DEFAULT_CONFIG
    return FALLBACK_CONFIG


def load_tunnels(config_path: Path) -> list[dict[str, Any]]:
    """Carrega e retorna a lista de túneis do JSON de configuração."""
    data = json.loads(config_path.read_text(encoding="utf-8"))
    tunnels = data.get("tunnels", [])
    if not isinstance(tunnels, list):
        raise ValueError("Campo 'tunnels' deve ser uma lista.")
    return tunnels


def validate_enabled_tunnel(tunnel: dict[str, Any], idx: int) -> None:
    """Valida campos obrigatórios e tipos numéricos de um túnel habilitado."""
    required = ["local_port", "dest_host", "dest_port", "ssh_user", "ssh_host"]
    missing = [
        key for key in required if key not in tunnel or tunnel[key] in ("", None)
    ]
    if missing:
        raise ValueError(f"Tunnel #{idx} sem campos obrigatorios: {', '.join(missing)}")
    int(tunnel["local_port"])
    int(tunnel["dest_port"])
    int(tunnel.get("ssh_port", 22))


def build_ssh_command(tunnel: dict[str, Any]) -> list[str]:
    """Monta o comando SSH no formato simples com port-forward local."""
    user = str(tunnel["ssh_user"])
    host = str(tunnel["ssh_host"])
    local_port = int(tunnel["local_port"])
    dest_host = str(tunnel["dest_host"])
    dest_port = int(tunnel["dest_port"])
    ssh_port = int(tunnel.get("ssh_port", 22))

    cmd = ["ssh", f"{user}@{host}"]
    if ssh_port != 22:
        cmd += ["-p", str(ssh_port)]
    cmd += ["-L", f"{local_port}:{dest_host}:{dest_port}", "-f", "-g", "-N"]
    return cmd


def run(config_path: Path, logger: logging.Logger) -> int:
    """Executa o ciclo do agent: valida, checa portas e inicia túneis."""
    if not config_path.exists():
        logger.error("Arquivo de configuracao nao encontrado: %s", config_path)
        return 1

    try:
        tunnels = load_tunnels(config_path)
    except Exception as exc:
        logger.error("Erro lendo JSON: %s", exc)
        return 2

    enabled_tunnels = [t for t in tunnels if bool(t.get("enabled", False))]
    if not enabled_tunnels:
        logger.info("Nenhum tunnel habilitado.")
        return 0

    for idx, tunnel in enumerate(enabled_tunnels):
        try:
            validate_enabled_tunnel(tunnel, idx)
        except Exception as exc:
            logger.error("%s", exc)
            continue

        port = int(tunnel["local_port"])
        name = str(tunnel.get("name", f"tunnel-{idx}"))
        cmd = build_ssh_command(tunnel)

        if port_is_up(port):
            logger.info("Porta %s em localhost UP!. (%s)", port, name)
            continue

        logger.info(
            "Porta %s em localhost DOWN!. (%s)",
            port,
            name,
        )

        logger.info(
            "Executando: %s",
            " ".join(cmd),
        )

        try:
            subprocess.run(
                cmd,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                check=True,
            )
        except FileNotFoundError:
            logger.error("Comando 'ssh' nao encontrado no PATH.")
            return 3
        except subprocess.CalledProcessError:
            logger.error("Falha ao executar tunnel: %s", name)
            continue

    return 0


def main() -> int:
    """Ponto de entrada principal do script."""
    logger = setup_logger()
    try:
        config_path = resolve_config_path(sys.argv)
    except ValueError as exc:
        logger.error("%s", exc)
        return 1
    return run(config_path, logger)


if __name__ == "__main__":
    raise SystemExit(main())
