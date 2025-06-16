import React, { useState, useEffect } from 'react';
import { X, Plus, Save, ArrowLeft } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import CryptoLogo from './CryptoLogo';

const AddTransactionModal = ({ 
  isOpen, 
  onClose, 
  onAddTransaction, 
  onUpdateTransaction, 
  preSelectedAssetId = null, 
  editingTransaction = null 
}) => {
  const { assets } = usePortfolio();
  const [step, setStep] = useState(1); // 1 = select asset, 2 = enter details
  const [formData, setFormData] = useState({
    type: 'buy',
    assetId: '',
    amount: '',
    price: '',
    fee: '',
    date: new Date().toISOString().slice(0, 16),
    notes: ''
  });

  const [selectedAsset, setSelectedAsset] = useState(null);
  const [total, setTotal] = useState(0);
  const isEditing = Boolean(editingTransaction);

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen) {
      if (editingTransaction) {
        // Editing mode - populate with existing transaction data
        setFormData({
          type: editingTransaction.type,
          assetId: editingTransaction.assetId,
          amount: editingTransaction.amount.toString(),
          price: editingTransaction.price.toString(),
          fee: editingTransaction.fee?.toString() || '',
          date: editingTransaction.date,
          notes: editingTransaction.notes || ''
        });
        setStep(2); // Go directly to step 2 when editing
      } else if (preSelectedAssetId) {
        // Adding with pre-selected asset
        setFormData(prev => ({ 
          ...prev, 
          assetId: preSelectedAssetId 
        }));
        setStep(2); // Go directly to step 2 when pre-selected
      } else {
        // Fresh add - start at step 1
        setStep(1);
      }
    }
  }, [isOpen, editingTransaction, preSelectedAssetId]);

  // Set selected asset when assetId changes
  useEffect(() => {
    if (formData.assetId) {
      const asset = assets.find(a => a.id === formData.assetId);
      setSelectedAsset(asset);
      // Auto-populate price only for new transactions (not when editing)
      if (asset && !formData.price && !isEditing) {
        setFormData(prev => ({ ...prev, price: asset.price.toString() }));
      }
    }
  }, [formData.assetId, assets, isEditing]);

  // Calculate total
  useEffect(() => {
    const amount = parseFloat(formData.amount) || 0;
    const price = parseFloat(formData.price) || 0;
    setTotal(amount * price);
  }, [formData.amount, formData.price]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSelectAsset = (assetId) => {
    setFormData(prev => ({ ...prev, assetId }));
    setStep(2);
  };

  const handleSubmit = () => {
    if (!formData.assetId || !formData.amount || !formData.price) {
      alert('Please fill in all required fields');
      return;
    }

    const transactionData = {
      type: formData.type,
      assetId: formData.assetId,
      amount: parseFloat(formData.amount),
      price: parseFloat(formData.price),
      total: total,
      fee: parseFloat(formData.fee) || 0,
      date: formData.date,
      notes: formData.notes.trim()
    };

    if (isEditing) {
      // Update existing transaction
      const updatedTransaction = {
        ...editingTransaction,
        ...transactionData
      };
      onUpdateTransaction(updatedTransaction);
    } else {
      // Add new transaction
      const newTransaction = {
        id: Date.now() + Math.random(),
        ...transactionData
      };
      onAddTransaction(newTransaction);
    }
    
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      type: 'buy',
      assetId: '',
      amount: '',
      price: '',
      fee: '',
      date: new Date().toISOString().slice(0, 16),
      notes: ''
    });
    setSelectedAsset(null);
    setTotal(0);
    setStep(1);
    onClose();
  };

  const goBackToStep1 = () => {
    setStep(1);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl w-full max-w-md max-h-[85vh] overflow-y-auto">
        {/* Compact Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            {step === 2 && !isEditing && (
              <button onClick={goBackToStep1} className="text-gray-400 hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <h2 className="text-lg font-bold text-white">
              {isEditing ? 'Edit Transaction' : 
               step === 1 ? 'Select Asset' : 'Add Transaction'}
            </h2>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: Select Asset (only for new transactions without pre-selected asset) */}
        {step === 1 && !isEditing && (
          <div className="p-4">
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {assets.map((asset) => (
                <button
                  key={asset.id}
                  onClick={() => handleSelectAsset(asset.id)}
                  className="w-full flex items-center justify-between p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <CryptoLogo symbol={asset.symbol} size={28} />
                    <div className="text-left">
                      <div className="font-medium text-white text-sm">{asset.name}</div>
                      <div className="text-xs text-gray-400">{asset.symbol}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-xs text-white">${asset.price.toLocaleString()}</div>
                    <div className={`text-xs ${asset.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}%
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Transaction Details */}
        {step === 2 && (
          <div className="p-4 space-y-4">
            {/* Transaction Type */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">Type</label>
              <div className="grid grid-cols-3 gap-2">
                {['buy', 'sell', 'transfer'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleInputChange('type', type)}
                    className={`px-3 py-2 rounded text-xs font-medium transition-colors ${
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

            {/* Asset Selection (for editing or when not pre-selected) */}
            {(isEditing || !preSelectedAssetId) && (
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">Asset</label>
                <select
                  value={formData.assetId}
                  onChange={(e) => handleInputChange('assetId', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={isEditing} // Disable asset change when editing
                >
                  <option value="">Select an asset</option>
                  {assets.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.name} ({asset.symbol})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Selected Asset Display */}
            {selectedAsset && (
              <div className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg">
                <CryptoLogo symbol={selectedAsset.symbol} size={24} />
                <div>
                  <div className="font-medium text-white text-sm">{selectedAsset.name}</div>
                  <div className="text-xs text-gray-400">${selectedAsset.price.toLocaleString()}</div>
                </div>
              </div>
            )}

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
                  className="w-full px-2 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  required
                  autoFocus={step === 2}
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
                  className="w-full px-2 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Total and Fee */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Total</label>
                <div className="px-2 py-2 bg-gray-600 rounded text-white text-sm font-mono">
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
                  className="w-full px-2 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full px-2 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full px-2 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-3 border-t border-gray-700">
              <button type="button" onClick={handleClose} className="px-3 py-2 text-gray-400 hover:text-white transition-colors text-sm">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
                disabled={!formData.assetId || !formData.amount || !formData.price}
              >
                {isEditing ? <Save className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                <span>{isEditing ? 'Save' : 'Add'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddTransactionModal;