
-- Announcements table
CREATE TABLE public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  educator_id UUID NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Educators create announcements" ON public.announcements FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'educator') AND auth.uid() = educator_id);
CREATE POLICY "Educators update own announcements" ON public.announcements FOR UPDATE
  USING (auth.uid() = educator_id);
CREATE POLICY "Educators delete own announcements" ON public.announcements FOR DELETE
  USING (auth.uid() = educator_id);
CREATE POLICY "View announcements" ON public.announcements FOR SELECT
  USING (
    has_role(auth.uid(), 'educator') OR
    course_id IS NULL OR
    is_enrolled(auth.uid(), course_id)
  );

-- Resources table (shared resource library)
CREATE TABLE public.resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  educator_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  resource_type TEXT NOT NULL DEFAULT 'document',
  file_url TEXT,
  link TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Educators create resources" ON public.resources FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'educator') AND auth.uid() = educator_id);
CREATE POLICY "Educators update own resources" ON public.resources FOR UPDATE
  USING (auth.uid() = educator_id);
CREATE POLICY "Educators delete own resources" ON public.resources FOR DELETE
  USING (auth.uid() = educator_id);
CREATE POLICY "Anyone can view resources" ON public.resources FOR SELECT
  USING (true);

-- Doubts table (doubt resolution system)
CREATE TABLE public.doubts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  ai_response TEXT,
  expert_response TEXT,
  responded_by UUID,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);
ALTER TABLE public.doubts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students create doubts" ON public.doubts FOR INSERT
  WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Students view own doubts" ON public.doubts FOR SELECT
  USING (student_id = auth.uid());
CREATE POLICY "Educators view doubts for own courses" ON public.doubts FOR SELECT
  USING (is_course_owner(auth.uid(), course_id));
CREATE POLICY "Educators respond to doubts" ON public.doubts FOR UPDATE
  USING (is_course_owner(auth.uid(), course_id));

-- Storage bucket for resources
INSERT INTO storage.buckets (id, name, public) VALUES ('resources', 'resources', true);
CREATE POLICY "Educators upload resources" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'resources' AND has_role(auth.uid(), 'educator'));
CREATE POLICY "Anyone can view resources files" ON storage.objects FOR SELECT
  USING (bucket_id = 'resources');
