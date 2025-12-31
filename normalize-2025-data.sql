-- =============================================
-- Normalize 2025 records for cross-year mapping
-- Run in Supabase SQL editor (one-time maintenance)
-- Ensures December 2025 and Week 52 are labeled as 2025.
-- =============================================

-- 1) Dashboard: set year=2025 for week 52 mistakenly labeled 2026
UPDATE public.dashboard_data
SET year = 2025
WHERE week_num = 52 AND year = 2026;

-- 2) Monthly Goals: set year=2025 for month_index=0 (December 2025) mistakenly labeled 2026
UPDATE public.monthly_goals
SET year = 2025
WHERE month_index = 0 AND year = 2026;

-- 3) Optional: Verify results by counts per year
SELECT 'dashboard_data' AS table, year, COUNT(*)
FROM public.dashboard_data
GROUP BY year
ORDER BY year;

SELECT 'monthly_goals' AS table, year, COUNT(*)
FROM public.monthly_goals
GROUP BY year
ORDER BY year;
