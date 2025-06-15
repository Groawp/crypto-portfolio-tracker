// File to update: src/components/AnalyticsDashboard.js

import React, { useState, useMemo } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { 
  LineChart, Line, XAxis, YAxis, ResponsiveContainer, BarChart, Bar, 
  PieChart, Pie, Cell, Tooltip
} from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, Percent, Target, Calendar, 
  Award, AlertTriangle, Activity, Shield, Zap, Clock, Calculator,
  PieChart as PieChartIcon, BarChart3, Users, Wallet, TrendingUpIcon
} from 'lucide-react';
import CryptoLogo from './CryptoLogo';

const AnalyticsDashboard = () => {
  const { assets, transactions, totalValue, totalPnL, totalPnLPercent } = usePortfolio();

  // Enhanced analytics with practical metrics
  const analytics = useMemo(() => {
    // Use all transactions since we removed time filtering
    const filteredTransactions = transactions;

    // Asset allocation with enhanced metrics
    const allocation = assets
      .filter(asset => asset.amount > 0)
      .map(asset => {
        const value = asset.amount * asset.price;
        const percentage = totalValue > 0 ? (value / totalValue) * 100 : 0;
        const invested = asset.amount * asset.avgBuy;
        const pnl = value - invested;
        const pnlPercent = invested > 0 ? (pnl / invested) * 100 : 0;
        
        // Calculate asset-specific metrics
        const assetTransactions = filteredTransactions.filter(tx => tx.assetId === asset.id);
        const totalBought = assetTransactions.filter(tx => tx.type === 'buy').reduce((sum, tx) => sum + tx.amount, 0);
        const totalSold = assetTransactions.filter(tx => tx.type === 'sell').reduce((sum, tx) => sum + tx.amount, 0);
        const netHolding = totalBought - totalSold;
        
        // Average holding period (simplified)
        const firstBuy = assetTransactions.filter(tx => tx.type === 'buy').sort((a, b) => new Date(a.date) - new Date(b.date))[0];
        const holdingPeriod = firstBuy ? Math.floor((Date.now() - new Date(firstBuy.date)) / (1000 * 60 * 60 * 24)) : 0;
        
        return {
          ...asset,
          value,
          percentage,
          invested,
          pnl,
          pnlPercent,
          holdingPeriod,
          netHolding,
          totalBought,
          totalSold
        };
      })
      .sort((a, b) => b.value - a.value);

    // Performance metrics
    const totalInvested = filteredTransactions
      .filter(tx => tx.type === 'buy')
      .reduce((sum, tx) => sum + tx.total, 0);
    
    const totalSold = filteredTransactions
      .filter(tx => tx.type === 'sell')
      .reduce((sum, tx) => sum + tx.total, 0);
    
    const totalFees = filteredTransactions.reduce((sum, tx) => sum + (tx.fee || 0), 0);
    const totalReturns = totalValue + totalSold - totalInvested;
    const returnPercent = totalInvested > 0 ? (totalReturns / totalInvested) * 100 : 0;

    // Trading performance analysis
    const profitableTrades = filteredTransactions.filter(tx => {
      if (tx.type !== 'sell') return false;
      const asset = assets.find(a => a.id === tx.assetId);
      return asset && tx.price > asset.avgBuy;
    }).length;
    
    const totalSells = filteredTransactions.filter(tx => tx.type === 'sell').length;
    const winRate = totalSells > 0 ? (profitableTrades / totalSells) * 100 : 0;

    // Average metrics
    const avgTransactionSize = filteredTransactions.length > 0 ? 
      filteredTransactions.reduce((sum, tx) => sum + tx.total, 0) / filteredTransactions.length : 0;
    
    const avgHoldingPeriod = allocation.length > 0 ?
      allocation.reduce((sum, asset) => sum + asset.holdingPeriod, 0) / allocation.length : 0;

    // Risk and diversification
    const concentrationRisk = allocation.length > 0 ? allocation[0].percentage : 0;
    const diversificationScore = Math.min(allocation.length * 15, 100);

    // DCA Analysis (simplified)
    const dcaAnalysis = allocation.map(asset => {
      const assetTxs = filteredTransactions.filter(tx => tx.assetId === asset.id && tx.type === 'buy');
      const avgBuyPrice = assetTxs.length > 0 ? 
        assetTxs.reduce((sum, tx) => sum + tx.price, 0) / assetTxs.length : 0;
      const currentPrice = asset.price;
      const dcaPerformance = avgBuyPrice > 0 ? ((currentPrice - avgBuyPrice) / avgBuyPrice) * 100 : 0;
      
      return {
        ...asset,
        avgBuyPrice,
        dcaPerformance,
        buyCount: assetTxs.length
      };
    });

    return {
      allocation,
      totalInvested,
      totalSold,
      totalFees,
      totalReturns,
      returnPercent,
      profitableTrades,
      totalSells,
      winRate,
      avgTransactionSize,
      avgHoldingPeriod,
      concentrationRisk,
      diversificationScore,
      dcaAnalysis,
      filteredTransactions
    };
  }, [assets, transactions, totalValue]);

  const MetricCard = ({ title, value, subtitle, icon: Icon, trend, color = 'blue', size = 'normal' }) => {
    const colorClasses = {
      blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      green: 'bg-green-500/10 text-green-400 border-green-500/20',
      red: 'bg-red-500/10 text-red-400 border-red-500/20',
      purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
    };

    const sizeClasses = size === 'large' ? 'p-6' : 'p-4';
    const titleSize = size === 'large' ? 'text-3xl' : 'text-2xl';

    return (
      <div className={`${sizeClasses} rounded-xl border ${colorClasses[color]} hover:bg-opacity-20 transition-all`}>
        <div className="flex items-center justify-between mb-2">
          <Icon className="w-5 h-5" />
          {trend !== undefined && (
            <span className={`text-xs flex items-center ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {trend >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
              {Math.abs(trend).toFixed(1)}%
            </span>
          )}
        </div>
        <div className={`${titleSize} font-bold text-white mb-1`}>{value}</div>
        <div className="text-sm text-gray-400">{subtitle}</div>
      </div>
    );
  };

  const formatCurrency = (value) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formatPercent = (value) => `${value.toFixed(2)}%`;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg">
          <p className="text-gray-300 text-sm font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' ? 
                (entry.name.includes('$') || entry.dataKey.includes('flow') || entry.dataKey.includes('profit') ? 
                  formatCurrency(entry.value) : entry.value.toFixed(2)
                ) : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white">Portfolio Analytics</h2>
        <p className="text-gray-400 text-sm mt-1">
          Comprehensive analysis of your trading performance and portfolio health
        </p>
      </div>

      {/* Key Performance Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <MetricCard
          title="Total Returns"
          value={formatCurrency(analytics.totalReturns)}
          subtitle="Profit/Loss"
          icon={analytics.totalReturns >= 0 ? TrendingUp : TrendingDown}
          trend={analytics.returnPercent}
          color={analytics.totalReturns >= 0 ? 'green' : 'red'}
        />
        <MetricCard
          title="Win Rate"
          value={`${analytics.winRate.toFixed(1)}%`}
          subtitle="Profitable Trades"
          icon={Target}
          color={analytics.winRate > 50 ? 'green' : analytics.winRate > 30 ? 'yellow' : 'red'}
        />
        <MetricCard
          title="Total Fees"
          value={formatCurrency(analytics.totalFees)}
          subtitle="Transaction Costs"
          icon={Calculator}
          color="orange"
        />
        <MetricCard
          title="Avg Holding"
          value={`${Math.floor(analytics.avgHoldingPeriod)}d`}
          subtitle="Days per Asset"
          icon={Clock}
          color="purple"
        />
        <MetricCard
          title="Portfolio Risk"
          value={analytics.concentrationRisk > 50 ? 'High' : analytics.concentrationRisk > 30 ? 'Medium' : 'Low'}
          subtitle="Concentration Risk"
          icon={Shield}
          color={analytics.concentrationRisk > 50 ? 'red' : analytics.concentrationRisk > 30 ? 'yellow' : 'green'}
        />
        <MetricCard
          title="Diversification"
          value={`${analytics.diversificationScore}/100`}
          subtitle="Portfolio Balance"
          icon={PieChartIcon}
          color="blue"
        />
      </div>

      {/* Asset Allocation Chart */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Asset Allocation</h3>
          
          {analytics.allocation.length > 0 ? (
            <div className="flex flex-col lg:flex-row lg:items-center gap-6">
              {/* Pie Chart - Hidden on mobile, shown on desktop */}
              <div className="hidden lg:block lg:w-1/2">
                <div className="relative">
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={analytics.allocation}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={120}
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
                              <div className="bg-gray-700 border border-gray-600 rounded-lg p-3 shadow-lg">
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
                  
                  {/* Center text */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">{analytics.allocation.length}</div>
                      <div className="text-sm text-gray-400">Assets</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Asset List */}
              <div className="lg:w-1/2 w-full">
                <div className="space-y-3">
                  {analytics.allocation.slice(0, 8).map((asset, index) => (
                    <div key={asset.id} className="group hover:bg-gray-700/50 rounded-lg p-3 transition-all duration-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <CryptoLogo symbol={asset.symbol} size={36} />
                            {/* Rank badge */}
                            <div className="absolute -top-1 -right-1 bg-gray-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                              {index + 1}
                            </div>
                          </div>
                          <div>
                            <div className="font-medium text-white">{asset.symbol}</div>
                            <div className="text-xs text-gray-400">{asset.name}</div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="flex items-center space-x-2">
                            <span className="text-white font-semibold">{asset.percentage.toFixed(1)}%</span>
                            <div className={`text-xs px-2 py-1 rounded ${
                              asset.pnl >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                            }`}>
                              {asset.pnl >= 0 ? '+' : ''}{formatPercent(asset.pnlPercent)}
                            </div>
                          </div>
                          <div className="text-sm text-gray-400 mt-1">
                            {formatCurrency(asset.value)}
                          </div>
                        </div>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="mt-3">
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${asset.percentage}%`,
                              backgroundColor: asset.color
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Show more button if there are more assets */}
                {analytics.allocation.length > 8 && (
                  <button className="w-full mt-4 py-2 text-blue-400 hover:text-blue-300 transition-colors text-sm">
                    View {analytics.allocation.length - 8} more assets
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Empty state */
            <div className="text-center py-12">
              <PieChartIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-300 mb-2">No Assets Found</h3>
              <p className="text-gray-400">Add some cryptocurrency holdings to see your asset allocation.</p>
            </div>
          )}
        </div>
      </div>

      {/* Trading Performance & Portfolio Insights */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Trading Performance */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Trading Performance</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-700/50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-400">{analytics.profitableTrades}</div>
                <div className="text-sm text-gray-400">Winning Trades</div>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-4">
                <div className="text-2xl font-bold text-red-400">{analytics.totalSells - analytics.profitableTrades}</div>
                <div className="text-sm text-gray-400">Losing Trades</div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Total Invested</span>
                <span className="text-white font-medium">{formatCurrency(analytics.totalInvested)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Withdrawn</span>
                <span className="text-white font-medium">{formatCurrency(analytics.totalSold)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Average Trade Size</span>
                <span className="text-white font-medium">{formatCurrency(analytics.avgTransactionSize)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-700">
                <span className="text-gray-400">Total Fees Paid</span>
                <span className="text-orange-400 font-medium">{formatCurrency(analytics.totalFees)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity & Market Insights */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Recent Activity & Insights</h3>
          
          <div className="space-y-6">
            {/* Recent Transactions */}
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-4 flex items-center">
                <Clock className="w-4 h-4 mr-2 text-blue-400" />
                Latest Transactions
              </h4>
              <div className="space-y-3">
                {analytics.filteredTransactions.slice(0, 3).map((tx) => {
                  const asset = analytics.allocation.find(a => a.id === tx.assetId);
                  const daysAgo = Math.floor((Date.now() - new Date(tx.date)) / (1000 * 60 * 60 * 24));
                  
                  return (
                    <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                          tx.type === 'buy' ? 'bg-green-600' : 'bg-red-600'
                        }`}>
                          {tx.type === 'buy' ? '↗' : '↙'}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-white text-sm">{tx.type.toUpperCase()}</span>
                            <CryptoLogo symbol={asset?.symbol || 'BTC'} size={16} />
                            <span className="text-gray-300 text-sm">{asset?.symbol}</span>
                          </div>
                          <div className="text-xs text-gray-400">
                            {daysAgo === 0 ? 'Today' : `${daysAgo}d ago`}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-medium text-sm">{formatCurrency(tx.total)}</div>
                      </div>
                    </div>
                  );
                })}
                
                {analytics.filteredTransactions.length === 0 && (
                  <div className="text-center py-4 text-gray-400">
                    <div className="text-sm">No recent transactions</div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Insights */}
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-4 flex items-center">
                <Activity className="w-4 h-4 mr-2 text-green-400" />
                Quick Insights
              </h4>
              
              <div className="space-y-3">
                <div className={`p-3 rounded-lg border ${
                  analytics.concentrationRisk > 70 ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-green-500/10 border-green-500/20'
                }`}>
                  <div className="flex items-center space-x-2 mb-1">
                    <Shield className={`w-4 h-4 ${analytics.concentrationRisk > 70 ? 'text-yellow-400' : 'text-green-400'}`} />
                    <span className="text-white font-medium text-sm">Portfolio Risk</span>
                  </div>
                  <p className={`text-xs ${analytics.concentrationRisk > 70 ? 'text-yellow-300' : 'text-green-300'}`}>
                    {analytics.concentrationRisk > 70 ? 
                      'Consider diversifying your holdings' :
                      'Good diversification balance'
                    }
                  </p>
                </div>

                <div className={`p-3 rounded-lg border ${
                  analytics.winRate > 50 ? 'bg-green-500/10 border-green-500/20' : 'bg-blue-500/10 border-blue-500/20'
                }`}>
                  <div className="flex items-center space-x-2 mb-1">
                    <Target className={`w-4 h-4 ${analytics.winRate > 50 ? 'text-green-400' : 'text-blue-400'}`} />
                    <span className="text-white font-medium text-sm">Trading Success</span>
                  </div>
                  <p className={`text-xs ${analytics.winRate > 50 ? 'text-green-300' : 'text-blue-300'}`}>
                    {analytics.winRate > 50 ? 
                      'Great trading performance!' :
                      analytics.totalSells > 0 ? 'Consider longer holding periods' : 'Start with small positions'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Asset Performance Table */}
      <div className="bg-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Detailed Asset Analysis</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-gray-400 text-sm border-b border-gray-700">
                <th className="text-left py-3">Asset</th>
                <th className="text-right py-3">Holdings</th>
                <th className="text-right py-3">Value</th>
                <th className="text-right py-3">Allocation</th>
                <th className="text-right py-3">Avg Buy</th>
                <th className="text-right py-3">Current</th>
                <th className="text-right py-3">P&L</th>
                <th className="text-right py-3">Return %</th>
                <th className="text-right py-3">Holding Period</th>
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
                  <td className="text-right py-4">
                    <span className="text-gray-300">{asset.holdingPeriod} days</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Portfolio Health</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400">Diversification</span>
                <span className="text-white font-medium">{analytics.diversificationScore}/100</span>
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
                <span className="text-gray-400">Concentration Risk</span>
                <span className={`text-sm font-medium ${
                  analytics.concentrationRisk > 70 ? 'text-red-400' : 
                  analytics.concentrationRisk > 40 ? 'text-orange-400' : 'text-green-400'
                }`}>
                  {analytics.concentrationRisk > 70 ? 'High' : 
                   analytics.concentrationRisk > 40 ? 'Medium' : 'Low'}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all ${
                    analytics.concentrationRisk > 70 ? 'bg-red-500' : 
                    analytics.concentrationRisk > 40 ? 'bg-orange-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(analytics.concentrationRisk, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Trading Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Total Transactions</span>
              <span className="text-white font-medium">{analytics.filteredTransactions.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Buy Orders</span>
              <span className="text-green-400 font-medium">
                {analytics.filteredTransactions.filter(tx => tx.type === 'buy').length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Sell Orders</span>
              <span className="text-red-400 font-medium">
                {analytics.filteredTransactions.filter(tx => tx.type === 'sell').length}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-700">
              <span className="text-gray-400">Success Rate</span>
              <span className={`font-medium ${analytics.winRate > 50 ? 'text-green-400' : 'text-red-400'}`}>
                {analytics.winRate.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Key Insights</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Best Performer</span>
              <div className="flex items-center space-x-2">
                <CryptoLogo 
                  symbol={analytics.allocation.reduce((best, asset) => 
                    asset.pnlPercent > best.pnlPercent ? asset : best, analytics.allocation[0] || {})?.symbol || 'BTC'} 
                  size={20} 
                />
                <span className="text-green-400 font-medium">
                  {analytics.allocation.reduce((best, asset) => 
                    asset.pnlPercent > best.pnlPercent ? asset : best, analytics.allocation[0] || {})?.symbol || 'N/A'}
                </span>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Worst Performer</span>
              <div className="flex items-center space-x-2">
                <CryptoLogo 
                  symbol={analytics.allocation.reduce((worst, asset) => 
                    asset.pnlPercent < worst.pnlPercent ? asset : worst, analytics.allocation[0] || {})?.symbol || 'BTC'} 
                  size={20} 
                />
                <span className="text-red-400 font-medium">
                  {analytics.allocation.reduce((worst, asset) => 
                    asset.pnlPercent < worst.pnlPercent ? asset : worst, analytics.allocation[0] || {})?.symbol || 'N/A'}
                </span>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Asset Count</span>
              <span className="text-white font-medium">{analytics.allocation.length}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-700">
              <span className="text-gray-400">Net Cash Flow</span>
              <span className={`font-medium ${analytics.totalInvested - analytics.totalSold >= 0 ? 'text-orange-400' : 'text-green-400'}`}>
                {formatCurrency(Math.abs(analytics.totalInvested - analytics.totalSold))} 
                {analytics.totalInvested - analytics.totalSold >= 0 ? ' invested' : ' withdrawn'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;