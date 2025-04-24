import { useState, useEffect } from 'react';
import { Transaction } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Flag, Edit, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CategoryTransactionsProps {
  category: string;
  transactions: Transaction[];
  formatCurrency: (amount: number) => string;
  startEditing: (index: number) => void;
  flagTransaction: (index: number) => void;
}

const CategoryTransactions = ({
  category,
  transactions,
  formatCurrency,
  startEditing,
  flagTransaction
}: CategoryTransactionsProps) => {
  const [showTransactionsMovedAlert, setShowTransactionsMovedAlert] = useState(false);
  
  // When a transaction is moved from this category, show an alert
  useEffect(() => {
    if (transactions.length === 0) {
      setShowTransactionsMovedAlert(true);
      // Hide the alert after 5 seconds
      const timer = setTimeout(() => {
        setShowTransactionsMovedAlert(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    } else {
      setShowTransactionsMovedAlert(false);
    }
  }, [transactions.length]);
  
  return (
    <div id="category-transactions">
      {showTransactionsMovedAlert && (
        <Alert className="mb-4 bg-amber-50 border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <AlertDescription>
            Transactions have been moved out of this category. You can return to the category list to see all categories.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Memo</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map((transaction, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction['Transaction Date']}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{transaction.Description}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-red-600">
                  {formatCurrency(transaction.Amount || 0)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.Memo}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {transaction.Category}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-blue-600 hover:text-blue-800 mr-3"
                    onClick={() => startEditing(index)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-amber-500 hover:text-amber-700"
                    onClick={() => flagTransaction(index)}
                  >
                    <Flag className="h-4 w-4 mr-1" />
                    Flag
                  </Button>
                </td>
              </tr>
            ))}
            
            {transactions.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No transactions found in this category for the selected date range.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CategoryTransactions;
