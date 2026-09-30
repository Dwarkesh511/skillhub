import { Router } from 'express';
import { register, login, logout } from '../controllers/authController.js';
import { registerValidation, loginValidation } from '../validators/authValidators.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);
router.post('/logout', logout);

export default router;
