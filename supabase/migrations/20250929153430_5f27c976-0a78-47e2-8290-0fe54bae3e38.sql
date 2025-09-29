-- Create app role enum
CREATE TYPE public.app_role AS ENUM ('student', 'teacher', 'admin');

-- Create users profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT,
  role app_role NOT NULL DEFAULT 'student',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create students table
CREATE TABLE public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  enrollment_number TEXT NOT NULL UNIQUE,
  class TEXT NOT NULL,
  section TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create teachers table  
CREATE TABLE public.teachers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id TEXT NOT NULL UNIQUE,
  subjects TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create classes table
CREATE TABLE public.classes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_name TEXT NOT NULL,
  section TEXT NOT NULL,
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(class_name, section, subject)
);

-- Create tests table
CREATE TABLE public.tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  test_name TEXT NOT NULL,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  total_marks INTEGER NOT NULL DEFAULT 100,
  test_date DATE NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create test results table
CREATE TABLE public.test_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  marks_obtained INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(test_id, student_id)
);

-- Create attendance sessions table
CREATE TABLE public.attendance_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_time TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended')),
  qr_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create attendance table
CREATE TABLE public.attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late')),
  check_in_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, session_id)
);

-- Create events table
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  location TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Create function to check user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE user_id = user_uuid;
$$;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Allow profile creation during signup" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for students
CREATE POLICY "Students can view their own data" ON public.students
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Teachers and admins can view all students" ON public.students
  FOR SELECT USING (
    public.get_user_role(auth.uid()) IN ('teacher', 'admin')
  );

CREATE POLICY "Admins can manage students" ON public.students
  FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- Create RLS policies for teachers
CREATE POLICY "Teachers can view their own data" ON public.teachers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all teachers" ON public.teachers
  FOR SELECT USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can manage teachers" ON public.teachers
  FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- Create RLS policies for classes
CREATE POLICY "All authenticated users can view classes" ON public.classes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Teachers can manage their classes" ON public.classes
  FOR ALL USING (
    public.get_user_role(auth.uid()) IN ('teacher', 'admin') AND
    (teacher_id IN (SELECT id FROM public.teachers WHERE user_id = auth.uid()) OR
     public.get_user_role(auth.uid()) = 'admin')
  );

-- Create RLS policies for tests
CREATE POLICY "Students can view tests for their classes" ON public.tests
  FOR SELECT USING (
    public.get_user_role(auth.uid()) = 'student' AND
    class_id IN (
      SELECT c.id FROM public.classes c
      JOIN public.students s ON s.class = c.class_name AND s.section = c.section
      WHERE s.user_id = auth.uid()
    )
  );

CREATE POLICY "Teachers and admins can manage tests" ON public.tests
  FOR ALL USING (public.get_user_role(auth.uid()) IN ('teacher', 'admin'));

-- Create RLS policies for test results
CREATE POLICY "Students can view their own test results" ON public.test_results
  FOR SELECT USING (
    student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
  );

CREATE POLICY "Teachers and admins can manage test results" ON public.test_results
  FOR ALL USING (public.get_user_role(auth.uid()) IN ('teacher', 'admin'));

-- Create RLS policies for attendance sessions
CREATE POLICY "All authenticated users can view attendance sessions" ON public.attendance_sessions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Teachers can manage their attendance sessions" ON public.attendance_sessions
  FOR ALL USING (
    public.get_user_role(auth.uid()) IN ('teacher', 'admin') AND
    (teacher_id IN (SELECT id FROM public.teachers WHERE user_id = auth.uid()) OR
     public.get_user_role(auth.uid()) = 'admin')
  );

-- Create RLS policies for attendance
CREATE POLICY "Students can view their own attendance" ON public.attendance
  FOR SELECT USING (
    student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
  );

CREATE POLICY "Students can mark their own attendance" ON public.attendance
  FOR INSERT WITH CHECK (
    student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
  );

CREATE POLICY "Teachers and admins can manage attendance" ON public.attendance
  FOR ALL USING (public.get_user_role(auth.uid()) IN ('teacher', 'admin'));

-- Create RLS policies for events
CREATE POLICY "All authenticated users can view events" ON public.events
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Teachers and admins can manage events" ON public.events
  FOR ALL USING (public.get_user_role(auth.uid()) IN ('teacher', 'admin'));

-- Create function to automatically create profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'student')
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
