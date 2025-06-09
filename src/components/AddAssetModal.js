import React, { useState, useEffect } from 'react';
import { X, Search, Plus, Loader2 } from 'lucide-react';
import { getTopCryptos } from '../services/cryptoAPI';

const AddAssetModal = ({ isOpen, onClose, onAddAsset }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [topCryptos, setTopCryptos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCrypto, setSelectedCrypto] = useState(null);
  const [amount, setAmount] = useState('');
  const [avgBuyPrice, setAvgBuyPrice] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadTopCryptos();
    }
  }, [isOpen]);

  const loadTopCryptos = async () => {
    console.log('AddAssetModal: Loading top cryptos...');
    setLoading(true);
    try {
      const cryptos = await getTopCryptos(50);
      console.log('AddAssetModal: Received cryptos:', cryptos);
      setTopCryptos(cryptos);
    } catch (error) {
      console.error('Error loading top cryptos:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCryptos = topCryptos.filter(crypto =>
    crypto.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    crypto.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectCrypto = (crypto) => {
    setSelectedCrypto(crypto);
    setAvgBuyPrice(crypto.current_price.toString());
  };

  const handleAddAsset = () => {
    if (selectedCrypto && amount && avgBuyPrice) {
      const newAsset = {
        id: selectedCrypto.id,
        name: selectedCrypto.name,
        symbol: selectedCrypto.symbol.toUpperCase(),
        icon: selectedCrypto.symbol.charAt(0).toUpperCase(),
        amount: parseFloat(amount),
        price: selectedCrypto.current_price,
        change24h: selectedCrypto.price_change_percentage_24h || 0,
        avgBuy: parseFloat(avgBuyPrice),
        color: `#${Math.floor(Math.random()*16777215).toString(16)}`
      };
      onAddAsset(newAsset);
      onClose();
      // Reset form
      setSelectedCrypto(null);
      setAmount('');
      setAvgBuyPrice('');
      setSearchTerm('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Add New Asset</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search cryptocurrencies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Crypto List */}
        <div className="flex-1 overflow-y-auto mb-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
              <span className="ml-2 text-gray-400">Loading cryptocurrencies...</span>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredCryptos.map((crypto) => (
                <button
                  key={crypto.id}
                  onClick={() => handleSelectCrypto(crypto)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                    selectedCrypto?.id === crypto.id
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={crypto.image}
                      alt={crypto.name}
                      className="w-8 h-8 rounded-full"
                    />
                    <div className="text-left">
                      <div className="font-medium">{crypto.name}</div>
                      <div className="text-sm opacity-75">{crypto.symbol.toUpperCase()}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono">${crypto.current_price.toLocaleString()}</div>
                    <div className={`text-sm ${
                      crypto.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {crypto.price_change_percentage_24h >= 0 ? '+' : ''}
                      {crypto.price_change_percentage_24h?.toFixed(2) || 0}%
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected Asset Form */}
        {selectedCrypto && (
          <div className="border-t border-gray-700 pt-6">
            <h3 className="text-lg font-semibold mb-4 text-white">
              Add {selectedCrypto.name} to Portfolio
            </h3>
            <div className="grid grid-cols-2 gap-4">
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
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAsset}
                disabled={!selectedCrypto || !amount || !avgBuyPrice}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                <span>Add Asset</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddAssetModal;