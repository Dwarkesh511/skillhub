import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, UserPlus, Mail, Key, User, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    const res = await register(name, email, password);

    if (res.success) {
      // Auto-login after successful registration
      const loginRes = await login(email, password);
      if (loginRes.success) {
        navigate('/dashboard');
      } else {
        navigate('/login', { state: { message: 'Account created successfully! Please log in.' } });
      }
    } else {
      setError(res.message || 'Registration failed. Please try again.');
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
          Create your Account
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.8rem' }}>
          Join SkillHub today to start learning from industry experts.
        </p>

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
            <label htmlFor="regName">Full Name</label>
            <div style={{ position: 'relative' }}>
              <input
                id="regName"
                type="text"
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="Alex Johnson"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <User size={18} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="regEmail">Email Address</label>
            <div style={{ position: 'relative' }}>
              <input
                id="regEmail"
                type="email"
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="alex@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Mail size={18} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="regPass">Password</label>
            <div style={{ position: 'relative', marginTop: '0.4rem' }}>
              <input
                id="regPass"
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

          <div className="form-group">
            <label htmlFor="regConfirmPass">Confirm Password</label>
            <div style={{ position: 'relative', marginTop: '0.4rem' }}>
              <input
                id="regConfirmPass"
                type="password"
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <Key size={18} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', marginTop: '1rem' }}
          >
            <UserPlus size={20} /> {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '1.5rem' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#2563eb', fontWeight: 600 }}>
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};
