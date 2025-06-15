import React, { useState, useEffect } from 'react';
import { X, Search, Plus, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { getTopCryptos } from '../services/cryptoAPI';

const AddAssetModal = ({ isOpen, onClose, onAddAsset }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [allCryptos, setAllCryptos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCrypto, setSelectedCrypto] = useState(null);
  const [amount, setAmount] = useState('');
  const [avgBuyPrice, setAvgBuyPrice] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadCryptos();
    }
    return () => {
      // Clean up on close
      setSearchTerm('');
      setSelectedCrypto(null);
      setAmount('');
      setAvgBuyPrice('');
      setError(null);
    };
  }, [isOpen]);

  const loadCryptos = async () => {
    console.log('Loading cryptocurrencies...');
    setLoading(true);
    setError(null);
    try {
      // Load more cryptos to include tokens like FLOKI
      const cryptos = await getTopCryptos(250); // Increased from 50 to 250
      console.log(`Loaded ${cryptos.length} cryptocurrencies`);
      setAllCryptos(cryptos || []);
    } catch (error) {
      console.error('Error loading cryptos:', error);
      setError('Failed to load cryptocurrencies. Please try again.');
      setAllCryptos([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter cryptos based on search term
  const filteredCryptos = allCryptos.filter(crypto => {
    if (!searchTerm || searchTerm.length < 2) return true;
    
    const term = searchTerm.toLowerCase();
    return (
      crypto.name.toLowerCase().includes(term) ||
      crypto.symbol.toLowerCase().includes(term) ||
      crypto.id.toLowerCase().includes(term)
    );
  });

  // Show popular cryptos when not searching
  const displayedCryptos = searchTerm.length < 2 
    ? allCryptos.slice(0, 20) // Show top 20 when not searching
    : filteredCryptos;

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
      console.log('Adding new asset:', newAsset);
      onAddAsset(newAsset);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Add New Asset</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search cryptocurrencies (e.g., 'Bitcoin', 'BTC', 'floki')..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Results count */}
        <div className="mb-2 text-sm text-gray-400">
          {searchTerm.length >= 2 
            ? `Found ${filteredCryptos.length} results for "${searchTerm}"`
            : `Popular cryptocurrencies (showing ${displayedCryptos.length} of ${allCryptos.length})`
          }
        </div>

        {/* Crypto List */}
        <div className="flex-1 overflow-y-auto mb-6 max-h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
              <span className="ml-2 text-gray-400">Loading cryptocurrencies...</span>
            </div>
          ) : allCryptos.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">No cryptocurrencies available</p>
              <button
                onClick={loadCryptos}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Retry Loading
              </button>
            </div>
          ) : displayedCryptos.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-2">No cryptocurrencies match your search</p>
              <p className="text-gray-500 text-sm">Try searching for the full name or symbol</p>
            </div>
          ) : (
            <div className="space-y-2">
              {displayedCryptos.map((crypto) => (
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
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div 
                      className="w-8 h-8 rounded-full bg-gray-600 items-center justify-center text-white font-bold text-sm hidden"
                      style={{ display: 'none' }}
                    >
                      {crypto.symbol.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-left">
                      <div className="font-medium flex items-center space-x-2">
                        <span>{crypto.name}</span>
                        {crypto.market_cap_rank <= 10 && (
                          <span className="text-xs bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded">
                            #{crypto.market_cap_rank}
                          </span>
                        )}
                      </div>
                      <div className="text-sm opacity-75 flex items-center space-x-2">
                        <span>{crypto.symbol.toUpperCase()}</span>
                        <span className="text-xs text-gray-500">• {crypto.id}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm">${crypto.current_price?.toLocaleString() || '0'}</div>
                    <div className={`text-xs flex items-center justify-end ${
                      crypto.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {crypto.price_change_percentage_24h >= 0 ? 
                        <TrendingUp className="w-3 h-3 mr-1" /> : 
                        <TrendingDown className="w-3 h-3 mr-1" />
                      }
                      {Math.abs(crypto.price_change_percentage_24h || 0).toFixed(2)}%
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Tip for finding specific tokens */}
          {searchTerm.length >= 2 && filteredCryptos.length === 0 && !loading && (
            <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-sm text-yellow-400 font-medium mb-1">Can't find what you're looking for?</p>
              <p className="text-xs text-gray-400">
                Some tokens might not be in the top 250. Try searching with the exact CoinGecko ID 
                (e.g., "floki-inu" for FLOKI token).
              </p>
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
            
            {/* Investment Summary */}
            {amount && avgBuyPrice && (
              <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Total Investment:</span>
                  <span className="text-white font-mono">
                    ${(parseFloat(amount) * parseFloat(avgBuyPrice)).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
            
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