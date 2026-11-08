import { Link } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { FaApple } from "react-icons/fa";
import { appleSignInAvailable } from "../utils/appleAuth";
import useRegisterLogic from "../hooks/useRegisterLogic";
import { Field, FormMessage, fieldInput } from "./FormControls";
import type { AppUser } from "../types/user";

interface RegisterProps {
  setCurrentUser: (user: AppUser | null) => void;
  loggedIn: boolean;
}

const Register = ({ setCurrentUser, loggedIn }: RegisterProps) => {
  const {
    displayName,
    setDisplayName,
    email,
    setEmail,
    password,
    setPassword,
    loading,
    googleLoading,
    appleLoading,
    error,
    handleRegister,
    handleGoogleRegister,
    handleAppleRegister,
  } = useRegisterLogic({ setCurrentUser, loggedIn });

  return (
    <div className="mx-auto w-full max-w-md px-4 pt-8 pb-12 md:px-6 md:pt-16">
      <h1 className="rp-title text-[34px] md:text-[44px]">Create an account</h1>
      <p className="rp-muted mt-3 text-[17px]">
        Save your lyrics and pick up where you left off.
      </p>

      <form className="mt-8 flex flex-col gap-5" onSubmit={handleRegister}>
        <Field
          label="Name"
          htmlFor="register-name"
          hint="Shown on your profile and to anyone you share a note with."
        >
          <input
            id="register-name"
            type="text"
            autoComplete="name"
            className={fieldInput}
            value={displayName}
            placeholder="Your name"
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </Field>

        <Field label="Email" htmlFor="register-email">
          <input
            id="register-email"
            type="email"
            autoComplete="email"
            className={fieldInput}
            value={email}
            placeholder="you@example.com"
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>

        <Field
          label="Password"
          htmlFor="register-password"
          hint="At least six characters."
        >
          <input
            id="register-password"
            type="password"
            autoComplete="new-password"
            className={fieldInput}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>

        {error && <FormMessage tone="error">{error}</FormMessage>}

        <button type="submit" className="rp-btn rp-btn--ink rp-btn--block mt-1" disabled={loading}>
          {loading ? "Creating…" : "Create account"}
        </button>
      </form>

      <div className="rp-label my-6 flex items-center gap-3">
        <span aria-hidden className="h-px flex-1 bg-rule" />
        or
        <span aria-hidden className="h-px flex-1 bg-rule" />
      </div>

      {appleSignInAvailable() && (
        <button
          type="button"
          className="rp-btn rp-btn--ink rp-btn--block mb-3"
          onClick={handleAppleRegister}
          disabled={appleLoading || googleLoading}
        >
          {!appleLoading && <FaApple aria-hidden />}
          {appleLoading ? "Creating…" : "Continue with Apple"}
        </button>
      )}

      <button
        type="button"
        className="rp-btn rp-btn--line rp-btn--block"
        onClick={handleGoogleRegister}
        disabled={googleLoading || appleLoading}
      >
        {!googleLoading && <FcGoogle aria-hidden />}
        {googleLoading ? "Creating…" : "Continue with Google"}
      </button>

      <p className="rp-muted mt-8 text-center text-[15px]">
        Already have an account?{" "}
        <Link to="/login" className="rp-link text-ink">
          Sign in
        </Link>
      </p>
    </div>
  );
};

export default Register;
