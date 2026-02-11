"""Servico FastAPI para leitura e gravacao da configuracao de tunels."""

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import json
import ipaddress
import os
import psutil

DATA_DIR = Path(os.getenv("DATA_DIR", "/data"))
CONF_PATH = DATA_DIR / "tunnel_conf.json"

app = FastAPI(title="Tunnel Config API")


def _cors_origins() -> list[str]:
    raw = os.getenv("CORS_ORIGINS")
    if raw is None:
        return ["http://127.0.0.1:8081", "http://localhost:8081"]
    if not raw.strip():
        return []
    return [part.strip() for part in raw.split(",") if part.strip()]


app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins(),
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _allowed_networks() -> list[ipaddress._BaseNetwork]:
    raw = os.getenv("ALLOW_CIDRS", "127.0.0.1/32,::1/128")
    networks: list[ipaddress._BaseNetwork] = []
    for item in (part.strip() for part in raw.split(",") if part.strip()):
        networks.append(ipaddress.ip_network(item, strict=False))
    return networks


ALLOWED_NETWORKS = _allowed_networks()


@app.middleware("http")
async def allow_local_only(request: Request, call_next):
    client_host = request.client.host if request.client else ""
    try:
        client_ip = ipaddress.ip_address(client_host)
    except ValueError:
        return JSONResponse(status_code=403, content={"detail": "Local access only."})

    if not any(client_ip in net for net in ALLOWED_NETWORKS):
        return JSONResponse(status_code=403, content={"detail": "Local access only."})
    return await call_next(request)


def default_config() -> dict:
    """Cria a configuracao padrao de tunels.

    Returns:
        dict: Estrutura base com lista de tunels vazia.
    """
    return {
        "schema_version": 1,
        "tunnels": [],
    }


@app.get("/health")
def health() -> dict:
    """Verifica a saude do servico.

    Returns:
        dict: Indicador simples de saude.
    """
    return {"ok": True}


@app.get("/config")
def get_config() -> dict:
    """Carrega a configuracao persistida em disco.

    Cria o arquivo de configuracao com valores padrao se nao existir.

    Returns:
        dict: Configuracao atual.

    Raises:
        HTTPException: Erro ao ler ou fazer parse do JSON.
    """
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    if not CONF_PATH.exists():
        cfg = default_config()
        CONF_PATH.write_text(json.dumps(cfg, indent=2), encoding="utf-8")
        return cfg

    try:
        return json.loads(CONF_PATH.read_text(encoding="utf-8"))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading JSON: {e}")


@app.get("/port-check")
def port_check(port: int) -> dict:
    """Checa se uma porta local ja esta em uso no host."""
    if port < 1 or port > 65535:
        raise HTTPException(status_code=400, detail="Port out of range.")

    try:
        in_use = any(
            conn.status == psutil.CONN_LISTEN and conn.laddr.port == port
            for conn in psutil.net_connections(kind="tcp")
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Port check failed: {e}")

    return {"port": port, "in_use": in_use}


@app.put("/config")
def save_config(payload: dict) -> dict:
    """Valida e persiste a configuracao enviada no payload.

    Args:
        payload (dict): Configuracao completa contendo a chave "tunnels".

    Returns:
        dict: Confirmacao de sucesso.

    Raises:
        HTTPException: Payload invalido (ausencia ou formato incorreto de "tunnels").
    """
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    if "tunnels" not in payload or not isinstance(payload["tunnels"], list):
        raise HTTPException(status_code=400, detail="Field 'tunnels' must be a list.")

    for idx, tunnel in enumerate(payload["tunnels"]):
        if not isinstance(tunnel, dict):
            raise HTTPException(
                status_code=400, detail=f"Tunnel #{idx} must be an object."
            )
        required = [
            "name",
            "local_port",
            "dest_host",
            "dest_port",
            "ssh_user",
            "ssh_host",
        ]
        missing = [k for k in required if k not in tunnel]
        if missing:
            raise HTTPException(
                status_code=400,
                detail=f"Tunnel #{idx} missing fields: {', '.join(missing)}.",
            )
        if not isinstance(tunnel["name"], str) or not tunnel["name"].strip():
            raise HTTPException(status_code=400, detail=f"Tunnel #{idx} invalid name.")
        if not isinstance(tunnel.get("enabled", True), bool):
            raise HTTPException(
                status_code=400, detail=f"Tunnel #{idx} invalid enabled."
            )
        if "tags" in tunnel:
            if not isinstance(tunnel["tags"], list) or not all(
                isinstance(tag, str) for tag in tunnel["tags"]
            ):
                raise HTTPException(
                    status_code=400, detail=f"Tunnel #{idx} invalid tags."
                )
        if not isinstance(tunnel["local_port"], int) or not (
            1 <= tunnel["local_port"] <= 65535
        ):
            raise HTTPException(
                status_code=400, detail=f"Tunnel #{idx} invalid local_port."
            )
        if not isinstance(tunnel["dest_port"], int) or not (
            1 <= tunnel["dest_port"] <= 65535
        ):
            raise HTTPException(
                status_code=400, detail=f"Tunnel #{idx} invalid dest_port."
            )
        try:
            ipaddress.ip_address(str(tunnel["dest_host"]))
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Tunnel #{idx} invalid dest_host (IP required).",
            )
        if not isinstance(tunnel["ssh_user"], str) or not tunnel["ssh_user"].strip():
            raise HTTPException(
                status_code=400, detail=f"Tunnel #{idx} invalid ssh_user."
            )
        if not isinstance(tunnel["ssh_host"], str) or not tunnel["ssh_host"].strip():
            raise HTTPException(
                status_code=400, detail=f"Tunnel #{idx} invalid ssh_host."
            )
        try:
            ipaddress.ip_address(str(tunnel["ssh_host"]))
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Tunnel #{idx} invalid ssh_host (IP required).",
            )
        if "ssh_port" in tunnel and tunnel["ssh_port"] is not None:
            if not isinstance(tunnel["ssh_port"], int) or not (
                1 <= tunnel["ssh_port"] <= 65535
            ):
                raise HTTPException(
                    status_code=400, detail=f"Tunnel #{idx} invalid ssh_port."
                )

    local_ports = [
        tunnel.get("local_port")
        for tunnel in payload["tunnels"]
        if isinstance(tunnel, dict)
    ]
    duplicates = {port for port in local_ports if local_ports.count(port) > 1}
    if duplicates:
        ports = ", ".join(str(p) for p in sorted(duplicates))
        raise HTTPException(status_code=400, detail=f"duplicate local_port: {ports}.")

    names = [
        tunnel.get("name", "").strip()
        for tunnel in payload["tunnels"]
        if isinstance(tunnel, dict)
    ]
    name_dups = {n for n in names if n and names.count(n) > 1}
    if name_dups:
        names_list = ", ".join(sorted(name_dups))
        raise HTTPException(status_code=400, detail=f"duplicate name: {names_list}.")

    CONF_PATH.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    return {"ok": True}
