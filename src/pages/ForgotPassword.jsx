import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, CheckCircle2, ArrowLeft, Send } from 'lucide-react';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      setIsSubmitted(true);
    }
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
        {!isSubmitted ? (
          <>
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
              <Mail size={28} />
            </div>

            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem' }}>
              Forgot Password
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.8rem' }}>
              Enter your registered email address below and we'll simulate sending reset instructions.
            </p>

            <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
              <div className="form-group">
                <label htmlFor="resetEmail">Email Address</label>
                <input
                  id="resetEmail"
                  type="email"
                  className="form-input"
                  placeholder="alex@skillhub.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', marginTop: '1rem' }}>
                <Send size={18} /> Reset Password
              </button>
            </form>
          </>
        ) : (
          <div>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#ecfdf5',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.2rem'
            }}>
              <CheckCircle2 size={36} />
            </div>

            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
              Instructions Sent!
            </h2>

            <div style={{
              backgroundColor: '#f8fafc',
              padding: '1rem',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              color: '#334155',
              fontSize: '0.95rem',
              fontWeight: 500,
              marginBottom: '1.5rem',
              lineHeight: 1.5
            }}>
              Password reset instructions have been sent to <strong>{email}</strong>.
            </div>

            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem' }}>
              (Note: This is a frontend demo simulation. No actual email was sent.)
            </p>

            <button className="btn-secondary" onClick={() => setIsSubmitted(false)} style={{ width: '100%', marginBottom: '1rem' }}>
              Try another email
            </button>
          </div>
        )}

        <div style={{ marginTop: '1.5rem', paddingTop: '1.2rem', borderTop: '1px solid #e2e8f0' }}>
          <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#2563eb', fontWeight: 600, fontSize: '0.9rem' }}>
            <ArrowLeft size={16} /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
