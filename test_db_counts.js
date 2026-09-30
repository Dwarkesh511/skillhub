import prisma from './backend/src/config/db.js';

async function checkDatabase() {
  console.log('==================================================');
  console.log('DATABASE INTEGRITY CHECK');
  console.log('==================================================');

  const usersCount = await prisma.user.count();
  const categoriesCount = await prisma.category.count();
  const coursesCount = await prisma.course.count();
  const modulesCount = await prisma.module.count();
  const lessonsCount = await prisma.lesson.count();
  const enrollmentsCount = await prisma.enrollment.count();
  const bookmarksCount = await prisma.bookmark.count();
  const progressCount = await prisma.lessonProgress.count();
  const certsCount = await prisma.certificate.count();

  console.log(`Users: ${usersCount}`);
  console.log(`Categories: ${categoriesCount}`);
  console.log(`Courses: ${coursesCount}`);
  console.log(`Modules: ${modulesCount}`);
  console.log(`Lessons: ${lessonsCount}`);
  console.log(`Enrollments: ${enrollmentsCount}`);
  console.log(`Bookmarks: ${bookmarksCount}`);
  console.log(`LessonProgress: ${progressCount}`);
  console.log(`Certificates: ${certsCount}`);
  console.log('==================================================\n');

  await prisma.$disconnect();
}

checkDatabase().catch(err => {
  console.error('Database inspection failed:', err);
  process.exit(1);
});
