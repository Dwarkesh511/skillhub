import crypto from 'crypto';
import prisma from '../config/db.js';

export const toggleProgress = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const lessonId = parseInt(req.body.lessonId, 10);
    const completed = req.body.completed !== undefined ? Boolean(req.body.completed) : true;

    // 1. Check if lesson exists and retrieve its associated courseId
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        id: true,
        title: true,
        moduleId: true,
        module: {
          select: {
            courseId: true
          }
        }
      }
    });

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    const courseId = lesson.module.courseId;

    // 2. Check if user is enrolled in the course
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId
        }
      }
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: 'You must be enrolled in this course to track progress'
      });
    }

    // 3. Atomically update lesson progress and recalculate course enrollment progress percentage
    const result = await prisma.$transaction(async (tx) => {
      // Upsert LessonProgress
      const progressRecord = await tx.lessonProgress.upsert({
        where: {
          userId_lessonId: {
            userId,
            lessonId
          }
        },
        create: {
          userId,
          lessonId,
          completed,
          completedAt: new Date(),
          lastAccessedAt: new Date()
        },
        update: {
          completed,
          completedAt: new Date(),
          lastAccessedAt: new Date()
        }
      });

      // Total lessons count for course
      const totalLessons = await tx.lesson.count({
        where: {
          module: {
            courseId
          }
        }
      });

      // Completed lessons count for user in course
      const completedLessons = await tx.lessonProgress.count({
        where: {
          userId,
          completed: true,
          lesson: {
            module: {
              courseId
            }
          }
        }
      });

      // Calculate progress percentage
      const progressPercentage = totalLessons > 0
        ? Math.round((completedLessons / totalLessons) * 100 * 100) / 100
        : 0.0;

      // Determine status and completion timestamp
      const status = (totalLessons > 0 && completedLessons === totalLessons) ? 'COMPLETED' : 'ACTIVE';
      const completedAt = status === 'COMPLETED' ? new Date() : null;

      // Update enrollment record
      const updatedEnrollment = await tx.enrollment.update({
        where: {
          userId_courseId: {
            userId,
            courseId
          }
        },
        data: {
          progressPercentage,
          status,
          lastAccessedAt: new Date(),
          completedAt
        }
      });

      // Automatically create certificate if course completed (100%) and no certificate exists
      if (status === 'COMPLETED' && progressPercentage >= 100) {
        const existingCert = await tx.certificate.findUnique({
          where: {
            userId_courseId: {
              userId,
              courseId
            }
          }
        });

        if (!existingCert) {
          const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
          const certificateNumber = `SH-2026-${randomHex}`;
          await tx.certificate.create({
            data: {
              certificateNumber,
              userId,
              courseId,
              issuedAt: new Date(),
              pdfUrl: null
            }
          });
        }
      }

      return {
        progressRecord,
        updatedEnrollment,
        totalLessons,
        completedLessons
      };
    });

    return res.status(200).json({
      success: true,
      message: completed ? 'Lesson marked as completed' : 'Lesson marked as incomplete',
      progress: {
        lessonId: result.progressRecord.lessonId,
        completed: result.progressRecord.completed,
        completedAt: result.progressRecord.completedAt,
        lastAccessedAt: result.progressRecord.lastAccessedAt
      },
      courseProgress: {
        courseId,
        totalLessons: result.totalLessons,
        completedLessons: result.completedLessons,
        progressPercentage: result.updatedEnrollment.progressPercentage,
        status: result.updatedEnrollment.status,
        lastAccessedAt: result.updatedEnrollment.lastAccessedAt,
        completedAt: result.updatedEnrollment.completedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getCourseProgress = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const courseId = parseInt(req.params.courseId, 10);

    // 1. Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        title: true,
        slug: true,
        modules: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            title: true,
            description: true,
            order: true,
            lessons: {
              orderBy: { order: 'asc' },
              select: {
                id: true,
                title: true,
                description: true,
                videoUrl: true,
                duration: true,
                order: true
              }
            }
          }
        }
      }
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // 2. Check if user is enrolled
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId
        }
      }
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: 'You must be enrolled in this course to view progress'
      });
    }

    // 3. Fetch progress records for user in this course
    const progressRecords = await prisma.lessonProgress.findMany({
      where: {
        userId,
        lesson: {
          module: {
            courseId
          }
        }
      }
    });

    const progressMap = new Map();
    progressRecords.forEach(rec => {
      progressMap.set(rec.lessonId, rec);
    });

    let totalLessons = 0;
    let completedLessons = 0;

    const modulesWithProgress = course.modules.map(moduleItem => {
      const lessonsWithProgress = moduleItem.lessons.map(lessonItem => {
        totalLessons++;
        const prog = progressMap.get(lessonItem.id);
        const isCompleted = Boolean(prog && prog.completed);
        if (isCompleted) {
          completedLessons++;
        }
        return {
          ...lessonItem,
          completed: isCompleted,
          completedAt: prog && prog.completed ? prog.completedAt : null,
          lastAccessedAt: prog ? prog.lastAccessedAt : null
        };
      });

      return {
        ...moduleItem,
        lessons: lessonsWithProgress
      };
    });

    return res.status(200).json({
      success: true,
      progress: {
        courseId: course.id,
        courseTitle: course.title,
        courseSlug: course.slug,
        status: enrollment.status,
        progressPercentage: enrollment.progressPercentage,
        totalLessons,
        completedLessons,
        enrolledAt: enrollment.enrolledAt,
        lastAccessedAt: enrollment.lastAccessedAt,
        completedAt: enrollment.completedAt,
        modules: modulesWithProgress
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getUserProgress = async (req, res, next) => {
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
            thumbnail: true,
            level: true,
            duration: true,
            instructor: {
              select: {
                id: true,
                name: true
              }
            },
            modules: {
              select: {
                _count: {
                  select: { lessons: true }
                }
              }
            }
          }
        }
      }
    });

    const userProgress = await Promise.all(
      enrollments.map(async (enrollment) => {
        const totalLessons = enrollment.course.modules.reduce(
          (sum, mod) => sum + mod._count.lessons,
          0
        );

        const completedLessons = await prisma.lessonProgress.count({
          where: {
            userId,
            completed: true,
            lesson: {
              module: {
                courseId: enrollment.course.id
              }
            }
          }
        });

        return {
          enrollmentId: enrollment.id,
          courseId: enrollment.course.id,
          courseTitle: enrollment.course.title,
          courseSlug: enrollment.course.slug,
          thumbnail: enrollment.course.thumbnail,
          instructorName: enrollment.course.instructor.name,
          status: enrollment.status,
          progressPercentage: enrollment.progressPercentage,
          totalLessons,
          completedLessons,
          enrolledAt: enrollment.enrolledAt,
          lastAccessedAt: enrollment.lastAccessedAt,
          completedAt: enrollment.completedAt
        };
      })
    );

    return res.status(200).json({
      success: true,
      count: userProgress.length,
      progress: userProgress
    });
  } catch (error) {
    next(error);
  }
};
