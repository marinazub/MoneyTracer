import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface AddCategoryButtonProps {
  onClick: () => void;
}

const AddCategoryButton = ({ onClick }: AddCategoryButtonProps) => {
  return (
    <div className="fixed bottom-6 right-6">
      <Button 
        size="icon" 
        className="inline-flex items-center p-3 border border-transparent rounded-full shadow-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 h-12 w-12"
        onClick={onClick}
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  );
};

export default AddCategoryButton;
