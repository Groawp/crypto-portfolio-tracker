import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { getCryptoPrices } from '../services/cryptoAPI';

const PortfolioContext = createContext();

// Storage keys
const STORAGE_KEYS = {
  ASSETS: 'crypto_portfolio_assets',
  TRANSACTIONS: 'crypto_portfolio_transactions',
  SETTINGS: 'crypto_portfolio_settings'
};

const PORTFOLIO_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  UPDATE_PRICES: 'UPDATE_PRICES',
  ADD_ASSET: 'ADD_ASSET',
  REMOVE_ASSET: 'REMOVE_ASSET',
  UPDATE_ASSET_AMOUNT: 'UPDATE_ASSET_AMOUNT',
  ADD_TRANSACTION: 'ADD_TRANSACTION',
  UPDATE_TRANSACTION: 'UPDATE_TRANSACTION',
  REMOVE_TRANSACTION: 'REMOVE_TRANSACTION',
  SET_ERROR: 'SET_ERROR',
  LOAD_FROM_STORAGE: 'LOAD_FROM_STORAGE',
  CLEAR_ALL_DATA: 'CLEAR_ALL_DATA'
};

// Storage utilities
const StorageUtils = {
  save: (key, data) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      return false;
    }
  },

  load: (key) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      return null;
    }
  },

  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing from localStorage:', error);
      return false;
    }
  },

  clear: () => {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  }
};

// Helper function to recalculate asset holdings from transactions
const recalculateAssetHoldings = (assets, transactions) => {
  const holdingsMap = {};
  
  assets.forEach(asset => {
    holdingsMap[asset.id] = {
      ...asset,
      amount: 0,
      avgBuy: asset.avgBuy || 0,
      totalCost: 0,
      totalAmount: 0
    };
  });
  
  transactions.forEach(tx => {
    if (!holdingsMap[tx.assetId]) {
      return;
    }
    
    const holding = holdingsMap[tx.assetId];
    
    if (tx.type === 'buy') {
      const newTotalCost = holding.totalCost + tx.total;
      const newTotalAmount = holding.totalAmount + tx.amount;
      
      holding.amount = newTotalAmount;
      holding.totalCost = newTotalCost;
      holding.totalAmount = newTotalAmount;
      
      if (newTotalAmount > 0) {
        holding.avgBuy = newTotalCost / newTotalAmount;
      }
    } else if (tx.type === 'sell') {
      holding.amount = Math.max(0, holding.amount - tx.amount);
      holding.totalAmount = Math.max(0, holding.totalAmount - tx.amount);
    }
  });
  
  return Object.values(holdingsMap);
};

const defaultAssets = [
  {
    id: 'bitcoin',
    name: 'Bitcoin',
    symbol: 'BTC',
    icon: '₿',
    amount: 0.00000001106,
    price: 105250.84,
    change24h: -0.28,
    avgBuy: 38912.89,
    color: '#f7931a'
  },
  {
    id: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    icon: 'Ξ',
    amount: 0,
    price: 2633.85,
    change24h: 0.58,
    avgBuy: 3100,
    color: '#627eea'
  },
  {
    id: 'bitcoin-cash',
    name: 'Bitcoin Cash',
    symbol: 'BCH',
    icon: '₿',
    amount: 0,
    price: 403.46,
    change24h: -0.67,
    avgBuy: 500,
    color: '#0ac18e'
  },
  {
    id: 'chainlink',
    name: 'Chainlink',
    symbol: 'LINK',
    icon: '⛓',
    amount: 0,
    price: 13.91,
    change24h: -3.65,
    avgBuy: 28.33,
    color: '#375bd2'
  }
];

const defaultTransactions = [
  {
    id: 1,
    date: new Date().toISOString(),
    type: 'buy',
    assetId: 'bitcoin',
    amount: 0.00000001106,
    price: 38912.89,
    total: 0.00043,
    fee: 0.01,
    notes: 'Initial Bitcoin purchase'
  },
  {
    id: 2,
    date: new Date(Date.now() - 86400000).toISOString(),
    type: 'buy',
    assetId: 'ethereum',
    amount: 0.1,
    price: 3100,
    total: 310,
    fee: 1.50,
    notes: 'ETH investment'
  }
];

const initialState = {
  assets: defaultAssets,
  transactions: defaultTransactions,
  loading: false,
  error: null,
  lastUpdated: null,
  dataLoaded: false
};

function portfolioReducer(state, action) {
  let newState;
  
  switch (action.type) {
    case PORTFOLIO_ACTIONS.LOAD_FROM_STORAGE:
      return {
        ...state,
        assets: action.payload.assets || defaultAssets,
        transactions: action.payload.transactions || defaultTransactions,
        dataLoaded: true
      };

    case PORTFOLIO_ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    
    case PORTFOLIO_ACTIONS.UPDATE_PRICES:
      newState = {
        ...state,
        assets: state.assets.map(asset => {
          const priceData = action.payload[asset.id];
          if (priceData) {
            return {
              ...asset,
              price: priceData.usd,
              change24h: priceData.usd_24h_change || asset.change24h
            };
          }
          return asset;
        }),
        lastUpdated: new Date().toISOString(),
        loading: false
      };
      StorageUtils.save(STORAGE_KEYS.ASSETS, newState.assets);
      return newState;
    
    case PORTFOLIO_ACTIONS.ADD_ASSET:
      const existingAsset = state.assets.find(asset => asset.id === action.payload.id);
      if (existingAsset) {
        newState = {
          ...state,
          assets: state.assets.map(asset =>
            asset.id === action.payload.id
              ? { 
                  ...asset, 
                  amount: asset.amount + action.payload.amount,
                  avgBuy: ((asset.amount * asset.avgBuy) + (action.payload.amount * action.payload.avgBuy)) / (asset.amount + action.payload.amount)
                }
              : asset
          )
        };
      } else {
        newState = {
          ...state,
          assets: [...state.assets, action.payload]
        };
      }
      StorageUtils.save(STORAGE_KEYS.ASSETS, newState.assets);
      return newState;
    
    case PORTFOLIO_ACTIONS.REMOVE_ASSET:
      newState = {
        ...state,
        assets: state.assets.filter(asset => asset.id !== action.payload)
      };
      StorageUtils.save(STORAGE_KEYS.ASSETS, newState.assets);
      return newState;
    
    case PORTFOLIO_ACTIONS.UPDATE_ASSET_AMOUNT:
      newState = {
        ...state,
        assets: state.assets.map(asset =>
          asset.id === action.payload.id
            ? { ...asset, amount: action.payload.amount }
            : asset
        )
      };
      StorageUtils.save(STORAGE_KEYS.ASSETS, newState.assets);
      return newState;
    
    case 'UPDATE_ASSET_AVG_BUY':
      newState = {
        ...state,
        assets: state.assets.map(asset =>
          asset.id === action.payload.id
            ? { ...asset, avgBuy: action.payload.avgBuy }
            : asset
        )
      };
      StorageUtils.save(STORAGE_KEYS.ASSETS, newState.assets);
      return newState;
    
    case PORTFOLIO_ACTIONS.ADD_TRANSACTION:
      const newTransactions = [action.payload, ...state.transactions];
      const updatedAssetsFromAdd = recalculateAssetHoldings(state.assets, newTransactions);
      
      newState = {
        ...state,
        transactions: newTransactions,
        assets: updatedAssetsFromAdd
      };
      
      StorageUtils.save(STORAGE_KEYS.TRANSACTIONS, newState.transactions);
      StorageUtils.save(STORAGE_KEYS.ASSETS, newState.assets);
      return newState;
    
    case PORTFOLIO_ACTIONS.UPDATE_TRANSACTION:
      const modifiedTransactions = state.transactions.map(tx =>
        tx.id === action.payload.id ? action.payload : tx
      );
      const updatedAssetsFromUpdate = recalculateAssetHoldings(state.assets, modifiedTransactions);
      
      newState = {
        ...state,
        transactions: modifiedTransactions,
        assets: updatedAssetsFromUpdate
      };
      
      StorageUtils.save(STORAGE_KEYS.TRANSACTIONS, newState.transactions);
      StorageUtils.save(STORAGE_KEYS.ASSETS, newState.assets);
      return newState;
    
    case PORTFOLIO_ACTIONS.REMOVE_TRANSACTION:
      const updatedTransactions = state.transactions.filter(tx => tx.id !== action.payload);
      const recalculatedAssets = recalculateAssetHoldings(state.assets, updatedTransactions);
      
      newState = {
        ...state,
        transactions: updatedTransactions,
        assets: recalculatedAssets
      };
      
      StorageUtils.save(STORAGE_KEYS.TRANSACTIONS, newState.transactions);
      StorageUtils.save(STORAGE_KEYS.ASSETS, newState.assets);
      return newState;

    case PORTFOLIO_ACTIONS.CLEAR_ALL_DATA:
      StorageUtils.clear();
      return {
        ...initialState,
        assets: defaultAssets,
        transactions: defaultTransactions,
        dataLoaded: true
      };
    
    case PORTFOLIO_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    
    default:
      return state;
  }
}

export function PortfolioProvider({ children }) {
  const [state, dispatch] = useReducer(portfolioReducer, initialState);

  useEffect(() => {
    const loadStoredData = () => {
      const storedAssets = StorageUtils.load(STORAGE_KEYS.ASSETS);
      const storedTransactions = StorageUtils.load(STORAGE_KEYS.TRANSACTIONS);
      
      dispatch({
        type: PORTFOLIO_ACTIONS.LOAD_FROM_STORAGE,
        payload: {
          assets: storedAssets,
          transactions: storedTransactions
        }
      });
    };

    loadStoredData();
  }, []);

  const totalValue = state.assets.reduce((total, asset) => {
    return total + (asset.amount * asset.price);
  }, 0);

  const totalPnL = state.assets.reduce((total, asset) => {
    const currentValue = asset.amount * asset.price;
    const avgBuyValue = asset.amount * asset.avgBuy;
    return total + (currentValue - avgBuyValue);
  }, 0);

  const totalPnLPercent = totalValue > 0 ? ((totalPnL / (totalValue - totalPnL)) * 100) : 0;

  const updatePrices = async () => {
    dispatch({ type: PORTFOLIO_ACTIONS.SET_LOADING, payload: true });
    try {
      const cryptoIds = state.assets.map(asset => asset.id);
      const prices = await getCryptoPrices(cryptoIds);
      if (prices) {
        dispatch({ type: PORTFOLIO_ACTIONS.UPDATE_PRICES, payload: prices });
      }
    } catch (error) {
      dispatch({ type: PORTFOLIO_ACTIONS.SET_ERROR, payload: error.message });
    }
  };

  const addAsset = (asset) => {
    dispatch({ type: PORTFOLIO_ACTIONS.ADD_ASSET, payload: asset });
    
    const transaction = {
      id: Date.now(),
      date: new Date().toISOString(),
      type: 'buy',
      assetId: asset.id,
      amount: asset.amount,
      price: asset.avgBuy,
      total: asset.amount * asset.avgBuy,
      fee: 0,
      notes: 'Added via asset manager'
    };
    dispatch({ type: PORTFOLIO_ACTIONS.ADD_TRANSACTION, payload: transaction });
  };

  const removeAsset = (assetId) => {
    dispatch({ type: PORTFOLIO_ACTIONS.REMOVE_ASSET, payload: assetId });
  };

  const updateAsset = (updatedAsset) => {
    dispatch({ 
      type: PORTFOLIO_ACTIONS.UPDATE_ASSET_AMOUNT, 
      payload: { id: updatedAsset.id, amount: updatedAsset.amount } 
    });
    
    dispatch({
      type: 'UPDATE_ASSET_AVG_BUY',
      payload: { id: updatedAsset.id, avgBuy: updatedAsset.avgBuy }
    });
  };

  const addTransaction = (transaction) => {
    const newTransaction = {
      ...transaction,
      id: Date.now() + Math.random(),
      date: transaction.date || new Date().toISOString()
    };
    dispatch({ type: PORTFOLIO_ACTIONS.ADD_TRANSACTION, payload: newTransaction });
  };

  const updateTransaction = (transaction) => {
    dispatch({ type: PORTFOLIO_ACTIONS.UPDATE_TRANSACTION, payload: transaction });
  };

  const removeTransaction = (transactionId) => {
    dispatch({ type: PORTFOLIO_ACTIONS.REMOVE_TRANSACTION, payload: transactionId });
  };

  const exportData = () => {
    const exportData = {
      assets: state.assets,
      transactions: state.transactions,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `crypto-portfolio-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const importData = (fileContent) => {
    try {
      const data = JSON.parse(fileContent);
      
      if (data.assets && data.transactions) {
        const validAssets = data.assets.filter(asset => 
          asset.id && asset.name && asset.symbol && typeof asset.amount === 'number'
        );
        
        const validTransactions = data.transactions.filter(tx => 
          tx.id && tx.assetId && tx.type && typeof tx.amount === 'number'
        );

        StorageUtils.save(STORAGE_KEYS.ASSETS, validAssets);
        StorageUtils.save(STORAGE_KEYS.TRANSACTIONS, validTransactions);
        
        dispatch({
          type: PORTFOLIO_ACTIONS.LOAD_FROM_STORAGE,
          payload: {
            assets: validAssets,
            transactions: validTransactions
          }
        });
        
        return { success: true, message: 'Data imported successfully' };
      } else {
        return { success: false, message: 'Invalid file format' };
      }
    } catch (error) {
      return { success: false, message: 'Error parsing file: ' + error.message };
    }
  };

  const clearAllData = () => {
    dispatch({ type: PORTFOLIO_ACTIONS.CLEAR_ALL_DATA });
  };

  useEffect(() => {
    if (state.dataLoaded) {
      updatePrices();
      const interval = setInterval(updatePrices, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [state.dataLoaded]);

  const value = {
    ...state,
    totalValue,
    totalPnL,
    totalPnLPercent,
    updatePrices,
    addAsset,
    removeAsset,
    updateAsset,
    addTransaction,
    updateTransaction,
    removeTransaction,
    exportData,
    importData,
    clearAllData
  };

  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
}