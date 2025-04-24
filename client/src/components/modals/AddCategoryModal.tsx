import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { CheckCircle2, Ban, FileQuestion } from "lucide-react";

interface AddCategoryModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (categoryName: string, isFixed: boolean, description?: string) => void;
  existingCategories: string[];
}

const AddCategoryModal = ({
  open,
  onClose,
  onAdd,
  existingCategories
}: AddCategoryModalProps) => {
  const [categoryName, setCategoryName] = useState('');
  const [categoryType, setCategoryType] = useState('flexible');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [isNameValid, setIsNameValid] = useState(false);
  const [isCategoryExists, setIsCategoryExists] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      setError('');
    } else {
      // Reset form on close
      setTimeout(() => {
        setCategoryName('');
        setCategoryType('flexible');
        setDescription('');
        setError('');
        setIsNameValid(false);
        setIsCategoryExists(false);
      }, 300);
    }
  }, [open]);

  // Validate category name on change
  useEffect(() => {
    const trimmedName = categoryName.trim();
    setIsNameValid(trimmedName.length >= 2);
    
    // Check if category already exists
    if (trimmedName.length > 0) {
      setIsCategoryExists(existingCategories.some(cat => 
        cat.toLowerCase() === trimmedName.toLowerCase()));
    } else {
      setIsCategoryExists(false);
    }
  }, [categoryName, existingCategories]);

  const handleAdd = () => {
    const trimmedName = categoryName.trim();
    
    if (!trimmedName) {
      setError('Please enter a category name');
      return;
    }
    
    if (trimmedName.length < 2) {
      setError('Category name must be at least 2 characters');
      return;
    }
    
    if (isCategoryExists) {
      setError('This category already exists');
      return;
    }
    
    onAdd(trimmedName, categoryType === 'fixed', description || undefined);
    
    // Reset form - the modal will be closed by the parent component
    setCategoryName('');
    setCategoryType('flexible');
    setDescription('');
    setError('');
  };

  // Handle Enter key press to submit the form
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isNameValid && !isCategoryExists) {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl leading-6 font-medium text-gray-900">
            Add New Category
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            Create a custom category to organize your transactions better.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4 space-y-5">
          <div>
            <Label htmlFor="new-category-name" className="block text-sm font-medium text-gray-700">
              Category Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="new-category-name"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. Travel, Gifts, Education"
              className={`mt-1 block w-full border ${error ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
              autoFocus
            />
            
            {/* Category name validation feedback */}
            {categoryName.trim() && (
              <div className="mt-1.5 text-sm flex items-center">
                {isCategoryExists ? (
                  <span className="text-red-500 flex items-center">
                    <Ban className="h-4 w-4 mr-1" />
                    This category already exists
                  </span>
                ) : isNameValid ? (
                  <span className="text-green-500 flex items-center">
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Valid category name
                  </span>
                ) : (
                  <span className="text-amber-500 flex items-center">
                    <FileQuestion className="h-4 w-4 mr-1" />
                    Name must be at least 2 characters
                  </span>
                )}
              </div>
            )}
          </div>
          
          <div>
            <Label htmlFor="category-type" className="block text-sm font-medium text-gray-700">
              Category Type <span className="text-red-500">*</span>
            </Label>
            <Select value={categoryType} onValueChange={setCategoryType}>
              <SelectTrigger id="category-type" className="w-full">
                <SelectValue placeholder="Select a category type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed">Fixed Expense</SelectItem>
                <SelectItem value="flexible">Flexible Expense</SelectItem>
              </SelectContent>
            </Select>
            
            <p className="mt-1.5 text-xs text-gray-500">
              Fixed expenses don't change much month to month (rent, utilities). 
              Flexible expenses vary (dining, entertainment).
            </p>
          </div>
          
          <div>
            <Label htmlFor="category-description" className="block text-sm font-medium text-gray-700">
              Description (optional)
            </Label>
            <Textarea
              id="category-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What kinds of transactions belong in this category?"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              rows={3}
            />
          </div>
          
          {/* Category type explanation cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <Card className={`border ${categoryType === 'fixed' ? 'border-blue-300 bg-blue-50' : 'border-gray-200'} transition-colors`}>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-medium">Fixed Expense</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-xs text-gray-600">
                  Expenses that stay roughly the same each month, like rent, mortgage, 
                  insurance payments, or subscriptions.
                </p>
              </CardContent>
            </Card>
            
            <Card className={`border ${categoryType === 'flexible' ? 'border-green-300 bg-green-50' : 'border-gray-200'} transition-colors`}>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-medium">Flexible Expense</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-xs text-gray-600">
                  Expenses that vary month to month, like dining out, shopping,
                  entertainment, or travel.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {error && (
          <div className="mt-2 text-sm text-red-600">
            {error}
          </div>
        )}
        
        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleAdd} 
            className="bg-blue-600 hover:bg-blue-700"
            disabled={!isNameValid || isCategoryExists}
          >
            Add Category
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddCategoryModal;
