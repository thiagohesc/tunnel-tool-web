export default function PortCheckCard({
  portCheckValue,
  setPortCheckValue,
  portCheckResult,
  portCheckLoading,
  onCheckPort,
}) {
  return (
    <div className="tt-card-sm tt-panel-footer tt-top-row-card">
      <div className="flex items-center justify-between">
        <h3 className="tt-subheading">Check Port</h3>
      </div>
      <div className="flex items-center gap-2">
        <input
          className="tt-input"
          placeholder="Porta local"
          value={portCheckValue}
          onChange={(e) => setPortCheckValue(e.target.value)}
        />
        <button
          className={`tt-button tt-button-sm ${portCheckResult?.status === "busy"
            ? "tt-button-danger"
            : portCheckResult?.status === "ok"
              ? "tt-button-success"
              : "tt-button-toolbar"
            }`}
          onClick={() => onCheckPort()}
          disabled={portCheckLoading}
        >
          {portCheckLoading ? "Verificando..." : "Check"}
        </button>
      </div>
      {portCheckResult && (
        <div className="text-xs tt-text">
          {portCheckResult.status === "error" && (
            <p className="tt-danger">{portCheckResult.message}</p>
          )}
          {portCheckResult.status === "busy" && (
            <p className="tt-danger">Status: Em uso</p>
          )}
          {portCheckResult.status === "ok" && (
            <p className="tt-success">Status: Disponivel</p>
          )}
        </div>
      )}
    </div>
  );
}
