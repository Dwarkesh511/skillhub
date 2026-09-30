import bcrypt from 'bcryptjs';
import prisma from '../config/db.js';

export const getProfile = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }

    const { passwordHash: _, ...safeUser } = user;

    return res.status(200).json({
      success: true,
      user: safeUser
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, avatar, phone, bio } = req.body;

    const updatedData = {};
    if (name !== undefined) updatedData.name = name;
    if (avatar !== undefined) updatedData.avatar = avatar;
    if (phone !== undefined) updatedData.phone = phone;
    if (bio !== undefined) updatedData.bio = bio;

    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: updatedData
    });

    const { passwordHash: _, ...safeUser } = user;

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: safeUser
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password in database
    await prisma.user.update({
      where: { id: req.user.userId },
      data: { passwordHash: newPasswordHash }
    });

    // Invalidate authentication cookie (auto-logout after password change)
    res.clearCookie('skillhub_token', {
      httpOnly: true,
      sameSite: 'lax'
    });

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully. Please log in again with your new password.'
    });
  } catch (error) {
    next(error);
  }
};
