import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { ChevronDown, LogOut, User } from "lucide-react";
// Using uploaded logo image

interface HeaderProps {
  userRole: 'admin' | 'employee';
  userName: string;
  userEmail: string;
  overallProgress?: number;
  onLogout: () => void;
}

export const Header = ({ userRole, userName, userEmail, overallProgress, onLogout }: HeaderProps) => {
  const subtitle = userRole === 'admin' ? 'Administrator Portal' : 'Employee Portal';

  return (
    <header className="bg-background border-b border-border shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Left Side - Logo and Title */}
          <div className="flex items-center space-x-4">
            <img 
              src="/lovable-uploads/f28cf692-0409-41a6-bb28-b62ca7589dcb.png" 
              alt="Senior Services for South Sound" 
              className="h-12 w-auto object-cover"
              style={{ objectPosition: 'left center' }}
            />
            <div>
              <h1 className="text-xl font-bold text-primary">
                Employee Training Portal
              </h1>
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            </div>
          </div>

          {/* Center - Overall Progress (Employee Only) */}
          {userRole === 'employee' && overallProgress !== undefined && (
            <div className="hidden md:flex items-center space-x-3 flex-1 max-w-md mx-8">
              <span className="text-sm font-medium text-foreground whitespace-nowrap">
                Overall Progress:
              </span>
              <div className="flex-1">
                <Progress value={overallProgress} className="h-2" />
              </div>
              <span className="text-sm font-semibold text-primary whitespace-nowrap">
                {overallProgress}%
              </span>
            </div>
          )}

          {/* Right Side - User Info and Menu */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-foreground">{userName}</p>
              <p className="text-xs text-muted-foreground">{userEmail}</p>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <User className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="sm:hidden px-3 py-2 border-b border-border">
                  <p className="text-sm font-medium text-foreground">{userName}</p>
                  <p className="text-xs text-muted-foreground">{userEmail}</p>
                </div>
                <DropdownMenuItem onClick={onLogout} className="flex items-center space-x-2">
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Progress Bar */}
        {userRole === 'employee' && overallProgress !== undefined && (
          <div className="md:hidden mt-4 flex items-center space-x-3">
            <span className="text-sm font-medium text-foreground">
              Progress:
            </span>
            <div className="flex-1">
              <Progress value={overallProgress} className="h-2" />
            </div>
            <span className="text-sm font-semibold text-primary">
              {overallProgress}%
            </span>
          </div>
        )}
      </div>
    </header>
  );
};