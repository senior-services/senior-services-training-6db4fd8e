import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  UserPlus, 
  Mail, 
  Users, 
  Trash2,
  Edit,
  Clock,
  CheckCircle,
  XCircle,
  HelpCircle,
  Play,
  ChevronDown
} from 'lucide-react';
import { EmployeeService } from '@/services/employeeService';
import type { EmployeeWithAssignments, Employee } from '@/types/employee';
import { LoadingSkeleton } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { AddEmployeeModal } from './AddEmployeeModal';
import { AssignVideosModal } from './AssignVideosModal';
import { format } from 'date-fns';

export const EmployeeManagement: React.FC = () => {
  const [employees, setEmployees] = useState<EmployeeWithAssignments[]>([]);
  const [employeeVideos, setEmployeeVideos] = useState<Map<string, any[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [deleteConfirmEmployee, setDeleteConfirmEmployee] = useState<Employee | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const data = await EmployeeService.getEmployees();
      setEmployees(data);
      
      // Load video assignments for each employee
      const videoMap = new Map();
      for (const employee of data) {
        if (employee.assigned_videos_count && employee.assigned_videos_count > 0) {
          try {
            const assignments = await EmployeeService.getEmployeeAssignments(employee.id);
            videoMap.set(employee.id, assignments);
          } catch (error) {
            console.error(`Error loading videos for employee ${employee.id}:`, error);
            videoMap.set(employee.id, []);
          }
        }
      }
      setEmployeeVideos(videoMap);
    } catch (error) {
      console.error('Error loading employees:', error);
      toast({
        title: "Error",
        description: "Failed to load employees",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployee = (employee: Employee) => {
    setEmployees(prev => [...prev, { ...employee, assigned_videos_count: 0 }]);
    setShowAddModal(false);
    toast({
      title: "Success",
      description: "Employee added successfully",
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
        description: "Employee deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast({
        title: "Error",
        description: "Failed to delete employee",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold">Employee Management</h3>
          <p className="text-muted-foreground">
            Manage individual employees and their video assignments
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Add Employee
        </Button>
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
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowAddModal(true)}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add First Employee
                </Button>
              </div>
            </div>
          ) : (
            <Accordion type="multiple" className="w-full">
              {employees.map((employee) => {
                const hasVideos = (employee.assigned_videos_count || 0) > 0;
                const videos = employeeVideos.get(employee.id) || [];
                
                return (
                  <AccordionItem 
                    key={employee.id} 
                    value={employee.id}
                    className="group"
                  >
                    <AccordionTrigger 
                      className="[&>svg]:hidden" // Hide default chevron
                    >
                    <div className="flex items-center justify-between w-full hover:bg-muted/50">
                      {/* Left side: Chevron + Employee info */}
                      <div className="flex items-center gap-4">
                        {/* Manual chevron on the left */}
                        {hasVideos && (
                          <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                        )}
                        
                        <div className="flex-1">
                          <div className="font-medium text-left">
                            {employee.full_name || 'Unknown'}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="w-3 h-3" />
                            {employee.email}
                          </div>
                        </div>
                        
                        <div className="text-center">
                          <Badge variant="secondary">
                            {employee.assigned_videos_count || 0} videos
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Action buttons on far right */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAssignVideos(employee);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                          <span className="sr-only">Edit Video Assignments</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmEmployee(employee);
                          }}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="sr-only">Delete Employee</span>
                        </Button>
                      </div>
                    </div>
                  </AccordionTrigger>
                    
                    {hasVideos && (
                      <AccordionContent className="px-6 pb-4">
                        <div className="space-y-3">
                          <h4 className="font-medium text-sm text-muted-foreground mb-3">
                            Assigned Training Videos
                          </h4>
                          
                          {videos.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Loading video assignments...</p>
                          ) : (
                            videos.map((assignment, index) => (
                              <div 
                                key={assignment.video_id || index}
                                className="flex items-center justify-between p-3 border rounded-lg bg-muted/20"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-8 bg-muted rounded flex items-center justify-center flex-shrink-0">
                                    <Play className="w-3 h-3 text-muted-foreground" />
                                  </div>
                                  
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm">
                                      {assignment.video_title || 'Untitled Video'}
                                    </div>
                                    {assignment.video_description && (
                                      <p className="text-xs text-muted-foreground line-clamp-1">
                                        {assignment.video_description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-4 text-xs">
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <Clock className="w-3 h-3" />
                                    <span>
                                      {assignment.due_date
                                        ? `Due ${format(new Date(assignment.due_date), 'MMM d, yyyy')}`
                                        : 'No deadline'}
                                    </span>
                                  </div>
                                  
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <XCircle className="w-3 h-3" />
                                    <span>Not completed</span>
                                  </div>
                                  
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <HelpCircle className="w-3 h-3" />
                                    <span>No quiz</span>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </AccordionContent>
                    )}
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <AddEmployeeModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onEmployeeAdded={handleAddEmployee}
      />

      <AssignVideosModal
        open={showAssignModal}
        onOpenChange={setShowAssignModal}
        employee={selectedEmployee}
        onAssignmentComplete={loadEmployees}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog 
        open={!!deleteConfirmEmployee} 
        onOpenChange={() => setDeleteConfirmEmployee(null)}
      >
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
            <AlertDialogAction
              onClick={handleDeleteEmployee}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete Employee'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};