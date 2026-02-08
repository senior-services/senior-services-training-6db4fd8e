import React, { useState } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Banner } from "@/components/ui/banner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogScrollArea, DialogTitle, DialogTrigger, FullscreenDialogContent, DialogClose } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Calendar } from "@/components/ui/calendar";
import { LoadingSkeleton } from "@/components/ui/loading-spinner";
import { ComponentUpdateIndicator } from "@/components/ui/ComponentUpdateIndicator";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { IconButtonWithTooltip } from "@/components/ui/icon-button-with-tooltip";
import { SortableTableHead } from "@/components/ui/sortable-table-head";
import { getTooltipText } from "@/utils/tooltipText";
import { useToast } from "@/hooks/use-toast";
import { Home, Settings, User, Bell, Search, Plus, Edit, Trash2, Download, Upload, Eye, EyeOff, AlertCircle, CheckCircle, Info, X, ArrowUp, ArrowDown, ArrowUpDown, ChevronDown, ChevronUp } from "lucide-react";
import { TrainingCard } from "@/components/TrainingCard";
import type { TrainingVideo } from "@/components/TrainingCard";
interface ComponentsGalleryProps {
  userName: string;
  userEmail: string;
  onLogout: () => void;
}
export const ComponentsGallery = ({
  userName,
  userEmail,
  onLogout
}: ComponentsGalleryProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [switchValue, setSwitchValue] = useState(false);
  const [twoOptionToggle, setTwoOptionToggle] = useState<string>("light");
  const [multiOptionToggle, setMultiOptionToggle] = useState<string>("medium");
  const [checkboxValue, setCheckboxValue] = useState(false);
  const [radioValue, setRadioValue] = useState("option1");
  const [selectValue, setSelectValue] = useState("");
  const [checkboxGroupValue, setCheckboxGroupValue] = useState<string[]>(["option1"]);
  const [progress, setProgress] = useState(33);
  const [isLoading, setIsLoading] = useState(false);
  const [sortColumn, setSortColumn] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [expandedEmployees, setExpandedEmployees] = useState<Set<string>>(new Set());

  // Icon state management for button examples
  const [buttonIcons, setButtonIcons] = useState({
    default: "Plus",
    outline: "Edit",
    destructive: "Trash2",
    ghost: "Download",
    secondary: "Settings"
  });
  const availableIcons = {
    Plus,
    Edit,
    Trash2,
    Download,
    Settings,
    Search,
    Bell,
    User,
    Home,
    Upload,
    Eye,
    EyeOff,
    AlertCircle,
    CheckCircle,
    Info,
    X,
    ArrowUp,
    ArrowDown,
    ArrowUpDown
  };
  const getIconComponent = (iconName: string) => {
    return availableIcons[iconName as keyof typeof availableIcons] || Plus;
  };
  const cycleIcon = (variant: keyof typeof buttonIcons) => {
    const iconNames = Object.keys(availableIcons);
    const currentIndex = iconNames.indexOf(buttonIcons[variant]);
    const nextIndex = (currentIndex + 1) % iconNames.length;
    setButtonIcons(prev => ({
      ...prev,
      [variant]: iconNames[nextIndex]
    }));
  };
  const tableData = [{
    name: "Alice Johnson",
    email: "alice@example.com",
    department: "101"
  }, {
    name: "Bob Wilson",
    email: "bob@example.com",
    department: "205"
  }, {
    name: "Carol Smith",
    email: "carol@example.com",
    department: "150"
  }, {
    name: "David Brown",
    email: "david@example.com",
    department: "89"
  }, {
    name: "Emma Davis",
    email: "emma@example.com",
    department: "312"
  }];
  const sortedData = [...tableData].sort((a, b) => {
    const aValue = a[sortColumn as keyof typeof a];
    const bValue = b[sortColumn as keyof typeof b];

    // Handle numerical sorting for department column
    if (sortColumn === "department") {
      const aNum = parseInt(aValue);
      const bNum = parseInt(bValue);
      let comparison = aNum - bNum;
      // Secondary sort: alphabetical by name when department is the same
      if (comparison === 0) {
        comparison = a.name.localeCompare(b.name);
      }
      return sortDirection === "asc" ? comparison : -comparison;
    }

    // String sorting for other columns
    let comparison = aValue.localeCompare(bValue);
    // Secondary sort: alphabetical by name when primary column values are the same
    if (comparison === 0 && sortColumn !== "name") {
      comparison = a.name.localeCompare(b.name);
    }
    return sortDirection === "asc" ? comparison : -comparison;
  });
  const {
    toast
  } = useToast();
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };
  const showToast = (type: "default" | "destructive" | "success") => {
    switch (type) {
      case "success":
        toast({
          title: "Success!",
          description: "This is a success message.",
          variant: "success"
        });
        break;
      case "destructive":
        toast({
          title: "Error!",
          description: "This is an error message.",
          variant: "destructive"
        });
        break;
      default:
        toast({
          title: "Info",
          description: "This is an info message."
        });
    }
  };
  const toggleLoading = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };
  const toggleEmployeeExpanded = (employeeId: string) => {
    setExpandedEmployees(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(employeeId)) {
        newExpanded.delete(employeeId);
      } else {
        newExpanded.add(employeeId);
      }
      return newExpanded;
    });
  };
  return <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        <Header userRole="admin" userName={userName} userEmail={userEmail} onLogout={onLogout} />
        
        <main className="container mx-auto px-4 py-8 space-y-12">
          {/* Page Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-foreground">Components Gallery</h1>
            
            
            {/* Anchor Navigation */}
            <nav className="pt-4">
              <ul className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-x-6 text-left">
                 <li className="break-inside-avoid mb-1">
                    <a href="#banners" className="block text-xs text-primary hover:text-primary/80 px-2 py-1 rounded hover:bg-primary/10 transition-colors font-medium">
                      Banners
                    </a>
                  </li>
                 <li className="break-inside-avoid mb-1">
                   <a href="#badges" className="block text-xs text-primary hover:text-primary/80 px-2 py-1 rounded hover:bg-primary/10 transition-colors font-medium">
                     Badges
                   </a>
                 </li>
                <li className="break-inside-avoid mb-1">
                  <a href="#buttons" className="block text-xs text-primary hover:text-primary/80 px-2 py-1 rounded hover:bg-primary/10 transition-colors font-medium">
                    Buttons
                  </a>
                </li>
                <li className="break-inside-avoid mb-1">
                  <a href="#calendar" className="block text-xs text-primary hover:text-primary/80 px-2 py-1 rounded hover:bg-primary/10 transition-colors font-medium">
                    Calendar
                  </a>
                </li>
                <li className="break-inside-avoid mb-1">
                  <a href="#color-palette" className="block text-xs text-primary hover:text-primary/80 px-2 py-1 rounded hover:bg-primary/10 transition-colors font-medium">
                    Color Palette
                  </a>
                </li>
                <li className="break-inside-avoid mb-1">
                  <a href="#data-display" className="block text-xs text-primary hover:text-primary/80 px-2 py-1 rounded hover:bg-primary/10 transition-colors font-medium">
                    Data Display
                  </a>
                </li>
                <li className="break-inside-avoid mb-1">
                  <a href="#form-controls" className="block text-xs text-primary hover:text-primary/80 px-2 py-1 rounded hover:bg-primary/10 transition-colors font-medium">
                    Form Controls
                  </a>
                </li>
                <li className="break-inside-avoid mb-1">
                  <a href="#icons" className="block text-xs text-primary hover:text-primary/80 px-2 py-1 rounded hover:bg-primary/10 transition-colors font-medium">
                    Icons
                  </a>
                </li>
                <li className="break-inside-avoid mb-1">
                  <a href="#interactive" className="block text-xs text-primary hover:text-primary/80 px-2 py-1 rounded hover:bg-primary/10 transition-colors font-medium">
                    Interactive
                  </a>
                </li>
                <li className="break-inside-avoid mb-1">
                  <a href="#layout" className="block text-xs text-primary hover:text-primary/80 px-2 py-1 rounded hover:bg-primary/10 transition-colors font-medium">
                    Layout
                  </a>
                </li>
                <li className="break-inside-avoid mb-1">
                  <a href="#progress" className="block text-xs text-primary hover:text-primary/80 px-2 py-1 rounded hover:bg-primary/10 transition-colors font-medium">
                    Progress
                  </a>
                </li>
                <li className="break-inside-avoid mb-1">
                  <a href="#toast" className="block text-xs text-primary hover:text-primary/80 px-2 py-1 rounded hover:bg-primary/10 transition-colors font-medium">
                    Toast
                  </a>
                </li>
                <li className="break-inside-avoid mb-1">
                  <a href="#training-cards" className="block text-xs text-primary hover:text-primary/80 px-2 py-1 rounded hover:bg-primary/10 transition-colors font-medium">
                    Training Cards
                  </a>
                </li>
                <li className="break-inside-avoid mb-1">
                  <a href="#typography" className="block text-xs text-primary hover:text-primary/80 px-2 py-1 rounded hover:bg-primary/10 transition-colors font-medium">
                    Typography
                  </a>
                </li>
              </ul>
            </nav>
          </div>

          {/* Color Palette Section */}
          <Card id="color-palette" className="shadow-card hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle>Color Palette</CardTitle>
              <CardDescription>Design system color tokens and semantic colors</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Primary Colors */}
                <div className="space-y-3">
                  <h4 className="text-sm font-bold uppercase text-secondary">Primary Colors</h4>
                  <div className="space-y-2">
                     <div className="flex items-center gap-3">
                       <div className="w-12 h-12 rounded-lg bg-primary border border-border-primary shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"></div>
                       <div>
                         <div className="text-sm font-medium">Primary</div>
                         <div className="text-xs text-muted-foreground">--primary</div>
                       </div>
                     </div>
                  </div>
                </div>

                {/* Secondary Colors */}
                <div className="space-y-3">
                  <h4 className="text-sm font-bold uppercase text-secondary">Secondary Colors</h4>
                  <div className="space-y-2">
                     <div className="flex items-center gap-3">
                       <div className="w-12 h-12 rounded-lg bg-secondary border border-border-primary shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"></div>
                       <div>
                         <div className="text-sm font-medium">Secondary</div>
                         <div className="text-xs text-muted-foreground">--secondary</div>
                       </div>
                     </div>
                  </div>
                </div>

                {/* Status Colors */}
                <div className="space-y-3">
                  <h4 className="text-sm font-bold uppercase text-secondary">Status Colors</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-success border border-border-primary shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"></div>
                      <div>
                        <div className="text-sm font-medium">Success</div>
                        <div className="text-xs text-muted-foreground">--success</div>
                      </div>
                    </div>
                     <div className="flex items-center gap-3">
                       <div className="w-12 h-12 rounded-lg bg-warning border border-border-primary shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"></div>
                       <div>
                         <div className="text-sm font-medium">Warning</div>
                         <div className="text-xs text-muted-foreground">--warning</div>
                       </div>
                     </div>
                     <div className="flex items-center gap-3">
                       <div className="w-12 h-12 rounded-lg bg-attention border border-border-primary shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"></div>
                       <div>
                         <div className="text-sm font-medium">Attention</div>
                         <div className="text-xs text-muted-foreground">--attention</div>
                       </div>
                     </div>
                     <div className="flex items-center gap-3">
                       <div className="w-12 h-12 rounded-lg bg-destructive border border-border-primary shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"></div>
                       <div>
                         <div className="text-sm font-medium">Destructive</div>
                         <div className="text-xs text-muted-foreground">--destructive</div>
                       </div>
                     </div>
                  </div>
                </div>

                {/* UI Colors */}
                <div className="space-y-3">
                  <h4 className="text-sm font-bold uppercase text-secondary">UI Colors</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-background-main border border-border-primary shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"></div>
                      <div>
                        <div className="text-sm font-medium">Background Main</div>
                        <div className="text-xs text-muted-foreground">--background-main</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-background-header border border-border-primary shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"></div>
                      <div>
                        <div className="text-sm font-medium">Background Header</div>
                        <div className="text-xs text-muted-foreground">--background-header</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-background-primary border border-border-primary shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"></div>
                      <div>
                        <div className="text-sm font-medium">Background Primary</div>
                        <div className="text-xs text-muted-foreground">--background-primary</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-background-muted border border-border-primary shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"></div>
                      <div>
                        <div className="text-sm font-medium">Background Muted</div>
                        <div className="text-xs text-muted-foreground">--background-muted</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-card border border-border-primary shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"></div>
                      <div>
                        <div className="text-sm font-medium">Card</div>
                        <div className="text-xs text-muted-foreground">--card</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-muted border border-border-primary shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"></div>
                      <div>
                        <div className="text-sm font-medium">Muted</div>
                        <div className="text-xs text-muted-foreground">--muted</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Text Colors */}
                <div className="space-y-3">
                  <h4 className="text-sm font-bold uppercase text-secondary">Text Colors</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                       <div className="w-12 h-12 rounded-lg bg-background border border-border-primary shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 flex items-center justify-center">
                        <div className="w-6 h-6 bg-foreground rounded-sm shadow-sm"></div>
                      </div>
                      <div>
                        <div className="text-sm font-medium">Foreground</div>
                        <div className="text-xs text-muted-foreground">--foreground</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-background border border-border-primary shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 flex items-center justify-center">
                        <div className="w-6 h-6 bg-muted-foreground rounded-sm shadow-sm"></div>
                      </div>
                      <div>
                        <div className="text-sm font-medium">Muted Foreground</div>
                        <div className="text-xs text-muted-foreground">--muted-foreground</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-primary border border-border-primary shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 flex items-center justify-center">
                        <div className="w-6 h-6 bg-primary-foreground rounded-sm shadow-sm"></div>
                      </div>
                      <div>
                        <div className="text-sm font-medium">Primary Foreground</div>
                        <div className="text-xs text-muted-foreground">--primary-foreground</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-secondary border border-border-primary shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 flex items-center justify-center">
                        <div className="w-6 h-6 bg-secondary-foreground rounded-sm shadow-sm"></div>
                      </div>
                      <div>
                        <div className="text-sm font-medium">Secondary Foreground</div>
                        <div className="text-xs text-muted-foreground">--secondary-foreground</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Border & Input Colors */}
                <div className="space-y-3">
                  <h4 className="text-sm font-bold uppercase text-secondary">Border & Input</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-border-primary border border-border-primary shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"></div>
                      <div>
                        <div className="text-sm font-medium">Border Primary</div>
                        <div className="text-xs text-muted-foreground">--border-primary</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-border-secondary border border-border-secondary shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"></div>
                      <div>
                        <div className="text-sm font-medium">Border Secondary</div>
                        <div className="text-xs text-muted-foreground">--border-secondary</div>
                      </div>
                    </div>
                     <div className="flex items-center gap-3">
                       <div className="w-12 h-12 rounded-lg bg-input border border-border-primary shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"></div>
                       <div>
                         <div className="text-sm font-medium">Input</div>
                         <div className="text-xs text-muted-foreground">--input</div>
                       </div>
                     </div>
                     <div className="flex items-center gap-3">
                       <div className="w-12 h-12 rounded-lg bg-accent border border-border-primary shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"></div>
                       <div>
                         <div className="text-sm font-medium">Accent</div>
                         <div className="text-xs text-muted-foreground">--accent</div>
                       </div>
                     </div>
                     <div className="flex items-center gap-3">
                       <div className="w-12 h-12 rounded-lg bg-ring border border-border-primary shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"></div>
                       <div>
                         <div className="text-sm font-medium">Ring</div>
                         <div className="text-xs text-muted-foreground">--ring</div>
                       </div>
                     </div>
                  </div>
                </div>

                {/* Gradient Examples */}
                <div className="space-y-3">
                  <h4 className="text-sm font-bold uppercase text-secondary">Gradients</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-gradient-primary border border-border-primary shadow-lg hover:shadow-card transition-all duration-200 hover:scale-105"></div>
                      <div>
                        <div className="text-sm font-medium">Primary Gradient</div>
                        <div className="text-xs text-muted-foreground">--gradient-primary</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-gradient-hero border border-border-primary shadow-lg hover:shadow-card transition-all duration-200 hover:scale-105"></div>
                      <div>
                        <div className="text-sm font-medium">Hero Gradient</div>
                        <div className="text-xs text-muted-foreground">--gradient-hero</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-gradient-card border border-border-primary shadow-lg hover:shadow-card transition-all duration-200 hover:scale-105"></div>
                      <div>
                        <div className="text-sm font-medium">Card Gradient</div>
                        <div className="text-xs text-muted-foreground">--gradient-card</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Typography Section */}
          <Card id="typography" className="shadow-card hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle>Typography</CardTitle>
              <CardDescription>Text styles and hierarchy</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4 rounded-lg p-6 border border-border-primary/50 shadow-md">
                <div className="flex items-baseline gap-2">
                  <h1 className="text-4xl font-bold">Heading 1</h1>
                  <span className="text-xs text-muted-foreground">(36px)</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <h2 className="text-3xl font-semibold">Heading 2</h2>
                  <span className="text-xs text-muted-foreground">(30px)</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-medium">Heading 3</h3>
                  <span className="text-xs text-muted-foreground">(24px)</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <h4 className="text-xl font-medium">Heading 4</h4>
                  <span className="text-xs text-muted-foreground">(20px)</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-base">Body text - Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
                  <span className="text-xs text-muted-foreground">(16px)</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-base font-bold">Body text bold - Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
                  <span className="text-xs text-muted-foreground">(16px)</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-base font-medium">Body text medium - Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
                  <span className="text-xs text-muted-foreground">(16px)</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-sm text-muted-foreground">Small text - Secondary information</p>
                  <span className="text-xs text-muted-foreground">(15px)</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-sm text-muted-foreground font-bold">Small text bold - Secondary information</p>
                  <span className="text-xs text-muted-foreground">(15px)</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-sm text-muted-foreground font-medium">Small text medium - Secondary information</p>
                  <span className="text-xs text-muted-foreground">(15px)</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-xs text-muted-foreground">Extra small text - Captions and labels</p>
                  <span className="text-xs text-muted-foreground">(14px)</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-xs text-muted-foreground font-bold">Extra small text bold - Captions and labels</p>
                  <span className="text-xs text-muted-foreground">(14px)</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-xs text-muted-foreground font-medium">Extra small text medium - Captions and labels</p>
                  <span className="text-xs text-muted-foreground">(14px)</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <code className="bg-muted px-2 py-1 rounded text-sm font-mono shadow-sm border border-border-primary/30">Code snippet</code>
                  <span className="text-xs text-muted-foreground">(15px)</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Buttons Section */}
          <Card id="buttons" className="shadow-card hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle>Buttons</CardTitle>
              <CardDescription>All button variants and states</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="variants">
                <TabsList className="shadow-md">
                  <TabsTrigger value="variants">Variants</TabsTrigger>
                  <TabsTrigger value="sizes">Sizes</TabsTrigger>
                  <TabsTrigger value="icons">With Icons</TabsTrigger>
                  <TabsTrigger value="states">States</TabsTrigger>
                </TabsList>
                
                <TabsContent value="variants" className="space-y-4">
                  <div className="rounded-lg p-6 border border-border-primary/50 shadow-md">
                    <div className="flex flex-wrap gap-3">
                      <Button className="shadow-md hover:shadow-lg transition-shadow">Default</Button>
                      <Button variant="secondary" className="shadow-md hover:shadow-lg transition-shadow">Secondary</Button>
                      <Button variant="destructive" className="shadow-md hover:shadow-lg transition-shadow">Destructive</Button>
                      <Button variant="outline" className="shadow-md hover:shadow-lg transition-shadow">Outline</Button>
                      <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10 shadow-md hover:shadow-lg transition-shadow">Unassign</Button>
                      <Button variant="ghost" className="hover:shadow-md transition-shadow">Ghost</Button>
                      <Button variant="link">Link</Button>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="sizes" className="space-y-4">
                  <div className="rounded-lg p-6 border border-border-primary/50 shadow-md">
                    <div className="flex flex-wrap items-center gap-3">
                      <Button size="sm" className="shadow-md hover:shadow-lg transition-shadow">Small</Button>
                      <Button size="default" className="shadow-md hover:shadow-lg transition-shadow">Default</Button>
                      <Button size="lg" className="shadow-md hover:shadow-lg transition-shadow">Large</Button>
                      <Button size="icon" variant="ghost" className="hover:shadow-md transition-shadow"><Settings className="w-4 h-4" /></Button>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="icons" className="space-y-4">
                  <div className="rounded-lg p-6 border border-border-primary/50 shadow-md">
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium mb-2">With Text and Icons</h4>
                        <div className="flex flex-wrap gap-3">
                          <Button className="shadow-md hover:shadow-lg transition-shadow"><Plus className="w-4 h-4 mr-2" />Add New</Button>
                          <Button variant="outline" className="shadow-md hover:shadow-lg transition-shadow"><Edit className="w-4 h-4 mr-2" />Edit</Button>
                          <Button variant="destructive" className="shadow-md hover:shadow-lg transition-shadow">
                            <Trash2 className="w-4 h-4 mr-2" />Delete
                          </Button>
                          <Button variant="ghost" className="hover:shadow-md transition-shadow"><Download className="w-4 h-4 mr-2" />Download</Button>
                          <Button variant="secondary" className="shadow-md hover:shadow-lg transition-shadow"><Settings className="w-4 h-4 mr-2" />Settings</Button>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium mb-2">Icon Only (Click to cycle icons)</h4>
                        <div className="grid grid-cols-5 gap-4">
                          <div className="flex flex-col items-center gap-1">
                            <Button size="icon" onClick={() => cycleIcon('default')} className="cursor-pointer shadow-md hover:shadow-lg transition-all hover:scale-105">
                              {(() => {
                            const IconComponent = getIconComponent(buttonIcons.default);
                            return <IconComponent className="w-4 h-4" />;
                          })()}
                            </Button>
                            <span className="text-xs text-muted-foreground">default</span>
                          </div>
                          <div className="flex flex-col items-center gap-1">
                            <Button size="icon" variant="outline" onClick={() => cycleIcon('outline')} className="cursor-pointer shadow-md hover:shadow-lg transition-all hover:scale-105">
                              {(() => {
                            const IconComponent = getIconComponent(buttonIcons.outline);
                            return <IconComponent className="w-4 h-4" />;
                          })()}
                            </Button>
                            <span className="text-xs text-muted-foreground">outline</span>
                          </div>
                          <div className="flex flex-col items-center gap-1">
                            <Button size="icon" variant="destructive" onClick={() => cycleIcon('destructive')} className="cursor-pointer shadow-md hover:shadow-lg transition-all hover:scale-105">
                              {(() => {
                            const IconComponent = getIconComponent(buttonIcons.destructive);
                            return <IconComponent className="w-4 h-4" />;
                          })()}
                            </Button>
                            <span className="text-xs text-muted-foreground">destructive</span>
                          </div>
                          <div className="flex flex-col items-center gap-1">
                            <Button size="icon" variant="ghost" onClick={() => cycleIcon('ghost')} className="cursor-pointer hover:shadow-md transition-all hover:scale-105">
                              {(() => {
                            const IconComponent = getIconComponent(buttonIcons.ghost);
                            return <IconComponent className="w-4 h-4" />;
                          })()}
                            </Button>
                            <span className="text-xs text-muted-foreground">ghost</span>
                          </div>
                          <div className="flex flex-col items-center gap-1">
                            <Button size="icon" variant="secondary" onClick={() => cycleIcon('secondary')} className="cursor-pointer shadow-md hover:shadow-lg transition-all hover:scale-105">
                              {(() => {
                            const IconComponent = getIconComponent(buttonIcons.secondary);
                            return <IconComponent className="w-4 h-4" />;
                          })()}
                            </Button>
                            <span className="text-xs text-muted-foreground">secondary</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="states" className="space-y-4">
                  <div className="rounded-lg p-6 border border-border-primary/50 shadow-md">
                    <div className="flex flex-wrap gap-3">
                      <Button className="shadow-md hover:shadow-lg transition-shadow">Normal</Button>
                      <Button disabled className="shadow-sm">Disabled</Button>
                      <Button onClick={toggleLoading} disabled={isLoading} className="shadow-md hover:shadow-lg transition-shadow">
                        {isLoading ? "Loading..." : "Click to Load"}
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Form Controls Section */}
          <Card id="form-controls" className="shadow-card hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle>Form Controls</CardTitle>
              <CardDescription>Input fields and form elements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="rounded-lg p-6 border border-border-primary/50 shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="text-input">Text Input</Label>
                      <Input id="text-input" placeholder="Enter text here..." className="shadow-sm hover:shadow-md transition-shadow" />
                    </div>
                    <div>
                      <Label htmlFor="disabled-input">Disabled Input</Label>
                      <Input id="disabled-input" placeholder="Disabled input" disabled className="shadow-sm" />
                    </div>
                    <div>
                      <Label htmlFor="textarea">Textarea</Label>
                      <Textarea id="textarea" placeholder="Enter longer text here..." className="shadow-sm hover:shadow-md transition-shadow" />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="p-3 rounded-md bg-card/50 shadow-sm space-y-3">
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Binary Switch (On/Off)</Label>
                        <div className="flex items-center space-x-2">
                          <Switch id="switch" checked={switchValue} onCheckedChange={setSwitchValue} />
                          <Label htmlFor="switch">Enable notifications</Label>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Two-Option Toggle</Label>
                        <ToggleGroup type="single" value={twoOptionToggle} onValueChange={value => value && setTwoOptionToggle(value)} variant="pill" size="pill" className="justify-start">
                          <ToggleGroupItem value="light" aria-label="Light mode">
                            Light
                          </ToggleGroupItem>
                          <ToggleGroupItem value="dark" aria-label="Dark mode">
                            Dark
                          </ToggleGroupItem>
                        </ToggleGroup>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Multi-Option Toggle</Label>
                        <ToggleGroup type="single" value={multiOptionToggle} onValueChange={value => value && setMultiOptionToggle(value)} variant="pill" size="pill" className="justify-start">
                          <ToggleGroupItem value="small" aria-label="Small size">
                            Small
                          </ToggleGroupItem>
                          <ToggleGroupItem value="medium" aria-label="Medium size">
                            Medium
                          </ToggleGroupItem>
                          <ToggleGroupItem value="large" aria-label="Large size">
                            Large
                          </ToggleGroupItem>
                          <ToggleGroupItem value="xl" aria-label="Extra large size">
                            XL
                          </ToggleGroupItem>
                        </ToggleGroup>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 p-3 rounded-md bg-card/50 shadow-sm">
                      <Checkbox id="checkbox" checked={checkboxValue} onCheckedChange={checked => setCheckboxValue(checked as boolean)} />
                      <Label htmlFor="checkbox">Checkbox</Label>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Radio Button Group</Label>
                      <RadioGroup value={radioValue} onValueChange={setRadioValue} className="p-3 rounded-md bg-card/50 shadow-sm space-y-3">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="small" id="size-small" />
                          <Label htmlFor="size-small">Small</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="medium" id="size-medium" />
                          <Label htmlFor="size-medium">Medium</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="large" id="size-large" />
                          <Label htmlFor="size-large">Large</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="extra-large" id="size-xl" />
                          <Label htmlFor="size-xl">Extra Large</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Checkbox Group</Label>
                      <div className="p-3 rounded-md bg-card/50 shadow-sm space-y-3">
                        {["Newsletter", "Marketing", "Updates", "Security Alerts"].map(option => <div key={option} className="flex items-center space-x-2">
                            <Checkbox id={`checkbox-${option.toLowerCase().replace(" ", "-")}`} checked={checkboxGroupValue.includes(option.toLowerCase().replace(" ", "-"))} onCheckedChange={checked => {
                        if (checked) {
                          setCheckboxGroupValue(prev => [...prev, option.toLowerCase().replace(" ", "-")]);
                        } else {
                          setCheckboxGroupValue(prev => prev.filter(item => item !== option.toLowerCase().replace(" ", "-")));
                        }
                      }} />
                            <Label htmlFor={`checkbox-${option.toLowerCase().replace(" ", "-")}`}>{option}</Label>
                          </div>)}
                      </div>
                    </div>
                    
                    <div>
                      <Label>Select Dropdown</Label>
                      <Select value={selectValue} onValueChange={setSelectValue}>
                        <SelectTrigger className="shadow-sm hover:shadow-md transition-shadow">
                          <SelectValue placeholder="Select an option" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="option1">Option 1</SelectItem>
                          <SelectItem value="option2">Option 2</SelectItem>
                          <SelectItem value="option3">Option 3</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Banners */}
          <Card id="banners" className="shadow-card hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle>Banners</CardTitle>
              <CardDescription>Banner components for notifications, alerts, and status messages with modern drop shadows</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-muted-foreground">Default Banner - All Variant Options</h4>
                
                {/* Default Banner - Basic */}
                <Banner title="Default Banner" description="Basic banner with icon and no actions." />

                {/* Default Banner - With Close Action */}
                <Banner title="Default Banner with Close" description="Banner with dismissible close action." dismissible onDismiss={() => console.log("Banner dismissed")} />

                {/* Default Banner - With Button */}
                <Banner title="Default Banner with Action" description="Banner with action button." actions={<Button variant="outline" size="sm">
                      Learn More
                    </Button>} />


                {/* Default Banner - Without Icon */}
                <Banner title="Default Banner without Icon" description="Banner with icon hidden." showIcon={false} />

                <Separator className="my-6" />

                <h4 className="text-sm font-medium text-muted-foreground">Other Banner Types</h4>

                {/* Info Banner */}
                <Banner variant="info" title="Information" description="Informational banner for updates or announcements." />

                {/* Success Banner */}
                <Banner variant="success" title="Success" description="Success banner for completed operations." />

                {/* Warning Banner */}
                <Banner variant="warning" title="Warning" description="Warning banner for important notices." />

                {/* Error Banner */}
                <Banner variant="error" title="Error" description="Error banner for system issues or failures." />

                {/* Attention Banner */}
                <Banner variant="attention" title="Attention" description="Attention banner for items requiring user action." />
              </div>
            </CardContent>
          </Card>

          {/* Badges */}
          <Card id="badges" className="shadow-card hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle>Badges</CardTitle>
              <CardDescription>Status and labeling components in multiple variants</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-bold uppercase text-secondary mb-3">Solid Variants</h4>
                      <div className="flex flex-wrap gap-2">
                        <Badge>Primary</Badge>
                        <Badge showIcon>Primary with Icon</Badge>
                        <Badge variant="secondary">Secondary</Badge>
                        <Badge variant="secondary" showIcon>Secondary with Icon</Badge>
                        <Badge variant="tertiary">Tertiary</Badge>
                        <Badge variant="tertiary" showIcon>Tertiary with Icon</Badge>
                        <Badge variant="destructive">Destructive</Badge>
                        <Badge variant="destructive" showIcon>Destructive with Icon</Badge>
                        <Badge variant="success">Success</Badge>
                        <Badge variant="success" showIcon>Success with Icon</Badge>
                        <Badge variant="warning">Warning</Badge>
                        <Badge variant="warning" showIcon>Warning with Icon</Badge>
                        <Badge variant="attention">Attention</Badge>
                        <Badge variant="attention" showIcon>Attention with Icon</Badge>
                      </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold uppercase text-secondary mb-3">Hollow Variants</h4>
                     <div className="flex flex-wrap gap-2">
                        <Badge variant="hollow-primary">Primary</Badge>
                        <Badge variant="hollow-primary" showIcon>Primary with Icon</Badge>
                        <Badge variant="hollow-secondary">Secondary</Badge>
                        <Badge variant="hollow-secondary" showIcon>Secondary with Icon</Badge>
                        <Badge variant="hollow-tertiary">Tertiary</Badge>
                        <Badge variant="hollow-tertiary" showIcon>Tertiary with Icon</Badge>
                        <Badge variant="hollow-destructive">Destructive</Badge>
                        <Badge variant="hollow-destructive" showIcon>Destructive with Icon</Badge>
                        <Badge variant="hollow-success">Success</Badge>
                        <Badge variant="hollow-success" showIcon>Success with Icon</Badge>
                        <Badge variant="hollow-warning">Warning</Badge>
                        <Badge variant="hollow-warning" showIcon>Warning with Icon</Badge>
                        <Badge variant="hollow-attention">Attention</Badge>
                        <Badge variant="hollow-attention" showIcon>Attention with Icon</Badge>
                      </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold uppercase text-secondary mb-3">Soft Variants</h4>
                   <div className="flex flex-wrap gap-2">
                        <Badge variant="soft-primary">Primary</Badge>
                        <Badge variant="soft-primary" showIcon>Primary with Icon</Badge>
                        <Badge variant="soft-secondary">Secondary</Badge>
                        <Badge variant="soft-secondary" showIcon>Secondary with Icon</Badge>
                        <Badge variant="soft-tertiary">Tertiary</Badge>
                        <Badge variant="soft-tertiary" showIcon>Tertiary with Icon</Badge>
                        <Badge variant="soft-destructive">Destructive</Badge>
                        <Badge variant="soft-destructive" showIcon>Destructive with Icon</Badge>
                        <Badge variant="soft-success">Success</Badge>
                        <Badge variant="soft-success" showIcon>Success with Icon</Badge>
                        <Badge variant="soft-warning">Warning</Badge>
                        <Badge variant="soft-warning" showIcon>Warning with Icon</Badge>
                        <Badge variant="soft-attention">Attention</Badge>
                        <Badge variant="soft-attention" showIcon>Attention with Icon</Badge>
                      </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold uppercase text-secondary mb-3">Ghost Variants</h4>
                     <div className="flex flex-wrap gap-2">
                        <Badge variant="ghost-primary">Primary</Badge>
                        <Badge variant="ghost-primary" showIcon>Primary with Icon</Badge>
                        <Badge variant="ghost-secondary">Secondary</Badge>
                        <Badge variant="ghost-secondary" showIcon>Secondary with Icon</Badge>
                        <Badge variant="ghost-tertiary">Tertiary</Badge>
                        <Badge variant="ghost-tertiary" showIcon>Tertiary with Icon</Badge>
                        <Badge variant="ghost-destructive">Destructive</Badge>
                        <Badge variant="ghost-destructive" showIcon>Destructive with Icon</Badge>
                        <Badge variant="ghost-success">Success</Badge>
                        <Badge variant="ghost-success" showIcon>Success with Icon</Badge>
                        <Badge variant="ghost-warning">Warning</Badge>
                        <Badge variant="ghost-warning" showIcon>Warning with Icon</Badge>
                        <Badge variant="ghost-attention">Attention</Badge>
                        <Badge variant="ghost-attention" showIcon>Attention with Icon</Badge>
                      </div>
                    </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress */}
          <Card id="progress" className="shadow-card hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle>Progress</CardTitle>
              <CardDescription>Progress indicators and loading states</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Progress value={progress} className="w-full" />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => setProgress(Math.max(0, progress - 10))}>-10</Button>
                  <Button size="sm" onClick={() => setProgress(Math.min(100, progress + 10))}>+10</Button>
                  <span className="text-sm text-muted-foreground">{progress}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Toast */}
          <Card id="toast" className="shadow-card hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle>Toast</CardTitle>
              <CardDescription>Toast notifications and messages</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => showToast("default")}>Info Toast</Button>
                  <Button size="sm" onClick={() => showToast("success")}>Success Toast</Button>
                  <Button size="sm" variant="destructive" onClick={() => showToast("destructive")}>Error Toast</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Display */}
          <Card id="data-display">
            <CardHeader>
              <CardTitle>Data Display</CardTitle>
              <CardDescription>Tables, avatars, and data presentation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Avatars</h3>
                <div className="flex gap-4">
                  <Avatar>
                    <AvatarImage src="https://github.com/shadcn.png" />
                    <AvatarFallback>CN</AvatarFallback>
                  </Avatar>
                  <Avatar>
                    <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                  <Avatar>
                    <AvatarFallback><User className="w-4 h-4" /></AvatarFallback>
                  </Avatar>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Tables</h3>
                
                <Tabs defaultValue="basic">
                  <TabsList>
                    <TabsTrigger value="basic">Basic</TabsTrigger>
                    <TabsTrigger value="sortable">Sortable</TabsTrigger>
                    <TabsTrigger value="filtered">With Filters</TabsTrigger>
                    <TabsTrigger value="statuses">With Statuses</TabsTrigger>
                    <TabsTrigger value="accordion">Accordion</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="basic" className="space-y-4">
                    <Table>
                      <TableCaption>A simple data table</TableCaption>
                      <TableHeader>
                        <TableRow>
                            <TableHead className="text-xs font-medium uppercase text-muted-foreground">Name</TableHead>
                            <TableHead className="text-xs font-medium uppercase text-muted-foreground">Email</TableHead>
                            <TableHead className="text-xs font-medium uppercase text-muted-foreground">Role</TableHead>
                            <TableHead className="text-right text-xs font-medium uppercase text-muted-foreground">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">John Doe</TableCell>
                          <TableCell>john@example.com</TableCell>
                          <TableCell>Admin</TableCell>
                           <TableCell className="text-right">
                             <div className="flex gap-1 justify-end">
                               <Button size="sm" variant="ghost">
                                 <Edit className="w-4 h-4" />
                                 <span className="sr-only">Edit</span>
                               </Button>
                               <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                                 <Trash2 className="w-4 h-4" />
                                 <span className="sr-only">Delete</span>
                               </Button>
                             </div>
                           </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Jane Smith</TableCell>
                          <TableCell>jane@example.com</TableCell>
                          <TableCell>User</TableCell>
                           <TableCell className="text-right">
                             <div className="flex gap-1 justify-end">
                               <Button size="sm" variant="ghost">
                                 <Edit className="w-4 h-4" />
                                 <span className="sr-only">Edit</span>
                               </Button>
                               <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                                 <Trash2 className="w-4 h-4" />
                                 <span className="sr-only">Delete</span>
                               </Button>
                             </div>
                           </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TabsContent>
                  
                  <TabsContent value="sortable" className="space-y-4">
                    <Table>
                      <TableCaption>Sortable table with interactive headers</TableCaption>
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
                          <SortableTableHead
                            column="email"
                            sortColumn={sortColumn}
                            sortDirection={sortDirection}
                            onSort={handleSort}
                          >
                            Email
                          </SortableTableHead>
                          <SortableTableHead
                            column="department"
                            sortColumn={sortColumn}
                            sortDirection={sortDirection}
                            onSort={handleSort}
                          >
                            Department
                          </SortableTableHead>
                           <TableHead className="text-right text-xs font-medium uppercase text-muted-foreground">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                       <TableBody>
                         {sortedData.map((user, index) => <TableRow key={index}>
                             <TableCell className="font-medium">{user.name}</TableCell>
                             <TableCell>{user.email}</TableCell>
                             <TableCell>{user.department}</TableCell>
                               <TableCell className="text-right">
                                 <div className="flex gap-2 justify-end">
                                  <Button size="sm" variant="ghost">
                                    <Eye className="w-4 h-4" />
                                    <span className="sr-only">View</span>
                                  </Button>
                                  <Button size="sm" variant="ghost">
                                    <Edit className="w-4 h-4" />
                                    <span className="sr-only">Edit</span>
                                  </Button>
                                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                                    <Trash2 className="w-4 h-4" />
                                    <span className="sr-only">Delete</span>
                                  </Button>
                                </div>
                              </TableCell>
                           </TableRow>)}
                       </TableBody>
                    </Table>
                  </TabsContent>
                  
                  <TabsContent value="filtered" className="space-y-4">
                    <div className="flex gap-2 mb-4">
                      <Select defaultValue="all">
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select defaultValue="all">
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Filter by role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Roles</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input placeholder="Search by name..." className="w-[200px]" />
                    </div>
                    <Table>
                      <TableCaption>Filtered table with search and dropdown filters</TableCaption>
                      <TableHeader>
                        <TableRow>
                            <TableHead className="text-xs font-medium uppercase text-muted-foreground">User</TableHead>
                            <TableHead className="text-xs font-medium uppercase text-muted-foreground">Status</TableHead>
                            <TableHead className="text-xs font-medium uppercase text-muted-foreground">Role</TableHead>
                            <TableHead className="text-xs font-medium uppercase text-muted-foreground">Last Activity</TableHead>
                            <TableHead className="text-right text-xs font-medium uppercase text-muted-foreground">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                       <TableBody>
                         <TableRow>
                           <TableCell>
                             <div className="flex items-center gap-3">
                               <Avatar className="w-8 h-8">
                                 <AvatarFallback>CJ</AvatarFallback>
                               </Avatar>
                               <div>
                                 <div className="font-medium">Charlie Jones</div>
                                 <div className="text-sm text-muted-foreground">charlie@example.com</div>
                               </div>
                             </div>
                           </TableCell>
                           <TableCell><Badge variant="success">Active</Badge></TableCell>
                           <TableCell><Badge variant="hollow-primary">Manager</Badge></TableCell>
                           <TableCell className="text-muted-foreground">2 hours ago</TableCell>
                           <TableCell className="text-right">
                             <DropdownMenu>
                               <DropdownMenuTrigger asChild>
                                 <Button size="sm" variant="ghost">•••</Button>
                               </DropdownMenuTrigger>
                               <DropdownMenuContent align="end">
                                 <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                 <DropdownMenuItem><Eye className="w-4 h-4 mr-2" />View</DropdownMenuItem>
                                 <DropdownMenuItem><Edit className="w-4 h-4 mr-2" />Edit</DropdownMenuItem>
                                 <DropdownMenuSeparator />
                                 <DropdownMenuItem className="text-destructive">
                                   <Trash2 className="w-4 h-4 mr-2" />Delete
                                 </DropdownMenuItem>
                               </DropdownMenuContent>
                             </DropdownMenu>
                           </TableCell>
                         </TableRow>
                         <TableRow>
                           <TableCell>
                             <div className="flex items-center gap-3">
                               <Avatar className="w-8 h-8">
                                 <AvatarFallback>DM</AvatarFallback>
                               </Avatar>
                               <div>
                                 <div className="font-medium">Diana Miller</div>
                                 <div className="text-sm text-muted-foreground">diana@example.com</div>
                               </div>
                             </div>
                           </TableCell>
                           <TableCell><Badge variant="warning">Pending</Badge></TableCell>
                           <TableCell><Badge variant="hollow-secondary">User</Badge></TableCell>
                           <TableCell className="text-muted-foreground">1 day ago</TableCell>
                           <TableCell className="text-right">
                             <DropdownMenu>
                               <DropdownMenuTrigger asChild>
                                 <Button size="sm" variant="ghost">•••</Button>
                               </DropdownMenuTrigger>
                               <DropdownMenuContent align="end">
                                 <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                 <DropdownMenuItem><Eye className="w-4 h-4 mr-2" />View</DropdownMenuItem>
                                 <DropdownMenuItem><Edit className="w-4 h-4 mr-2" />Edit</DropdownMenuItem>
                                 <DropdownMenuSeparator />
                                 <DropdownMenuItem className="text-destructive">
                                   <Trash2 className="w-4 h-4 mr-2" />Delete
                                 </DropdownMenuItem>
                               </DropdownMenuContent>
                             </DropdownMenu>
                           </TableCell>
                         </TableRow>
                       </TableBody>
                    </Table>
                  </TabsContent>
                  
                  <TabsContent value="statuses" className="space-y-4">
                    <Table>
                      <TableCaption>Table with various status badges and progress indicators</TableCaption>
                      <TableHeader>
                        <TableRow>
                            <TableHead className="text-xs font-medium uppercase text-muted-foreground">Project</TableHead>
                            <TableHead className="text-xs font-medium uppercase text-muted-foreground">Progress</TableHead>
                            <TableHead className="text-xs font-medium uppercase text-muted-foreground">Status</TableHead>
                            <TableHead className="text-xs font-medium uppercase text-muted-foreground">Priority</TableHead>
                            <TableHead className="text-xs font-medium uppercase text-muted-foreground">Assignee</TableHead>
                        </TableRow>
                      </TableHeader>
                       <TableBody>
                         <TableRow>
                           <TableCell>
                             <div>
                               <div className="font-medium">Website Redesign</div>
                               <div className="text-sm text-muted-foreground">Frontend improvements</div>
                             </div>
                           </TableCell>
                           <TableCell>
                             <div className="space-y-1">
                               <Progress value={75} className="w-[60px]" />
                               <div className="text-xs text-muted-foreground">75%</div>
                             </div>
                           </TableCell>
                           <TableCell><Badge variant="success" showIcon>Complete</Badge></TableCell>
                           <TableCell><Badge variant="destructive">High</Badge></TableCell>
                           <TableCell>
                             <Avatar className="w-6 h-6">
                               <AvatarFallback className="text-xs">JS</AvatarFallback>
                             </Avatar>
                           </TableCell>
                         </TableRow>
                         <TableRow>
                           <TableCell>
                             <div>
                               <div className="font-medium">Mobile App</div>
                               <div className="text-sm text-muted-foreground">iOS & Android development</div>
                             </div>
                           </TableCell>
                           <TableCell>
                             <div className="space-y-1">
                               <Progress value={45} className="w-[60px]" />
                               <div className="text-xs text-muted-foreground">45%</div>
                             </div>
                           </TableCell>
                           <TableCell><Badge variant="warning" showIcon>In Progress</Badge></TableCell>
                           <TableCell><Badge variant="secondary">Medium</Badge></TableCell>
                           <TableCell>
                             <Avatar className="w-6 h-6">
                               <AvatarFallback className="text-xs">AM</AvatarFallback>
                             </Avatar>
                           </TableCell>
                         </TableRow>
                         <TableRow>
                           <TableCell>
                             <div>
                               <div className="font-medium">API Integration</div>
                               <div className="text-sm text-muted-foreground">Backend services</div>
                             </div>
                           </TableCell>
                           <TableCell>
                             <div className="space-y-1">
                               <Progress value={20} className="w-[60px]" />
                               <div className="text-xs text-muted-foreground">20%</div>
                             </div>
                           </TableCell>
                           <TableCell><Badge variant="hollow-destructive" showIcon>Blocked</Badge></TableCell>
                           <TableCell><Badge variant="hollow-warning">Low</Badge></TableCell>
                           <TableCell>
                             <Avatar className="w-6 h-6">
                               <AvatarFallback className="text-xs">RK</AvatarFallback>
                             </Avatar>
                           </TableCell>
                         </TableRow>
                       </TableBody>
                     </Table>
                   </TabsContent>
                   
                   <TabsContent value="accordion" className="space-y-4">
                     <div className="rounded-lg p-6 border border-border-primary/50 shadow-md">
                       <h4 className="text-sm font-medium mb-4">Collapsible Table Rows (Admin Pattern)</h4>
                       <Table>
                         <TableCaption>Employee table with expandable rows matching admin area pattern</TableCaption>
                         <TableHeader>
                           <TableRow>
                              <TableHead className="text-xs font-medium uppercase text-muted-foreground">Employee</TableHead>
                              <TableHead className="text-xs font-medium uppercase text-muted-foreground">Department</TableHead>
                              <TableHead className="text-xs font-medium uppercase text-muted-foreground">Status</TableHead>
                              <TableHead className="text-right text-xs font-medium uppercase text-muted-foreground">Actions</TableHead>
                           </TableRow>
                         </TableHeader>
                         <TableBody>
                           {[{
                        id: "emp-1",
                        name: "Alice Johnson",
                        email: "alice@example.com",
                        department: "Engineering",
                        status: "Active",
                        role: "Senior Developer",
                        location: "San Francisco, CA",
                        manager: "John Smith",
                        skills: "React, TypeScript, Node.js"
                      }, {
                        id: "emp-2",
                        name: "Bob Wilson",
                        email: "bob@example.com",
                        department: "Marketing",
                        status: "Active",
                        role: "Marketing Manager",
                        location: "New York, NY",
                        manager: "Sarah Lee",
                        skills: "SEO, Analytics, Content Strategy"
                      }, {
                        id: "emp-3",
                        name: "Carol Smith",
                        email: "carol@example.com",
                        department: "Finance",
                        status: "On Leave",
                        role: "Senior Analyst",
                        location: "Chicago, IL",
                        manager: "Michael Chen",
                        skills: "Excel, Financial Modeling"
                      }].map(employee => {
                        const isExpanded = expandedEmployees.has(employee.id);
                        return <React.Fragment key={employee.id}>
                                 <TableRow className={`group transition-colors ${isExpanded ? 'border-b-0 bg-muted/50' : 'hover:bg-slate-100'}`}>
                                   <TableCell className="py-3">
                                     <Collapsible open={isExpanded} onOpenChange={() => toggleEmployeeExpanded(employee.id)}>
                                       <CollapsibleTrigger asChild>
                                         <div className="flex items-center gap-3 cursor-pointer">
                                           <div className="flex items-center gap-2">
                                             {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                                             <div>
                                               <div className="font-medium">{employee.name}</div>
                                               <div className="text-sm text-muted-foreground">{employee.email}</div>
                                             </div>
                                           </div>
                                         </div>
                                       </CollapsibleTrigger>
                                     </Collapsible>
                                   </TableCell>
                                   
                                   <TableCell className="py-3">
                                      <Badge variant={employee.department === "Engineering" ? "default" : employee.department === "Marketing" ? "secondary" : "hollow-primary"}>
                                        {employee.department}
                                      </Badge>
                                   </TableCell>
                                   
                                   <TableCell className="py-3">
                                     <Badge variant={employee.status === "Active" ? "default" : "secondary"}>
                                       {employee.status}
                                     </Badge>
                                   </TableCell>
                                   
                                   <TableCell className="text-right py-3">
                                     <div className="flex gap-2 justify-end">
                                        <IconButtonWithTooltip icon={Edit} tooltip={getTooltipText('edit-item', {
                                  name: 'John Doe'
                                })} onClick={() => {}} />
                                        <IconButtonWithTooltip icon={Trash2} tooltip={getTooltipText('delete-item', {
                                  name: 'John Doe'
                                })} onClick={() => {}} className="text-destructive hover:text-destructive" />
                                     </div>
                                   </TableCell>
                                 </TableRow>
                                 
                                 {isExpanded && <TableRow className="bg-muted/50">
                                     <TableCell colSpan={4} className="py-0">
                                       <Collapsible open={isExpanded}>
                                         <CollapsibleContent>
                                           <div className="px-4 pb-4 ml-6">
                                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm border-l-2 border-muted pl-4">
                                               <div className="space-y-2">
                                                 <p><strong>Role:</strong> {employee.role}</p>
                                                 <p><strong>Location:</strong> {employee.location}</p>
                                                 <p><strong>Manager:</strong> {employee.manager}</p>
                                               </div>
                                               <div className="space-y-2">
                                                 <p><strong>Skills:</strong> {employee.skills}</p>
                                                 <p><strong>Last Login:</strong> {employee.id === "emp-1" ? "2 hours ago" : employee.id === "emp-2" ? "1 day ago" : "5 days ago"}</p>
                                                 <p><strong>Start Date:</strong> {employee.id === "emp-1" ? "January 2020" : employee.id === "emp-2" ? "March 2019" : "June 2021"}</p>
                                               </div>
                                             </div>
                                           </div>
                                         </CollapsibleContent>
                                       </Collapsible>
                                     </TableCell>
                                   </TableRow>}
                               </React.Fragment>;
                      })}
                         </TableBody>
                       </Table>
                     </div>
                   </TabsContent>
                 </Tabs>
               </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Loading States</h3>
                <LoadingSkeleton />
              </div>
            </CardContent>
          </Card>

          {/* Interactive Components */}
          <Card id="interactive">
            <CardHeader>
              <CardTitle>Interactive Components</CardTitle>
              <CardDescription>Dialogs, dropdowns, and overlays</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="flex flex-wrap gap-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="shadow-md hover:shadow-lg transition-shadow">Open Dialog</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Dialog Title</DialogTitle>
                    </DialogHeader>
                    <DialogScrollArea>
                      <div className="space-y-4">
                        <p>Dialog content goes here. The body now automatically has proper padding while the header and footer extend full width with their own backgrounds.</p>
                        <p>Dialog content goes here. The body now automatically has proper padding while the header and footer extend full width with their own backgrounds.</p>
                        <p>Dialog content goes here. The body now automatically has proper padding while the header and footer extend full width with their own backgrounds.</p>
                        <p>Dialog content goes here. The body now automatically has proper padding while the header and footer extend full width with their own backgrounds.</p>
                        <p>Dialog content goes here. The body now automatically has proper padding while the header and footer extend full width with their own backgrounds.</p>
                        <p>Dialog content goes here. The body now automatically has proper padding while the header and footer extend full width with their own backgrounds.</p>
                        <p>Dialog content goes here. The body now automatically has proper padding while the header and footer extend full width with their own backgrounds.</p>
                        <p>Dialog content goes here. The body now automatically has proper padding while the header and footer extend full width with their own backgrounds.</p>
                        <p>Dialog content goes here. The body now automatically has proper padding while the header and footer extend full width with their own backgrounds.</p>
                        <p>Dialog content goes here. The body now automatically has proper padding while the header and footer extend full width with their own backgrounds.</p>
                        <p>Dialog content goes here. The body now automatically has proper padding while the header and footer extend full width with their own backgrounds.</p>
                        <p>Dialog content goes here. The body now automatically has proper padding while the header and footer extend full width with their own backgrounds.</p>
                        <p>This is the last paragraph to test scrolling behavior.</p>
                      </div>
                    </DialogScrollArea>
                    <DialogFooter>
                      <Button variant="outline" className="shadow-md hover:shadow-lg transition-shadow">Cancel</Button>
                      <Button className="shadow-md hover:shadow-lg transition-shadow">Confirm</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="secondary" className="shadow-md hover:shadow-lg transition-shadow">Open Fullscreen Dialog</Button>
                  </DialogTrigger>
                  <FullscreenDialogContent>
                    <DialogHeader>
                      <DialogTitle>Fullscreen Dialog</DialogTitle>
                    </DialogHeader>
                    <DialogScrollArea>
                      <div className="space-y-4">
                        <p>This fullscreen dialog fills the entire viewport with 8px spacing on mobile and 10px on larger screens.</p>
                        <p>It's ideal for immersive content, detailed forms, media viewers, or any content that benefits from maximum screen space.</p>
                        <p>The transparent overlay remains visible behind the dialog, maintaining visual context of the underlying page.</p>
                      </div>
                    </DialogScrollArea>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline" className="shadow-md hover:shadow-lg transition-shadow">Cancel</Button>
                      </DialogClose>
                      <Button className="shadow-md hover:shadow-lg transition-shadow">Save Changes</Button>
                    </DialogFooter>
                  </FullscreenDialogContent>
                </Dialog>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="shadow-md hover:shadow-lg transition-shadow">Show Alert</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Important Information</AlertDialogTitle>
                    </AlertDialogHeader>
                    <div>
                      <p>This is an example of an alert dialog. It's perfect for showing important messages that require user acknowledgment.</p>
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogAction>Continue</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="shadow-md hover:shadow-lg transition-shadow">Delete Item</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    </AlertDialogHeader>
                    <div>
                      <p>This action cannot be undone. This will permanently delete your data.</p>
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">Dropdown Menu</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem><User className="w-4 h-4 mr-2" />Profile</DropdownMenuItem>
                    <DropdownMenuItem><Settings className="w-4 h-4 mr-2" />Settings</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem><Bell className="w-4 h-4 mr-2" />Notifications</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline">Hover for Tooltip</Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>This is a helpful tooltip</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </CardContent>
          </Card>

          {/* Calendar Component */}
          <Card id="calendar">
            <CardHeader>
              <CardTitle>Calendar</CardTitle>
              <CardDescription>Date picker component</CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} className="rounded-md border pointer-events-auto" />
            </CardContent>
          </Card>

          {/* Icons Gallery */}
          <Card id="icons">
            <CardHeader>
              <CardTitle>Icons</CardTitle>
              <CardDescription>Commonly used Lucide icons</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-8 md:grid-cols-12 gap-4">
                {[Home, Settings, User, Bell, Search, Plus, Edit, Trash2, Download, Upload, Eye, EyeOff, AlertCircle, CheckCircle, Info, X].map((Icon, index) => <Tooltip key={index}>
                    <TooltipTrigger asChild>
                      <div className="flex items-center justify-center p-3 border rounded-lg hover:bg-muted transition-colors">
                        <Icon className="w-5 h-5" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{Icon.name}</p>
                    </TooltipContent>
                  </Tooltip>)}
              </div>
            </CardContent>
          </Card>

          {/* Layout Components */}
          <Card id="layout">
            <CardHeader>
              <CardTitle>Layout Components</CardTitle>
              <CardDescription>Cards, separators, and tabs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Card Title</CardTitle>
                    <CardDescription>Card description</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>Card content goes here.</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Another Card</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>More card content.</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Third Card</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>Even more content.</p>
                  </CardContent>
                </Card>
              </div>
              
              <Separator />
              
              <Tabs defaultValue="tab1">
                <TabsList>
                  <TabsTrigger value="tab1">Tab 1</TabsTrigger>
                  <TabsTrigger value="tab2">Tab 2</TabsTrigger>
                  <TabsTrigger value="tab3">Tab 3</TabsTrigger>
                </TabsList>
                <TabsContent value="tab1">
                  <p>Content for tab 1</p>
                </TabsContent>
                <TabsContent value="tab2">
                  <p>Content for tab 2</p>
                </TabsContent>
                <TabsContent value="tab3">
                  <p>Content for tab 3</p>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Training Cards */}
          <Card id="training-cards">
            <CardHeader>
              <CardTitle>Training Cards</CardTitle>
              <CardDescription>Cards used on the employee dashboard to display assigned training content with progress, due dates, and quiz status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Example cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
                <TrainingCard
                  video={{
                    id: "demo-not-started",
                    title: "Workplace Safety Basics",
                    description: "Introduction to workplace safety protocols and procedures.",
                    thumbnail: "/placeholder.svg",
                    duration: "10:00",
                    progress: 0,
                    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                  }}
                  onPlay={() => toast({ title: "Training Card", description: "Playing: Workplace Safety Basics" })}
                />
                <TrainingCard
                  video={{
                    id: "demo-completed",
                    title: "PPE Requirements",
                    description: "Proper selection and use of personal protective equipment.",
                    thumbnail: "/placeholder.svg",
                    duration: "12:00",
                    progress: 100,
                    completedAt: "2025-01-06T00:00:00Z",
                    quizSummary: { correct: 8, total: 10, percent: 80 },
                  }}
                  onPlay={() => toast({ title: "Training Card", description: "Playing: PPE Requirements" })}
                />
              </div>

              <Separator />

              {/* Badge Rules Reference */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Badge Rules Reference</h3>

                {/* Status Badges */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Status Badges</h4>
                  <p className="text-sm text-muted-foreground">Displayed above the title, based on completion status and due date.</p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[180px]">Badge</TableHead>
                        <TableHead>Appears When</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell><Badge variant="soft-success" className="gap-1"><CheckCircle className="w-3 h-3" />Completed</Badge></TableCell>
                        <TableCell className="text-sm">Training is 100% complete</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><Badge variant="soft-destructive" className="gap-1"><AlertCircle className="w-3 h-3" />Overdue</Badge></TableCell>
                        <TableCell className="text-sm">Due date has passed and training is not 100% done</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><Badge variant="soft-warning">Due Today</Badge></TableCell>
                        <TableCell className="text-sm">Due date is today and training is not 100% done</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><Badge variant="soft-primary">Due in X days</Badge></TableCell>
                        <TableCell className="text-sm">Due within 30 days, training not done</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><Badge variant="soft-primary">Due MMM d</Badge></TableCell>
                        <TableCell className="text-sm">Due date is 30+ days away, training not done</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><span className="text-sm text-muted-foreground italic">No badge</span></TableCell>
                        <TableCell className="text-sm">No due date set and not completed</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* Quiz Score Badges */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Quiz Score Badges</h4>
                  <p className="text-sm text-muted-foreground">Displayed below the description when training is completed and quiz data is available.</p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[180px]">Badge</TableHead>
                        <TableHead>Appears When</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell><Badge variant="soft-success">Quiz: 90% (9/10)</Badge></TableCell>
                        <TableCell className="text-sm">Score is 80% or above</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><Badge variant="soft-warning">Quiz: 70% (7/10)</Badge></TableCell>
                        <TableCell className="text-sm">Score is 60–79%</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><Badge variant="soft-destructive">Quiz: 40% (4/10)</Badge></TableCell>
                        <TableCell className="text-sm">Score is below 60%</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* Other Indicators */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Other Indicators</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[180px]">Indicator</TableHead>
                        <TableHead>Appears When</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell><Badge variant="ghost-attention">Quiz Pending</Badge></TableCell>
                        <TableCell className="text-sm">Video watched but quiz not yet taken (<code className="text-xs bg-muted px-1 py-0.5 rounded">quizPending: true</code>)</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><span className="text-sm font-medium">Progress bar</span></TableCell>
                        <TableCell className="text-sm">Always shown; color shifts based on completion percentage</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Component Updates */}
          <Card id="component-updates">
            <CardHeader>
              <CardTitle>Component Updates</CardTitle>
              <CardDescription>Track and validate component changes</CardDescription>
            </CardHeader>
            <CardContent>
              <ComponentUpdateIndicator className="max-w-md" />
            </CardContent>
          </Card>
          
          {/* Footer */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-sm text-muted-foreground">
                <p>Components Gallery • Built with shadcn/ui and Radix UI</p>
                <p className="mt-2">Toggle between light and dark themes to see all variants</p>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>;
};