
-- 1. Create role enum
CREATE TYPE public.app_role AS ENUM ('educator', 'student');

-- 2. Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. User roles table (separate from profiles per security requirements)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Courses
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  educator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- 5. Sections
CREATE TABLE public.sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;

-- 6. Content
CREATE TABLE public.content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID REFERENCES public.sections(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('video', 'pdf', 'document', 'recording')),
  storage_path TEXT,
  url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;

-- 7. Enrollments
CREATE TABLE public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, course_id)
);
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- 8. Content progress
CREATE TABLE public.content_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content_id UUID REFERENCES public.content(id) ON DELETE CASCADE NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, content_id)
);
ALTER TABLE public.content_progress ENABLE ROW LEVEL SECURITY;

-- 9. Assignments
CREATE TABLE public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  assignment_type TEXT NOT NULL CHECK (assignment_type IN ('mcq', 'file')),
  file_url TEXT,
  due_date TIMESTAMPTZ,
  max_marks INT DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- 10. MCQ questions
CREATE TABLE public.mcq_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE NOT NULL,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer TEXT NOT NULL CHECK (correct_answer IN ('a', 'b', 'c', 'd')),
  sort_order INT NOT NULL DEFAULT 0
);
ALTER TABLE public.mcq_questions ENABLE ROW LEVEL SECURITY;

-- 11. Submissions
CREATE TABLE public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE NOT NULL,
  answers JSONB,
  file_url TEXT,
  marks INT,
  feedback TEXT,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded')),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, assignment_id)
);
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- 12. Feedback
CREATE TABLE public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, course_id)
);
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- 13. Scheduled classes
CREATE TABLE public.scheduled_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 60,
  meeting_url TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.scheduled_classes ENABLE ROW LEVEL SECURITY;

-- 14. Opportunities
CREATE TABLE public.opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  educator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  link TEXT,
  opportunity_type TEXT DEFAULT 'scholarship' CHECK (opportunity_type IN ('scholarship', 'competition', 'resource', 'other')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

-- 15. Activity log (for daily streak tracking)
CREATE TABLE public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  activity_type TEXT NOT NULL,
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_activity_log_user_date ON public.activity_log(user_id, activity_date);

-- ============================================
-- HELPER FUNCTIONS (security definer)
-- ============================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_course_owner(_user_id UUID, _course_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.courses WHERE id = _course_id AND educator_id = _user_id
  )
$$;

CREATE OR REPLACE FUNCTION public.is_enrolled(_user_id UUID, _course_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.enrollments WHERE student_id = _user_id AND course_id = _course_id
  )
$$;

CREATE OR REPLACE FUNCTION public.get_course_id_for_section(_section_id UUID)
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT course_id FROM public.sections WHERE id = _section_id
$$;

CREATE OR REPLACE FUNCTION public.get_course_id_for_content(_content_id UUID)
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT s.course_id FROM public.content c JOIN public.sections s ON c.section_id = s.id WHERE c.id = _content_id
$$;

CREATE OR REPLACE FUNCTION public.get_course_id_for_assignment(_assignment_id UUID)
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT course_id FROM public.assignments WHERE id = _assignment_id
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- RLS POLICIES
-- ============================================

-- Profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- User roles
CREATE POLICY "Anyone can view roles" ON public.user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own role" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Courses
CREATE POLICY "Educators see all courses, students see enrolled" ON public.courses FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'educator') OR public.is_enrolled(auth.uid(), id));
CREATE POLICY "Educators can browse all courses" ON public.courses FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'student'));
CREATE POLICY "Educators can create courses" ON public.courses FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'educator') AND auth.uid() = educator_id);
CREATE POLICY "Educators can update own courses" ON public.courses FOR UPDATE TO authenticated
  USING (public.is_course_owner(auth.uid(), id));
CREATE POLICY "Educators can delete own courses" ON public.courses FOR DELETE TO authenticated
  USING (public.is_course_owner(auth.uid(), id));

-- Sections
CREATE POLICY "View sections of accessible courses" ON public.sections FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'educator') OR public.is_enrolled(auth.uid(), course_id));
CREATE POLICY "Educators create sections in own courses" ON public.sections FOR INSERT TO authenticated
  WITH CHECK (public.is_course_owner(auth.uid(), course_id));
CREATE POLICY "Educators update sections in own courses" ON public.sections FOR UPDATE TO authenticated
  USING (public.is_course_owner(auth.uid(), course_id));
CREATE POLICY "Educators delete sections in own courses" ON public.sections FOR DELETE TO authenticated
  USING (public.is_course_owner(auth.uid(), course_id));

-- Content
CREATE POLICY "View content of accessible courses" ON public.content FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'educator')
    OR public.is_enrolled(auth.uid(), public.get_course_id_for_section(section_id))
  );
CREATE POLICY "Educators create content in own courses" ON public.content FOR INSERT TO authenticated
  WITH CHECK (public.is_course_owner(auth.uid(), public.get_course_id_for_section(section_id)));
CREATE POLICY "Educators update content in own courses" ON public.content FOR UPDATE TO authenticated
  USING (public.is_course_owner(auth.uid(), public.get_course_id_for_section(section_id)));
CREATE POLICY "Educators delete content in own courses" ON public.content FOR DELETE TO authenticated
  USING (public.is_course_owner(auth.uid(), public.get_course_id_for_section(section_id)));

-- Enrollments
CREATE POLICY "Students view own enrollments" ON public.enrollments FOR SELECT TO authenticated
  USING (student_id = auth.uid());
CREATE POLICY "Educators view enrollments for own courses" ON public.enrollments FOR SELECT TO authenticated
  USING (public.is_course_owner(auth.uid(), course_id));
CREATE POLICY "Students can enroll" ON public.enrollments FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'student') AND student_id = auth.uid());
CREATE POLICY "Students can unenroll" ON public.enrollments FOR DELETE TO authenticated
  USING (student_id = auth.uid());

-- Content progress
CREATE POLICY "Students view own progress" ON public.content_progress FOR SELECT TO authenticated
  USING (student_id = auth.uid());
CREATE POLICY "Educators view progress for own courses" ON public.content_progress FOR SELECT TO authenticated
  USING (public.is_course_owner(auth.uid(), public.get_course_id_for_content(content_id)));
CREATE POLICY "Students mark content complete" ON public.content_progress FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid());

-- Assignments
CREATE POLICY "View assignments of accessible courses" ON public.assignments FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'educator') OR public.is_enrolled(auth.uid(), course_id));
CREATE POLICY "Educators create assignments" ON public.assignments FOR INSERT TO authenticated
  WITH CHECK (public.is_course_owner(auth.uid(), course_id));
CREATE POLICY "Educators update assignments" ON public.assignments FOR UPDATE TO authenticated
  USING (public.is_course_owner(auth.uid(), course_id));
CREATE POLICY "Educators delete assignments" ON public.assignments FOR DELETE TO authenticated
  USING (public.is_course_owner(auth.uid(), course_id));

-- MCQ questions
CREATE POLICY "View MCQ of accessible assignments" ON public.mcq_questions FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'educator')
    OR public.is_enrolled(auth.uid(), public.get_course_id_for_assignment(assignment_id))
  );
CREATE POLICY "Educators manage MCQ questions" ON public.mcq_questions FOR INSERT TO authenticated
  WITH CHECK (public.is_course_owner(auth.uid(), public.get_course_id_for_assignment(assignment_id)));
CREATE POLICY "Educators update MCQ questions" ON public.mcq_questions FOR UPDATE TO authenticated
  USING (public.is_course_owner(auth.uid(), public.get_course_id_for_assignment(assignment_id)));
CREATE POLICY "Educators delete MCQ questions" ON public.mcq_questions FOR DELETE TO authenticated
  USING (public.is_course_owner(auth.uid(), public.get_course_id_for_assignment(assignment_id)));

-- Submissions
CREATE POLICY "Students view own submissions" ON public.submissions FOR SELECT TO authenticated
  USING (student_id = auth.uid());
CREATE POLICY "Educators view submissions for own courses" ON public.submissions FOR SELECT TO authenticated
  USING (public.is_course_owner(auth.uid(), public.get_course_id_for_assignment(assignment_id)));
CREATE POLICY "Students submit assignments" ON public.submissions FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid() AND public.is_enrolled(auth.uid(), public.get_course_id_for_assignment(assignment_id)));
CREATE POLICY "Educators grade submissions" ON public.submissions FOR UPDATE TO authenticated
  USING (public.is_course_owner(auth.uid(), public.get_course_id_for_assignment(assignment_id)));

-- Feedback
CREATE POLICY "Students view own feedback" ON public.feedback FOR SELECT TO authenticated
  USING (student_id = auth.uid());
CREATE POLICY "Educators view feedback for own courses" ON public.feedback FOR SELECT TO authenticated
  USING (public.is_course_owner(auth.uid(), course_id));
CREATE POLICY "Students submit feedback" ON public.feedback FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid() AND public.is_enrolled(auth.uid(), course_id));

-- Scheduled classes
CREATE POLICY "View scheduled classes" ON public.scheduled_classes FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'educator') OR public.is_enrolled(auth.uid(), course_id));
CREATE POLICY "Educators create classes" ON public.scheduled_classes FOR INSERT TO authenticated
  WITH CHECK (public.is_course_owner(auth.uid(), course_id));
CREATE POLICY "Educators update classes" ON public.scheduled_classes FOR UPDATE TO authenticated
  USING (public.is_course_owner(auth.uid(), course_id));
CREATE POLICY "Educators delete classes" ON public.scheduled_classes FOR DELETE TO authenticated
  USING (public.is_course_owner(auth.uid(), course_id));

-- Opportunities
CREATE POLICY "Anyone can view opportunities" ON public.opportunities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Educators create opportunities" ON public.opportunities FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'educator') AND auth.uid() = educator_id);
CREATE POLICY "Educators update own opportunities" ON public.opportunities FOR UPDATE TO authenticated
  USING (auth.uid() = educator_id);
CREATE POLICY "Educators delete own opportunities" ON public.opportunities FOR DELETE TO authenticated
  USING (auth.uid() = educator_id);

-- Activity log
CREATE POLICY "Users view own activity" ON public.activity_log FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users log own activity" ON public.activity_log FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- ============================================
-- STORAGE BUCKETS
-- ============================================

INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('course-content', 'course-content', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('assignment-files', 'assignment-files', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('submissions', 'submissions', false);

-- Storage policies
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own avatar" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Authenticated users can view course content" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'course-content');
CREATE POLICY "Educators can upload course content" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'course-content' AND public.has_role(auth.uid(), 'educator'));
CREATE POLICY "Educators can delete course content" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'course-content' AND public.has_role(auth.uid(), 'educator'));

CREATE POLICY "Authenticated users can view assignment files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'assignment-files');
CREATE POLICY "Educators can upload assignment files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'assignment-files' AND public.has_role(auth.uid(), 'educator'));

CREATE POLICY "Authenticated users can view submissions" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'submissions');
CREATE POLICY "Students can upload submissions" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'submissions' AND public.has_role(auth.uid(), 'student'));
