import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Transaction, CategoryTotal } from "@/lib/types";
import CategoryList from "./CategoryList";
import CategoryTransactions from "./CategoryTransactions";

interface TransactionListProps {
  loading: boolean;
  selectedCategory: string | null;
  categoryTotals: CategoryTotal;
  fixedCategories: string[];
  formatCurrency: (amount: number) => string;
  handleCategoryClick: (category: string) => void;
  filteredTransactions: Transaction[];
  startEditing: (index: number) => void;
  flagTransaction: (index: number) => void;
  totalSpending: number;
}

const TransactionList = ({
  loading,
  selectedCategory,
  categoryTotals,
  fixedCategories,
  formatCurrency,
  handleCategoryClick,
  filteredTransactions,
  startEditing,
  flagTransaction,
  totalSpending
}: TransactionListProps) => {
  
  return (
    <Card className="mb-6">
      <CardHeader className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
        <CardTitle className="text-lg font-medium text-gray-800" id="transaction-list-heading">
          {selectedCategory ? (
            <>
              {selectedCategory}
              {fixedCategories.includes(selectedCategory) ? (
                <span className="text-xs text-white bg-blue-500 px-2 py-0.5 rounded-full ml-2">Fixed</span>
              ) : (
                <span className="text-xs text-white bg-green-500 px-2 py-0.5 rounded-full ml-2">Flexible</span>
              )}
            </>
          ) : (
            'All Transactions'
          )}
        </CardTitle>
        {selectedCategory && (
          <div id="category-filter-controls">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCategoryClick(selectedCategory)}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Categories
            </Button>
          </div>
        )}
      </CardHeader>
      
      {loading ? (
        <CardContent className="p-6">
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      ) : (
        <>
          {selectedCategory ? (
            <CategoryTransactions 
              category={selectedCategory}
              transactions={filteredTransactions.filter(t => t.Category === selectedCategory)}
              formatCurrency={formatCurrency}
              startEditing={startEditing}
              flagTransaction={flagTransaction}
            />
          ) : (
            <CategoryList 
              categoryTotals={categoryTotals}
              fixedCategories={fixedCategories}
              formatCurrency={formatCurrency}
              handleCategoryClick={handleCategoryClick}
              totalSpending={totalSpending}
            />
          )}
        </>
      )}
    </Card>
  );
};

export default TransactionList;
