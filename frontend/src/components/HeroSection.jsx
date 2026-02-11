export default function HeroSection({
  search,
  setSearch,
  filter,
  setFilter,
  tunnelsCount,
  activeCount,
  inactiveCount,
  onAddTunnel,
  onExport,
  onImport,
}) {
  return (
    <section className="tt-hero">
      <div className="tt-search tt-hero-card">
        <input
          className="tt-input"
          placeholder="Buscar por nome, destino, ssh, tag ou porta"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="tt-filter-row">
          <button
            className={`tt-chip ${filter === "all" ? "tt-chip-active" : ""}`}
            onClick={() => setFilter("all")}
          >
            Todos
          </button>
          <button
            className={`tt-chip ${filter === "active" ? "tt-chip-success" : ""}`}
            onClick={() => setFilter("active")}
          >
            Ativos
          </button>
          <button
            className={`tt-chip ${filter === "inactive" ? "tt-chip-danger" : ""}`}
            onClick={() => setFilter("inactive")}
          >
            Inativos
          </button>
        </div>
      </div>

      <div className="tt-summary-wrap tt-hero-card">
        <div className="tt-card-sm tt-summary">
          <div className="tt-summary-row">
            <span className="tt-summary-label">Total</span>
            <strong className="tt-summary-value">{tunnelsCount}</strong>
          </div>
          <div className="tt-summary-row">
            <span className="tt-summary-label">Ativos</span>
            <strong className="tt-summary-value">{activeCount}</strong>
          </div>
          <div className="tt-summary-row">
            <span className="tt-summary-label">Inativos</span>
            <strong className="tt-summary-value">{inactiveCount}</strong>
          </div>
        </div>
        <div className="tt-summary-actions">
          <button className="tt-button tt-button-primary" onClick={onAddTunnel}>
            Novo Tunel
          </button>
          <button className="tt-button tt-button-toolbar" onClick={onExport}>
            Exportar
          </button>
          <button className="tt-button tt-button-toolbar" onClick={onImport}>
            Importar
          </button>
        </div>
      </div>
    </section>
  );
}
