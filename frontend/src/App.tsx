import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { authService } from "./lib/auth";
import type { User } from "./lib/auth";
import { PinnedTeamProvider } from "./lib/pinnedTeam";
import Login from "./routes/Login";
import Register from "./routes/Register";
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
          <Route path="/oauth/callback" element={<OAuthCallback onLogin={setUser} />} />
          <Route path="/tv-mode" element={<TVMode />} />
          <Route path="/" element={<Dashboard user={user} />} />
          <Route path="/apps/:id" element={<AppDetail user={user} />} />
          <Route
            path="/apps/new"
            element={user ? <NewApp user={user} /> : <Navigate to="/login" />}
          />
          <Route path="/projects" element={<Projects user={user} />} />
          <Route path="/teams/:id" element={<TeamDetail user={user} />} />
          <Route
            path="/teams/:id/settings"
            element={user ? <TeamSettings user={user} /> : <Navigate to="/login" />}
          />
          <Route
            path="/teams/new"
            element={user ? <NewTeam user={user} /> : <Navigate to="/login" />}
          />
          <Route path="/requests" element={<AppRequests user={user} />} />
          <Route
            path="/requests/new"
            element={user ? <NewRequest user={user} /> : <Navigate to="/login" />}
          />
          <Route path="/requests/:id" element={<RequestDetail user={user} />} />
        </Routes>
      </PinnedTeamProvider>
    </BrowserRouter>
  );
}

export default App;
