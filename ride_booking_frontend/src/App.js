import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import './App.css';
import Landing from './pages/Landing';
import Login from './pages/Login';
import MapBooking from './pages/MapBooking';
import History from './pages/History';
import { ThemeProvider, useTheme } from './theme/ThemeProvider';
import { Provider, useSelector } from 'react-redux';
import store from './store';

function Navbar() {
  const { theme, toggle } = useTheme();
  const auth = useSelector(state => state.auth);
  return (
    <div className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="brand" aria-label="Rideshare Pro home">
          <div className="brand-badge">R</div>
          Rideshare Pro
        </Link>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link className="btn btn-outline" to="/book">Book a ride</Link>
          <Link className="btn btn-outline" to="/history">History</Link>
          {auth.isAuthenticated ? (
            <Link className="btn" to="/book">Hi, {auth.user?.name || 'Rider'}</Link>
          ) : (
            <Link className="btn" to="/login">Sign in</Link>
          )}
          <button className="btn" onClick={toggle} aria-label="toggle theme">
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
function AppRouter() {
  /** Root router for the application. Provides protected routes and navigation. */
  const auth = useSelector(state => state.auth);
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/book"
        element={auth.isAuthenticated ? <MapBooking /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/history"
        element={auth.isAuthenticated ? <History /> : <Navigate to="/login" replace />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// PUBLIC_INTERFACE
function App() {
  /** Application entry point: Redux Provider, ThemeProvider, Router, and Navbar. */
  return (
    <Provider store={store}>
      <ThemeProvider>
        <BrowserRouter>
          <Navbar />
          <div className="container">
            <AppRouter />
          </div>
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  );
}

export default App;
