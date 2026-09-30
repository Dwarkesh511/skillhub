import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { coursesData, courseCategories } from '../../src/data/courses.js';

const prisma = new PrismaClient();

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')        // Replace spaces with -
    .replace(/[^\w\-]+/g, '')   // Remove all non-word chars
    .replace(/\-\-+/g, '-');      // Replace multiple - with single -
}

async function main() {
  console.log('🌱 Starting SkillHub Database Seeding...');

  // 1. Seed Categories
  const categoryMap = new Map();
  const validCategories = courseCategories.filter(cat => cat !== 'All');

  for (const catName of validCategories) {
    const slug = slugify(catName);
    const category = await prisma.category.upsert({
      where: { name: catName },
      update: { slug },
      create: {
        name: catName,
        slug
      }
    });
    categoryMap.set(catName, category.id);
  }
  console.log(`✅ Seeded ${categoryMap.size} Categories.`);

  // Default demo password hash ("password123")
  const defaultPasswordHash = bcrypt.hashSync('password123', 10);

  // 2. Seed Instructors & Demo Student
  const instructorMap = new Map();
  const uniqueInstructors = [...new Set(coursesData.map(c => c.instructor))];

  for (const instructorName of uniqueInstructors) {
    const emailPrefix = slugify(instructorName);
    const email = `${emailPrefix}@skillhub.com`;

    const instructorUser = await prisma.user.upsert({
      where: { email },
      update: { name: instructorName, role: 'INSTRUCTOR', passwordHash: defaultPasswordHash },
      create: {
        name: instructorName,
        email,
        passwordHash: defaultPasswordHash,
        role: 'INSTRUCTOR',
        avatar: instructorName.charAt(0).toUpperCase(),
        bio: `Senior educator and subject matter expert in tech and academic subjects.`
      }
    });
    instructorMap.set(instructorName, instructorUser.id);
  }
  console.log(`✅ Seeded ${instructorMap.size} Instructor Users.`);

  // Create/Update Default Demo Student Account
  const demoStudent = await prisma.user.upsert({
    where: { email: 'alex@skillhub.com' },
    update: {
      name: 'Alex Johnson',
      role: 'STUDENT',
      passwordHash: defaultPasswordHash
    },
    create: {
      name: 'Alex Johnson',
      email: 'alex@skillhub.com',
      passwordHash: defaultPasswordHash,
      role: 'STUDENT',
      avatar: 'A',
      phone: '+91 9876543210',
      bio: 'Passionate computer science student & tech enthusiast.'
    }
  });
  console.log(`✅ Seeded Demo Student: ${demoStudent.email} (password: password123)`);

  // 3. Seed Courses, Modules & Lessons
  let coursesInserted = 0;

  for (const c of coursesData) {
    const categoryId = categoryMap.get(c.category) || categoryMap.get('Development');
    const instructorId = instructorMap.get(c.instructor);
    const slug = `${slugify(c.title)}-${c.id}`;

    // Normalize level to enum Level
    let levelEnum = 'Beginner';
    if (c.level === 'Intermediate') levelEnum = 'Intermediate';
    if (c.level === 'Advanced') levelEnum = 'Advanced';

    const course = await prisma.course.upsert({
      where: { slug },
      update: {
        title: c.title,
        description: c.description,
        thumbnail: c.image,
        instructorId,
        categoryId,
        level: levelEnum,
        duration: c.duration,
        price: c.price,
        language: c.language || 'English',
        skills: c.skills || [],
        featured: c.featured || false
      },
      create: {
        title: c.title,
        slug,
        description: c.description,
        thumbnail: c.image,
        instructorId,
        categoryId,
        level: levelEnum,
        duration: c.duration,
        price: c.price,
        rating: 4.8,
        totalReviews: 45,
        language: c.language || 'English',
        skills: c.skills || [],
        featured: c.featured || false
      }
    });

    coursesInserted++;

    // Seed Course Curriculum as Module & Lessons
    if (c.curriculum && Array.isArray(c.curriculum)) {
      const existingModules = await prisma.module.findMany({
        where: { courseId: course.id }
      });

      let moduleRecord;
      if (existingModules.length > 0) {
        moduleRecord = existingModules[0];
      } else {
        moduleRecord = await prisma.module.create({
          data: {
            courseId: course.id,
            title: 'Course Curriculum & Lessons',
            order: 1
          }
        });
      }

      let lessonOrder = 1;
      for (const lessonTitle of c.curriculum) {
        const existingLesson = await prisma.lesson.findFirst({
          where: {
            moduleId: moduleRecord.id,
            order: lessonOrder
          }
        });

        if (!existingLesson) {
          await prisma.lesson.create({
            data: {
              moduleId: moduleRecord.id,
              title: lessonTitle,
              duration: '15 Mins',
              order: lessonOrder
            }
          });
        }
        lessonOrder++;
      }
    }
  }

  console.log(`✅ Successfully Seeded ${coursesInserted} Courses with Modules and Lessons.`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
