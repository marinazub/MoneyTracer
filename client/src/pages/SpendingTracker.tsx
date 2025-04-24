import { useState, useEffect } from 'react';
import FileUploadSection from "@/components/FileUploadSection";
import SpendingSummary from "@/components/SpendingSummary";
import TransactionList from "@/components/TransactionList";
import AddCategoryButton from "@/components/AddCategoryButton";
import EditTransactionModal from "@/components/modals/EditTransactionModal";
import AddCategoryModal from "@/components/modals/AddCategoryModal";
import Papa from 'papaparse';
import { Transaction, CategoryTotal } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { ReceiptText, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SpendingTracker = () => {
  // Toast notifications
  const { toast } = useToast();
  
  // State for file, transactions, date range, analysis results, etc.
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  
  // State for category analysis
  const [categoryTotals, setCategoryTotals] = useState<CategoryTotal>({});
  const [fixedTotal, setFixedTotal] = useState(0);
  const [flexibleTotal, setFlexibleTotal] = useState(0);
  
  // UI state
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<number | null>(null);
  const [reviewingTransaction, setReviewingTransaction] = useState<number | null>(null);
  const [selectedNewCategory, setSelectedNewCategory] = useState('');
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Fixed categories definition - customize these based on your needs
  const fixedCategories = ['Bills & Utilities', 'Home', 'Education'];
  
  // Special action categories
  const REVIEW_LATER_CATEGORY = "Review Later";
  const FLAGGED_CATEGORY = "Flagged for Review";

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      setFileName(uploadedFile.name);
      parseCSV(uploadedFile);
    }
  };

  // Parse CSV data
  const parseCSV = (file: File) => {
    setLoading(true);
    
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        // Process parsed data
        const parsedTransactions = results.data as Transaction[];
        console.log("Parsed transactions:", parsedTransactions.slice(0, 3));
        
        // Set today's date as end date if not set
        if (!endDate) {
          const today = new Date();
          setEndDate(formatDate(today));
          
          // Set start date to one month ago if not set
          const oneMonthAgo = new Date();
          oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
          setStartDate(formatDate(oneMonthAgo));
        }
        
        // Extract all unique categories
        let categories = [...new Set(parsedTransactions
          .filter(t => t.Category) // Filter out undefined/null categories
          .map(t => t.Category || 'Uncategorized'))];
        
        // Ensure Uncategorized is always available
        if (!categories.includes('Uncategorized')) {
          categories.push('Uncategorized');
        }
        
        // Add special action categories if they don't already exist
        if (!categories.includes(REVIEW_LATER_CATEGORY)) {
          categories.push(REVIEW_LATER_CATEGORY);
        }
        if (!categories.includes(FLAGGED_CATEGORY)) {
          categories.push(FLAGGED_CATEGORY);
        }
        
        // Add fixed categories if they don't exist
        fixedCategories.forEach(category => {
          if (!categories.includes(category)) {
            categories.push(category);
          }
        });
        
        setAvailableCategories(categories);
        
        // Store transactions
        setTransactions(parsedTransactions);
        
        // Apply date filter
        filterTransactionsByDate(parsedTransactions);
        setLoading(false);
      },
      error: (error) => {
        console.error('Error parsing CSV:', error);
        setLoading(false);
        alert('Error parsing CSV file. Please make sure it\'s properly formatted.');
      }
    });
  };

  // Parse date strings from CSV (MM/DD/YYYY format)
  const parseTransactionDate = (dateStr: string) => {
    if (!dateStr) return null;
    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;
    return new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
  };

  // Filter transactions by date range
  const filterTransactionsByDate = (allTransactions = transactions) => {
    if (!startDate || !endDate) return;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Filter transactions within date range
    const filtered = allTransactions.filter(transaction => {
      const transactionDate = parseTransactionDate(transaction['Transaction Date']);
      return transactionDate && transactionDate >= start && transactionDate <= end;
    });
    
    setFilteredTransactions(filtered);
    analyzeTransactions(filtered);
  };

  // Analyze transactions by category
  const analyzeTransactions = (transactionsToAnalyze: Transaction[]) => {
    const categories: CategoryTotal = {};
    let fixedSpending = 0;
    let flexibleSpending = 0;
    
    transactionsToAnalyze.forEach(transaction => {
      const category = transaction.Category || 'Uncategorized';
      let amount = transaction.Amount || 0;
      
      // Skip income (positive amounts) - we're only analyzing expenses
      if (amount >= 0) return;
      
      // Take absolute value for expense analysis
      amount = Math.abs(amount);
      
      // Add to category totals
      if (!categories[category]) categories[category] = 0;
      categories[category] += amount;
      
      // Add to fixed/flexible totals
      if (fixedCategories.includes(category)) {
        fixedSpending += amount;
      } else {
        flexibleSpending += amount;
      }
    });
    
    setCategoryTotals(categories);
    setFixedTotal(fixedSpending);
    setFlexibleTotal(flexibleSpending);
  };

  // Handle date changes
  useEffect(() => {
    if (transactions.length > 0) {
      filterTransactionsByDate();
    }
  }, [startDate, endDate]);
  
  // Initialize with default demo data if desired
  const loadDemoData = () => {
    setLoading(true);
    
    // Create sample transaction data
    const today = new Date();
    const demoTransactions = [
      {
        'Transaction Date': `${today.getMonth() + 1}/01/${today.getFullYear()}`,
        Description: 'ACME Grocery Store',
        Amount: -85.47,
        Category: 'Food & Dining',
        Type: 'Sale',
        Memo: 'Weekly groceries'
      },
      {
        'Transaction Date': `${today.getMonth() + 1}/02/${today.getFullYear()}`,
        Description: 'Coffee Shop',
        Amount: -4.50,
        Category: 'Food & Dining',
        Type: 'Sale',
        Memo: 'Morning coffee'
      },
      {
        'Transaction Date': `${today.getMonth() + 1}/03/${today.getFullYear()}`,
        Description: 'Electricity Company',
        Amount: -124.32,
        Category: 'Bills & Utilities',
        Type: 'Sale',
        Memo: 'Monthly electricity bill'
      },
      {
        'Transaction Date': `${today.getMonth() + 1}/05/${today.getFullYear()}`,
        Description: 'ACME Apartment Homes',
        Amount: -1350.00,
        Category: 'Home',
        Type: 'Sale',
        Memo: 'Monthly rent'
      },
      {
        'Transaction Date': `${today.getMonth() + 1}/07/${today.getFullYear()}`,
        Description: 'Local Restaurant',
        Amount: -56.92,
        Category: 'Food & Dining',
        Type: 'Sale',
        Memo: 'Dinner with friends'
      },
      {
        'Transaction Date': `${today.getMonth() + 1}/10/${today.getFullYear()}`,
        Description: 'Online Retailer',
        Amount: -35.97,
        Category: 'Shopping',
        Type: 'Sale',
        Memo: 'Household items'
      },
      {
        'Transaction Date': `${today.getMonth() + 1}/12/${today.getFullYear()}`,
        Description: 'Gas Station',
        Amount: -42.50,
        Category: 'Auto & Transport',
        Type: 'Sale',
        Memo: 'Fuel'
      },
      {
        'Transaction Date': `${today.getMonth() + 1}/15/${today.getFullYear()}`,
        Description: 'Internet Provider',
        Amount: -75.00,
        Category: 'Bills & Utilities',
        Type: 'Sale',
        Memo: 'Monthly internet'
      },
      {
        'Transaction Date': `${today.getMonth() + 1}/18/${today.getFullYear()}`,
        Description: 'Mobile Phone Company',
        Amount: -89.99,
        Category: 'Bills & Utilities',
        Type: 'Sale',
        Memo: 'Monthly phone bill'
      },
      {
        'Transaction Date': `${today.getMonth() + 1}/20/${today.getFullYear()}`,
        Description: 'Online Streaming',
        Amount: -14.99,
        Category: 'Entertainment',
        Type: 'Sale',
        Memo: 'Monthly subscription'
      },
      {
        'Transaction Date': `${today.getMonth() + 1}/22/${today.getFullYear()}`,
        Description: 'Pharmacy',
        Amount: -28.45,
        Category: 'Health & Fitness',
        Type: 'Sale',
        Memo: 'Medication'
      },
      {
        'Transaction Date': `${today.getMonth() + 1}/25/${today.getFullYear()}`,
        Description: 'Unknown Charge',
        Amount: -19.99,
        Category: 'Uncategorized',
        Type: 'Sale',
        Memo: 'Need to review'
      }
    ];
    
    // Extract categories
    let categories = [...new Set(demoTransactions
      .filter(t => t.Category)
      .map(t => t.Category as string))];
      
    // Add special action categories
    if (!categories.includes(REVIEW_LATER_CATEGORY)) {
      categories.push(REVIEW_LATER_CATEGORY);
    }
    if (!categories.includes(FLAGGED_CATEGORY)) {
      categories.push(FLAGGED_CATEGORY);
    }
    
    setAvailableCategories(categories);
    
    // Set date range
    const endDate = formatDate(today);
    setEndDate(endDate);
    
    const startDate = new Date(today);
    startDate.setMonth(startDate.getMonth() - 1);
    setStartDate(formatDate(startDate));
    
    // Store transactions
    setTransactions(demoTransactions);
    setFileName('demo-data.csv');
    
    // Apply date filter
    setTimeout(() => {
      filterTransactionsByDate(demoTransactions);
      setLoading(false);
    }, 500);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Handle category selection to view transactions
  const handleCategoryClick = (category: string) => {
    // Add animation effect
    if (category !== selectedCategory) {
      // If it's a different category, show a loading effect
      setLoading(true);
      setTimeout(() => {
        setSelectedCategory(category);
        setEditingTransaction(null); // Reset any editing when switching categories
        setReviewingTransaction(null); // Reset any reviewing when switching categories
        setSelectedNewCategory(''); // Reset any selected new category
        setLoading(false);
      }, 300); // Short delay for effect
    } else {
      // If clicking the same category, just toggle it off
      setSelectedCategory(null);
      setEditingTransaction(null);
      setReviewingTransaction(null);
      setSelectedNewCategory('');
    }
  };

  // Start editing a transaction
  const startEditing = (index: number) => {
    const transaction = filteredTransactions[index];
    if (transaction) {
      setSelectedNewCategory(transaction.Category || 'Uncategorized');
      setEditingTransaction(index);
      setShowEditModal(true);
    }
  };

  // Handle changing transaction category
  const updateTransactionCategory = (transactionIndex: number, newCategory: string) => {
    // Check for valid index
    if (transactionIndex < 0 || transactionIndex >= filteredTransactions.length) {
      console.error("Invalid transaction index:", transactionIndex);
      return;
    }
    
    // Create copy of transactions to modify
    const updatedFiltered = [...filteredTransactions];
    const updatedAll = [...transactions];
    
    // Find transaction in filtered list by index
    const transaction = updatedFiltered[transactionIndex];
    
    if (transaction) {
      const oldCategory = transaction.Category;
      
      // Update category in filtered list
      updatedFiltered[transactionIndex] = { ...transaction, Category: newCategory };
      
      // Find and update same transaction in full list
      const fullIndex = updatedAll.findIndex(t => 
        t['Transaction Date'] === transaction['Transaction Date'] && 
        t.Description === transaction.Description &&
        t.Amount === transaction.Amount
      );
      
      if (fullIndex >= 0) {
        updatedAll[fullIndex] = { ...updatedAll[fullIndex], Category: newCategory };
      }
      
      // Update state
      setFilteredTransactions(updatedFiltered);
      setTransactions(updatedAll);
      
      // Re-analyze transactions with updated categories
      analyzeTransactions(updatedFiltered);
      
      // Reset editing state
      setEditingTransaction(null);
      setSelectedNewCategory('');
      setShowEditModal(false);
      
      // If we're in a category view and we're moving out of the current category,
      // we should update the view to reflect the change
      if (selectedCategory && oldCategory === selectedCategory && newCategory !== selectedCategory) {
        // Either switch view to the new category or go back to the category list
        if (confirm(`Transaction moved to ${newCategory}. View that category now?`)) {
          setSelectedCategory(newCategory);
        } else {
          setSelectedCategory(null); // Go back to category list
        }
      }
    }
  };

  // Handle updating multiple transaction fields
  const updateTransaction = (transactionIndex: number, updatedFields: Partial<Transaction>) => {
    // Check for valid index
    if (transactionIndex < 0 || transactionIndex >= filteredTransactions.length) {
      console.error("Invalid transaction index:", transactionIndex);
      return;
    }
    
    // Create copy of transactions to modify
    const updatedFiltered = [...filteredTransactions];
    const updatedAll = [...transactions];
    
    // Find transaction in filtered list by index
    const transaction = updatedFiltered[transactionIndex];
    
    if (transaction) {
      const oldCategory = transaction.Category;
      const newCategory = updatedFields.Category;
      const categoryChanged = newCategory && oldCategory !== newCategory;
      
      // Update transaction in filtered list
      updatedFiltered[transactionIndex] = { ...transaction, ...updatedFields };
      
      // Find and update same transaction in full list
      const fullIndex = updatedAll.findIndex(t => 
        t['Transaction Date'] === transaction['Transaction Date'] && 
        t.Description === transaction.Description &&
        t.Amount === transaction.Amount
      );
      
      if (fullIndex >= 0) {
        updatedAll[fullIndex] = { ...updatedAll[fullIndex], ...updatedFields };
      }
      
      // Update state
      setFilteredTransactions(updatedFiltered);
      setTransactions(updatedAll);
      
      // Re-analyze transactions with updated data
      analyzeTransactions(updatedFiltered);
      
      // Reset editing state
      setEditingTransaction(null);
      setShowEditModal(false);
      
      // If category has changed and we're viewing a specific category
      if (categoryChanged && selectedCategory && oldCategory === selectedCategory) {
        // Either switch view to the new category or go back to the category list
        if (confirm(`Transaction moved to ${newCategory}. View that category now?`)) {
          setSelectedCategory(newCategory);
        } else {
          setSelectedCategory(null); // Go back to category list
        }
      }
    }
  };

  // Flag a transaction for review
  const flagTransaction = (index: number) => {
    updateTransactionCategory(index, FLAGGED_CATEGORY);
  };

  // Add new category
  const addCategory = (categoryName: string, isFixed: boolean, description?: string) => {
    if (!categoryName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a category name",
        variant: "destructive",
      });
      return;
    }
    
    // Check if category already exists
    if (availableCategories.includes(categoryName)) {
      toast({
        title: "Error",
        description: "This category already exists",
        variant: "destructive",
      });
      return;
    }
    
    // Add to available categories
    const updatedCategories = [...availableCategories, categoryName];
    setAvailableCategories(updatedCategories);
    
    // Add to fixed categories if needed
    if (isFixed) {
      fixedCategories.push(categoryName);
    }
    
    // Show success message with toast notification
    const categoryType = isFixed ? 'fixed' : 'flexible';
    toast({
      title: "Category Added",
      description: (
        <div className="flex flex-col gap-1">
          <div className="flex items-center">
            <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
            <span>
              Added new <span className="font-semibold">{categoryType}</span> category: <span className="font-semibold">{categoryName}</span>
            </span>
          </div>
          {description && (
            <div className="text-sm text-gray-600 mt-1 pl-6">
              Description: {description}
            </div>
          )}
        </div>
      )
    });
    
    // Reset state and close modal
    setNewCategoryName('');
    setShowCategoryModal(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 md:flex md:items-center md:justify-between">
          <h1 className="text-2xl font-semibold text-gray-800 flex items-center">
            <ReceiptText className="h-7 w-7 mr-2 text-primary" />
            Fixed vs. Flexible Spending Tracker
          </h1>
        </div>
      </header>

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        <FileUploadSection 
          fileName={fileName}
          handleFileUpload={handleFileUpload}
          loadDemoData={loadDemoData}
          startDate={startDate}
          endDate={endDate}
          setStartDate={setStartDate}
          setEndDate={setEndDate}
        />

        <SpendingSummary 
          fixedTotal={fixedTotal}
          flexibleTotal={flexibleTotal}
          formatCurrency={formatCurrency}
          categoryTotals={categoryTotals}
          fixedCategories={fixedCategories}
        />

        <TransactionList
          loading={loading}
          selectedCategory={selectedCategory}
          categoryTotals={categoryTotals}
          fixedCategories={fixedCategories}
          formatCurrency={formatCurrency}
          handleCategoryClick={handleCategoryClick}
          filteredTransactions={filteredTransactions}
          startEditing={startEditing}
          flagTransaction={flagTransaction}
          totalSpending={fixedTotal + flexibleTotal}
        />

        <AddCategoryButton onClick={() => setShowCategoryModal(true)} />
      </main>

      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center text-sm text-gray-500">
          <p>Fixed vs. Flexible Spending Tracker &copy; {new Date().getFullYear()}</p>
        </div>
      </footer>

      <EditTransactionModal 
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        transaction={editingTransaction !== null ? filteredTransactions[editingTransaction] : undefined}
        availableCategories={availableCategories}
        onSave={(updatedFields) => {
          if (editingTransaction !== null) {
            updateTransaction(editingTransaction, updatedFields);
          }
        }}
      />

      <AddCategoryModal 
        open={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        onAdd={addCategory}
        existingCategories={availableCategories}
      />
    </div>
  );
};

export default SpendingTracker;
