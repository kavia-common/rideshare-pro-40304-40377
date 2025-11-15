import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../services/apiClient';

/**
 * PUBLIC_INTERFACE
 * Login page with backend JWT auth. Falls back to registration on 401 for convenience in dev.
 */
export default function Login() {
  const [email, setEmail] = useState('demo@rideshare.pro');
  const [password, setPassword] = useState('password');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  async function doLogin() {
    const res = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return res;
  }

  async function doRegister() {
    const res = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return res;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      let result;
      try {
        result = await doLogin();
      } catch (e1) {
        // if unauthorized, attempt register then login
        if (String(e1?.message || '').includes('401')) {
          await doRegister();
          result = await doLogin();
        } else {
          throw e1;
        }
      }
      dispatch(
        loginSuccess({
          token: result.token,
          user: { id: result.user?.id, email: result.user?.email, name: result.user?.email?.split('@')[0] || 'Rider' },
        })
      );
      navigate('/book');
    } catch (e) {
      setError(e?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="section">
      <div className="card" style={{ maxWidth: 480, margin: '40px auto' }}>
        <h2 style={{ marginTop: 0 }}>Sign in</h2>
        <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
          <label className="input">
            <span>📧</span>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" required />
          </label>
          <label className="input">
            <span>🔒</span>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" required />
          </label>
          {error && <div className="subtitle" style={{ color: '#EF4444' }}>{error}</div>}
          <button className="btn" type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
        </form>
      </div>
    </div>
  );
}
