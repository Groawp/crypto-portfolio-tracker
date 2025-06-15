import React, { useState, useMemo, useEffect } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { 
  Plus, Search, Filter, Grid, List, TrendingUp, TrendingDown, Eye, EyeOff, 
  ArrowUpDown, Info, Wallet, PieChart, Edit2, MoreVertical, RefreshCw,
  BarChart3, Activity, Shield, Star, Bell, Download
} from 'lucide-react';
import CryptoLogo from './CryptoLogo';
import AddAssetModal from './AddAssetModal';
import EditAssetModal from './EditAssetModal';
import AddTransactionModal from './AddTransactionModal';

const AssetManagement = () => {
  const { 
    assets, 
    totalValue, 
    totalPnL, 
    totalPnLPercent,
    loading,
    updatePrices,
    addAsset,
    removeAsset,
    updateAsset,
    addTransaction
  } = usePortfolio();

  const [showAddAssetModal, setShowAddAssetModal] = useState(false);
  const [showEditAssetModal, setShowEditAssetModal] = useState(false);
  const [showAddTransactionModal, setShowAddTransactionModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('value');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewType, setViewType] = useState('list');
  const [showBalances, setShowBalances] = useState(true);
  const [filterZeroBalance, setFilterZeroBalance] = useState(true);
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date());

  // Auto-refresh timer
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdateTime(new Date());
    }, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  // Calculate portfolio metrics
  const portfolioMetrics = useMemo(() => {
    const activeAssets = assets.filter(a => a.amount > 0);
    const profitableAssets = activeAssets.filter(a => {
      const pnl = (a.amount * a.price) - (a.amount * a.avgBuy);
      return pnl > 0;
    }).length;
    
    const bestPerformer = activeAssets.reduce((best, asset) => {
      const currentPnl = ((asset.price - asset.avgBuy) / asset.avgBuy) * 100;
      const bestPnl = best ? ((best.price - best.avgBuy) / best.avgBuy) * 100 : -Infinity;
      return currentPnl > bestPnl ? asset : best;
    }, null);

    const worstPerformer = activeAssets.reduce((worst, asset) => {
      const currentPnl = ((asset.price - asset.avgBuy) / asset.avgBuy) * 100;
      const worstPnl = worst ? ((worst.price - worst.avgBuy) / worst.avgBuy) * 100 : Infinity;
      return currentPnl < worstPnl ? asset : worst;
    }, null);

    const totalInvested = activeAssets.reduce((sum, asset) => 
      sum + (asset.amount * asset.avgBuy), 0
    );

    return {
      profitableAssets,
      totalAssets: activeAssets.length,
      bestPerformer,
      worstPerformer,
      totalInvested,
      averageROI: totalInvested > 0 ? ((totalValue - totalInvested) / totalInvested) * 100 : 0
    };
  }, [assets, totalValue]);

  // Filter and sort assets
  const processedAssets = useMemo(() => {
    let filtered = assets;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(asset =>
        asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.symbol.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter zero balances
    if (filterZeroBalance) {
      filtered = filtered.filter(asset => asset.amount > 0);
    }

    // Sort assets
    const sorted = [...filtered].sort((a, b) => {
      let aVal, bVal;
      
      switch (sortBy) {
        case 'value':
          aVal = a.amount * a.price;
          bVal = b.amount * b.price;
          break;
        case 'name':
          aVal = a.name;
          bVal = b.name;
          break;
        case 'change':
          aVal = a.change24h || 0;
          bVal = b.change24h || 0;
          break;
        case 'pnl':
          aVal = (a.amount * a.price) - (a.amount * a.avgBuy);
          bVal = (b.amount * b.price) - (b.amount * b.avgBuy);
          break;
        default:
          aVal = a.amount * a.price;
          bVal = b.amount * b.price;
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return sorted;
  }, [assets, searchTerm, sortBy, sortOrder, filterZeroBalance]);

  const formatCurrency = (value, decimals = 2) => {
    if (!showBalances) return '$****';
    return `$${value.toLocaleString(undefined, { 
      minimumFractionDigits: decimals, 
      maximumFractionDigits: decimals 
    })}`;
  };

  const formatValue = (value, maxDecimals = 8) => {
    if (!showBalances) return '****';
    
    const num = parseFloat(value);
    if (num === 0) return '0';
    
    if (num > 0 && num < 0.00001) {
      let str = num.toString();
      if (str.includes('e')) {
        str = num.toFixed(20);
      }
      str = str.replace(/0+$/, '');
      const parts = str.split('.');
      if (parts[1] && parts[1].length > 10) {
        const firstNonZero = parts[1].search(/[1-9]/);
        parts[1] = parts[1].substring(0, firstNonZero + 4);
        str = parts.join('.');
      }
      return str;
    }
    
    let formatted = num.toFixed(maxDecimals);
    formatted = formatted.replace(/(\.\d*?[1-9])0+$/, '$1');
    formatted = formatted.replace(/\.0+$/, '');
    
    return formatted;
  };

  const calculatePnL = (asset) => {
    const currentValue = asset.amount * asset.price;
    const avgBuyValue = asset.amount * asset.avgBuy;
    return currentValue - avgBuyValue;
  };

  const calculatePnLPercent = (asset) => {
    const pnl = calculatePnL(asset);
    const avgBuyValue = asset.amount * asset.avgBuy;
    return avgBuyValue > 0 ? (pnl / avgBuyValue) * 100 : 0;
  };

  const handleEditAsset = (asset) => {
    setSelectedAsset(asset);
    setShowEditAssetModal(true);
  };

  const handleAddTransaction = (asset) => {
    setSelectedAsset(asset);
    setShowAddTransactionModal(true);
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const AssetCard = ({ asset }) => {
    const value = asset.amount * asset.price;
    const pnl = calculatePnL(asset);
    const pnlPercent = calculatePnLPercent(asset);
    const allocation = totalValue > 0 ? (value / totalValue) * 100 : 0;

    return (
      <div className="group relative bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 hover:border-gray-600 transition-all duration-300 hover:shadow-xl hover:shadow-black/20 hover:-translate-y-1">
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {/* Content */}
        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <CryptoLogo symbol={asset.symbol} size={48} />
                <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${asset.change24h >= 0 ? 'bg-green-500' : 'bg-red-500'} ring-2 ring-gray-800`}></div>
              </div>
              <div>
                <h3 className="font-semibold text-white text-lg">{asset.name}</h3>
                <div className="flex items-center space-x-2">
                  <p className="text-gray-400 text-sm">{asset.symbol}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700/50 text-gray-300">
                    Rank #{Math.floor(Math.random() * 100) + 1}
                  </span>
                </div>
              </div>
            </div>
            <button className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-gray-700/50 rounded-lg">
              <MoreVertical className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Value Section */}
          <div className="mb-6 p-4 bg-gray-900/50 rounded-xl">
            <div className="flex items-baseline justify-between mb-2">
              <p className="text-gray-400 text-sm">Portfolio Value</p>
              <div className={`text-xs px-2 py-1 rounded-full flex items-center space-x-1 ${pnl >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                {pnl >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span>{pnl >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%</span>
              </div>
            </div>
            <p className="text-3xl font-bold text-white mb-2">{formatCurrency(value)}</p>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">{allocation.toFixed(2)}% of portfolio</p>
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-1 h-3 rounded-full ${
                      i < Math.ceil(allocation / 20) ? 'bg-blue-500' : 'bg-gray-700'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="p-3 bg-gray-900/30 rounded-lg">
              <p className="text-gray-500 text-xs mb-1">Holdings</p>
              <p className="font-mono text-sm text-white">{formatValue(asset.amount, 8)}</p>
            </div>
            <div className="p-3 bg-gray-900/30 rounded-lg">
              <p className="text-gray-500 text-xs mb-1">Current Price</p>
              <p className="font-mono text-sm text-white">{formatCurrency(asset.price)}</p>
            </div>
            <div className="p-3 bg-gray-900/30 rounded-lg">
              <p className="text-gray-500 text-xs mb-1">Avg Buy Price</p>
              <p className="font-mono text-sm text-white">{formatCurrency(asset.avgBuy)}</p>
            </div>
            <div className="p-3 bg-gray-900/30 rounded-lg">
              <p className="text-gray-500 text-xs mb-1">24h Change</p>
              <p className={`font-mono text-sm flex items-center ${asset.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {asset.change24h >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                {Math.abs(asset.change24h || 0).toFixed(2)}%
              </p>
            </div>
          </div>

          {/* P&L Bar */}
          <div className={`relative p-4 rounded-xl overflow-hidden ${pnl >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
            <div className={`absolute inset-0 ${pnl >= 0 ? 'bg-gradient-to-r from-green-500/20 to-transparent' : 'bg-gradient-to-r from-red-500/20 to-transparent'}`}></div>
            <div className="relative flex justify-between items-center">
              <span className="text-gray-400 text-sm font-medium">Profit/Loss</span>
              <div className="text-right">
                <p className={`font-bold text-lg ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {pnl >= 0 ? '+' : ''}{formatCurrency(pnl)}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 mt-6">
            <button
              onClick={() => handleAddTransaction(asset)}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600/10 text-blue-400 rounded-xl hover:bg-blue-600/20 transition-all duration-200 border border-blue-600/20"
            >
              <Plus className="w-4 h-4" />
              <span className="font-medium">Transaction</span>
            </button>
            <button
              onClick={() => handleEditAsset(asset)}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-gray-700/30 text-gray-300 rounded-xl hover:bg-gray-700/50 transition-all duration-200 border border-gray-700"
            >
              <Edit2 className="w-4 h-4" />
              <span className="font-medium">Edit</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const AssetListItem = ({ asset }) => {
    const value = asset.amount * asset.price;
    const pnl = calculatePnL(asset);
    const pnlPercent = calculatePnLPercent(asset);
    const allocation = totalValue > 0 ? (value / totalValue) * 100 : 0;

    return (
      <div className="group bg-gray-800/30 backdrop-blur-sm rounded-xl p-5 hover:bg-gray-800/50 transition-all duration-200 border border-gray-700/50 hover:border-gray-600/50 hover:shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <div className="relative">
              <CryptoLogo symbol={asset.symbol} size={44} />
              <div className={`absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full ${asset.change24h >= 0 ? 'bg-green-500' : 'bg-red-500'} ring-2 ring-gray-800`}></div>
            </div>
            
            <div className="flex-1 grid grid-cols-6 gap-4 items-center">
              <div>
                <p className="font-medium text-white text-base">{asset.name}</p>
                <p className="text-sm text-gray-400">{asset.symbol}</p>
              </div>
              
              <div className="text-right">
                <p className="font-mono text-sm text-white">{formatValue(asset.amount, 8)}</p>
                <p className="text-xs text-gray-500">Holdings</p>
              </div>
              
              <div className="text-right">
                <p className="font-mono text-sm text-white">{formatCurrency(asset.price)}</p>
                <p className="text-xs text-gray-500">Price</p>
              </div>
              
              <div className="text-right">
                <p className="font-semibold text-white text-base">{formatCurrency(value)}</p>
                <div className="flex items-center justify-end space-x-2 mt-1">
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-1 h-2 rounded-full ${
                          i < Math.ceil(allocation / 20) ? 'bg-blue-500' : 'bg-gray-700'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">{allocation.toFixed(1)}%</p>
                </div>
              </div>
              
              <div className="text-right">
                <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-lg text-sm ${
                  asset.change24h >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                }`}>
                  {asset.change24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  <span className="font-medium">{Math.abs(asset.change24h || 0).toFixed(2)}%</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">24h</p>
              </div>
              
              <div className="text-right">
                <p className={`font-bold text-base ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {pnl >= 0 ? '+' : ''}{formatCurrency(pnl)}
                </p>
                <p className={`text-xs font-medium ${pnl >= 0 ? 'text-green-400/80' : 'text-red-400/80'}`}>
                  {pnl >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => handleAddTransaction(asset)}
              className="p-2.5 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-all duration-200"
              title="Add Transaction"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleEditAsset(asset)}
              className="p-2.5 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all duration-200"
              title="Edit Asset"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Section with Gradient Background */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-pink-600/10 p-8 border border-gray-700/50">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-purple-600/5"></div>
        
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-6 lg:space-y-0">
            <div>
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-3 bg-blue-600/20 rounded-xl">
                  <Wallet className="w-6 h-6 text-blue-400" />
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  Portfolio Overview
                </h1>
              </div>
              <p className="text-gray-400 text-lg">
                Track and manage your cryptocurrency investments
              </p>
              <div className="flex items-center space-x-4 mt-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-sm text-gray-400">Live prices</span>
                </div>
                <span className="text-gray-600">•</span>
                <span className="text-sm text-gray-400">
                  Last updated {getTimeAgo(lastUpdateTime)}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowBalances(!showBalances)}
                className="p-3 text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-700/50 rounded-xl transition-all duration-200 backdrop-blur-sm"
                title={showBalances ? "Hide Balances" : "Show Balances"}
              >
                {showBalances ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </button>
              <button
                onClick={updatePrices}
                disabled={loading}
                className="px-6 py-3 bg-gray-800/50 backdrop-blur-sm text-white rounded-xl hover:bg-gray-700/50 transition-all duration-200 disabled:opacity-50 border border-gray-700/50 flex items-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              <button
                onClick={() => setShowAddAssetModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-600/25 transition-all duration-200 flex items-center space-x-2 font-medium"
              >
                <Plus className="w-5 h-5" />
                <span>Add Asset</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards with Enhanced Design */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Value Card */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl blur-xl opacity-25 group-hover:opacity-40 transition-opacity"></div>
          <div className="relative bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 hover:border-gray-600 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-600/20 rounded-xl">
                <Wallet className="w-6 h-6 text-blue-400" />
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-blue-600/10 text-blue-400 font-medium">
                Portfolio
              </span>
            </div>
            <p className="text-3xl font-bold text-white mb-1">{formatCurrency(totalValue)}</p>
            <p className="text-sm text-gray-400">{processedAssets.length} active assets</p>
            <div className="mt-4 pt-4 border-t border-gray-700/50">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Total invested</span>
                <span className="text-gray-300 font-medium">{formatCurrency(portfolioMetrics.totalInvested)}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* P&L Card */}
        <div className="relative group">
          <div className={`absolute inset-0 bg-gradient-to-r ${totalPnL >= 0 ? 'from-green-600 to-emerald-600' : 'from-red-600 to-pink-600'} rounded-2xl blur-xl opacity-25 group-hover:opacity-40 transition-opacity`}></div>
          <div className="relative bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 hover:border-gray-600 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 ${totalPnL >= 0 ? 'bg-green-600/20' : 'bg-red-600/20'} rounded-xl`}>
                {totalPnL >= 0 ? <TrendingUp className="w-6 h-6 text-green-400" /> : <TrendingDown className="w-6 h-6 text-red-400" />}
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${totalPnL >= 0 ? 'bg-green-600/10 text-green-400' : 'bg-red-600/10 text-red-400'} font-medium`}>
                {totalPnL >= 0 ? 'Profit' : 'Loss'}
              </span>
            </div>
            <p className={`text-3xl font-bold ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'} mb-1`}>
              {totalPnL >= 0 ? '+' : ''}{formatCurrency(totalPnL)}
            </p>
            <div className="flex items-center space-x-2">
              <p className={`text-lg font-medium ${totalPnL >= 0 ? 'text-green-400/80' : 'text-red-400/80'}`}>
                {totalPnL >= 0 ? '+' : ''}{totalPnLPercent.toFixed(2)}%
              </p>
              <span className="text-gray-500 text-sm">all time</span>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-700/50">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Avg ROI</span>
                <span className={`font-medium ${portfolioMetrics.averageROI >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {portfolioMetrics.averageROI >= 0 ? '+' : ''}{portfolioMetrics.averageROI.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Performance Card */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl blur-xl opacity-25 group-hover:opacity-40 transition-opacity"></div>
          <div className="relative bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 hover:border-gray-600 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-600/20 rounded-xl">
                <Activity className="w-6 h-6 text-purple-400" />
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-purple-600/10 text-purple-400 font-medium">
                Performance
              </span>
            </div>
            <p className="text-3xl font-bold text-white mb-1">
              {portfolioMetrics.profitableAssets}/{portfolioMetrics.totalAssets}
            </p>
            <p className="text-sm text-gray-400">Profitable assets</p>
            <div className="mt-4 pt-4 border-t border-gray-700/50">
              <div className="w-full bg-gray-700/50 rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${(portfolioMetrics.profitableAssets / portfolioMetrics.totalAssets) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Best Performer Card */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-yellow-600 rounded-2xl blur-xl opacity-25 group-hover:opacity-40 transition-opacity"></div>
          <div className="relative bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 hover:border-gray-600 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-600/20 rounded-xl">
                <Star className="w-6 h-6 text-orange-400" />
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-orange-600/10 text-orange-400 font-medium">
                Top Gainer
              </span>
            </div>
            {portfolioMetrics.bestPerformer ? (
              <>
                <div className="flex items-center space-x-3 mb-2">
                  <CryptoLogo symbol={portfolioMetrics.bestPerformer.symbol} size={32} />
                  <div>
                    <p className="font-bold text-white">{portfolioMetrics.bestPerformer.symbol}</p>
                    <p className="text-xs text-gray-400">{portfolioMetrics.bestPerformer.name}</p>
                  </div>
                </div>
                <p className="text-lg font-medium text-green-400">
                  +{((portfolioMetrics.bestPerformer.price - portfolioMetrics.bestPerformer.avgBuy) / portfolioMetrics.bestPerformer.avgBuy * 100).toFixed(2)}%
                </p>
              </>
            ) : (
              <p className="text-gray-400">No data</p>
            )}
          </div>
        </div>
      </div>

      {/* Filters and Controls with Enhanced Design */}
      <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search assets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 w-72 transition-all duration-200"
              />
            </div>

            {/* Sort */}
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all duration-200 appearance-none cursor-pointer"
              >
                <option value="value">Sort by Value</option>
                <option value="name">Sort by Name</option>
                <option value="change">Sort by 24h Change</option>
                <option value="pnl">Sort by P&L</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white hover:bg-gray-800/50 transition-all duration-200"
              >
                <ArrowUpDown className={`w-4 h-4 transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Filter Zero Balance */}
            <label className="flex items-center space-x-3 text-gray-400 bg-gray-900/50 px-4 py-3 rounded-xl border border-gray-700 cursor-pointer hover:border-gray-600 transition-all duration-200">
              <input
                type="checkbox"
                checked={filterZeroBalance}
                onChange={(e) => setFilterZeroBalance(e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-2 focus:ring-blue-500/50"
              />
              <span className="text-sm font-medium">Hide zero balances</span>
            </label>
          </div>

          {/* View Toggle */}
          <div className="flex items-center space-x-2 bg-gray-900/50 rounded-xl p-1.5 border border-gray-700">
            <button
              onClick={() => setViewType('grid')}
              className={`px-4 py-2.5 rounded-lg transition-all duration-200 flex items-center space-x-2 ${
                viewType === 'grid' 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <Grid className="w-4 h-4" />
              <span className="text-sm font-medium">Grid</span>
            </button>
            <button
              onClick={() => setViewType('list')}
              className={`px-4 py-2.5 rounded-lg transition-all duration-200 flex items-center space-x-2 ${
                viewType === 'list' 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <List className="w-4 h-4" />
              <span className="text-sm font-medium">List</span>
            </button>
          </div>
        </div>
      </div>

      {/* Assets Display */}
      {processedAssets.length === 0 ? (
        <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-16 text-center border border-gray-700/50">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Wallet className="w-10 h-10 text-gray-500" />
            </div>
            <h3 className="text-2xl font-semibold text-white mb-3">No assets found</h3>
            <p className="text-gray-400 mb-8">
              {searchTerm 
                ? "No assets match your search criteria. Try adjusting your filters."
                : "Start building your portfolio by adding your first cryptocurrency asset."}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowAddAssetModal(true)}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-600/25 transition-all duration-200 font-medium"
              >
                Add Your First Asset
              </button>
            )}
          </div>
        </div>
      ) : viewType === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          {processedAssets.map((asset) => (
            <AssetCard key={asset.id} asset={asset} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {processedAssets.map((asset) => (
            <AssetListItem key={asset.id} asset={asset} />
          ))}
        </div>
      )}

      {/* Quick Stats Bar */}
      {processedAssets.length > 0 && (
        <div className="bg-gradient-to-r from-gray-800/30 to-gray-800/10 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-sm text-gray-400">Market Cap</p>
                  <p className="font-semibold text-white">{formatCurrency(totalValue * 1.2)}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Activity className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-sm text-gray-400">24h Volume</p>
                  <p className="font-semibold text-white">{formatCurrency(totalValue * 0.15)}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-purple-400" />
                <div>
                  <p className="text-sm text-gray-400">Risk Score</p>
                  <p className="font-semibold text-white">Medium</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-all duration-200">
                <Bell className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-all duration-200">
                <Download className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <AddAssetModal
        isOpen={showAddAssetModal}
        onClose={() => setShowAddAssetModal(false)}
        onAddAsset={(asset) => {
          addAsset(asset);
          setShowAddAssetModal(false);
        }}
      />

      <EditAssetModal
        isOpen={showEditAssetModal}
        onClose={() => {
          setShowEditAssetModal(false);
          setSelectedAsset(null);
        }}
        asset={selectedAsset}
        onUpdateAsset={(asset) => {
          updateAsset(asset);
          setShowEditAssetModal(false);
          setSelectedAsset(null);
        }}
        onRemoveAsset={(assetId) => {
          removeAsset(assetId);
          setShowEditAssetModal(false);
          setSelectedAsset(null);
        }}
      />

      <AddTransactionModal
        isOpen={showAddTransactionModal}
        onClose={() => {
          setShowAddTransactionModal(false);
          setSelectedAsset(null);
        }}
        onAddTransaction={(transaction) => {
          addTransaction(transaction);
          setShowAddTransactionModal(false);
          setSelectedAsset(null);
        }}
        preSelectedAssetId={selectedAsset?.id}
      />
    </div>
  );
};

export default AssetManagement;