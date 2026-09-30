import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verify() {
  const categories = await prisma.category.count();
  const users = await prisma.user.count();
  const courses = await prisma.course.count();
  const modules = await prisma.module.count();
  const lessons = await prisma.lesson.count();

  console.log('=== DATABASE VERIFICATION SUMMARY ===');
  console.log(`Categories: ${categories}`);
  console.log(`Users (Instructors + Demo Student): ${users}`);
  console.log(`Courses: ${courses}`);
  console.log(`Modules: ${modules}`);
  console.log(`Lessons: ${lessons}`);
}

verify()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
