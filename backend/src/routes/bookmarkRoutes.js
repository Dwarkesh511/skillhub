import { Router } from 'express';
import { getBookmarks, addBookmark, deleteBookmark } from '../controllers/bookmarkController.js';
import { addBookmarkValidation, deleteBookmarkValidation } from '../validators/bookmarkValidators.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';

const router = Router();

// Protect all bookmark routes with authMiddleware
router.use(authMiddleware);

router.get('/', getBookmarks);
router.post('/', addBookmarkValidation, validate, addBookmark);
router.delete('/:courseId', deleteBookmarkValidation, validate, deleteBookmark);

export default router;
