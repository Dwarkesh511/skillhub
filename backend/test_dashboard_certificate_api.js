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
  console.log('==================================================');
  console.log('🧪 SKILLHUB STEP 7 — DASHBOARD & CERTIFICATE API TESTS');
  console.log('==================================================\n');

  let testUser1Id = null;
  let testUser2Id = null;

  const emailUser1 = `step7_student1_${Date.now()}@example.com`;
  const emailUser2 = `step7_student2_${Date.now()}@example.com`;
  const testPassword = 'Password123!';

  try {
    // TEST 1: Health Check
    console.log('1️⃣ Testing GET /api/health...');
    const res1 = await request('GET', '/api/health');
    console.log(`   Status: ${res1.status}, Message: "${res1.body.message}"`);
    if (res1.status !== 200) throw new Error('Health check failed');

    // TEST 2: Register Student 1
    console.log(`\n2️⃣ Registering Student 1 (${emailUser1})...`);
    const res2 = await request('POST', '/api/auth/register', {
      name: 'Alex Student 1',
      email: emailUser1,
      password: testPassword
    });
    console.log(`   Status: ${res2.status}, User ID: ${res2.body.user?.id}`);
    if (res2.status !== 201) throw new Error('Student 1 registration failed');
    testUser1Id = res2.body.user.id;

    // TEST 3: Login Student 1
    console.log('\n3️⃣ Logging in Student 1...');
    const res3 = await request('POST', '/api/auth/login', {
      email: emailUser1,
      password: testPassword
    });
    console.log(`   Status: ${res3.status}, Cookie: ${res3.cookie}`);
    if (res3.status !== 200 || !res3.cookie) throw new Error('Student 1 login failed');
    const cookie1 = res3.cookie;

    // TEST 4: GET /api/dashboard for new Student 1
    console.log('\n4️⃣ Testing GET /api/dashboard (Initial state for Student 1)...');
    const res4 = await request('GET', '/api/dashboard', null, cookie1);
    console.log(`   Status: ${res4.status}, Enrolled: ${res4.body.dashboard?.statistics?.enrolledCourses}, Completed: ${res4.body.dashboard?.statistics?.completedCourses}, Bookmarks: ${res4.body.dashboard?.statistics?.bookmarkedCourses}, Certs: ${res4.body.dashboard?.statistics?.certificates}`);
    if (
      res4.status !== 200 ||
      res4.body.dashboard?.statistics?.enrolledCourses !== 0 ||
      res4.body.dashboard?.statistics?.completedCourses !== 0 ||
      res4.body.dashboard?.statistics?.bookmarkedCourses !== 0 ||
      res4.body.dashboard?.statistics?.certificates !== 0
    ) {
      throw new Error('Initial dashboard statistics check failed');
    }

    // TEST 5: GET /api/certificates for new Student 1
    console.log('\n5️⃣ Testing GET /api/certificates (Initially empty)...');
    const res5 = await request('GET', '/api/certificates', null, cookie1);
    console.log(`   Status: ${res5.status}, Count: ${res5.body.count}`);
    if (res5.status !== 200 || res5.body.count !== 0) throw new Error('Initial certificates list should be empty');

    // TEST 6: Try generating certificate without enrollment
    console.log('\n6️⃣ Testing POST /api/certificates/generate/1 WITHOUT enrollment...');
    const res6 = await request('POST', '/api/certificates/generate/1', null, cookie1);
    console.log(`   Status: ${res6.status}, Message: "${res6.body.message}"`);
    if (res6.status !== 400 && res6.status !== 403) throw new Error('Generating certificate without enrollment should fail');

    // TEST 7: Enroll Student 1 in Course 1
    console.log('\n7️⃣ Enrolling Student 1 in Course 1...');
    const res7 = await request('POST', '/api/enrollments', { courseId: 1 }, cookie1);
    console.log(`   Status: ${res7.status}, Message: "${res7.body.message}"`);
    if (res7.status !== 201) throw new Error('Enrollment in Course 1 failed');

    // TEST 8: Verify dashboard statistics after enrollment
    console.log('\n8️⃣ Testing GET /api/dashboard after enrollment...');
    const res8 = await request('GET', '/api/dashboard', null, cookie1);
    console.log(`   Enrolled: ${res8.body.dashboard?.statistics?.enrolledCourses}, In Progress: ${res8.body.dashboard?.statistics?.inProgressCourses}`);
    if (res8.body.dashboard?.statistics?.enrolledCourses !== 1 || res8.body.dashboard?.statistics?.inProgressCourses !== 1) {
      throw new Error('Dashboard stats after enrollment mismatch');
    }

    // TEST 9: Bookmark Course 2
    console.log('\n9️⃣ Bookmarking Course 2...');
    const res9 = await request('POST', '/api/bookmarks', { courseId: 2 }, cookie1);
    console.log(`   Status: ${res9.status}, Message: "${res9.body.message}"`);
    const res9b = await request('GET', '/api/dashboard', null, cookie1);
    console.log(`   Bookmarked Courses: ${res9b.body.dashboard?.statistics?.bookmarkedCourses}`);
    if (res9b.body.dashboard?.statistics?.bookmarkedCourses !== 1) throw new Error('Bookmarked courses stat failed');

    // TEST 10: Fetch Course 1 lessons & complete 1 lesson
    const course1Modules = await prisma.module.findMany({
      where: { courseId: 1 },
      orderBy: { order: 'asc' },
      include: { lessons: { orderBy: { order: 'asc' } } }
    });
    const course1Lessons = course1Modules.flatMap(m => m.lessons);

    console.log(`\n🔟 Completing Lesson 1 (ID ${course1Lessons[0].id})...`);
    await request('POST', '/api/progress/toggle', { lessonId: course1Lessons[0].id, completed: true }, cookie1);
    const res10 = await request('GET', '/api/dashboard', null, cookie1);
    console.log(`   Completed Lessons: ${res10.body.dashboard?.statistics?.completedLessons}, Hours Learned: ${res10.body.dashboard?.statistics?.hoursLearned}`);
    if (res10.body.dashboard?.statistics?.completedLessons !== 1 || res10.body.dashboard?.statistics?.hoursLearned <= 0) {
      throw new Error('Lesson completion stats in dashboard failed');
    }

    // TEST 11: GET /api/progress/course/1
    console.log('\n1️⃣1️⃣ Testing GET /api/progress/course/1...');
    const res11 = await request('GET', '/api/progress/course/1', null, cookie1);
    console.log(`   Status: ${res11.status}, Progress: ${res11.body.progress?.progressPercentage}%`);
    if (res11.status !== 200 || res11.body.progress?.progressPercentage <= 0) throw new Error('Course progress fetch failed');

    // TEST 12: Complete ALL lessons in Course 1 (triggers 100% completion)
    console.log(`\n1️⃣2️⃣ Completing ALL ${course1Lessons.length} lessons in Course 1...`);
    for (const l of course1Lessons) {
      await request('POST', '/api/progress/toggle', { lessonId: l.id, completed: true }, cookie1);
    }
    const res12 = await request('GET', '/api/progress/course/1', null, cookie1);
    console.log(`   Progress: ${res12.body.progress?.progressPercentage}%, Status: "${res12.body.progress?.status}"`);
    if (res12.body.progress?.progressPercentage !== 100 || res12.body.progress?.status !== 'COMPLETED') {
      throw new Error('Course 1 full completion failed');
    }

    // TEST 13 & 14: Verify automatic certificate creation
    console.log('\n1️⃣3️⃣ & 1️⃣4️⃣ Verifying automatic certificate creation via GET /api/certificates...');
    const res13 = await request('GET', '/api/certificates', null, cookie1);
    console.log(`   Status: ${res13.status}, Count: ${res13.body.count}`);
    if (res13.status !== 200 || res13.body.count !== 1) throw new Error('Automatic certificate creation failed');

    const certObj = res13.body.certificates[0];
    console.log(`   Cert Number: ${certObj.certificateNumber}, Course: "${certObj.courseTitle}", Student: "${certObj.studentName}"`);
    if (!certObj.certificateNumber || certObj.courseId !== 1 || !certObj.issuedAt || certObj.pdfUrl !== null) {
      throw new Error('Certificate fields validation failed');
    }
    const certId = certObj.id;

    // TEST 15: Call POST /api/certificates/generate/1 manually (Returns existing certificate, no duplicates)
    console.log('\n1️⃣5️⃣ Calling POST /api/certificates/generate/1 manually...');
    const res15 = await request('POST', '/api/certificates/generate/1', null, cookie1);
    console.log(`   Status: ${res15.status}, Message: "${res15.body.message}", Cert ID: ${res15.body.certificate?.id}`);
    if (res15.status !== 200 || res15.body.certificate?.id !== certId) {
      throw new Error('Manual generate certificate failed to return existing certificate');
    }

    // TEST 16: GET /api/certificates/:id
    console.log(`\n1️⃣6️⃣ Testing GET /api/certificates/${certId}...`);
    const res16 = await request('GET', `/api/certificates/${certId}`, null, cookie1);
    console.log(`   Status: ${res16.status}, Cert Number: ${res16.body.certificate?.certificateNumber}`);
    if (res16.status !== 200 || res16.body.certificate?.id !== certId) {
      throw new Error('GET /api/certificates/:id failed');
    }

    // TEST 17 & 18 & 19: Student 2 isolation test
    console.log(`\n1️⃣7️⃣ Registering Student 2 (${emailUser2})...`);
    const res17 = await request('POST', '/api/auth/register', {
      name: 'Bob Student 2',
      email: emailUser2,
      password: testPassword
    });
    testUser2Id = res17.body.user.id;

    const res17b = await request('POST', '/api/auth/login', {
      email: emailUser2,
      password: testPassword
    });
    const cookie2 = res17b.cookie;

    console.log('\n1️⃣8️⃣ Student 2 attempting to access Student 1\'s certificate...');
    const res18 = await request('GET', `/api/certificates/${certId}`, null, cookie2);
    console.log(`   Status: ${res18.status}, Message: "${res18.body.message}"`);
    if (res18.status !== 404) throw new Error('Student 2 should get 404 when accessing Student 1\'s certificate');

    console.log('\n1️⃣9️⃣ Student 2 calling GET /api/dashboard...');
    const res19 = await request('GET', '/api/dashboard', null, cookie2);
    console.log(`   Student 2 Enrolled: ${res19.body.dashboard?.statistics?.enrolledCourses}, Certs: ${res19.body.dashboard?.statistics?.certificates}`);
    if (
      res19.status !== 200 ||
      res19.body.dashboard?.statistics?.enrolledCourses !== 0 ||
      res19.body.dashboard?.statistics?.certificates !== 0
    ) {
      throw new Error('Dashboard data isolation between students failed');
    }

    // TEST 20 & 21: Unauthenticated requests
    console.log('\n2️⃣0️⃣ Testing GET /api/dashboard WITHOUT authentication...');
    const res20 = await request('GET', '/api/dashboard');
    console.log(`   Status: ${res20.status}`);
    if (res20.status !== 401) throw new Error('Unauthenticated /api/dashboard should return 401');

    console.log('\n2️⃣1️⃣ Testing GET /api/certificates WITHOUT authentication...');
    const res21 = await request('GET', '/api/certificates');
    console.log(`   Status: ${res21.status}`);
    if (res21.status !== 401) throw new Error('Unauthenticated /api/certificates should return 401');

    // TEST 22 & 23 & 24: Validation & Edge Cases for generate certificate
    console.log('\n2️⃣2️⃣ Testing POST /api/certificates/generate/abc (Invalid courseId)...');
    const res22 = await request('POST', '/api/certificates/generate/abc', null, cookie1);
    console.log(`   Status: ${res22.status}`);
    if (res22.status !== 400) throw new Error('Invalid courseId should return 400');

    console.log('\n2️⃣3️⃣ Testing POST /api/certificates/generate/999999 (Nonexistent course)...');
    const res23 = await request('POST', '/api/certificates/generate/999999', null, cookie1);
    console.log(`   Status: ${res23.status}`);
    if (res23.status !== 404) throw new Error('Nonexistent course should return 404');

    console.log('\n2️⃣4️⃣ Student 2 enrolling in Course 2 & attempting certificate generate before completion...');
    await request('POST', '/api/enrollments', { courseId: 2 }, cookie2);
    const res24 = await request('POST', '/api/certificates/generate/2', null, cookie2);
    console.log(`   Status: ${res24.status}, Message: "${res24.body.message}"`);
    if (res24.status !== 400) throw new Error('Generating certificate before completion should return 400');

    // TEST 25: Dashboard after completion for Student 1
    console.log('\n2️⃣5️⃣ Checking Student 1 dashboard after course completion...');
    const res25 = await request('GET', '/api/dashboard', null, cookie1);
    console.log(`   Completed Courses: ${res25.body.dashboard?.statistics?.completedCourses}, In Progress: ${res25.body.dashboard?.statistics?.inProgressCourses}, Certs: ${res25.body.dashboard?.statistics?.certificates}`);
    if (
      res25.body.dashboard?.statistics?.completedCourses !== 1 ||
      res25.body.dashboard?.statistics?.inProgressCourses !== 0 ||
      res25.body.dashboard?.statistics?.certificates !== 1
    ) {
      throw new Error('Completed course stats in dashboard mismatch');
    }

    // TEST 26: Certificate remains after course is temporarily reverted below 100%
    const lastLesson = course1Lessons[course1Lessons.length - 1];
    console.log(`\n2️⃣6️⃣ Unchecking last lesson (ID ${lastLesson.id}) of Course 1...`);
    await request('POST', '/api/progress/toggle', { lessonId: lastLesson.id, completed: false }, cookie1);
    const res26 = await request('GET', '/api/certificates', null, cookie1);
    console.log(`   Certificates Count: ${res26.body.count}`);
    if (res26.body.count !== 1) throw new Error('Certificate should remain intact when course is reverted');

    // TEST 27: Re-completing course does not create duplicate certificate
    console.log(`\n2️⃣7️⃣ Re-completing last lesson (ID ${lastLesson.id}) of Course 1...`);
    await request('POST', '/api/progress/toggle', { lessonId: lastLesson.id, completed: true }, cookie1);
    const res27 = await request('GET', '/api/certificates', null, cookie1);
    console.log(`   Certificates Count: ${res27.body.count}`);
    if (res27.body.count !== 1) throw new Error('Re-completing course created a duplicate certificate');

    // TEST 28: Database Seed Integrity Check
    console.log('\n2️⃣8️⃣ Verifying Database seed integrity...');
    const coursesCount = await prisma.course.count();
    const categoriesCount = await prisma.category.count();
    const modulesCount = await prisma.module.count();
    const lessonsCount = await prisma.lesson.count();

    console.log(`   Courses Count: ${coursesCount} (Expected: 30)`);
    console.log(`   Categories Count: ${categoriesCount} (Expected: 12)`);
    console.log(`   Modules Count: ${modulesCount} (Expected: 30)`);
    console.log(`   Lessons Count: ${lessonsCount} (Expected: 194)`);

    if (coursesCount !== 30 || categoriesCount !== 12 || modulesCount !== 30 || lessonsCount !== 194) {
      throw new Error('Database seed integrity failure');
    }

    // TEST 29: Clean up test users
    console.log('\n2️⃣9️⃣ Cleaning up test student accounts...');
    if (testUser1Id) await prisma.user.delete({ where: { id: testUser1Id } });
    if (testUser2Id) await prisma.user.delete({ where: { id: testUser2Id } });
    console.log('   Successfully cleaned up test users.');

    console.log('\n==================================================');
    console.log('🎉 ALL DASHBOARD & CERTIFICATE API TESTS PASSED SUCCESSFULLY! 🎉');
    console.log('==================================================\n');

  } catch (err) {
    console.error('\n❌ TEST FAILED WITH ERROR:');
    console.error(err);

    if (testUser1Id) {
      try { await prisma.user.delete({ where: { id: testUser1Id } }); } catch (e) {}
    }
    if (testUser2Id) {
      try { await prisma.user.delete({ where: { id: testUser2Id } }); } catch (e) {}
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
