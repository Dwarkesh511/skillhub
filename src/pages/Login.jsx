import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { GraduationCap, LogIn, Key, Mail, Sparkles, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectMessage = location.state?.message;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await login(email, password);

    if (res.success) {
      navigate('/dashboard');
    } else {
      setError(res.message || 'Invalid email or password. Please try again.');
    }

    setLoading(false);
  };

  const handleDemoLogin = async () => {
    setError('');
    setEmail('alex@skillhub.com');
    setPassword('password123');
    setLoading(true);

    const res = await login('alex@skillhub.com', 'password123');

    if (res.success) {
      navigate('/dashboard');
    } else {
      setError(res.message || 'Demo login failed.');
    }

    setLoading(false);
  };

  return (
    <div style={{ maxWidth: '440px', margin: '3rem auto' }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        padding: '2.5rem 2rem',
        boxShadow: 'var(--shadow-lg)',
        textAlign: 'center'
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: '#eff6ff',
          color: '#2563eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1rem'
        }}>
          <GraduationCap size={32} />
        </div>

        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem' }}>
          Welcome to SkillHub
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.8rem' }}>
          Sign in to access your course catalog, bookmarks, and learning dashboard.
        </p>

        {redirectMessage && (
          <div style={{
            padding: '0.8rem 1rem',
            backgroundColor: '#ecfdf5',
            color: '#10b981',
            border: '1px solid #a7f3d0',
            borderRadius: '8px',
            marginBottom: '1.2rem',
            fontSize: '0.85rem',
            textAlign: 'left'
          }}>
            {redirectMessage}
          </div>
        )}

        {error && (
          <div style={{
            padding: '0.8rem 1rem',
            backgroundColor: '#fef2f2',
            color: '#ef4444',
            border: '1px solid #fca5a5',
            borderRadius: '8px',
            marginBottom: '1.2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.85rem',
            textAlign: 'left'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
          <div className="form-group">
            <label htmlFor="loginEmail">Email Address</label>
            <div style={{ position: 'relative' }}>
              <input
                id="loginEmail"
                type="email"
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="alex@skillhub.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Mail size={18} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            </div>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label htmlFor="loginPass">Password</label>
              <Link to="/forgot-password" style={{ fontSize: '0.8rem', color: '#2563eb', fontWeight: 600 }}>
                Forgot password?
              </Link>
            </div>
            <div style={{ position: 'relative', marginTop: '0.4rem' }}>
              <input
                id="loginPass"
                type="password"
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Key size={18} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '1rem 0' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#475569', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ accentColor: '#2563eb', cursor: 'pointer' }}
              />
              Remember Me
            </label>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', marginTop: '0.5rem' }}
          >
            <LogIn size={20} /> {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div style={{ margin: '1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#94a3b8', fontSize: '0.85rem' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }}></div>
          <span>OR</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }}></div>
        </div>

        <button 
          onClick={handleDemoLogin} 
          disabled={loading}
          className="btn-secondary" 
          style={{ width: '100%', padding: '0.7rem', fontSize: '0.9rem', justifyContent: 'center', marginBottom: '1.2rem' }}
        >
          <Sparkles size={18} color="#2563eb" /> Quick Demo Student Login
        </button>

        <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
          Don't have an account?{' '}
          <Link 
            to="/register"
            style={{ color: '#2563eb', fontWeight: 600 }}
          >
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};
