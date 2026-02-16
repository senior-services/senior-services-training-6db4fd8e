/**
 * PersonSettingsModal - Settings modal for managing a person's admin status and visibility.
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogScrollArea,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { AdminService } from '@/services/adminService';
import { assignmentOperations } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';
import type { EmployeeWithAssignments } from '@/types/employee';

interface PersonSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  person: (EmployeeWithAssignments & { is_admin?: boolean }) | null;
  onHide: (person: EmployeeWithAssignments) => void;
  onAdminToggled: () => void;
  currentUserEmail?: string;
}

export const PersonSettingsModal: React.FC<PersonSettingsModalProps> = ({
  open,
  onOpenChange,
  person,
  onHide,
  onAdminToggled,
  currentUserEmail,
}) => {
  const [stagedAdmin, setStagedAdmin] = useState(false);
  const [stagedHidden, setStagedHidden] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Reset staged state when person changes or modal opens
  useEffect(() => {
    if (open && person) {
      setStagedAdmin(person.is_admin || false);
      setStagedHidden(false);
    }
  }, [open, person]);

  if (!person) return null;

  const isSelf = !!(currentUserEmail && person?.email &&
    person.email.toLowerCase() === currentUserEmail.toLowerCase());

  const hasChanges = stagedAdmin !== (person.is_admin || false) || stagedHidden;

  const handleToggleAdmin = async (checked: boolean) => {
    try {
      if (checked) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('email', person.email)
          .maybeSingle();

        if (!profile) {
          await AdminService.addPendingAdminByEmail(person.email || '');
          toast({ title: "Success", description: "Admin invitation created. They'll get admin access when they sign in." });
        } else {
          await AdminService.addAdminByEmail(person.email || '');
          toast({ title: "Success", description: `${person.full_name || person.email} is now an administrator` });
        }
      } else {
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('email', person.email)
          .maybeSingle();

        if (profile) {
          // AdminService.removeAdminRole already updates employees.is_admin = false
          await AdminService.removeAdminRole(profile.user_id, false, person.email);
          toast({ title: "Success", description: `${person.full_name || person.email} is no longer an administrator` });
        }
        // No manual employees update needed — removeAdminRole handles it
        return;
      }

      // AdminService.addAdminByEmail already updates employees.is_admin — no manual write needed
    } catch (error: any) {
      logger.error('Error toggling admin status', error as Error);
      toast({
        title: "Error",
        description: error.message || "Failed to update admin status",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const adminChanged = stagedAdmin !== (person.is_admin || false);
      if (adminChanged) {
        await handleToggleAdmin(stagedAdmin);
        // Fire-and-forget admin status notification
        assignmentOperations.sendAdminStatusNotification({
          employee_email: person.email,
          employee_name: person.full_name || person.email,
          granted: stagedAdmin,
          app_url: window.location.origin,
        }).catch(() => {});
      }
      if (stagedHidden) {
        onHide(person);
      }

      onAdminToggled();
      onOpenChange(false);
    } catch {
      // Error already toasted in handleToggleAdmin
    } finally {
      setIsSaving(false);
    }
  };

  return (
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
                <span className="text-body">{person.full_name || 'Unknown'}</span>
                {stagedAdmin && !(person.is_admin || false) && (
                  <Badge variant="attention" showIcon>Admin pending</Badge>
                )}
                {!stagedAdmin && (person.is_admin || false) && (
                  <Badge variant="destructive" showIcon>Admin removal pending</Badge>
                )}
                {stagedAdmin === (person.is_admin || false) && person.is_admin && (
                  <Badge variant="soft-attention" showIcon>Admin</Badge>
                )}
              </div>
              <p className="form-helper-text">{person.email}</p>
            </div>

            <Separator />

            {/* Hide person */}
            <div>
              <h3 className="form-section-header !mt-0">Hide Person From Active List</h3>
              <p className="form-helper-text">
                Moves to the Hidden section without affecting assignments or progress.
              </p>
              <div className="flex items-center gap-2 mt-3">
                <Checkbox
                  id="hide-person"
                  checked={stagedHidden}
                  onCheckedChange={(checked) => setStagedHidden(checked === true)}
                  disabled={isSaving}
                  aria-label="Hide person from active list"
                />
                <Label htmlFor="hide-person" className="cursor-pointer">
                  Hide this person
                </Label>
              </div>
            </div>

            {/* Admin toggle - attention container */}
            <div className="bg-attention/10 border border-attention/20 rounded-lg p-4">
              <h3 className="form-section-header !mt-0">Administrative Privileges</h3>
              <p className="form-helper-text">
                Grant this person full admin access to manage trainings and people.
              </p>
              <div className="flex items-center gap-2 mt-3">
                <Checkbox
                  id="admin-toggle"
                  checked={stagedAdmin}
                  onCheckedChange={(checked) => setStagedAdmin(checked === true)}
                  disabled={isSaving || isSelf}
                  aria-label="Toggle administrative privileges"
                />
                <Label htmlFor="admin-toggle" className="cursor-pointer">
                  Grant admin access
                </Label>
              </div>
              {isSelf && (
                <p className="form-additional-text">
                  Admins cannot remove their own administrative privileges. To change your access level, please contact another administrator.
                </p>
              )}
            </div>
          </div>
        </DialogScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
