import React, { useState, useMemo, useEffect } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { 
  Plus, Search, Filter, Grid, List, TrendingUp, TrendingDown, Eye, EyeOff, 
  ArrowUpDown, Info, Wallet, PieChart, Edit2, MoreVertical, RefreshCw,
  BarChart3, Activity, Shield, Star, Bell, Download, ChevronDown
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
  const [showFilters, setShowFilters] = useState(false);

  // Auto-refresh timer
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdateTime(new Date());
    }, 60000);
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

    if (searchTerm) {
      filtered = filtered.filter(asset =>
        asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.symbol.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterZeroBalance) {
      filtered = filtered.filter(asset => asset.amount > 0);
    }

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

  // Mobile-optimized compact card
  const MobileAssetCard = ({ asset }) => {
    const value = asset.amount * asset.price;
    const pnl = calculatePnL(asset);
    const pnlPercent = calculatePnLPercent(asset);
    const allocation = totalValue > 0 ? (value / totalValue) * 100 : 0;

    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50 hover:border-gray-600 transition-all duration-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <CryptoLogo symbol={asset.symbol} size={36} />
              <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ${asset.change24h >= 0 ? 'bg-green-500' : 'bg-red-500'} ring-2 ring-gray-800`}></div>
            </div>
            <div>
              <h3 className="font-semibold text-white text-base">{asset.symbol}</h3>
              <p className="text-gray-400 text-xs">{formatValue(asset.amount, 4)} {asset.symbol}</p>
            </div>
          </div>
          
          <div className="text-right">
            <p className="font-bold text-white text-base">{formatCurrency(value)}</p>
            <div className={`text-xs font-medium flex items-center justify-end ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {pnl >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
              {pnl >= 0 ? '+' : ''}{pnlPercent.toFixed(1)}%
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-gray-900/50 rounded-lg p-2">
            <p className="text-gray-500 text-xs">Price</p>
            <p className="text-white text-sm font-medium">{formatCurrency(asset.price)}</p>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-2">
            <p className="text-gray-500 text-xs">24h</p>
            <p className={`text-sm font-medium ${asset.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {asset.change24h >= 0 ? '+' : ''}{Math.abs(asset.change24h || 0).toFixed(1)}%
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-0.5">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={`w-1 h-2 rounded-full ${
                    i < Math.ceil(allocation / 20) ? 'bg-blue-500' : 'bg-gray-700'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500">{allocation.toFixed(1)}%</span>
          </div>
          
          <button
            onClick={() => handleAddTransaction(asset)}
            className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  // Mobile-optimized list item
  const MobileAssetListItem = ({ asset }) => {
    const value = asset.amount * asset.price;
    const pnl = calculatePnL(asset);
    const pnlPercent = calculatePnLPercent(asset);

    return (
      <div className="bg-gray-800/30 backdrop-blur-sm rounded-lg p-3 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <CryptoLogo symbol={asset.symbol} size={32} />
              <div className={`absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ${asset.change24h >= 0 ? 'bg-green-500' : 'bg-red-500'} ring-2 ring-gray-800`}></div>
            </div>
            
            <div className="space-y-0.5">
              <div className="flex items-center space-x-3">
                <p className="font-medium text-white text-sm">{asset.symbol}</p>
                <p className="text-sm font-medium text-white">{formatCurrency(asset.price)}</p>
              </div>
              <p className="text-xs text-gray-400">{formatValue(asset.amount, 4)} {asset.symbol}</p>
            </div>
          </div>
          
          <div className="text-right space-y-0.5">
            <p className="font-semibold text-white text-sm">{formatCurrency(value)}</p>
            <div className="flex items-center justify-end space-x-2">
              <div className={`text-xs font-medium flex items-center ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {pnl >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                {pnl >= 0 ? '+' : ''}{pnlPercent.toFixed(1)}%
              </div>
              <div className={`text-xs px-1.5 py-0.5 rounded-full ${asset.change24h >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                {asset.change24h >= 0 ? '+' : ''}{Math.abs(asset.change24h || 0).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn px-3 sm:px-0">
      {/* Optimized Portfolio Summary Card */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600/10 to-purple-600/10 p-4 border border-gray-700/50">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-purple-600/5"></div>
        
        <div className="relative z-10">
          {/* Header row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-blue-600/20 rounded-lg">
                <Wallet className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <h1 className="text-base font-bold text-white">Portfolio</h1>
                <div className="flex items-center space-x-1">
                  <div className="w-1 h-1 rounded-full bg-green-500"></div>
                  <span className="text-xs text-gray-400">{processedAssets.length} assets</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowBalances(!showBalances)}
                className="p-2 text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-all duration-200"
                title={showBalances ? "Hide Balances" : "Show Balances"}
              >
                {showBalances ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
              <button
                onClick={updatePrices}
                disabled={loading}
                className="p-2 text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-all duration-200 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setShowAddAssetModal(true)}
                className="px-3 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg hover:shadow-blue-600/25 transition-all duration-200 flex items-center space-x-1 font-medium text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Value and P&L row */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-white">{formatCurrency(totalValue)}</p>
              <p className="text-xs text-gray-400 mt-0.5">Total invested: {formatCurrency(portfolioMetrics.totalInvested)}</p>
            </div>
            
            <div className="text-right">
              <div className={`flex items-center space-x-1 ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {totalPnL >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span className="font-bold text-lg">
                  {totalPnL >= 0 ? '+' : ''}{formatCurrency(totalPnL)}
                </span>
              </div>
              <p className={`text-sm font-medium ${totalPnL >= 0 ? 'text-green-400/80' : 'text-red-400/80'}`}>
                {totalPnL >= 0 ? '+' : ''}{totalPnLPercent.toFixed(2)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Compact Filters */}
      <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-3 border border-gray-700/50">
        <div className="space-y-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search assets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 w-full transition-all duration-200 text-sm"
            />
          </div>

          {/* Filter Toggle Button - Mobile Only */}
          <div className="flex items-center justify-between sm:hidden">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span className="text-sm">Filters</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            
            {/* View Toggle - Always visible */}
            <div className="flex items-center space-x-1 bg-gray-900/50 rounded-lg p-1 border border-gray-700">
              <button
                onClick={() => setViewType('grid')}
                className={`px-2.5 py-1.5 rounded-md transition-all duration-200 flex items-center space-x-1 ${
                  viewType === 'grid' 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                <Grid className="w-3 h-3" />
                <span className="text-xs font-medium hidden sm:inline">Grid</span>
              </button>
              <button
                onClick={() => setViewType('list')}
                className={`px-2.5 py-1.5 rounded-md transition-all duration-200 flex items-center space-x-1 ${
                  viewType === 'list' 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                <List className="w-3 h-3" />
                <span className="text-xs font-medium hidden sm:inline">List</span>
              </button>
            </div>
          </div>

          {/* Collapsible Filters - Mobile */}
          <div className={`${showFilters || window.innerWidth >= 640 ? 'block' : 'hidden'} sm:block space-y-3 sm:space-y-0`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                {/* Sort */}
                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="flex-1 sm:flex-none px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all duration-200 appearance-none cursor-pointer text-sm"
                  >
                    <option value="value">Sort by Value</option>
                    <option value="name">Sort by Name</option>
                    <option value="change">Sort by 24h Change</option>
                    <option value="pnl">Sort by P&L</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="p-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white hover:bg-gray-800/50 transition-all duration-200"
                  >
                    <ArrowUpDown className={`w-4 h-4 transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {/* Zero Balance Filter */}
                <label className="flex items-center space-x-2 text-gray-400 bg-gray-900/50 px-3 py-2 rounded-lg border border-gray-700 cursor-pointer hover:border-gray-600 transition-all duration-200">
                  <input
                    type="checkbox"
                    checked={filterZeroBalance}
                    onChange={(e) => setFilterZeroBalance(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-2 focus:ring-blue-500/50"
                  />
                  <span className="text-sm font-medium">Hide zero</span>
                </label>
              </div>

              {/* View Toggle - Desktop */}
              <div className="hidden sm:flex items-center space-x-2 bg-gray-900/50 rounded-xl p-1.5 border border-gray-700">
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
        </div>
      </div>

      {/* Assets Display */}
      {processedAssets.length === 0 ? (
        <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-8 sm:p-16 text-center border border-gray-700/50">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <Wallet className="w-8 h-8 sm:w-10 sm:h-10 text-gray-500" />
            </div>
            <h3 className="text-lg sm:text-2xl font-semibold text-white mb-2 sm:mb-3">No assets found</h3>
            <p className="text-gray-400 mb-6 sm:mb-8 text-sm sm:text-base">
              {searchTerm 
                ? "No assets match your search criteria. Try adjusting your filters."
                : "Start building your portfolio by adding your first cryptocurrency asset."}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowAddAssetModal(true)}
                className="px-6 py-3 sm:px-8 sm:py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg sm:rounded-xl hover:shadow-lg hover:shadow-blue-600/25 transition-all duration-200 font-medium text-sm sm:text-base"
              >
                Add Your First Asset
              </button>
            )}
          </div>
        </div>
      ) : viewType === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {processedAssets.map((asset) => (
            <MobileAssetCard key={asset.id} asset={asset} />
          ))}
        </div>
      ) : (
        <div className="space-y-2 sm:space-y-3">
          {processedAssets.map((asset) => (
            <MobileAssetListItem key={asset.id} asset={asset} />
          ))}
        </div>
      )}

      {/* Mobile-optimized Quick Stats Bar */}
      {processedAssets.length > 0 && (
        <div className="bg-gradient-to-r from-gray-800/30 to-gray-800/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-gray-700/50">
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
              <div>
                <p className="text-xs sm:text-sm text-gray-400">Market Cap</p>
                <p className="font-semibold text-white text-sm sm:text-base">{formatCurrency(totalValue * 1.2)}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
              <div>
                <p className="text-xs sm:text-sm text-gray-400">24h Volume</p>
                <p className="font-semibold text-white text-sm sm:text-base">{formatCurrency(totalValue * 0.15)}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3 col-span-2 sm:col-span-1">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
              <div>
                <p className="text-xs sm:text-sm text-gray-400">Risk Score</p>
                <p className="font-semibold text-white text-sm sm:text-base">Medium</p>
              </div>
            </div>
            
            <div className="hidden sm:flex items-center space-x-3">
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