import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, Trash2, Shield, Mail, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { AdminService, AdminUser } from '@/services/adminService';
import { LoadingSkeleton } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { logger } from '@/utils/logger';
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
  const { toast } = useToast();

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
        aValue = a.isPending ? 'zzz_pending' : (a.full_name || a.email || '');
        bValue = b.isPending ? 'zzz_pending' : (b.full_name || b.email || '');
      } else { // dateAdded
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
      await AdminService.addAdminByEmail(newAdminEmail.trim());
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
  const handleDeleteAdmin = async () => {
    if (!deleteConfirmAdmin) return;
    setIsDeleting(true);
    try {
      await AdminService.removeAdminRole(deleteConfirmAdmin.id, deleteConfirmAdmin.isPending);
      setDeleteConfirmAdmin(null);
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
          <h3 className="text-xl font-semibold">Admin Management</h3>
          <p className="text-muted-foreground">Manage admins, employees, and training assignments.</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Add Admin
        </Button>
      </div>

      {/* Admins Table */}
      <Card>
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
                  <p className="text-sm text-muted-foreground">
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
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('name')}
                      className={`text-xs uppercase text-muted-foreground p-0 h-auto hover:bg-transparent hover:text-primary group ${
                        sortColumn === 'name' 
                          ? 'font-bold' 
                          : 'font-medium'
                      }`}
                    >
                      Name
                      {sortColumn === 'name' ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp className="ml-2 h-4 w-4" />
                        ) : (
                          <ArrowDown className="ml-2 h-4 w-4" />
                        )
                      ) : (
                        <ArrowUpDown className="ml-2 h-4 w-4 opacity-50 group-hover:text-primary group-hover:opacity-100" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase text-muted-foreground">Email</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('dateAdded')}
                      className={`text-xs uppercase text-muted-foreground p-0 h-auto hover:bg-transparent hover:text-primary group ${
                        sortColumn === 'dateAdded' 
                          ? 'font-bold' 
                          : 'font-medium'
                      }`}
                    >
                      Date Added
                      {sortColumn === 'dateAdded' ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp className="ml-2 h-4 w-4" />
                        ) : (
                          <ArrowDown className="ml-2 h-4 w-4" />
                        )
                      ) : (
                        <ArrowUpDown className="ml-2 h-4 w-4 opacity-50 group-hover:text-primary group-hover:opacity-100" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead className="text-right text-xs font-medium uppercase text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getSortedAdmins().map(admin => <TableRow key={admin.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Shield className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <span>{admin.isPending ? '--' : admin.full_name || 'Unknown'}</span>
                          <Badge variant="secondary" className={`ml-2 text-xs ${admin.isPending ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400' : 'bg-primary/10 text-primary'}`}>
                            {admin.isPending ? 'Pending' : 'Admin'}
                          </Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-foreground">
                      {admin.email}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {admin.isPending ? 'Pending' : format(new Date(admin.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => setDeleteConfirmAdmin(admin)} className="text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                        <span className="sr-only">{admin.isPending ? 'Cancel Invitation' : 'Remove Admin'}</span>
                      </Button>
                    </TableCell>
                  </TableRow>)}
              </TableBody>
            </Table>}
        </CardContent>
      </Card>

      {/* Add Admin Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Administrator</DialogTitle>
          </DialogHeader>
          
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmAdmin} onOpenChange={() => setDeleteConfirmAdmin(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteConfirmAdmin?.isPending ? 'Cancel Admin Invitation' : 'Remove Administrator'}
            </AlertDialogTitle>
          </AlertDialogHeader>
          <div className="px-6 py-4">
            <AlertDialogDescription>
              Are you sure you want to {deleteConfirmAdmin?.isPending ? 'cancel the invitation for' : 'remove admin privileges from'} "{deleteConfirmAdmin?.email}"?
              <br />
              <br />
              This will:
              <ul className="list-disc list-inside mt-2 space-y-1">
                {deleteConfirmAdmin?.isPending ? <li>Cancel their pending admin invitation</li> : <>
                    <li>Remove their admin access to the system</li>
                    <li>Restrict them to employee-level permissions</li>
                    <li>Prevent them from managing other users</li>
                  </>}
              </ul>
              <br />
              <strong>
                {deleteConfirmAdmin?.isPending ? 'The invitation will be permanently cancelled.' : 'This action can be reversed by adding them as an admin again.'}
              </strong>
            </AlertDialogDescription>
          </div>
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