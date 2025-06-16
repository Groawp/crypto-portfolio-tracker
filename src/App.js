import React, { useState, useEffect, Fragment, useCallback, useMemo } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, Settings, Clock, ArrowUpDown, 
  RefreshCw, Eye, EyeOff, Plus, MessageSquare 
} from 'lucide-react';
import { usePortfolio } from './context/PortfolioContext';
import AddAssetModal from './components/AddAssetModal';
import EditAssetModal from './components/EditAssetModal';
import AddTransactionModal from './components/AddTransactionModal';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import TransactionManager from './components/TransactionManager';
import AssetManagement from './components/AssetManagement';
import AIChat from './components/AIChat';
import APITestComponent from './components/APITestComponent';

// Constants
const MOBILE_BREAKPOINT = 768;
const VIEW_TITLES = {
  'assets': 'Asset Management',
  'ai-chat': 'AI Assistant',
  'analytics': 'Portfolio Analytics',
  'transactions': 'Transaction History',
  'settings': 'Settings'
};

const SIDEBAR_ITEMS = [
  { id: 'assets', icon: DollarSign, label: 'Assets' },
  { id: 'ai-chat', icon: MessageSquare, label: 'AI Assistant' },
  { id: 'analytics', icon: TrendingUp, label: 'Analytics' },
  { id: 'transactions', icon: Clock, label: 'Transactions' },
  { id: 'settings', icon: Settings, label: 'Settings' }
];

// Sample CSV template
const SAMPLE_CSV_CONTENT = `# Transactions
Date,Type,Asset Symbol,Asset Name,Amount,Price,Total,Fee,Notes
2024-01-15T10:30:00.000Z,buy,BTC,Bitcoin,0.001,45000,45,2.25,Initial Bitcoin purchase
2024-01-20T14:45:00.000Z,buy,ETH,Ethereum,0.5,2500,1250,6.25,Ethereum investment
2024-02-01T09:15:00.000Z,sell,BTC,Bitcoin,0.0005,48000,24,1.20,Partial Bitcoin sale
2024-02-10T16:20:00.000Z,buy,USDT,Tether,1000,1,1000,5,Stablecoin for trading

# Assets
Asset ID,Name,Symbol,Amount,Current Price,Average Buy Price,24h Change %
bitcoin,Bitcoin,BTC,0.0005,47000,45000,-1.2
ethereum,Ethereum,ETH,0.5,2600,2500,2.1
tether,Tether,USDT,1000,1,1,0.01`;

function App() {
  // State management
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentView, setCurrentView] = useState('assets');
  const [showBalances, setShowBalances] = useState(true);
  const [showAddAssetModal, setShowAddAssetModal] = useState(false);
  const [showEditAssetModal, setShowEditAssetModal] = useState(false);
  const [showAddTransactionModal, setShowAddTransactionModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [preSelectedAssetId, setPreSelectedAssetId] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  // Portfolio context
  const {
    assets,
    transactions,
    loading,
    error,
    updatePrices,
    addAsset,
    removeAsset,
    updateAsset,
    addTransaction,
    exportData,
    importData,
    clearAllData
  } = usePortfolio();

  // Memoized values
  const assetsWithHoldings = useMemo(() => 
    assets.filter(asset => asset.amount > 0), 
    [assets]
  );

  const currentViewTitle = useMemo(() => 
    VIEW_TITLES[currentView] || 'Dashboard', 
    [currentView]
  );

  // Mobile detection with useCallback
  const checkMobile = useCallback(() => {
    const isMobileView = window.innerWidth < MOBILE_BREAKPOINT;
    setIsMobile(isMobileView);
    if (isMobileView) {
      setSidebarCollapsed(true);
    }
  }, []);

  useEffect(() => {
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [checkMobile]);

  // Event handlers with useCallback for performance
  const handleRefreshPrices = useCallback(() => {
    updatePrices();
  }, [updatePrices]);

  const handleAddAsset = useCallback((newAsset) => {
    addAsset(newAsset);
    setShowAddAssetModal(false);
  }, [addAsset]);

  const handleEditAsset = useCallback((asset) => {
    setSelectedAsset(asset);
    setShowEditAssetModal(true);
  }, []);

  const handleUpdateAsset = useCallback((updatedAsset) => {
    updateAsset(updatedAsset);
    setShowEditAssetModal(false);
    setSelectedAsset(null);
  }, [updateAsset]);

  const handleRemoveAsset = useCallback((assetId) => {
    removeAsset(assetId);
    setShowEditAssetModal(false);
    setSelectedAsset(null);
  }, [removeAsset]);

  const handleAddTransactionForAsset = useCallback((assetId) => {
    setPreSelectedAssetId(assetId);
    setShowAddTransactionModal(true);
  }, []);

  const handleAddTransaction = useCallback((transaction) => {
    addTransaction(transaction);
    setShowAddTransactionModal(false);
    setPreSelectedAssetId(null);
  }, [addTransaction]);

  const handleExportData = useCallback(() => {
    exportData();
  }, [exportData]);

  const handleImportFile = useCallback((event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = importData(e.target.result);
      alert(result.success ? result.message : `Import failed: ${result.message}`);
      if (result.success) {
        event.target.value = '';
      }
    };
    reader.readAsText(file);
  }, [importData]);

  const handleClearAllData = useCallback(() => {
    if (window.confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      clearAllData();
      alert('All data has been cleared.');
    }
  }, [clearAllData]);

  const handleDownloadSampleCSV = useCallback(() => {
    const dataBlob = new Blob([SAMPLE_CSV_CONTENT], { type: 'text/csv' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sample-crypto-portfolio.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  // Toggle functions
  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);

  const toggleBalances = useCallback(() => {
    setShowBalances(prev => !prev);
  }, []);

  // Component definitions
  const MobileHeader = () => (
    <div className="lg:hidden bg-gray-800 border-b border-gray-700 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">AK</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Axis Krypto</h1>
            <p className="text-xs text-gray-400">Crypto Portfolio Tracker</p>
          </div>
        </div>
        <button
          onClick={toggleBalances}
          className="text-gray-400 hover:text-white transition-colors"
          aria-label={showBalances ? "Hide balances" : "Show balances"}
        >
          {showBalances ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );

  const MobileBottomNav = () => (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 px-2 py-2 z-50">
      <div className="grid grid-cols-5 gap-1">
        {SIDEBAR_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors ${
                isActive ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
              aria-label={`Navigate to ${item.label}`}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  const DesktopSidebar = () => (
    <div className={`hidden lg:flex bg-gray-800 transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-64'} flex-col flex-shrink-0`}>
      {/* Axis Krypto Branding */}
      <div className="p-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">AK</span>
          </div>
          {!sidebarCollapsed && (
            <div>
              <span className="font-bold text-lg text-white">Axis Krypto</span>
              <p className="text-xs text-gray-400">Crypto Portfolio Tracker</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 px-4">
        {SIDEBAR_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2 mb-2 rounded-lg transition-colors ${
                isActive ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-700'
              }`}
              aria-label={`Navigate to ${item.label}`}
            >
              <Icon className="w-5 h-5" />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>
      
      {/* Collapse Toggle */}
      <div className="p-4">
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center p-2 text-gray-400 hover:text-white transition-colors"
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ArrowUpDown className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  const DesktopHeader = () => (
    <div className="hidden lg:flex justify-between items-center mb-8">
      <h1 className="text-2xl font-bold text-white">{currentViewTitle}</h1>
      <div className="flex items-center space-x-4">
        <button
          onClick={toggleBalances}
          className="text-gray-400 hover:text-white transition-colors"
          aria-label={showBalances ? "Hide balances" : "Show balances"}
        >
          {showBalances ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
        </button>
        <button 
          onClick={handleRefreshPrices}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          aria-label="Refresh prices"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>
    </div>
  );

  const ErrorDisplay = () => error && (
    <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 mb-6" role="alert">
      <p className="text-red-400">Error: {error}</p>
    </div>
  );

  const MainContent = () => {
    switch (currentView) {
      case 'assets':
        return <AssetManagement />;
      case 'ai-chat':
        return <AIChat />;
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'transactions':
        return <TransactionManager />;
      case 'settings':
        return <SettingsView />;
      default:
        return <AssetManagement />;
    }
  };

  const SettingsView = () => (
    <div className="space-y-6">
      <APITestComponent />
      
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Settings</h2>
        <p className="text-gray-400">Manage your portfolio preferences and data</p>
      </div>

      {/* Data Management */}
      <div className="bg-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Data Management</h3>
        
        {/* Sample CSV Download */}
        <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-blue-400 font-medium mb-1">Sample CSV Template</h4>
              <p className="text-sm text-gray-400">Download a sample CSV file to see the correct format for importing your transactions</p>
            </div>
            <button
              onClick={handleDownloadSampleCSV}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <DollarSign className="w-4 h-4" />
              <span>Download Sample</span>
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="file"
            accept=".csv,.json"
            onChange={handleImportFile}
            style={{ display: 'none' }}
            id="import-file"
          />
          <button 
            onClick={() => document.getElementById('import-file').click()}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Import Data</span>
          </button>
          <button 
            onClick={handleExportData}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
          >
            <DollarSign className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button 
            onClick={handleClearAllData}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Clear All Data</span>
          </button>
        </div>
        
        {/* Import Instructions */}
        <div className="mt-4 p-4 bg-gray-700/50 rounded-lg">
          <h4 className="text-white font-medium mb-2">Import Instructions:</h4>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>• Download the sample CSV to see the correct format</li>
            <li>• Fill in your transaction data using the same structure</li>
            <li>• Save as CSV and use "Import Data" to upload</li>
            <li>• Both transactions and assets sections are required</li>
          </ul>
        </div>
      </div>

      {/* Display Preferences */}
      <div className="bg-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Display Preferences</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white">Show Balances</div>
              <div className="text-sm text-gray-400">Display portfolio values and amounts</div>
            </div>
            <button
              onClick={toggleBalances}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                showBalances ? 'bg-blue-600' : 'bg-gray-600'
              }`}
              aria-label="Toggle balance visibility"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  showBalances ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white">Auto Refresh</div>
              <div className="text-sm text-gray-400">Automatically update prices every 5 minutes</div>
            </div>
            <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600">
              <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
            </button>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="bg-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">About</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">App Version</span>
            <span className="text-white">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Last Updated</span>
            <span className="text-white">{new Date().toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Total Assets</span>
            <span className="text-white">{assetsWithHoldings.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Total Transactions</span>
            <span className="text-white">{transactions.length}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="flex min-h-screen">
        <DesktopSidebar />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <MobileHeader />
          
          <div className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6 overflow-auto">
            <DesktopHeader />
            <ErrorDisplay />
            <MainContent />
          </div>
        </div>
      </div>

      <MobileBottomNav />

      {/* Modals */}
      <AddAssetModal
        isOpen={showAddAssetModal}
        onClose={() => setShowAddAssetModal(false)}
        onAddAsset={handleAddAsset}
      />

      <EditAssetModal
        isOpen={showEditAssetModal}
        onClose={() => setShowEditAssetModal(false)}
        asset={selectedAsset}
        onUpdateAsset={handleUpdateAsset}
        onRemoveAsset={handleRemoveAsset}
      />

      <AddTransactionModal
        isOpen={showAddTransactionModal}
        onClose={() => {
          setShowAddTransactionModal(false);
          setPreSelectedAssetId(null);
        }}
        onAddTransaction={handleAddTransaction}
        preSelectedAssetId={preSelectedAssetId}
      />
    </div>
  );
}

export default App;