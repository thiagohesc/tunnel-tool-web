export default function ConfirmModal({
  title,
  description,
  danger = false,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  onConfirm,
  onCancel,
  disabled = false,
  children,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--bg-850)] p-6 shadow-2xl">
        <h3 className="font-display text-xl">{title}</h3>
        <p className="mt-2 text-sm text-[var(--ink-300)]">{description}</p>
        {children}
        <div className="mt-6 flex justify-end gap-3">
          <button className="tt-button tt-button-ghost tt-button-sm" onClick={onCancel}>
            {cancelText}
          </button>
          <button
            className={`tt-button ${danger ? "tt-button-danger" : "tt-button-primary"} tt-button-sm ${
              disabled ? "opacity-60 cursor-not-allowed" : ""
            }`}
            onClick={onConfirm}
            disabled={disabled}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
