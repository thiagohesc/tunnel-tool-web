// Base fixa para todas as chamadas da UI.
export const apiBase = "/api";

/**
 * Junta base + path evitando barras duplicadas.
 */
export const joinUrl = (base, path) => {
  const trimmed = base.replace(/\/+$/, "");
  return `${trimmed}${path}`;
};

/**
 * Modelo padrao de tunnel.
 */
export const emptyTunnel = () => ({
  name: "",
  tags: [],
  enabled: true,
  local_port: 0,
  dest_host: "",
  dest_port: 0,
  ssh_user: "",
  ssh_host: "",
  ssh_port: 22,
});

/**
 * Converte string/number para numero ou 0 quando invalido.
 */
export const toNumber = (value) => {
  if (value === "" || value === null || value === undefined) return 0;
  const n = Number(value);
  return Number.isNaN(n) ? 0 : n;
};

/**
 * Valida intervalo de portas TCP.
 */
export const isPortValid = (port) => port >= 1 && port <= 65535;

/**
 * Valida IPv4 simples (a.b.c.d).
 */
export const isIpValid = (value) => {
  if (!value) return false;
  const parts = String(value).trim().split(".");
  if (parts.length !== 4) return false;
  return parts.every((part) => {
    if (!/^\d{1,3}$/.test(part)) return false;
    const num = Number(part);
    return num >= 0 && num <= 255;
  });
};

/**
 * Normaliza tags separadas por virgula.
 */
export const buildTags = (value) =>
  value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
