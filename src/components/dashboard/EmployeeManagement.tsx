import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { UserPlus, Mail, Users, Trash2, Edit, Clock, CheckCircle, XCircle, HelpCircle, Play, ChevronDown, ChevronUp, User, RefreshCw } from 'lucide-react';
import { EmployeeService } from '@/services/employeeService';
import type { EmployeeWithAssignments, Employee } from '@/types/employee';
import { LoadingSkeleton } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AddEmployeeModal } from './AddEmployeeModal';
import { AssignVideosModal } from './AssignVideosModal';
import { format, differenceInDays, isPast } from 'date-fns';
export const EmployeeManagement: React.FC<{ onCountChange?: (count: number) => void }> = ({ onCountChange }) => {
  const [employees, setEmployees] = useState<EmployeeWithAssignments[]>([]);
  const [employeeVideos, setEmployeeVideos] = useState<Map<string, any[]>>(new Map());
  const [expandedEmployees, setExpandedEmployees] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [deleteConfirmEmployee, setDeleteConfirmEmployee] = useState<Employee | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const {
    toast
  } = useToast();
  useEffect(() => {
    loadEmployees();

    // Smart refresh: Only refresh when there are actual database changes
    const channel = supabase
      .channel('employee-assignments-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all changes (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'employee_video_assignments'
        },
        () => {
          console.log('Employee assignment changed, refreshing data...');
          loadEmployees();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public', 
          table: 'profiles'
        },
        () => {
          console.log('Employee profile changed, refreshing data...');
          loadEmployees();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'employee_video_progress'
        },
        () => {
          console.log('Employee progress changed, refreshing data...');
          loadEmployees();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  const loadEmployees = async () => {
    try {
      setLoading(true);
      const data = await EmployeeService.getEmployees();
      setEmployees(data);
      onCountChange?.(data.length);

      // Load video assignments for each employee - now data comes pre-loaded from batch function
      const videoMap = new Map();
      for (const employee of data) {
        // Use pre-loaded assignments from the optimized batch function
        if (employee.assignments && Array.isArray(employee.assignments)) {
          videoMap.set(employee.id, employee.assignments);
        } else {
          // Fallback for employees without assignments
          videoMap.set(employee.id, []);
        }
      }
      setEmployeeVideos(videoMap);
    } catch (error) {
      console.error('Error loading employees:', error);
      toast({
        title: "Error",
        description: "Failed to load employees",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const handleAddEmployee = (employee: Employee) => {
    setEmployees(prev => {
      const updated = [...prev, {
        ...employee,
        assigned_videos_count: 0
      }];
      onCountChange?.(updated.length);
      return updated;
    });
    setShowAddModal(false);
    toast({
      title: "Success",
      description: "Employee added successfully"
    });
  };
  const handleAssignVideos = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowAssignModal(true);
  };
  const handleDeleteEmployee = async () => {
    if (!deleteConfirmEmployee) return;
    setIsDeleting(true);
    try {
      await EmployeeService.deleteEmployee(deleteConfirmEmployee.id);
      setEmployees(prev => { const updated = prev.filter(emp => emp.id !== deleteConfirmEmployee.id); onCountChange?.(updated.length); return updated; });
      setDeleteConfirmEmployee(null);
      toast({
        title: "Success",
        description: "Employee deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast({
        title: "Error",
        description: "Failed to delete employee",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleEmployeeExpanded = (employeeId: string) => {
    setExpandedEmployees(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(employeeId)) {
        newExpanded.delete(employeeId);
      } else {
        newExpanded.add(employeeId);
      }
      return newExpanded;
    });
  };

  // Helper function to get deadline badge props
  const getDeadlineBadge = (dueDate: string | null, progressPercent: number = 0) => {
    const isCompleted = progressPercent >= 100;
    if (isCompleted) {
      return {
        variant: "hollow-success" as const,
        showIcon: true,
        text: "Completed"
      };
    }
    if (!dueDate) {
      return {
        variant: "hollow-plain" as const,
        text: "No deadline"
      };
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const daysUntilDue = differenceInDays(due, today);
    if (isPast(due) && daysUntilDue < 0) {
      return {
        variant: "hollow-destructive" as const,
        showIcon: true,
        text: "Overdue"
      };
    }
    if (daysUntilDue <= 5) {
      return {
        variant: "hollow-destructive" as const,
        text: `Due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}`
      };
    }
    return {
      variant: "hollow-secondary" as const,
      text: `Due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}`
    };
  };
  return <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold">Employee Video Assignments</h3>
          <p className="text-muted-foreground">
            Manage individual employees and their video assignments
          </p>
        </div>
        <div className="flex gap-2">
          
          <Button onClick={() => setShowAddModal(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Add Employee
          </Button>
        </div>
      </div>

      {/* Individual Employees Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              <LoadingSkeleton lines={1} className="h-12" />
              <LoadingSkeleton lines={1} className="h-12" />
              <LoadingSkeleton lines={1} className="h-12" />
            </div>
          ) : employees.length === 0 ? (
            <div className="text-center py-12">
              <div className="space-y-3">
                <UserPlus className="w-12 h-12 text-muted-foreground mx-auto" />
                <div>
                  <h4 className="font-medium text-foreground">
                    No employees found
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Add employees by email to assign specific training videos.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowAddModal(true)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add First Employee
                </Button>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="whitespace-nowrap">Employee</TableHead>
                  <TableHead className="whitespace-nowrap">Assigned Videos</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map(employee => {
                  const videos = employeeVideos.get(employee.id) || [];
                  const isExpanded = expandedEmployees.has(employee.id);
                  const overdueCount = videos.filter(assignment => {
                    if (!assignment.due_date || assignment.progress_percent >= 100) return false;
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const due = new Date(assignment.due_date);
                    due.setHours(0, 0, 0, 0);
                    const daysUntilDue = differenceInDays(due, today);
                    return isPast(due) && daysUntilDue < 0;
                  }).length;

                  return (
                    <React.Fragment key={employee.id}>
                      <TableRow className={`group hover:bg-muted/50 transition-colors ${isExpanded ? 'border-b-0' : ''}`}>
                        <TableCell className="py-3">
                          <Collapsible 
                            open={isExpanded}
                            onOpenChange={() => toggleEmployeeExpanded(employee.id)}
                          >
                            <CollapsibleTrigger asChild>
                              <div className="flex items-center gap-3 cursor-pointer">
                                <div className="flex items-center gap-2">
                                  {isExpanded ? (
                                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    <User className="w-4 h-4 text-primary" />
                                  </div>
                                  <div>
                                    <div className="font-medium">{employee.full_name || 'Unknown'}</div>
                                    <div className="text-sm text-muted-foreground">{employee.email}</div>
                                  </div>
                                </div>
                              </div>
                            </CollapsibleTrigger>
                          </Collapsible>
                        </TableCell>
                        
                        <TableCell className="py-3">
                          <span className="font-medium">{employee.assigned_videos_count || 0}</span>
                        </TableCell>
                        
                        <TableCell className="py-3">
                          {overdueCount > 0 ? (
                            <Badge variant="hollow-destructive" showIcon className="text-xs">
                              {overdueCount} Overdue
                            </Badge>
                          ) : videos.length > 0 ? (
                            <Badge variant="hollow-success" showIcon className="text-xs">
                              On Track
                            </Badge>
                          ) : (
                            <Badge variant="hollow-plain" className="text-xs">
                              No Videos
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell className="text-right py-3">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleAssignVideos(employee)}
                              aria-label={`Edit video assignments for ${employee.full_name || employee.email}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => setDeleteConfirmEmployee(employee)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      
                      {isExpanded && (
                        <TableRow className="hover:bg-transparent">
                          <TableCell colSpan={4} className="py-0">
                            <Collapsible open={isExpanded}>
                              <CollapsibleContent>
                                <div className="px-4 pb-4 ml-6">
                                  {videos.length === 0 ? (
                                    <div className="text-sm text-muted-foreground py-2">
                                      No videos assigned
                                    </div>
                                  ) : (
                                    <Table>
                                      <TableBody>
                                        {videos.map((assignment) => {
                                          const badge = getDeadlineBadge(assignment.due_date, assignment.progress_percent);
                                          
                                          return (
                                            <TableRow key={assignment.assignment_id} className="hover:bg-transparent">
                                              <TableCell className="py-1">
                                                {assignment.video_title}
                                              </TableCell>
                                              <TableCell className="text-right py-1">
                                                 <Badge 
                                                   variant={badge.variant}
                                                   showIcon={badge.showIcon}
                                                 >
                                                   {badge.text}
                                                 </Badge>
                                              </TableCell>
                                            </TableRow>
                                          );
                                        })}
                                      </TableBody>
                                    </Table>
                                  )}
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <AddEmployeeModal open={showAddModal} onOpenChange={setShowAddModal} onEmployeeAdded={handleAddEmployee} />

      <AssignVideosModal open={showAssignModal} onOpenChange={setShowAssignModal} employee={selectedEmployee} onAssignmentComplete={loadEmployees} />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmEmployee} onOpenChange={() => setDeleteConfirmEmployee(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Employee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteConfirmEmployee?.full_name || deleteConfirmEmployee?.email}"?
              <br />
              <br />
              This will permanently remove:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>The employee record</li>
                <li>All video assignments for this employee</li>
                <li>Any progress tracking data</li>
              </ul>
              <br />
              <strong>This action cannot be undone.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEmployee} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isDeleting ? 'Deleting...' : 'Delete Employee'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
};