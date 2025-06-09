import React, { useState } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { Plus, Edit, Trash2, Filter, Download, Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import CryptoLogo from './CryptoLogo';

const TransactionManager = () => {
  const { transactions, assets, addTransaction, updateTransaction, removeTransaction } = usePortfolio();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  // Mobile Transaction Card Component
  const MobileTransactionCard = ({ transaction }) => {
    const asset = assets.find(a => a.id === transaction.assetId);
    const date = new Date(transaction.date);
    
    return (
      <div className="bg-gray-800 rounded-xl p-4 mb-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${
              transaction.type === 'buy' ? 'bg-green-600' : 
              transaction.type === 'sell' ? 'bg-red-600' : 'bg-blue-600'
            }`}>
              {transaction.type === 'buy' ? '↗' : transaction.type === 'sell' ? '↙' : '→'}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className={`text-sm font-medium px-2 py-1 rounded ${
                  transaction.type === 'buy' ? 'bg-green-600/20 text-green-400' : 
                  transaction.type === 'sell' ? 'bg-red-600/20 text-red-400' : 'bg-blue-600/20 text-blue-400'
                }`}>
                  {transaction.type.toUpperCase()}
                </span>
                <CryptoLogo symbol={asset?.symbol || 'BTC'} size={24} />
                <span className="font-medium text-white">{asset?.symbol || 'Unknown'}</span>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {date.toLocaleDateString()} at {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setEditingTransaction(transaction)}
              className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => removeTransaction(transaction.id)}
              className="p-2 text-gray-400 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Transaction Details */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-400 block">Amount</span>
            <span className="font-mono text-white">{transaction.amount.toFixed(8).replace(/\.?0+$/, '')}</span>
          </div>
          <div>
            <span className="text-gray-400 block">Price</span>
            <span className="font-mono text-white">${transaction.price.toFixed(2).replace(/\.?0+$/, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</span>
          </div>
          <div>
            <span className="text-gray-400 block">Total</span>
            <span className="font-mono text-white font-medium">${transaction.total.toFixed(2).replace(/\.?0+$/, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</span>
          </div>
        </div>
      </div>
    );
  };

  // Desktop Transaction Row Component
  const DesktopTransactionRow = ({ transaction }) => {
    const asset = assets.find(a => a.id === transaction.assetId);
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
            <CryptoLogo symbol={asset?.symbol || 'BTC'} size={24} />
            <div>
              <div className="font-medium text-white">{asset?.symbol || 'Unknown'}</div>
              <div className="text-xs text-gray-400">{asset?.name || 'Unknown Asset'}</div>
            </div>
          </div>
        </td>
        <td className="py-4 px-4 text-right">
          <div className="font-mono text-sm text-white">{transaction.amount.toFixed(8).replace(/\.?0+$/, '')}</div>
        </td>
        <td className="py-4 px-4 text-right">
          <div className="font-mono text-sm text-white">${transaction.price.toFixed(2).replace(/\.?0+$/, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</div>
        </td>
        <td className="py-4 px-4 text-right">
          <div className="font-mono text-sm font-medium text-white">${transaction.total.toFixed(2).replace(/\.?0+$/, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</div>
        </td>
        <td className="py-4 px-4 text-right">
          <div className="font-mono text-sm text-white">${(transaction.fee || 0).toFixed(2).replace(/\.?0+$/, '')}</div>
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
              onClick={() => removeTransaction(transaction.id)}
              className="p-1 text-gray-400 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  // Filter and sort transactions
  const filteredTransactions = transactions
    .filter(tx => filterType === 'all' || tx.type === filterType)
    .sort((a, b) => {
      const aVal = sortBy === 'date' ? new Date(a.date) : a[sortBy];
      const bVal = sortBy === 'date' ? new Date(b.date) : b[sortBy];
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

  // Calculate summary stats
  const totalBuys = transactions.filter(tx => tx.type === 'buy').length;
  const totalSells = transactions.filter(tx => tx.type === 'sell').length;
  const totalVolume = transactions.reduce((sum, tx) => sum + tx.total, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-white">Transaction History</h2>
          <p className="text-gray-400 text-sm mt-1">
            {filteredTransactions.length} transactions • ${totalVolume.toLocaleString()} total volume
          </p>
        </div>
        
        {/* Action Buttons */}
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

      {/* Stats Cards - Mobile */}
      <div className="lg:hidden grid grid-cols-3 gap-3">
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <div className="flex items-center space-x-3">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="buy">Buy Only</option>
            <option value="sell">Sell Only</option>
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

      {/* Mobile Transaction List */}
      <div className="lg:hidden space-y-3">
        {filteredTransactions.length > 0 ? (
          filteredTransactions.map((transaction) => (
            <MobileTransactionCard key={transaction.id} transaction={transaction} />
          ))
        ) : (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-300 mb-2">No transactions found</h3>
            <p className="text-gray-400 mb-4">Start by adding your first transaction</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Transaction
            </button>
          </div>
        )}
      </div>

      {/* Desktop Transaction Table */}
      <div className="hidden lg:block bg-gray-800 rounded-xl overflow-hidden">
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
                    <p className="text-gray-400 mb-4">Start by adding your first transaction</p>
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Add Transaction
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TransactionManager;