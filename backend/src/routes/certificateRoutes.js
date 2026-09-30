import { Router } from 'express';
import { getCertificates, getCertificateById, generateCertificate } from '../controllers/certificateController.js';
import { generateCertificateValidation, getCertificateByIdValidation } from '../validators/certificateValidators.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';

const router = Router();

// Protect all certificate routes with authMiddleware
router.use(authMiddleware);

router.get('/', getCertificates);
router.post('/generate/:courseId', generateCertificateValidation, validate, generateCertificate);
router.get('/:id', getCertificateByIdValidation, validate, getCertificateById);

export default router;
