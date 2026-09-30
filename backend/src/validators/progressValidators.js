import { body, param } from 'express-validator';

export const toggleProgressValidation = [
  body('lessonId')
    .notEmpty()
    .withMessage('Lesson ID is required')
    .isInt({ min: 1 })
    .withMessage('Lesson ID must be a positive integer'),
  body('completed')
    .optional()
    .isBoolean()
    .withMessage('Completed must be a boolean value')
];

export const getCourseProgressValidation = [
  param('courseId')
    .isInt({ min: 1 })
    .withMessage('Course ID must be a positive integer')
];
