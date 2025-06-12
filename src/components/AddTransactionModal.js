import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import CryptoLogo from './CryptoLogo';

const AddTransactionModal = ({ isOpen, onClose, onAddTransaction, preSelectedAssetId = null }) => {
  const { assets } = usePortfolio();
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

  // Pre-populate asset when preSelectedAssetId is provided
  useEffect(() => {
    if (preSelectedAssetId && isOpen) {
      setFormData(prev => ({ ...prev, assetId: preSelectedAssetId }));
    }
  }, [preSelectedAssetId, isOpen]);

  useEffect(() => {
    if (formData.assetId) {
      const asset = assets.find(a => a.id === formData.assetId);
      setSelectedAsset(asset);
      if (asset && !formData.price) {
        setFormData(prev => ({ ...prev, price: asset.price.toString() }));
      }
    }
  }, [formData.assetId, assets]);

  useEffect(() => {
    const amount = parseFloat(formData.amount) || 0;
    const price = parseFloat(formData.price) || 0;
    setTotal(amount * price);
  }, [formData.amount, formData.price]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.assetId || !formData.amount || !formData.price) {
      alert('Please fill in all required fields');
      return;
    }

    const transaction = {
      id: Date.now() + Math.random(),
      type: formData.type,
      assetId: formData.assetId,
      amount: parseFloat(formData.amount),
      price: parseFloat(formData.price),
      total: total,
      fee: parseFloat(formData.fee) || 0,
      date: formData.date,
      notes: formData.notes.trim()
    };

    onAddTransaction(transaction);
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
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">Add Transaction</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Transaction Type *</label>
            <div className="grid grid-cols-3 gap-2">
              {['buy', 'sell', 'transfer'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleInputChange('type', type)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
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

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Asset *</label>
            <select
              value={formData.assetId}
              onChange={(e) => handleInputChange('assetId', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select an asset</option>
              {assets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.name} ({asset.symbol})
                </option>
              ))}
            </select>
          </div>

          {selectedAsset && (
            <div className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg">
              <CryptoLogo symbol={selectedAsset.symbol} size={32} />
              <div>
                <div className="font-medium text-white">{selectedAsset.name}</div>
                <div className="text-sm text-gray-400">Current Price: ${selectedAsset.price.toLocaleString()}</div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Amount *</label>
              <input
                type="number"
                step="any"
                placeholder="0"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Price ($) *</label>
              <input
                type="number"
                step="any"
                placeholder="0.00"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Total</label>
              <div className="px-3 py-2 bg-gray-600 rounded-lg text-white font-mono">
                ${total.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Fee ($)</label>
              <input
                type="number"
                step="any"
                placeholder="0.00"
                value={formData.fee}
                onChange={(e) => handleInputChange('fee', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Date & Time *</label>
            <input
              type="datetime-local"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Notes</label>
            <textarea
              placeholder="Optional notes about this transaction..."
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
            <button type="button" onClick={handleClose} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled={!formData.assetId || !formData.amount || !formData.price}
            >
              <Plus className="w-4 h-4" />
              <span>Add Transaction</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTransactionModal;