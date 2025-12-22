// =========================================
// 🔍 前端数据隔离诊断工具
// =========================================
// 在浏览器 Console 运行这段代码来诊断数据串号问题
// 
// 使用方法：
// 1. 登录账号 A → F12 打开 Console → 粘贴运行 → 记录 User ID
// 2. 隐身模式登录账号 B → F12 → 粘贴运行 → 对比 User ID
// 3. 检查是否能看到对方的数据
// =========================================

(async function diagnoseDataIsolation() {
  console.log('🔍 Starting data isolation diagnostic...\n');
  
  // 1. 检查 Supabase 连接
  console.log('📡 Supabase Connection:');
  try {
    const { supabase } = await import('./supabaseClient.js');
    console.log('  ✅ Supabase client loaded');
    
    // 2. 获取当前用户
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('  ❌ Auth error:', authError);
      return;
    }
    
    if (!user) {
      console.log('  ⚠️ No user logged in');
      return;
    }
    
    console.log(`  ✅ Current User ID: ${user.id}`);
    console.log(`  📧 Email: ${user.email}`);
    
    // 3. 检查 localStorage
    console.log('\n💾 LocalStorage Keys:');
    Object.keys(localStorage).forEach(key => {
      if (key.includes('2026')) {
        const value = localStorage.getItem(key);
        const preview = value ? value.substring(0, 100) : '(empty)';
        console.log(`  ${key}: ${preview}...`);
      }
    });
    
    // 4. 查询 monthly_goals（应该只返回当前用户的数据）
    console.log('\n📊 Monthly Goals Query (should only show YOUR data):');
    const { data: goalsData, error: goalsError } = await supabase
      .from('monthly_goals')
      .select('*')
      .eq('year', 2026);
    
    if (goalsError) {
      console.error('  ❌ Query error:', goalsError);
    } else {
      console.log(`  Total records: ${goalsData.length}`);
      
      // 统计 user_id
      const userIds = [...new Set(goalsData.map(row => row.user_id))];
      console.log(`  Unique user_ids: ${userIds.length}`);
      
      if (userIds.length > 1) {
        console.error('  ❌❌❌ SECURITY ISSUE: You can see multiple users\' data!');
        console.error('  User IDs visible:', userIds);
      } else if (userIds.length === 1 && userIds[0] === user.id) {
        console.log('  ✅ GOOD: Only your data is visible');
      } else if (userIds.length === 1 && userIds[0] !== user.id) {
        console.error('  ❌ WEIRD: You can see someone else\'s data but not yours!');
        console.error('  Visible user_id:', userIds[0]);
        console.error('  Your user_id:', user.id);
      }
      
      // 显示每条记录
      goalsData.forEach(row => {
        const isMine = row.user_id === user.id;
        const icon = isMine ? '✅' : '❌';
        const goalCount = Array.isArray(row.goals) ? row.goals.length : 0;
        console.log(`  ${icon} Month ${row.month_index}: ${goalCount} goals, theme: ${row.theme || '(none)'}, user: ${row.user_id.substring(0, 8)}...`);
      });
    }
    
    // 5. 查询 dashboard_data
    console.log('\n📈 Dashboard Data Query (should only show YOUR data):');
    const { data: dashboardData, error: dashError } = await supabase
      .from('dashboard_data')
      .select('*')
      .eq('year', 2026);
    
    if (dashError) {
      console.error('  ❌ Query error:', dashError);
    } else {
      console.log(`  Total records: ${dashboardData.length}`);
      const userIds = [...new Set(dashboardData.map(row => row.user_id))];
      console.log(`  Unique user_ids: ${userIds.length}`);
      
      if (userIds.length > 1) {
        console.error('  ❌❌❌ SECURITY ISSUE: Dashboard data is leaking!');
      } else if (userIds.length === 1 && userIds[0] === user.id) {
        console.log('  ✅ GOOD: Only your data is visible');
      }
    }
    
    // 6. 总结
    console.log('\n📋 Summary:');
    console.log(`  Current User: ${user.email} (${user.id})`);
    console.log(`  Monthly Goals: ${goalsData?.length || 0} records`);
    console.log(`  Dashboard Data: ${dashboardData?.length || 0} records`);
    
    const goalsUserIds = [...new Set(goalsData?.map(row => row.user_id) || [])];
    const dashUserIds = [...new Set(dashboardData?.map(row => row.user_id) || [])];
    
    if (goalsUserIds.length === 1 && goalsUserIds[0] === user.id &&
        dashUserIds.length === 1 && dashUserIds[0] === user.id) {
      console.log('\n✅✅✅ EXCELLENT: Data isolation is working correctly!');
    } else {
      console.error('\n❌❌❌ PROBLEM DETECTED: Data isolation is NOT working!');
      console.error('Action required: Run fix-rls-security.sql in Supabase SQL Editor');
    }
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
  }
})();
