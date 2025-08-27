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
  X
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
  
  const { toast } = useToast();

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

          {/* Typography Section */}
          <Card>
            <CardHeader>
              <CardTitle>Typography</CardTitle>
              <CardDescription>Text styles and hierarchy</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h1 className="text-4xl font-bold">Heading 1</h1>
                <h2 className="text-3xl font-semibold">Heading 2</h2>
                <h3 className="text-2xl font-medium">Heading 3</h3>
                <h4 className="text-xl font-medium">Heading 4</h4>
                <p className="text-base">Body text - Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
                <p className="text-sm text-muted-foreground">Small text - Secondary information</p>
                <p className="text-xs text-muted-foreground">Extra small text - Captions and labels</p>
                <code className="bg-muted px-2 py-1 rounded text-sm font-mono">Code snippet</code>
              </div>
            </CardContent>
          </Card>

          {/* Buttons Section */}
          <Card>
            <CardHeader>
              <CardTitle>Buttons</CardTitle>
              <CardDescription>All button variants and states</CardDescription>
            </CardHeader>
            <CardContent>
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
                    <Button size="icon"><Settings className="w-4 h-4" /></Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="icons" className="space-y-4">
                  <div className="flex flex-wrap gap-3">
                    <Button><Plus className="w-4 h-4 mr-2" />Add New</Button>
                    <Button variant="outline"><Edit className="w-4 h-4 mr-2" />Edit</Button>
                    <Button variant="destructive" className="text-destructive hover:text-destructive">
                      <Trash2 className="w-4 h-4 mr-2" />Delete
                    </Button>
                    <Button variant="ghost"><Download className="w-4 h-4 mr-2" />Download</Button>
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
            </CardContent>
          </Card>

          {/* Form Controls Section */}
          <Card>
            <CardHeader>
              <CardTitle>Form Controls</CardTitle>
              <CardDescription>Input fields and form elements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
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
            </CardContent>
          </Card>

          {/* Feedback Components */}
          <Card>
            <CardHeader>
              <CardTitle>Feedback Components</CardTitle>
              <CardDescription>Alerts, badges, and progress indicators</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Alerts</h3>
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
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Badges</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge>Default</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="destructive">Destructive</Badge>
                  <Badge variant="outline">Outline</Badge>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Progress</h3>
                <Progress value={progress} className="w-full" />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => setProgress(Math.max(0, progress - 10))}>-10</Button>
                  <Button size="sm" onClick={() => setProgress(Math.min(100, progress + 10))}>+10</Button>
                  <span className="text-sm text-muted-foreground">{progress}%</span>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Toast Messages</h3>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => showToast("default")}>Info Toast</Button>
                  <Button size="sm" onClick={() => showToast("success")}>Success Toast</Button>
                  <Button size="sm" variant="destructive" onClick={() => showToast("destructive")}>Error Toast</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Display */}
          <Card>
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
                <h3 className="text-lg font-medium">Table</h3>
                <Table>
                  <TableCaption>A list of sample data</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>John Doe</TableCell>
                      <TableCell><Badge variant="secondary">Active</Badge></TableCell>
                      <TableCell>john@example.com</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost"><Edit className="w-4 h-4" /></Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Jane Smith</TableCell>
                      <TableCell><Badge>Complete</Badge></TableCell>
                      <TableCell>jane@example.com</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost"><Edit className="w-4 h-4" /></Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Loading States</h3>
                <LoadingSkeleton />
              </div>
            </CardContent>
          </Card>

          {/* Interactive Components */}
          <Card>
            <CardHeader>
              <CardTitle>Interactive Components</CardTitle>
              <CardDescription>Dialogs, dropdowns, and overlays</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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
                    <div className="px-6 py-4">
                      <p>Dialog content goes here. This content area has proper padding while the header and footer extend full width.</p>
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
            </CardContent>
          </Card>

          {/* Calendar Component */}
          <Card>
            <CardHeader>
              <CardTitle>Calendar</CardTitle>
              <CardDescription>Date picker component</CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border pointer-events-auto"
              />
            </CardContent>
          </Card>

          {/* Icons Gallery */}
          <Card>
            <CardHeader>
              <CardTitle>Icons</CardTitle>
              <CardDescription>Commonly used Lucide icons</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-8 md:grid-cols-12 gap-4">
                {[
                  Home, Settings, User, Bell, Search, Plus, Edit, Trash2,
                  Download, Upload, Eye, EyeOff, AlertCircle, CheckCircle, Info, X
                ].map((Icon, index) => (
                  <Tooltip key={index}>
                    <TooltipTrigger asChild>
                      <div className="flex items-center justify-center p-3 border rounded-lg hover:bg-muted transition-colors">
                        <Icon className="w-5 h-5" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{Icon.name}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Layout Components */}
          <Card>
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
      </div>
    </TooltipProvider>
  );
};