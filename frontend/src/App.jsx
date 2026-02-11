import { useEffect, useMemo, useState } from "react";
import HeaderBar from "./components/HeaderBar";
import HeroSection from "./components/HeroSection";
import PortCheckCard from "./components/PortCheckCard";
import TunnelDetailsCard from "./components/TunnelDetailsCard";
import TunnelListPanel from "./components/TunnelListPanel";
import ConfirmModal from "./components/modals/ConfirmModal";
import ImportModal from "./components/modals/ImportModal";
import {
  apiBase,
  buildTags,
  emptyTunnel,
  isIpValid,
  isPortValid,
  joinUrl,
  toNumber,
} from "./utils/tunnelUtils";

export default function App() {
  const [health, setHealth] = useState("checking");
  const [config, setConfig] = useState({ tunnels: [] });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("name");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pendingSave, setPendingSave] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [confirmImport, setConfirmImport] = useState(false);
  const [confirmSwitch, setConfirmSwitch] = useState(false);
  const [pendingSwitchIndex, setPendingSwitchIndex] = useState(null);
  const [lastSavedConfig, setLastSavedConfig] = useState(null);

  const [portCheckValue, setPortCheckValue] = useState("");
  const [portCheckResult, setPortCheckResult] = useState(null);
  const [portCheckLoading, setPortCheckLoading] = useState(false);

  const tunnels = config.tunnels || [];
  const selectedTunnel = tunnels[selectedIndex] || null;

  const filteredTunnels = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const base = tunnels.filter((tunnel) => {
      if (filter === "active" && !tunnel.enabled) return false;
      if (filter === "inactive" && tunnel.enabled) return false;
      if (!normalizedSearch) return true;
      const name = (tunnel.name || "").toLowerCase();
      const destHost = (tunnel.dest_host || "").toLowerCase();
      const sshHost = (tunnel.ssh_host || "").toLowerCase();
      const sshUser = (tunnel.ssh_user || "").toLowerCase();
      const localPort = String(tunnel.local_port ?? "");
      const tags = (tunnel.tags || [])
        .map((tag) => String(tag).toLowerCase())
        .join(" ");
      return (
        name.includes(normalizedSearch) ||
        destHost.includes(normalizedSearch) ||
        sshHost.includes(normalizedSearch) ||
        sshUser.includes(normalizedSearch) ||
        localPort.includes(normalizedSearch) ||
        tags.includes(normalizedSearch)
      );
    });

    const sorted = [...base];
    if (sort === "name") {
      sorted.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } else if (sort === "local_port") {
      sorted.sort((a, b) => (a.local_port || 0) - (b.local_port || 0));
    } else if (sort === "dest_host") {
      sorted.sort((a, b) => (a.dest_host || "").localeCompare(b.dest_host || ""));
    } else if (sort === "local_port_desc") {
      sorted.sort((a, b) => (b.local_port || 0) - (a.local_port || 0));
    } else if (sort === "name_desc") {
      sorted.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
    } else if (sort === "dest_host_desc") {
      sorted.sort((a, b) => (b.dest_host || "").localeCompare(a.dest_host || ""));
    }
    return sorted;
  }, [tunnels, search, filter, sort]);

  const selectedErrors = useMemo(() => {
    if (!selectedTunnel) return {};
    const errors = {};
    if (!selectedTunnel.name) errors.name = "Nome obrigatorio.";
    if (!selectedTunnel.dest_host) {
      errors.dest_host = "Destino obrigatorio.";
    } else if (!isIpValid(selectedTunnel.dest_host)) {
      errors.dest_host = "Destino deve ser um IP valido.";
    }
    if (!isPortValid(selectedTunnel.local_port)) {
      errors.local_port = "Porta local invalida.";
    }
    if (!isPortValid(selectedTunnel.dest_port)) {
      errors.dest_port = "Porta de destino invalida.";
    }
    if (!selectedTunnel.ssh_user) {
      errors.ssh_user = "SSH user obrigatorio.";
    }
    if (!selectedTunnel.ssh_host) {
      errors.ssh_host = "SSH host obrigatorio.";
    } else if (!isIpValid(selectedTunnel.ssh_host)) {
      errors.ssh_host = "SSH host deve ser um IP valido.";
    }
    if (
      selectedTunnel.ssh_port !== undefined &&
      selectedTunnel.ssh_port !== null &&
      selectedTunnel.ssh_port !== "" &&
      !isPortValid(Number(selectedTunnel.ssh_port))
    ) {
      errors.ssh_port = "Porta SSH invalida.";
    }
    return errors;
  }, [selectedTunnel]);

  const localPortDuplicates = useMemo(() => {
    const ports = tunnels.map((t) => t.local_port).filter((p) => p);
    const duplicates = ports.filter((p, idx) => ports.indexOf(p) !== idx);
    return new Set(duplicates);
  }, [tunnels]);

  const nameDuplicates = useMemo(() => {
    const names = tunnels
      .map((t) => (t.name || "").trim())
      .filter((n) => n.length);
    const duplicates = names.filter((n, idx) => names.indexOf(n) !== idx);
    return new Set(duplicates);
  }, [tunnels]);

  const hasDuplicates = localPortDuplicates.size > 0 || nameDuplicates.size > 0;
  const hasFieldErrors = Object.keys(selectedErrors).length > 0;
  const disableSave = saving || !pendingSave || hasDuplicates || hasFieldErrors;

  const activeCount = useMemo(
    () => tunnels.filter((t) => t.enabled).length,
    [tunnels]
  );
  const inactiveCount = tunnels.length - activeCount;

  const fetchHealth = async () => {
    try {
      const resp = await fetch(joinUrl(apiBase, "/health"));
      setHealth(resp.ok ? "ok" : "down");
    } catch {
      setHealth("down");
    }
  };

  const fetchConfig = async () => {
    setError("");
    setMessage("");
    setPendingSave(false);
    try {
      const resp = await fetch(joinUrl(apiBase, "/config"));
      if (!resp.ok) {
        throw new Error(`Falha ao carregar: ${resp.status}`);
      }
      const data = await resp.json();
      setConfig(data);
      setLastSavedConfig(data);
      setSelectedIndex(0);
    } catch (err) {
      setError(err.message || "Falha ao buscar configuracao");
    }
  };

  const saveConfig = async (overrideConfig) => {
    const isEvent =
      overrideConfig && typeof overrideConfig.preventDefault === "function";
    const payload = isEvent || !overrideConfig ? config : overrideConfig;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const resp = await fetch(joinUrl(apiBase, "/config"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload, null, 2),
      });
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body.detail || `Falha ao salvar: ${resp.status}`);
      }
      setMessage("Configuracao salva com sucesso.");
      setPendingSave(false);
      setLastSavedConfig(payload);
    } catch (err) {
      setError(err.message || "Falha ao salvar configuracao");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    fetchConfig();
    const timer = setInterval(fetchHealth, 15000);
    return () => clearInterval(timer);
  }, []);

  const onSelectTunnel = (originalIndex) => {
    if (pendingSave && originalIndex !== selectedIndex) {
      setPendingSwitchIndex(originalIndex);
      setConfirmSwitch(true);
      return;
    }
    setSelectedIndex(originalIndex);
    setMessage("");
    setError("");
  };

  const confirmSwitchTunnel = () => {
    if (pendingSwitchIndex === null) {
      setConfirmSwitch(false);
      return;
    }
    setSelectedIndex(pendingSwitchIndex);
    setPendingSwitchIndex(null);
    setConfirmSwitch(false);
    setMessage("");
    setError("");
  };

  const discardSwitchTunnel = () => {
    if (pendingSwitchIndex === null) {
      setConfirmSwitch(false);
      return;
    }
    if (lastSavedConfig) {
      setConfig(lastSavedConfig);
      setPendingSave(false);
    }
    setSelectedIndex(pendingSwitchIndex);
    setPendingSwitchIndex(null);
    setConfirmSwitch(false);
    setMessage("Alteracoes descartadas.");
    setError("");
  };

  const updateTunnel = (patch) => {
    setConfig((prev) => {
      const next = { ...prev };
      next.tunnels = [...(prev.tunnels || [])];
      next.tunnels[selectedIndex] = {
        ...next.tunnels[selectedIndex],
        ...patch,
      };
      return next;
    });
    setMessage("");
    setPendingSave(true);
  };

  const addTunnel = () => {
    setConfig((prev) => {
      const next = { ...prev };
      next.tunnels = [...(prev.tunnels || []), emptyTunnel()];
      return next;
    });
    setSelectedIndex(tunnels.length);
    setMessage("");
    setPendingSave(true);
  };

  const requestRemoveTunnel = () => {
    if (!selectedTunnel) return;
    setConfirmRemove(true);
  };

  const removeTunnel = async () => {
    if (!selectedTunnel) return;
    const nextConfig = {
      ...config,
      tunnels: (config.tunnels || []).filter((_, i) => i !== selectedIndex),
    };
    setConfig(nextConfig);
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    setMessage("Tunnel removido. Salvando...");
    setPendingSave(true);
    setConfirmRemove(false);
    await saveConfig(nextConfig);
  };

  const exportConfig = () => {
    const blob = new Blob([JSON.stringify(config, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tunnel_conf.json";
    a.click();
    URL.revokeObjectURL(url);
    setMessage("Exportado com sucesso.");
  };

  const checkPort = async (overridePort) => {
    const isEvent =
      overridePort && typeof overridePort.preventDefault === "function";
    const port = isEvent ? Number(portCheckValue) : overridePort ?? Number(portCheckValue);
    if (!port || port < 1 || port > 65535) {
      setPortCheckResult({
        status: "error",
        message: "A porta deve estar entre 1 e 65535.",
      });
      return;
    }
    if (tunnels.some((t) => Number(t.local_port) === port)) {
      setPortCheckResult({
        status: "busy",
        message: "Porta ja configurada na lista de tuneis.",
      });
      return;
    }
    setPortCheckLoading(true);
    setPortCheckResult(null);
    try {
      const resp = await fetch(joinUrl(apiBase, `/port-check?port=${port}`));
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body.detail || `Falha ao verificar: ${resp.status}`);
      }
      const data = await resp.json();
      if (typeof data?.in_use !== "boolean") {
        setPortCheckResult({
          status: "error",
          message: "Resposta inesperada do servidor.",
        });
      } else {
        setPortCheckResult({
          status: data.in_use ? "busy" : "ok",
          message: data.in_use ? "Porta em uso." : "Porta disponivel.",
        });
      }
    } catch (err) {
      setPortCheckResult({
        status: "error",
        message: err.message || "Falha ao verificar porta.",
      });
    } finally {
      setPortCheckLoading(false);
    }
  };

  const applyImport = () => {
    try {
      setConfirmImport(false);
      const parsed = JSON.parse(importText);
      if (!parsed || typeof parsed !== "object") {
        throw new Error("JSON invalido.");
      }
      if (!Array.isArray(parsed.tunnels)) {
        throw new Error("Campo 'tunnels' deve ser uma lista.");
      }
      for (let i = 0; i < parsed.tunnels.length; i += 1) {
        const tunnel = parsed.tunnels[i];
        if (!tunnel || typeof tunnel !== "object") {
          throw new Error(`Tunnel #${i} invalido.`);
        }
        const required = [
          "name",
          "local_port",
          "dest_host",
          "dest_port",
          "ssh_user",
          "ssh_host",
        ];
        const missing = required.filter((key) => !(key in tunnel));
        if (missing.length) {
          throw new Error(`Tunnel #${i} campos ausentes: ${missing.join(", ")}.`);
        }
        if (!isPortValid(Number(tunnel.local_port))) {
          throw new Error(`Tunnel #${i} local_port invalido.`);
        }
        if (!isPortValid(Number(tunnel.dest_port))) {
          throw new Error(`Tunnel #${i} dest_port invalido.`);
        }
        if (
          tunnel.ssh_port !== undefined &&
          tunnel.ssh_port !== null &&
          tunnel.ssh_port !== "" &&
          !isPortValid(Number(tunnel.ssh_port))
        ) {
          throw new Error(`Tunnel #${i} ssh_port invalido.`);
        }
        if (!isIpValid(tunnel.dest_host)) {
          throw new Error(`Tunnel #${i} dest_host invalido (IP obrigatorio).`);
        }
        if (!isIpValid(tunnel.ssh_host)) {
          throw new Error(`Tunnel #${i} ssh_host invalido (IP obrigatorio).`);
        }
      }
      const localPorts = parsed.tunnels.map((t) => t.local_port);
      const duplicatedPorts = localPorts.filter((p, idx) => localPorts.indexOf(p) !== idx);
      if (duplicatedPorts.length) {
        const ports = Array.from(new Set(duplicatedPorts)).join(", ");
        throw new Error(`local_port duplicado: ${ports}.`);
      }
      const names = parsed.tunnels
        .map((t) => (t.name || "").trim())
        .filter((n) => n.length);
      const duplicatedNames = names.filter((n, idx) => names.indexOf(n) !== idx);
      if (duplicatedNames.length) {
        const list = Array.from(new Set(duplicatedNames)).join(", ");
        throw new Error(`nome duplicado: ${list}.`);
      }
      setConfig(parsed);
      setSelectedIndex(0);
      setPendingSave(true);
      setMessage("JSON importado. Salve para aplicar.");
      setShowImport(false);
      setImportText("");
    } catch (err) {
      setError(err.message || "Falha ao importar JSON.");
    }
  };

  return (
    <div className="min-h-screen tt-fade-in">
      <div className="tt-main">
        <HeaderBar health={health} />

        <HeroSection
          search={search}
          setSearch={setSearch}
          filter={filter}
          setFilter={setFilter}
          tunnelsCount={tunnels.length}
          activeCount={activeCount}
          inactiveCount={inactiveCount}
          onAddTunnel={addTunnel}
          onExport={exportConfig}
          onImport={() => {
            setError("");
            setShowImport(true);
          }}
        />

        <section className="tt-grid">
          <TunnelListPanel
            tunnels={tunnels}
            filteredTunnels={filteredTunnels}
            sort={sort}
            setSort={setSort}
            selectedIndex={selectedIndex}
            onSelectTunnel={onSelectTunnel}
            localPortDuplicates={localPortDuplicates}
            nameDuplicates={nameDuplicates}
          />

          <div className="tt-panel">
            <PortCheckCard
              portCheckValue={portCheckValue}
              setPortCheckValue={setPortCheckValue}
              portCheckResult={portCheckResult}
              portCheckLoading={portCheckLoading}
              onCheckPort={checkPort}
            />

            <TunnelDetailsCard
              selectedIndex={selectedIndex}
              selectedTunnel={selectedTunnel}
              selectedErrors={selectedErrors}
              nameDuplicates={nameDuplicates}
              localPortDuplicates={localPortDuplicates}
              updateTunnel={updateTunnel}
              toNumber={toNumber}
              buildTags={buildTags}
              requestRemoveTunnel={requestRemoveTunnel}
              saveConfig={saveConfig}
              pendingSave={pendingSave}
              saving={saving}
              disableSave={disableSave}
              message={message}
              error={error}
            />
          </div>
        </section>
      </div>

      {confirmRemove && (
        <ConfirmModal
          title="Remover tunnel"
          description="Tem certeza que deseja remover este tunnel? Essa acao nao pode ser desfeita."
          confirmText="Remover"
          danger
          onConfirm={removeTunnel}
          onCancel={() => setConfirmRemove(false)}
        />
      )}

      {confirmSwitch && (
        <ConfirmModal
          title="Alteracoes pendentes"
          description="Existem alteracoes pendentes. Trocar sem salvar?"
          confirmText="Salvar alteracoes"
          onConfirm={async () => {
            if (disableSave) return;
            await saveConfig();
            confirmSwitchTunnel();
          }}
          onCancel={discardSwitchTunnel}
          disabled={disableSave}
        >
          {(hasDuplicates || hasFieldErrors) && (
            <div className="mt-3 rounded-xl border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
              {hasDuplicates && <p>Resolva nomes ou portas duplicadas.</p>}
              {hasFieldErrors && <p>Corrija os campos invalidos antes de salvar.</p>}
            </div>
          )}
        </ConfirmModal>
      )}

      {showImport && (
        <ImportModal
          error={error}
          importText={importText}
          setImportText={setImportText}
          onCancel={() => {
            setShowImport(false);
            setImportText("");
          }}
          onApply={() => setConfirmImport(true)}
        />
      )}

      {confirmImport && (
        <ConfirmModal
          title="Confirmar importacao"
          description="Isso vai sobrescrever toda a configuracao atual. Continuar?"
          confirmText="Confirmar"
          onConfirm={applyImport}
          onCancel={() => setConfirmImport(false)}
        />
      )}
    </div>
  );
}
