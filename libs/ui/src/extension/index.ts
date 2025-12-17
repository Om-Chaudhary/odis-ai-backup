/**
 * Extension-compatible UI components
 * These variants don't depend on Next.js specific features
 */

// Re-export cn utility for convenience
export { cn } from '@odis-ai/utils';

// Re-export AuthGuard from extension-shared
export { AuthGuard } from '@odis-ai/extension-shared';

// Extension-specific components
export { Logo } from './Logo';
export { LoadingSpinner } from './LoadingSpinner';
export { ErrorDisplay } from './ErrorDisplay';

// Re-export all other components that are already browser-safe
export { Button, buttonVariants } from '../button';
export { Input } from '../input';
export { Label } from '../label';
export { Textarea } from '../textarea';
export { Checkbox } from '../checkbox';
export { RadioGroup, RadioGroupItem } from '../radio-group';
export { Switch } from '../switch';
export { Slider } from '../slider';
export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel, SelectSeparator, SelectScrollUpButton, SelectScrollDownButton } from '../select';
export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../card';
export { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogOverlay, DialogPortal, DialogTitle, DialogTrigger } from '../dialog';
export { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogOverlay, AlertDialogPortal, AlertDialogTitle, AlertDialogTrigger } from '../alert-dialog';
export { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuPortal, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from '../dropdown-menu';
export { Popover, PopoverContent, PopoverTrigger } from '../popover';
export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../tooltip';
export { Avatar, AvatarFallback, AvatarImage } from '../avatar';
export { Badge, badgeVariants } from '../badge';
export { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '../table';
export { Progress } from '../progress';
export { Separator } from '../separator';
export { ScrollArea, ScrollBar } from '../scroll-area';
export { Tabs, TabsContent, TabsList, TabsTrigger } from '../tabs';
export { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../accordion';
export { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../collapsible';
export { Alert, AlertDescription, AlertTitle } from '../alert';
export { Skeleton } from '../skeleton';
export { Spinner } from '../spinner';
