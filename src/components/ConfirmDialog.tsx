import { useEffect, useRef, useState } from "react";

interface ConfirmDialogProps {
  title: string;
  body: string;
  confirmLabel: string;
  /** Destructive actions (delete) get the danger treatment; the default is ink. */
  tone?: "danger" | "default";
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

const ConfirmDialog = ({
  title,
  body,
  confirmLabel,
  tone = "default",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  // Native <dialog> handles focus trapping and Escape for us.
  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      onClose={onCancel}
      onCancel={(event) => { if (working) event.preventDefault(); }}
      aria-labelledby="confirm-title"
      className="rp-dialog"
    >
      <div className="rp-dialog-head">
        <h2 id="confirm-title" className="rp-title text-xl">{title}</h2>
      </div>
      <div className="rp-dialog-body">
        <p className="rp-muted text-[15px] leading-relaxed">{body}</p>
        {error && <p role="alert" className="rp-message rp-message--danger mt-3">{error}</p>}
      </div>
      <div className="rp-dialog-foot">
        <button
          type="button"
          className="rp-btn rp-btn--quiet"
          disabled={working}
          onClick={() => dialogRef.current?.close()}
        >
          Cancel
        </button>
        <button
          type="button"
          className={`rp-btn ${tone === "danger" ? "rp-btn--danger" : "rp-btn--ink"}`}
          disabled={working}
          onClick={async () => {
            setWorking(true);
            setError("");
            try { await onConfirm(); }
            catch { setError("That didn't finish. Nothing was changed, so you can try again."); }
            finally { setWorking(false); }
          }}
        >
          {working ? "Working…" : confirmLabel}
        </button>
      </div>
    </dialog>
  );
};

export default ConfirmDialog;
