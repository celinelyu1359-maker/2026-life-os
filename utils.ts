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