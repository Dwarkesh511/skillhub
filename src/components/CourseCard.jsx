import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Clock } from 'lucide-react';
import { useBookmarks } from '../context/BookmarkContext';
import { useAuth } from '../context/AuthContext';
import * as enrollmentApi from '../services/enrollmentApi';

export const CourseCard = ({ course }) => {
  const navigate = useNavigate();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const { isAuthenticated } = useAuth();
  const [enrolling, setEnrolling] = useState(false);

  const bookmarked = isBookmarked(course.id);

  // Safely resolve properties from both backend API structure and mock fallback data
  const title = course.title || 'Untitled Course';
  const description = course.description || '';
  const thumbnail = course.thumbnail || course.image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80';
  const level = course.level || 'Beginner';
  const duration = course.duration || '8 Hours';
  const price = course.price !== undefined ? course.price : 0;

  const categoryName = typeof course.category === 'object'
    ? course.category?.name
    : course.category || 'General';

  const instructorName = typeof course.instructor === 'object'
    ? course.instructor?.name
    : course.instructor || 'Instructor';

  const lessonCount = course.lessonCount !== undefined
    ? course.lessonCount
    : (course.modules ? course.modules.reduce((sum, m) => sum + (m.lessons?.length || 0), 0) : course.lessons || 0);

  const handleBookmarkClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const res = await toggleBookmark(course.id);
    if (res && res.requireLogin) {
      navigate('/login');
    }
  };

  const handleEnrollClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // 1. If user is NOT logged in: redirect to /login
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (enrolling) return;

    try {
      setEnrolling(true);
      const res = await enrollmentApi.enrollInCourse(course.id);

      if (res && res.success) {
        // Successful enrollment -> Toast message + navigate to /dashboard
        navigate('/dashboard', {
          state: {
            message: 'Successfully enrolled in this course!',
            type: 'success'
          }
        });
      } else {
        navigate('/dashboard', {
          state: {
            message: res?.message || 'Failed to enroll in course.',
            type: 'error'
          }
        });
      }
    } catch (err) {
      // Handle duplicate enrollment (409) or other API errors
      if (err.status === 409 || (err.message && err.message.toLowerCase().includes('already enrolled'))) {
        navigate('/dashboard', {
          state: {
            message: 'You are already enrolled in this course.',
            type: 'info'
          }
        });
      } else if (err.status === 401) {
        navigate('/login');
      } else {
        navigate('/dashboard', {
          state: {
            message: err.message || 'Failed to enroll. Please try again.',
            type: 'error'
          }
        });
      }
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <div className="course-card">
      <div className="card-img-wrapper">
        <img 
          src={thumbnail} 
          alt={title} 
          className="card-img" 
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80';
          }}
        />
        <span className="category-tag">{categoryName}</span>
        <button 
          className={`bookmark-btn ${bookmarked ? 'bookmarked' : ''}`}
          onClick={handleBookmarkClick}
          title={bookmarked ? "Remove Bookmark" : "Bookmark Course"}
        >
          <Heart size={18} fill={bookmarked ? "#ef4444" : "none"} />
        </button>
      </div>

      <div className="card-body">
        <div className="card-meta">
          <span className="level-badge">{level}</span>
        </div>

        <h3 className="course-title">
          <Link to={`/course/${course.id}`}>{title}</Link>
        </h3>

        <p className="course-description">{description}</p>

        <div className="instructor-name">By {instructorName}</div>

        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: '#64748b', marginBottom: '0.8rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Clock size={14} /> {duration}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            • {lessonCount} Lessons
          </span>
        </div>

        <div className="card-footer">
          <span className="price-tag">₹{Number(price).toLocaleString('en-IN')}</span>
          <button 
            className="view-btn"
            onClick={handleEnrollClick}
            disabled={enrolling}
            style={{
              border: 'none',
              opacity: enrolling ? 0.7 : 1,
              cursor: enrolling ? 'not-allowed' : 'pointer'
            }}
          >
            {enrolling ? 'Enrolling...' : 'Enroll Now'}
          </button>
        </div>
      </div>
    </div>
  );
};
