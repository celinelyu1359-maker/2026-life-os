import { Language } from './types';

export function getWeekRange(year: number, weekNumber: number, language: Language = 'en') {
  const simple = new Date(year, 0, 1 + (weekNumber - 1) * 7);
  const dayOfWeek = simple.getDay();
  const ISOweekStart = simple;
  if (dayOfWeek <= 4)
      ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
  else
      ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
  
  const end = new Date(ISOweekStart);
  end.setDate(ISOweekStart.getDate() + 6);
  
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const locale = language === 'zh' ? 'zh-CN' : 'en-US';
  return `${ISOweekStart.toLocaleDateString(locale, options)} - ${end.toLocaleDateString(locale, options)}`;
}

export function getWeeksInMonth(year: number, monthIndex: number, language: Language = 'en') {
  const weeks = [];
  const firstDay = new Date(year, monthIndex, 1);
  const lastDay = new Date(year, monthIndex + 1, 0);
  
  // Very rough estimation of week numbers for the UI display
  // In a production app, use a library like date-fns
  let current = new Date(firstDay);
  
  // Adjust to Monday
  const day = current.getDay() || 7;
  if (day !== 1) current.setHours(-24 * (day - 1));

  let startWeekNum = Math.ceil((((current.getTime() - new Date(year, 0, 1).getTime()) / 86400000) + 1) / 7);
  
  // Generate 4-5 weeks
  for(let i=0; i<5; i++) {
     const wNum = startWeekNum + i;
     if (wNum > 52) break; // Simplified
     if (wNum < 1) continue; // Skip Week 0 and negative weeks
     weeks.push({
        weekNum: wNum,
        range: getWeekRange(year, wNum, language)
     });
  }
  return weeks;
}

export function getTodayDateString() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

export function formatNiceDate(dateStr: string, language: Language = 'en') {
    const d = new Date(dateStr);
    const locale = language === 'zh' ? 'zh-CN' : 'en-US';
    return d.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' });
}

// ✅ 新增函数：获取当前的周数 (使用 ISO 8601 规则)
export function getCurrentWeekNumber(year: number = 2026): number {
    const now = new Date();
    
    // 1. 如果不在规划年份 (2026)
    if (now.getFullYear() !== year) {
        if (now.getFullYear() > year) return 52; // 例如：在 2027 年看 2026 年，默认显示去年底
        if (now.getFullYear() < year) return 1;  // 例如：在 2025 年看 2026 年，默认显示第 1 周
    }
    
    const date = new Date(now.getTime());
    date.setHours(0, 0, 0, 0);

    // 2. ISO 周数计算：将日期设置为当前周的周四（周四决定周数）
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    
    // 3. 找到当年第一个周四的日期 (总是 Week 1)
    const yearStartThursday = new Date(date.getFullYear(), 0, 4);
    yearStartThursday.setDate(yearStartThursday.getDate() + 3 - (yearStartThursday.getDay() + 6) % 7);

    // 4. 计算周数
    const diffTime = date.getTime() - yearStartThursday.getTime();
    const weekNumber = 1 + Math.round(diffTime / (7 * 24 * 60 * 60 * 1000));

    // 5. 边界保护
    return Math.min(52, Math.max(1, weekNumber));
}