import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, RotateCcw, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { CourseCard } from '../components/CourseCard';
import * as courseApi from '../services/courseApi';

export const Home = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'All';

  // State Management
  const [categories, setCategories] = useState([]);
  const [courses, setCourses] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [sortBy, setSortBy] = useState('popular');
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [error, setError] = useState('');

  // 1. Fetch Categories from Backend API on Mount
  useEffect(() => {
    let isMounted = true;

    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const res = await courseApi.getCategories();
        if (isMounted && res && res.success && Array.isArray(res.categories)) {
          setCategories(res.categories);
        }
      } catch (err) {
        console.error('Failed to load categories from backend API:', err);
      } finally {
        if (isMounted) setCategoriesLoading(false);
      }
    };

    fetchCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Debounce search query input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset to page 1 on new search
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 3. Fetch Courses from Backend API based on active filters
  const loadCourses = useCallback(async () => {
    let isMounted = true;
    try {
      setLoading(true);
      setError('');

      const apiParams = {
        page,
        limit: 12
      };

      if (debouncedSearch.trim()) {
        apiParams.search = debouncedSearch.trim();
      }

      if (selectedCategory && selectedCategory !== 'All') {
        apiParams.category = selectedCategory;
      }

      if (selectedLevel && selectedLevel !== 'All') {
        apiParams.level = selectedLevel;
      }

      if (sortBy === 'newest') apiParams.sort = 'latest';
      else if (sortBy === 'popular') apiParams.sort = 'rating';
      else if (sortBy === 'price-low') apiParams.sort = 'price-low';
      else if (sortBy === 'price-high') apiParams.sort = 'price-high';
      else if (sortBy === 'title') apiParams.sort = 'title';

      const res = await courseApi.getCourses(apiParams);

      if (isMounted) {
        if (res && res.success) {
          setCourses(res.courses || []);
          if (res.pagination) {
            setPagination(res.pagination);
          }
        } else {
          setError(res?.message || 'Failed to load courses.');
          setCourses([]);
        }
      }
    } catch (err) {
      if (isMounted) {
        setError(err.message || 'Error communicating with course server.');
        setCourses([]);
      }
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  }, [page, debouncedSearch, selectedCategory, selectedLevel, sortBy]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const handleReset = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setSelectedCategory('All');
    setSelectedLevel('All');
    setSortBy('popular');
    setPage(1);
    setSearchParams({});
  };

  const handleCategorySelect = (slug) => {
    setSelectedCategory(slug);
    setPage(1);
    if (slug === 'All') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', slug);
    }
    setSearchParams(searchParams);
  };

  const handleLevelChange = (levelVal) => {
    setSelectedLevel(levelVal);
    setPage(1);
  };

  const handleSortChange = (sortVal) => {
    setSortBy(sortVal);
    setPage(1);
  };

  // Resolve current active category display name
  const currentCategoryObj = categories.find(c => c.slug === selectedCategory || c.name === selectedCategory);
  const displayCategoryName = selectedCategory === 'All' ? 'All' : (currentCategoryObj?.name || selectedCategory);

  return (
    <div className="home-page">
      <div className="page-header" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h1 className="page-title">Explore Tech & Academic Courses</h1>
        <p className="page-subtitle">
          Upgrade your skills with over 30+ interactive, student-friendly courses in programming, data, cyber security, and engineering.
        </p>
      </div>

      {/* Category Pills */}
      <div className="category-pills">
        <button
          className={`pill-btn ${selectedCategory === 'All' ? 'active' : ''}`}
          onClick={() => handleCategorySelect('All')}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat.id || cat.slug}
            className={`pill-btn ${selectedCategory === cat.slug || selectedCategory === cat.name ? 'active' : ''}`}
            onClick={() => handleCategorySelect(cat.slug)}
          >
            {cat.name} {cat.courseCount !== undefined ? `(${cat.courseCount})` : ''}
          </button>
        ))}
      </div>

      {/* Filter & Search Bar */}
      <div className="filter-section">
        <div className="search-box">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            placeholder="Search by title, topic, instructor, skill (e.g. 'HTML', 'MI', 'Cyber', 'Python')..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-row">
          <div className="filter-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>
              <Filter size={16} /> Filters:
            </div>

            <select
              className="filter-select"
              value={selectedCategory}
              onChange={(e) => handleCategorySelect(e.target.value)}
            >
              <option value="All">Category: All Categories</option>
              {categories.map(cat => (
                <option key={cat.id || cat.slug} value={cat.slug}>
                  Category: {cat.name}
                </option>
              ))}
            </select>

            <select
              className="filter-select"
              value={selectedLevel}
              onChange={(e) => handleLevelChange(e.target.value)}
            >
              <option value="All">All Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>

            <select
              className="filter-select"
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
            >
              <option value="popular">Sort: Most Popular</option>
              <option value="newest">Sort: Newest</option>
              <option value="price-low">Sort: Price (Low to High)</option>
              <option value="price-high">Sort: Price (High to Low)</option>
              <option value="title">Sort: Title (A-Z)</option>
            </select>
          </div>

          {(searchQuery || selectedCategory !== 'All' || selectedLevel !== 'All' || sortBy !== 'popular') && (
            <button className="reset-btn" onClick={handleReset} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <RotateCcw size={14} /> Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Catalog Results Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
          {displayCategoryName === 'All' ? 'All Courses' : `${displayCategoryName} Courses`}
          <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500, marginLeft: '0.5rem' }}>
            ({pagination.total || courses.length} available)
          </span>
        </h2>
      </div>

      {/* Error Banner */}
      {error && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#fef2f2',
          color: '#ef4444',
          border: '1px solid #fca5a5',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Course Cards Grid or Loading State */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{ fontSize: '1.1rem', color: '#64748b', fontWeight: 600 }}>Loading courses...</div>
        </div>
      ) : courses.length > 0 ? (
        <>
          <div className="course-grid">
            {courses.map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '2.5rem' }}>
              <button
                className="btn-secondary"
                disabled={page <= 1}
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
              >
                <ChevronLeft size={16} /> Previous
              </button>
              
              <span style={{ padding: '0 0.8rem', fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>
                Page {pagination.page} of {pagination.totalPages}
              </span>

              <button
                className="btn-secondary"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(prev => Math.min(prev + 1, pagination.totalPages))}
                style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: '#0f172a' }}>No courses match your search</h3>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Try adjusting your search terms or clearing your selected filters.</p>
          <button className="btn-primary" onClick={handleReset}>
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};
