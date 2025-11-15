import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';

/**
 * PUBLIC_INTERFACE
 * Login page with minimal fields to simulate JWT auth and store token in Redux/localStorage.
 */
export default function Login() {
  const [email, setEmail] = useState('demo@rideshare.pro');
  const [password, setPassword] = useState('password');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    // Simulate API auth success
    setTimeout(() => {
      dispatch(loginSuccess({ token: 'demo-token', user: { name: 'Demo Rider', email } }));
      setLoading(false);
      navigate('/book');
    }, 600);
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
          <button className="btn" type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
        </form>
      </div>
    </div>
  );
}
