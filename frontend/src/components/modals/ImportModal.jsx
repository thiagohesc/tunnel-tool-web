export default function ImportModal({
  error,
  importText,
  setImportText,
  onCancel,
  onApply,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-2xl rounded-2xl border border-[var(--border)] bg-[var(--bg-850)] p-6 shadow-2xl">
        <h3 className="font-display text-xl">Importar JSON</h3>
        <p className="mt-2 text-sm text-[var(--ink-300)]">
          Cole o JSON completo. Ele ira substituir a configuracao atual.
        </p>
        {error && (
          <p className="mt-3 rounded-xl border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
            {error}
          </p>
        )}
        <textarea
          className="mt-4 h-64 w-full tt-input font-mono"
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          placeholder="Cole o JSON aqui..."
        />
        <div className="mt-6 flex justify-end gap-3">
          <button className="tt-button tt-button-ghost tt-button-sm" onClick={onCancel}>
            Cancelar
          </button>
          <button className="tt-button tt-button-primary tt-button-sm" onClick={onApply}>
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );
}
