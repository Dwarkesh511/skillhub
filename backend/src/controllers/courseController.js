import prisma from '../config/db.js';

export const getCourses = async (req, res, next) => {
  try {
    const pageNumber = Math.max(1, parseInt(req.query.page) || 1);
    const limitNumber = Math.min(50, Math.max(1, parseInt(req.query.limit) || 12));

    const { search, category, level, featured, sort } = req.query;

    const where = { AND: [] };

    // 1. Search Query Filter (Across title, description, instructor name, category name, skills)
    if (search && search.trim() !== '') {
      const q = search.trim();
      where.AND.push({
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { instructor: { name: { contains: q, mode: 'insensitive' } } },
          { category: { name: { contains: q, mode: 'insensitive' } } },
          { skills: { hasSome: [q] } }
        ]
      });
    }

    // 2. Category Filter (by slug)
    if (category && category.trim() !== '') {
      where.AND.push({
        category: {
          slug: category.trim().toLowerCase()
        }
      });
    }

    // 3. Level Filter
    if (level && ['Beginner', 'Intermediate', 'Advanced'].includes(level)) {
      where.AND.push({ level });
    }

    // 4. Featured Filter
    if (featured !== undefined && (featured === 'true' || featured === 'false')) {
      where.AND.push({ featured: featured === 'true' });
    }

    // 5. Sort Mapping
    let orderBy = { createdAt: 'desc' };
    if (sort === 'rating') {
      orderBy = { rating: 'desc' };
    } else if (sort === 'price-low') {
      orderBy = { price: 'asc' };
    } else if (sort === 'price-high') {
      orderBy = { price: 'desc' };
    } else if (sort === 'title') {
      orderBy = { title: 'asc' };
    } else if (sort === 'latest') {
      orderBy = { createdAt: 'desc' };
    }

    const filterCriteria = where.AND.length > 0 ? where : {};

    // Get total count of matching courses
    const totalCourses = await prisma.course.count({
      where: filterCriteria
    });

    const skip = (pageNumber - 1) * limitNumber;

    // Query matching courses with safe user field selection
    const courses = await prisma.course.findMany({
      where: filterCriteria,
      orderBy,
      skip,
      take: limitNumber,
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
    });

    const totalPages = Math.ceil(totalCourses / limitNumber) || 1;

    return res.status(200).json({
      success: true,
      courses,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        totalCourses,
        totalPages,
        hasNextPage: pageNumber < totalPages,
        hasPreviousPage: pageNumber > 1
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getCourseById = async (req, res, next) => {
  try {
    const courseId = parseInt(req.params.id);

    if (isNaN(courseId)) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
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
        },
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

    return res.status(200).json({
      success: true,
      course
    });
  } catch (error) {
    next(error);
  }
};
