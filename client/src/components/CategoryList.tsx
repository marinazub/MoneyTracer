import { CategoryTotal } from "@/lib/types";

interface CategoryListProps {
  categoryTotals: CategoryTotal;
  fixedCategories: string[];
  formatCurrency: (amount: number) => string;
  handleCategoryClick: (category: string) => void;
  totalSpending: number;
}

const CategoryList = ({
  categoryTotals,
  fixedCategories,
  formatCurrency,
  handleCategoryClick,
  totalSpending
}: CategoryListProps) => {
  // Convert categoryTotals object to an array so we can sort it
  const sortedCategories = Object.entries(categoryTotals)
    // Convert to array of objects
    .map(([category, amount]) => ({ 
      category, 
      amount, 
      isFixed: fixedCategories.includes(category),
      percentage: totalSpending > 0 ? ((amount / totalSpending) * 100).toFixed(1) : "0.0"
    }))
    // Sort by amount descending
    .sort((a, b) => b.amount - a.amount);

  const getCategoryColorClass = (category: string, isFixed: boolean) => {
    if (category === 'Uncategorized' || category === 'Review Later' || category === 'Flagged for Review') {
      return 'bg-amber-500'; // Amber for categories needing review
    }
    return isFixed ? 'bg-blue-500' : 'bg-green-500';
  };

  const getCategoryBadgeClass = (category: string, isFixed: boolean) => {
    if (category === 'Uncategorized' || category === 'Review Later' || category === 'Flagged for Review') {
      return 'bg-amber-500'; // Amber for categories needing review
    }
    return isFixed ? 'bg-blue-500' : 'bg-green-500';
  };

  return (
    <div id="category-list" className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {sortedCategories.map(({ category, amount, isFixed, percentage }) => (
          <div 
            key={category}
            className="bg-gray-50 rounded-md p-4 border border-gray-200 hover:shadow-md transition cursor-pointer" 
            onClick={() => handleCategoryClick(category)}
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center">
                <div className={`w-3 h-3 ${getCategoryColorClass(category, isFixed)} rounded-full mr-2`}></div>
                <h3 className="font-medium">{category}</h3>
              </div>
              <span className={`text-xs text-white ${getCategoryBadgeClass(category, isFixed)} px-2 py-0.5 rounded-full`}>
                {category === 'Uncategorized' || category === 'Review Later' || category === 'Flagged for Review' 
                  ? 'Review' 
                  : isFixed ? 'Fixed' : 'Flexible'}
              </span>
            </div>
            <div className="mt-2 font-mono font-medium">{formatCurrency(amount)}</div>
            <div className="text-xs text-gray-500 mt-1">{percentage}% of total</div>
          </div>
        ))}
        
        {sortedCategories.length === 0 && (
          <div className="col-span-full text-center py-8 text-gray-500">
            No transactions found for the selected date range. Please upload a CSV file or load demo data.
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryList;
