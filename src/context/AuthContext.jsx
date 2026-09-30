import React, { createContext, useState, useEffect, useContext } from 'react';
import * as authApi from '../services/authApi';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Application Startup Auth Check via Backend Session Profile
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const res = await authApi.getProfile();
        if (res && res.success && res.user) {
          setUser({ ...res.user, isLoggedIn: true });
        } else {
          setUser(null);
        }
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
        // Remove legacy mock user object from localStorage
        localStorage.removeItem('skillhub_user');
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await authApi.login({ email, password });
      if (res && res.success && res.user) {
        const currentUser = { ...res.user, isLoggedIn: true };
        setUser(currentUser);
        return { success: true, user: currentUser };
      }
      return { success: false, message: res?.message || 'Login failed' };
    } catch (err) {
      return { success: false, message: err.message || 'Login failed' };
    }
  };

  const register = async (name, email, password) => {
    try {
      const res = await authApi.register({ name, email, password });
      if (res && res.success) {
        if (res.user) {
          const currentUser = { ...res.user, isLoggedIn: true };
          setUser(currentUser);
        }
        return { success: true, message: res.message || 'Account created successfully.', user: res.user };
      }
      return { success: false, message: res?.message || 'Registration failed' };
    } catch (err) {
      return { success: false, message: err.message || 'Registration failed' };
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      // Proceed to clear local state regardless
    } finally {
      setUser(null);
      localStorage.removeItem('skillhub_user');
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const res = await authApi.updateProfile(profileData);
      if (res && res.success && res.user) {
        const updatedUser = { ...res.user, isLoggedIn: true };
        setUser(updatedUser);
        return { success: true, message: res.message || 'Profile updated successfully.', user: updatedUser };
      }
      return { success: false, message: res?.message || 'Failed to update profile' };
    } catch (err) {
      return { success: false, message: err.message || 'Failed to update profile' };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const res = await authApi.changePassword({ currentPassword, newPassword });
      if (res && res.success) {
        return { success: true, message: res.message || 'Password changed successfully.' };
      }
      return { success: false, message: res?.message || 'Failed to change password' };
    } catch (err) {
      return { success: false, message: err.message || 'Failed to change password' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: Boolean(user),
        login,
        register,
        logout,
        updateProfile,
        changePassword
      }}
    >
      {!loading ? (
        children
      ) : (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <div style={{ fontSize: '1rem', color: '#64748b', fontWeight: 600 }}>Loading SkillHub...</div>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
