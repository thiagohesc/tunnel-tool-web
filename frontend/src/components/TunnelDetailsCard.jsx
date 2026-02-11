import { useEffect, useState } from "react";

export default function TunnelDetailsCard({
  selectedIndex,
  selectedTunnel,
  selectedErrors,
  nameDuplicates,
  localPortDuplicates,
  updateTunnel,
  toNumber,
  buildTags,
  requestRemoveTunnel,
  saveConfig,
  pendingSave,
  saving,
  disableSave,
  message,
  error,
}) {
  const [tagsInput, setTagsInput] = useState("");
  const [tagsDirty, setTagsDirty] = useState(false);

  useEffect(() => {
    if (!selectedTunnel) {
      setTagsInput("");
      setTagsDirty(false);
      return;
    }
    setTagsInput((selectedTunnel.tags || []).join(", "));
    setTagsDirty(false);
  }, [selectedIndex]);

  useEffect(() => {
    if (!selectedTunnel || tagsDirty) return;
    setTagsInput((selectedTunnel.tags || []).join(", "));
  }, [selectedTunnel?.tags, tagsDirty, selectedTunnel]);

  return (
    <div className="tt-card tt-panel-content">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="tt-subheading">Tunnel Details</h2>
        <div className="flex items-center gap-2">
          <button
            className="tt-button tt-button-danger tt-button-sm"
            onClick={requestRemoveTunnel}
            disabled={!selectedTunnel}
          >
            Remover
          </button>
        </div>
      </div>

      {!selectedTunnel && (
        <p className="mt-4 text-sm tt-muted">Selecione um tunnel.</p>
      )}

      {selectedTunnel && (
        <div className="mt-3 tt-details-grid">
          <div className="tt-details-row tt-details-row-main">
            <label className="tt-details-field">
              Nome
              <input
                className={`tt-input ${
                  selectedErrors.name ? "border-rose-400/60 bg-rose-500/10" : ""
                }`}
                value={selectedTunnel.name}
                onChange={(e) => updateTunnel({ name: e.target.value })}
              />
              {nameDuplicates.has((selectedTunnel.name || "").trim()) && (
                <span className="text-xs text-rose-300">Nome duplicado.</span>
              )}
              {selectedErrors.name && (
                <span className="text-xs text-rose-300">{selectedErrors.name}</span>
              )}
            </label>
            <div className="tt-details-status">
              Status
              <button
                className={`tt-button tt-button-sm w-full tt-button-status tt-input-like ${
                  selectedTunnel.enabled
                    ? "tt-button-status-active"
                    : "tt-button-status-inactive"
                }`}
                onClick={() => updateTunnel({ enabled: !selectedTunnel.enabled })}
              >
                {selectedTunnel.enabled ? "Ativo" : "Inativo"}
              </button>
            </div>
          </div>

          <label className="tt-details-field">
            Tags (separador ",")
            <input
              className="tt-input"
              value={tagsInput}
              onChange={(e) => {
                const nextValue = e.target.value;
                setTagsInput(nextValue);
                setTagsDirty(true);
                updateTunnel({ tags: buildTags(nextValue) });
              }}
              onBlur={() => {
                if (!tagsDirty) return;
                const normalized = buildTags(tagsInput);
                setTagsInput(normalized.join(", "));
                setTagsDirty(false);
                updateTunnel({ tags: normalized });
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.currentTarget.blur();
                }
              }}
            />
          </label>

          <div className="tt-details-row">
            <label className="tt-details-field">
              Porta local
              <input
                type="number"
                className={`tt-input ${
                  selectedErrors.local_port ||
                  localPortDuplicates.has(selectedTunnel.local_port)
                    ? "border-rose-400/60 bg-rose-500/10"
                    : ""
                }`}
                value={selectedTunnel.local_port || ""}
                onChange={(e) =>
                  updateTunnel({ local_port: toNumber(e.target.value) })
                }
              />
              {localPortDuplicates.has(selectedTunnel.local_port) && (
                <span className="text-xs text-rose-300">Porta local duplicada.</span>
              )}
              {selectedErrors.local_port && (
                <span className="text-xs text-rose-300">
                  {selectedErrors.local_port}
                </span>
              )}
            </label>
            <label className="tt-details-field">
              Destino
              <input
                className={`tt-input ${
                  selectedErrors.dest_host
                    ? "border-rose-400/60 bg-rose-500/10"
                    : ""
                }`}
                value={selectedTunnel.dest_host}
                onChange={(e) => updateTunnel({ dest_host: e.target.value })}
                placeholder="10.0.0.1"
              />
              {selectedErrors.dest_host && (
                <span className="text-xs text-rose-300">
                  {selectedErrors.dest_host}
                </span>
              )}
            </label>
            <label className="tt-details-field">
              Porta de destino
              <input
                type="number"
                className={`tt-input ${
                  selectedErrors.dest_port
                    ? "border-rose-400/60 bg-rose-500/10"
                    : ""
                }`}
                value={selectedTunnel.dest_port || ""}
                onChange={(e) => updateTunnel({ dest_port: toNumber(e.target.value) })}
              />
              {selectedErrors.dest_port && (
                <span className="text-xs text-rose-300">
                  {selectedErrors.dest_port}
                </span>
              )}
            </label>
          </div>

          <div className="tt-details-row">
            <label className="tt-details-field">
              SSH usuario
              <input
                className={`tt-input ${
                  selectedErrors.ssh_user
                    ? "border-rose-400/60 bg-rose-500/10"
                    : ""
                }`}
                value={selectedTunnel.ssh_user || ""}
                onChange={(e) => updateTunnel({ ssh_user: e.target.value })}
                placeholder="user"
              />
              {selectedErrors.ssh_user && (
                <span className="text-xs text-rose-300">
                  {selectedErrors.ssh_user}
                </span>
              )}
            </label>
            <label className="tt-details-field">
              SSH host
              <input
                className={`tt-input ${
                  selectedErrors.ssh_host
                    ? "border-rose-400/60 bg-rose-500/10"
                    : ""
                }`}
                value={selectedTunnel.ssh_host || ""}
                onChange={(e) => updateTunnel({ ssh_host: e.target.value })}
                placeholder="10.0.0.10"
              />
              {selectedErrors.ssh_host && (
                <span className="text-xs text-rose-300">
                  {selectedErrors.ssh_host}
                </span>
              )}
            </label>
            <label className="tt-details-field">
              SSH porta
              <input
                type="number"
                className={`tt-input ${
                  selectedErrors.ssh_port
                    ? "border-rose-400/60 bg-rose-500/10"
                    : ""
                }`}
                value={selectedTunnel.ssh_port ?? ""}
                onChange={(e) =>
                  updateTunnel({
                    ssh_port: e.target.value === "" ? "" : toNumber(e.target.value),
                  })
                }
                placeholder="22"
              />
              {selectedErrors.ssh_port && (
                <span className="text-xs text-rose-300">
                  {selectedErrors.ssh_port}
                </span>
              )}
            </label>
          </div>
          <div className="tt-actions">
            <button
              className={`tt-button ${
                pendingSave ? "tt-button-save-dirty" : "tt-button-primary"
              } ${disableSave ? "opacity-60 cursor-not-allowed" : ""}`}
              onClick={() => saveConfig()}
              disabled={disableSave}
            >
              {saving
                ? "Salvando..."
                : pendingSave
                ? "Salvar alteracoes"
                : "Sem alteracoes"}
            </button>
          </div>
          <div className="text-sm tt-text">
            {pendingSave && (
              <p className="tt-warning">Ha alteracoes pendentes. Salve para aplicar.</p>
            )}
            {message && <p className="tt-success">{message}</p>}
            {error && <p className="text-rose-400">{error}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
