export default function TunnelListPanel({
  tunnels,
  filteredTunnels,
  sort,
  setSort,
  selectedIndex,
  onSelectTunnel,
  localPortDuplicates,
  nameDuplicates,
}) {
  return (
    <div className="tt-panel">
      <div className="tt-card-sm tt-panel-header tt-top-row-card">
        <div>
          <h2 className="tt-subheading">Tunnels</h2>
          <p className="tt-muted text-sm">{tunnels.length} total</p>
        </div>
        <select
          className="tt-input text-xs"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="name">Nome (A→Z)</option>
          <option value="name_desc">Nome (Z→A)</option>
          <option value="local_port">Porta local (menor→maior)</option>
          <option value="local_port_desc">Porta local (maior→menor)</option>
          <option value="dest_host">Destino (A→Z)</option>
          <option value="dest_host_desc">Destino (Z→A)</option>
        </select>
      </div>

      <div className="tt-table">
        <div className="tt-table-head">
          <span>Nome</span>
          <span>Local</span>
          <span>Destino</span>
          <span>SSH</span>
          <span>Status</span>
        </div>
        <div className="tt-table-body">
          {filteredTunnels.length === 0 && (
            <div className="tt-empty">Nenhum tunnel encontrado.</div>
          )}
          {filteredTunnels.map((tunnel) => {
            const originalIndex = tunnels.indexOf(tunnel);
            const duplicatedPort = localPortDuplicates.has(tunnel.local_port);
            const duplicatedName = nameDuplicates.has((tunnel.name || "").trim());
            return (
              <button
                key={`${tunnel.name}-${originalIndex}`}
                onClick={() => onSelectTunnel(originalIndex)}
                className={`tt-table-row ${
                  originalIndex === selectedIndex ? "is-active" : ""
                }`}
              >
                <span className="tt-row-title">
                  {tunnel.name || "(sem nome)"}
                  {duplicatedName && <em className="tt-row-warn">nome duplicado</em>}
                  {!!(tunnel.tags || []).length && (
                    <span className="tt-row-tags">{tunnel.tags.join(", ")}</span>
                  )}
                </span>
                <span className="tt-row-mono">
                  {tunnel.local_port || "-"}
                  {duplicatedPort && <em className="tt-row-warn">porta duplicada</em>}
                </span>
                <span>
                  {tunnel.dest_host ? `${tunnel.dest_host}:${tunnel.dest_port}` : "-"}
                </span>
                <span className="tt-row-mono">
                  {tunnel.ssh_user || "?"}@{tunnel.ssh_host || "?"}
                </span>
                <span className={`tt-badge ${tunnel.enabled ? "is-up" : "is-down"}`}>
                  {tunnel.enabled ? "ATIVO" : "INATIVO"}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
