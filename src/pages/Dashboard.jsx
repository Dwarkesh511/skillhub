import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  BookOpen, CheckCircle, Clock, Bookmark, PlayCircle, 
  UserCheck, ArrowRight, Award, Sparkles, Settings, AlertCircle, 
  FileText, Download
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { StartLearningModal } from '../components/StartLearningModal';
import { Toast } from '../components/Toast';
import * as dashboardApi from '../services/dashboardApi';
import * as certificateApi from '../services/certificateApi';

export const Dashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeCourseModal, setActiveCourseModal] = useState(null);
  const [selectedCert, setSelectedCert] = useState(null);

  // Toast state for incoming navigation feedback (e.g. enrollment)
  const [toast, setToast] = useState({ message: '', type: 'success' });

  useEffect(() => {
    if (location.state?.message) {
      setToast({
        message: location.state.message,
        type: location.state.type || 'success'
      });
      // Clear history state so toast doesn't re-trigger on manual page refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const fetchDashboardData = async () => {
    if (!isAuthenticated) {
      setDashboard(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const res = await dashboardApi.getDashboard();
      if (res && res.success && res.dashboard) {
        setDashboard(res.dashboard);
      } else {
        setError(res?.message || 'Failed to load dashboard statistics.');
      }
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [isAuthenticated]);

  const handleViewCertDetails = async (certId) => {
    try {
      const res = await certificateApi.getCertificate(certId);
      if (res && res.success && res.certificate) {
        setSelectedCert(res.certificate);
      }
    } catch (err) {
      console.error('Failed to fetch certificate details:', err);
    }
  };

  const stats = dashboard?.statistics || {};
  const continueLearning = dashboard?.continueLearning || [];
  const recentEnrollments = dashboard?.recentEnrollments || [];
  const recentCertificates = dashboard?.recentCertificates || [];

  return (
    <div className="dashboard-page">
      {/* Welcome Banner */}
      <div style={{
        backgroundColor: '#1e293b',
        color: '#ffffff',
        padding: '2rem',
        borderRadius: '16px',
        marginBottom: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.5rem',
        boxShadow: 'var(--shadow-md)'
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.8rem' }}>
            <Sparkles size={14} /> Student Portal Active
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.4rem' }}>
            Welcome back, {user?.name || dashboard?.user?.name || 'Student'}! 👋
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: 0 }}>
            You're making great progress! Track your real learning performance and certificates below.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.8rem' }}>
          <Link to="/certificates" className="btn-secondary" style={{ backgroundColor: '#334155', color: '#ffffff', borderColor: '#475569' }}>
            <Award size={18} /> View Certificates
          </Link>
          <Link to="/profile" className="btn-primary">
            <UserCheck size={18} /> Account Info
          </Link>
        </div>
      </div>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={20} /> <span>{error}</span>
        </div>
      )}

      {/* Stats Counter Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2.5rem'
      }}>
        {/* Enrolled Courses */}
        <div style={{ backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <BookOpen size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Enrolled</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>{loading ? '...' : `${stats.enrolledCourses || 0} Courses`}</div>
          </div>
        </div>

        {/* Completed Courses */}
        <div style={{ backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <CheckCircle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Completed</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>{loading ? '...' : `${stats.completedCourses || 0} Finished`}</div>
          </div>
        </div>

        {/* In Progress Courses */}
        <div style={{ backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: '#fffbebfb', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <PlayCircle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>In Progress</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>{loading ? '...' : `${stats.inProgressCourses || 0} Active`}</div>
          </div>
        </div>

        {/* Hours Learned */}
        <div style={{ backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: '#f3e8ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Clock size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Hours Learned</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>{loading ? '...' : `${stats.hoursLearned || 0} hrs`}</div>
          </div>
        </div>

        {/* Certificates */}
        <div style={{ backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: '#fce7f3', color: '#db2777', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Award size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Certificates</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>{loading ? '...' : `${stats.certificates || 0} Earned`}</div>
          </div>
        </div>
      </div>

      {/* Continue Learning Section */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <PlayCircle size={22} color="#2563eb" /> Continue Learning
        </h2>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <div style={{ fontSize: '1rem', color: '#64748b', fontWeight: 600 }}>Loading active learning courses...</div>
          </div>
        ) : continueLearning.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {continueLearning.map(item => {
              const thumbnail = item.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80';
              const instructorName = item.instructor?.name || 'Instructor';
              const progressPct = item.progressPercentage || 0;

              return (
                <div key={item.courseId} style={{
                  backgroundColor: '#ffffff',
                  padding: '1.25rem',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: '1 1 300px' }}>
                    <img src={thumbnail} alt={item.courseTitle} style={{ width: '75px', height: '52px', borderRadius: '6px', objectFit: 'cover' }} />
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.2rem', color: '#0f172a' }}>{item.courseTitle}</h4>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        Instructor: {instructorName}
                        {item.lastLesson ? ` • Next: ${item.lastLesson.title}` : ''}
                      </div>
                    </div>
                  </div>

                  <div style={{ flex: '1 1 180px', maxWidth: '280px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                      <span>Progress</span>
                      <span>{progressPct}%</span>
                    </div>
                    <div style={{ height: '8px', backgroundColor: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ width: `${progressPct}%`, height: '100%', backgroundColor: '#2563eb', borderRadius: '999px' }}></div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      className="btn-primary" 
                      onClick={() => setActiveCourseModal(item)}
                      style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                    >
                      <PlayCircle size={16} /> Continue Learning
                    </button>
                    <Link to={`/course/${item.courseId}`} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                      Details
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ backgroundColor: '#ffffff', padding: '2rem', textAlign: 'center', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#64748b' }}>
            No courses currently in progress. Start learning from your enrolled courses below!
          </div>
        )}
      </div>

      {/* Recent Enrollments Section */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BookOpen size={22} color="#2563eb" /> Recent Enrollments
        </h2>

        {recentEnrollments.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {recentEnrollments.map(enr => (
              <div key={enr.enrollmentId} style={{
                backgroundColor: '#ffffff',
                padding: '1rem 1.25rem',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <img src={enr.thumbnail} alt={enr.courseTitle} style={{ width: '50px', height: '36px', borderRadius: '4px', objectFit: 'cover' }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>{enr.courseTitle}</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      Enrolled: {new Date(enr.enrolledAt).toLocaleDateString()} • Progress: {enr.progressPercentage}%
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    padding: '0.2rem 0.6rem',
                    borderRadius: '999px',
                    backgroundColor: enr.status === 'COMPLETED' ? '#ecfdf5' : '#eff6ff',
                    color: enr.status === 'COMPLETED' ? '#047857' : '#1d4ed8',
                    border: enr.status === 'COMPLETED' ? '1px solid #a7f3d0' : '1px solid #bfdbfe'
                  }}>
                    {enr.status}
                  </span>
                  <Link to={`/course/${enr.courseId}`} className="btn-secondary" style={{ padding: '0.35rem 0.8rem', fontSize: '0.8rem' }}>
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ backgroundColor: '#ffffff', padding: '2rem', textAlign: 'center', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#64748b' }}>
            You have not enrolled in any courses yet.
          </div>
        )}
      </div>

      {/* Recent Certificates Section */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award size={22} color="#ec4899" /> Recent Certificates
          </h2>
          <Link to="/certificates" style={{ color: '#2563eb', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            View All ({stats.certificates || 0}) <ArrowRight size={16} />
          </Link>
        </div>

        {recentCertificates.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.2rem' }}>
            {recentCertificates.map(cert => (
              <div key={cert.id} style={{
                backgroundColor: '#ffffff',
                padding: '1.25rem',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
                    <Award size={20} color="#2563eb" />
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#2563eb' }}>{cert.certificateNumber}</div>
                  </div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
                    {cert.courseTitle}
                  </h4>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem' }}>
                    Issued: {new Date(cert.issuedAt).toLocaleDateString()}
                  </div>
                </div>

                <button 
                  className="btn-primary" 
                  onClick={() => handleViewCertDetails(cert.id)}
                  style={{ padding: '0.45rem 0.8rem', fontSize: '0.85rem', width: '100%' }}
                >
                  <FileText size={15} /> View Certificate
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ backgroundColor: '#ffffff', padding: '2rem', textAlign: 'center', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#64748b' }}>
            No certificates earned yet. Complete 100% of a course to earn your official certificate!
          </div>
        )}
      </div>

      {/* Start Learning Modal */}
      <StartLearningModal
        isOpen={Boolean(activeCourseModal)}
        onClose={() => setActiveCourseModal(null)}
        courseId={activeCourseModal?.courseId || activeCourseModal?.id}
        courseTitle={activeCourseModal?.courseTitle || activeCourseModal?.title}
        onProgressUpdate={fetchDashboardData}
      />

      {/* Certificate Details Modal */}
      {selectedCert && (
        <div className="modal-overlay" onClick={() => setSelectedCert(null)}>
          <div 
            className="modal-card" 
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '600px',
              width: '90%',
              padding: '2rem',
              textAlign: 'center'
            }}
          >
            <div style={{ border: '3px double #2563eb', padding: '1.5rem', borderRadius: '10px', backgroundColor: '#f8fafc' }}>
              <Award size={40} color="#2563eb" style={{ marginBottom: '0.8rem' }} />
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.2rem' }}>
                Certificate of Completion
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.2rem' }}>
                SkillHub E-Learning Certification
              </p>

              <div style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '0.3rem' }}>Presented to</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2563eb', marginBottom: '1rem' }}>
                {selectedCert.studentName || user?.name}
              </div>

              <div style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '0.3rem' }}>For completing</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.2rem' }}>
                "{selectedCert.courseTitle}"
              </div>

              <div style={{ fontSize: '0.8rem', color: '#64748b', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                <div>Certificate ID: <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{selectedCert.certificateNumber}</strong></div>
                <div>Issued: {new Date(selectedCert.issuedAt).toLocaleDateString()}</div>
              </div>
            </div>

            <div style={{ marginTop: '1.2rem', display: 'flex', gap: '0.8rem' }}>
              {selectedCert.pdfUrl ? (
                <a href={selectedCert.pdfUrl} target="_blank" rel="noreferrer" className="btn-primary" style={{ flex: 1, padding: '0.6rem' }}>
                  <Download size={16} /> Download PDF
                </a>
              ) : (
                <button className="btn-secondary" disabled style={{ flex: 1, padding: '0.6rem', opacity: 0.7 }}>
                  PDF Not Available
                </button>
              )}
              <button className="btn-secondary" onClick={() => setSelectedCert(null)} style={{ padding: '0.6rem 1.2rem' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />
    </div>
  );
};
