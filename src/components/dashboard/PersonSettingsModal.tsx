/**
 * PersonSettingsModal - Settings modal for managing a person's admin status and visibility.
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogScrollArea,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AdminService } from '@/services/adminService';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';
import type { EmployeeWithAssignments } from '@/types/employee';

interface PersonSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  person: (EmployeeWithAssignments & { is_admin?: boolean }) | null;
  onHide: (person: EmployeeWithAssignments) => void;
  onAdminToggled: () => void;
}

export const PersonSettingsModal: React.FC<PersonSettingsModalProps> = ({
  open,
  onOpenChange,
  person,
  onHide,
  onAdminToggled,
}) => {
  const [isToggling, setIsToggling] = useState(false);
  const [showHideConfirm, setShowHideConfirm] = useState(false);
  const { toast } = useToast();

  if (!person) return null;

  const handleToggleAdmin = async (checked: boolean) => {
    setIsToggling(true);
    try {
      if (checked) {
        // Promote to admin: find user_id from profiles, then call promote
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('email', person.email)
          .maybeSingle();

        if (!profile) {
          // User hasn't signed up yet - add as pending admin
          await AdminService.addPendingAdminByEmail(person.email || '');
          toast({ title: "Success", description: "Admin invitation created. They'll get admin access when they sign in." });
        } else {
          await AdminService.addAdminByEmail(person.email || '');
          toast({ title: "Success", description: `${person.full_name || person.email} is now an administrator` });
        }
      } else {
        // Demote from admin: find user_id from profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('email', person.email)
          .maybeSingle();

        if (profile) {
          await AdminService.removeAdminRole(profile.user_id, false);
          toast({ title: "Success", description: `${person.full_name || person.email} is no longer an administrator` });
        }
      }

      // Update is_admin on employees table for display purposes
      await supabase
        .from('employees')
        .update({ is_admin: checked })
        .eq('id', person.id);

      onAdminToggled();
    } catch (error: any) {
      logger.error('Error toggling admin status', error as Error);
      toast({
        title: "Error",
        description: error.message || "Failed to update admin status",
        variant: "destructive",
      });
    } finally {
      setIsToggling(false);
    }
  };

  const handleHideConfirmed = () => {
    setShowHideConfirm(false);
    onOpenChange(false);
    onHide(person);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Person Settings</DialogTitle>
          </DialogHeader>

          <DialogScrollArea>
            <div className="space-y-6">
              {/* Person info */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{person.full_name || 'Unknown'}</span>
                  {person.is_admin && <Badge variant="soft-attention" showIcon>Admin</Badge>}
                </div>
                <p className="text-body-sm text-muted-foreground">{person.email}</p>
              </div>

              {/* Admin toggle */}
              <div className="flex items-center justify-between gap-4 py-3 border-t border-b border-border-primary">
                <div>
                  <Label htmlFor="admin-toggle" className="font-medium">Administrative Privileges</Label>
                  <p className="text-body-sm text-muted-foreground mt-1">
                    Grant this person full admin access to manage trainings and people.
                  </p>
                </div>
                <Switch
                  id="admin-toggle"
                  checked={person.is_admin || false}
                  onCheckedChange={handleToggleAdmin}
                  disabled={isToggling}
                  aria-label="Toggle administrative privileges"
                />
              </div>

              {/* Hide person */}
              <div>
                <Button
                  variant="outline"
                  className="w-full justify-start text-muted-foreground hover:text-destructive"
                  onClick={() => setShowHideConfirm(true)}
                >
                  <EyeOff className="w-4 h-4 mr-2" />
                  Hide Person
                </Button>
                <p className="text-body-sm text-muted-foreground mt-2">
                  Moves to the Hidden section without affecting assignments or progress.
                </p>
              </div>
            </div>
          </DialogScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hide Confirmation */}
      <AlertDialog open={showHideConfirm} onOpenChange={setShowHideConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hide this person?</AlertDialogTitle>
            <AlertDialogDescription>
              "{person.full_name || person.email}" will move to the Hidden section without affecting their assignments or progress.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleHideConfirmed}>
              Hide Person
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
