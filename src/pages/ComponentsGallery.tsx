import { useState } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar } from "@/components/ui/calendar";
import { LoadingSkeleton } from "@/components/ui/loading-spinner";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { 
  Home, 
  Settings, 
  User, 
  Bell, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Download, 
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
} from "lucide-react";

interface ComponentsGalleryProps {
  userName: string;
  userEmail: string;
  onLogout: () => void;
}

export const ComponentsGallery = ({ userName, userEmail, onLogout }: ComponentsGalleryProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [switchValue, setSwitchValue] = useState(false);
  const [checkboxValue, setCheckboxValue] = useState(false);
  const [radioValue, setRadioValue] = useState("option1");
  const [selectValue, setSelectValue] = useState("");
  const [progress, setProgress] = useState(33);
  const [isLoading, setIsLoading] = useState(false);
  const [sortColumn, setSortColumn] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  
  // Icon state management for button examples
  const [buttonIcons, setButtonIcons] = useState({
    default: "Plus",
    outline: "Edit", 
    destructive: "Trash2",
    ghost: "Download",
    secondary: "Settings"
  });

  const availableIcons = {
    Plus, Edit, Trash2, Download, Settings, Search, Bell, User, Home, Upload,
    Eye, EyeOff, AlertCircle, CheckCircle, Info, X, ArrowUp, ArrowDown, ArrowUpDown
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

  const tableData = [
    { name: "Alice Johnson", email: "alice@example.com", department: "101" },
    { name: "Bob Wilson", email: "bob@example.com", department: "205" },
    { name: "Carol Smith", email: "carol@example.com", department: "150" },
    { name: "David Brown", email: "david@example.com", department: "89" },
    { name: "Emma Davis", email: "emma@example.com", department: "312" },
  ];

  const sortedData = [...tableData].sort((a, b) => {
    const aValue = a[sortColumn as keyof typeof a];
    const bValue = b[sortColumn as keyof typeof b];
    
    if (sortColumn === "department") {
      const aNum = parseInt(aValue);
      const bNum = parseInt(bValue);
      return sortDirection === "asc" ? aNum - bNum : bNum - aNum;
    }
    
    if (sortDirection === "asc") {
      return aValue.localeCompare(bValue);
    } else {
      return bValue.localeCompare(aValue);
    }
  });
  
  const { toast } = useToast();

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
        });
        break;
      case "destructive":
        toast({
          title: "Error!",
          description: "This is an error message.",
          variant: "destructive",
        });
        break;
      default:
        toast({
          title: "Info",
          description: "This is an info message.",
        });
    }
  };

  const toggleLoading = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        <Header 
          userRole="admin" 
          userName={userName} 
          userEmail={userEmail} 
          onLogout={onLogout} 
        />
        
        <main className="container mx-auto px-4 py-8 space-y-12">
          {/* Page Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-foreground">Components Gallery</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A comprehensive showcase of all UI components with their various states, variants, and themes.
            </p>
          </div>

          {/* Accordion Sections */}
          <Accordion type="multiple" defaultValue={["colors", "typography"]} className="space-y-4">
            
            {/* Color Palette Section */}
            <AccordionItem value="colors">
              <AccordionContent>
                <div className="border rounded-lg">
                  <AccordionTrigger className="text-xl font-semibold px-4 py-3 border-b bg-muted/10 hover:bg-muted/20">
                    Color Palette
                  </AccordionTrigger>
                  <div className="border-b bg-muted/30 p-4">
                    <p className="text-sm text-muted-foreground">Design system color tokens and semantic colors</p>
                  </div>
                  <div className="p-6 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      
                      {/* Primary Colors */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-bold uppercase text-secondary">Primary Colors</h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-primary border border-border shadow-sm"></div>
                            <div>
                              <div className="text-sm font-medium">Primary</div>
                              <div className="text-xs text-muted-foreground">--primary</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-primary-light border border-border shadow-sm"></div>
                            <div>
                              <div className="text-sm font-medium">Primary Light</div>
                              <div className="text-xs text-muted-foreground">--primary-light</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-primary-dark border border-border shadow-sm"></div>
                            <div>
                              <div className="text-sm font-medium">Primary Dark</div>
                              <div className="text-xs text-muted-foreground">--primary-dark</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Secondary Colors */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-bold uppercase text-secondary">Secondary Colors</h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-secondary border border-border shadow-sm"></div>
                            <div>
                              <div className="text-sm font-medium">Secondary</div>
                              <div className="text-xs text-muted-foreground">--secondary</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-accent border border-border shadow-sm"></div>
                            <div>
                              <div className="text-sm font-medium">Accent</div>
                              <div className="text-xs text-muted-foreground">--accent</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Status Colors */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-bold uppercase text-secondary">Status Colors</h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-success border border-border shadow-sm"></div>
                            <div>
                              <div className="text-sm font-medium">Success</div>
                              <div className="text-xs text-muted-foreground">--success</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-warning border border-border shadow-sm"></div>
                            <div>
                              <div className="text-sm font-medium">Warning</div>
                              <div className="text-xs text-muted-foreground">--warning</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-destructive border border-border shadow-sm"></div>
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
                            <div className="w-12 h-12 rounded-lg bg-background border border-border shadow-sm"></div>
                            <div>
                              <div className="text-sm font-medium">Background</div>
                              <div className="text-xs text-muted-foreground">--background</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-card border border-border shadow-sm"></div>
                            <div>
                              <div className="text-sm font-medium">Card</div>
                              <div className="text-xs text-muted-foreground">--card</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-muted border border-border shadow-sm"></div>
                            <div>
                              <div className="text-sm font-medium">Muted</div>
                              <div className="text-xs text-muted-foreground">--muted</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Border & Input Colors */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-bold uppercase text-secondary">Border & Input</h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-border border border-border shadow-sm"></div>
                            <div>
                              <div className="text-sm font-medium">Border</div>
                              <div className="text-xs text-muted-foreground">--border</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-input border border-border shadow-sm"></div>
                            <div>
                              <div className="text-sm font-medium">Input</div>
                              <div className="text-xs text-muted-foreground">--input</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-ring border border-border shadow-sm"></div>
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
                            <div className="w-12 h-12 rounded-lg bg-gradient-primary border border-border shadow-sm"></div>
                            <div>
                              <div className="text-sm font-medium">Primary Gradient</div>
                              <div className="text-xs text-muted-foreground">--gradient-primary</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-gradient-hero border border-border shadow-sm"></div>
                            <div>
                              <div className="text-sm font-medium">Hero Gradient</div>
                              <div className="text-xs text-muted-foreground">--gradient-hero</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-gradient-card border border-border shadow-sm"></div>
                            <div>
                              <div className="text-sm font-medium">Card Gradient</div>
                              <div className="text-xs text-muted-foreground">--gradient-card</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Typography Section */}
            <AccordionItem value="typography">
              <AccordionContent>
                <div className="border rounded-lg">
                  <AccordionTrigger className="text-xl font-semibold px-4 py-3 border-b bg-muted/10 hover:bg-muted/20">
                    Typography
                  </AccordionTrigger>
                  <div className="border-b bg-muted/30 p-4">
                    <p className="text-sm text-muted-foreground">Text styles and hierarchy</p>
                  </div>
                  <div className="p-6 space-y-6">
                    <div className="space-y-4">
                      <h1 className="text-4xl font-bold">Heading 1</h1>
                      <h2 className="text-3xl font-semibold">Heading 2</h2>
                      <h3 className="text-2xl font-medium">Heading 3</h3>
                      <h4 className="text-xl font-medium">Heading 4</h4>
                      <p className="text-base">Body text - Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
                      <p className="text-base font-bold">Body text bold - Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
                      <p className="text-base font-medium">Body text medium - Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
                      <p className="text-sm text-muted-foreground">Small text - Secondary information</p>
                      <p className="text-sm text-muted-foreground font-bold">Small text bold - Secondary information</p>
                      <p className="text-sm text-muted-foreground font-medium">Small text medium - Secondary information</p>
                      <p className="text-xs text-muted-foreground">Extra small text - Captions and labels</p>
                      <p className="text-xs text-muted-foreground font-bold">Extra small text bold - Captions and labels</p>
                      <p className="text-xs text-muted-foreground font-medium">Extra small text medium - Captions and labels</p>
                      <code className="bg-muted px-2 py-1 rounded text-sm font-mono">Code snippet</code>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Buttons Section */}
            <AccordionItem value="buttons">
              <AccordionContent>
                <div className="border rounded-lg">
                  <AccordionTrigger className="text-xl font-semibold px-4 py-3 border-b bg-muted/10 hover:bg-muted/20">
                    Buttons
                  </AccordionTrigger>
                  <div className="border-b bg-muted/30 p-4">
                    <p className="text-sm text-muted-foreground">All button variants and states</p>
                  </div>
                  <div className="p-6">
                    <Tabs defaultValue="variants">
                      <TabsList>
                        <TabsTrigger value="variants">Variants</TabsTrigger>
                        <TabsTrigger value="sizes">Sizes</TabsTrigger>
                        <TabsTrigger value="icons">With Icons</TabsTrigger>
                        <TabsTrigger value="states">States</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="variants" className="space-y-4">
                        <div className="flex flex-wrap gap-3">
                          <Button>Default</Button>
                          <Button variant="secondary">Secondary</Button>
                          <Button variant="destructive">Destructive</Button>
                          <Button variant="outline">Outline</Button>
                          <Button variant="ghost">Ghost</Button>
                          <Button variant="link">Link</Button>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="sizes" className="space-y-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <Button size="sm">Small</Button>
                          <Button size="default">Default</Button>
                          <Button size="lg">Large</Button>
                          <Button size="icon" variant="ghost"><Settings className="w-4 h-4" /></Button>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="icons" className="space-y-4">
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-medium mb-2">With Text and Icons</h4>
                            <div className="flex flex-wrap gap-3">
                              <Button><Plus className="w-4 h-4 mr-2" />Add New</Button>
                              <Button variant="outline"><Edit className="w-4 h-4 mr-2" />Edit</Button>
                              <Button variant="destructive">
                                <Trash2 className="w-4 h-4 mr-2" />Delete
                              </Button>
                              <Button variant="ghost"><Download className="w-4 h-4 mr-2" />Download</Button>
                              <Button variant="secondary"><Settings className="w-4 h-4 mr-2" />Settings</Button>
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="states" className="space-y-4">
                        <div className="flex flex-wrap gap-3">
                          <Button>Normal</Button>
                          <Button disabled>Disabled</Button>
                          <Button onClick={toggleLoading} disabled={isLoading}>
                            {isLoading ? "Loading..." : "Click to Load"}
                          </Button>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Form Controls Section */}
            <AccordionItem value="forms">
              <AccordionContent>
                <div className="border rounded-lg">
                  <AccordionTrigger className="text-xl font-semibold px-4 py-3 border-b bg-muted/10 hover:bg-muted/20">
                    Form Controls
                  </AccordionTrigger>
                  <div className="border-b bg-muted/30 p-4">
                    <p className="text-sm text-muted-foreground">Input fields and form elements</p>
                  </div>
                  <div className="p-6 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="text-input">Text Input</Label>
                          <Input id="text-input" placeholder="Enter text here..." />
                        </div>
                        <div>
                          <Label htmlFor="disabled-input">Disabled Input</Label>
                          <Input id="disabled-input" placeholder="Disabled input" disabled />
                        </div>
                        <div>
                          <Label htmlFor="textarea">Textarea</Label>
                          <Textarea id="textarea" placeholder="Enter longer text here..." />
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Switch 
                            id="switch" 
                            checked={switchValue} 
                            onCheckedChange={setSwitchValue} 
                          />
                          <Label htmlFor="switch">Switch Toggle</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="checkbox" 
                            checked={checkboxValue} 
                            onCheckedChange={(checked) => setCheckboxValue(checked as boolean)} 
                          />
                          <Label htmlFor="checkbox">Checkbox</Label>
                        </div>
                        
                        <RadioGroup value={radioValue} onValueChange={setRadioValue}>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="option1" id="option1" />
                            <Label htmlFor="option1">Option 1</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="option2" id="option2" />
                            <Label htmlFor="option2">Option 2</Label>
                          </div>
                        </RadioGroup>
                        
                        <div>
                          <Label>Select Dropdown</Label>
                          <Select value={selectValue} onValueChange={setSelectValue}>
                            <SelectTrigger>
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
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Tables Section */}
            <AccordionItem value="tables">
              <AccordionContent>
                <div className="border rounded-lg">
                  <AccordionTrigger className="text-xl font-semibold px-4 py-3 border-b bg-muted/10 hover:bg-muted/20">
                    Tables & Data Display
                  </AccordionTrigger>
                  <div className="border-b bg-muted/30 p-4">
                    <p className="text-sm text-muted-foreground">Data tables with sorting, filtering, and status indicators</p>
                  </div>
                  <div className="p-6">
                    <Tabs defaultValue="basic">
                      <TabsList>
                        <TabsTrigger value="basic">Basic Table</TabsTrigger>
                        <TabsTrigger value="sortable">Sortable</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="basic" className="space-y-4">
                        <Table>
                          <TableCaption>A simple data table</TableCaption>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-sm font-bold uppercase text-secondary">Name</TableHead>
                              <TableHead className="text-sm font-bold uppercase text-secondary">Email</TableHead>
                              <TableHead className="text-sm font-bold uppercase text-secondary">Role</TableHead>
                              <TableHead className="text-right text-sm font-bold uppercase text-secondary">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell className="font-medium">John Doe</TableCell>
                              <TableCell>john@example.com</TableCell>
                              <TableCell>Admin</TableCell>
                              <TableCell className="text-right">
                                <Button size="sm" variant="ghost"><Edit className="w-4 h-4" /></Button>
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">Jane Smith</TableCell>
                              <TableCell>jane@example.com</TableCell>
                              <TableCell>User</TableCell>
                              <TableCell className="text-right">
                                <Button size="sm" variant="ghost"><Edit className="w-4 h-4" /></Button>
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
                              <TableHead>
                                <Button 
                                  variant="ghost" 
                                  className={`text-sm font-bold uppercase text-secondary p-0 h-auto hover:bg-transparent ${
                                    sortColumn === "name" ? "text-foreground font-bold" : ""
                                  }`}
                                  onClick={() => handleSort("name")}
                                >
                                  Name 
                                  {sortColumn === "name" ? (
                                    sortDirection === "asc" ? 
                                      <ArrowUp className="w-4 h-4 ml-1" /> : 
                                      <ArrowDown className="w-4 h-4 ml-1" />
                                  ) : (
                                    <ArrowUpDown className="w-4 h-4 ml-1 opacity-50" />
                                  )}
                                </Button>
                              </TableHead>
                              <TableHead>
                                <Button 
                                  variant="ghost" 
                                  className={`text-sm font-bold uppercase text-secondary p-0 h-auto hover:bg-transparent ${
                                    sortColumn === "email" ? "text-foreground font-bold" : ""
                                  }`}
                                  onClick={() => handleSort("email")}
                                >
                                  Email
                                  {sortColumn === "email" ? (
                                    sortDirection === "asc" ? 
                                      <ArrowUp className="w-4 h-4 ml-1" /> : 
                                      <ArrowDown className="w-4 h-4 ml-1" />
                                  ) : (
                                    <ArrowUpDown className="w-4 h-4 ml-1 opacity-50" />
                                  )}
                                </Button>
                              </TableHead>
                              <TableHead>
                                <Button 
                                  variant="ghost" 
                                  className={`text-sm font-bold uppercase text-secondary p-0 h-auto hover:bg-transparent ${
                                    sortColumn === "department" ? "text-foreground font-bold" : ""
                                  }`}
                                  onClick={() => handleSort("department")}
                                >
                                  Department
                                  {sortColumn === "department" ? (
                                    sortDirection === "asc" ? 
                                      <ArrowUp className="w-4 h-4 ml-1" /> : 
                                      <ArrowDown className="w-4 h-4 ml-1" />
                                  ) : (
                                    <ArrowUpDown className="w-4 h-4 ml-1 opacity-50" />
                                  )}
                                </Button>
                              </TableHead>
                              <TableHead className="text-right text-sm font-bold uppercase text-secondary">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {sortedData.map((user, index) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium">{user.name}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>{user.department}</TableCell>
                                <TableCell className="text-right">
                                  <div className="flex gap-1 justify-end">
                                    <Button size="sm" variant="ghost">
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button size="sm" variant="ghost">
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Interactive Components Section */}
            <AccordionItem value="interactive">
              <AccordionContent>
                <div className="border rounded-lg">
                  <AccordionTrigger className="text-xl font-semibold px-4 py-3 border-b bg-muted/10 hover:bg-muted/20">
                    Interactive Components
                  </AccordionTrigger>
                  <div className="border-b bg-muted/30 p-4">
                    <p className="text-sm text-muted-foreground">Dialogs, dropdowns, and overlays</p>
                  </div>
                  <div className="p-6 space-y-6">
                    <div className="flex flex-wrap gap-4">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button>Open Dialog</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Dialog Title</DialogTitle>
                            <DialogDescription>
                              This is a dialog description explaining what this dialog does.
                            </DialogDescription>
                          </DialogHeader>
                          <div>
                            <p>Dialog content goes here.</p>
                          </div>
                          <DialogFooter>
                            <Button variant="outline">Cancel</Button>
                            <Button>Confirm</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive">Delete Item</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete your data.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
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

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Alerts & Feedback</h3>
                      <div className="space-y-4">
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Info Alert</AlertTitle>
                          <AlertDescription>This is an informational alert message.</AlertDescription>
                        </Alert>
                        <Alert variant="destructive">
                          <X className="h-4 w-4" />
                          <AlertTitle>Error Alert</AlertTitle>
                          <AlertDescription>This is an error alert message.</AlertDescription>
                        </Alert>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Progress & Badges</h3>
                      <div className="space-y-4">
                        <Progress value={progress} className="w-[60%]" />
                        <div className="flex gap-2">
                          <Badge>Default</Badge>
                          <Badge variant="secondary">Secondary</Badge>
                          <Badge variant="destructive">Destructive</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Navigation & Layout Section */}
            <AccordionItem value="navigation">
              <AccordionContent>
                <div className="border rounded-lg">
                  <AccordionTrigger className="text-xl font-semibold px-4 py-3 border-b bg-muted/10 hover:bg-muted/20">
                    Navigation & Layout
                  </AccordionTrigger>
                  <div className="border-b bg-muted/30 p-4">
                    <p className="text-sm text-muted-foreground">Breadcrumbs, tabs, separators, and navigation elements</p>
                  </div>
                  <div className="p-6 space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Separators</h3>
                      <div>
                        <div className="space-y-1">
                          <h4 className="text-sm font-medium leading-none">Radix Primitives</h4>
                          <p className="text-sm text-muted-foreground">
                            An open-source UI component library.
                          </p>
                        </div>
                        <Separator className="my-4" />
                        <div className="flex h-5 items-center space-x-4 text-sm">
                          <div>Blog</div>
                          <Separator orientation="vertical" />
                          <div>Docs</div>
                          <Separator orientation="vertical" />
                          <div>Source</div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Example Tabs</h3>
                      <Tabs defaultValue="tab1" className="w-[400px]">
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
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Footer Section */}
            <AccordionItem value="footer">
              <AccordionContent>
                <div className="border rounded-lg">
                  <AccordionTrigger className="text-xl font-semibold px-4 py-3 border-b bg-muted/10 hover:bg-muted/20">
                    About
                  </AccordionTrigger>
                  <div className="border-b bg-muted/30 p-4">
                    <p className="text-sm text-muted-foreground">Built with shadcn/ui and Radix UI</p>
                  </div>
                  <div className="p-6">
                    <div className="text-center text-sm text-muted-foreground">
                      <p>Components Gallery • Built with shadcn/ui and Radix UI</p>
                      <p className="mt-2">Toggle between light and dark themes to see all variants</p>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

          </Accordion>
        </main>
      </div>
    </TooltipProvider>
  );
};