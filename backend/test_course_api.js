process.env.NODE_ENV = 'test';

import http from 'http';
import prisma from './src/config/db.js';

const PORT = 5000;
const BASE_URL = `http://localhost:${PORT}`;

function request(method, path) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const req = http.request(url, { method }, (res) => {
      let responseBody = '';
      res.on('data', chunk => responseBody += chunk);
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(responseBody);
        } catch (e) {
          json = responseBody;
        }
        resolve({
          status: res.statusCode,
          body: json
        });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting SkillHub Course Catalog & Category API End-to-End Tests...\n');

  try {
    // 1. Health Check
    console.log('1️⃣ Testing GET /api/health...');
    const res1 = await request('GET', '/api/health');
    console.log(` Status: ${res1.status}, Message: "${res1.body.message}"`);
    if (res1.status !== 200) throw new Error('Health check failed');

    // 2. Categories API
    console.log('\n2️⃣ Testing GET /api/categories...');
    const res2 = await request('GET', '/api/categories');
    console.log(` Status: ${res2.status}, Total Categories: ${res2.body.categories?.length}`);
    if (res2.status !== 200 || !Array.isArray(res2.body.categories) || res2.body.categories.length !== 12) {
      throw new Error('Get categories failed or count is not 12');
    }
    console.log(` Sample Category:`, res2.body.categories[0]);

    // 3. All Courses Default Catalog
    console.log('\n3️⃣ Testing GET /api/courses (Default Pagination)...');
    const res3 = await request('GET', '/api/courses');
    console.log(` Status: ${res3.status}, Returned: ${res3.body.courses?.length}, Total: ${res3.body.pagination?.totalCourses}`);
    if (res3.status !== 200 || res3.body.pagination?.totalCourses !== 30 || res3.body.courses?.length !== 12) {
      throw new Error('Get default courses failed');
    }

    // 4. Pagination Page 1, Limit 5
    console.log('\n4️⃣ Testing GET /api/courses?page=1&limit=5...');
    const res4 = await request('GET', '/api/courses?page=1&limit=5');
    console.log(` Status: ${res4.status}, Returned: ${res4.body.courses?.length}, Page: ${res4.body.pagination?.page}`);
    if (res4.status !== 200 || res4.body.courses?.length !== 5 || res4.body.pagination?.totalPages !== 6) {
      throw new Error('Page 1 pagination failed');
    }

    // 5. Pagination Page 2, Limit 5
    console.log('\n5️⃣ Testing GET /api/courses?page=2&limit=5...');
    const res5 = await request('GET', '/api/courses?page=2&limit=5');
    console.log(` Status: ${res5.status}, First Course ID on Page 2: ${res5.body.courses[0]?.id}`);
    if (res5.status !== 200 || res5.body.courses?.length !== 5 || res5.body.pagination?.hasPreviousPage !== true) {
      throw new Error('Page 2 pagination failed');
    }

    // 6. Search Term Filter ("python")
    console.log('\n6️⃣ Testing GET /api/courses?search=python...');
    const res6 = await request('GET', '/api/courses?search=python');
    console.log(` Status: ${res6.status}, Matching Courses: ${res6.body.courses?.length}`);
    if (res6.status !== 200 || res6.body.courses?.length === 0) {
      throw new Error('Search filter for "python" failed');
    }

    // 7. Category Filter ("development")
    console.log('\n7️⃣ Testing GET /api/courses?category=development...');
    const res7 = await request('GET', '/api/courses?category=development');
    console.log(` Status: ${res7.status}, Development Courses Count: ${res7.body.courses?.length}`);
    if (res7.status !== 200 || res7.body.courses?.length === 0) {
      throw new Error('Category filter failed');
    }

    // 8. Level Filter ("Beginner")
    console.log('\n8️⃣ Testing GET /api/courses?level=Beginner...');
    const res8 = await request('GET', '/api/courses?level=Beginner');
    console.log(` Status: ${res8.status}, Beginner Courses Count: ${res8.body.pagination?.totalCourses}`);
    if (res8.status !== 200 || res8.body.courses?.some(c => c.level !== 'Beginner')) {
      throw new Error('Level filter failed');
    }

    // 9. Sort by Latest
    console.log('\n9️⃣ Testing GET /api/courses?sort=latest...');
    const res9 = await request('GET', '/api/courses?sort=latest');
    console.log(` Status: ${res9.status}, First Course Title: "${res9.body.courses[0]?.title}"`);
    if (res9.status !== 200) throw new Error('Sort latest failed');

    // 10. Sort by Rating
    console.log('\n🔟 Testing GET /api/courses?sort=rating...');
    const res10 = await request('GET', '/api/courses?sort=rating');
    console.log(` Status: ${res10.status}, Top Rating: ${res10.body.courses[0]?.rating}`);
    if (res10.status !== 200) throw new Error('Sort rating failed');

    // 11. Sort by Price Low to High
    console.log('\n11️⃣ Testing GET /api/courses?sort=price-low...');
    const res11 = await request('GET', '/api/courses?sort=price-low');
    console.log(` Status: ${res11.status}, Lowest Price: ₹${res11.body.courses[0]?.price}`);
    if (res11.status !== 200 || res11.body.courses[0]?.price > res11.body.courses[1]?.price) {
      throw new Error('Sort price-low failed');
    }

    // 12. Sort by Price High to Low
    console.log('\n12️⃣ Testing GET /api/courses?sort=price-high...');
    const res12 = await request('GET', '/api/courses?sort=price-high');
    console.log(` Status: ${res12.status}, Highest Price: ₹${res12.body.courses[0]?.price}`);
    if (res12.status !== 200 || res12.body.courses[0]?.price < res12.body.courses[1]?.price) {
      throw new Error('Sort price-high failed');
    }

    // 13. Featured Filter (featured=true)
    console.log('\n13️⃣ Testing GET /api/courses?featured=true...');
    const res13 = await request('GET', '/api/courses?featured=true');
    console.log(` Status: ${res13.status}, Featured Count: ${res13.body.pagination?.totalCourses}`);
    if (res13.status !== 200 || res13.body.courses?.some(c => !c.featured)) {
      throw new Error('Featured filter failed');
    }

    // 14. Combined Filters (search=react, sort=rating, page=1, limit=6)
    console.log('\n14️⃣ Testing GET /api/courses?search=react&sort=rating&page=1&limit=6...');
    const res14 = await request('GET', '/api/courses?search=react&sort=rating&page=1&limit=6');
    console.log(` Status: ${res14.status}, Filtered Count: ${res14.body.courses?.length}`);
    if (res14.status !== 200) throw new Error('Combined filters failed');

    // 15. GET Course Details (Valid Course ID = 1)
    console.log('\n15️⃣ Testing GET /api/courses/1 (HTML & CSS Fundamentals)...');
    const res15 = await request('GET', '/api/courses/1');
    console.log(` Status: ${res15.status}, Course: "${res15.body.course?.title}", Modules: ${res15.body.course?.modules?.length}, Lessons: ${res15.body.course?.modules[0]?.lessons?.length}`);
    if (
      res15.status !== 200 || 
      !res15.body.course || 
      !res15.body.course.modules || 
      !res15.body.course.modules[0].lessons || 
      res15.body.course.instructor?.passwordHash
    ) {
      throw new Error('Get course details failed or leaked passwordHash');
    }

    // 16. GET Course Details Nonexistent ID (Should return 404)
    console.log('\n16️⃣ Testing GET /api/courses/999999 (Nonexistent ID)...');
    const res16 = await request('GET', '/api/courses/999999');
    console.log(` Status: ${res16.status} (Expected 404), Body:`, res16.body);
    if (res16.status !== 404) throw new Error('Nonexistent course ID should return 404');

    // 17. Invalid Page Query (page=-1, Should return 400 Bad Request)
    console.log('\n17️⃣ Testing GET /api/courses?page=-1...');
    const res17 = await request('GET', '/api/courses?page=-1');
    console.log(` Status: ${res17.status} (Expected 400), Message: "${res17.body.message}"`);
    if (res17.status !== 400) throw new Error('Invalid page should return 400');

    // 18. Invalid Limit Query (limit=1000, Should return 400 Bad Request)
    console.log('\n18️⃣ Testing GET /api/courses?limit=1000...');
    const res18 = await request('GET', '/api/courses?limit=1000');
    console.log(` Status: ${res18.status} (Expected 400), Message: "${res18.body.message}"`);
    if (res18.status !== 400) throw new Error('Invalid limit should return 400');

    // 19. Invalid Sort Query (sort=invalid_sort, Should return 400 Bad Request)
    console.log('\n19️⃣ Testing GET /api/courses?sort=invalid_sort...');
    const res19 = await request('GET', '/api/courses?sort=invalid_sort');
    console.log(` Status: ${res19.status} (Expected 400), Message: "${res19.body.message}"`);
    if (res19.status !== 400) throw new Error('Invalid sort should return 400');

    // 20. Invalid Featured Query (featured=maybe, Should return 400 Bad Request)
    console.log('\n20️⃣ Testing GET /api/courses?featured=maybe...');
    const res20 = await request('GET', '/api/courses?featured=maybe');
    console.log(` Status: ${res20.status} (Expected 400), Message: "${res20.body.message}"`);
    if (res20.status !== 400) throw new Error('Invalid featured should return 400');

    // 21. Verify Database Data Integrity
    console.log('\n21️⃣ Verifying Database Integrity (Record Counts)...');
    const categoriesCount = await prisma.category.count();
    const usersCount = await prisma.user.count();
    const coursesCount = await prisma.course.count();
    const modulesCount = await prisma.module.count();
    const lessonsCount = await prisma.lesson.count();

    console.log(` Categories: ${categoriesCount} (Expected 12)`);
    console.log(` Users: ${usersCount} (Expected >= 31)`);
    console.log(` Courses: ${coursesCount} (Expected 30)`);
    console.log(` Modules: ${modulesCount} (Expected 30)`);
    console.log(` Lessons: ${lessonsCount} (Expected 194)`);

    if (
      categoriesCount !== 12 || 
      usersCount < 31 || 
      coursesCount !== 30 || 
      modulesCount !== 30 || 
      lessonsCount !== 194
    ) {
      throw new Error('Database record count mismatch');
    }

    console.log('\n🎉 ALL 20 COURSE CATALOG & CATEGORY API TESTS PASSED SUCCESSFULLY! 🎉\n');
  } catch (err) {
    console.error('❌ Test Failure:', err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
