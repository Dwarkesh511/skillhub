import { body, param } from 'express-validator';

export const addEnrollmentValidation = [
  body('courseId')
    .notEmpty()
    .withMessage('Course ID is required')
    .isInt({ min: 1 })
    .withMessage('Course ID must be a positive integer')
];

export const getEnrollmentByCourseIdValidation = [
  param('courseId')
    .isInt({ min: 1 })
    .withMessage('Course ID must be a positive integer')
];
