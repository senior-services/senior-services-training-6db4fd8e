import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { UserPlus, Mail, Users, Trash2, Edit, Clock, CheckCircle, XCircle, HelpCircle, Play, ChevronDown, User, RefreshCw } from 'lucide-react';
import { EmployeeService } from '@/services/employeeService';
import type { EmployeeWithAssignments, Employee } from '@/types/employee';
import { LoadingSkeleton } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { AddEmployeeModal } from './AddEmployeeModal';
import { AssignVideosModal } from './AssignVideosModal';
import { format, differenceInDays, isPast } from 'date-fns';
export const EmployeeManagement: React.FC = () => {
  const [employees, setEmployees] = useState<EmployeeWithAssignments[]>([]);
  const [employeeVideos, setEmployeeVideos] = useState<Map<string, any[]>>(new Map());
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

    // Auto-refresh every 30 seconds to show latest completion status
    const interval = setInterval(loadEmployees, 30000);
    return () => clearInterval(interval);
  }, []);
  const loadEmployees = async () => {
    try {
      setLoading(true);
      const data = await EmployeeService.getEmployees();
      setEmployees(data);

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
    setEmployees(prev => [...prev, {
      ...employee,
      assigned_videos_count: 0
    }]);
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
      setEmployees(prev => prev.filter(emp => emp.id !== deleteConfirmEmployee.id));
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

  // Helper function to get deadline badge props
  const getDeadlineBadge = (dueDate: string | null, progressPercent: number = 0) => {
    const isCompleted = progressPercent >= 100;
    if (isCompleted) {
      return {
        variant: "default" as const,
        className: "bg-green-800 text-white hover:bg-green-800",
        text: "Completed"
      };
    }
    if (!dueDate) {
      return {
        variant: "default" as const,
        className: "bg-muted text-muted-foreground hover:bg-muted",
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
        variant: "default" as const,
        className: "bg-red-800 text-white hover:bg-red-800",
        text: "Overdue"
      };
    }
    if (daysUntilDue <= 5) {
      return {
        variant: "default" as const,
        className: "bg-orange-700 text-white hover:bg-orange-700",
        text: `Due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}`
      };
    }
    return {
      variant: "default" as const,
      className: "bg-gray-700 text-white hover:bg-gray-700",
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
          {loading ? <div className="p-6 space-y-4">
              <LoadingSkeleton lines={1} className="h-12" />
              <LoadingSkeleton lines={1} className="h-12" />
              <LoadingSkeleton lines={1} className="h-12" />
            </div> : employees.length === 0 ? <div className="text-center py-12">
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
            </div> : <Accordion type="multiple" className="w-full">
              {employees.map(employee => {
            const hasVideos = (employee.assigned_videos_count || 0) > 0;
            const videos = employeeVideos.get(employee.id) || [];
            return <AccordionItem key={employee.id} value={employee.id} className="group data-[state=open]:bg-muted/60 overflow-hidden">
                    <AccordionTrigger className="[&>svg]:hidden py-2 px-4 hover:bg-muted/30 data-[state=open]:hover:bg-transparent" // Hide default chevron, add horizontal padding, contain hover state
              >
                    <div className="flex items-center justify-between w-full">
                      {/* Left side: Chevron + Employee info */}
                      <div className="flex items-center gap-4">
                        {/* Manual chevron on the left or equivalent spacing */}
                        {hasVideos ? <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" /> : <div className="w-4 h-4" /> // Empty space to maintain alignment
                    }
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-3 text-left">
                            <span className="font-medium">{employee.full_name || 'Unknown'}</span>
                            <span className="text-muted-foreground">|</span>
                            <span className="text-sm text-muted-foreground">{employee.email}</span>
                          </div>
                        </div>
                        
                         <div className="text-center">
                           <div className="flex items-center gap-2 justify-center">
                             <Badge className="bg-muted text-muted-foreground hover:bg-muted">
                               {employee.assigned_videos_count || 0} videos
                             </Badge>
                             
                             {(() => {
                               const videos = employeeVideos.get(employee.id) || [];
                               const overdueCount = videos.filter(assignment => {
                                 if (!assignment.due_date || assignment.progress_percent >= 100) return false;
                                 const today = new Date();
                                 today.setHours(0, 0, 0, 0);
                                 const due = new Date(assignment.due_date);
                                 due.setHours(0, 0, 0, 0);
                                 const daysUntilDue = differenceInDays(due, today);
                                 return isPast(due) && daysUntilDue < 0;
                               }).length;
                               
                               return overdueCount > 0 ? (
                                 <Badge className="bg-destructive text-destructive-foreground hover:bg-destructive">
                                   {overdueCount} video{overdueCount !== 1 ? 's' : ''} overdue
                                 </Badge>
                               ) : null;
                             })()}
                           </div>
                         </div>
                      </div>
                      
                      {/* Action buttons on far right */}
                      <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={e => {
                      e.stopPropagation();
                      handleAssignVideos(employee);
                    }}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                        <Button variant="outline" size="sm" onClick={e => {
                      e.stopPropagation();
                      setDeleteConfirmEmployee(employee);
                    }} className="text-destructive hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                          <span className="sr-only">Delete Employee</span>
                        </Button>
                      </div>
                    </div>
                  </AccordionTrigger>
                    
                    {hasVideos && <AccordionContent className="px-4 pb-4">
                        <div className="space-y-3">
                          
                          
                          {videos.length === 0 ? <p className="text-sm text-muted-foreground">Loading video assignments...</p> : <div className="space-y-0">
                              {videos.map((assignment, index) => <div key={assignment.video_id || index} className="flex items-center justify-between py-1 border-b last:border-b-0 border-border/50">
                                  <div className="flex-1 min-w-0 w-1/2">
                                    <div className="font-medium text-sm line-clamp-2">
                                      {assignment.video_title || 'Untitled Video'}
                                    </div>
                                  </div>
                                  
                                   <div className="flex items-center gap-4 text-xs">
                                     {(() => {
                          const badgeProps = getDeadlineBadge(assignment.due_date, assignment.progress_percent || 0);
                          return <Badge variant={badgeProps.variant} className={`text-xs whitespace-nowrap ${badgeProps.className}`}>
                                          {badgeProps.text}
                                        </Badge>;
                        })()}
                                     
                                   </div>
                                </div>)}
                            </div>}
                        </div>
                      </AccordionContent>}
                  </AccordionItem>;
          })}
            </Accordion>}
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