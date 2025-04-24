import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { Transaction, CategoryTotal } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { ArrowDown, ArrowUp, DollarSign, BarChart4, TrendingUp, RefreshCw, CalendarClock, X, Calendar, Info } from 'lucide-react';

interface MonthlyComparisonDashboardProps {
  transactions: Transaction[];
  fixedCategories: string[];
  formatCurrency: (amount: number) => string;
}

interface RecurringTransaction {
  description: string;
  amount: number;
  category: string;
  occurrences: number;
  lastDate: string;
  averageAmount: number;
  transactions?: Transaction[]; // Store the actual transactions for details view
}

interface MonthlyData {
  month: string;
  fixedTotal: number;
  flexibleTotal: number;
  total: number;
  categories: {
    [key: string]: number;
  };
}

interface CategoryTrend {
  name: string;
  currentMonth: number;
  previousMonth: number;
  change: number;
  percentChange: number;
}

const COLORS = [
  '#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d', '#a4de6c', 
  '#d0ed57', '#ffc658', '#ff8042', '#ff6b6b', '#c44dff',
  '#647acb', '#a9a6ff', '#99d8e1', '#59b365', '#bbea62'
];

const MonthlyComparisonDashboard: React.FC<MonthlyComparisonDashboardProps> = ({
  transactions,
  fixedCategories,
  formatCurrency
}) => {
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [categoryTrends, setCategoryTrends] = useState<CategoryTrend[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<RecurringTransaction | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState<boolean>(false);
  const [showFixed, setShowFixed] = useState<boolean>(true);
  const [showFlexible, setShowFlexible] = useState<boolean>(true);
  const [selectedMonths, setSelectedMonths] = useState<number>(3); // Show last 3 months by default

  // Process transactions into monthly data
  useEffect(() => {
    if (!transactions.length) return;

    const monthData: { [key: string]: MonthlyData } = {};
    const today = new Date();
    
    // Initialize with recent months even if there's no data
    for (let i = 0; i < 6; i++) {
      const date = new Date(today);
      date.setMonth(today.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      
      monthData[monthKey] = {
        month: monthLabel,
        fixedTotal: 0,
        flexibleTotal: 0,
        total: 0,
        categories: {}
      };
    }
    
    // Process actual transaction data
    transactions.forEach(transaction => {
      if (!transaction['Transaction Date']) return;
      if (transaction.Amount >= 0) return; // Skip income

      const transactionDate = parseTransactionDate(transaction['Transaction Date']);
      if (!transactionDate) return;
      
      const monthKey = `${transactionDate.getFullYear()}-${String(transactionDate.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = transactionDate.toLocaleString('default', { month: 'short', year: 'numeric' });
      
      // Initialize month data if it doesn't exist
      if (!monthData[monthKey]) {
        monthData[monthKey] = {
          month: monthLabel,
          fixedTotal: 0,
          flexibleTotal: 0,
          total: 0,
          categories: {}
        };
      }
      
      const category = transaction.Category || 'Uncategorized';
      const amount = Math.abs(transaction.Amount);
      
      // Add to category totals for the month
      if (!monthData[monthKey].categories[category]) {
        monthData[monthKey].categories[category] = 0;
      }
      monthData[monthKey].categories[category] += amount;
      
      // Add to fixed/flexible/total
      if (fixedCategories.includes(category)) {
        monthData[monthKey].fixedTotal += amount;
      } else {
        monthData[monthKey].flexibleTotal += amount;
      }
      monthData[monthKey].total += amount;
    });
    
    // Convert to array and sort by month
    const sortedMonthlyData = Object.values(monthData)
      .sort((a, b) => {
        const dateA = new Date(a.month);
        const dateB = new Date(b.month);
        return dateB.getTime() - dateA.getTime();
      });
    
    setMonthlyData(sortedMonthlyData);
    
    // Calculate category trends
    if (sortedMonthlyData.length >= 2) {
      const currentMonth = sortedMonthlyData[0];
      const previousMonth = sortedMonthlyData[1];
      
      const trends: CategoryTrend[] = [];
      
      // Get all categories from both months
      const allCategories = new Set([
        ...Object.keys(currentMonth.categories),
        ...Object.keys(previousMonth.categories)
      ]);
      
      allCategories.forEach(category => {
        const currentAmount = currentMonth.categories[category] || 0;
        const previousAmount = previousMonth.categories[category] || 0;
        const change = currentAmount - previousAmount;
        const percentChange = previousAmount ? (change / previousAmount) * 100 : 100;
        
        trends.push({
          name: category,
          currentMonth: currentAmount,
          previousMonth: previousAmount,
          change,
          percentChange
        });
      });
      
      // Sort by absolute percent change
      trends.sort((a, b) => Math.abs(b.percentChange) - Math.abs(a.percentChange));
      
      setCategoryTrends(trends);
    }
  }, [transactions, fixedCategories]);

  // Detect recurring transactions (subscriptions)
  useEffect(() => {
    if (!transactions.length) return;

    // Group transactions by description
    const transactionsByDescription: { [key: string]: Transaction[] } = {};
    
    // Only consider transactions within the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    // Filter and group transactions
    transactions.forEach(transaction => {
      if (!transaction['Transaction Date'] || transaction.Amount >= 0) return;
      
      const date = parseTransactionDate(transaction['Transaction Date']);
      if (!date || date < sixMonthsAgo) return;
      
      // Lowercase and trim the description for better matching
      const normalizedDesc = transaction.Description.toLowerCase().trim();
      
      // Skip very short or numeric-only descriptions
      if (normalizedDesc.length < 3 || /^\d+$/.test(normalizedDesc)) return;
      
      if (!transactionsByDescription[normalizedDesc]) {
        transactionsByDescription[normalizedDesc] = [];
      }
      
      transactionsByDescription[normalizedDesc].push(transaction);
    });
    
    // Analyze each group for recurring patterns
    const recurringItems: RecurringTransaction[] = [];
    
    Object.entries(transactionsByDescription).forEach(([description, txns]) => {
      // Sort transactions by date (oldest first)
      txns.sort((a, b) => {
        const dateA = parseTransactionDate(a['Transaction Date']) || new Date(0);
        const dateB = parseTransactionDate(b['Transaction Date']) || new Date(0);
        return dateA.getTime() - dateB.getTime();
      });
      
      // We need at least 2 transactions to identify a pattern
      if (txns.length < 2) return;
      
      // Check if amounts are consistent (within 15% variance)
      const amounts = txns.map(t => Math.abs(t.Amount));
      const avgAmount = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
      
      // Check if all amounts are within 15% of the average
      const areAmountsConsistent = amounts.every(amount => 
        Math.abs(amount - avgAmount) / avgAmount < 0.15
      );
      
      if (!areAmountsConsistent && txns.length < 3) return;
      
      // If we have 3+ transactions with the same description, it's likely a subscription
      // If we have only 2, they need to be consistent in amount and roughly a month apart
      if (txns.length >= 3 || areAmountsConsistent) {
        const lastTransaction = txns[txns.length - 1];
        const category = lastTransaction.Category || 'Uncategorized';
        
        recurringItems.push({
          description: description,
          amount: avgAmount,
          category: category,
          occurrences: txns.length,
          lastDate: lastTransaction['Transaction Date'],
          averageAmount: avgAmount,
          transactions: txns // Store the original transactions for details view
        });
      }
    });
    
    // Sort by amount (highest first)
    recurringItems.sort((a, b) => b.amount - a.amount);
    
    setRecurringTransactions(recurringItems);
  }, [transactions]);

  // Helper function to parse date
  const parseTransactionDate = (dateStr: string) => {
    if (!dateStr) return null;
    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;
    return new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
  };

  // Get display data based on selected number of months
  const displayData = monthlyData.slice(0, selectedMonths);

  // Format number as percentage
  const formatPercent = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
          <BarChart4 className="h-6 w-6 mr-2 text-primary" />
          Monthly Spending Dashboard
        </h2>
        
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4 flex-1 min-w-[250px] border-l-4 border-primary">
            <h3 className="text-sm font-medium text-gray-500">Current Month Total</h3>
            <div className="flex items-baseline mt-1">
              <div className="text-2xl font-semibold text-gray-900">
                {monthlyData.length > 0 ? formatCurrency(monthlyData[0]?.total || 0) : formatCurrency(0)}
              </div>
              
              {monthlyData.length > 1 && (
                <div className={`ml-2 flex items-center text-sm ${
                  monthlyData[0].total > monthlyData[1].total 
                    ? 'text-red-600' 
                    : 'text-green-600'
                }`}>
                  {monthlyData[0].total > monthlyData[1].total ? (
                    <>
                      <ArrowUp className="h-4 w-4 mr-1" />
                      {formatPercent(((monthlyData[0].total - monthlyData[1].total) / monthlyData[1].total) * 100)}
                    </>
                  ) : (
                    <>
                      <ArrowDown className="h-4 w-4 mr-1" />
                      {formatPercent(((monthlyData[1].total - monthlyData[0].total) / monthlyData[1].total) * 100)}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 flex-1 min-w-[250px] border-l-4 border-blue-500">
            <h3 className="text-sm font-medium text-gray-500">Fixed Expenses</h3>
            <div className="flex items-baseline mt-1">
              <div className="text-2xl font-semibold text-gray-900">
                {monthlyData.length > 0 ? formatCurrency(monthlyData[0]?.fixedTotal || 0) : formatCurrency(0)}
              </div>
              
              {monthlyData.length > 1 && (
                <div className={`ml-2 flex items-center text-sm ${
                  monthlyData[0].fixedTotal > monthlyData[1].fixedTotal 
                    ? 'text-red-600' 
                    : 'text-green-600'
                }`}>
                  {monthlyData[0].fixedTotal > monthlyData[1].fixedTotal ? (
                    <>
                      <ArrowUp className="h-4 w-4 mr-1" />
                      {formatPercent(((monthlyData[0].fixedTotal - monthlyData[1].fixedTotal) / monthlyData[1].fixedTotal) * 100)}
                    </>
                  ) : (
                    <>
                      <ArrowDown className="h-4 w-4 mr-1" />
                      {formatPercent(((monthlyData[1].fixedTotal - monthlyData[0].fixedTotal) / monthlyData[1].fixedTotal) * 100)}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 flex-1 min-w-[250px] border-l-4 border-amber-500">
            <h3 className="text-sm font-medium text-gray-500">Flexible Expenses</h3>
            <div className="flex items-baseline mt-1">
              <div className="text-2xl font-semibold text-gray-900">
                {monthlyData.length > 0 ? formatCurrency(monthlyData[0]?.flexibleTotal || 0) : formatCurrency(0)}
              </div>
              
              {monthlyData.length > 1 && (
                <div className={`ml-2 flex items-center text-sm ${
                  monthlyData[0].flexibleTotal > monthlyData[1].flexibleTotal 
                    ? 'text-red-600' 
                    : 'text-green-600'
                }`}>
                  {monthlyData[0].flexibleTotal > monthlyData[1].flexibleTotal ? (
                    <>
                      <ArrowUp className="h-4 w-4 mr-1" />
                      {formatPercent(((monthlyData[0].flexibleTotal - monthlyData[1].flexibleTotal) / monthlyData[1].flexibleTotal) * 100)}
                    </>
                  ) : (
                    <>
                      <ArrowDown className="h-4 w-4 mr-1" />
                      {formatPercent(((monthlyData[1].flexibleTotal - monthlyData[0].flexibleTotal) / monthlyData[1].flexibleTotal) * 100)}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-primary" />
            Monthly Spending Trends
          </h3>
          
          <div className="flex gap-2">
            <select 
              className="p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={selectedMonths}
              onChange={(e) => setSelectedMonths(parseInt(e.target.value))}
            >
              <option value="3">Last 3 months</option>
              <option value="6">Last 6 months</option>
              <option value="12">Last 12 months</option>
            </select>
            
            <div className="flex items-center gap-2">
              <label className="flex items-center text-sm">
                <input 
                  type="checkbox" 
                  checked={showFixed} 
                  onChange={() => setShowFixed(!showFixed)} 
                  className="mr-1.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                Fixed
              </label>
              <label className="flex items-center text-sm">
                <input 
                  type="checkbox" 
                  checked={showFlexible} 
                  onChange={() => setShowFlexible(!showFlexible)} 
                  className="mr-1.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                Flexible
              </label>
            </div>
          </div>
        </div>

        <div className="bg-white p-2 rounded-lg h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={displayData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis 
                tickFormatter={(value) => formatCurrency(value).replace('$', '')}
              />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                labelFormatter={(label) => `Month: ${label}`}
              />
              <Legend />
              {showFixed && <Bar 
                dataKey="fixedTotal" 
                name="Fixed Expenses" 
                fill="#3c82f6" 
                stackId="a" 
              />}
              {showFlexible && <Bar 
                dataKey="flexibleTotal" 
                name="Flexible Expenses" 
                fill="#f59e0b" 
                stackId="a" 
              />}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Changes */}
      {categoryTrends.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Category Changes (vs. Previous Month)</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Biggest Increases */}
            <div className="bg-white shadow rounded-lg p-4">
              <h4 className="text-base font-medium text-gray-700 mb-3">Biggest Increases</h4>
              <div className="space-y-4">
                {categoryTrends
                  .filter(trend => trend.percentChange > 0)
                  .slice(0, 5)
                  .map((trend, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">{trend.name}</div>
                        <div className="text-sm text-gray-500">
                          {formatCurrency(trend.previousMonth)} → {formatCurrency(trend.currentMonth)}
                        </div>
                      </div>
                      <div className="text-red-600 flex items-center font-medium">
                        <ArrowUp className="h-4 w-4 mr-1" />
                        {formatPercent(trend.percentChange)}
                      </div>
                    </div>
                  ))}
                {categoryTrends.filter(trend => trend.percentChange > 0).length === 0 && (
                  <div className="text-gray-500 italic">No increases to show</div>
                )}
              </div>
            </div>
            
            {/* Biggest Decreases */}
            <div className="bg-white shadow rounded-lg p-4">
              <h4 className="text-base font-medium text-gray-700 mb-3">Biggest Decreases</h4>
              <div className="space-y-4">
                {categoryTrends
                  .filter(trend => trend.percentChange < 0)
                  .slice(0, 5)
                  .map((trend, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">{trend.name}</div>
                        <div className="text-sm text-gray-500">
                          {formatCurrency(trend.previousMonth)} → {formatCurrency(trend.currentMonth)}
                        </div>
                      </div>
                      <div className="text-green-600 flex items-center font-medium">
                        <ArrowDown className="h-4 w-4 mr-1" />
                        {formatPercent(trend.percentChange)}
                      </div>
                    </div>
                  ))}
                {categoryTrends.filter(trend => trend.percentChange < 0).length === 0 && (
                  <div className="text-gray-500 italic">No decreases to show</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Current Month Category Breakdown */}
      {monthlyData.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Current Month Breakdown</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-[300px] flex justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={Object.entries(monthlyData[0].categories)
                      .map(([name, value], index) => ({ name, value, color: COLORS[index % COLORS.length] }))
                      .filter(item => item.value > 0)
                      .sort((a, b) => b.value - a.value)
                    }
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {Object.entries(monthlyData[0].categories)
                      .map(([name, value], index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="bg-white shadow rounded-lg p-4 overflow-auto max-h-[300px]">
              <h4 className="text-base font-medium text-gray-700 sticky top-0 bg-white py-2">Category Details</h4>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-[44px]">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">% of Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(monthlyData[0].categories)
                    .sort(([, valueA], [, valueB]) => valueB - valueA)
                    .map(([category, amount], index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                          <div className="flex items-center">
                            <div 
                              className="h-3 w-3 rounded-full mr-2" 
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            ></div>
                            {category}
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">
                          {formatCurrency(amount)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">
                          {((amount / monthlyData[0].total) * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Recurring Subscriptions and Payments */}
      {recurringTransactions.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <RefreshCw className="h-5 w-5 mr-2 text-primary" />
            Recurring Monthly Payments
          </h3>
          
          <div className="bg-white shadow rounded-lg p-4">
            <div className="overflow-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service/Merchant</th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Monthly Amount</th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Last Payment</th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recurringTransactions.map((item, index) => (
                    <tr 
                      key={index} 
                      className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 cursor-pointer transition-colors`}
                      onClick={() => {
                        setSelectedTransaction(item);
                        setDetailsModalOpen(true);
                      }}
                    >
                      <td className="px-3 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                            <CalendarClock className="h-4 w-4 text-primary" />
                          </div>
                          <div className="font-medium text-gray-900">{item.description}</div>
                        </div>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                        {item.category}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 font-medium text-right">
                        {formatCurrency(item.amount)}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                        {item.lastDate}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-right">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {item.occurrences} payments detected
                        </span>
                        <span className="ml-2 text-xs text-primary hover:text-primary/80">
                          <Info className="h-3 w-3 inline" /> Click for details
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 text-sm text-gray-500">
              <p>
                <span className="font-medium">Total Monthly Subscriptions:</span> {formatCurrency(
                  recurringTransactions.reduce((sum, item) => sum + item.amount, 0)
                )}
              </p>
              <p className="text-xs mt-1 text-gray-400">
                * Recurring transactions are detected by analyzing patterns in your spending history
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Details Modal */}
      {detailsModalOpen && selectedTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold flex items-center">
                <CalendarClock className="h-5 w-5 mr-2 text-primary" />
                Recurring Payment Details
              </h3>
              <button 
                onClick={() => {
                  setDetailsModalOpen(false);
                  setSelectedTransaction(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-auto">
              <div className="mb-6">
                <h4 className="text-xl font-medium text-gray-900 mb-1">{selectedTransaction.description}</h4>
                <p className="text-sm text-gray-500">
                  Category: <span className="font-medium">{selectedTransaction.category}</span>
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <p className="text-xs text-gray-500 uppercase font-medium mb-1">Average Monthly Payment</p>
                    <p className="text-2xl font-semibold text-primary">{formatCurrency(selectedTransaction.averageAmount)}</p>
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <p className="text-xs text-gray-500 uppercase font-medium mb-1">Payment Frequency</p>
                    <p className="text-lg font-medium">
                      {selectedTransaction.occurrences} payments over{' '}
                      {selectedTransaction.transactions && selectedTransaction.transactions.length > 1 
                        ? Math.round((new Date(selectedTransaction.lastDate).getTime() - 
                          new Date(selectedTransaction.transactions[0]['Transaction Date']).getTime()) 
                          / (1000 * 60 * 60 * 24 * 30)) 
                        : 0} months
                    </p>
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <p className="text-xs text-gray-500 uppercase font-medium mb-1">Last Payment</p>
                    <p className="text-lg font-medium">{selectedTransaction.lastDate}</p>
                  </div>
                </div>
              </div>
              
              <h4 className="text-base font-medium text-gray-900 mb-3 flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-primary" />
                Payment History
              </h4>
              
              {selectedTransaction.transactions && (
                <div className="border rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedTransaction.transactions
                        .sort((a, b) => {
                          const dateA = parseTransactionDate(a['Transaction Date']) || new Date(0);
                          const dateB = parseTransactionDate(b['Transaction Date']) || new Date(0);
                          return dateB.getTime() - dateA.getTime(); // Sort by date, newest first
                        })
                        .map((tx, index) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                              {tx['Transaction Date']}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 font-medium text-right">
                              {formatCurrency(Math.abs(tx.Amount))}
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-500 truncate max-w-[300px]">
                              {tx.Description}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            <div className="p-4 bg-gray-50 border-t mt-auto">
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setDetailsModalOpen(false);
                    setSelectedTransaction(null);
                  }}
                  className="bg-white border border-gray-300 rounded-md py-2 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthlyComparisonDashboard;