# CTAP People Platform — Full Systems Audit
**Date:** May 5, 2026, 8:20 AM CDT
**Duration:** 2 hours (target completion 10:20 AM)
**Method:** Button-by-button, screen-by-screen manual testing

---

## Phase 1: Splash Screen & Login Flow

### 1.1 Splash Screen
- [ ] Splash renders on load
- [ ] Logo displays correctly
- [ ] "Community Tap & Pizza" text visible
- [ ] "Fort Dodge, Iowa" subtitle visible
- [ ] "Powered by Never 86'd" footer visible
- [ ] Tap/click anywhere advances to login

### 1.2 PIN Pad Login
- [ ] PIN pad renders with digits 1-9, 0, backspace
- [ ] Each digit press fills a dot (4 dots total)
- [ ] Backspace removes last digit
- [ ] Wrong PIN shows error state
- [ ] Correct PIN (8686) logs in as Mychael
- [ ] Session cookie is set after login
- [ ] Session persists on page reload

### 1.3 Department Filter
- [ ] "All" shows all staff
- [ ] "Management" shows only management staff
- [ ] "Bar" shows only bar staff
- [ ] "Kitchen Line" shows only kitchen staff
- [ ] "Expo" shows only expo staff
- [ ] "Pizza" shows only pizza staff
- [ ] Staff count changes per department
- [ ] Staff names are correct per department

### 1.4 Staff List Click (Security)
- [ ] Clicking a staff name does NOT bypass PIN
- [ ] Toast message appears saying to enter PIN

---

## Phase 2: Welcome/Briefing & Home Screen

### 2.1 Welcome Screen
- [ ] Shows "HEY [NAME]" greeting
- [ ] "See Today's Briefing" button works
- [ ] Briefing content loads (86'd items, schedule, etc.)
- [ ] "Let's Go" button advances to home

### 2.2 Home Screen Layout
- [ ] Clock In/Out status displays correctly
- [ ] 86'd alert banner shows if items are 86'd
- [ ] Checklists progress shows (X/Y)
- [ ] All quick action buttons render
- [ ] Manager-only buttons visible for manager role
- [ ] Staff-only buttons visible for staff role

---

## Phase 3: Clock In/Out & Checklists

### 3.1 Clock In/Out
- [ ] Clock In button works when not clocked in
- [ ] Status changes to "Clocked In" with timestamp
- [ ] Clock Out button appears after clocking in
- [ ] Clock Out works and status reverts
- [ ] Network request succeeds (200)
- [ ] Data persists on page reload

### 3.2 Checklists
- [ ] Checklist screen loads with all items
- [ ] Items grouped by category/station
- [ ] Checking an item sends network request
- [ ] Item visually marks as complete
- [ ] Progress counter updates (e.g., 1/8)
- [ ] Unchecking an item works
- [ ] All items can be completed
- [ ] Completion state persists on reload

---

## Phase 4: Command Center

### 4.1 Metrics Display
- [ ] Yesterday Sales total shows
- [ ] Pay Outs total shows
- [ ] Voids count shows
- [ ] Active Staff count shows
- [ ] Vendor Spend shows
- [ ] Open Issues count shows

### 4.2 Wi-Fi Proximity
- [ ] Staff list shows with ON FLOOR / OFF status
- [ ] Correct staff members listed

### 4.3 Quick Actions
- [ ] Pay Outs button navigates to store-run screen
- [ ] Voids button works
- [ ] Invoices button works
- [ ] Security button works
- [ ] Yesterday Sales button works
- [ ] Z-Report button works

---

## Phase 5: Sales Intelligence

### 5.1 Daily Tab
- [ ] Shows today's date or most recent data
- [ ] Revenue, orders, avg ticket display
- [ ] Category breakdown (food, beer, liquor)
- [ ] Channel breakdown (dine-in, delivery, etc.)

### 5.2 Weekly Tab
- [ ] Shows week-over-week comparison
- [ ] Revenue totals per week
- [ ] % change badges display
- [ ] Labor % shows
- [ ] Category breakdown per week

### 5.3 Product Mix Tab
- [ ] Items listed with quantities
- [ ] Sorted by popularity or revenue

### 5.4 Voids Tab
- [ ] Void entries listed
- [ ] Shows reason, amount, who voided

### 5.5 Weather Tab
- [ ] Weather data displays
- [ ] Correlation with sales shown

### 5.6 Hours Tab
- [ ] Labor hours by department
- [ ] Overtime flagged if applicable

### 5.7 Alerts Tab
- [ ] Any active alerts display
- [ ] Alert severity indicated

### 5.8 Schedule Tab
- [ ] Schedule data shows
- [ ] Shift coverage visible

---

## Phase 6: Forecast, Recipes, SKU, Order Guide

### 6.1 Forecast Screen
- [ ] Forecast data renders
- [ ] Day-by-day predictions show
- [ ] Weather integration visible

### 6.2 Recipes & Cost Screen
- [ ] Recipe list loads
- [ ] Individual recipe detail accessible
- [ ] Cost breakdown shows
- [ ] Ingredients listed

### 6.3 SKU Tracker
- [ ] SKU list loads
- [ ] Search/filter works
- [ ] Par levels shown
- [ ] Reorder alerts visible

### 6.4 Order Guide
- [ ] Vendor products listed
- [ ] Grouped by category
- [ ] PAR levels shown
- [ ] Order frequency indicated

---

## Phase 7: Communication Screens

### 7.1 Schedule Screen
- [ ] Weekly schedule renders
- [ ] Staff shifts visible
- [ ] Current day highlighted

### 7.2 Shift Handoff
- [ ] Handoff form renders
- [ ] Can enter notes
- [ ] Submit works

### 7.3 Station Broadcast
- [ ] Broadcast form renders
- [ ] Can select station
- [ ] Can type message
- [ ] Send works

### 7.4 Report Issue
- [ ] Issue form renders
- [ ] Category selection works
- [ ] Description field works
- [ ] Photo upload option available
- [ ] Submit works

### 7.5 Feedback
- [ ] Feedback form renders
- [ ] Rating/type selection works
- [ ] Text input works
- [ ] Submit works

---

## Phase 8: Ask Brain & Training

### 8.1 Ask Brain — Question Testing
- [ ] Q1: "What is the fryer temp?"
- [ ] Q2: "What is the bar till policy?"
- [ ] Q3: "How do I calculate food cost?"
- [ ] Q4: "What items are 86'd?"
- [ ] Q5: "What is the vaping policy?"
- [ ] Q6: "How do I open the cash drawer?"
- [ ] Q7: "What is prime cost?"
- [ ] Q8: "What are the closing manager expectations?"
- [ ] Q9: "Can I stack discounts?"
- [ ] Q10: "What is pour cost?"
- [ ] Q11: "When do tabs need to be started?"
- [ ] Q12: "What happens if I'm in the till without a sale?"

### 8.2 Ask Brain — UI
- [ ] Input field works
- [ ] Submit button works
- [ ] Loading state shows while waiting
- [ ] Answer renders with markdown
- [ ] Source count shows
- [ ] Suggested questions clickable
- [ ] Station filter changes suggestions

### 8.3 POS Training
- [ ] Training modules list
- [ ] Individual module content loads
- [ ] Progress tracking works

### 8.4 86'd Alerts
- [ ] Current 86'd items display
- [ ] Can add new 86'd item
- [ ] Can remove/restore item
- [ ] Timestamp shows

### 8.5 Waste Log
- [ ] Waste log form renders
- [ ] Can enter item, quantity, reason
- [ ] Submit works
- [ ] History shows previous entries

---

## Phase 9: Gamification

### 9.1 Missions
- [ ] Active missions display
- [ ] Progress bars show
- [ ] Mission details accessible

### 9.2 Badges
- [ ] Earned badges display
- [ ] Locked badges shown differently
- [ ] Badge details accessible

### 9.3 Rewards
- [ ] Available rewards listed
- [ ] Point cost shown
- [ ] Redeem button works (or shows insufficient points)

### 9.4 Leaderboard
- [ ] Staff ranked by points
- [ ] Current user highlighted
- [ ] Department filter works

---

## Phase 10: Profile & Misc

### 10.1 Profile
- [ ] Staff info displays (name, role, department)
- [ ] Stats show (shifts, points, badges)
- [ ] Edit capability if applicable

### 10.2 Intel Briefings
- [ ] Briefing content loads
- [ ] Historical briefings accessible

### 10.3 Store Runs
- [ ] Form renders (description, amount, location, category)
- [ ] Category buttons work
- [ ] Authorized by dropdown works
- [ ] Receipt photo upload works
- [ ] Submit works
- [ ] History shows previous runs

### 10.4 Compliance
- [ ] Compliance items listed
- [ ] Status indicators show
- [ ] Detail view accessible

### 10.5 Bottom Navigation
- [ ] Home button navigates to home from any screen
- [ ] Rank button navigates to leaderboard
- [ ] Brain button navigates to Ask Brain
- [ ] Profile button navigates to profile
- [ ] Active state highlights current page

---

## Bugs Found

| # | Screen | Severity | Description | Status |
|---|--------|----------|-------------|--------|
| 1 | | | | |

---

## Summary

**Total Buttons/Interactions Tested:** 
**Passed:** 
**Failed:** 
**Bugs Found:** 
**Time Spent:** 
