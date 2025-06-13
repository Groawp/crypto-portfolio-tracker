import React, { useState, useMemo } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Percent, Target, Calendar, Award, AlertTriangle } from 'lucide-react';
import CryptoLogo from './CryptoLogo';

const AnalyticsDashboard = () => {
  const { assets, transactions, totalValue, totalPnL, totalPnLPercent } = usePortfolio();

  // Calculate analytics data
  const analytics = useMemo(() => {
    // Asset allocation
    const allocation = assets
      .filter(asset => asset.amount > 0)
      .map(asset => {
        const value = asset.amount * asset.price;
        const percentage = totalValue > 0 ? (value / totalValue) * 100 : 0;
        return {
          ...asset,
          value,
          percentage,
          pnl: (asset.amount * asset.price) - (asset.amount * asset.avgBuy),
          pnlPercent: asset.avgBuy > 0 ? (((asset.amount * asset.price) - (asset.amount * asset.avgBuy)) / (asset.amount * asset.avgBuy)) * 100 : 0
        };
      })
      .sort((a, b) => b.value - a.value);

    // Transaction analysis
    const transactionsByMonth = transactions.reduce((acc, tx) => {
      const month = new Date(tx.date).toISOString().slice(0, 7);
      if (!acc[month]) acc[month] = { buy: 0, sell: 0, count: 0 };
      acc[month][tx.type] += tx.total;
      acc[month].count += 1;
      return acc;
    }, {});

    const monthlyData = Object.entries(transactionsByMonth)
      .map(([month, data]) => ({
        month,
        buy: data.buy,
        sell: data.sell,
        net: data.buy - data.sell,
        transactions: data.count
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12); // Last 12 months

    // Performance metrics
    const totalInvested = transactions
      .filter(tx => tx.type === 'buy')
      .reduce((sum, tx) => sum + tx.total, 0);
    
    const totalReturns = totalValue - totalInvested;
    const returnPercent = totalInvested > 0 ? (totalReturns / totalInvested) * 100 : 0;

    // Risk metrics
    const diversificationScore = allocation.length > 0 ? Math.min(allocation.length * 10, 100) : 0;
    const concentrationRisk = allocation.length > 0 ? allocation[0].percentage : 0;

    return {
      allocation,
      monthlyData,
      totalInvested,
      totalReturns,
      returnPercent,
      diversificationScore,
      concentrationRisk
    };
  }, [assets, transactions, totalValue]);

  const MetricCard = ({ title, value, subtitle, icon: Icon, trend, color = 'blue' }) => {
    const colorClasses = {
      blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      green: 'bg-green-500/10 text-green-400 border-green-500/20',
      red: 'bg-red-500/10 text-red-400 border-red-500/20',
      purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20'
    };

    return (
      <div className={`p-4 rounded-xl border ${colorClasses[color]}`}>
        <div className="flex items-center justify-between mb-2">
          <Icon className="w-5 h-5" />
          {trend !== undefined && (
            <span className={`text-xs flex items-center ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {trend >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
              {Math.abs(trend).toFixed(1)}%
            </span>
          )}
        </div>
        <div className="text-2xl font-bold text-white mb-1">{value}</div>
        <div className="text-sm text-gray-400">{subtitle}</div>
      </div>
    );
  };

  const formatCurrency = (value) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-white">Portfolio Analytics</h2>
          <p className="text-gray-400 text-sm mt-1">
            Comprehensive analysis of your crypto portfolio performance
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Total Value"
          value={formatCurrency(totalValue)}
          subtitle="Portfolio Worth"
          icon={DollarSign}
          color="blue"
        />
        <MetricCard
          title="Total Returns"
          value={formatCurrency(analytics.totalReturns)}
          subtitle="Profit/Loss"
          icon={analytics.totalReturns >= 0 ? TrendingUp : TrendingDown}
          trend={analytics.returnPercent}
          color={analytics.totalReturns >= 0 ? 'green' : 'red'}
        />
        <MetricCard
          title="Total Invested"
          value={formatCurrency(analytics.totalInvested)}
          subtitle="Capital Deployed"
          icon={Target}
          color="purple"
        />
        <MetricCard
          title="Diversification"
          value={`${analytics.diversificationScore}/100`}
          subtitle="Risk Score"
          icon={Award}
          color="orange"
        />
        <MetricCard
          title="Top Holding"
          value={`${analytics.concentrationRisk.toFixed(1)}%`}
          subtitle="Concentration Risk"
          icon={AlertTriangle}
          color={analytics.concentrationRisk > 50 ? 'red' : 'green'}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Activity Chart */}
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Monthly Activity</h3>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span className="text-gray-400">Buys</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span className="text-gray-400">Sells</span>
              </div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.monthlyData}>
                <XAxis 
                  dataKey="month" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151', 
                    borderRadius: '8px' 
                  }}
                />
                <Bar dataKey="buy" fill="#10b981" />
                <Bar dataKey="sell" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Asset Allocation Pie Chart */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Asset Allocation</h3>
          <div className="h-64 flex items-center">
            <div className="w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.allocation}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="percentage"
                  >
                    {analytics.allocation.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg">
                            <p className="text-white font-medium">{data.symbol}</p>
                            <p className="text-gray-300">{data.percentage.toFixed(2)}%</p>
                            <p className="text-gray-300">{formatCurrency(data.value)}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 space-y-2">
              {analytics.allocation.slice(0, 6).map((asset, index) => (
                <div key={asset.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <CryptoLogo symbol={asset.symbol} size={20} />
                    <span className="text-white">{asset.symbol}</span>
                  </div>
                  <span className="text-gray-400">{asset.percentage.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top Performers Table */}
      <div className="bg-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Asset Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-gray-400 text-sm border-b border-gray-700">
                <th className="text-left py-3">Asset</th>
                <th className="text-right py-3">Holdings</th>
                <th className="text-right py-3">Value</th>
                <th className="text-right py-3">Allocation</th>
                <th className="text-right py-3">Avg Buy</th>
                <th className="text-right py-3">Current Price</th>
                <th className="text-right py-3">P&L</th>
                <th className="text-right py-3">Return %</th>
              </tr>
            </thead>
            <tbody>
              {analytics.allocation.filter(asset => asset.amount > 0).map((asset) => (
                <tr key={asset.id} className="border-b border-gray-700 hover:bg-gray-700 transition-colors">
                  <td className="py-4">
                    <div className="flex items-center space-x-3">
                      <CryptoLogo symbol={asset.symbol} size={32} />
                      <div>
                        <div className="font-medium text-white">{asset.name}</div>
                        <div className="text-gray-400 text-sm">{asset.symbol}</div>
                      </div>
                    </div>
                  </td>
                  <td className="text-right py-4">
                    <span className="font-mono text-sm text-gray-300">
                      {asset.amount.toFixed(6).replace(/\.?0+$/, '')}
                    </span>
                  </td>
                  <td className="text-right py-4">
                    <span className="font-medium text-white">{formatCurrency(asset.value)}</span>
                  </td>
                  <td className="text-right py-4">
                    <span className="text-gray-300">{asset.percentage.toFixed(2)}%</span>
                  </td>
                  <td className="text-right py-4">
                    <span className="font-mono text-sm text-gray-300">{formatCurrency(asset.avgBuy)}</span>
                  </td>
                  <td className="text-right py-4">
                    <span className="font-mono text-sm text-gray-300">{formatCurrency(asset.price)}</span>
                  </td>
                  <td className="text-right py-4">
                    <span className={`font-medium ${asset.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {asset.pnl >= 0 ? '+' : ''}{formatCurrency(asset.pnl)}
                    </span>
                  </td>
                  <td className="text-right py-4">
                    <span className={`font-medium flex items-center justify-end ${asset.pnlPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {asset.pnlPercent >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                      {Math.abs(asset.pnlPercent).toFixed(2)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Risk Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Portfolio Health</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400">Diversification</span>
                <span className="text-white">{analytics.diversificationScore}/100</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${analytics.diversificationScore}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400">Risk Level</span>
                <span className={`text-sm ${analytics.concentrationRisk > 70 ? 'text-red-400' : analytics.concentrationRisk > 40 ? 'text-orange-400' : 'text-green-400'}`}>
                  {analytics.concentrationRisk > 70 ? 'High' : analytics.concentrationRisk > 40 ? 'Medium' : 'Low'}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all ${analytics.concentrationRisk > 70 ? 'bg-red-500' : analytics.concentrationRisk > 40 ? 'bg-orange-500' : 'bg-green-500'}`}
                  style={{ width: `${Math.min(analytics.concentrationRisk, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Transaction Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Total Transactions</span>
              <span className="text-white">{transactions.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Buy Orders</span>
              <span className="text-green-400">{transactions.filter(tx => tx.type === 'buy').length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Sell Orders</span>
              <span className="text-red-400">{transactions.filter(tx => tx.type === 'sell').length}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-700">
              <span className="text-gray-400">Avg Transaction</span>
              <span className="text-white">
                {formatCurrency(transactions.length > 0 ? transactions.reduce((sum, tx) => sum + tx.total, 0) / transactions.length : 0)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Performance</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Return on Investment</span>
              <span className={`${analytics.returnPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {analytics.returnPercent >= 0 ? '+' : ''}{analytics.returnPercent.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Best Performer</span>
              <span className="text-green-400">
                {analytics.allocation.length > 0 ? analytics.allocation
                  .sort((a, b) => b.pnlPercent - a.pnlPercent)[0]?.symbol || 'N/A' : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Worst Performer</span>
              <span className="text-red-400">
                {analytics.allocation.length > 0 ? analytics.allocation
                  .sort((a, b) => a.pnlPercent - b.pnlPercent)[0]?.symbol || 'N/A' : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-700">
              <span className="text-gray-400">Portfolio Beta</span>
              <span className="text-white">0.85</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;