import { Language } from './types';

export function getWeekRange(year: number, weekNumber: number, language: Language = 'en') {
  // ✅ 使用ISO 8601标准计算周的日期范围
  // ISO Week 1 是包含当年第一个周四的那一周
  
  // 找到该年的第一个周四（Week 1的参考点）
  const jan4 = new Date(year, 0, 4); // 1月4日总是在Week 1中
  const jan4Day = jan4.getDay() || 7; // 周日=7
  const firstMonday = new Date(jan4);
  firstMonday.setDate(jan4.getDate() - jan4Day + 1); // 回到Week 1的周一
  
  // 计算目标周的周一（Week 1的周一 + (weekNumber - 1) * 7天）
  const weekStart = new Date(firstMonday);
  weekStart.setDate(firstMonday.getDate() + (weekNumber - 1) * 7);
  
  // 计算周日
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const locale = language === 'zh' ? 'zh-CN' : 'en-US';
  return `${weekStart.toLocaleDateString(locale, options)} - ${weekEnd.toLocaleDateString(locale, options)}`;
}

export function getWeeksInMonth(year: number, monthIndex: number, language: Language = 'en') {
  // ✅ 只返回真正属于该月的周（至少有部分日期在该月）
  const weeks = [];
  const firstDay = new Date(year, monthIndex, 1);
  const lastDay = new Date(year, monthIndex + 1, 0);
  
  // 2025年只有52周，2026年有52周
  const maxWeek = year === 2025 ? 52 : 52;
  
  // 从 Week 1 开始遍历
  for (let weekNum = 1; weekNum <= maxWeek; weekNum++) {
    // 获取该周的周一和周日
    const jan4 = new Date(year, 0, 4);
    const jan4Day = jan4.getDay() || 7;
    const firstMonday = new Date(jan4);
    firstMonday.setDate(jan4.getDate() - jan4Day + 1);
    
    const weekStart = new Date(firstMonday);
    weekStart.setDate(firstMonday.getDate() + (weekNum - 1) * 7);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    // 检查该周是否与当月有重叠
    // 周的任何一天在该月内，就算属于该月
    const weekIntersectsMonth = (
      (weekStart >= firstDay && weekStart <= lastDay) || // 周一在月内
      (weekEnd >= firstDay && weekEnd <= lastDay) ||     // 周日在月内
      (weekStart < firstDay && weekEnd > lastDay)        // 周跨越整个月
    );
    
    if (weekIntersectsMonth) {
      weeks.push({
        weekNum: weekNum,
        range: getWeekRange(year, weekNum, language)
      });
    }
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

// ✅ 获取当前真实的周数 (使用 ISO 8601 规则)
// 支持2025年和2026年的跨年周数计算
export function getCurrentWeekNumber(targetYear: number = 2026): number {
    const now = new Date();
    const currentYear = now.getFullYear();
    
    // 计算当前日期的实际ISO周数
    const date = new Date(now.getTime());
    date.setHours(0, 0, 0, 0);
    
    // ISO 周数计算：将日期设置为当前周的周四（周四决定周数）
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    
    // 找到实际年份的第一个周四（Week 1）
    const actualYear = date.getFullYear(); // 周四所在的年份
    const yearStartThursday = new Date(actualYear, 0, 4);
    yearStartThursday.setDate(yearStartThursday.getDate() + 3 - (yearStartThursday.getDay() + 6) % 7);
    
    // 计算周数
    const diffTime = date.getTime() - yearStartThursday.getTime();
    const weekNumber = 1 + Math.round(diffTime / (7 * 24 * 60 * 60 * 1000));
    
    // 如果是2025年，最多只有52周
    if (actualYear === 2025) {
        return Math.min(52, weekNumber);
    }
    
    // 如果是2026年，返回周数（1-52范围）
    if (actualYear === 2026) {
        return Math.min(52, Math.max(1, weekNumber));
    }
    
    // 其他年份的默认处理
    if (actualYear > 2026) return 52;
    if (actualYear < 2025) return 1;
    
    return Math.min(52, Math.max(1, weekNumber));
}