import { query, param } from 'express-validator';

export const getCoursesValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page parameter must be an integer greater than or equal to 1'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit parameter must be an integer between 1 and 50'),

  query('level')
    .optional()
    .isIn(['Beginner', 'Intermediate', 'Advanced'])
    .withMessage('Invalid level filter. Allowed values: Beginner, Intermediate, Advanced'),

  query('featured')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('Invalid featured value. Allowed values: true, false'),

  query('sort')
    .optional()
    .isIn(['latest', 'rating', 'price-low', 'price-high', 'title'])
    .withMessage('Invalid sort value. Allowed values: latest, rating, price-low, price-high, title'),

  query('search')
    .optional()
    .trim(),

  query('category')
    .optional()
    .trim()
];

export const getCourseByIdValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Course ID must be a valid positive integer')
];
