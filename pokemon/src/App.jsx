import { useState } from "react";
import "./App.css";
import { Pokemon } from "./Pokemon";
import PokemonBattleGame from "./PokemonBattle";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./components/Auth/Login";
import Signup from "./components/Auth/Signup";
import UserProfile from "./components/Profile/UserProfile";
import AdminPanel from "./components/Admin/AdminPanel";

function AppContent() {
  const [currentView, setCurrentView] = useState("browse");
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const { user, logout, isAuthenticated, isAdmin } = useAuth();

  return (
    <>
      {/* Navigation Bar */}
      <nav className="main-nav">
        <div className="nav-brand">
          <h1>⚡ Pokemon Battle Arena</h1>
        </div>
        <div className="nav-links">
          {isAuthenticated ? (
            <>
              <button className="nav-button" onClick={() => setShowProfile(true)}>
                👤 {user?.username}
              </button>
              {isAdmin && (
                <button className="nav-button admin-btn" onClick={() => setShowAdmin(true)}>
                  🔧 Admin
                </button>
              )}
              <button className="nav-button" onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <button className="nav-button" onClick={() => setShowLogin(true)}>
                Login
              </button>
              <button className="nav-button" onClick={() => setShowSignup(true)}>
                Sign Up
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Main Content */}
      {showAdmin ? (
        <AdminPanel onClose={() => setShowAdmin(false)} />
      ) : currentView === "browse" ? (
        <Pokemon onPlayGame={() => setCurrentView("battle")} />
      ) : (
        <PokemonBattleGame onBackToBrowse={() => setCurrentView("browse")} />
      )}

      {/* Auth Modals */}
      {showLogin && (
        <Login
          onSwitchToSignup={() => {
            setShowLogin(false);
            setShowSignup(true);
          }}
          onClose={() => setShowLogin(false)}
        />
      )}
      {showSignup && (
        <Signup
          onSwitchToLogin={() => {
            setShowSignup(false);
            setShowLogin(true);
          }}
          onClose={() => setShowSignup(false)}
        />
      )}

      {/* Profile Modal */}
      {showProfile && <UserProfile onClose={() => setShowProfile(false)} />}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
