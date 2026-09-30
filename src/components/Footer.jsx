import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-brand">
          <h3>
            <GraduationCap size={24} color="#3b82f6" />
            SkillHub
          </h3>
          <p>
            Your ultimate student-friendly platform for learning tech, computer science, business, and design skills.
          </p>
        </div>

        <div className="footer-column">
          <h4>Explore</h4>
          <ul>
            <li><Link to="/">All Courses</Link></li>
            <li><Link to="/bookmarks">Saved Bookmarks</Link></li>
            <li><Link to="/dashboard">Student Dashboard</Link></li>
            <li><Link to="/profile">My Account</Link></li>
          </ul>
        </div>

        <div className="footer-column">
          <h4>Popular Subjects</h4>
          <ul>
            <li><Link to="/?category=Development">Programming & Web Dev</Link></li>
            <li><Link to="/?category=Data Science">Data Science & AI</Link></li>
            <li><Link to="/?category=Cyber Security">Cyber Security</Link></li>
            <li><Link to="/?category=Academic">Academic & Microprocessors</Link></li>
          </ul>
        </div>

        <div className="footer-column">
          <h4>Support & Account</h4>
          <ul>
            <li><Link to="/profile">Edit Profile</Link></li>
            <li><Link to="/profile?tab=password">Change Password</Link></li>
            <li><Link to="/forgot-password">Forgot Password</Link></li>
            <li><Link to="/login">Student Login</Link></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} SkillHub E-Learning Platform. All rights reserved.</p>
      </div>
    </footer>
  );
};
