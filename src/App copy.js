import React, { useState, useEffect, Fragment } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Settings, Clock, ArrowUpDown, RefreshCw, Eye, EyeOff, Loader2, Plus, Menu, X, ChevronDown, ChevronUp } from 'lucide-react';
import { usePortfolio } from './context/PortfolioContext';
import { getHistoricalData } from './services/cryptoAPI';
import AddAssetModal from './components/AddAssetModal';
import EditAssetModal from './components/EditAssetModal';
import AddTransactionModal from './components/AddTransactionModal';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import TransactionManager from './components/TransactionManager';
import CryptoLogo from './components/CryptoLogo';
import AssetManagement from './components/AssetManagement';

function App() {
 const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
 const [currentView, setCurrentView] = useState('dashboard');
 const [showBalances, setShowBalances] = useState(true);
 const [portfolioChartData, setPortfolioChartData] = useState([]);
 const [chartLoading, setChartLoading] = useState(false);
 const [showAddAssetModal, setShowAddAssetModal] = useState(false);
 const [showEditAssetModal, setShowEditAssetModal] = useState(false);
 const [showAddTransactionModal, setShowAddTransactionModal] = useState(false);
 const [selectedAsset, setSelectedAsset] = useState(null);
 const [preSelectedAssetId, setPreSelectedAssetId] = useState(null);
 const [expandedAsset, setExpandedAsset] = useState(null);
 const [isMobile, setIsMobile] = useState(false);

 // Use portfolio context
 const {
   assets,
   transactions,
   totalValue,
   totalPnL,
   totalPnLPercent,
   loading,
   error,
   lastUpdated,
   updatePrices,
   addAsset,
   removeAsset,
   updateAsset,
   addTransaction,
   updateTransaction,
   removeTransaction,
   exportData,      // Add this
   importData,      // Add this
   clearAllData     // Add this
 } = usePortfolio();

 // Filter assets with amount > 0 for display
 const assetsWithHoldings = assets.filter(asset => asset.amount > 0);

 // Detect mobile device
 useEffect(() => {
   const checkMobile = () => {
     setIsMobile(window.innerWidth < 768);
     if (window.innerWidth < 768) {
       setSidebarCollapsed(true);
     }
   };
   
   checkMobile();
   window.addEventListener('resize', checkMobile);
   return () => window.removeEventListener('resize', checkMobile);
 }, []);

 // Load portfolio chart data
 useEffect(() => {
   const loadChartData = async () => {
     setChartLoading(true);
     try {
       // Get Bitcoin historical data as portfolio proxy (you can enhance this later)
       const data = await getHistoricalData('bitcoin', 7);
       setPortfolioChartData(data.slice(-12)); // Last 12 data points
     } catch (error) {
       console.error('Error loading chart data:', error);
     } finally {
       setChartLoading(false);
     }
   };

   loadChartData();
 }, []);

 const sidebarItems = [
   { id: 'dashboard', icon: BarChart3, label: 'Dashboard' },
   { id: 'analytics', icon: TrendingUp, label: 'Analytics' },
   { id: 'assets', icon: DollarSign, label: 'Assets' },
   { id: 'transactions', icon: Clock, label: 'Transactions' },
   { id: 'settings', icon: Settings, label: 'Settings' }
 ];

 const formatValue = (value, decimals = 6) => {
   if (!showBalances) return '****';
   return value.toFixed(decimals);
 };

 const formatCurrency = (value, decimals = 2) => {
   if (!showBalances) return '$****';
   return `$${value.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
 };

 const CustomTooltip = ({ active, payload, label }) => {
   if (active && payload && payload.length) {
     return (
       <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg">
         <p className="text-gray-300 text-sm">{`Date: ${label}`}</p>
         <p className="text-purple-400 font-medium">
           {`Value: ${formatCurrency(payload[0].value, 2)}`}
         </p>
       </div>
     );
   }
   return null;
 };

 // Calculate pie chart data - only include assets with holdings
 const pieData = assetsWithHoldings
   .map(asset => {
     const value = asset.amount * asset.price;
     return {
       name: asset.symbol,
       value: totalValue > 0 ? ((value / totalValue) * 100) : 0,
       color: asset.color,
       total: value
     };
   });

 // Calculate portfolio metrics
 const calculatePnL = (asset) => {
   const currentValue = asset.amount * asset.price;
   const avgBuyValue = asset.amount * asset.avgBuy;
   return currentValue - avgBuyValue;
 };

 const calculatePnLPercent = (asset) => {
   const pnl = calculatePnL(asset);
   const avgBuyValue = asset.amount * asset.avgBuy;
   return avgBuyValue > 0 ? (pnl / avgBuyValue) * 100 : 0;
 };

 const handleRefreshPrices = () => {
   updatePrices();
 };

 const handleAddAsset = (newAsset) => {
   addAsset(newAsset);
   setShowAddAssetModal(false);
 };

 const handleEditAsset = (asset) => {
   setSelectedAsset(asset);
   setShowEditAssetModal(true);
 };

 const handleUpdateAsset = (updatedAsset) => {
   updateAsset(updatedAsset);
   setShowEditAssetModal(false);
   setSelectedAsset(null);
 };

 const handleRemoveAsset = (assetId) => {
   removeAsset(assetId);
   setShowEditAssetModal(false);
   setSelectedAsset(null);
 };

 // Handle add transaction with pre-selected asset
 const handleAddTransactionForAsset = (assetId) => {
   setPreSelectedAssetId(assetId);
   setShowAddTransactionModal(true);
 };

 const handleAddTransaction = (transaction) => {
   addTransaction(transaction);
   setShowAddTransactionModal(false);
   setPreSelectedAssetId(null);
 };

 // Add these functions after handleAddTransaction
 const handleExportData = () => {
   exportData();
 };

 const handleImportFile = (event) => {
   const file = event.target.files[0];
   if (file) {
     const reader = new FileReader();
     reader.onload = (e) => {
       const result = importData(e.target.result);
       if (result.success) {
         alert(result.message);
         // Reset file input
         event.target.value = '';
       } else {
         alert(`Import failed: ${result.message}`);
       }
     };
     reader.readAsText(file);
   }
 };

 const handleClearAllData = () => {
   if (window.confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
     clearAllData();
     alert('All data has been cleared.');
   }
 };

 const handleDownloadSampleCSV = () => {
   // Sample CSV content with the same format as export
   const sampleCSVContent = `# Transactions
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

   // Create and download sample CSV
   const dataBlob = new Blob([sampleCSVContent], { type: 'text/csv' });
   const url = URL.createObjectURL(dataBlob);
   
   const link = document.createElement('a');
   link.href = url;
   link.download = 'sample-crypto-portfolio.csv';
   document.body.appendChild(link);
   link.click();
   document.body.removeChild(link);
   URL.revokeObjectURL(url);
 };

 // Mobile-specific components
 const MobileHeader = () => (
   <div className="lg:hidden bg-gray-800 border-b border-gray-700 p-4">
     <div className="flex items-center justify-between">
       <div className="flex items-center space-x-3">
         <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
           <BarChart3 className="w-5 h-5 text-white" />
         </div>
         <span className="font-bold text-lg text-white">CryptoTracker</span>
       </div>
       <button
         onClick={() => setShowBalances(!showBalances)}
         className="text-gray-400 hover:text-white transition-colors"
       >
         {showBalances ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
       </button>
     </div>
   </div>
 );

 const MobilePortfolioCard = () => (
   <div className="bg-gray-800 rounded-xl p-6 mb-6">
     <div className="text-center">
       <p className="text-gray-400 text-sm mb-2">Total Portfolio Value</p>
       <h2 className="text-3xl font-bold mb-2">{formatCurrency(totalValue, 2)}</h2>
       <div className="flex items-center justify-center space-x-3 mb-4">
         <span className={`text-lg font-medium ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
           {totalPnL >= 0 ? '+' : ''}{formatCurrency(totalPnL, 2)}
         </span>
         <span className={`flex items-center text-lg ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
           {totalPnL >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
           {totalPnLPercent.toFixed(2)}%
         </span>
       </div>
       
       {/* Mini Chart */}
       <div className="h-32 mb-4 w-full">
         {chartLoading ? (
           <div className="flex items-center justify-center h-full">
             <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
           </div>
         ) : portfolioChartData.length > 0 ? (
           <div className="w-full h-full">
             <ResponsiveContainer width="100%" height="100%">
               <LineChart data={portfolioChartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                 <Line 
                   type="monotone" 
                   dataKey="value" 
                   stroke="#8b5cf6" 
                   strokeWidth={2}
                   dot={false}
                 />
                 <Tooltip content={<CustomTooltip />} />
               </LineChart>
             </ResponsiveContainer>
           </div>
         ) : (
           <div className="flex items-center justify-center h-full text-gray-400">
             <span className="text-sm">Chart data loading...</span>
           </div>
         )}
       </div>
       
       {/* Action Buttons */}
       <div className="flex justify-center">
         <button 
           onClick={() => setShowAddAssetModal(true)}
           className="flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
         >
           <Plus className="w-4 h-4" />
           <span className="text-sm">Add Asset</span>
         </button>
       </div>
     </div>
   </div>
 );

 const MobileBottomNav = () => (
   <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 px-2 py-2 z-50">
     <div className="grid grid-cols-5 gap-1">
       {sidebarItems.map((item) => {
         const Icon = item.icon;
         return (
           <button
             key={item.id}
             onClick={() => setCurrentView(item.id)}
             className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors ${
               currentView === item.id ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'
             }`}
           >
             <Icon className="w-5 h-5 mb-1" />
             <span className="text-xs font-medium">{item.label}</span>
           </button>
         );
       })}
     </div>
   </div>
 );

 const MobileAssetCard = ({ asset }) => {
   const pnl = calculatePnL(asset);
   const pnlPercent = calculatePnLPercent(asset);
   const total = asset.amount * asset.price;
   const isExpanded = expandedAsset === asset.id;

   return (
     <div className="bg-gray-800 rounded-xl p-4 mb-4">
       <div 
         className="flex items-center justify-between cursor-pointer"
         onClick={() => setExpandedAsset(isExpanded ? null : asset.id)}
       >
         <div className="flex items-center space-x-3">
           <CryptoLogo symbol={asset.symbol} size={40} />
           <div>
             <div className="font-medium text-white">{asset.symbol}</div>
             <div className="text-sm text-gray-400">{asset.name}</div>
           </div>
         </div>
         
         <div className="text-right">
           <div className="font-mono text-white">{formatCurrency(total, 2)}</div>
           <div className={`text-sm flex items-center justify-end ${asset.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
             {asset.change24h >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
             {asset.change24h?.toFixed(2) || 0}%
           </div>
         </div>
         
         <div className="ml-2">
           {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
         </div>
       </div>
       
       {/* Expanded Details */}
       {isExpanded && (
         <div className="mt-4 pt-4 border-t border-gray-700 space-y-3">
           <div className="grid grid-cols-2 gap-4 text-sm">
             <div>
               <span className="text-gray-400">Amount:</span>
               <div className="font-mono text-white">{formatValue(asset.amount, 6)}</div>
             </div>
             <div>
               <span className="text-gray-400">Price:</span>
               <div className="font-mono text-white">{formatCurrency(asset.price)}</div>
             </div>
             <div>
               <span className="text-gray-400">Avg Buy:</span>
               <div className="font-mono text-white">{formatCurrency(asset.avgBuy)}</div>
             </div>
             <div>
               <span className="text-gray-400">P/L:</span>
               <div className={`font-mono ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                 {showBalances ? `${pnl >= 0 ? '+' : ''}${formatCurrency(pnl)}` : '$****'}
                 <div className="text-xs">
                   {pnl >= 0 ? '▲' : '▼'} {Math.abs(pnlPercent).toFixed(2)}%
                 </div>
               </div>
             </div>
           </div>
           
           <div className="flex justify-center mt-4">
             <button 
               onClick={(e) => {
                 e.stopPropagation();
                 handleAddTransactionForAsset(asset.id);
               }}
               className="flex items-center space-x-2 px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
             >
               <Plus className="w-4 h-4" />
               <span>Add Transaction</span>
             </button>
           </div>
         </div>
       )}
     </div>
   );
 };

 return (
   <div className="min-h-screen bg-gray-900 text-white">
     <div className="flex min-h-screen">
       {/* Desktop Sidebar */}
       <div className={`hidden lg:flex bg-gray-800 transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-64'} flex-col flex-shrink-0`}>
         <div className="p-4">
           <div className="flex items-center space-x-2">
             <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
               <BarChart3 className="w-5 h-5 text-white" />
             </div>
             {!sidebarCollapsed && <span className="font-bold text-lg">CryptoTracker</span>}
           </div>
         </div>
         
         <nav className="flex-1 px-4">
           {sidebarItems.map((item) => {
             const Icon = item.icon;
             return (
               <button
                 key={item.id}
                 onClick={() => setCurrentView(item.id)}
                 className={`w-full flex items-center space-x-3 px-3 py-2 mb-2 rounded-lg transition-colors ${
                   currentView === item.id ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-700'
                 }`}
               >
                 <Icon className="w-5 h-5" />
                 {!sidebarCollapsed && <span>{item.label}</span>}
               </button>
             );
           })}
         </nav>
         
         <div className="p-4">
           <button
             onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
             className="w-full flex items-center justify-center p-2 text-gray-400 hover:text-white transition-colors"
           >
             <ArrowUpDown className="w-5 h-5" />
           </button>
         </div>
       </div>

       {/* Main Content */}
       <div className="flex-1 flex flex-col overflow-hidden">
         {/* Mobile Header */}
         <MobileHeader />
         
         <div className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6 overflow-auto">
           {/* Desktop Header - Simplified */}
           <div className="hidden lg:flex justify-between items-center mb-8">
             <div className="flex items-center space-x-8">
               <h1 className="text-2xl font-bold">
                 {currentView === 'dashboard' && 'Dashboard'}
                 {currentView === 'analytics' && 'Portfolio Analytics'}
                 {currentView === 'assets' && 'Asset Management'}
                 {currentView === 'transactions' && 'Transaction History'}
                 {currentView === 'settings' && 'Settings'}
               </h1>
             </div>
             <div className="flex items-center space-x-4">
               <button
                 onClick={() => setShowBalances(!showBalances)}
                 className="text-gray-400 hover:text-white transition-colors"
               >
                 {showBalances ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
               </button>
               <button 
                 onClick={handleRefreshPrices}
                 disabled={loading}
                 className="flex items-center space-x-2 px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
               >
                 <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                 <span>Refresh</span>
               </button>
             </div>
           </div>

           {/* Error Display */}
           {error && (
             <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 mb-6">
               <p className="text-red-400">Error: {error}</p>
             </div>
           )}

           {/* Dashboard Content */}
           {currentView === 'dashboard' && (
             <div className="space-y-6">
               {/* Mobile Portfolio Card */}
               <div className="lg:hidden">
                 <MobilePortfolioCard />
               </div>

               {/* Desktop Portfolio Value */}
               <div className="hidden lg:block bg-gray-800 rounded-xl p-6">
                 <div className="flex items-center justify-between mb-4">
                   <div>
                     <p className="text-gray-400 text-sm mb-1">Total Worth</p>
                     <div className="flex items-center space-x-4">
                       <h2 className="text-4xl font-bold">{formatCurrency(totalValue, 5)}</h2>
                       <button
                         onClick={() => setShowBalances(!showBalances)}
                         className="text-gray-400 hover:text-white transition-colors"
                       >
                         {showBalances ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                       </button>
                       {loading && <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />}
                     </div>
                     <div className="flex items-center space-x-2 mt-2">
                       <span className={`text-sm ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                         {totalPnL >= 0 ? '+' : ''}{formatCurrency(totalPnL, 2)}
                       </span>
                       <span className={`text-sm flex items-center ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                         {totalPnL >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                         {totalPnLPercent.toFixed(2)}%
                       </span>
                       <span className="text-gray-400 text-sm">All Time</span>
                     </div>
                     {lastUpdated && (
                       <p className="text-xs text-gray-500 mt-1">
                         Last updated: {new Date(lastUpdated).toLocaleTimeString()}
                       </p>
                     )}
                   </div>
                   
                   {/* Pie Chart */}
                   <div className="flex items-center justify-center">
                     <div className="relative">
                       <ResponsiveContainer width={200} height={200}>
                         <PieChart>
                           <Pie
                             data={pieData}
                             cx={100}
                             cy={100}
                             innerRadius={60}
                             outerRadius={90}
                             paddingAngle={2}
                             dataKey="value"
                           >
                             {pieData.map((entry, index) => (
                               <Cell key={`cell-${index}`} fill={entry.color} />
                             ))}
                           </Pie>
                           <Tooltip 
                             content={({ active, payload }) => {
                               if (active && payload && payload.length) {
                                 const data = payload[0].payload;
                                 return (
                                   <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg">
                                     <p className="text-white font-medium">{data.name}</p>
                                     <p className="text-gray-300">{data.value.toFixed(2)}%</p>
                                     <p className="text-gray-300">{formatCurrency(data.total, 6)}</p>
                                   </div>
                                 );
                               }
                               return null;
                             }}
                           />
                         </PieChart>
                       </ResponsiveContainer>
                       <div className="absolute inset-0 flex items-center justify-center flex-col">
                         <div className="text-lg font-bold">{formatCurrency(totalValue, 2)}</div>
                         <div className="text-sm text-gray-400">Portfolio</div>
                       </div>
                     </div>
                   </div>

                   <button 
                     onClick={handleRefreshPrices}
                     disabled={loading}
                     className="flex items-center space-x-2 px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
                   >
                     <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                     <span>Sync All</span>
                   </button>
                 </div>
               </div>

               {/* Assets Section */}
               <div className="space-y-4">
                 <div className="flex items-center justify-between">
                   <h3 className="text-xl font-semibold">Assets</h3>
                   <div className="hidden lg:flex items-center space-x-2">
                     <button 
                       onClick={() => setShowAddAssetModal(true)}
                       className="flex items-center space-x-2 px-3 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                     >
                       <Plus className="w-4 h-4" />
                       <span>Add Asset</span>
                     </button>
                     <button className="text-blue-400 hover:text-blue-300 transition-colors">
                       See More Assets
                     </button>
                   </div>
                 </div>

                 {/* Mobile Asset Cards */}
                 <div className="lg:hidden space-y-4">
                   {assetsWithHoldings.map((asset) => (
                     <MobileAssetCard key={asset.id} asset={asset} />
                   ))}
                 </div>

                 {/* Desktop Asset Table */}
                 <div className="hidden lg:block bg-gray-800 rounded-xl p-6">
                   <div className="overflow-x-auto">
                     <table className="w-full">
                       <thead>
                         <tr className="text-gray-400 text-sm border-b border-gray-700">
                           <th className="text-left py-3">Name</th>
                           <th className="text-right py-3">Amount</th>
                           <th className="text-right py-3">24h Change</th>
                           <th className="text-right py-3">Price</th>
                           <th className="text-right py-3">Total</th>
                           <th className="text-right py-3">Avg Buy</th>
                           <th className="text-right py-3">P/L</th>
                           <th className="text-right py-3"></th>
                         </tr>
                       </thead>
                       <tbody>
                         {assetsWithHoldings.map((asset) => {
                           const pnl = calculatePnL(asset);
                           const pnlPercent = calculatePnLPercent(asset);
                           const total = asset.amount * asset.price;
                           
                           return (
                             <tr key={asset.id} className="border-b border-gray-700 hover:bg-gray-700 transition-colors">
                               <td className="py-4">
                                 <div className="flex items-center space-x-3">
                                   <CryptoLogo symbol={asset.symbol} size={32} />
                                   <div>
                                     <div className="font-medium">{asset.name}</div>
                                     <div className="text-gray-400 text-sm">{asset.symbol}</div>
                                   </div>
                                 </div>
                               </td>
                               <td className="text-right py-4">
                                 <div className="font-mono text-sm">
                                   {formatValue(asset.amount, 8)}
                                 </div>
                               </td>
                               <td className="text-right py-4">
                                 <span className={`text-sm ${asset.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                   {asset.change24h >= 0 ? '+' : ''}{asset.change24h?.toFixed(2) || 0}%
                                 </span>
                               </td>
                               <td className="text-right py-4">
                                 <div className="font-mono">{formatCurrency(asset.price)}</div>
                               </td>
                               <td className="text-right py-4">
                                 <div className="font-mono">{formatCurrency(total, 6)}</div>
                               </td>
                               <td className="text-right py-4">
                                 <div className="font-mono">{formatCurrency(asset.avgBuy)}</div>
                               </td>
                               <td className="text-right py-4">
                                 <div className={`${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                   <div className="font-mono">
                                     {showBalances ? `${pnl >= 0 ? '+' : ''}${formatCurrency(pnl)}` : '$****'}
                                   </div>
                                   <div className="text-xs">
                                     {pnl >= 0 ? '▲' : '▼'} {Math.abs(pnlPercent).toFixed(2)}%
                                   </div>
                                 </div>
                               </td>
                               <td className="text-right py-4">
                                 <button 
                                   onClick={() => handleEditAsset(asset)}
                                   className="text-gray-400 hover:text-white transition-colors"
                                 >
                                   <Settings className="w-4 h-4" />
                                 </button>
                               </td>
                             </tr>
                           );
                         })}
                       </tbody>
                     </table>
                   </div>
                 </div>

                 {/* Recent Transactions - Mobile */}
                 <div className="lg:hidden space-y-4">
                   <h3 className="text-xl font-semibold">Recent Transactions</h3>
                   {transactions.slice(0, 3).map((tx) => {
                     const asset = assets.find(a => a.id === tx.assetId);
                     return (
                       <div key={tx.id} className="bg-gray-800 rounded-xl p-4">
                         <div className="flex items-center justify-between">
                           <div className="flex items-center space-x-3">
                             <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${
                               tx.type === 'buy' ? 'bg-green-600' : 'bg-red-600'
                             }`}>
                               {tx.type === 'buy' ? '↗' : '↙'}
                             </div>
                             <div>
                               <div className="font-medium text-white capitalize">{tx.type} {asset?.symbol}</div>
                               <div className="text-sm text-gray-400">
                                 {new Date(tx.date).toLocaleDateString()}
                               </div>
                             </div>
                           </div>
                           <div className="text-right">
                             <div className="font-mono text-white">{formatCurrency(tx.total)}</div>
                             <div className="text-xs text-gray-400">
                               {formatValue(tx.amount, 4)} @ {formatCurrency(tx.price)}
                             </div>
                           </div>
                         </div>
                       </div>
                     );
                   })}
                   <button 
                     onClick={() => setCurrentView('transactions')}
                     className="w-full py-3 text-blue-400 hover:text-blue-300 transition-colors text-center"
                   >
                     View All Transactions
                   </button>
                 </div>

                 {/* Desktop Sidebar Transactions */}
                 <div className="hidden lg:block lg:col-span-4">
                   <div className="bg-gray-800 rounded-xl p-6">
                     <div className="flex justify-between items-center mb-6">
                       <h3 className="text-xl font-semibold">Recent Transactions</h3>
                       <button 
                         onClick={() => setCurrentView('transactions')}
                         className="text-blue-400 hover:text-blue-300 transition-colors"
                       >
                         See More Activity
                       </button>
                     </div>
                     
                     <div className="space-y-4">
                       {transactions.slice(0, 5).map((tx) => {
                         const asset = assets.find(a => a.id === tx.assetId);
                         return (
                           <div key={tx.id} className="flex items-center justify-between py-3 border-b border-gray-700 last:border-b-0">
                             <div className="flex items-center space-x-3">
                               <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${
                                 tx.type === 'buy' ? 'bg-green-600' : 
                                 tx.type === 'sell' ? 'bg-red-600' : 'bg-blue-600'
                               }`}>
                                 {tx.type === 'buy' ? '↗' : tx.type === 'sell' ? '↙' : '→'}
                               </div>
                               <div>
                                 <div className="font-medium text-sm capitalize">{tx.type}</div>
                                 <div className="text-gray-400 text-xs">{asset?.symbol || 'Unknown'}</div>
                               </div>
                             </div>
                             <div className="text-right">
                               <div className="font-mono text-sm">{formatCurrency(tx.total)}</div>
                               <div className="text-xs text-gray-400">
                                 {new Date(tx.date).toLocaleDateString()}
                               </div>
                             </div>
                           </div>
                         );
                       })}
                     </div>
                   </div>
                 </div>
               </div>
             </div>
           )}

           {/* Other Views */}
           {currentView === 'analytics' && (
             <Fragment>
               <AnalyticsDashboard />
             </Fragment>
           )}
           {currentView === 'assets' && (
             <Fragment>
               <AssetManagement />
             </Fragment>
           )}
           {currentView === 'transactions' && (
             <Fragment>
               <TransactionManager />
             </Fragment>
           )}
           {currentView === 'settings' && (
             <div className="space-y-6">
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
                       onClick={() => setShowBalances(!showBalances)}
                       className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                         showBalances ? 'bg-blue-600' : 'bg-gray-600'
                       }`}
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
           )}
         </div>
       </div>
     </div>

     {/* Mobile Bottom Navigation */}
     <MobileBottomNav />

     {/* Add Asset Modal */}
     <AddAssetModal
       isOpen={showAddAssetModal}
       onClose={() => setShowAddAssetModal(false)}
       onAddAsset={handleAddAsset}
     />

     {/* Edit Asset Modal */}
     <EditAssetModal
       isOpen={showEditAssetModal}
       onClose={() => setShowEditAssetModal(false)}
       asset={selectedAsset}
       onUpdateAsset={handleUpdateAsset}
       onRemoveAsset={handleRemoveAsset}
     />

     {/* Add Transaction Modal */}
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