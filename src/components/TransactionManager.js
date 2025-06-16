import React, { useState } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { Plus, Edit, Trash2, Filter, Download, Calendar, TrendingUp, TrendingDown, Search, RefreshCw } from 'lucide-react';
import CryptoLogo from './CryptoLogo';
import AddTransactionModal from './AddTransactionModal';
import EditTransactionModal from './EditTransactionModal';

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

  const handleUpdateTransaction = (updatedTransaction) => {
    updateTransaction(updatedTransaction);
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

  const TransactionCard = ({ transaction }) => {
    const asset = assets.find(a => a.id === transaction.assetId) || {};
    const date = new Date(transaction.date);
    
    return (
      <div className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            {/* Asset Icon & Info */}
            <div className="relative flex-shrink-0">
              <CryptoLogo symbol={asset.symbol || 'BTC'} size={36} />
              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                transaction.type === 'buy' ? 'bg-green-600' : 
                transaction.type === 'sell' ? 'bg-red-600' : 'bg-blue-600'
              }`}>
                {transaction.type === 'buy' ? '+' : transaction.type === 'sell' ? '-' : '→'}
              </div>
            </div>
            
            {/* Transaction Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                  transaction.type === 'buy' ? 'bg-green-600/20 text-green-400' : 
                  transaction.type === 'sell' ? 'bg-red-600/20 text-red-400' : 'bg-blue-600/20 text-blue-400'
                }`}>
                  {transaction.type.toUpperCase()}
                </span>
                <span className="font-medium text-white text-sm">{asset.symbol || 'Unknown'}</span>
              </div>
              
              <div className="flex items-center space-x-4 text-xs text-gray-400">
                <span>{formatValue(transaction.amount)} tokens</span>
                <span>@{formatCurrency(transaction.price)}</span>
                <span className="font-medium text-white">{formatCurrency(transaction.total)}</span>
              </div>
              
              <div className="text-xs text-gray-500 mt-1">
                {date.toLocaleDateString()} • {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center space-x-1 flex-shrink-0">
            <button
              onClick={() => setEditingTransaction(transaction)}
              className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDeleteTransaction(transaction.id)}
              className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Notes (if any) */}
        {transaction.notes && (
          <div className="mt-3 pt-2 border-t border-gray-700">
            <span className="text-xs text-gray-500">Note: </span>
            <span className="text-xs text-gray-300">{transaction.notes}</span>
          </div>
        )}
      </div>
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
    <div className="max-w-4xl mx-auto space-y-4 p-4">
      {/* Compact Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Transactions</h2>
          <p className="text-gray-400 text-sm">
            {filteredTransactions.length} of {transactions.length} • {formatCurrency(totalVolume)} volume
          </p>
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add</span>
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <p className="text-red-400 text-sm">Live prices may be unavailable</p>
        </div>
      )}

      {/* Compact Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-800 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-green-400">{totalBuys}</div>
          <div className="text-xs text-gray-400">Buys</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-red-400">{totalSells}</div>
          <div className="text-xs text-gray-400">Sells</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-blue-400">{transactions.length}</div>
          <div className="text-xs text-gray-400">Total</div>
        </div>
      </div>

      {/* Compact Filters */}
      <div className="flex items-center space-x-2">
        {/* Search */}
        <div className="relative flex-1 max-w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All</option>
          <option value="buy">Buy</option>
          <option value="sell">Sell</option>
          <option value="transfer">Transfer</option>
        </select>
        
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="date">Date</option>
          <option value="total">Total</option>
          <option value="amount">Amount</option>
        </select>
        
        <button
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="p-2 bg-gray-700 border border-gray-600 rounded-lg text-white hover:bg-gray-600 transition-colors"
          title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
        >
          {sortOrder === 'asc' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Transaction List */}
      <div className="space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
            <span className="ml-2 text-gray-400">Loading...</span>
          </div>
        ) : filteredTransactions.length > 0 ? (
          filteredTransactions.map((transaction) => (
            <TransactionCard key={transaction.id} transaction={transaction} />
          ))
        ) : (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-300 mb-2">No transactions found</h3>
            <p className="text-gray-400 mb-4 text-sm">
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

      {/* Results Info */}
      {filteredTransactions.length > 0 && (
        <div className="text-center text-xs text-gray-500 pt-2">
          Showing {filteredTransactions.length} of {transactions.length} transactions
        </div>
      )}

      {/* Add Transaction Modal */}
      <AddTransactionModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAddTransaction={handleAddTransaction}
      />

      {/* Edit Transaction Modal */}
      {editingTransaction && (
        <EditTransactionModal
          isOpen={true}
          onClose={() => setEditingTransaction(null)}
          transaction={editingTransaction}
          onUpdateTransaction={handleUpdateTransaction}
          onDeleteTransaction={handleDeleteTransaction}
        />
      )}
    </div>
  );
};

export default TransactionManager;