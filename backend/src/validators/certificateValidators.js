import { param } from 'express-validator';

export const generateCertificateValidation = [
  param('courseId')
    .isInt({ min: 1 })
    .withMessage('Course ID must be a positive integer')
];

export const getCertificateByIdValidation = [
  param('id')
    .notEmpty()
    .withMessage('Certificate ID is required')
    .isString()
    .withMessage('Certificate ID must be a valid string')
];
