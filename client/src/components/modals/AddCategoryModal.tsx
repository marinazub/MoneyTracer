import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

interface AddCategoryModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (categoryName: string, isFixed: boolean) => void;
}

const AddCategoryModal = ({
  open,
  onClose,
  onAdd
}: AddCategoryModalProps) => {
  const [categoryName, setCategoryName] = useState('');
  const [categoryType, setCategoryType] = useState('flexible');

  const handleAdd = () => {
    if (!categoryName.trim()) {
      alert('Please enter a category name');
      return;
    }
    
    onAdd(categoryName, categoryType === 'fixed');
    setCategoryName('');
    setCategoryType('flexible');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg leading-6 font-medium text-gray-900">
            Add New Category
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4 space-y-4">
          <div>
            <Label htmlFor="new-category-name" className="block text-sm font-medium text-gray-700">
              Category Name
            </Label>
            <Input
              id="new-category-name"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="e.g. Travel, Gifts, Education"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          
          <div>
            <Label htmlFor="category-type" className="block text-sm font-medium text-gray-700">
              Category Type
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
          </div>
        </div>
        
        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700">
            Add Category
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddCategoryModal;
