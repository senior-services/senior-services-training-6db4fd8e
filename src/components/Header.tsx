import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown, LogOut, User } from "lucide-react";
import { Link } from "react-router-dom";
// Using uploaded logo image

interface HeaderProps {
  userRole: 'admin' | 'employee';
  userName: string;
  userEmail: string;
  onLogout: () => void;
}
export const Header = ({
  userRole,
  userName,
  userEmail,
  onLogout
}: HeaderProps) => {
  const subtitle = userRole === 'admin' ? 'Administrator Dashboard' : 'Employee Portal';
  return (
    <header className="bg-background border-b border-border-primary shadow-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Left Side - Logo and Title */}
          <div className="flex items-center space-x-4">
            <Link to="/dashboard" className="flex items-center space-x-6 hover:opacity-80 transition-all duration-200">
              <img src="/lovable-uploads/f28cf692-0409-41a6-bb28-b62ca7589dcb.png" alt="Senior Services for South Sound" className="h-12 w-auto object-cover" style={{
              objectPosition: 'left center'
            }} />
              <div>
                <h1 className="text-xl font-bold text-primary">Learning Hub</h1>
                <p className={`text-sm hidden sm:block ${
                  userRole === 'admin' 
                    ? 'font-bold text-[hsl(var(--admin-highlight))]' 
                    : 'text-muted-foreground'
                }`}>
                  {userRole === 'admin' ? 'Admin Dashboard' : 'Employee Dashboard'}
                </p>
              </div>
            </Link>
          </div>

          {/* Right Side - User Info and Menu */}
          <div className="flex items-center space-x-2">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-foreground">{userName}</p>
              
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center space-x-1 hover:shadow-md transition-shadow">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <User className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="sm:hidden px-3 py-2 border-b border-border-primary">
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

      </div>
    </header>
  );
};