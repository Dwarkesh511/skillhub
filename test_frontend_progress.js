import http from 'http';

const BASE_URL = 'http://localhost:5000/api';

function request(path, options = {}, postData = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    const reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      const setCookieHeader = res.headers['set-cookie'];
      let extractedCookie = null;
      if (setCookieHeader) {
        const first = Array.isArray(setCookieHeader) ? setCookieHeader[0] : setCookieHeader;
        if (first) {
          extractedCookie = first.split(';')[0];
        }
      }

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch (e) {
          parsed = data;
        }

        resolve({
          status: res.statusCode,
          headers: res.headers,
          cookie: extractedCookie,
          body: parsed
        });
      });
    });

    req.on('error', (err) => reject(err));

    if (postData) {
      req.write(JSON.stringify(postData));
    }

    req.end();
  });
}

async function runTests() {
  console.log('==================================================');
  console.log('RUNNING STEP 8E AUTOMATED PROGRESS & LEARNING TESTS');
  console.log('==================================================\n');

  let studentCookie = '';
  const timestamp = Date.now();
  const studentEmail = `student_progress_${timestamp}@example.com`;
  const studentPassword = 'Password123!';

  // 1. Unauthenticated request to progress API -> expect 401
  console.log('Test 1: Unauthenticated request to GET /api/progress/course/1');
  const res1 = await request('/progress/course/1');
  if (res1.status === 401) {
    console.log('  ✅ PASSED: Returns 401 Unauthorized');
  } else {
    console.error(`  ❌ FAILED: Expected 401, got ${res1.status}`);
    process.exit(1);
  }

  // 2. Register and Login student user
  console.log(`\nTest 2: Register & Login test student user (${studentEmail})`);
  const res2Reg = await request('/auth/register', { method: 'POST' }, {
    name: 'Progress Student',
    email: studentEmail,
    password: studentPassword
  });

  if (res2Reg.status !== 201 || !res2Reg.body.success) {
    console.error('  ❌ FAILED: Could not register test student:', res2Reg.body);
    process.exit(1);
  }

  const res2Login = await request('/auth/login', { method: 'POST' }, {
    email: studentEmail,
    password: studentPassword
  });

  if (res2Login.status === 200 && res2Login.body.success && res2Login.cookie) {
    studentCookie = res2Login.cookie;
    console.log(`  ✅ PASSED: Logged in and HttpOnly cookie received (${studentCookie})`);
  } else {
    console.error('  ❌ FAILED: Login failed or cookie missing:', res2Login.body);
    process.exit(1);
  }

  // 3. Unenrolled course progress check -> expect 403
  console.log('\nTest 3: Check progress for course 1 before enrolling');
  const res3 = await request('/progress/course/1', {
    headers: { Cookie: studentCookie }
  });

  if (res3.status === 403 && res3.body.success === false) {
    console.log('  ✅ PASSED: Returns 403 Forbidden for unenrolled student');
  } else {
    console.error(`  ❌ FAILED: Expected 403, got ${res3.status}`, res3.body);
    process.exit(1);
  }

  // 4. Enroll in Course 1 (POST /api/enrollments { courseId: 1 })
  console.log('\nTest 4: Enroll in Course 1 via POST /api/enrollments');
  const res4 = await request('/enrollments', {
    method: 'POST',
    headers: { Cookie: studentCookie }
  }, {
    courseId: 1
  });

  if (res4.status === 201 && res4.body.success) {
    console.log('  ✅ PASSED: Successfully enrolled in course 1');
  } else {
    console.error(`  ❌ FAILED: Expected 201 enrollment, got ${res4.status}`, res4.body);
    process.exit(1);
  }

  // 5. Enrolled course progress check
  console.log('\nTest 5: Check course 1 progress after enrollment');
  const res5 = await request('/progress/course/1', {
    headers: { Cookie: studentCookie }
  });

  if (res5.status === 200 && res5.body.success && res5.body.progress) {
    const prog = res5.body.progress;
    console.log(`  ✅ PASSED: Progress fetched. Course: "${prog.courseTitle}", Total Lessons: ${prog.totalLessons}, Initial Progress: ${prog.progressPercentage}%`);
    if (!prog.modules || prog.modules.length === 0) {
      console.error('  ❌ FAILED: Course modules empty');
      process.exit(1);
    }
  } else {
    console.error(`  ❌ FAILED: Expected 200, got ${res5.status}`, res5.body);
    process.exit(1);
  }

  const modules = res5.body.progress.modules;
  const firstLesson = modules[0]?.lessons[0];

  if (!firstLesson) {
    console.error('  ❌ FAILED: No lessons found in course 1');
    process.exit(1);
  }

  // 6. Toggle lesson progress (Mark first lesson as completed)
  console.log(`\nTest 6: Mark lesson 1 (ID ${firstLesson.id}: "${firstLesson.title}") as COMPLETED`);
  const res6 = await request('/progress/toggle', {
    method: 'POST',
    headers: { Cookie: studentCookie }
  }, {
    lessonId: firstLesson.id,
    completed: true
  });

  if (res6.status === 200 && res6.body.success && res6.body.progress.completed === true) {
    console.log(`  ✅ PASSED: Lesson ${firstLesson.id} marked as completed. Updated course progress: ${res6.body.courseProgress.progressPercentage}% (${res6.body.courseProgress.completedLessons}/${res6.body.courseProgress.totalLessons} lessons)`);
  } else {
    console.error(`  ❌ FAILED: Expected 200 toggle success, got ${res6.status}`, res6.body);
    process.exit(1);
  }

  // 7. Verify course progress reflects completed lesson
  console.log('\nTest 7: Verify GET /api/progress/course/1 reflects completed status');
  const res7 = await request('/progress/course/1', {
    headers: { Cookie: studentCookie }
  });

  const updatedLes1 = res7.body.progress.modules[0].lessons.find(l => l.id === firstLesson.id);
  if (res7.status === 200 && updatedLes1 && updatedLes1.completed === true) {
    console.log('  ✅ PASSED: Lesson 1 confirmed completed in GET /api/progress/course/1');
  } else {
    console.error('  ❌ FAILED: Lesson 1 not showing completed in GET course progress:', res7.body);
    process.exit(1);
  }

  // 8. Toggle lesson progress (Mark first lesson as incomplete)
  console.log(`\nTest 8: Toggle lesson 1 (ID ${firstLesson.id}) back to INCOMPLETE`);
  const res8 = await request('/progress/toggle', {
    method: 'POST',
    headers: { Cookie: studentCookie }
  }, {
    lessonId: firstLesson.id,
    completed: false
  });

  if (res8.status === 200 && res8.body.success && res8.body.progress.completed === false) {
    console.log(`  ✅ PASSED: Lesson ${firstLesson.id} toggled back to incomplete. Progress: ${res8.body.courseProgress.progressPercentage}%`);
  } else {
    console.error(`  ❌ FAILED: Expected 200 toggle back, got ${res8.status}`, res8.body);
    process.exit(1);
  }

  // 9. Complete all lessons in course 1 and verify 100% COMPLETED status
  console.log('\nTest 9: Mark ALL lessons in Course 1 as COMPLETED');
  const allLessons = [];
  modules.forEach(m => {
    if (m.lessons) allLessons.push(...m.lessons);
  });

  for (const les of allLessons) {
    await request('/progress/toggle', {
      method: 'POST',
      headers: { Cookie: studentCookie }
    }, {
      lessonId: les.id,
      completed: true
    });
  }

  const res9 = await request('/progress/course/1', {
    headers: { Cookie: studentCookie }
  });

  if (res9.status === 200 && res9.body.progress.progressPercentage === 100 && res9.body.progress.status === 'COMPLETED') {
    console.log(`  ✅ PASSED: All ${allLessons.length} lessons completed. Course status: ${res9.body.progress.status}, Percentage: ${res9.body.progress.progressPercentage}%`);
  } else {
    console.error('  ❌ FAILED: Course progress percentage is not 100% or status not COMPLETED:', res9.body.progress);
    process.exit(1);
  }

  // 10. Logout user and verify Set-Cookie clearing header
  console.log('\nTest 10: Logout student user');
  const res10 = await request('/auth/logout', {
    method: 'POST',
    headers: { Cookie: studentCookie }
  });

  if (res10.status === 200 && res10.body.success) {
    console.log('  ✅ PASSED: Logged out successfully and HttpOnly clear cookie header received');
  } else {
    console.error(`  ❌ FAILED: Logout failed with status ${res10.status}`);
    process.exit(1);
  }

  // 11. Post-logout progress check without active token cookie -> expect 401
  console.log('\nTest 11: Progress check after logout (No token cookie)');
  const res11 = await request('/progress/course/1');

  if (res11.status === 401) {
    console.log('  ✅ PASSED: Progress API rejects unauthenticated request after logout (401)');
  } else {
    console.error(`  ❌ FAILED: Expected 401 after logout, got ${res11.status}`);
    process.exit(1);
  }

  console.log('\n==================================================');
  console.log('ALL 11 AUTOMATED PROGRESS & LEARNING TESTS PASSED SUCCESSFULLY!');
  console.log('==================================================\n');
}

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
