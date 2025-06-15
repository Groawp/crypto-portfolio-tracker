import React, { useState, useMemo, useEffect } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { Plus, Search, Filter, Grid, List, TrendingUp, TrendingDown, Eye, EyeOff, ArrowUpDown, Info, Wallet, PieChart, Edit2, MoreVertical } from 'lucide-react';
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
    
    // Convert to number to handle string inputs
    const num = parseFloat(value);
    
    // Handle zero
    if (num === 0) return '0';
    
    // For very small numbers (less than 0.00001)
    if (num > 0 && num < 0.00001) {
      // Convert to string and find how many decimal places we need
      let str = num.toString();
      
      // If it's in scientific notation, convert it
      if (str.includes('e')) {
        str = num.toFixed(20);
      }
      
      // Remove trailing zeros
      str = str.replace(/0+$/, '');
      
      // For very long decimals, truncate but keep enough significant digits
      const parts = str.split('.');
      if (parts[1] && parts[1].length > 10) {
        // Find first non-zero digit position
        const firstNonZero = parts[1].search(/[1-9]/);
        // Keep the zeros plus 4 significant digits
        parts[1] = parts[1].substring(0, firstNonZero + 4);
        str = parts.join('.');
      }
      
      return str;
    }
    
    // For regular numbers
    let formatted = num.toFixed(maxDecimals);
    
    // Remove trailing zeros after decimal point
    formatted = formatted.replace(/(\.\d*?[1-9])0+$/, '$1');
    
    // Remove decimal point if all decimals are zeros
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

  const AssetCard = ({ asset }) => {
    const value = asset.amount * asset.price;
    const pnl = calculatePnL(asset);
    const pnlPercent = calculatePnLPercent(asset);
    const allocation = totalValue > 0 ? (value / totalValue) * 100 : 0;

    return (
      <div className="bg-gray-800 rounded-xl p-6 hover:bg-gray-750 transition-all duration-200 border border-gray-700 hover:border-gray-600 group">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <CryptoLogo symbol={asset.symbol} size={48} />
            <div>
              <h3 className="font-semibold text-white text-lg">{asset.name}</h3>
              <p className="text-gray-400 text-sm">{asset.symbol}</p>
            </div>
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="text-gray-400 hover:text-white p-1">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Value */}
        <div className="mb-4">
          <p className="text-gray-400 text-sm mb-1">Portfolio Value</p>
          <p className="text-2xl font-bold text-white">{formatCurrency(value)}</p>
          <p className="text-sm text-gray-400 mt-1">{allocation.toFixed(2)}% of portfolio</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-gray-400 text-xs mb-1">Holdings</p>
            <p className="font-mono text-sm text-white">{formatValue(asset.amount, 8)}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-1">Current Price</p>
            <p className="font-mono text-sm text-white">{formatCurrency(asset.price)}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-1">Avg Buy Price</p>
            <p className="font-mono text-sm text-white">{formatCurrency(asset.avgBuy)}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-1">24h Change</p>
            <p className={`font-mono text-sm flex items-center ${asset.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {asset.change24h >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
              {Math.abs(asset.change24h || 0).toFixed(2)}%
            </p>
          </div>
        </div>

        {/* P&L */}
        <div className={`p-3 rounded-lg ${pnl >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Profit/Loss</span>
            <div className="text-right">
              <p className={`font-semibold ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {pnl >= 0 ? '+' : ''}{formatCurrency(pnl)}
              </p>
              <p className={`text-xs ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {pnl >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <button
            onClick={() => handleAddTransaction(asset)}
            className="flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Transaction</span>
          </button>
          <button
            onClick={() => handleEditAsset(asset)}
            className="flex items-center justify-center space-x-2 px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 hover:text-white transition-colors text-sm"
          >
            <Edit2 className="w-4 h-4" />
            <span>Edit</span>
          </button>
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
      <div className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-all duration-200 border border-gray-700 hover:border-gray-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <CryptoLogo symbol={asset.symbol} size={40} />
            <div className="flex-1 grid grid-cols-6 gap-4 items-center">
              <div>
                <p className="font-medium text-white">{asset.name}</p>
                <p className="text-sm text-gray-400">{asset.symbol}</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm text-white">{formatValue(asset.amount, 8)}</p>
                <p className="text-xs text-gray-400">Holdings</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm text-white">{formatCurrency(asset.price)}</p>
                <p className="text-xs text-gray-400">Price</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-white">{formatCurrency(value)}</p>
                <p className="text-xs text-gray-400">{allocation.toFixed(2)}% allocation</p>
              </div>
              <div className="text-right">
                <p className={`font-mono text-sm flex items-center justify-end ${asset.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {asset.change24h >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                  {Math.abs(asset.change24h || 0).toFixed(2)}%
                </p>
                <p className="text-xs text-gray-400">24h</p>
              </div>
              <div className="text-right">
                <p className={`font-semibold ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {pnl >= 0 ? '+' : ''}{formatCurrency(pnl)}
                </p>
                <p className={`text-xs ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {pnl >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={() => handleAddTransaction(asset)}
              className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors"
              title="Add Transaction"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleEditAsset(asset)}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Asset Management</h1>
          <p className="text-gray-400">
            Manage your cryptocurrency portfolio • {processedAssets.length} assets • {formatCurrency(totalValue)}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowBalances(!showBalances)}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            title={showBalances ? "Hide Balances" : "Show Balances"}
          >
            {showBalances ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
          </button>
          <button
            onClick={updatePrices}
            disabled={loading}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            Refresh Prices
          </button>
          <button
            onClick={() => setShowAddAssetModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Add Asset</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <Wallet className="w-5 h-5 text-blue-400" />
            <span className="text-xs text-gray-400">Total Portfolio</span>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(totalValue)}</p>
          <p className="text-sm text-gray-400 mt-1">{processedAssets.length} assets</p>
        </div>
        
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <span className="text-xs text-gray-400">Total P&L</span>
          </div>
          <p className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {totalPnL >= 0 ? '+' : ''}{formatCurrency(totalPnL)}
          </p>
          <p className={`text-sm ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {totalPnL >= 0 ? '+' : ''}{totalPnLPercent.toFixed(2)}%
          </p>
        </div>
        
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <PieChart className="w-5 h-5 text-purple-400" />
            <span className="text-xs text-gray-400">Diversification</span>
          </div>
          <p className="text-2xl font-bold text-white">{processedAssets.length}</p>
          <p className="text-sm text-gray-400 mt-1">Different assets</p>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search assets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 w-64"
              />
            </div>

            {/* Sort */}
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="value">Sort by Value</option>
                <option value="name">Sort by Name</option>
                <option value="change">Sort by 24h Change</option>
                <option value="pnl">Sort by P&L</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-2 bg-gray-700 border border-gray-600 rounded-lg text-white hover:bg-gray-600 transition-colors"
              >
                <ArrowUpDown className="w-4 h-4" />
              </button>
            </div>

            {/* Filter Zero Balance */}
            <label className="flex items-center space-x-2 text-gray-400">
              <input
                type="checkbox"
                checked={filterZeroBalance}
                onChange={(e) => setFilterZeroBalance(e.target.checked)}
                className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm">Hide zero balances</span>
            </label>
          </div>

          {/* View Toggle */}
          <div className="flex items-center space-x-2 bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewType('grid')}
              className={`p-2 rounded transition-colors ${
                viewType === 'grid' ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewType('list')}
              className={`p-2 rounded transition-colors ${
                viewType === 'list' ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Assets Display */}
      {processedAssets.length === 0 ? (
        <div className="bg-gray-800 rounded-xl p-12 text-center border border-gray-700">
          <div className="max-w-md mx-auto">
            <Wallet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No assets found</h3>
            <p className="text-gray-400 mb-6">
              {searchTerm 
                ? "No assets match your search criteria. Try adjusting your filters."
                : "Start building your portfolio by adding your first cryptocurrency asset."}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowAddAssetModal(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Your First Asset
              </button>
            )}
          </div>
        </div>
      ) : viewType === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

      {/* Modals */}
      <AddAssetModal
        isOpen={showAddAssetModal}
        onClose={() => setShowAddAssetModal(false)}
        onAddAsset={(asset) => {
          console.log('Adding asset:', asset);
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
          console.log('Updating asset:', asset);
          updateAsset(asset);
          setShowEditAssetModal(false);
          setSelectedAsset(null);
        }}
        onRemoveAsset={(assetId) => {
          console.log('Removing asset:', assetId);
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
          console.log('Adding transaction:', transaction);
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