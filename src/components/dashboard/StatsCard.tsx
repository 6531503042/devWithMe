import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { cn } from '@/lib/utils';
import { cva } from 'class-variance-authority';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle2, 
  Award, 
  BarChart2, 
  Activity,
  Target
} from 'lucide-react';

// Define the different card variants
const cardVariants = cva("h-full transition-all duration-200", {
  variants: {
    variant: {
      default: "bg-card",
      purple: "bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/10 border-purple-200 dark:border-purple-900/50",
      blue: "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/10 border-blue-200 dark:border-blue-900/50",
      green: "bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/10 border-green-200 dark:border-green-900/50",
      amber: "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/10 border-amber-200 dark:border-amber-900/50",
    }
  },
  defaultVariants: {
    variant: "default"
  }
});

// Define the icon background variants
const iconVariants = cva("h-12 w-12 rounded-full flex items-center justify-center", {
  variants: {
    variant: {
      default: "bg-primary/10 text-primary",
      purple: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
      blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
      green: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
      amber: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
    }
  },
  defaultVariants: {
    variant: "default"
  }
});

// Define chart colors based on variant
const chartColors = {
  default: "hsl(var(--primary))",
  purple: "#9333ea",
  blue: "#2563eb",
  green: "#16a34a",
  amber: "#d97706"
};

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  data?: { name: string; value: number }[];
  chartType?: 'bar' | 'line' | 'area' | 'none';
  icon?: React.ReactNode;
  variant?: "default" | "purple" | "blue" | "green" | "amber";
  change?: number | null;
  changeTimeframe?: string;
}

const StatsCard = ({ 
  title, 
  value, 
  description, 
  data = [],
  chartType = 'none',
  icon,
  variant = "default",
  change = null,
  changeTimeframe = "vs. last week" 
}: StatsCardProps) => {
  // Determine default icon based on title if not provided
  const getDefaultIcon = () => {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('time') || titleLower.includes('pomodoro')) return <Clock />;
    if (titleLower.includes('task') && titleLower.includes('completed')) return <CheckCircle2 />;
    if (titleLower.includes('streak')) return <Award />;
    if (titleLower.includes('rate') || titleLower.includes('success')) return <Target />;
    if (titleLower.includes('trend') || titleLower.includes('progress')) return <Activity />;
    return <BarChart2 />;
  };

  const displayIcon = icon || getDefaultIcon();
  const chartColor = chartColors[variant];

  return (
    <Card className={cn(cardVariants({ variant }))}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <CardTitle className="text-base font-medium text-muted-foreground">{title}</CardTitle>
            <div className="text-3xl font-bold">{value}</div>
            
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
        
            {change !== null && (
              <div className={cn(
                "flex items-center text-sm",
                change >= 0 ? "text-green-600" : "text-red-600"
              )}>
                {change >= 0 ? (
                  <TrendingUp className="mr-1 h-4 w-4" />
                ) : (
                  <TrendingDown className="mr-1 h-4 w-4" />
                )}
                <span>{change >= 0 ? "+" : ""}{change}% {changeTimeframe}</span>
              </div>
            )}
          </div>
          
          <div className={cn(iconVariants({ variant }))}>
            {displayIcon}
          </div>
        </div>
        
        {chartType !== 'none' && data.length > 0 && (
          <div className="h-24 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'bar' && (
                <BarChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                />
                  <Tooltip 
                    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                    contentStyle={{ 
                      borderRadius: '6px', 
                      border: '1px solid var(--border)', 
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                    }}
                  />
                  <Bar 
                    dataKey="value" 
                    fill={chartColor} 
                    radius={[4, 4, 0, 0]} 
                    animationDuration={1000}
                  />
              </BarChart>
              )}
              
              {chartType === 'line' && (
                <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                  />
                  <Tooltip 
                    cursor={{ stroke: 'rgba(0,0,0,0.1)', strokeDasharray: '4 4' }}
                    contentStyle={{ 
                      borderRadius: '6px', 
                      border: '1px solid var(--border)', 
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke={chartColor} 
                    strokeWidth={2} 
                    dot={{ r: 3, fill: chartColor, strokeWidth: 1 }}
                    activeDot={{ r: 5, strokeWidth: 0 }}
                    animationDuration={1000}
                  />
                </LineChart>
              )}
              
              {chartType === 'area' && (
                <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '6px', 
                      border: '1px solid var(--border)', 
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                    }}
                  />
                  <defs>
                    <linearGradient id={`color-${variant}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColor} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={chartColor} stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke={chartColor} 
                    strokeWidth={2}
                    fill={`url(#color-${variant})`}
                    animationDuration={1000}
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatsCard;
