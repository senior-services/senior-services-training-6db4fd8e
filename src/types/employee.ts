export interface Employee {
  id: string;
  email?: string;
  full_name?: string;
  domain?: string;
  is_generic: boolean;
  created_at: string;
  updated_at: string;
}

export interface VideoAssignment {
  id: string;
  video_id: string;
  employee_id: string;
  assigned_by: string;
  created_at: string;
  updated_at: string;
}

export interface EmployeeWithAssignments extends Employee {
  assignments?: VideoAssignment[];
  assigned_videos_count?: number;
}