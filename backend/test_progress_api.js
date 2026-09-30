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
  console.log('🧪 SKILLHUB STEP 6 — LESSON PROGRESS API TESTS');
  console.log('==================================================\n');

  let testUserId = null;
  const testEmail = `step6_student_${Date.now()}@example.com`;
  const testPassword = 'Password123!';

  try {
    // STEP 1: Health check
    console.log('1️⃣ Testing GET /api/health...');
    const res1 = await request('GET', '/api/health');
    console.log(`   Status: ${res1.status}, Message: "${res1.body.message}"`);
    if (res1.status !== 200) throw new Error('Health check failed');

    // STEP 2: Register test student
    console.log(`\n2️⃣ Registering test student (${testEmail})...`);
    const res2 = await request('POST', '/api/auth/register', {
      name: 'Step 6 Test Student',
      email: testEmail,
      password: testPassword
    });
    console.log(`   Status: ${res2.status}, User ID: ${res2.body.user?.id}`);
    if (res2.status !== 201) throw new Error('Registration failed');
    testUserId = res2.body.user.id;

    // STEP 3: Login test student
    console.log('\n3️⃣ Logging in test student...');
    const res3 = await request('POST', '/api/auth/login', {
      email: testEmail,
      password: testPassword
    });
    console.log(`   Status: ${res3.status}, Cookie: ${res3.cookie}`);
    if (res3.status !== 200 || !res3.cookie) throw new Error('Login failed');
    const studentCookie = res3.cookie;

    // Fetch lessons for Course 1 directly from database for precise assertions
    const course1Modules = await prisma.module.findMany({
      where: { courseId: 1 },
      orderBy: { order: 'asc' },
      include: {
        lessons: { orderBy: { order: 'asc' } }
      }
    });
    const course1Lessons = course1Modules.flatMap(m => m.lessons);
    console.log(`\nℹ️ Course 1 has ${course1Modules.length} modules and ${course1Lessons.length} total lessons.`);
    if (course1Lessons.length < 2) throw new Error('Course 1 must have at least 2 lessons for testing');

    const lesson1 = course1Lessons[0];
    const lesson2 = course1Lessons[1];

    // STEP 4: Toggle progress without enrollment -> Expect 403 Forbidden
    console.log(`\n4️⃣ Testing POST /api/progress/toggle WITHOUT enrollment (Lesson ID ${lesson1.id})...`);
    const res4 = await request('POST', '/api/progress/toggle', { lessonId: lesson1.id, completed: true }, studentCookie);
    console.log(`   Status: ${res4.status}, Message: "${res4.body.message}"`);
    if (res4.status !== 403) throw new Error(`Expected 403 Forbidden without enrollment, got ${res4.status}`);

    // STEP 5: Enroll test student in Course 1
    console.log('\n5️⃣ Enrolling student in Course 1...');
    const res5 = await request('POST', '/api/enrollments', { courseId: 1 }, studentCookie);
    console.log(`   Status: ${res5.status}, Message: "${res5.body.message}"`);
    if (res5.status !== 201) throw new Error('Enrollment in Course 1 failed');

    // STEP 6: Verify initial course progress via GET /api/progress/course/1
    console.log('\n6️⃣ Testing GET /api/progress/course/1 (Initial 0% progress)...');
    const res6 = await request('GET', '/api/progress/course/1', null, studentCookie);
    console.log(`   Status: ${res6.status}, Progress: ${res6.body.progress?.progressPercentage}%, Status: "${res6.body.progress?.status}"`);
    if (res6.status !== 200 || res6.body.progress?.progressPercentage !== 0 || res6.body.progress?.status !== 'ACTIVE') {
      throw new Error('Initial progress calculation error');
    }

    // STEP 7: Toggle lesson 1 complete -> Check progress increase
    console.log(`\n7️⃣ Toggling Lesson 1 (ID ${lesson1.id}) COMPLETE...`);
    const res7 = await request('POST', '/api/progress/toggle', { lessonId: lesson1.id, completed: true }, studentCookie);
    console.log(`   Status: ${res7.status}, Progress %: ${res7.body.courseProgress?.progressPercentage}%, Completed Lessons: ${res7.body.courseProgress?.completedLessons}/${res7.body.courseProgress?.totalLessons}`);
    if (res7.status !== 200 || res7.body.courseProgress?.completedLessons !== 1 || res7.body.courseProgress?.progressPercentage <= 0) {
      throw new Error('Lesson 1 completion failed or progress percentage did not increase');
    }

    // STEP 8: Toggle lesson 2 complete -> Check progress increase further
    console.log(`\n8️⃣ Toggling Lesson 2 (ID ${lesson2.id}) COMPLETE...`);
    const res8 = await request('POST', '/api/progress/toggle', { lessonId: lesson2.id, completed: true }, studentCookie);
    console.log(`   Status: ${res8.status}, Progress %: ${res8.body.courseProgress?.progressPercentage}%, Completed Lessons: ${res8.body.courseProgress?.completedLessons}/${res8.body.courseProgress?.totalLessons}`);
    if (res8.status !== 200 || res8.body.courseProgress?.completedLessons !== 2) {
      throw new Error('Lesson 2 completion failed');
    }

    // STEP 9: Toggle lesson 1 INCOMPLETE -> Check progress decrease
    console.log(`\n9️⃣ Toggling Lesson 1 (ID ${lesson1.id}) INCOMPLETE...`);
    const res9 = await request('POST', '/api/progress/toggle', { lessonId: lesson1.id, completed: false }, studentCookie);
    console.log(`   Status: ${res9.status}, Progress %: ${res9.body.courseProgress?.progressPercentage}%, Completed Lessons: ${res9.body.courseProgress?.completedLessons}/${res9.body.courseProgress?.totalLessons}`);
    if (res9.status !== 200 || res9.body.courseProgress?.completedLessons !== 1) {
      throw new Error('Lesson 1 unmarking failed');
    }

    // STEP 10: Toggle lesson 1 back to COMPLETE
    console.log(`\n🔟 Toggling Lesson 1 (ID ${lesson1.id}) back to COMPLETE...`);
    const res10 = await request('POST', '/api/progress/toggle', { lessonId: lesson1.id, completed: true }, studentCookie);
    console.log(`   Status: ${res10.status}, Completed Lessons: ${res10.body.courseProgress?.completedLessons}`);
    if (res10.status !== 200 || res10.body.courseProgress?.completedLessons !== 2) {
      throw new Error('Lesson 1 re-marking failed');
    }

    // STEP 11: GET /api/progress/course/1 -> Check detailed module & lesson response
    console.log('\n1️⃣1️⃣ Testing GET /api/progress/course/1...');
    const res11 = await request('GET', '/api/progress/course/1', null, studentCookie);
    console.log(`   Status: ${res11.status}, Modules Count: ${res11.body.progress?.modules?.length}`);
    if (res11.status !== 200 || !res11.body.progress?.modules) throw new Error('GET /api/progress/course/1 failed');
    
    // Confirm lesson 1 & lesson 2 reflect completed: true in GET response
    const allRetrievedLessons = res11.body.progress.modules.flatMap(m => m.lessons);
    const retL1 = allRetrievedLessons.find(l => l.id === lesson1.id);
    const retL2 = allRetrievedLessons.find(l => l.id === lesson2.id);
    if (!retL1?.completed || !retL2?.completed) throw new Error('Lesson progress state mismatch in GET /api/progress/course/1');

    // STEP 12: GET /api/progress -> Check overall user progress summary
    console.log('\n1️⃣2️⃣ Testing GET /api/progress (User progress summary)...');
    const res12 = await request('GET', '/api/progress', null, studentCookie);
    console.log(`   Status: ${res12.status}, Enrolled Courses Count: ${res12.body.count}`);
    if (res12.status !== 200 || res12.body.count !== 1 || res12.body.progress[0].courseId !== 1) {
      throw new Error('GET /api/progress summary failed');
    }

    // STEP 13: Invalid request validation (missing lessonId) -> 400 Bad Request
    console.log('\n1️⃣3️⃣ Testing POST /api/progress/toggle with missing lessonId...');
    const res13 = await request('POST', '/api/progress/toggle', { completed: true }, studentCookie);
    console.log(`   Status: ${res13.status}, Message: "${res13.body.message}"`);
    if (res13.status !== 400) throw new Error('Validation failed to catch missing lessonId');

    // STEP 14: Invalid request validation (invalid string lessonId) -> 400 Bad Request
    console.log('\n1️⃣4️⃣ Testing POST /api/progress/toggle with invalid lessonId ("abc")...');
    const res14 = await request('POST', '/api/progress/toggle', { lessonId: 'abc' }, studentCookie);
    console.log(`   Status: ${res14.status}, Message: "${res14.body.message}"`);
    if (res14.status !== 400) throw new Error('Validation failed to catch invalid string lessonId');

    // STEP 15: Nonexistent lesson ID -> 404 Not Found
    console.log('\n1️⃣5️⃣ Testing POST /api/progress/toggle with nonexistent lesson ID (999999)...');
    const res15 = await request('POST', '/api/progress/toggle', { lessonId: 999999, completed: true }, studentCookie);
    console.log(`   Status: ${res15.status}, Message: "${res15.body.message}"`);
    if (res15.status !== 404) throw new Error('Expected 404 for nonexistent lesson');

    // STEP 16: Nonexistent course progress -> 404 Not Found
    console.log('\n1️⃣6️⃣ Testing GET /api/progress/course/999999...');
    const res16 = await request('GET', '/api/progress/course/999999', null, studentCookie);
    console.log(`   Status: ${res16.status}, Message: "${res16.body.message}"`);
    if (res16.status !== 404) throw new Error('Expected 404 for nonexistent course');

    // STEP 17: Course progress for un-enrolled course -> 403 Forbidden
    console.log('\n1️⃣7️⃣ Testing GET /api/progress/course/2 (Not enrolled)...');
    const res17 = await request('GET', '/api/progress/course/2', null, studentCookie);
    console.log(`   Status: ${res17.status}, Message: "${res17.body.message}"`);
    if (res17.status !== 403) throw new Error('Expected 403 for un-enrolled course progress');

    // STEP 18: Unauthenticated request to /api/progress -> 401 Unauthorized
    console.log('\n1️⃣8️⃣ Testing GET /api/progress WITHOUT authentication cookie...');
    const res18 = await request('GET', '/api/progress');
    console.log(`   Status: ${res18.status}, Message: "${res18.body.message}"`);
    if (res18.status !== 401) throw new Error('Expected 401 Unauthorized without cookie');

    // STEP 19: Full 100% Completion Flow
    console.log(`\n1️⃣9️⃣ Completing ALL ${course1Lessons.length} lessons of Course 1 to reach 100% completion...`);
    for (const l of course1Lessons) {
      await request('POST', '/api/progress/toggle', { lessonId: l.id, completed: true }, studentCookie);
    }
    const res19 = await request('GET', '/api/progress/course/1', null, studentCookie);
    console.log(`   Status: ${res19.status}, Progress %: ${res19.body.progress?.progressPercentage}%, Enrollment Status: "${res19.body.progress?.status}", CompletedAt: ${res19.body.progress?.completedAt}`);
    if (
      res19.status !== 200 ||
      res19.body.progress?.progressPercentage !== 100 ||
      res19.body.progress?.status !== 'COMPLETED' ||
      !res19.body.progress?.completedAt
    ) {
      throw new Error('100% completion flow failed to update status to COMPLETED');
    }

    // STEP 20: Revert from 100% completion by toggling last lesson to incomplete
    const lastLesson = course1Lessons[course1Lessons.length - 1];
    console.log(`\n2️⃣0️⃣ Unchecking last lesson (ID ${lastLesson.id}) to revert status back to ACTIVE...`);
    const res20 = await request('POST', '/api/progress/toggle', { lessonId: lastLesson.id, completed: false }, studentCookie);
    console.log(`   Status: ${res20.status}, Progress %: ${res20.body.courseProgress?.progressPercentage}%, Status: "${res20.body.courseProgress?.status}", CompletedAt: ${res20.body.courseProgress?.completedAt}`);
    if (
      res20.status !== 200 ||
      res20.body.courseProgress?.progressPercentage >= 100 ||
      res20.body.courseProgress?.status !== 'ACTIVE' ||
      res20.body.courseProgress?.completedAt !== null
    ) {
      throw new Error('Reverting 100% completion failed to reset status to ACTIVE');
    }

    // STEP 21: Database Counts Verification
    console.log('\n2️⃣1️⃣ Verifying Database seed integrity...');
    const coursesCount = await prisma.course.count();
    const categoriesCount = await prisma.category.count();
    const modulesCount = await prisma.module.count();
    const lessonsCount = await prisma.lesson.count();

    console.log(`   Courses Count: ${coursesCount} (Expected: 30)`);
    console.log(`   Categories Count: ${categoriesCount} (Expected: 12)`);
    console.log(`   Modules Count: ${modulesCount} (Expected: 30)`);
    console.log(`   Lessons Count: ${lessonsCount} (Expected: 194)`);

    if (coursesCount !== 30 || categoriesCount !== 12 || modulesCount !== 30 || lessonsCount !== 194) {
      throw new Error('Database data corruption detected!');
    }

    // STEP 22: Cleanup test user
    console.log('\n2️⃣2️⃣ Cleaning up test student data...');
    if (testUserId) {
      await prisma.user.delete({ where: { id: testUserId } });
      console.log(`   Successfully deleted test user ID: ${testUserId}`);
    }

    console.log('\n==================================================');
    console.log('🎉 ALL 22 LESSON PROGRESS & LEARNING TESTS PASSED SUCCESSFULLY!');
    console.log('==================================================\n');

  } catch (err) {
    console.error('\n❌ TEST FAILED WITH ERROR:');
    console.error(err);

    // Emergency cleanup
    if (testUserId) {
      try {
        await prisma.user.delete({ where: { id: testUserId } });
        console.log(`🧹 Cleaned up test user: ${testUserId}`);
      } catch (e) {}
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
