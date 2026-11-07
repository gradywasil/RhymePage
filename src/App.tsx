import useAppLogic from "./hooks/useAppLogic";
import { Routes, Route, useLocation } from "react-router-dom";
import Loading from "./components/Loading";
import AppShell from "./components/shell/AppShell";
import { Suspense, lazy, useEffect } from "react";
import { useAndroidNavigation } from "./hooks/useAndroidNavigation";
import { updateSystemBarContrast } from "./utils/nativeApp";
const Notes = lazy(() => import("./components/Notes"));
const Landing = lazy(() => import("./components/Landing"));
const Login = lazy(() => import("./components/Login"));
const Register = lazy(() => import("./components/Register"));
const Settings = lazy(() => import("./components/Settings"));
const Dashboard = lazy(() => import("./components/Dashboard"));
const Profile = lazy(() => import("./components/Profile"));
const Missing = lazy(() => import("./components/Missing"));
const LegalPages = lazy(() => import("./components/LegalPages"));

function App() {
  const {
    isLoading,
    authReady,
    loggedIn,
    currentUser,
    handleLogout,
    setCurrentUser,
  } = useAppLogic();

  const { pathname } = useLocation();
  const isLanding = pathname === "/";
  useAndroidNavigation(currentUser?.uid ?? null, authReady);

  // The status/navigation bar icons sample whatever surface now sits under them.
  useEffect(() => {
    requestAnimationFrame(() => updateSystemBarContrast());
  }, [pathname, loggedIn]);

  const routes = (
    <Suspense fallback={<Loading />}>
      {!authReady ? <Loading /> : <Routes>
        <Route path="/" element={<Landing loggedIn={loggedIn} />} />
        <Route path="/privacy" element={<LegalPages page="privacy" signedIn={loggedIn} />} />
        <Route path="/delete-account" element={<LegalPages page="deletion" signedIn={loggedIn} />} />
        <Route path="/login" element={<Login setCurrentUser={setCurrentUser} loggedIn={loggedIn} />} />
        <Route path="/register" element={<Register setCurrentUser={setCurrentUser} loggedIn={loggedIn} />} />
        <Route path="/settings" element={<Settings currentUser={currentUser} setCurrentUser={setCurrentUser} onLogout={handleLogout} />} />
        <Route path="/settings/:section" element={<Settings currentUser={currentUser} setCurrentUser={setCurrentUser} onLogout={handleLogout} />} />
        <Route path="/notes" element={<Notes currentUser={currentUser} />} />
        <Route
          path="/notes/new"
          element={<Dashboard key={`${currentUser?.uid ?? "guest"}:${pathname}`} currentUser={currentUser} />}
        />
        <Route
          path="/notes/:existingNoteId"
          element={<Dashboard key={`${currentUser?.uid ?? "guest"}:${pathname}`} currentUser={currentUser} />}
        />
        <Route path="/profile" element={<Profile currentUser={currentUser} />} />
        <Route path="/profile/:uid" element={<Profile currentUser={currentUser} />} />
        <Route path="*" element={<Missing loggedIn={loggedIn} />} />
      </Routes>}
    </Suspense>
  );

  return (
    <div className="app-frame flex h-dvh flex-col overflow-hidden bg-sleeve text-ink">
      {isLoading && <div className="absolute inset-x-0 top-0 z-50"><span className="rp-loading !w-full" aria-label="Working" /></div>}
      {/* The public landing page brings its own masthead; everything else lives in the app shell. */}
      {isLanding ? (
        <main id="main" className="flex min-h-0 flex-1 flex-col overflow-y-auto">{routes}</main>
      ) : (
        <AppShell currentUser={currentUser} onLogout={handleLogout}>{routes}</AppShell>
      )}
    </div>
  );
}

export default App;
