import { useState, useEffect } from 'react';
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
import { Transaction } from "@/lib/types";

interface EditTransactionModalProps {
  open: boolean;
  onClose: () => void;
  transaction?: Transaction;
  availableCategories: string[];
  onSave: (updatedFields: Partial<Transaction>) => void;
}

const EditTransactionModal = ({
  open,
  onClose,
  transaction,
  availableCategories,
  onSave
}: EditTransactionModalProps) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [category, setCategory] = useState('');

  // Update form when transaction changes
  useEffect(() => {
    if (transaction) {
      setDescription(transaction.Description || '');
      setAmount(String(transaction.Amount || ''));
      setMemo(transaction.Memo || '');
      setCategory(transaction.Category || 'Uncategorized');
    }
  }, [transaction]);

  const handleSave = () => {
    const updatedFields: Partial<Transaction> = {
      Description: description,
      Amount: parseFloat(amount),
      Memo: memo,
      Category: category
    };
    
    onSave(updatedFields);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg leading-6 font-medium text-gray-900">
            Edit Transaction
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4 space-y-4">
          <div>
            <Label htmlFor="edit-description" className="block text-sm font-medium text-gray-700">
              Description
            </Label>
            <Input
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          
          <div>
            <Label htmlFor="edit-amount" className="block text-sm font-medium text-gray-700">
              Amount
            </Label>
            <Input
              id="edit-amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          
          <div>
            <Label htmlFor="edit-memo" className="block text-sm font-medium text-gray-700">
              Memo
            </Label>
            <Input
              id="edit-memo"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          
          <div>
            <Label htmlFor="edit-category" className="block text-sm font-medium text-gray-700">
              Category
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="edit-category" className="w-full">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {availableCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditTransactionModal;
