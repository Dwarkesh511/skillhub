import prisma from '../config/db.js';

export const getEnrollments = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      orderBy: { enrolledAt: 'desc' },
      select: {
        id: true,
        status: true,
        progressPercentage: true,
        lastAccessedAt: true,
        enrolledAt: true,
        completedAt: true,
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            thumbnail: true,
            level: true,
            duration: true,
            price: true,
            rating: true,
            totalReviews: true,
            language: true,
            skills: true,
            featured: true,
            createdAt: true,
            updatedAt: true,
            instructor: {
              select: {
                id: true,
                name: true,
                avatar: true,
                bio: true
              }
            },
            category: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            }
          }
        }
      }
    });

    return res.status(200).json({
      success: true,
      enrollments
    });
  } catch (error) {
    next(error);
  }
};

export const addEnrollment = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const courseId = parseInt(req.body.courseId);

    // 1. Check if course exists
    const courseExists = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!courseExists) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // 2. Check if user is already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId
        }
      }
    });

    if (existingEnrollment) {
      return res.status(409).json({
        success: false,
        message: 'Already enrolled in this course'
      });
    }

    // 3. Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        userId,
        courseId,
        status: 'ACTIVE',
        progressPercentage: 0.0,
        lastAccessedAt: null,
        completedAt: null
      },
      select: {
        id: true,
        status: true,
        progressPercentage: true,
        lastAccessedAt: true,
        enrolledAt: true,
        completedAt: true,
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            thumbnail: true,
            level: true,
            duration: true,
            price: true,
            rating: true,
            totalReviews: true,
            language: true,
            skills: true,
            featured: true,
            createdAt: true,
            updatedAt: true,
            instructor: {
              select: {
                id: true,
                name: true,
                avatar: true,
                bio: true
              }
            },
            category: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            }
          }
        }
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Successfully enrolled in course',
      enrollment
    });
  } catch (error) {
    next(error);
  }
};

export const getEnrollmentByCourseId = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const courseId = parseInt(req.params.courseId);

    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId
        }
      },
      select: {
        id: true,
        status: true,
        progressPercentage: true,
        lastAccessedAt: true,
        enrolledAt: true,
        completedAt: true,
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            thumbnail: true,
            level: true,
            duration: true,
            price: true,
            rating: true,
            totalReviews: true,
            language: true,
            skills: true,
            featured: true,
            createdAt: true,
            updatedAt: true,
            instructor: {
              select: {
                id: true,
                name: true,
                avatar: true,
                bio: true
              }
            },
            category: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            }
          }
        }
      }
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Not enrolled in this course'
      });
    }

    return res.status(200).json({
      success: true,
      enrollment
    });
  } catch (error) {
    next(error);
  }
};
