import React, { useState, useEffect } from 'react';
import { X, Save, Trash2 } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import CryptoLogo from './CryptoLogo';

const EditTransactionModal = ({ isOpen, onClose, transaction, onUpdateTransaction, onDeleteTransaction }) => {
  const { assets } = usePortfolio();
  const [formData, setFormData] = useState({
    type: 'buy',
    amount: '',
    price: '',
    fee: '',
    date: '',
    notes: ''
  });
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [total, setTotal] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Initialize form data when transaction changes
  useEffect(() => {
    if (transaction) {
      setFormData({
        type: transaction.type || 'buy',
        amount: transaction.amount?.toString() || '',
        price: transaction.price?.toString() || '',
        fee: transaction.fee?.toString() || '',
        date: transaction.date || '',
        notes: transaction.notes || ''
      });
      
      // Find and set the asset
      const asset = assets.find(a => a.id === transaction.assetId);
      setSelectedAsset(asset);
    }
  }, [transaction, assets]);

  // Calculate total
  useEffect(() => {
    const amount = parseFloat(formData.amount) || 0;
    const price = parseFloat(formData.price) || 0;
    setTotal(amount * price);
  }, [formData.amount, formData.price]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!formData.amount || !formData.price) {
      alert('Please fill in amount and price');
      return;
    }

    const updatedTransaction = {
      ...transaction,
      type: formData.type,
      amount: parseFloat(formData.amount),
      price: parseFloat(formData.price),
      total: total,
      fee: parseFloat(formData.fee) || 0,
      date: formData.date,
      notes: formData.notes.trim()
    };

    onUpdateTransaction(updatedTransaction);
    onClose();
  };

  const handleDelete = () => {
    onDeleteTransaction(transaction.id);
    onClose();
    setShowDeleteConfirm(false);
  };

  const handleClose = () => {
    setShowDeleteConfirm(false);
    onClose();
  };

  if (!isOpen || !transaction) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl w-full max-w-md max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Edit Transaction</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Asset Display */}
          {selectedAsset && (
            <div className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg">
              <CryptoLogo symbol={selectedAsset.symbol} size={24} />
              <div className="flex-1">
                <div className="font-medium text-white text-sm">{selectedAsset.name}</div>
                <div className="text-xs text-gray-400">${selectedAsset.price.toLocaleString()}</div>
              </div>
            </div>
          )}

          {/* Transaction Type */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Type</label>
            <div className="grid grid-cols-3 gap-1">
              {['buy', 'sell', 'transfer'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleInputChange('type', type)}
                  className={`px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                    formData.type === type
                      ? type === 'buy' ? 'bg-green-600 text-white' :
                        type === 'sell' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Amount and Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Amount</label>
              <input
                type="number"
                step="any"
                placeholder="0"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Price ($)</label>
              <input
                type="number"
                step="any"
                placeholder="0.00"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Total and Fee */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Total</label>
              <div className="px-2 py-1.5 bg-gray-600 rounded text-white text-sm font-mono">
                ${total.toFixed(2)}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Fee ($)</label>
              <input
                type="number"
                step="any"
                placeholder="0.00"
                value={formData.fee}
                onChange={(e) => handleInputChange('fee', e.target.value)}
                className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Date & Time */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Date & Time</label>
            <input
              type="datetime-local"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Notes</label>
            <input
              type="text"
              placeholder="Optional notes..."
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Delete Confirmation */}
          {showDeleteConfirm && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-red-400 text-sm mb-2">Delete this transaction?</p>
              <div className="flex space-x-2">
                <button
                  onClick={handleDelete}
                  className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between pt-3 border-t border-gray-700">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center space-x-1 px-3 py-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              <span className="text-xs">Delete</span>
            </button>
            
            <div className="flex space-x-2">
              <button
                onClick={handleClose}
                className="px-3 py-1.5 text-gray-400 hover:text-white transition-colors text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!formData.amount || !formData.price}
                className="flex items-center space-x-1 px-4 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-3 h-3" />
                <span className="text-xs">Save</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditTransactionModal;