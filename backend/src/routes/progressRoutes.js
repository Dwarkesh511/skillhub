import { Router } from 'express';
import { toggleProgress, getCourseProgress, getUserProgress } from '../controllers/progressController.js';
import { toggleProgressValidation, getCourseProgressValidation } from '../validators/progressValidators.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';

const router = Router();

// All progress routes require authentication
router.use(authMiddleware);

router.post('/toggle', toggleProgressValidation, validate, toggleProgress);
router.get('/course/:courseId', getCourseProgressValidation, validate, getCourseProgress);
router.get('/', getUserProgress);

export default router;
