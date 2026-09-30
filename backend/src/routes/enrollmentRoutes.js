import { Router } from 'express';
import { getEnrollments, addEnrollment, getEnrollmentByCourseId } from '../controllers/enrollmentController.js';
import { addEnrollmentValidation, getEnrollmentByCourseIdValidation } from '../validators/enrollmentValidators.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';

const router = Router();

// Protect all enrollment routes with authMiddleware
router.use(authMiddleware);

router.get('/', getEnrollments);
router.post('/', addEnrollmentValidation, validate, addEnrollment);
router.get('/:courseId', getEnrollmentByCourseIdValidation, validate, getEnrollmentByCourseId);

export default router;
