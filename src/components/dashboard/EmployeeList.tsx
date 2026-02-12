/**
 * Accessible employee list component for admin dashboard
 * Displays employee training progress with proper accessibility features
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LoadingSkeleton } from '@/components/ui/loading-spinner';
import { Users, ChevronDown, ChevronUp, User } from 'lucide-react';
import { Employee } from '@/types';
import { announceToScreenReader } from '@/utils/accessibility';
import { cn } from '@/lib/utils';

interface EmployeeListProps {
  employees: Employee[];
  loading?: boolean;
  onEmployeeSelect?: (employee: Employee) => void;
  className?: string;
}

/**
 * Gets status variant for Badge component
 */
const getStatusVariant = (status: Employee['status']) => {
  switch (status) {
    case 'completed':
      return 'default';
    case 'on-track':
      return 'secondary';
    case 'behind':
      return 'destructive';
    default:
      return 'secondary';
  }
};

/**
 * Gets accessible status text
 */
const getStatusText = (status: Employee['status']) => {
  switch (status) {
    case 'completed':
      return 'Training completed';
    case 'on-track':
      return 'On track with training';
    case 'behind':
      return 'Behind schedule on training';
    default:
      return 'Training status unknown';
  }
};

/**
 * Employee list component with accessibility features
 */
export const EmployeeList: React.FC<EmployeeListProps> = ({
  employees,
  loading = false,
  onEmployeeSelect,
  className,
}) => {
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'progress' | 'status'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  /**
   * Handles sorting of employee list
   */
  const handleSort = (field: 'name' | 'progress' | 'status') => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }

    announceToScreenReader(
      `Employee list sorted by ${field} in ${sortDirection === 'asc' ? 'descending' : 'ascending'} order`
    );
  };

  /**
   * Toggles employee details expansion
   */
  const toggleEmployeeDetails = (employeeId: string, employeeName: string) => {
    const isExpanding = expandedEmployee !== employeeId;
    setExpandedEmployee(isExpanding ? employeeId : null);
    
    announceToScreenReader(
      `Employee details for ${employeeName} ${isExpanding ? 'expanded' : 'collapsed'}`
    );
  };

  /**
   * Sorts employees based on current sort criteria
   */
  const sortedEmployees = React.useMemo(() => {
    if (!employees.length) return employees;

    return [...employees].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'progress':
          comparison = a.requiredProgress - b.requiredProgress;
          break;
        case 'status':
          const statusOrder = { 'behind': 0, 'on-track': 1, 'completed': 2 };
          comparison = statusOrder[a.status] - statusOrder[b.status];
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [employees, sortBy, sortDirection]);

  /**
   * Calculates overall statistics
   */
  const stats = React.useMemo(() => {
    const total = employees.length;
    const completed = employees.filter(emp => emp.status === 'completed').length;
    const onTrack = employees.filter(emp => emp.status === 'on-track').length;
    const behind = employees.filter(emp => emp.status === 'behind').length;
    
    return { total, completed, onTrack, behind };
  }, [employees]);

  if (loading) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="space-y-2">
          <LoadingSkeleton lines={1} className="h-8 w-64" />
          <LoadingSkeleton lines={1} className="h-4 w-96" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <LoadingSkeleton key={i} lines={2} avatar />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header and statistics */}
      <div className="space-y-4">
        <div>
          <h3 className="text-xl font-semibold">Employee Progress Overview</h3>
          <p className="text-muted-foreground">
            Track training completion and identify employees who need support
          </p>
        </div>

        {/* Progress statistics */}
        <div 
          className="grid grid-cols-1 sm:grid-cols-4 gap-4"
          role="region"
          aria-labelledby="progress-stats-title"
        >
          <h4 id="progress-stats-title" className="sr-only">
            Training Progress Statistics
          </h4>
          
          <div className="text-center p-4 bg-muted/30 rounded-lg">
            <div className="text-h2 font-bold text-foreground">{stats.total}</div>
            <div className="text-small text-muted-foreground">Total Employees</div>
          </div>
          
          <div className="text-center p-4 bg-success/10 rounded-lg">
            <div className="text-h2 font-bold text-success">{stats.completed}</div>
            <div className="text-small text-muted-foreground">Completed</div>
          </div>
          
          <div className="text-center p-4 bg-secondary/10 rounded-lg">
            <div className="text-h2 font-bold text-secondary-foreground">{stats.onTrack}</div>
            <div className="text-small text-muted-foreground">On Track</div>
          </div>
          
          <div className="text-center p-4 bg-destructive/10 rounded-lg">
            <div className="text-h2 font-bold text-destructive">{stats.behind}</div>
            <div className="text-small text-muted-foreground">Behind Schedule</div>
          </div>
        </div>

        {/* Sorting controls */}
        <div className="flex flex-wrap gap-2">
          <span className="text-small font-medium text-muted-foreground">Sort by:</span>
          
          <Button
            variant={sortBy === 'name' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleSort('name')}
            aria-label={`Sort by name ${sortBy === 'name' ? 
              (sortDirection === 'asc' ? 'descending' : 'ascending') : 'ascending'
            }`}
          >
            Name
            {sortBy === 'name' && (
              <span className="ml-1" aria-hidden="true">
                {sortDirection === 'asc' ? '↑' : '↓'}
              </span>
            )}
          </Button>
          
          <Button
            variant={sortBy === 'progress' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleSort('progress')}
            aria-label="Sort by progress"
          >
            Progress
            {sortBy === 'progress' && (
              <span className="ml-1" aria-hidden="true">
                {sortDirection === 'asc' ? '↑' : '↓'}
              </span>
            )}
          </Button>
          
          <Button
            variant={sortBy === 'status' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleSort('status')}
            aria-label="Sort by status"
          >
            Status
            {sortBy === 'status' && (
              <span className="ml-1" aria-hidden="true">
                {sortDirection === 'asc' ? '↑' : '↓'}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Employee list */}
      {employees.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" aria-hidden="true" />
          <h4 className="font-medium text-foreground mb-2">No employees found</h4>
          <p className="text-small text-muted-foreground">
            Employee data will appear here when available.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedEmployees.map((employee) => (
            <div
              key={employee.id}
              className="border border-border-primary rounded-lg p-4 hover:bg-muted/50 transition-colors"
              role="article"
              aria-labelledby={`employee-${employee.id}-name`}
              aria-describedby={`employee-${employee.id}-progress`}
            >
              {/* Employee header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                       <div 
                         id={`employee-${employee.id}-name`}
                         className="flex items-center gap-3 font-medium text-foreground"
                       >
                         <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                           <User className="w-4 h-4 text-primary" />
                         </div>
                         <span>{employee.name}</span>
                         <span className="text-muted-foreground">|</span>
                         <span className="text-small text-muted-foreground font-normal">{employee.email}</span>
                       </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Badge 
                        variant={getStatusVariant(employee.status)}
                        aria-label={getStatusText(employee.status)}
                      >
                        {employee.status === 'completed' ? 'Completed' :
                         employee.status === 'on-track' ? 'On Track' : 'Behind Schedule'}
                      </Badge>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleEmployeeDetails(employee.id, employee.name)}
                        aria-expanded={expandedEmployee === employee.id}
                        aria-controls={`employee-${employee.id}-details`}
                        aria-label={`${expandedEmployee === employee.id ? 'Hide' : 'Show'} details for ${employee.name}`}
                      >
                        {expandedEmployee === employee.id ? (
                          <ChevronUp className="w-4 h-4" aria-hidden="true" />
                        ) : (
                          <ChevronDown className="w-4 h-4" aria-hidden="true" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div 
                id={`employee-${employee.id}-progress`}
                className="space-y-2"
              >
                <div className="flex justify-between text-small">
                  <span>Training Progress</span>
                  <span className="font-medium">{employee.requiredProgress}%</span>
                </div>
                <Progress 
                  value={employee.requiredProgress} 
                  className="h-2"
                  aria-label={`Training progress: ${employee.requiredProgress} percent complete`}
                />
                <div className="text-small text-muted-foreground">
                  {employee.completedVideos} of {employee.totalVideos} videos completed
                </div>
              </div>

              {/* Expandable details */}
              {expandedEmployee === employee.id && (
                <div
                  id={`employee-${employee.id}-details`}
                  className="mt-4 pt-4 border-t border-border-primary space-y-3"
                  role="region"
                  aria-label={`Detailed information for ${employee.name}`}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-small">
                    <div>
                      <span className="font-medium text-muted-foreground">Email:</span>
                      <p className="text-foreground">{employee.email}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Status:</span>
                      <p className="text-foreground capitalize">{employee.status.replace('-', ' ')}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Completed Videos:</span>
                      <p className="text-foreground">{employee.completedVideos}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Remaining Videos:</span>
                      <p className="text-foreground">{employee.totalVideos - employee.completedVideos}</p>
                    </div>
                  </div>

                  {onEmployeeSelect && (
                    <div className="pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEmployeeSelect(employee)}
                        aria-label={`View detailed progress for ${employee.name}`}
                      >
                        View Details
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Summary for screen readers */}
      <div className="sr-only" aria-live="polite">
        {employees.length > 0 &&
          `Employee overview: ${stats.completed} completed, ${stats.onTrack} on track, ${stats.behind} behind schedule out of ${stats.total} total employees.`
        }
      </div>
    </div>
  );
};