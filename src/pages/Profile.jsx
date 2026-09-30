import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { User, Key, Save, LogOut, CheckCircle, AlertCircle, ShieldCheck, Mail, Phone, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Toast } from '../components/Toast';

export const Profile = () => {
  const { user, updateProfile, changePassword, logout } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'view');

  // Edit Profile Form State
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [bio, setBio] = useState(user?.bio || '');

  // Change Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Toast & Alert State
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setBio(user.bio || '');
    }
  }, [user]);

  const showToast = (msg, type = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage('');
    }, 3500);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);

    const res = await updateProfile({ name, email, phone, bio });
    if (res.success) {
      showToast('Profile updated successfully.', 'success');
      setActiveTab('view');
    } else {
      showToast(res.message || 'Failed to update profile.', 'error');
    }

    setSavingProfile(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }

    if (!newPassword || newPassword.trim() === '') {
      setPasswordError('New password cannot be empty.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setSavingPassword(true);

    const res = await changePassword(currentPassword, newPassword);
    if (res.success) {
      setPasswordSuccess(res.message || 'Password changed successfully.');
      showToast('Password changed successfully.', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPasswordError(res.message || 'Failed to change password.');
    }

    setSavingPassword(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="profile-page" style={{ maxWidth: '850px', margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: '1.8rem' }}>
        <h1 className="page-title">My Account</h1>
        <p className="page-subtitle">Manage your personal information, profile, and account security.</p>
      </div>

      {/* Navigation Sub-Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        borderBottom: '1px solid #e2e8f0',
        marginBottom: '2rem'
      }}>
        <button
          className={`nav-item ${activeTab === 'view' ? 'active' : ''}`}
          onClick={() => setActiveTab('view')}
          style={{ borderRadius: '8px 8px 0 0', padding: '0.75rem 1.2rem' }}
        >
          <User size={18} /> View Profile
        </button>
        <button
          className={`nav-item ${activeTab === 'edit' ? 'active' : ''}`}
          onClick={() => setActiveTab('edit')}
          style={{ borderRadius: '8px 8px 0 0', padding: '0.75rem 1.2rem' }}
        >
          <FileText size={18} /> Edit Profile
        </button>
        <button
          className={`nav-item ${activeTab === 'password' ? 'active' : ''}`}
          onClick={() => setActiveTab('password')}
          style={{ borderRadius: '8px 8px 0 0', padding: '0.75rem 1.2rem' }}
        >
          <Key size={18} /> Change Password
        </button>
      </div>

      {/* TAB 1: VIEW PROFILE */}
      {activeTab === 'view' && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '2rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid #f1f5f9' }}>
            <div className="avatar-circle" style={{ width: '70px', height: '70px', fontSize: '1.8rem' }}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>{user?.name || 'Student Name'}</h2>
              <div style={{ color: '#2563eb', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <ShieldCheck size={16} /> Verified SkillHub Student
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                <Mail size={16} /> Email Address
              </div>
              <div style={{ fontWeight: 600, color: '#0f172a' }}>{user?.email || 'Not specified'}</div>
            </div>

            <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                <Phone size={16} /> Mobile Phone
              </div>
              <div style={{ fontWeight: 600, color: '#0f172a' }}>{user?.phone || 'Not specified'}</div>
            </div>
          </div>

          <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '10px', marginBottom: '2rem' }}>
            <div style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '0.3rem', fontWeight: 600 }}>Bio / About</div>
            <p style={{ color: '#334155', fontSize: '0.95rem' }}>{user?.bio || 'No bio provided.'}</p>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn-primary" onClick={() => setActiveTab('edit')}>
              <FileText size={18} /> Edit Profile Info
            </button>
            <button className="btn-danger" onClick={handleLogout}>
              <LogOut size={18} /> Logout
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: EDIT PROFILE */}
      {activeTab === 'edit' && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '2rem', boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', color: '#0f172a' }}>Edit Account Information</h2>

          <form onSubmit={handleSaveProfile}>
            <div className="form-group">
              <label htmlFor="fullName">Full Name</label>
              <input
                id="fullName"
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="emailAddr">Email Address</label>
              <input
                id="emailAddr"
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="mobileNo">Mobile Number</label>
              <input
                id="mobileNo"
                type="text"
                className="form-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 9876543210"
              />
            </div>

            <div className="form-group">
              <label htmlFor="userBio">Bio / Profile Description</label>
              <textarea
                id="userBio"
                className="form-input"
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button type="submit" className="btn-primary" disabled={savingProfile}>
                <Save size={18} /> {savingProfile ? 'Saving Changes...' : 'Save Changes'}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setActiveTab('view')}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: CHANGE PASSWORD */}
      {activeTab === 'password' && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '2rem', boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.4rem', color: '#0f172a' }}>Change Password</h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Update your account password securely.
          </p>

          {passwordError && (
            <div style={{ padding: '0.8rem 1rem', backgroundColor: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '8px', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
              <AlertCircle size={18} /> {passwordError}
            </div>
          )}

          {passwordSuccess && (
            <div style={{ padding: '0.8rem 1rem', backgroundColor: '#ecfdf5', color: '#10b981', border: '1px solid #a7f3d0', borderRadius: '8px', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
              <CheckCircle size={18} /> {passwordSuccess}
            </div>
          )}

          <form onSubmit={handleChangePassword}>
            <div className="form-group">
              <label htmlFor="currPass">Current Password</label>
              <input
                id="currPass"
                type="password"
                className="form-input"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="newPass">New Password</label>
              <input
                id="newPass"
                type="password"
                className="form-input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPass">Confirm New Password</label>
              <input
                id="confirmPass"
                type="password"
                className="form-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                required
              />
            </div>

            <button type="submit" className="btn-primary" disabled={savingPassword} style={{ marginTop: '1rem' }}>
              <Key size={18} /> {savingPassword ? 'Updating Password...' : 'Change Password'}
            </button>
          </form>
        </div>
      )}

      {/* Feedback Toast */}
      <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage('')} />
    </div>
  );
};
