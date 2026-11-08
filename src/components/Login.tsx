import { Link } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { FaApple } from "react-icons/fa";
import { appleSignInAvailable } from "../utils/appleAuth";
import useLoginLogic from "../hooks/useLoginLogic";
import { Field, FormMessage, fieldInput } from "./FormControls";
import type { AppUser } from "../types/user";

interface LoginProps {
  setCurrentUser: (user: AppUser | null) => void;
  loggedIn: boolean;
}

const Login = ({ setCurrentUser, loggedIn }: LoginProps) => {
  const {
    email,
    setEmail,
    password,
    setPassword,
    rememberMe,
    setRememberMe,
    googleLoading,
    appleLoading,
    loading,
    error,
    resetNotice,
    handleLogin,
    handleGoogleLogin,
    handleAppleLogin,
    handlePasswordReset,
  } = useLoginLogic({ setCurrentUser, loggedIn });

  return (
    <div className="mx-auto w-full max-w-md px-4 pt-8 pb-12 md:px-6 md:pt-16">
      <h1 className="rp-title text-[34px] md:text-[44px]">Welcome back</h1>
      <p className="rp-muted mt-3 text-[17px]">
        Sign in to reach your notebook.
      </p>

      <form className="mt-8 flex flex-col gap-5" onSubmit={handleLogin}>
        <Field label="Email" htmlFor="login-email">
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            className={fieldInput}
            value={email}
            placeholder="you@example.com"
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>

        <Field label="Password" htmlFor="login-password">
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            className={fieldInput}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>

        <div className="flex flex-wrap items-center justify-between gap-x-4">
          <label className="flex min-h-11 cursor-pointer items-center gap-3 text-[15px]">
            <input
              type="checkbox"
              className="rp-check"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <span>Keep me signed in</span>
          </label>
          <button
            type="button"
            className="rp-link min-h-11 text-[15px]"
            onClick={handlePasswordReset}
          >
            Forgot password?
          </button>
        </div>

        {error && <FormMessage tone="error">{error}</FormMessage>}
        {resetNotice && <FormMessage tone="success">{resetNotice}</FormMessage>}

        <button type="submit" className="rp-btn rp-btn--ink rp-btn--block mt-1" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
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
          onClick={handleAppleLogin}
          disabled={appleLoading || googleLoading}
        >
          {!appleLoading && <FaApple aria-hidden />}
          {appleLoading ? "Signing in…" : "Continue with Apple"}
        </button>
      )}

      <button
        type="button"
        className="rp-btn rp-btn--line rp-btn--block"
        onClick={handleGoogleLogin}
        disabled={googleLoading || appleLoading}
      >
        {!googleLoading && <FcGoogle aria-hidden />}
        {googleLoading ? "Signing in…" : "Continue with Google"}
      </button>

      <p className="rp-muted mt-8 text-center text-[15px]">
        No account yet?{" "}
        <Link to="/register" className="rp-link text-ink">
          Create one
        </Link>
      </p>
    </div>
  );
};

export default Login;
