

# Rural Education Enhancement System

## Overview
A comprehensive learning management system with two roles: **Educator** and **Student**. Built with React + TypeScript frontend and Supabase backend (database, auth, storage, edge functions).

---

## 1. Authentication & Role Selection
- **Login page** (`/login`) — email + password authentication
- **Signup page** (`/signup`) — email, name, password, role selection (Educator/Student)
- Role-based routing: after login, redirect to appropriate dashboard
- Supabase Auth with profiles table and user_roles table

## 2. Educator Dashboard (`/`)
- **Overview cards**: total courses, total students, content uploaded, pending assignments
- **My Courses list** with quick stats (enrolled students, completion %)
- **Quick action buttons**: Create Course, Upload Content, Create Assignment, Schedule Class
- **Recent activity feed**: latest submissions, new enrollments

## 3. Student Dashboard (`/`)
- **Enrolled courses** with progress bars
- **Upcoming scheduled classes** with notifications
- **Pending assignments** with due dates
- **Daily streak tracker** — green activity heatmap (like GitHub/LeetCode contribution graph)
- **Recent activity feed**

## 4. Course Management
- **Create Course** (`/courses/create`) — title, description, thumbnail, category
- **Course Detail** (`/courses/:id`) — sections with ordered content (videos, PDFs, documents)
- **Section Management** — educators create sections, add content items within each
- **Content Upload** — upload videos, PDFs, documents to Supabase Storage
- **Enrollment** — students browse available courses and enroll
- **Progress Tracking** — mark content as completed, track per-student progress

## 5. Assignments & Evaluation
- **Create Assignment** — MCQ builder + file-based assignment (PDF/DOC upload)
- **MCQ Solving** — students answer MCQs inline with auto-grading
- **File Submission** — students download assignment PDF, solve, and upload their solution
- **Evaluation** — educators review submissions, assign marks, provide feedback
- **Assignment list** with status (pending/submitted/graded)

## 6. Live Classes (UI Mockup)
- **Schedule Class** — educator sets date, time, topic, and linked course
- **Student Notifications** — upcoming class appears on student dashboard with countdown
- **Class Room page** (`/classroom/:id`) — mockup video interface with placeholder UI (camera/mic toggles, participant list, chat)
- **Recording placeholder** — after class ends, a "recording available" entry appears in the course content

## 7. AI Chat Assistant
- **Chat interface** accessible from student dashboard — floating chat button
- **Powered by Lovable AI** (Gemini via gateway) through a Supabase edge function
- Students can type questions or describe problems to get help
- Conversation history within session
- Streaming responses with markdown rendering

## 8. Feedback System
- Students submit feedback on courses/classes (rating + text)
- Educators can view aggregated feedback on their dashboard

## 9. Profile & Settings (`/profile`)
- View and edit profile: name, avatar, bio
- **Student profile**: shows enrolled courses, completion stats, daily streak calendar
- **Educator profile**: shows courses created, total students, rating
- Avatar upload to Supabase Storage

## 10. Opportunities Hub (`/opportunities`)
- Static/curated page listing scholarships, competitions, and learning resources
- Educator can post opportunities; students can browse them

---

## Design & UX
- Clean, modern UI with Tailwind CSS and shadcn/ui components
- Responsive design for mobile and desktop
- Sidebar navigation with role-appropriate menu items
- Light/dark mode support
- Toast notifications for actions (enrollment, submission, scheduling)

## Backend Architecture (Supabase)
- **Auth**: Supabase Auth with email/password
- **Database**: profiles, user_roles, courses, sections, content, assignments, submissions, feedback, scheduled_classes, opportunities, activity_log
- **Storage**: buckets for course content, assignment files, submissions, avatars
- **Edge Functions**: AI chat assistant
- **RLS Policies**: role-based access control on all tables

