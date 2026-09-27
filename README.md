BudgetBasics — Student Budgeting Platform
An educational, fully client-side web application that helps university students in Pakistan build practical money habits. BudgetBasics provides interactive budgeting calculators, expense tracking, learning modules, infographics, and a rule-based AI assistant — all without any server, database, or tracking.

Theme: NextGen BudgetBee
Competition: TechWiz 7 — Web Innovation Unleashed
Mentorship: Aptech Computer Education

Table of Contents
Overview

Features

Tech Stack

File Structure

Getting Started

How to Use

Theme System

AI Assistant

Privacy & Disclaimer

Team

Acknowledgements

Overview
BudgetBasics is a single-page application (SPA) designed to simplify personal budgeting for college students. It uses realistic PKR-based campus expense models, transparent calculations, and zero server-side storage. Every calculator, tracker, and quiz runs entirely in the browser — nothing is uploaded or saved to an external database.

Features
Home
Hero image slider with three featured messages.

Live date and real-time clock.

Session-based "Active Learners" counter.

Doughnut chart showing a realistic PKR 45,000 monthly allocation.

Expandable website sitemap.

Learn
Budgeting Basics: Fixed vs variable costs, sample monthly allocation table, and an allocation chart.

Knowledge Check: Interactive quiz with instant feedback.

Needs vs Wants: Visual 3-step decision tree.

Classification Challenge: Mini-game where users classify common student expenses.

50-30-20 Rule: Income input calculator with dynamic doughnut chart.

Common Mistakes: Accordion FAQ covering five predictable money traps and their corrective actions.

Tools
Savings Goal Calculator: Estimates timeline, remaining amount, and progress bar with an encouraging tip.

Session Expense Planner: Add, edit, and delete expense entries; auto-calculates total spent and remaining budget in real time.

Tip Search & Filter: Search, filter by category pills, and sort tips alphabetically or by date.

Student Checklist: Printable monthly checklist of seven essential checkpoints.

Resources
Infographics Gallery: Topic-filtered cards that open a modal with a concept breakdown.

About & Team: Project details and creator credits.

Feedback Form: Validated form with rating and comments.

Contact Us: Validated contact form with a helpdesk information card.

Global
Sticky top navigation with four sections.

Floating AI assistant widget available on every page.

Dark/Light theme toggle.

Responsive layout for mobile and desktop.

Print-friendly stylesheet.

Tech Stack
Layer	Technology
Markup	HTML5 (semantic)
Styling	CSS3 (custom properties replaced with static theme overrides)
Behaviour	JavaScript (ES5-compatible)
Libraries	jQuery 3.7.1, Chart.js 4.4.1
Storage	Browser localStorage (theme preference only)
Backend	None — 100% client-side
File Structure
text
BudgetBasics/
│
├── index.html      Main markup, page sections, modals, AI widget
├── style.css       Complete styling, responsive rules, dark-mode overrides
├── script.js       All interactivity, charts, validation, AI assistant
└── README.md       Project documentation
Getting Started
No build step, no dependencies to install, and no server required.

Download or clone the project folder.

Make sure index.html, style.css, and script.js are in the same directory.

Open index.html in any modern browser (Chrome, Edge, Firefox, Safari).

An internet connection is required on first load to fetch jQuery, Chart.js, and the Unsplash hero images.

How to Use
Use the top navigation to switch between Home, Learn, Tools, and Resources.

Inside Learn, Tools, and Resources, use the tab buttons to open different modules.

Use the Dark Mode / Light Mode button to toggle the theme. Your choice is saved automatically.

Use the Chat button in the bottom-right corner to talk to BudgetAssistant.

Use the Print Checklist button in the Tools section to print or save the checklist as PDF.

Footer links open the Privacy Note and Educational Disclaimer modals.

Theme System
The theme is applied to the <html> element via a data-theme="dark" attribute.

An inline script in the <head> reads the saved preference from localStorage (bb-theme) before first paint to prevent flashing.

If no preference is saved, the app respects the operating system's prefers-color-scheme setting.

Charts re-render their colors automatically when the theme changes.

All colors are hard-coded in CSS with dedicated dark-mode overrides — no CSS variables are used.

AI Assistant
BudgetAssistant is a rule-based chatbot that runs entirely in the browser.

