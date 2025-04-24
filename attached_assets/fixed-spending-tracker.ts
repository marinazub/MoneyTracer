import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Papa from 'papaparse';

const SpendingTracker = () => {
  // State for file, transactions, date range, analysis results, etc.
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  
  // State for category analysis
  const [categoryTotals, setCategoryTotals] = useState({});
  const [fixedTotal, setFixedTotal] = useState(0);
  const [flexibleTotal, setFlexibleTotal] = useState(0);
  
  // UI state
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [reviewingTransaction, setReviewingTransaction] = useState(null);
  const [selectedNewCategory, setSelectedNewCategory] = useState('');
  const [availableCategories, setAvailableCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  
  // Fixed categories definition - customize these based on your needs
  const fixedCategories = ['Bills & Utilities', 'Home', 'Education'];
  
  // Special action categories
  const REVIEW_LATER_CATEGORY = "Review Later";
  const FLAGGED_CATEGORY = "Flagged for Review";
  
  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#a05195', '#d45087', '#f95d6a', '#ff7c43'];
  const TYPE_COLORS = ['#0088FE', '#00C49F'];

  // Handle file upload
  const handleFileUpload = (event) => {
    const uploadedFile = event.target.files[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      setFileName(uploadedFile.name);
      parseCSV(uploadedFile);
    }
  };

  // Parse CSV data
  const parseCSV = (file) => {
    setLoading(true);
    
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        // Process parsed data
        const parsedTransactions = results.data;
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

  // Format date as YYYY-MM-DD for input fields
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Parse date strings from CSV (MM/DD/YYYY format)
  const parseTransactionDate = (dateStr) => {
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
  const analyzeTransactions = (transactions) => {
    const categories = {};
    let fixedSpending = 0;
    let flexibleSpending = 0;
    
    transactions.forEach(transaction => {
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
      .map(t => t.Category))];
      
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
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Handle category selection to view transactions
  const handleCategoryClick = (category) => {
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
  const startEditing = (index) => {
    const transaction = filteredTransactions[index];
    if (transaction) {
      setSelectedNewCategory(transaction.Category || 'Uncategorized');
      setEditingTransaction(index);
    }
  };

  // Handle changing transaction category
  const updateTransactionCategory = (transactionIndex, newCategory) => {
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
      console.log("Updating category for transaction:", transaction.Description, transaction['Transaction Date'], transaction.Amount);
      
      // Create a unique identifier for this transaction by combining all fields
      const transactionId = JSON.stringify({
        date: transaction['Transaction Date'],
        description: transaction.Description,
        amount: transaction.Amount,
        type: transaction.Type,
        memo: transaction.Memo
      });
      
      // Update category in filtered transactions
      updatedFiltered[transactionIndex] = {...transaction, Category: newCategory};
      
      // Find and update in all transactions using the detailed matching
      const globalIndex = updatedAll.findIndex(t => {
        const currentId = JSON.stringify({
          date: t['Transaction Date'],
          description: t.Description,
          amount: t.Amount,
          type: t.Type,
          memo: t.Memo
        });
        return currentId === transactionId;
      });
      
      if (globalIndex !== -1) {
        console.log("Found matching transaction at index:", globalIndex);
        updatedAll[globalIndex] = {...updatedAll[globalIndex], Category: newCategory};
      } else {
        console.warn("Could not find matching transaction in the full dataset");
      }
      
      // Update state
      setFilteredTransactions(updatedFiltered);
      setTransactions(updatedAll);
      
      // Reanalyze with updated categories
      analyzeTransactions(updatedFiltered);
    } else {
      console.error("Transaction not found at index:", transactionIndex);
    }
    
    // Close edit mode
    setEditingTransaction(null);
    setSelectedNewCategory('');
  };

  // Move transaction to "Review Later" category
  const moveToReviewLater = (transactionIndex) => {
    // Get the exact transaction we want to move
    const transaction = filteredTransactions[transactionIndex];
    if (!transaction) return;
    
    // Log to help debugging
    console.log("Moving to Review Later:", transaction.Description, transaction['Transaction Date'], transaction.Amount);
    
    // Update its category
    updateTransactionCategory(transactionIndex, REVIEW_LATER_CATEGORY);
  };
  
  // Flag transaction for review
  const flagTransaction = (transactionIndex) => {
    // Get the exact transaction we want to flag
    const transaction = filteredTransactions[transactionIndex];
    if (!transaction) return;
    
    // Log to help debugging
    console.log("Flagging transaction:", transaction.Description, transaction['Transaction Date'], transaction.Amount);
    
    // Update its category
    updateTransactionCategory(transactionIndex, FLAGGED_CATEGORY);
  };
  
  // Add a new custom category
  const addNewCategory = () => {
    if (newCategoryName.trim() === '') return;
    
    if (!availableCategories.includes(newCategoryName)) {
      setAvailableCategories([...availableCategories, newCategoryName]);
      setShowCategoryModal(false);
      setNewCategoryName('');
    }
  };

  // Prepare data for charts
  const prepareChartData = () => {
    // For category chart - special handling to highlight review categories
    const categoryData = Object.entries(categoryTotals)
      .map(([name, value]) => ({ 
        name, 
        value,
        // Add a type property to help with styling and interaction
        type: fixedCategories.includes(name) ? 'fixed' : 
              name === REVIEW_LATER_CATEGORY ? 'review' :
              name === FLAGGED_CATEGORY ? 'flagged' : 'flexible'
      }))
      .sort((a, b) => b.value - a.value);
    
    // For fixed vs flexible chart
    const typeData = [
      { name: 'Fixed', value: fixedTotal },
      { name: 'Flexible', value: flexibleTotal },
      { name: 'Review Later', value: categoryTotals[REVIEW_LATER_CATEGORY] || 0 },
      { name: 'Flagged', value: categoryTotals[FLAGGED_CATEGORY] || 0 }
    ].filter(item => item.value > 0); // Only show categories with values
    
    return { categoryData, typeData };
  };

  // Get transactions for selected category
  const getCategoryTransactions = () => {
    if (!selectedCategory) return [];
    
    return filteredTransactions.filter(t => 
      (t.Category || 'Uncategorized') === selectedCategory && t.Amount < 0
    );
  };

  // Check if we have data to show
  const hasData = filteredTransactions.length > 0;
  
  // Prepare chart data if we have transactions
  const { categoryData, typeData } = hasData ? prepareChartData() : { categoryData: [], typeData: [] };
  
  // Calculate total spending
  const totalSpending = fixedTotal + flexibleTotal;

  return (
    <div className="p-4 max-w-6xl mx-auto bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-center text-blue-800">Personal Spending Tracker</h1>
      
      {/* Transaction Review Modal */}
      {reviewingTransaction !== null && selectedCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Transaction Review</h3>
              <button 
                onClick={() => setReviewingTransaction(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>
            
            {getCategoryTransactions()[reviewingTransaction] && (
              <div>
                <div className="grid grid-cols-1 gap-4 mb-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Description</h4>
                    <p className="text-lg">{getCategoryTransactions()[reviewingTransaction].Description}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Date</h4>
                      <p className="text-lg">{getCategoryTransactions()[reviewingTransaction]['Transaction Date']}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Amount</h4>
                      <p className="text-lg text-red-600 font-medium">
                        {formatCurrency(Math.abs(getCategoryTransactions()[reviewingTransaction].Amount))}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Category</h4>
                      <p className="text-lg">
                        <span className={`px-2 py-1 rounded-full ${
                          fixedCategories.includes(getCategoryTransactions()[reviewingTransaction].Category) 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {getCategoryTransactions()[reviewingTransaction].Category || 'Uncategorized'}
                        </span>
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Type</h4>
                      <p className="text-lg">{getCategoryTransactions()[reviewingTransaction].Type || 'N/A'}</p>
                    </div>
                  </div>
                  
                  {getCategoryTransactions()[reviewingTransaction].Memo && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Memo</h4>
                      <p className="text-lg">{getCategoryTransactions()[reviewingTransaction].Memo}</p>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button 
                    onClick={() => {
                      setEditingTransaction(reviewingTransaction);
                      const transaction = getCategoryTransactions()[reviewingTransaction];
                      if (transaction) {
                        setSelectedNewCategory(transaction.Category || 'Uncategorized');
                      }
                      setReviewingTransaction(null);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                  >
                    Edit Category
                  </button>
                  <button 
                    onClick={() => setReviewingTransaction(null)}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* New Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Add New Category</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Category Name:</label>
              <input 
                type="text" 
                value={newCategoryName} 
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="w-full p-2 border rounded-md"
                placeholder="Enter new category name"
                autoFocus
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setShowCategoryModal(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md"
              >
                Cancel
              </button>
              <button 
                onClick={addNewCategory}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
              >
                Add Category
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* File Upload Section */}
      <div className="mb-8 p-6 bg-white rounded-lg shadow-md transition-all duration-300 hover:shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Upload Your Bank Statement</h2>
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex-1 min-w-64 cursor-pointer bg-blue-100 hover:bg-blue-200 p-4 rounded-lg border-2 border-dashed border-blue-300 text-center transition-all duration-200 hover:border-blue-500 hover:shadow-md">
            <div className="flex flex-col items-center justify-center h-full">
              <svg className="w-10 h-10 text-blue-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="block mb-2 font-medium">
                {fileName ? fileName : "Select CSV File"}
              </span>
              <span className="text-sm text-blue-700">
                Supports Chase bank CSV format
              </span>
              <span className="text-xs text-gray-500 mt-1">
                Click or drag file here
              </span>
            </div>
            <input 
              type="file" 
              accept=".csv" 
              onChange={handleFileUpload} 
              className="hidden" 
            />
          </label>
          
          <div className="flex-1 min-w-64">
            <div className="flex flex-col gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Start Date:</label>
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1 p-2 w-full border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" 
                  disabled={!transactions.length}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">End Date:</label>
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1 p-2 w-full border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" 
                  disabled={!transactions.length}
                />
              </div>
              {transactions.length > 0 && (
                <button 
                  onClick={() => filterTransactionsByDate()}
                  className="mt-2 p-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
                >
                  Update Date Range
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-lg">Loading and analyzing your data...</p>
          <p className="text-sm text-gray-500 mt-2">This may take a moment for large datasets</p>
        </div>
      )}
      
      {/* Analysis Dashboard */}
      {hasData && !loading && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Spending Analysis Dashboard</h2>
          
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-medium text-gray-700">Total Spending</h3>
              <p className="text-2xl font-bold text-blue-700">{formatCurrency(totalSpending)}</p>
              <p className="text-sm text-gray-500">
                {filteredTransactions.length} transactions analyzed
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-medium text-gray-700">Fixed Expenses</h3>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(fixedTotal)}</p>
              <p className="text-sm text-gray-500">
                {((fixedTotal / totalSpending) * 100).toFixed(1)}% of total
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-medium text-gray-700">Flexible Expenses</h3>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(flexibleTotal)}</p>
              <p className="text-sm text-gray-500">
                {((flexibleTotal / totalSpending) * 100).toFixed(1)}% of total
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md cursor-pointer hover:bg-gray-50" 
              onClick={() => handleCategoryClick(REVIEW_LATER_CATEGORY)}>
              <h3 className="text-lg font-medium text-gray-700">Review Later</h3>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(categoryTotals[REVIEW_LATER_CATEGORY] || 0)}
              </p>
              <p className="text-sm text-gray-500">
                {filteredTransactions.filter(t => t.Category === REVIEW_LATER_CATEGORY).length} transactions
              </p>
              <p className="text-xs text-purple-600 mt-1">Click to view details</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md cursor-pointer hover:bg-gray-50"
              onClick={() => handleCategoryClick(FLAGGED_CATEGORY)}>
              <h3 className="text-lg font-medium text-gray-700">Flagged Items</h3>
              <p className="text-2xl font-bold text-orange-600">
                {formatCurrency(categoryTotals[FLAGGED_CATEGORY] || 0)}
              </p>
              <p className="text-sm text-gray-500">
                {filteredTransactions.filter(t => t.Category === FLAGGED_CATEGORY).length} transactions
              </p>
              <p className="text-xs text-orange-600 mt-1">Click to view details</p>
            </div>
          </div>
          
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Fixed vs Flexible Chart */}
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-medium mb-2 text-gray-700">Fixed vs. Flexible Spending</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={typeData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {typeData.map((entry, index) => {
                        let color = '#8884d8';
                        if (entry.name === 'Fixed') color = '#3b82f6';
                        else if (entry.name === 'Flexible') color = '#10b981';
                        else if (entry.name === 'Review Later') color = '#8b5cf6';
                        else if (entry.name === 'Flagged') color = '#f97316';
                        
                        return (
                          <Cell 
                            key={`cell-type-${index}`} 
                            fill={color}
                          />
                        );
                      })}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Category Breakdown Chart */}
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-medium mb-2 text-gray-700">Top Spending Categories</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={categoryData.slice(0, 8)} // Show top 8 categories
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      width={80}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Bar 
                      dataKey="value" 
                      name="Amount" 
                      onClick={(data) => handleCategoryClick(data.name)}
                    >
                      {categoryData.slice(0, 8).map((entry, index) => {
                        let color = COLORS[index % COLORS.length];
                        if (entry.type === 'fixed') color = '#3b82f6';
                        else if (entry.type === 'flexible') color = '#10b981';
                        else if (entry.type === 'review') color = '#8b5cf6';
                        else if (entry.type === 'flagged') color = '#f97316';
                        
                        return (
                          <Cell 
                            key={`cell-category-${index}`} 
                            fill={color} 
                            style={{ cursor: 'pointer' }}
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          {/* Transaction List */}
          {selectedCategory && (
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">
                  {selectedCategory} Transactions - 
                  <span className="text-lg ml-2 text-blue-700">
                    {formatCurrency(categoryTotals[selectedCategory] || 0)}
                  </span>
                </h3>
                <button 
                  onClick={() => setSelectedCategory(null)}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-sm"
                >
                  Close
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getCategoryTransactions().map((transaction, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{transaction['Transaction Date']}</td>
                        <td className="px-6 py-4 text-sm">
                          <div className="font-medium text-gray-900">{transaction.Description}</div>
                          {transaction.Memo && (
                            <div className="text-xs text-gray-500">{transaction.Memo}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                          {formatCurrency(Math.abs(transaction.Amount))}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {editingTransaction === index ? (
                            <select 
                              value={selectedNewCategory}
                              onChange={(e) => setSelectedNewCategory(e.target.value)}
                              className="p-1 border rounded w-full"
                            >
                              {availableCategories.map((cat, i) => (
                                <option key={i} value={cat}>{cat}</option>
                              ))}
                              <option value="">+ Add New Category</option>
                            </select>
                          ) : (
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              fixedCategories.includes(transaction.Category) 
                                ? 'bg-blue-100 text-blue-800' 
                                : transaction.Category === REVIEW_LATER_CATEGORY
                                ? 'bg-purple-100 text-purple-800'
                                : transaction.Category === FLAGGED_CATEGORY
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {transaction.Category || 'Uncategorized'}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {editingTransaction === index ? (
                            <div className="flex space-x-2 justify-end">
                              {selectedNewCategory === '' && (
                                <button
                                  onClick={() => setShowCategoryModal(true)}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  Create
                                </button>
                              )}
                              <button
                                onClick={() => updateTransactionCategory(index, selectedNewCategory)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingTransaction(null)}
                                className="text-gray-600 hover:text-gray-900"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex space-x-3 justify-end">
                              <button
                                onClick={() => setReviewingTransaction(index)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                View
                              </button>
                              <button
                                onClick={() => startEditing(index)}
                                className="text-green-600 hover:text-green-900"
                              >
                                Edit
                              </button>
                              {transaction.Category !== REVIEW_LATER_CATEGORY && (
                                <button
                                  onClick={() => moveToReviewLater(index)}
                                  className="text-purple-600 hover:text-purple-900"
                                >
                                  Review Later
                                </button>
                              )}
                              {transaction.Category !== FLAGGED_CATEGORY && (
                                <button
                                  onClick={() => flagTransaction(index)}
                                  className="text-orange-600 hover:text-orange-900"
                                >
                                  Flag
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Getting Started Guide / Instructions */}
      {!hasData && !loading && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Getting Started</h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              <b>Upload a CSV file</b> containing your bank transactions. The app currently supports 
              Chase bank CSV format (with Transaction Date, Description, Amount, etc. columns).
            </li>
            <li>
              <b>Set a date range</b> to analyze your spending over a specific period.
            </li>
            <li>
              <b>Review the dashboard</b> to see your spending patterns broken down by category.
            </li>
            <li>
              <b>Categorize transactions</b> by clicking on charts or using the transaction list.
            </li>
            <li>
              <b>Flag items for review</b> or move unclear transactions to "Review Later".
            </li>
          </ol>
          
          <div className="flex justify-center mt-6">
            <button
              onClick={loadDemoData}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200 flex items-center"
            >
              <span className="mr-2">👨‍💻</span> Load Demo Data
            </button>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-medium text-blue-800 mb-2">Privacy Note</h3>
            <p className="text-sm">
              This app processes all data locally in your browser. Your financial data is never sent to any server
              or stored outside of your current browser session. Refreshing the page will clear all data.
            </p>
          </div>
          
          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <h3 className="text-lg font-medium text-green-800 mb-2">Tips for Better Analysis</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Click on any category in the charts to view its transactions</li>
              <li>Use "Review Later" for transactions you need to investigate</li>
              <li>Create custom categories that match your spending habits</li>
              <li>Try analyzing different date ranges to see spending patterns</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpendingTracker;