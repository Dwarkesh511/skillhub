import prisma from '../config/db.js';

export const getCategories = async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { courses: true }
        }
      }
    });

    const formattedCategories = categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      courseCount: cat._count.courses,
      createdAt: cat.createdAt,
      updatedAt: cat.updatedAt
    }));

    return res.status(200).json({
      success: true,
      categories: formattedCategories
    });
  } catch (error) {
    next(error);
  }
};
