// ========================================
// 🧹 清理旧的全局 localStorage 数据
// ========================================
// 在浏览器控制台运行这段代码，清除残留的全局数据
// 
// 使用方法：
// 1. 打开你的应用 (http://localhost:5173)
// 2. 打开浏览器开发者工具 (F12)
// 3. 切换到 Console 标签
// 4. 复制粘贴这整段代码，按回车
// ========================================

(function cleanupOldLocalStorage() {
  console.log('🧹 Starting cleanup of old localStorage keys...');
  
  const oldKeys = [
    'monthly-themes-2026',  // 旧的全局主题 key
    'monthly-goals-2026',   // 旧的全局目标 key (如果存在)
  ];
  
  let cleaned = 0;
  
  oldKeys.forEach(key => {
    if (localStorage.getItem(key)) {
      console.log(`  ❌ Removing: ${key}`);
      localStorage.removeItem(key);
      cleaned++;
    }
  });
  
  if (cleaned > 0) {
    console.log(`✅ Cleanup complete! Removed ${cleaned} old key(s).`);
    console.log('💡 Please refresh the page to reload data from Supabase.');
  } else {
    console.log('✅ No old keys found. Your localStorage is clean!');
  }
  
  // 显示当前用户专属的 keys
  console.log('\n📊 Current user-specific localStorage keys:');
  Object.keys(localStorage).forEach(key => {
    if (key.includes('2026')) {
      console.log(`  ✓ ${key}: ${localStorage.getItem(key)?.substring(0, 50)}...`);
    }
  });
})();
