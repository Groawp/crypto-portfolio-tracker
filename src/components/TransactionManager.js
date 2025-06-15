import React, { useState } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { Plus, Edit, Trash2, Filter, Download, Calendar, TrendingUp, TrendingDown, Search, RefreshCw } from 'lucide-react';
import CryptoLogo from './CryptoLogo';
import AddTransactionModal from './AddTransactionModal';

const TransactionManager = () => {
  const { transactions, assets, addTransaction, updateTransaction, removeTransaction, loading, error } = usePortfolio();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');

  const handleAddTransaction = (transaction) => {
    addTransaction(transaction);
    setShowAddModal(false);
  };

  const handleEditTransaction = (transaction) => {
    updateTransaction(transaction);
    setEditingTransaction(null);
  };

  const handleDeleteTransaction = (transactionId) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      removeTransaction(transactionId);
    }
  };

  const formatCurrency = (value, decimals = 2) => {
    if (!value || isNaN(value)) return '$0.00';
    return `$${value.toLocaleString(undefined, { 
      minimumFractionDigits: decimals, 
      maximumFractionDigits: decimals 
    })}`;
  };

  const formatValue = (value, maxDecimals = 8) => {
    if (!value || isNaN(value)) return '0';
    
    const num = parseFloat(value);
    if (num === 0) return '0';
    
    let formatted = num.toFixed(maxDecimals);
    formatted = formatted.replace(/(\.\d*?[1-9])0+$/, '$1');
    formatted = formatted.replace(/\.0+$/, '');
    
    return formatted;
  };

  const MobileTransactionCard = ({ transaction }) => {
    const asset = assets.find(a => a.id === transaction.assetId) || {};
    const date = new Date(transaction.date);
    
    return (
      <div className="bg-gray-800 rounded-xl p-4 mb-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <CryptoLogo symbol={asset.symbol || 'BTC'} size={40} />
              <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                transaction.type === 'buy' ? 'bg-green-600' : 
                transaction.type === 'sell' ? 'bg-red-600' : 'bg-blue-600'
              }`}>
                {transaction.type === 'buy' ? '↗' : transaction.type === 'sell' ? '↙' : '→'}
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className={`text-sm font-medium px-2 py-1 rounded ${
                  transaction.type === 'buy' ? 'bg-green-600/20 text-green-400' : 
                  transaction.type === 'sell' ? 'bg-red-600/20 text-red-400' : 'bg-blue-600/20 text-blue-400'
                }`}>
                  {transaction.type.toUpperCase()}
                </span>
                <span className="font-medium text-white">{asset.symbol || 'Unknown'}</span>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {date.toLocaleDateString()} at {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setEditingTransaction(transaction)}
              className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDeleteTransaction(transaction.id)}
              className="p-2 text-gray-400 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-400 block">Amount</span>
            <span className="font-mono text-white">{formatValue(transaction.amount)}</span>
          </div>
          <div>
            <span className="text-gray-400 block">Price</span>
            <span className="font-mono text-white">{formatCurrency(transaction.price)}</span>
          </div>
          <div>
            <span className="text-gray-400 block">Total</span>
            <span className="font-mono text-white font-medium">{formatCurrency(transaction.total)}</span>
          </div>
        </div>

        {transaction.notes && (
          <div className="mt-3 pt-3 border-t border-gray-700">
            <span className="text-gray-400 text-xs block">Notes</span>
            <span className="text-gray-300 text-sm">{transaction.notes}</span>
          </div>
        )}
      </div>
    );
  };

  const DesktopTransactionRow = ({ transaction }) => {
    const asset = assets.find(a => a.id === transaction.assetId) || {};
    const date = new Date(transaction.date);
    
    return (
      <tr className="border-b border-gray-700 hover:bg-gray-750 transition-colors">
        <td className="py-4 px-4">
          <div className="text-sm text-gray-300">
            {date.toLocaleDateString()}
            <div className="text-xs text-gray-500">
              {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </td>
        <td className="py-4 px-4">
          <span className={`text-xs font-medium px-2 py-1 rounded ${
            transaction.type === 'buy' ? 'bg-green-600/20 text-green-400' : 
            transaction.type === 'sell' ? 'bg-red-600/20 text-red-400' : 'bg-blue-600/20 text-blue-400'
          }`}>
            {transaction.type.toUpperCase()}
          </span>
        </td>
        <td className="py-4 px-4">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <CryptoLogo symbol={asset.symbol || 'BTC'} size={32} />
              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                transaction.type === 'buy' ? 'bg-green-600' : 
                transaction.type === 'sell' ? 'bg-red-600' : 'bg-blue-600'
              }`}>
                {transaction.type === 'buy' ? '↗' : transaction.type === 'sell' ? '↙' : '→'}
              </div>
            </div>
            <div>
              <div className="font-medium text-white">{asset.symbol || 'Unknown'}</div>
              <div className="text-xs text-gray-400">{asset.name || 'Unknown Asset'}</div>
            </div>
          </div>
        </td>
        <td className="py-4 px-4 text-right">
          <div className="font-mono text-sm text-white">{formatValue(transaction.amount)}</div>
        </td>
        <td className="py-4 px-4 text-right">
          <div className="font-mono text-sm text-white">{formatCurrency(transaction.price)}</div>
        </td>
        <td className="py-4 px-4 text-right">
          <div className="font-mono text-sm font-medium text-white">{formatCurrency(transaction.total)}</div>
        </td>
        <td className="py-4 px-4 text-right">
          <div className="font-mono text-sm text-white">{formatCurrency(transaction.fee || 0)}</div>
        </td>
        <td className="py-4 px-4">
          <div className="text-sm text-gray-300 max-w-32 truncate">
            {transaction.notes || '-'}
          </div>
        </td>
        <td className="py-4 px-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setEditingTransaction(transaction)}
              className="p-1 text-gray-400 hover:text-blue-400 transition-colors"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDeleteTransaction(transaction.id)}
              className="p-1 text-gray-400 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  const filteredTransactions = transactions
    .filter(tx => {
      if (filterType !== 'all' && tx.type !== filterType) return false;
      if (searchTerm) {
        const asset = assets.find(a => a.id === tx.assetId) || {};
        const searchLower = searchTerm.toLowerCase();
        return (
          (asset.name && asset.name.toLowerCase().includes(searchLower)) ||
          (asset.symbol && asset.symbol.toLowerCase().includes(searchLower)) ||
          (tx.notes && tx.notes.toLowerCase().includes(searchLower))
        );
      }
      return true;
    })
    .sort((a, b) => {
      const aVal = sortBy === 'date' ? new Date(a.date) : a[sortBy];
      const bVal = sortBy === 'date' ? new Date(b.date) : b[sortBy];
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

  const totalBuys = transactions.filter(tx => tx.type === 'buy').length;
  const totalSells = transactions.filter(tx => tx.type === 'sell').length;
  const totalVolume = transactions.reduce((sum, tx) => sum + (tx.total || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-white">Transaction History</h2>
          <p className="text-gray-400 text-sm mt-1">
            {filteredTransactions.length} transactions • {formatCurrency(totalVolume)} total volume
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Transaction</span>
            <span className="sm:hidden">Add</span>
          </button>
          
          <button className="hidden lg:flex items-center space-x-2 px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500 rounded-lg p-4">
          <p className="text-red-400">Note: Live prices may be unavailable. Transaction history is still functional.</p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{totalBuys}</div>
          <div className="text-sm text-gray-400">Buys</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-400">{totalSells}</div>
          <div className="text-sm text-gray-400">Sells</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">{transactions.length}</div>
          <div className="text-sm text-gray-400">Total</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <div className="flex items-center space-x-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="buy">Buy Only</option>
            <option value="sell">Sell Only</option>
            <option value="transfer">Transfer Only</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="date">Sort by Date</option>
            <option value="total">Sort by Total</option>
            <option value="amount">Sort by Amount</option>
          </select>
          
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-2 bg-gray-700 border border-gray-600 rounded-lg text-white hover:bg-gray-600 transition-colors"
          >
            {sortOrder === 'asc' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          </button>
        </div>
        
        <div className="text-sm text-gray-400">
          Showing {filteredTransactions.length} of {transactions.length} transactions
        </div>
      </div>

      {/* Mobile View */}
      <div className="lg:hidden space-y-3">
        {filteredTransactions.length > 0 ? (
          filteredTransactions.map((transaction) => (
            <MobileTransactionCard key={transaction.id} transaction={transaction} />
          ))
        ) : (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-300 mb-2">No transactions found</h3>
            <p className="text-gray-400 mb-4">
              {searchTerm ? 'Try adjusting your search criteria' : 'Start by adding your first transaction'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Transaction
              </button>
            )}
          </div>
        )}
      </div>

      {/* Desktop View */}
      <div className="hidden lg:block bg-gray-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="text-left py-4 px-4 text-gray-300 font-medium">Date</th>
                  <th className="text-left py-4 px-4 text-gray-300 font-medium">Type</th>
                  <th className="text-left py-4 px-4 text-gray-300 font-medium">Asset</th>
                  <th className="text-right py-4 px-4 text-gray-300 font-medium">Amount</th>
                  <th className="text-right py-4 px-4 text-gray-300 font-medium">Price</th>
                  <th className="text-right py-4 px-4 text-gray-300 font-medium">Total</th>
                  <th className="text-right py-4 px-4 text-gray-300 font-medium">Fee</th>
                  <th className="text-left py-4 px-4 text-gray-300 font-medium">Notes</th>
                  <th className="text-center py-4 px-4 text-gray-300 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((transaction) => (
                    <DesktopTransactionRow key={transaction.id} transaction={transaction} />
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="py-12 text-center">
                      <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-300 mb-2">No transactions found</h3>
                      <p className="text-gray-400 mb-4">
                        {searchTerm ? 'Try adjusting your search criteria' : 'Start by adding your first transaction'}
                      </p>
                      {!searchTerm && (
                        <button
                          onClick={() => setShowAddModal(true)}
                          className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Add Transaction
                        </button>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Transaction Modal */}
      <AddTransactionModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAddTransaction={handleAddTransaction}
      />

      {/* Edit Transaction Modal */}
      {editingTransaction && (
        <AddTransactionModal
          isOpen={true}
          onClose={() => setEditingTransaction(null)}
          onAddTransaction={handleEditTransaction}
          editingTransaction={editingTransaction}
        />
      )}
    </div>
  );
};

export default TransactionManager;