import { Router } from 'express';
import { getCourses, getCourseById } from '../controllers/courseController.js';
import { getCoursesValidation, getCourseByIdValidation } from '../validators/courseValidators.js';
import { validate } from '../middleware/validate.js';

const router = Router();

// Public course catalog routes
router.get('/', getCoursesValidation, validate, getCourses);
router.get('/:id', getCourseByIdValidation, validate, getCourseById);

export default router;
