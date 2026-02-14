export interface Employee {
  id: string;
  email?: string;
  full_name?: string;
  is_admin?: boolean;
  created_at: string;
  updated_at: string;
}

export interface VideoAssignment {
  id: string;
  video_id: string;
  employee_id: string;
  assigned_by: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export interface VideoProgress {
  id: string;
  employee_id: string;
  video_id: string;
  progress_percent: number;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface EmployeeAssignmentWithProgress {
  assignment_id: string;
  video_id: string;
  video_title: string;
  video_description?: string;
  video_type: string;
  due_date?: string;
  assigned_at: string;
  assigned_by: string;
  progress_percent: number;
  completed_at?: string;
  hasQuiz?: boolean;
}

export interface EmployeeBatchData {
  employee_id: string;
  employee_email: string;
  employee_full_name?: string;
  assignments: EmployeeAssignmentWithProgress[];
}

export interface EmployeeWithAssignments extends Employee {
  assignments?: VideoAssignment[];
}