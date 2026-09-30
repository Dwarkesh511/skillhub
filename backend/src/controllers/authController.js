import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';

export const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, bio, avatar } = req.body;

    // Check if user with given email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email is already registered'
      });
    }

    // Hash password with bcryptjs
    const passwordHash = await bcrypt.hash(password, 10);

    // Create new student user (role defaults to STUDENT, ignoring any client role tampering)
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: 'STUDENT',
        avatar: avatar || name.charAt(0).toUpperCase(),
        phone: phone || null,
        bio: bio || null
      }
    });

    // Return safe user object (omit passwordHash)
    const { passwordHash: _, ...safeUser } = user;

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: safeUser
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Verify password with bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || 'skillhub-secret-key-local-development-2026';
    const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      jwtSecret,
      { expiresIn: jwtExpiresIn }
    );

    // Set HttpOnly cookie
    res.cookie('skillhub_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Return safe user object (never return passwordHash or JWT in JSON body)
    const { passwordHash: _, ...safeUser } = user;

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      user: safeUser
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    res.clearCookie('skillhub_token', {
      httpOnly: true,
      sameSite: 'lax'
    });

    return res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    next(error);
  }
};
