/**
 * Custom hook for employee management operations
 * Provides centralized employee state management with progress tracking
 */

import { useState, useEffect, useCallback } from 'react';
import { Employee, Profile, ApiResponse } from '@/types';
import { profileService } from '@/services/supabase';
import { useToast } from '@/hooks/use-toast';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '@/constants';

interface UseEmployeesReturn {
  employees: Employee[];
  loading: boolean;
  error: string | null;
  selectedEmployee: Employee | null;
  // Actions
  fetchEmployees: () => Promise<void>;
  updateEmployeeProgress: (id: string, progress: Partial<Employee>) => Promise<boolean>;
  selectEmployee: (employee: Employee | null) => void;
  // Computed values
  getEmployeesByStatus: (status?: Employee['status']) => Employee[];
  getOverallProgress: () => { completed: number; total: number; percentage: number };
}

/**
 * Mock employee data - In production, this would come from the database
 * This represents employees with their training progress
 */
const getMockEmployees = (): Employee[] => [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@southsoundseniors.org',
    requiredProgress: 85,
    completedVideos: 3,
    totalVideos: 4,
    status: 'on-track'
  },
  {
    id: '2', 
    name: 'Michael Chen',
    email: 'michael.chen@southsoundseniors.org',
    requiredProgress: 60,
    completedVideos: 2,
    totalVideos: 4,
    status: 'behind'
  },
  {
    id: '3',
    name: 'Emily Rodriguez', 
    email: 'emily.rodriguez@southsoundseniors.org',
    requiredProgress: 100,
    completedVideos: 4,
    totalVideos: 4,
    status: 'completed'
  },
  {
    id: '4',
    name: 'David Park',
    email: 'david.park@southsoundseniors.org', 
    requiredProgress: 25,
    completedVideos: 1,
    totalVideos: 4,
    status: 'behind'
  },
  {
    id: '5',
    name: 'Lisa Thompson',
    email: 'lisa.thompson@southsoundseniors.org',
    requiredProgress: 75,
    completedVideos: 3,
    totalVideos: 4,
    status: 'on-track'
  }
];

/**
 * Hook for managing employee operations and progress tracking
 * @returns Employee state and management functions
 */
export const useEmployees = (): UseEmployeesReturn => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  
  const { toast } = useToast();

  /**
   * Fetches all employees and their progress
   * Currently uses mock data, but can be extended to fetch from database
   */
  const fetchEmployees = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // In production, this would fetch from the database:
      // const result = await employeeService.getAll();
      
      const mockEmployees = getMockEmployees();
      setEmployees(mockEmployees);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : ERROR_MESSAGES.EMPLOYEE.LOAD_FAILED;
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Updates employee progress information
   * @param id - Employee ID
   * @param progress - Progress updates to apply
   */
  const updateEmployeeProgress = useCallback(async (
    id: string, 
    progress: Partial<Employee>
  ): Promise<boolean> => {
    try {
      // Optimistic update
      const originalEmployees = [...employees];
      setEmployees(prev => prev.map(emp => 
        emp.id === id 
          ? { ...emp, ...progress }
          : emp
      ));

      // In production, make API call here:
      // const result = await employeeService.updateProgress(id, progress);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      toast({
        title: 'Success',
        description: SUCCESS_MESSAGES.EMPLOYEE.UPDATED,
      });

      return true;
    } catch (err) {
      // Revert optimistic update on error
      setEmployees(employees);
      
      const errorMessage = err instanceof Error ? err.message : ERROR_MESSAGES.EMPLOYEE.UPDATE_FAILED;
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });

      return false;
    }
  }, [employees, toast]);

  /**
   * Selects an employee for detailed view
   * @param employee - Employee to select
   */
  const selectEmployee = useCallback((employee: Employee | null): void => {
    setSelectedEmployee(employee);
  }, []);

  /**
   * Filters employees by status
   * @param status - Optional status filter
   * @returns Filtered employees array
   */
  const getEmployeesByStatus = useCallback((status?: Employee['status']): Employee[] => {
    if (!status) return employees;
    return employees.filter(emp => emp.status === status);
  }, [employees]);

  /**
   * Calculates overall training progress statistics
   * @returns Overall progress metrics
   */
  const getOverallProgress = useCallback(() => {
    if (employees.length === 0) {
      return { completed: 0, total: 0, percentage: 0 };
    }

    const completed = employees.filter(emp => emp.status === 'completed').length;
    const total = employees.length;
    const percentage = Math.round((completed / total) * 100);

    return { completed, total, percentage };
  }, [employees]);

  // Load employees on component mount
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  return {
    employees,
    loading,
    error,
    selectedEmployee,
    fetchEmployees,
    updateEmployeeProgress,
    selectEmployee,
    getEmployeesByStatus,
    getOverallProgress,
  };
};