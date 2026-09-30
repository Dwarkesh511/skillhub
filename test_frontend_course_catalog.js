import { getCourses, getCourseById, getCategories } from './src/services/courseApi.js';

async function runCourseIntegrationTests() {
  console.log('==================================================');
  console.log('🧪 SKILLHUB STEP 8C — FRONTEND COURSE & CATALOG API TESTS');
  console.log('==================================================\n');

  try {
    // 1. Fetch Categories
    console.log('1️⃣ Testing getCategories()...');
    const categoriesRes = await getCategories();
    console.log(`   Status: success=${categoriesRes.success}, Categories Count: ${categoriesRes.categories?.length}`);
    if (!categoriesRes.success || !Array.isArray(categoriesRes.categories) || categoriesRes.categories.length === 0) {
      throw new Error('getCategories failed');
    }
    const webDevCat = categoriesRes.categories.find(c => c.slug === 'web-development' || c.name === 'Web Development');
    console.log(`   Sample Category: "${webDevCat?.name}" (slug: ${webDevCat?.slug}, count: ${webDevCat?.courseCount})`);

    // 2. Fetch Course Catalog (Default Page 1)
    console.log('\n2️⃣ Testing getCourses() (Catalog Page 1)...');
    const catalogRes = await getCourses({ page: 1, limit: 12 });
    console.log(`   Status: success=${catalogRes.success}, Total Courses: ${catalogRes.pagination?.total}, Returned: ${catalogRes.courses?.length}`);
    if (!catalogRes.success || !Array.isArray(catalogRes.courses) || catalogRes.courses.length === 0) {
      throw new Error('getCourses catalog fetch failed');
    }
    const sampleCourse = catalogRes.courses[0];
    console.log(`   Sample Course: ID ${sampleCourse.id} - "${sampleCourse.title}" by ${sampleCourse.instructor?.name}`);

    // 3. Search Courses ("React")
    console.log('\n3️⃣ Testing getCourses({ search: "React" })...');
    const searchRes = await getCourses({ search: 'React' });
    console.log(`   Status: success=${searchRes.success}, Matches: ${searchRes.courses?.length}`);
    if (!searchRes.success || !Array.isArray(searchRes.courses)) throw new Error('Search query failed');

    // 4. Category Filter ("web-development")
    console.log('\n4️⃣ Testing getCourses({ category: "web-development" })...');
    const catRes = await getCourses({ category: 'web-development' });
    console.log(`   Status: success=${catRes.success}, Web Dev Courses: ${catRes.courses?.length}`);
    if (!catRes.success || !Array.isArray(catRes.courses)) throw new Error('Category filter failed');

    // 5. Level Filter ("Beginner")
    console.log('\n5️⃣ Testing getCourses({ level: "Beginner" })...');
    const levelRes = await getCourses({ level: 'Beginner' });
    console.log(`   Status: success=${levelRes.success}, Beginner Courses: ${levelRes.courses?.length}`);
    if (!levelRes.success || !Array.isArray(levelRes.courses)) throw new Error('Level filter failed');

    // 6. Sort ("price-low")
    console.log('\n6️⃣ Testing getCourses({ sort: "price-low" })...');
    const sortRes = await getCourses({ sort: 'price-low' });
    console.log(`   Status: success=${sortRes.success}, Lowest Price Course: ₹${sortRes.courses[0]?.price}`);
    if (!sortRes.success || sortRes.courses[0]?.price > sortRes.courses[sortRes.courses.length - 1]?.price) {
      throw new Error('Sort price-low failed');
    }

    // 7. Get Course Details by ID (ID: 1)
    console.log('\n7️⃣ Testing getCourseById(1)...');
    const detailRes = await getCourseById(1);
    console.log(`   Status: success=${detailRes.success}, Title: "${detailRes.course?.title}", Modules: ${detailRes.course?.modules?.length}`);
    if (!detailRes.success || !detailRes.course || !Array.isArray(detailRes.course.modules)) {
      throw new Error('getCourseById failed');
    }
    const sampleLesson = detailRes.course.modules[0]?.lessons[0];
    console.log(`   Sample Lesson: "${sampleLesson?.title}" (${sampleLesson?.duration})`);

    // 8. Invalid Course Details ID (999999) -> Expected 404
    console.log('\n8️⃣ Testing getCourseById(999999) (Nonexistent ID)...');
    try {
      await getCourseById(999999);
      throw new Error('Expected 404 for nonexistent course ID, but request succeeded.');
    } catch (err) {
      if (err.status !== 404) throw err;
      console.log('   ✅ Received expected 404 Not Found response.');
    }

    console.log('\n==================================================');
    console.log('🎉 ALL STEP 8C FRONTEND COURSE API TESTS PASSED SUCCESSFULLY!');
    console.log('==================================================\n');

  } catch (err) {
    console.error('\n❌ FRONTEND COURSE API TEST FAILED WITH ERROR:');
    console.error(err);
    process.exit(1);
  }
}

runCourseIntegrationTests();
