import http from 'http';
import prisma from './src/config/db.js';

const PORT = 5000;
const BASE_URL = `http://localhost:${PORT}`;

function request(method, path, body = null, cookie = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const headers = {};
    if (body) {
      headers['Content-Type'] = 'application/json';
    }
    if (cookie) {
      headers['Cookie'] = cookie;
    }

    const req = http.request(url, { method, headers }, (res) => {
      let responseBody = '';
      res.on('data', chunk => responseBody += chunk);
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(responseBody);
        } catch (e) {
          json = responseBody;
        }

        const setCookieHeader = res.headers['set-cookie'];
        let extractedCookie = null;
        if (setCookieHeader) {
          extractedCookie = Array.isArray(setCookieHeader) ? setCookieHeader[0] : setCookieHeader;
          if (extractedCookie.includes(';')) {
            extractedCookie = extractedCookie.split(';')[0];
          }
        }

        resolve({
          status: res.statusCode,
          headers: res.headers,
          cookie: extractedCookie,
          body: json
        });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting SkillHub Bookmarks & Enrollments API End-to-End Tests...\n');

  let testUserId = null;
  const testEmail = `step5_student_${Date.now()}@example.com`;
  const testPassword = 'Password123!';

  try {
    // 1. Check /api/health
    console.log('1️⃣ Testing GET /api/health...');
    const res1 = await request('GET', '/api/health');
    console.log(` Status: ${res1.status}, Message: "${res1.body.message}"`);
    if (res1.status !== 200) throw new Error('Health check failed');

    // 2. Register fresh test student
    console.log(`\n2️⃣ Registering test student (${testEmail})...`);
    const res2 = await request('POST', '/api/auth/register', {
      name: 'Step5 Test Student',
      email: testEmail,
      password: testPassword
    });
    console.log(` Status: ${res2.status}, Registered User ID: ${res2.body.user?.id}`);
    if (res2.status !== 201) throw new Error('Registration failed');
    testUserId = res2.body.user.id;

    // 3. Login as test student
    console.log('\n3️⃣ Logging in test student...');
    const res3 = await request('POST', '/api/auth/login', {
      email: testEmail,
      password: testPassword
    });
    console.log(` Status: ${res3.status}, Cookie: ${res3.cookie}`);
    if (res3.status !== 200 || !res3.cookie) throw new Error('Login failed');
    const studentCookie = res3.cookie;

    // 4. GET /api/bookmarks (empty initially)
    console.log('\n4️⃣ Testing GET /api/bookmarks (Initially empty)...');
    const res4 = await request('GET', '/api/bookmarks', null, studentCookie);
    console.log(` Status: ${res4.status}, Bookmarks Count: ${res4.body.bookmarks?.length}`);
    if (res4.status !== 200 || res4.body.bookmarks?.length !== 0) throw new Error('Initial bookmarks should be empty');

    // 5. POST /api/bookmarks for course ID 1
    console.log('\n5️⃣ Testing POST /api/bookmarks (Course ID 1)...');
    const res5 = await request('POST', '/api/bookmarks', { courseId: 1 }, studentCookie);
    console.log(` Status: ${res5.status}, Message: "${res5.body.message}"`);
    if (res5.status !== 201 || !res5.body.bookmark || res5.body.bookmark.course?.id !== 1) {
      throw new Error('Add bookmark for course ID 1 failed');
    }

    // 6. GET /api/bookmarks (Course 1 present)
    console.log('\n6️⃣ Testing GET /api/bookmarks (Verify Course 1 present)...');
    const res6 = await request('GET', '/api/bookmarks', null, studentCookie);
    console.log(` Status: ${res6.status}, Bookmarks Count: ${res6.body.bookmarks?.length}, First Course Title: "${res6.body.bookmarks[0]?.course?.title}"`);
    if (res6.status !== 200 || res6.body.bookmarks?.length !== 1 || res6.body.bookmarks[0].course.id !== 1) {
      throw new Error('Get bookmarks after adding course 1 failed');
    }

    // 7. POST /api/bookmarks for course ID 1 again (409 Conflict)
    console.log('\n7️⃣ Testing POST /api/bookmarks for course ID 1 again (Duplicate)...');
    const res7 = await request('POST', '/api/bookmarks', { courseId: 1 }, studentCookie);
    console.log(` Status: ${res7.status} (Expected 409), Message: "${res7.body.message}"`);
    if (res7.status !== 409) throw new Error('Duplicate bookmark should return 409 Conflict');

    // 8. POST /api/bookmarks for course ID 2
    console.log('\n8️⃣ Testing POST /api/bookmarks for course ID 2...');
    const res8 = await request('POST', '/api/bookmarks', { courseId: 2 }, studentCookie);
    console.log(` Status: ${res8.status}, Message: "${res8.body.message}"`);
    if (res8.status !== 201) throw new Error('Add bookmark for course ID 2 failed');

    // 9. DELETE /api/bookmarks/1
    console.log('\n9️⃣ Testing DELETE /api/bookmarks/1...');
    const res9 = await request('DELETE', '/api/bookmarks/1', null, studentCookie);
    console.log(` Status: ${res9.status}, Message: "${res9.body.message}"`);
    if (res9.status !== 200) throw new Error('Delete bookmark for course ID 1 failed');

    // 10. DELETE /api/bookmarks/1 again (404 Not Found)
    console.log('\n🔟 Testing DELETE /api/bookmarks/1 again...');
    const res10 = await request('DELETE', '/api/bookmarks/1', null, studentCookie);
    console.log(` Status: ${res10.status} (Expected 404), Message: "${res10.body.message}"`);
    if (res10.status !== 404) throw new Error('Delete nonexistent bookmark should return 404');

    // 11. POST /api/bookmarks with nonexistent course ID (999999)
    console.log('\n11️⃣ Testing POST /api/bookmarks for nonexistent course ID 999999...');
    const res11 = await request('POST', '/api/bookmarks', { courseId: 999999 }, studentCookie);
    console.log(` Status: ${res11.status} (Expected 404), Message: "${res11.body.message}"`);
    if (res11.status !== 404) throw new Error('Bookmark for nonexistent course should return 404');

    // 12. POST /api/bookmarks with invalid courseId parameter ("invalid")
    console.log('\n12️⃣ Testing POST /api/bookmarks with invalid courseId value ("invalid")...');
    const res12 = await request('POST', '/api/bookmarks', { courseId: "invalid" }, studentCookie);
    console.log(` Status: ${res12.status} (Expected 400), Message: "${res12.body.message}"`);
    if (res12.status !== 400) throw new Error('Invalid courseId should return 400 Bad Request');

    // 13. GET /api/enrollments (empty initially)
    console.log('\n13️⃣ Testing GET /api/enrollments (Initially empty)...');
    const res13 = await request('GET', '/api/enrollments', null, studentCookie);
    console.log(` Status: ${res13.status}, Enrollments Count: ${res13.body.enrollments?.length}`);
    if (res13.status !== 200 || res13.body.enrollments?.length !== 0) throw new Error('Initial enrollments should be empty');

    // 14. POST /api/enrollments for course ID 1
    console.log('\n14️⃣ Testing POST /api/enrollments for course ID 1...');
    const res14 = await request('POST', '/api/enrollments', { courseId: 1 }, studentCookie);
    console.log(` Status: ${res14.status}, Status: "${res14.body.enrollment?.status}", Progress: ${res14.body.enrollment?.progressPercentage}%`);
    if (res14.status !== 201 || res14.body.enrollment?.course?.id !== 1 || res14.body.enrollment?.status !== 'ACTIVE') {
      throw new Error('Enroll in course 1 failed');
    }

    // 15. GET /api/enrollments (Verify Course 1 present)
    console.log('\n15️⃣ Testing GET /api/enrollments (Verify Course 1 present)...');
    const res15 = await request('GET', '/api/enrollments', null, studentCookie);
    console.log(` Status: ${res15.status}, Enrollments Count: ${res15.body.enrollments?.length}, Course Title: "${res15.body.enrollments[0]?.course?.title}"`);
    if (res15.status !== 200 || res15.body.enrollments?.length !== 1) throw new Error('Get enrollments failed');

    // 16. POST /api/enrollments for course ID 1 again (409 Conflict)
    console.log('\n16️⃣ Testing POST /api/enrollments for course ID 1 again (Duplicate)...');
    const res16 = await request('POST', '/api/enrollments', { courseId: 1 }, studentCookie);
    console.log(` Status: ${res16.status} (Expected 409), Message: "${res16.body.message}"`);
    if (res16.status !== 409) throw new Error('Duplicate enrollment should return 409 Conflict');

    // 17. POST /api/enrollments for course ID 2
    console.log('\n17️⃣ Testing POST /api/enrollments for course ID 2...');
    const res17 = await request('POST', '/api/enrollments', { courseId: 2 }, studentCookie);
    console.log(` Status: ${res17.status}, Message: "${res17.body.message}"`);
    if (res17.status !== 201) throw new Error('Enroll in course 2 failed');

    // 18. GET /api/enrollments/1 (Specific course enrollment)
    console.log('\n18️⃣ Testing GET /api/enrollments/1 (Specific Course 1 Enrollment)...');
    const res18 = await request('GET', '/api/enrollments/1', null, studentCookie);
    console.log(` Status: ${res18.status}, Enrollment Course Title: "${res18.body.enrollment?.course?.title}"`);
    if (res18.status !== 200 || res18.body.enrollment?.course?.id !== 1) throw new Error('Get enrollment by courseId 1 failed');

    // 19. Unauthenticated GET /api/bookmarks
    console.log('\n19️⃣ Testing Unauthenticated GET /api/bookmarks...');
    const res19 = await request('GET', '/api/bookmarks');
    console.log(` Status: ${res19.status} (Expected 401)`);
    if (res19.status !== 401) throw new Error('Unauthenticated bookmarks GET should return 401');

    // 20. Unauthenticated POST /api/bookmarks
    console.log('\n20️⃣ Testing Unauthenticated POST /api/bookmarks...');
    const res20 = await request('POST', '/api/bookmarks', { courseId: 1 });
    console.log(` Status: ${res20.status} (Expected 401)`);
    if (res20.status !== 401) throw new Error('Unauthenticated bookmarks POST should return 401');

    // 21. Unauthenticated DELETE /api/bookmarks/1
    console.log('\n21️⃣ Testing Unauthenticated DELETE /api/bookmarks/1...');
    const res21 = await request('DELETE', '/api/bookmarks/1');
    console.log(` Status: ${res21.status} (Expected 401)`);
    if (res21.status !== 401) throw new Error('Unauthenticated bookmarks DELETE should return 401');

    // 22. Unauthenticated GET /api/enrollments
    console.log('\n22️⃣ Testing Unauthenticated GET /api/enrollments...');
    const res22 = await request('GET', '/api/enrollments');
    console.log(` Status: ${res22.status} (Expected 401)`);
    if (res22.status !== 401) throw new Error('Unauthenticated enrollments GET should return 401');

    // 23. Unauthenticated POST /api/enrollments
    console.log('\n23️⃣ Testing Unauthenticated POST /api/enrollments...');
    const res23 = await request('POST', '/api/enrollments', { courseId: 1 });
    console.log(` Status: ${res23.status} (Expected 401)`);
    if (res23.status !== 401) throw new Error('Unauthenticated enrollments POST should return 401');

    // 24. Database Data Integrity Check & Cleanup Test User Data
    console.log('\n24️⃣ Verifying Database Record Counts & Cleaning Test User Data...');
    const coursesCount = await prisma.course.count();
    const categoriesCount = await prisma.category.count();
    const modulesCount = await prisma.module.count();
    const lessonsCount = await prisma.lesson.count();

    console.log(` Courses: ${coursesCount} (Expected 30)`);
    console.log(` Categories: ${categoriesCount} (Expected 12)`);
    console.log(` Modules: ${modulesCount} (Expected 30)`);
    console.log(` Lessons: ${lessonsCount} (Expected 194)`);

    if (
      coursesCount !== 30 ||
      categoriesCount !== 12 ||
      modulesCount !== 30 ||
      lessonsCount !== 194
    ) {
      throw new Error('Database core content record count mismatch');
    }

    // Clean up test user records safely
    if (testUserId) {
      await prisma.bookmark.deleteMany({ where: { userId: testUserId } });
      await prisma.enrollment.deleteMany({ where: { userId: testUserId } });
      await prisma.user.delete({ where: { id: testUserId } });
      console.log(` Cleaned up temporary test student: ${testUserId}`);
    }

    console.log('\n🎉 ALL 24 BOOKMARKS & ENROLLMENTS API TESTS PASSED SUCCESSFULLY! 🎉\n');
  } catch (err) {
    console.error('❌ Test Failure:', err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
