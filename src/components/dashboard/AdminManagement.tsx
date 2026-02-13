import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogScrollArea, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, Trash2, Shield, Mail } from 'lucide-react';
import { SortableTableHead } from '@/components/ui/sortable-table-head';
import { IconButtonWithTooltip } from '@/components/ui/icon-button-with-tooltip';
import { getTooltipText } from '@/utils/tooltipText';
import { AdminService, AdminUser } from '@/services/adminService';
import { LoadingSkeleton } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { logger } from '@/utils/logger';
import { supabase } from '@/integrations/supabase/client';
export const AdminManagement: React.FC = () => {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteConfirmAdmin, setDeleteConfirmAdmin] = useState<AdminUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [sortColumn, setSortColumn] = useState<'name' | 'dateAdded' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [employeePromotionDialog, setEmployeePromotionDialog] = useState<{
    show: boolean;
    email: string;
    employeeName?: string;
  }>({
    show: false,
    email: '',
    employeeName: ''
  });
  const {
    toast
  } = useToast();
  const handleSort = (column: 'name' | 'dateAdded') => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };
  const getSortedAdmins = () => {
    if (!sortColumn) return admins;
    return [...admins].sort((a, b) => {
      let aValue: string;
      let bValue: string;
      if (sortColumn === 'name') {
        aValue = a.isPending ? 'zzz_pending' : a.full_name || a.email || '';
        bValue = b.isPending ? 'zzz_pending' : b.full_name || b.email || '';
      } else {
        // dateAdded
        aValue = a.isPending ? 'zzz_pending' : a.created_at;
        bValue = b.isPending ? 'zzz_pending' : b.created_at;
      }
      const comparison = aValue.localeCompare(bValue);
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  };
  useEffect(() => {
    loadAdmins();
  }, []);
  const loadAdmins = async () => {
    try {
      setLoading(true);
      const data = await AdminService.getAdmins();
      setAdmins(data);
    } catch (error) {
      logger.error('Error loading admins', error as Error);
      toast({
        title: "Error",
        description: "Failed to load admins",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const checkIfEmployee = async (email: string) => {
    const {
      data,
      error
    } = await supabase.from('employees').select('email, full_name').eq('email', email.toLowerCase()).maybeSingle();
    if (error) {
      logger.error('Error checking employee status', error);
      return null;
    }
    return data;
  };
  const handleAddAdmin = async () => {
    if (!newAdminEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive"
      });
      return;
    }
    setIsAdding(true);
    try {
      // Check if user is already an employee
      const existingEmployee = await checkIfEmployee(newAdminEmail.trim());
      if (existingEmployee) {
        // Show confirmation dialog for employee promotion
        setEmployeePromotionDialog({
          show: true,
          email: newAdminEmail.trim(),
          employeeName: existingEmployee.full_name
        });
        setIsAdding(false);
        return;
      }

      // Proceed with normal admin addition
      await proceedWithAdminAddition(newAdminEmail.trim());
    } catch (error: any) {
      logger.error('Error adding admin', error as Error);
      toast({
        title: "Error",
        description: error.message || "Failed to add admin",
        variant: "destructive"
      });
      setIsAdding(false);
    }
  };
  const proceedWithAdminAddition = async (email: string) => {
    try {
      await AdminService.addAdminByEmail(email);
      setNewAdminEmail('');
      setHasChanges(false);
      setShowAddModal(false);
      await loadAdmins();
      toast({
        title: "Success",
        description: "Admin invitation sent successfully. They will gain admin access when they sign up."
      });
    } catch (error: any) {
      logger.error('Error adding admin', error as Error);
      toast({
        title: "Error",
        description: error.message || "Failed to add admin",
        variant: "destructive"
      });
    } finally {
      setIsAdding(false);
    }
  };
  const handleConfirmEmployeePromotion = async () => {
    setEmployeePromotionDialog({
      show: false,
      email: '',
      employeeName: ''
    });
    setIsAdding(true);
    await proceedWithAdminAddition(employeePromotionDialog.email);
  };
  const handleDeleteAdmin = async () => {
    if (!deleteConfirmAdmin) return;
    setIsDeleting(true);
    try {
      await AdminService.removeAdminRole(deleteConfirmAdmin.id, deleteConfirmAdmin.isPending);
      setDeleteConfirmAdmin(null);
      
      // Simple delay then reload
      await new Promise(resolve => setTimeout(resolve, 200));
      await loadAdmins();
      
      toast({
        title: "Success",
        description: deleteConfirmAdmin.isPending ? "Pending admin invitation removed" : "Admin removed successfully"
      });
    } catch (error: any) {
      logger.error('Error removing admin', error as Error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove admin",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };
  return <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-semibold">Admin Management</h3>
          <p className="text-muted-foreground">Manage admins, employees, and training assignments</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Add Admin
        </Button>
      </div>

      {/* Admins Table */}
      <Card className="shadow-md">
        <CardContent className="p-0">
          {loading ? <div className="p-6 space-y-4">
              <LoadingSkeleton lines={1} className="h-12" />
              <LoadingSkeleton lines={1} className="h-12" />
              <LoadingSkeleton lines={1} className="h-12" />
            </div> : admins.length === 0 ? <div className="text-center py-12">
              <div className="space-y-3">
                <Shield className="w-12 h-12 text-muted-foreground mx-auto" />
                <div>
                  <h4 className="font-medium text-foreground">
                    No admins found
                  </h4>
                  <p className="text-body-sm text-muted-foreground">
                    Add administrators to manage the system.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowAddModal(true)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add First Admin
                </Button>
              </div>
            </div> : <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead
                    column="name"
                    sortColumn={sortColumn}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  >
                    Name
                  </SortableTableHead>
                  <TableHead>Email</TableHead>
                  <SortableTableHead
                    column="dateAdded"
                    sortColumn={sortColumn}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  >
                    Date Added
                  </SortableTableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getSortedAdmins().map(admin => <TableRow key={admin.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div>
                          <span>{admin.isPending ? '--' : admin.full_name || 'Unknown'}</span>
                          <Badge variant="soft-attention" showIcon className="ml-2">
                            {admin.isPending ? 'Pending' : 'Admin'}
                          </Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-foreground">
                      {admin.email}
                    </TableCell>
                    <TableCell className="text-foreground">
                      {admin.isPending ? 'Pending' : format(new Date(admin.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end">
                        <IconButtonWithTooltip
                          icon={Trash2}
                          tooltip={getTooltipText('remove-admin')}
                          onClick={() => setDeleteConfirmAdmin(admin)}
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                        />
                      </div>
                    </TableCell>
                  </TableRow>)}
              </TableBody>
            </Table>}
        </CardContent>
      </Card>

      {/* Add Admin Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Administrator</DialogTitle>
          </DialogHeader>
          
          <DialogScrollArea>
            <div className="space-y-4">
              <div>
                <Label htmlFor="admin-email">Email Address</Label>
                <Input id="admin-email" type="email" placeholder="admin@example.com" value={newAdminEmail} onChange={e => {
                setNewAdminEmail(e.target.value);
                setHasChanges(true);
              }} onKeyDown={e => {
                if (e.key === 'Enter') {
                  handleAddAdmin();
                }
              }} />
              </div>
            </div>
          </DialogScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
            setShowAddModal(false);
            setNewAdminEmail('');
            setHasChanges(false);
          }} disabled={isAdding}>
              Cancel
            </Button>
            <Button onClick={handleAddAdmin} disabled={isAdding || !hasChanges}>
              {isAdding ? 'Adding...' : 'Add Admin'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Employee Promotion Confirmation Dialog */}
      <AlertDialog open={employeePromotionDialog.show} onOpenChange={open => {
      if (!open) {
        setEmployeePromotionDialog({
          show: false,
          email: '',
          employeeName: ''
        });
      }
    }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-orange-600">
              Promote Employee to Administrator
            </AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{employeePromotionDialog.employeeName || employeePromotionDialog.email}</strong> is currently an employee with training assignments.
              <br />
              <br />
              By promoting them to administrator:
              <ul className="list-disc list-inside mt-2 space-y-1 text-destructive">
                <li>All their current video assignments will be removed</li>
                <li>All training progress and quiz results will be deleted</li>
                <li>They will lose access to employee training materials</li>
                <li>They will gain full administrative privileges</li>
              </ul>
              <br />
              <strong className="text-destructive">
                This action cannot be undone. Training data will be permanently lost.
              </strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isAdding}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmEmployeePromotion} disabled={isAdding} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isAdding ? 'Promoting...' : 'Promote to Admin'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmAdmin} onOpenChange={() => setDeleteConfirmAdmin(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteConfirmAdmin?.isPending ? 'Cancel Admin Invitation' : 'Remove Administrator'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirmAdmin?.isPending ? (
                <>
                  Are you sure you want to cancel the invitation for <strong>{deleteConfirmAdmin?.email}</strong>? The invitation will be permanently cancelled.
                </>
              ) : (
                <>
                  Are you sure you want to remove admin privileges from "{deleteConfirmAdmin?.email}"?
                  <br />
                  <br />
                  This will:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Remove their admin access to the system</li>
                    <li>Restrict them to employee-level permissions</li>
                    <li>Prevent them from managing other users</li>
                  </ul>
                  <br />
                  <strong>
                    This action can be reversed by adding them as an admin again.
                  </strong>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAdmin} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isDeleting ? 'Processing...' : deleteConfirmAdmin?.isPending ? 'Cancel Invitation' : 'Remove Admin'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
};