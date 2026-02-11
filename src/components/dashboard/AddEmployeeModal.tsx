import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogScrollArea,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, Mail } from 'lucide-react';
import { employeeOperations } from '@/services/api';
import type { Employee } from '@/types/employee';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

interface AddEmployeeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEmployeeAdded: (employee: Employee) => void;
}

export const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({
  open,
  onOpenChange,
  onEmployeeAdded,
}) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: "Error",
        description: "Email address is required",
        variant: "destructive",
      });
      return;
    }

    if (!validateEmail(email)) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await employeeOperations.add(email.trim().toLowerCase());
      if (result.success && result.data) {
        // Transform API response to match expected Employee type
        const employee = {
          id: result.data.id,
          email: result.data.email,
          full_name: result.data.name,
          created_at: result.data.created_at || new Date().toISOString(),
          updated_at: result.data.updated_at || new Date().toISOString()
        };
        onEmployeeAdded(employee);
        handleClose();
        toast({
          title: "Success",
          description: "Employee added successfully"
        });
      } else {
        throw new Error(result.error || 'Failed to add employee');
      }
    } catch (error: any) {
      logger.error('Error adding employee', error as Error);
      
      // Handle duplicate email error
      if (error?.code === '23505' || error?.message?.includes('duplicate')) {
        toast({
          title: "Error",
          description: "An employee with this email already exists",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to add employee. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setIsSubmitting(false);
    setHasChanges(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Add New Employee
          </DialogTitle>
        </DialogHeader>

        <DialogScrollArea>
          <form id="add-employee-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="employee@company.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setHasChanges(true);
                }}
                required
                disabled={isSubmitting}
              />
              <p className="form-additional-text">
                The employee will be able to access assigned videos when they sign in with this email.
              </p>
            </div>

          </form>
        </DialogScrollArea>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" form="add-employee-form" disabled={isSubmitting || !hasChanges}>
            {isSubmitting ? 'Adding...' : 'Add Employee'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};