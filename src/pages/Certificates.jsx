import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Award, Calendar, FileText, CheckCircle, AlertCircle, ArrowLeft, Download, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import * as certificateApi from '../services/certificateApi';

export const Certificates = () => {
  const { user, isAuthenticated } = useAuth();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCert, setSelectedCert] = useState(null);

  useEffect(() => {
    const fetchCertificates = async () => {
      if (!isAuthenticated) return;

      try {
        setLoading(true);
        setError('');

        const res = await certificateApi.getCertificates();
        if (res && res.success && Array.isArray(res.certificates)) {
          setCertificates(res.certificates);
        } else {
          setCertificates([]);
        }
      } catch (err) {
        setError(err.message || 'Failed to load certificates.');
      } finally {
        setLoading(false);
      }
    };

    fetchCertificates();
  }, [isAuthenticated]);

  const handleViewCertDetails = async (id) => {
    try {
      const res = await certificateApi.getCertificate(id);
      if (res && res.success && res.certificate) {
        setSelectedCert(res.certificate);
      }
    } catch (err) {
      console.error('Failed to fetch certificate details:', err);
    }
  };

  return (
    <div className="certificates-page" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.5rem' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Award size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>My Certificates</h1>
            <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>
              Official certificates earned upon completing SkillHub courses.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={20} /> <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#64748b' }}>
          <div style={{ fontSize: '1rem', fontWeight: 600 }}>Loading your certificates...</div>
        </div>
      ) : certificates.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {certificates.map(cert => (
            <div 
              key={cert.id}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                padding: '1.5rem',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, backgroundColor: '#ecfdf5', color: '#047857', padding: '0.25rem 0.6rem', borderRadius: '999px', border: '1px solid #a7f3d0' }}>
                    Official Certificate
                  </span>
                  <Award size={20} color="#2563eb" />
                </div>

                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.6rem', lineHeight: 1.3 }}>
                  {cert.courseTitle}
                </h3>

                <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.4rem' }}>
                  Issued to: <strong style={{ color: '#334155' }}>{cert.studentName || user?.name}</strong>
                </div>

                <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontFamily: 'monospace', marginBottom: '1rem' }}>
                  ID: {cert.certificateNumber}
                </div>
              </div>

              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Calendar size={14} /> {new Date(cert.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </div>

                <button 
                  className="btn-primary" 
                  onClick={() => handleViewCertDetails(cert.id)}
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                >
                  <FileText size={15} /> View
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ backgroundColor: '#ffffff', padding: '3rem 2rem', textAlign: 'center', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#64748b' }}>
          <Award size={48} color="#94a3b8" style={{ marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem' }}>No Certificates Earned Yet</h3>
          <p style={{ maxWidth: '480px', margin: '0 auto 1.5rem auto', fontSize: '0.9rem', color: '#64748b' }}>
            Complete 100% of all lessons in an enrolled course to automatically receive your verifiable certificate of completion.
          </p>
          <Link to="/" className="btn-primary">
            Browse Courses
          </Link>
        </div>
      )}

      {/* Certificate Modal */}
      {selectedCert && (
        <div className="modal-overlay" onClick={() => setSelectedCert(null)}>
          <div 
            className="modal-card" 
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '650px',
              width: '90%',
              padding: '2rem',
              textAlign: 'center',
              position: 'relative'
            }}
          >
            <div style={{ border: '4px double #2563eb', padding: '2rem', borderRadius: '12px', backgroundColor: '#f8fafc' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#eff6ff', color: '#2563eb', marginBottom: '1rem' }}>
                <Award size={36} />
              </div>

              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Certificate of Completion
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem' }}>
                SkillHub E-Learning Platform
              </p>

              <p style={{ fontSize: '0.95rem', color: '#475569', marginBottom: '0.4rem' }}>
                This is to certify that
              </p>
              <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#2563eb', marginBottom: '1rem', borderBottom: '2px solid #cbd5e1', display: 'inline-block', paddingBottom: '0.3rem' }}>
                {selectedCert.studentName || user?.name}
              </h3>

              <p style={{ fontSize: '0.95rem', color: '#475569', marginBottom: '0.4rem' }}>
                has successfully completed all requirements for the course
              </p>
              <h4 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.5rem' }}>
                "{selectedCert.courseTitle}"
              </h4>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '1.2rem', marginTop: '1rem', fontSize: '0.85rem', color: '#64748b' }}>
                <div>
                  <div>Certificate ID: <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{selectedCert.certificateNumber}</strong></div>
                  <div>Issued Date: {new Date(selectedCert.issuedAt).toLocaleDateString()}</div>
                </div>

                <div>
                  {selectedCert.pdfUrl ? (
                    <a href={selectedCert.pdfUrl} target="_blank" rel="noreferrer" className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                      <Download size={16} /> Download PDF
                    </a>
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: '#64748b', backgroundColor: '#e2e8f0', padding: '0.4rem 0.8rem', borderRadius: '6px', fontWeight: 600 }}>
                      PDF Not Available
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button 
              className="btn-secondary" 
              onClick={() => setSelectedCert(null)}
              style={{ marginTop: '1.5rem', width: '100%' }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
