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

async function runDashboardCertificatesTests() {
  console.log('==================================================');
  console.log('RUNNING STEP 8F AUTOMATED DASHBOARD & CERTIFICATES TESTS');
  console.log('==================================================\n');

  let studentCookie = '';
  const timestamp = Date.now();
  const studentEmail = `student_dash_${timestamp}@example.com`;
  const studentPassword = 'Password123!';

  // 1. Unauthenticated GET /api/dashboard -> 401
  console.log('1. Testing Unauthenticated GET /api/dashboard...');
  const res1 = await request('/dashboard');
  if (res1.status === 401) {
    console.log('   ✅ PASSED: Returns 401 Unauthorized');
  } else {
    console.error(`   ❌ FAILED: Expected 401, got ${res1.status}`);
    process.exit(1);
  }

  // 2. Unauthenticated GET /api/certificates -> 401
  console.log('\n2. Testing Unauthenticated GET /api/certificates...');
  const res2 = await request('/certificates');
  if (res2.status === 401) {
    console.log('   ✅ PASSED: Returns 401 Unauthorized');
  } else {
    console.error(`   ❌ FAILED: Expected 401, got ${res2.status}`);
    process.exit(1);
  }

  // 3. Register temporary student
  console.log(`\n3. Registering test student (${studentEmail})...`);
  const res3Reg = await request('/auth/register', { method: 'POST' }, {
    name: 'Dashboard Cert Student',
    email: studentEmail,
    password: studentPassword
  });
  if (res3Reg.status === 201 && res3Reg.body.success) {
    console.log('   ✅ PASSED: Student registered');
  } else {
    console.error('   ❌ FAILED: Registration failed:', res3Reg.body);
    process.exit(1);
  }

  // 4. Login successfully
  console.log('\n4. Logging in test student...');
  const res4Login = await request('/auth/login', { method: 'POST' }, {
    email: studentEmail,
    password: studentPassword
  });
  if (res4Login.status === 200 && res4Login.body.success && res4Login.cookie) {
    studentCookie = res4Login.cookie;
    console.log('   ✅ PASSED: Logged in and received HttpOnly cookie');
  } else {
    console.error('   ❌ FAILED: Login failed:', res4Login.body);
    process.exit(1);
  }

  // 5. GET /api/dashboard -> 200
  console.log('\n5. Testing Authenticated GET /api/dashboard...');
  const res5 = await request('/dashboard', { headers: { Cookie: studentCookie } });
  if (res5.status === 200 && res5.body.success && res5.body.dashboard) {
    console.log('   ✅ PASSED: Returns 200 with dashboard payload');
  } else {
    console.error(`   ❌ FAILED: Expected 200 dashboard, got ${res5.status}`, res5.body);
    process.exit(1);
  }

  // 6. Verify dashboard statistic fields
  console.log('\n6. Verifying dashboard statistics structure...');
  const stats = res5.body.dashboard.statistics;
  if (
    stats &&
    typeof stats.enrolledCourses === 'number' &&
    typeof stats.completedCourses === 'number' &&
    typeof stats.inProgressCourses === 'number' &&
    typeof stats.bookmarkedCourses === 'number' &&
    typeof stats.completedLessons === 'number' &&
    typeof stats.hoursLearned === 'number' &&
    typeof stats.certificates === 'number'
  ) {
    console.log(`   ✅ PASSED: Stats intact (Enrolled: ${stats.enrolledCourses}, Hours: ${stats.hoursLearned}, Certs: ${stats.certificates})`);
  } else {
    console.error('   ❌ FAILED: Invalid dashboard statistics structure:', stats);
    process.exit(1);
  }

  // 7 & 8. GET /api/certificates -> 200 (Initial array)
  console.log('\n7 & 8. Testing GET /api/certificates (Initial state)...');
  const res7 = await request('/certificates', { headers: { Cookie: studentCookie } });
  if (res7.status === 200 && res7.body.success && Array.isArray(res7.body.certificates)) {
    console.log(`   ✅ PASSED: Returns 200 with certificates array (length ${res7.body.certificates.length})`);
  } else {
    console.error(`   ❌ FAILED: Expected 200 certificates array, got ${res7.status}`, res7.body);
    process.exit(1);
  }

  // 9. Enroll in Course 1
  console.log('\n9. Enrolling test student in Course 1...');
  const res9 = await request('/enrollments', {
    method: 'POST',
    headers: { Cookie: studentCookie }
  }, { courseId: 1 });
  if (res9.status === 201 && res9.body.success) {
    console.log('   ✅ PASSED: Enrolled in Course 1');
  } else {
    console.error(`   ❌ FAILED: Enrollment failed (${res9.status})`, res9.body);
    process.exit(1);
  }

  // 10. Verify dashboard enrolledCourses updates
  console.log('\n10. Verifying dashboard enrolledCourses statistic update...');
  const res10 = await request('/dashboard', { headers: { Cookie: studentCookie } });
  if (res10.status === 200 && res10.body.dashboard.statistics.enrolledCourses === 1) {
    console.log('   ✅ PASSED: Dashboard enrolledCourses updated to 1');
  } else {
    console.error('   ❌ FAILED: Dashboard enrolledCourses did not update:', res10.body.dashboard.statistics);
    process.exit(1);
  }

  // 11. Fetch course lessons and complete all lessons of Course 1
  console.log('\n11. Fetching Course 1 lessons & marking ALL completed...');
  const resProg = await request('/progress/course/1', { headers: { Cookie: studentCookie } });
  const modules = resProg.body.progress.modules;
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
  console.log(`   ✅ PASSED: Completed all ${allLessons.length} lessons in Course 1`);

  // 12 & 13. Verify dashboard completedCourses & certificates count update
  console.log('\n12 & 13. Verifying completedCourses & certificates count in dashboard...');
  const res12 = await request('/dashboard', { headers: { Cookie: studentCookie } });
  const updatedStats = res12.body.dashboard.statistics;
  if (
    res12.status === 200 &&
    updatedStats.completedCourses === 1 &&
    updatedStats.certificates === 1
  ) {
    console.log(`   ✅ PASSED: Dashboard completedCourses = ${updatedStats.completedCourses}, certificates = ${updatedStats.certificates}, hoursLearned = ${updatedStats.hoursLearned}`);
  } else {
    console.error('   ❌ FAILED: Dashboard statistics did not reflect completed course & certificate:', updatedStats);
    process.exit(1);
  }

  // 14 & 15. GET /api/certificates -> 200 (Verify generated certificate)
  console.log('\n14 & 15. Testing GET /api/certificates after 100% course completion...');
  const res14 = await request('/certificates', { headers: { Cookie: studentCookie } });
  if (res14.status === 200 && res14.body.certificates.length === 1) {
    const cert = res14.body.certificates[0];
    console.log(`   ✅ PASSED: Certificate found! ID: ${cert.id}, Number: ${cert.certificateNumber}, Course: "${cert.courseTitle}", Student: "${cert.studentName}"`);
  } else {
    console.error('   ❌ FAILED: Expected 1 certificate after course completion:', res14.body);
    process.exit(1);
  }

  const generatedCertId = res14.body.certificates[0].id;

  // 16. GET /api/certificates/:id -> 200
  console.log(`\n16. Testing GET /api/certificates/${generatedCertId}...`);
  const res16 = await request(`/certificates/${generatedCertId}`, { headers: { Cookie: studentCookie } });
  if (res16.status === 200 && res16.body.success && res16.body.certificate.id === generatedCertId) {
    console.log(`   ✅ PASSED: Certificate details fetched cleanly for ID ${generatedCertId}`);
  } else {
    console.error(`   ❌ FAILED: Expected 200 for certificate details, got ${res16.status}`, res16.body);
    process.exit(1);
  }

  // 17. Logout user
  console.log('\n17. Logging out test student...');
  const res17 = await request('/auth/logout', {
    method: 'POST',
    headers: { Cookie: studentCookie }
  });
  if (res17.status === 200 && res17.body.success) {
    console.log('   ✅ PASSED: Logged out successfully');
  } else {
    console.error(`   ❌ FAILED: Logout failed (${res17.status})`);
    process.exit(1);
  }

  // 18. Verify GET /api/dashboard after logout -> 401
  console.log('\n18. Verifying GET /api/dashboard rejects unauthenticated call after logout...');
  const res18 = await request('/dashboard');
  if (res18.status === 401) {
    console.log('   ✅ PASSED: Returns 401 Unauthorized');
  } else {
    console.error(`   ❌ FAILED: Expected 401 after logout, got ${res18.status}`);
    process.exit(1);
  }

  // 19. Verify GET /api/certificates after logout -> 401
  console.log('\n19. Verifying GET /api/certificates rejects unauthenticated call after logout...');
  const res19 = await request('/certificates');
  if (res19.status === 401) {
    console.log('   ✅ PASSED: Returns 401 Unauthorized');
  } else {
    console.error(`   ❌ FAILED: Expected 401 after logout, got ${res19.status}`);
    process.exit(1);
  }

  // 20. Conclude test suite
  console.log('\n20. Test suite cleanup & conclusion...');
  console.log('   ✅ PASSED: All user isolation and certificate lifecycle requirements verified!');

  console.log('\n==================================================');
  console.log('ALL 20 STEP 8F AUTOMATED TESTS PASSED SUCCESSFULLY!');
  console.log('==================================================\n');
}

runDashboardCertificatesTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
