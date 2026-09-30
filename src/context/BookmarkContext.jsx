import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import * as bookmarkApi from '../services/bookmarkApi';
import { useAuth } from './AuthContext';

const BookmarkContext = createContext();

export const BookmarkProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch bookmarks from Backend API whenever authenticated user changes
  const refreshBookmarks = useCallback(async () => {
    if (!isAuthenticated) {
      setBookmarks([]);
      return;
    }

    try {
      setLoading(true);
      const res = await bookmarkApi.getBookmarks();
      if (res && res.success && Array.isArray(res.bookmarks)) {
        // Extract array of bookmarked course IDs
        const courseIds = res.bookmarks.map(b => Number(b.courseId || b.course?.id));
        setBookmarks(courseIds);
      } else {
        setBookmarks([]);
      }
    } catch (err) {
      console.error('Failed to fetch bookmarks from backend:', err);
      setBookmarks([]);
    } finally {
      setLoading(false);
      // Clean up legacy localStorage bookmark mock data
      localStorage.removeItem('skillhub_bookmarks');
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshBookmarks();
  }, [refreshBookmarks, user]);

  const toggleBookmark = async (courseId) => {
    const numericId = Number(courseId);

    if (!isAuthenticated) {
      return { success: false, requireLogin: true, message: 'Please login to bookmark courses.' };
    }

    const alreadyBookmarked = bookmarks.includes(numericId);

    // Optimistic UI Update
    setBookmarks(prev => 
      alreadyBookmarked ? prev.filter(id => id !== numericId) : [...prev, numericId]
    );

    try {
      if (alreadyBookmarked) {
        await bookmarkApi.removeBookmark(numericId);
      } else {
        await bookmarkApi.addBookmark(numericId);
      }
      return { success: true };
    } catch (err) {
      // Revert optimistic update on failure
      setBookmarks(prev => 
        alreadyBookmarked ? [...prev, numericId] : prev.filter(id => id !== numericId)
      );

      // Handle duplicate bookmark gracefully (409)
      if (err.status === 409) {
        setBookmarks(prev => prev.includes(numericId) ? prev : [...prev, numericId]);
        return { success: true };
      }

      return { success: false, message: err.message || 'Failed to update bookmark.' };
    }
  };

  const isBookmarked = (courseId) => {
    return bookmarks.includes(Number(courseId));
  };

  return (
    <BookmarkContext.Provider 
      value={{ 
        bookmarks, 
        toggleBookmark, 
        isBookmarked, 
        bookmarkCount: bookmarks.length,
        loading,
        refreshBookmarks 
      }}
    >
      {children}
    </BookmarkContext.Provider>
  );
};

export const useBookmarks = () => {
  const context = useContext(BookmarkContext);
  if (!context) {
    throw new Error('useBookmarks must be used within a BookmarkProvider');
  }
  return context;
};
