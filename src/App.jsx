import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { BookmarkProvider } from './context/BookmarkContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Home } from './pages/Home';
import { CourseDetails } from './pages/CourseDetails';
import { Bookmarks } from './pages/Bookmarks';
import { Dashboard } from './pages/Dashboard';
import { Profile } from './pages/Profile';
import { Certificates } from './pages/Certificates';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';

export function App() {
  return (
    <AuthProvider>
      <BookmarkProvider>
        <Router>
          <div className="app-container">
            <Navbar />
            <main className="main-content">
              <ErrorBoundary>
                <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/course/:id" element={<CourseDetails />} />
                <Route
                  path="/bookmarks"
                  element={
                    <ProtectedRoute>
                      <Bookmarks />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/certificates"
                  element={
                    <ProtectedRoute>
                      <Certificates />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="*" element={<Home />} />
              </Routes>
            </ErrorBoundary>
          </main>
            <Footer />
          </div>
        </Router>
      </BookmarkProvider>
    </AuthProvider>
  );
}

export default App;
