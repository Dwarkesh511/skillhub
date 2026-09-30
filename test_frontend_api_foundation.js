import { getHealth, getCategories } from './src/services/index.js';

async function verifyFrontendApiFoundation() {
  console.log('==================================================');
  console.log('🧪 TESTING FRONTEND API FOUNDATION (STEP 8A)');
  console.log('==================================================\n');

  try {
    console.log('1️⃣ Testing getHealth()...');
    const health = await getHealth();
    console.log('   Response:', JSON.stringify(health));
    if (!health.success || health.message !== 'SkillHub backend is running') {
      throw new Error('Health API verification failed');
    }
    console.log('   ✅ getHealth() SUCCESS!');

    console.log('\n2️⃣ Testing getCategories()...');
    const categoriesRes = await getCategories();
    console.log(`   Response: success=${categoriesRes.success}, categories count=${categoriesRes.categories?.length}`);
    if (!categoriesRes.success || !Array.isArray(categoriesRes.categories) || categoriesRes.categories.length === 0) {
      throw new Error('Categories API verification failed');
    }
    console.log('   ✅ getCategories() SUCCESS!');

    console.log('\n==================================================');
    console.log('🎉 FRONTEND API FOUNDATION VERIFICATION PASSED!');
    console.log('==================================================\n');
  } catch (error) {
    console.error('❌ Verification failed with error:', error);
    process.exit(1);
  }
}

verifyFrontendApiFoundation();
