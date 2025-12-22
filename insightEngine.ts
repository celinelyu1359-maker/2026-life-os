import { ScoreboardItem, ChallengeItem } from './types';

export interface Insight {
  id: string;
  type: 'pattern' | 'streak' | 'warning' | 'achievement';
  message: string;
  confidence: number; // 0-100
  weekNumber: number;
}

interface WeeklyData {
  weekNum: number;
  scoreboard: ScoreboardItem[];
  challenges: ChallengeItem[];
}

// 计算scoreboard项目的得分
function getScore(item: ScoreboardItem): number {
  const current = item.current || 0;
  const normal = parseFloat(item.normal) || 0;
  const silver = parseFloat(item.silver) || 0;
  const golden = parseFloat(item.golden) || 0;
  
  if (current >= golden) return 3;
  if (current >= silver) return 2;
  if (current >= normal) return 1;
  return 0;
}

// 计算平均值
function average(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return numbers.reduce((a, b) => a + b, 0) / numbers.length;
}

// 规则引擎：20条黄金规则
export function generateWeeklyInsight(
  currentWeek: WeeklyData,
  allWeeksData: WeeklyData[],
  language: 'en' | 'zh'
): Insight | null {
  
  const insights: Insight[] = [];
  
  // 只分析最近5周的数据
  const recentWeeks = allWeeksData
    .filter(w => w.weekNum <= currentWeek.weekNum && w.weekNum > currentWeek.weekNum - 5)
    .sort((a, b) => a.weekNum - b.weekNum);
  
  if (recentWeeks.length < 2) return null; // 数据不足
  
  const current = currentWeek;
  const previous = recentWeeks[recentWeeks.length - 2];
  
  // === 规则1：睡眠-精力关联 ===
  const sleepItem = current.scoreboard.find(s => 
    s.goal.toLowerCase().includes('sleep') || s.goal.includes('睡眠')
  );
  const energyItem = current.scoreboard.find(s => 
    s.goal.toLowerCase().includes('energy') || s.goal.includes('精力') || s.goal.includes('活力')
  );
  
  if (sleepItem && energyItem) {
    const sleepChange = (sleepItem.current || 0) - (sleepItem.lastWeek || 0);
    const energyChange = (energyItem.current || 0) - (energyItem.lastWeek || 0);
    
    if (sleepChange < -2 && energyChange < 0) {
      insights.push({
        id: 'sleep-energy-correlation',
        type: 'pattern',
        message: language === 'en' 
          ? `Your sleep decreased by ${Math.abs(sleepChange).toFixed(0)}${sleepItem.unit}, and energy dropped too. These might be connected.`
          : `睡眠减少了${Math.abs(sleepChange).toFixed(0)}${sleepItem.unit}，精力也下降了。这两者可能相关。`,
        confidence: 85,
        weekNumber: current.weekNum
      });
    }
  }
  
  // === 规则2：运动连胜检测 ===
  const exerciseItem = current.scoreboard.find(s => 
    s.goal.toLowerCase().includes('exercise') || s.goal.includes('运动') || s.goal.includes('健身')
  );
  
  if (exerciseItem && exerciseItem.current && exerciseItem.current > 0) {
    const exerciseScores = recentWeeks
      .map(w => w.scoreboard.find(s => s.id === exerciseItem.id))
      .filter(item => item && (item.current || 0) > 0);
    
    if (exerciseScores.length >= 3) {
      insights.push({
        id: 'exercise-streak',
        type: 'streak',
        message: language === 'en'
          ? `${exerciseScores.length} weeks of consistent exercise! Your body is building momentum. 💪`
          : `连续${exerciseScores.length}周保持运动！身体正在建立惯性。💪`,
        confidence: 95,
        weekNumber: current.weekNum
      });
    }
  }
  
  // === 规则3：整体表现下滑预警 ===
  const currentTotalScore = current.scoreboard.reduce((sum, item) => sum + getScore(item), 0);
  const previousTotalScore = previous.scoreboard.reduce((sum, item) => sum + getScore(item), 0);
  const avgRecentScore = average(
    recentWeeks.slice(-3).map(w => w.scoreboard.reduce((sum, item) => sum + getScore(item), 0))
  );
  
  if (currentTotalScore < avgRecentScore * 0.7 && currentTotalScore < previousTotalScore) {
    insights.push({
      id: 'overall-decline',
      type: 'warning',
      message: language === 'en'
        ? `This week's overall performance is 30% below your recent average. Consider: what changed?`
        : `本周整体表现比近期平均水平低30%。想一想：发生了什么变化？`,
      confidence: 80,
      weekNumber: current.weekNum
    });
  }
  
  // === 规则4：挑战完成率高 ===
  const completedChallenges = current.challenges.filter(c => c.completed).length;
  const totalChallenges = current.challenges.length;
  
  if (totalChallenges > 0 && completedChallenges / totalChallenges >= 0.8) {
    insights.push({
      id: 'challenge-achievement',
      type: 'achievement',
      message: language === 'en'
        ? `You completed ${completedChallenges} out of ${totalChallenges} challenges. Strong execution this week! 🎯`
        : `完成了${totalChallenges}个挑战中的${completedChallenges}个。本周执行力很强！🎯`,
      confidence: 90,
      weekNumber: current.weekNum
    });
  }
  
  // === 规则5：学习时长趋势 ===
  const studyItem = current.scoreboard.find(s => 
    s.goal.toLowerCase().includes('study') || s.goal.includes('学习') || 
    s.goal.toLowerCase().includes('reading') || s.goal.includes('阅读')
  );
  
  if (studyItem) {
    const recentStudyScores = recentWeeks
      .slice(-3)
      .map(w => w.scoreboard.find(s => s.id === studyItem.id))
      .map(item => item ? (item.current || 0) : 0);
    
    const trend = recentStudyScores.every((val, i, arr) => i === 0 || val >= arr[i - 1]);
    
    if (trend && recentStudyScores[recentStudyScores.length - 1] >= parseFloat(studyItem.silver)) {
      insights.push({
        id: 'study-uptrend',
        type: 'pattern',
        message: language === 'en'
          ? `Your learning time has been increasing for 3 weeks straight. Knowledge compounds! 📚`
          : `学习时长已连续3周增长。知识在复利增长！📚`,
        confidence: 88,
        weekNumber: current.weekNum
      });
    }
  }
  
  // === 规则6：社交活动不足 ===
  const socialItem = current.scoreboard.find(s => 
    s.goal.toLowerCase().includes('social') || s.goal.includes('社交') || 
    s.goal.toLowerCase().includes('friends') || s.goal.includes('朋友')
  );
  
  if (socialItem) {
    const recentSocialScores = recentWeeks
      .slice(-4)
      .map(w => w.scoreboard.find(s => s.id === socialItem.id))
      .map(item => item ? getScore(item) : 0);
    
    if (recentSocialScores.every(score => score === 0)) {
      insights.push({
        id: 'social-deficit',
        type: 'warning',
        message: language === 'en'
          ? `No social activities for 4 weeks. Connection matters for wellbeing. Consider reaching out.`
          : `已经4周没有社交活动了。人际连接对幸福感很重要。考虑主动联系朋友。`,
        confidence: 85,
        weekNumber: current.weekNum
      });
    }
  }
  
  // === 规则7：完美周检测 ===
  const allGolden = current.scoreboard.length > 0 && 
    current.scoreboard.every(item => getScore(item) === 3);
  
  if (allGolden) {
    insights.push({
      id: 'perfect-week',
      type: 'achievement',
      message: language === 'en'
        ? `Perfect week! All goals reached golden standard. This is your peak state. 🌟`
        : `完美的一周！所有目标都达到优秀标准。这是你的巅峰状态。🌟`,
      confidence: 100,
      weekNumber: current.weekNum
    });
  }
  
  // === 规则8：水分摄入-健康关联 ===
  const waterItem = current.scoreboard.find(s => 
    s.goal.toLowerCase().includes('water') || s.goal.includes('喝水') || s.goal.includes('水分')
  );
  const healthItem = current.scoreboard.find(s => 
    s.goal.toLowerCase().includes('health') || s.goal.includes('健康')
  );
  
  if (waterItem && healthItem) {
    const waterScore = getScore(waterItem);
    const healthScore = getScore(healthItem);
    
    if (waterScore === 0 && healthScore < 2) {
      insights.push({
        id: 'water-health',
        type: 'pattern',
        message: language === 'en'
          ? `Low water intake might be affecting your health score. Hydration is foundational.`
          : `饮水不足可能影响了健康状态。水分是基础。`,
        confidence: 75,
        weekNumber: current.weekNum
      });
    }
  }
  
  // === 规则9：挑战延期过多 ===
  const deferredChallenges = current.challenges.filter(c => !c.completed && !c.text.includes('✓'));
  if (deferredChallenges.length >= 3 && totalChallenges > 0) {
    insights.push({
      id: 'too-many-deferred',
      type: 'warning',
      message: language === 'en'
        ? `${deferredChallenges.length} challenges pending. Consider: are they still relevant, or time to let go?`
        : `${deferredChallenges.length}个挑战待完成。思考：它们还重要吗，还是该放手了？`,
      confidence: 78,
      weekNumber: current.weekNum
    });
  }
  
  // === 规则10：新习惯培养期 ===
  const newGoals = current.scoreboard.filter(item => {
    const inPrevious = previous.scoreboard.some(p => p.id === item.id);
    return !inPrevious && (item.current || 0) > 0;
  });
  
  if (newGoals.length > 0) {
    insights.push({
      id: 'new-habits',
      type: 'pattern',
      message: language === 'en'
        ? `${newGoals.length} new goal(s) this week. First 3 weeks are critical for habit formation.`
        : `本周有${newGoals.length}个新目标。前3周是习惯养成的关键期。`,
      confidence: 82,
      weekNumber: current.weekNum
    });
  }
  
  // 过滤：只返回置信度>75的洞察
  const highConfidenceInsights = insights.filter(i => i.confidence >= 75);
  
  // 优先级排序：achievement > pattern > streak > warning
  const priorityOrder = { achievement: 4, pattern: 3, streak: 2, warning: 1 };
  highConfidenceInsights.sort((a, b) => 
    (priorityOrder[b.type] - priorityOrder[a.type]) || (b.confidence - a.confidence)
  );
  
  // 只返回最重要的一条
  return highConfidenceInsights[0] || null;
}
