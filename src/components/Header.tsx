import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, LayoutDashboard, BookOpen, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

interface HeaderProps {
  userRole: "admin" | "employee";
  userName: string;
  userEmail: string;
  onLogout: () => void;
  /** Which view is currently active — controls header background color */
  currentView?: "admin" | "dashboard";
}

export const Header = ({ userRole, userName, userEmail, onLogout, currentView }: HeaderProps) => {
  const navigate = useNavigate();
  const isAdmin = userRole === "admin";
  const isAdminView = currentView === "admin";

  // Dynamic subtitle based on current view
  const subtitle = isAdminView ? "Admin Dashboard" : "Employee Dashboard";

  // Dynamic background: purple for admin view, navy for employee/dashboard view
  const headerBg = isAdminView ? "bg-background-header-admin" : "bg-background-header";
  const headerTextColor = isAdminView ? "text-attention-foreground" : "text-primary-foreground";

  return (
    <header className={`${headerBg} border-b border-border-primary shadow-card`}>
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Left Side - Logo and Title */}
          <div className="flex items-center space-x-4">
            <Link to={isAdmin ? "/admin" : "/dashboard"} className="flex items-center space-x-6 hover:opacity-80 transition-all duration-200">
              <img
                src="/lovable-uploads/SS_logo_reversed_cropped.png"
                alt="Senior Services for South Sound"
                className="h-12 w-auto object-cover py-1"
                style={{
                  objectPosition: "left center",
                }}
              />
              <div>
                <h1 className={`text-h4 ${headerTextColor}`}>
                  <span className="font-bold">Training Portal</span>{" "}
                  <span className="font-normal">/ {subtitle}</span>
                </h1>
              </div>
            </Link>
          </div>

          {/* Right Side - Admin Badge + User Dropdown */}
          <div className="flex items-center space-x-3">
            {/* Admin Badge - shown when user is admin, regardless of current view */}
            {isAdmin && (
              <Badge variant="attention" showIcon>
                Admin
              </Badge>
            )}

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className={`button-ghost-dark ${headerTextColor}`}>
                  {userName} <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {/* Show navigation options for admins */}
                {isAdmin && (
                  <>
                    <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                      <BookOpen className="w-4 h-4 mr-2" />
                      My Personal Trainings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/admin")}>
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      Admin Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={onLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};
