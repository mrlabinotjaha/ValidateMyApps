import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { authService } from "./lib/auth";
import type { User } from "./lib/auth";
import { PinnedTeamProvider } from "./lib/pinnedTeam";
import Login from "./routes/Login";
import Register from "./routes/Register";
import ForgotPassword from "./routes/ForgotPassword";
import OAuthCallback from "./routes/OAuthCallback";
import Dashboard from "./routes/Dashboard";
import AppDetail from "./routes/AppDetail";
import NewApp from "./routes/NewApp";
import TVMode from "./routes/TVMode";
import Projects from "./routes/Projects";
import TeamDetail from "./routes/TeamDetail";
import TeamSettings from "./routes/TeamSettings";
import NewTeam from "./routes/NewTeam";
import AppRequests from "./routes/AppRequests";
import NewRequest from "./routes/NewRequest";
import RequestDetail from "./routes/RequestDetail";
import Settings from "./routes/Settings";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authService.isAuthenticated()) {
      authService
        .getCurrentUser()
        .then(setUser)
        .catch(() => authService.logout())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        Loading...
      </div>
    );
  }

  return (
    <BrowserRouter>
      <PinnedTeamProvider>
        <Routes>
          <Route path="/login" element={<Login onLogin={setUser} />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/oauth/callback" element={<OAuthCallback onLogin={setUser} />} />
          <Route path="/tv-mode" element={<TVMode />} />
          {/* /teams is the default home route */}
          <Route path="/" element={<Projects user={user} />} />
          <Route path="/teams" element={<Projects user={user} />} />
          <Route path="/team" element={<Projects user={user} />} />
          <Route path="/public" element={<Dashboard user={user} />} />
          <Route path="/apps/:id" element={<AppDetail user={user} />} />
          <Route
            path="/apps/new"
            element={user ? <NewApp user={user} /> : <Navigate to="/login" />}
          />
          <Route path="/team/:id" element={<TeamDetail user={user} />} />
          <Route
            path="/team/:id/settings"
            element={user ? <TeamSettings user={user} /> : <Navigate to="/login" />}
          />
          <Route
            path="/team/new"
            element={user ? <NewTeam user={user} /> : <Navigate to="/login" />}
          />
          <Route path="/requests" element={<AppRequests user={user} />} />
          <Route
            path="/requests/new"
            element={user ? <NewRequest user={user} /> : <Navigate to="/login" />}
          />
          <Route path="/requests/:id" element={<RequestDetail user={user} />} />
          <Route
            path="/settings"
            element={user ? <Settings user={user} onUserUpdate={setUser} /> : <Navigate to="/login" />}
          />
        </Routes>
      </PinnedTeamProvider>
    </BrowserRouter>
  );
}

export default App;
