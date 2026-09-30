import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Clock, Globe, BookOpen, Heart, 
  PlayCircle, ArrowLeft, CheckCircle, Award, UserCheck, AlertCircle 
} from 'lucide-react';
import { useBookmarks } from '../context/BookmarkContext';
import { useAuth } from '../context/AuthContext';
import { StartLearningModal } from '../components/StartLearningModal';
import * as courseApi from '../services/courseApi';
import * as enrollmentApi from '../services/enrollmentApi';

export const CourseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { isBookmarked, toggleBookmark } = useBookmarks();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Enrollment State
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollmentData, setEnrollmentData] = useState(null);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);

  // 1. Fetch Course Details with unmount & race condition safety
  useEffect(() => {
    let isMounted = true;
    window.scrollTo(0, 0);

    const fetchCourseDetails = async () => {
      try {
        setLoading(true);
        setError('');

        const res = await courseApi.getCourseById(id);
        if (!isMounted) return;

        if (res && res.success && res.course) {
          setCourse(res.course);
        } else {
          setError(res?.message || 'Course not found.');
          setCourse(null);
        }
      } catch (err) {
        if (!isMounted) return;
        setError(err.message || 'Course not found.');
        setCourse(null);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (id) {
      fetchCourseDetails();
    } else {
      setLoading(false);
      setError('Invalid course ID.');
    }

    return () => {
      isMounted = false;
    };
  }, [id]);

  // 2. Check Enrollment Status for authenticated user
  useEffect(() => {
    let isMounted = true;

    const checkEnrollmentStatus = async () => {
      if (!isAuthenticated || !id) {
        if (isMounted) {
          setIsEnrolled(false);
          setEnrollmentData(null);
        }
        return;
      }

      try {
        const res = await enrollmentApi.getEnrollment(id);
        if (!isMounted) return;

        if (res && res.success && res.enrollment) {
          setIsEnrolled(true);
          setEnrollmentData(res.enrollment);
        } else {
          setIsEnrolled(false);
          setEnrollmentData(null);
        }
      } catch (err) {
        if (!isMounted) return;
        setIsEnrolled(false);
        setEnrollmentData(null);
      }
    };

    checkEnrollmentStatus();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, id]);

  const courseIdNum = Number(course?.id || id);
  const bookmarked = !isNaN(courseIdNum) ? isBookmarked(courseIdNum) : false;

  const handleBookmarkClick = async () => {
    if (isNaN(courseIdNum)) return;
    const res = await toggleBookmark(courseIdNum);
    if (res && res.requireLogin) {
      navigate('/login');
    }
  };

  const handleEnrollClick = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (isEnrolled) {
      setIsModalOpen(true);
      return;
    }

    try {
      setEnrolling(true);
      setEnrollError('');

      const res = await enrollmentApi.enrollInCourse(courseIdNum);
      if (res && res.success) {
        setIsEnrolled(true);
        setEnrollmentData(res.enrollment);
        setIsModalOpen(true);
      } else {
        setEnrollError(res?.message || 'Failed to enroll in course.');
      }
    } catch (err) {
      if (err.status === 409) {
        setIsEnrolled(true);
        setIsModalOpen(true);
      } else {
        setEnrollError(err.message || 'Failed to enroll in course.');
      }
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <div style={{ fontSize: '1.1rem', color: '#64748b', fontWeight: 600 }}>Loading course details...</div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem', maxWidth: '600px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>Course Not Found</h2>
        <p style={{ color: '#64748b', margin: '1rem 0' }}>{error || 'The course you are looking for does not exist or has been removed.'}</p>
        <Link to="/" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <ArrowLeft size={18} /> Back to Catalog
        </Link>
      </div>
    );
  }

  // Helper properties
  const title = course.title || 'Untitled Course';
  const description = course.description || '';
  const thumbnail = course.thumbnail || course.image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80';
  const level = course.level || 'Beginner';
  const duration = course.duration || '8 Hours';
  const price = course.price !== undefined && course.price !== null ? course.price : 0;
  const language = course.language || 'English';
  const skills = Array.isArray(course.skills) ? course.skills : [];

  const categoryName = typeof course.category === 'object'
    ? course.category?.name
    : course.category || 'General';

  const instructorName = typeof course.instructor === 'object'
    ? course.instructor?.name
    : course.instructor || 'Instructor';

  const instructorBio = typeof course.instructor === 'object' && course.instructor?.bio
    ? course.instructor.bio
    : `Senior educator and industry expert with over 8+ years of teaching experience in ${categoryName}.`;

  const modules = Array.isArray(course.modules) ? course.modules : [];
  const totalLessonsCount = modules.reduce((sum, m) => sum + (Array.isArray(m?.lessons) ? m.lessons.length : 0), 0);

  return (
    <div className="course-details-page">
      <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#2563eb', fontWeight: 600, marginBottom: '1.5rem' }}>
        <ArrowLeft size={18} /> Back to Catalog
      </Link>

      {enrollError && (
        <div style={{ padding: '1rem', backgroundColor: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={20} /> <span>{enrollError}</span>
        </div>
      )}

      {/* Main Course Header Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '2.5rem',
        backgroundColor: '#ffffff',
        padding: '2rem',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: '2rem'
      }}>
        {/* Left Info Column */}
        <div>
          <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1rem' }}>
            <span className="category-tag" style={{ position: 'static' }}>{categoryName}</span>
            <span className="level-badge">{level}</span>
          </div>

          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem', lineHeight: 1.25 }}>
            {title}
          </h1>

          <p style={{ fontSize: '1.05rem', color: '#475569', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            {description}
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', fontSize: '0.9rem', color: '#64748b', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Clock size={18} /> {duration}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <BookOpen size={18} /> {totalLessonsCount} Lessons
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Globe size={18} /> {language}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.8rem 1rem', backgroundColor: '#f8fafc', borderRadius: '8px', width: 'fit-content' }}>
            <UserCheck size={20} color="#2563eb" />
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Instructor</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>{instructorName}</div>
            </div>
          </div>
        </div>

        {/* Right Pricing & Action Card */}
        <div style={{
          backgroundColor: '#f8fafc',
          padding: '1.5rem',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ width: '100%', height: '200px', borderRadius: '8px', overflow: 'hidden', marginBottom: '1.2rem' }}>
              <img 
                src={thumbnail} 
                alt={title} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80';
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', marginBottom: '1.2rem' }}>
              <span style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0f172a' }}>
                ₹{Number(price).toLocaleString('en-IN')}
              </span>
              <span style={{ color: '#10b981', fontWeight: 600, fontSize: '0.9rem' }}>Full Lifetime Access</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1.5rem' }}>
              <button 
                className="btn-primary" 
                onClick={handleEnrollClick}
                disabled={enrolling}
                style={{ width: '100%', padding: '0.8rem', fontSize: '1rem' }}
              >
                <PlayCircle size={20} />
                {enrolling ? 'Enrolling...' : isEnrolled ? 'Start Learning (Enrolled)' : 'Enroll Now'}
              </button>

              <button 
                className={`btn-secondary ${bookmarked ? 'bookmarked' : ''}`}
                onClick={handleBookmarkClick}
                style={{ width: '100%', padding: '0.8rem', fontSize: '0.95rem' }}
              >
                <Heart size={18} fill={bookmarked ? "#ef4444" : "none"} color={bookmarked ? "#ef4444" : "#475569"} />
                {bookmarked ? "Bookmarked in Account" : "Add to Bookmarks"}
              </button>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem', fontSize: '0.85rem', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle size={15} color="#10b981" /> {isEnrolled ? 'Enrolled & Active' : '100% Online & Self-Paced'}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Award size={15} color="#2563eb" /> Certificate of Completion
            </span>
          </div>
        </div>
      </div>

      {/* Skills & Curriculum Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        {/* Course Curriculum */}
        <div style={{ backgroundColor: '#ffffff', padding: '1.8rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen size={22} color="#2563eb" />
            Course Curriculum ({totalLessonsCount} Lessons)
          </h3>

          {modules.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              {modules.map((mod, modIdx) => (
                <div key={mod?.id || modIdx} style={{ border: '1px solid #f1f5f9', borderRadius: '8px', overflow: 'hidden' }}>
                  <div style={{ padding: '0.8rem 1rem', backgroundColor: '#f8fafc', fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>
                    {mod?.title || `Module ${modIdx + 1}`}
                  </div>
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                    {Array.isArray(mod?.lessons) && mod.lessons.map((lesson, lesIdx) => (
                      <li key={lesson?.id || lesIdx} style={{
                        padding: '0.75rem 1rem',
                        borderTop: '1px solid #f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.9rem',
                        fontWeight: 500,
                        color: '#334155'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <PlayCircle size={16} color="#64748b" />
                          <span>{lesson?.title || 'Untitled Lesson'}</span>
                        </div>
                        {lesson?.duration && (
                          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{lesson.duration}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>No modules available for this course yet.</p>
          )}
        </div>

        {/* Skills & Instructor info */}
        <div>
          {/* Skills Acquired */}
          {skills.length > 0 && (
            <div style={{ backgroundColor: '#ffffff', padding: '1.8rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem' }}>Skills You Will Master</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                {skills.map((skill, idx) => (
                  <span key={idx} style={{
                    backgroundColor: '#eff6ff',
                    color: '#2563eb',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    padding: '0.35rem 0.8rem',
                    borderRadius: '999px',
                    border: '1px solid #bfdbfe'
                  }}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Instructor Bio */}
          <div style={{ backgroundColor: '#ffffff', padding: '1.8rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.8rem' }}>About the Instructor</h3>
            <p style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.4rem' }}>{instructorName}</p>
            <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.6 }}>
              {instructorBio}
            </p>
          </div>
        </div>
      </div>

      {/* Start Learning Modal */}
      <StartLearningModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        courseTitle={title}
        courseId={course?.id || id}
        onProgressUpdate={checkEnrollmentStatus}
      />
    </div>
  );
};
