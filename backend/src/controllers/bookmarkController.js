import prisma from '../config/db.js';

export const getBookmarks = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const bookmarks = await prisma.bookmark.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        createdAt: true,
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

    const formattedBookmarks = bookmarks.map(b => ({
      id: b.id,
      bookmarkedAt: b.createdAt,
      course: b.course
    }));

    return res.status(200).json({
      success: true,
      bookmarks: formattedBookmarks
    });
  } catch (error) {
    next(error);
  }
};

export const addBookmark = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const courseId = parseInt(req.body.courseId);

    // 1. Verify course exists in DB
    const courseExists = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!courseExists) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // 2. Check if already bookmarked by current user
    const existingBookmark = await prisma.bookmark.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId
        }
      }
    });

    if (existingBookmark) {
      return res.status(409).json({
        success: false,
        message: 'Course is already bookmarked'
      });
    }

    // 3. Create bookmark
    const bookmark = await prisma.bookmark.create({
      data: {
        userId,
        courseId
      },
      select: {
        id: true,
        createdAt: true,
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
      message: 'Course bookmarked successfully',
      bookmark: {
        id: bookmark.id,
        bookmarkedAt: bookmark.createdAt,
        course: bookmark.course
      }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteBookmark = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const courseId = parseInt(req.params.courseId);

    // 1. Find bookmark belonging to current user
    const bookmark = await prisma.bookmark.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId
        }
      }
    });

    if (!bookmark) {
      return res.status(404).json({
        success: false,
        message: 'Bookmark not found'
      });
    }

    // 2. Delete bookmark
    await prisma.bookmark.delete({
      where: { id: bookmark.id }
    });

    return res.status(200).json({
      success: true,
      message: 'Bookmark removed successfully'
    });
  } catch (error) {
    next(error);
  }
};
