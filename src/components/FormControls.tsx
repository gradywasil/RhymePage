import type { ReactNode } from "react";
import type { ActionState } from "../hooks/useAccountLogic";

/** Class for a standard text field; kept as a constant so pages can spread it onto inputs. */
export const fieldInput = "rp-input";

interface FieldProps {
  label: string;
  htmlFor: string;
  hint?: string;
  children: ReactNode;
}

export const Field = ({ label, htmlFor, hint, children }: FieldProps) => (
  <div className="rp-field">
    <label htmlFor={htmlFor} className="rp-label">{label}</label>
    {children}
    {hint && <p className="rp-hint">{hint}</p>}
  </div>
);

/** Small caption reporting how the last attempt went. */
export const StatusNote = ({ state }: { state: ActionState }) => {
  if (state.status === "idle" || state.status === "working") return null;
  return (
    <p role="status" className={`rp-message ${state.status === "error" ? "rp-message--danger" : "rp-message--ok"}`}>
      {state.message}
    </p>
  );
};

/** A plain message line, for pages that track their own error strings. */
export const FormMessage = ({ tone, children }: { tone: "error" | "success"; children: ReactNode }) => (
  <p role="status" className={`rp-message ${tone === "error" ? "rp-message--danger" : "rp-message--ok"}`}>
    {children}
  </p>
);
