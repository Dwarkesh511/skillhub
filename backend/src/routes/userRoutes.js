import { Router } from 'express';
import { getProfile, updateProfile, changePassword } from '../controllers/userController.js';
import { updateProfileValidation, changePasswordValidation } from '../validators/authValidators.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';

const router = Router();

// Protect all user profile endpoints with authMiddleware
router.use(authMiddleware);

router.get('/profile', getProfile);
router.put('/profile', updateProfileValidation, validate, updateProfile);
router.put('/change-password', changePasswordValidation, validate, changePassword);

export default router;
