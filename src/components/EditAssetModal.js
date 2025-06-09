import React, { useState, useEffect } from 'react';
import { X, Save, Trash2 } from 'lucide-react';

const EditAssetModal = ({ isOpen, onClose, asset, onUpdateAsset, onRemoveAsset }) => {
  const [amount, setAmount] = useState('');
  const [avgBuyPrice, setAvgBuyPrice] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (asset) {
      setAmount(asset.amount.toString());
      setAvgBuyPrice(asset.avgBuy.toString());
    }
  }, [asset]);

  const handleSave = () => {
    if (amount && avgBuyPrice) {
      const updatedAsset = {
        ...asset,
        amount: parseFloat(amount),
        avgBuy: parseFloat(avgBuyPrice)
      };
      onUpdateAsset(updatedAsset);
      onClose();
    }
  };

  const handleDelete = () => {
    onRemoveAsset(asset.id);
    onClose();
    setShowDeleteConfirm(false);
  };

  const currentValue = asset ? (parseFloat(amount || 0) * asset.price) : 0;
  const investedValue = (parseFloat(amount || 0) * parseFloat(avgBuyPrice || 0));
  const pnl = currentValue - investedValue;
  const pnlPercent = investedValue > 0 ? (pnl / investedValue) * 100 : 0;

  if (!isOpen || !asset) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Edit {asset.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Asset Info */}
        <div className="flex items-center space-x-3 mb-6 p-4 bg-gray-700 rounded-lg">
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white"
            style={{ backgroundColor: asset.color }}
          >
            {asset.icon}
          </div>
          <div>
            <div className="font-medium text-white">{asset.name}</div>
            <div className="text-gray-400 text-sm">{asset.symbol}</div>
            <div className="text-gray-300 font-mono">${asset.price.toLocaleString()}</div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Amount
            </label>
            <input
              type="number"
              step="any"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Average Buy Price ($)
            </label>
            <input
              type="number"
              step="any"
              placeholder="0.00"
              value={avgBuyPrice}
              onChange={(e) => setAvgBuyPrice(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* Portfolio Preview */}
        {amount && avgBuyPrice && (
          <div className="bg-gray-700 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Preview</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-400">Current Value</div>
                <div className="font-mono text-white">${currentValue.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-gray-400">Invested</div>
                <div className="font-mono text-white">${investedValue.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-gray-400">P&L</div>
                <div className={`font-mono ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-gray-400">P&L %</div>
                <div className={`font-mono ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {pnl >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 mb-6">
            <h3 className="text-red-400 font-medium mb-2">Confirm Delete</h3>
            <p className="text-gray-300 text-sm mb-4">
              Are you sure you want to remove {asset.name} from your portfolio? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleDelete}
                className="px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center space-x-2 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Remove Asset</span>
          </button>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!amount || !avgBuyPrice}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditAssetModal;