import prisma from '../config/db.js';

export const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    // 1. User profile data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        phone: true,
        bio: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // 2. Dashboard Statistics
    const enrolledCourses = await prisma.enrollment.count({
      where: { userId }
    });

    const completedCourses = await prisma.enrollment.count({
      where: { userId, status: 'COMPLETED' }
    });

    const inProgressCourses = await prisma.enrollment.count({
      where: { userId, status: 'ACTIVE' }
    });

    const bookmarkedCourses = await prisma.bookmark.count({
      where: { userId }
    });

    const completedLessonsCount = await prisma.lessonProgress.count({
      where: { userId, completed: true }
    });

    const certificatesCount = await prisma.certificate.count({
      where: { userId }
    });

    // Calculate total hours learned from completed lessons
    const completedLessonRecords = await prisma.lessonProgress.findMany({
      where: { userId, completed: true },
      select: {
        lesson: {
          select: { duration: true }
        }
      }
    });

    let totalMinutes = 0;
    completedLessonRecords.forEach(rec => {
      const durStr = rec.lesson?.duration || '';
      const match = durStr.match(/(\d+(?:\.\d+)?)\s*(mins?|minutes?|hours?|hrs?|h|m)?/i);
      if (match) {
        const val = parseFloat(match[1]);
        const unit = (match[2] || '').toLowerCase();
        if (['hour', 'hours', 'hr', 'hrs', 'h'].includes(unit)) {
          totalMinutes += val * 60;
        } else {
          totalMinutes += val;
        }
      } else {
        totalMinutes += 15; // default fallback if unparseable
      }
    });

    const hoursLearned = Math.round((totalMinutes / 60) * 10) / 10;

    // 3. Continue Learning (Active Enrollments, max 5)
    const activeEnrollments = await prisma.enrollment.findMany({
      where: { userId, status: 'ACTIVE' },
      orderBy: [
        { lastAccessedAt: 'desc' },
        { enrolledAt: 'desc' }
      ],
      take: 5,
      select: {
        id: true,
        progressPercentage: true,
        lastAccessedAt: true,
        enrolledAt: true,
        course: {
          select: {
            id: true,
            title: true,
            thumbnail: true,
            instructor: { select: { id: true, name: true } },
            category: { select: { id: true, name: true } }
          }
        }
      }
    });

    const continueLearning = await Promise.all(
      activeEnrollments.map(async (enr) => {
        const latestProgress = await prisma.lessonProgress.findFirst({
          where: {
            userId,
            lesson: {
              module: { courseId: enr.course.id }
            }
          },
          orderBy: { lastAccessedAt: 'desc' },
          select: {
            lesson: { select: { id: true, title: true } }
          }
        });

        let lastLesson = null;
        if (latestProgress && latestProgress.lesson) {
          lastLesson = {
            id: latestProgress.lesson.id,
            title: latestProgress.lesson.title
          };
        } else {
          const firstLesson = await prisma.lesson.findFirst({
            where: { module: { courseId: enr.course.id } },
            orderBy: [
              { module: { order: 'asc' } },
              { order: 'asc' }
            ],
            select: { id: true, title: true }
          });
          if (firstLesson) {
            lastLesson = { id: firstLesson.id, title: firstLesson.title };
          }
        }

        return {
          courseId: enr.course.id,
          courseTitle: enr.course.title,
          thumbnail: enr.course.thumbnail,
          progressPercentage: enr.progressPercentage,
          lastAccessedAt: enr.lastAccessedAt || enr.enrolledAt,
          instructor: enr.course.instructor,
          category: enr.course.category,
          lastLesson
        };
      })
    );

    // 4. Recent Enrollments (max 5)
    const recentEnrs = await prisma.enrollment.findMany({
      where: { userId },
      orderBy: { enrolledAt: 'desc' },
      take: 5,
      select: {
        id: true,
        courseId: true,
        status: true,
        progressPercentage: true,
        enrolledAt: true,
        course: {
          select: {
            title: true,
            thumbnail: true
          }
        }
      }
    });

    const recentEnrollments = recentEnrs.map(e => ({
      enrollmentId: e.id,
      courseId: e.courseId,
      courseTitle: e.course.title,
      thumbnail: e.course.thumbnail,
      progressPercentage: e.progressPercentage,
      status: e.status,
      enrolledAt: e.enrolledAt
    }));

    // 5. Recent Certificates (max 5)
    const recentCerts = await prisma.certificate.findMany({
      where: { userId },
      orderBy: { issuedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        certificateNumber: true,
        courseId: true,
        issuedAt: true,
        course: {
          select: { title: true }
        }
      }
    });

    const recentCertificates = recentCerts.map(c => ({
      id: c.id,
      certificateNumber: c.certificateNumber,
      courseId: c.courseId,
      courseTitle: c.course.title,
      issuedAt: c.issuedAt
    }));

    return res.status(200).json({
      success: true,
      dashboard: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          phone: user.phone,
          bio: user.bio
        },
        statistics: {
          enrolledCourses,
          completedCourses,
          inProgressCourses,
          bookmarkedCourses,
          completedLessons: completedLessonsCount,
          hoursLearned,
          certificates: certificatesCount
        },
        continueLearning,
        recentEnrollments,
        recentCertificates
      }
    });
  } catch (error) {
    next(error);
  }
};
