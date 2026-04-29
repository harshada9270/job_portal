import React, { useState } from 'react'
import { API_BASE } from '../api'

export default function Login({ onLogin }){
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [loginErr, setLoginErr] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLoginChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginErr('');
    setLoading(true);
    try{
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ email: loginData.email, password: loginData.password })
      });
      const data = await res.json();
      if (!res.ok) return setLoginErr(data.message || 'Login failed');
      onLogin(data.user, data.token);
    }catch(e){
      setLoginErr('Network error');
    }finally{
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-panel auth-brand">
          <div className="brand-content">
            <div className="brand-circle"></div>
            <h1>JOB PORTAL</h1>
            <p>Find Your Dream Job</p>
            <div className="brand-decorative"></div>
          </div>
        </div>

        <div className="auth-panel auth-login">
          <div className="auth-content">
            <h2>LOGIN</h2>
            <form onSubmit={handleLogin}>
              <div className="input-group">
                <input
                  className="auth-input"
                  type="email"
                  name="email"
                  value={loginData.email}
                  onChange={handleLoginChange}
                  placeholder="Email"
                  required
                />
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                </svg>
              </div>
              <div className="input-group">
                <input
                  className="auth-input"
                  type="password"
                  name="password"
                  value={loginData.password}
                  onChange={handleLoginChange}
                  placeholder="Password"
                  required
                />
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
              {loginErr && <div className="auth-error">{loginErr}</div>}
              <button type="submit" className="auth-btn auth-btn-primary" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
            <a href="#" className="forgot-password" onClick={(e) => { e.preventDefault(); }}>Forgot your Password?</a>
            <button
              type="button"
              className="btn btn-ghost create-account-link"
              onClick={() => window.alert('Create Account flow will be added here')}
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
