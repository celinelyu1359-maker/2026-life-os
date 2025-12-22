# 2026 Life OS - Design System

## 📐 Typography System

### Font Families
```css
- Primary (Body): Inter (Sans-serif)
- Headings: Playfair Display (Serif)  
- Code/Mono: Courier Prime (Monospace)
```

### Font Size Scale
```
text-xs:   12px (0.75rem)   - 小标签、辅助信息
text-sm:   14px (0.875rem)  - 用户输入内容、正文
text-base: 16px (1rem)      - 小标题
text-lg:   18px (1.125rem)  - 二级标题
text-xl:   20px (1.25rem)   - 一级标题（小）
text-2xl:  24px (1.5rem)    - 一级标题
text-3xl:  30px (1.875rem)  - 页面主标题
text-4xl:  36px (2.25rem)   - 大标题
```

### Current Issues Found
1. ❌ Inconsistent sizes: text-[9px], text-[10px], text-[11px] 
2. ❌ Mixed font usage without clear hierarchy
3. ❌ User input data varies between xs, sm, and custom sizes

## ✅ Proposed Standard

### Headings
- Page Title: `font-serif text-3xl md:text-4xl font-bold text-slate-900`
- Section Title: `font-serif text-lg font-bold text-slate-900`
- Card Title: `font-serif text-base font-bold text-slate-900`

### Body Text
- Primary Content: `text-sm font-light text-slate-700`
- User Input: `text-sm font-light text-slate-800`
- Meta Info: `text-xs text-slate-500`
- Labels: `text-xs font-medium text-slate-600 uppercase tracking-wider`

### Special
- Code/Data: `font-mono text-xs text-slate-600`
- Quotes/Notes: `font-typewriter text-sm italic text-slate-600`

## 🎨 Color System

### Text Colors
- Primary: text-slate-900 (标题、重要文本)
- Secondary: text-slate-700 (正文内容)
- Tertiary: text-slate-500 (辅助信息)
- Disabled: text-slate-400 (禁用状态)
- Placeholder: text-slate-300

### Background Colors
- Page: bg-[#f8fafc]
- Paper: bg-[#FDFCF6]
- Card: bg-white
- Input: bg-slate-50
- Disabled: bg-slate-100

## 📏 Spacing System

### Padding
- xs: p-2 (8px)
- sm: p-3 (12px)
- md: p-4 (16px)
- lg: p-5 (20px)
- xl: p-6 (24px)

### Gap
- xs: gap-1 (4px)
- sm: gap-2 (8px)
- md: gap-3 (12px)
- lg: gap-4 (16px)

## 🔘 Components Standards

### Buttons
- Primary: `bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-700`
- Secondary: `bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50`
- Icon Button: `p-2 text-slate-400 hover:text-slate-900 rounded-lg transition-colors`

### Inputs
- Text Input: `bg-slate-50 border border-slate-200 text-sm px-3 py-2 rounded-lg focus:ring-2 focus:ring-slate-400`
- Textarea: Same as text input + `min-h-[100px]`

### Cards
- Default: `bg-white rounded-xl border border-slate-100 p-5 shadow-sm`
- Hover: Add `hover:shadow-md transition-shadow`
