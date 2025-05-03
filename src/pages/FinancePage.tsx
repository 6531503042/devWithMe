
import React, { useState } from 'react';
import AppNavbar from '@/components/layout/AppNavbar';
import AppFooter from '@/components/layout/AppFooter';
import PageContainer from '@/components/layout/PageContainer';
import TransactionForm from '@/components/finance/TransactionForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const FinancePage = () => {
  const [transactions, setTransactions] = useState([
    {
      id: '1',
      amount: 1200,
      type: 'income',
      category: 'salary',
      note: 'Monthly salary',
      date: new Date(2025, 4, 1)
    },
    {
      id: '2',
      amount: 45.99,
      type: 'expense',
      category: 'food',
      note: 'Grocery shopping',
      date: new Date(2025, 4, 3)
    },
    {
      id: '3',
      amount: 28.50,
      type: 'expense',
      category: 'transport',
      note: 'Uber ride',
      date: new Date(2025, 4, 5)
    },
    {
      id: '4',
      amount: 150,
      type: 'expense',
      category: 'utilities',
      note: 'Electricity bill',
      date: new Date(2025, 4, 10)
    },
    {
      id: '5',
      amount: 300,
      type: 'income',
      category: 'freelance',
      note: 'Website project',
      date: new Date(2025, 4, 15)
    }
  ]);

  const handleAddTransaction = (newTransaction: any) => {
    setTransactions([...transactions, newTransaction]);
  };

  // Calculate totals
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const balance = totalIncome - totalExpense;

  // Prepare data for charts
  const expenseByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc: any, t) => {
      if (!acc[t.category]) {
        acc[t.category] = 0;
      }
      acc[t.category] += t.amount;
      return acc;
    }, {});
    
  const pieChartData = Object.entries(expenseByCategory).map(([name, value]) => ({
    name,
    value
  }));

  const monthlyData = [
    { name: 'Jan', income: 1500, expense: 1200 },
    { name: 'Feb', income: 1800, expense: 1400 },
    { name: 'Mar', income: 1600, expense: 1300 },
    { name: 'Apr', income: 2000, expense: 1500 },
    { name: 'May', income: 1700, expense: 1600 },
  ];

  const COLORS = ['#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE', '#EDE9FE', '#F5F3FF'];
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US').format(new Date(date));
  };

  return (
    <div className="flex flex-col min-h-screen">
      <AppNavbar />
      
      <main className="flex-1">
        <PageContainer title="Finance Tracker">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-1">
              <TransactionForm onSubmit={handleAddTransaction} />
            </div>
            
            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm font-medium text-muted-foreground mb-1">Income</div>
                    <div className="text-2xl font-bold text-green-500">{formatCurrency(totalIncome)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm font-medium text-muted-foreground mb-1">Expenses</div>
                    <div className="text-2xl font-bold text-red-500">{formatCurrency(totalExpense)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm font-medium text-muted-foreground mb-1">Balance</div>
                    <div className={`text-2xl font-bold ${balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {formatCurrency(balance)}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {transactions.slice(0, 5).map((transaction) => (
                      <div key={transaction.id} className="flex justify-between items-center border-b pb-2 last:border-0 last:pb-0">
                        <div>
                          <div className="font-medium capitalize">{transaction.category}</div>
                          <div className="text-sm text-muted-foreground">{formatDate(transaction.date)}</div>
                          {transaction.note && <div className="text-xs text-muted-foreground mt-1">{transaction.note}</div>}
                        </div>
                        <div className={`font-medium ${transaction.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                          {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value) => [`${formatCurrency(value as number)}`, '']}
                      />
                      <Bar dataKey="income" name="Income" fill="#8B5CF6" />
                      <Bar dataKey="expense" name="Expense" fill="#EF4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Expense Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </PageContainer>
      </main>
      
      <AppFooter />
    </div>
  );
};

export default FinancePage;
