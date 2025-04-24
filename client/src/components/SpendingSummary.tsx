import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryTotal } from "@/lib/types";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SpendingSummaryProps {
  fixedTotal: number;
  flexibleTotal: number;
  formatCurrency: (amount: number) => string;
  categoryTotals: CategoryTotal;
  fixedCategories: string[];
}

const SpendingSummary = ({
  fixedTotal,
  flexibleTotal,
  formatCurrency,
  categoryTotals,
  fixedCategories,
}: SpendingSummaryProps) => {
  const totalSpending = fixedTotal + flexibleTotal;
  const fixedPercentage = totalSpending > 0 ? Math.round((fixedTotal / totalSpending) * 100) : 0;
  const flexiblePercentage = totalSpending > 0 ? Math.round((flexibleTotal / totalSpending) * 100) : 0;

  const COLORS = ['#3B82F6', '#10B981', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#a05195', '#d45087', '#f95d6a', '#ff7c43'];
  const TYPE_COLORS = ['#3B82F6', '#10B981'];

  // Data for the pie chart
  const spendingTypeData = [
    { name: 'Fixed', value: fixedTotal },
    { name: 'Flexible', value: flexibleTotal }
  ].filter(item => item.value > 0);

  // Data for the bar chart - convert categoryTotals object to array
  const categoryData = Object.entries(categoryTotals)
    .map(([name, value]) => ({ 
      name, 
      value,
      // Determine if this is a fixed or flexible category
      type: fixedCategories.includes(name) ? 'Fixed' : 'Flexible' 
    }))
    .sort((a, b) => b.value - a.value); // Sort by value descending

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-200 shadow-sm rounded-md text-sm">
          <p className="font-medium">{`${payload[0].name}: ${formatCurrency(payload[0].value)}`}</p>
          {totalSpending > 0 && (
            <p className="text-gray-500">{`${Math.round((payload[0].value / totalSpending) * 100)}% of total`}</p>
          )}
        </div>
      );
    }
    return null;
  };

  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-200 shadow-sm rounded-md text-sm">
          <p className="font-medium">{`${payload[0].payload.name}: ${formatCurrency(payload[0].value)}`}</p>
          {totalSpending > 0 && (
            <p className="text-gray-500">{`${Math.round((payload[0].value / totalSpending) * 100)}% of total`}</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      {/* Fixed vs Flexible Overview */}
      <Card>
        <CardHeader className="px-6 py-5 border-b border-gray-200">
          <CardTitle className="text-lg font-medium text-gray-800">Fixed vs. Flexible Spending</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-center gap-8">
            <div className="w-full md:w-48 h-48 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={spendingTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={0}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={1}
                    dataKey="value"
                    labelLine={false}
                  >
                    {spendingTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={TYPE_COLORS[index % TYPE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
                  <span className="font-medium">Fixed Spending</span>
                </div>
                <div className="mt-1">
                  <span className="text-xl font-mono font-medium">
                    {formatCurrency(fixedTotal)}
                  </span>
                  <span className="text-sm text-gray-500 ml-2">
                    {fixedPercentage}%
                  </span>
                </div>
              </div>
              
              <div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
                  <span className="font-medium">Flexible Spending</span>
                </div>
                <div className="mt-1">
                  <span className="text-xl font-mono font-medium">
                    {formatCurrency(flexibleTotal)}
                  </span>
                  <span className="text-sm text-gray-500 ml-2">
                    {flexiblePercentage}%
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-200">
                <div className="flex items-center">
                  <span className="font-medium">Total Spending</span>
                </div>
                <div className="mt-1">
                  <span className="text-xl font-mono font-medium">
                    {formatCurrency(totalSpending)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Spending by Category */}
      <Card>
        <CardHeader className="px-6 py-5 border-b border-gray-200">
          <CardTitle className="text-lg font-medium text-gray-800">Spending by Category</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={categoryData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(value) => `$${value}`} />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip content={<CustomBarTooltip />} />
                <Bar dataKey="value" fill="#8884d8">
                  {categoryData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.type === 'Fixed' ? '#3B82F6' : entry.name === 'Uncategorized' ? '#F59E0B' : '#10B981'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SpendingSummary;
