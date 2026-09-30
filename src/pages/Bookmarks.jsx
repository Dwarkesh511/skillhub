import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, ArrowRight, AlertCircle } from 'lucide-react';
import { useBookmarks } from '../context/BookmarkContext';
import { useAuth } from '../context/AuthContext';
import { CourseCard } from '../components/CourseCard';
import * as bookmarkApi from '../services/bookmarkApi';

export const Bookmarks = () => {
  const { isAuthenticated } = useAuth();
  const { bookmarks } = useBookmarks();
  const [bookmarkedCourses, setBookmarkedCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBackendBookmarks = async () => {
      if (!isAuthenticated) {
        setBookmarkedCourses([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        const res = await bookmarkApi.getBookmarks();
        if (res && res.success && Array.isArray(res.bookmarks)) {
          const coursesList = res.bookmarks.map(b => b.course).filter(Boolean);
          setBookmarkedCourses(coursesList);
        } else {
          setBookmarkedCourses([]);
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch bookmarks');
        setBookmarkedCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBackendBookmarks();
  }, [isAuthenticated, bookmarks]);

  return (
    <div className="bookmarks-page">
      <div className="page-header">
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Bookmark size={28} color="#2563eb" />
          My Saved Bookmarks
        </h1>
        <p className="page-subtitle">
          Manage your saved courses and pick up right where you left off.
        </p>
      </div>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#fef2f2', color: '#ef4444', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={20} /> <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{ fontSize: '1.1rem', color: '#64748b', fontWeight: 600 }}>Loading saved bookmarks...</div>
        </div>
      ) : bookmarkedCourses.length > 0 ? (
        <>
          <div style={{ marginBottom: '1.5rem', color: '#64748b', fontSize: '0.95rem' }}>
            You have <strong>{bookmarkedCourses.length}</strong> course{bookmarkedCourses.length === 1 ? '' : 's'} saved in your bookmarks.
          </div>
          <div className="course-grid">
            {bookmarkedCourses.map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          maxWidth: '500px',
          margin: '2rem auto'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: '#eff6ff',
            color: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.2rem'
          }}>
            <Bookmark size={32} />
          </div>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem' }}>No Bookmarks Yet</h3>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
            Click the heart icon on any course card to save it here for easy access later.
          </p>
          <Link to="/" className="btn-primary">
            Explore Courses <ArrowRight size={18} />
          </Link>
        </div>
      )}
    </div>
  );
};
