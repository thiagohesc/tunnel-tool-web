export default function HeaderBar({ health }) {
  return (
    <header className="tt-header">
      <div>
        <p className="tt-title">Tunnels Tool</p>
        <h1 className="tt-heading">Tunnels Manager</h1>
      </div>
      <div className="tt-header-actions">
        <div className="tt-status-pill">
          <span
            className={`h-2.5 w-2.5 rounded-full ${health === "ok"
              ? "bg-emerald-400"
              : health === "down"
                ? "bg-rose-500"
                : "bg-amber-400"
              }`}
          />
          <span>
            {health === "ok"
              ? "API online"
              : health === "down"
                ? "API indisponivel"
                : "Verificando"}
          </span>
        </div>
      </div>
    </header>
  );
}
