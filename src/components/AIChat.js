import React, { useState, useRef, useEffect } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { 
  Send, Upload, Image, Bot, User, Loader2, AlertCircle, 
  CheckCircle, X, Plus, TrendingUp, TrendingDown, DollarSign,
  BarChart3, HelpCircle, Camera, FileText, Sparkles, Paperclip,
  MessageSquare, ChevronDown, Settings
} from 'lucide-react';
import CryptoLogo from './CryptoLogo';
import aiService from '../services/aiService';

const AIChat = () => {
  const { 
    assets, 
    transactions, 
    totalValue, 
    totalPnL, 
    totalPnLPercent,
    addTransaction,
    addAsset,
    loading: portfolioLoading 
  } = usePortfolio();

  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: `Hi! I'm your AI Portfolio Assistant 👋

I can help you:
• Check your portfolio value and performance
• Analyze your investments
• Add transactions from screenshots
• Parse transactions from natural language

**To add a transaction, type:**
• "buy" + amount + asset + "at" + price
• "sell" + amount + asset + "for" + price

**To check your portfolio:**
• "What's my portfolio worth?"
• "Show my best performer"

How can I help you today?`,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [extractedTransactions, setExtractedTransactions] = useState([]);
  const [showTransactionConfirm, setShowTransactionConfirm] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [showApiKeyPrompt, setShowApiKeyPrompt] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [useRealAI, setUseRealAI] = useState(false);

  // Check if API key is configured on mount
  useEffect(() => {
    const hasApiKey = aiService.isConfigured();
    setUseRealAI(hasApiKey);
    if (!hasApiKey && localStorage.getItem('ai_prompt_shown') !== 'true') {
      setShowApiKeyPrompt(true);
      localStorage.setItem('ai_prompt_shown', 'true');
    }
  }, []);
  
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Check if user has scrolled up
  useEffect(() => {
    const handleScroll = () => {
      if (chatContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
        setShowScrollDown(!isAtBottom && messages.length > 3);
      }
    };

    const container = chatContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [messages.length]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollDown(false);
  };

  // Format currency
  const formatCurrency = (value, decimals = 2) => {
    return `$${value.toLocaleString(undefined, { 
      minimumFractionDigits: decimals, 
      maximumFractionDigits: decimals 
    })}`;
  };

  // Parse transaction from natural language
  const parseTransactionFromText = (text) => {
    const lowerText = text.toLowerCase();
    
    // Common crypto symbols and their full names
    const cryptoMap = {
      'btc': 'Bitcoin',
      'bitcoin': 'Bitcoin',
      'eth': 'Ethereum',
      'ethereum': 'Ethereum',
      'bnb': 'Binance Coin',
      'ada': 'Cardano',
      'cardano': 'Cardano',
      'sol': 'Solana',
      'solana': 'Solana',
      'xrp': 'Ripple',
      'ripple': 'Ripple',
      'dot': 'Polkadot',
      'polkadot': 'Polkadot',
      'doge': 'Dogecoin',
      'dogecoin': 'Dogecoin',
      'matic': 'Polygon',
      'polygon': 'Polygon',
      'link': 'Chainlink',
      'chainlink': 'Chainlink',
      'avax': 'Avalanche',
      'avalanche': 'Avalanche',
      'usdt': 'Tether',
      'tether': 'Tether',
      'usdc': 'USD Coin',
      'usd coin': 'USD Coin'
    };

    // Patterns to match
    const patterns = [
      // "bought 0.2 BTC at/for 55k"
      /(?:bought|purchased|buy)\s+(\d+\.?\d*)\s+(\w+)\s+(?:at|for)\s+\$?(\d+\.?\d*k?)/i,
      // "sold 0.2 BTC at/for 55k"
      /(?:sold|sell)\s+(\d+\.?\d*)\s+(\w+)\s+(?:at|for)\s+\$?(\d+\.?\d*k?)/i,
      // "bought 0.2 BTC at/for $55,000"
      /(?:bought|purchased|buy)\s+(\d+\.?\d*)\s+(\w+)\s+(?:at|for)\s+\$?([\d,]+)/i,
      // "sold 0.2 BTC at/for $55,000"
      /(?:sold|sell)\s+(\d+\.?\d*)\s+(\w+)\s+(?:at|for)\s+\$?([\d,]+)/i,
      // "0.2 BTC bought at 55k"
      /(\d+\.?\d*)\s+(\w+)\s+(?:bought|purchased)\s+(?:at|for)\s+\$?(\d+\.?\d*k?)/i,
      // "0.2 BTC sold at 55k"
      /(\d+\.?\d*)\s+(\w+)\s+(?:sold)\s+(?:at|for)\s+\$?(\d+\.?\d*k?)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const amount = parseFloat(match[1]);
        const cryptoSymbol = match[2].toLowerCase();
        let price = match[3].replace(/,/g, '');
        
        // Convert k notation (55k = 55000)
        if (price.includes('k')) {
          price = parseFloat(price.replace('k', '')) * 1000;
        } else {
          price = parseFloat(price);
        }

        // Determine transaction type
        const type = lowerText.includes('sold') || lowerText.includes('sell') ? 'sell' : 'buy';
        
        // Get crypto name
        const cryptoName = cryptoMap[cryptoSymbol] || cryptoSymbol.toUpperCase();
        
        // Check for date mentions
        let date = new Date();
        if (lowerText.includes('today')) {
          date = new Date();
        } else if (lowerText.includes('yesterday')) {
          date = new Date(Date.now() - 86400000);
        } else if (lowerText.includes('last week')) {
          date = new Date(Date.now() - 7 * 86400000);
        }

        return {
          type,
          amount,
          assetSymbol: cryptoSymbol.toUpperCase(),
          assetName: cryptoName,
          price,
          total: amount * price,
          date: date.toISOString(),
          fee: 0, // Can be parsed if mentioned
          parsed: true
        };
      }
    }

    return null;
  };

  // Cache for common queries
  const commonResponses = {
    'portfolio value': () => `Your portfolio is worth ${formatCurrency(totalValue)}`,
    'how many assets': () => `You have ${assets.filter(a => a.amount > 0).length} assets`,
    'best performer': () => {
      const bestAsset = assets
        .filter(a => a.amount > 0)
        .reduce((best, asset) => {
          const currentPnl = ((asset.price - asset.avgBuy) / asset.avgBuy) * 100;
          const bestPnl = best ? ((best.price - best.avgBuy) / best.avgBuy) * 100 : -Infinity;
          return currentPnl > bestPnl ? asset : best;
        }, null);
      
      if (!bestAsset) return "You don't have any assets with gains yet.";
      
      const pnlPercent = ((bestAsset.price - bestAsset.avgBuy) / bestAsset.avgBuy) * 100;
      return `Your best performing asset is ${bestAsset.name} (${bestAsset.symbol}) with a gain of ${pnlPercent.toFixed(2)}%!`;
    },
    'worst performer': () => {
      const worstAsset = assets
        .filter(a => a.amount > 0)
        .reduce((worst, asset) => {
          const currentPnl = ((asset.price - asset.avgBuy) / asset.avgBuy) * 100;
          const worstPnl = worst ? ((worst.price - worst.avgBuy) / worst.avgBuy) * 100 : Infinity;
          return currentPnl < worstPnl ? asset : worst;
        }, null);
      
      if (!worstAsset) return "All your assets are performing well!";
      
      const pnlPercent = ((worstAsset.price - worstAsset.avgBuy) / worstAsset.avgBuy) * 100;
      return `Your worst performing asset is ${worstAsset.name} (${worstAsset.symbol}) with a ${pnlPercent >= 0 ? 'gain' : 'loss'} of ${pnlPercent.toFixed(2)}%`;
    }
  };

  // Simulate AI response based on user query
  const generateAIResponse = async (userMessage) => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Check if user is trying to add a transaction
    const transactionData = parseTransactionFromText(userMessage);
    if (transactionData) {
      return {
        type: 'transaction',
        data: transactionData
      };
    }
    
    // Portfolio value queries
    if (lowerMessage.includes('portfolio value') || lowerMessage.includes('total value') || lowerMessage.includes('worth')) {
      return `Your portfolio is currently worth **${formatCurrency(totalValue)}** 💰\n\n${
        totalPnL >= 0 
          ? `You're up ${formatCurrency(totalPnL)} (${totalPnLPercent.toFixed(2)}%) overall! 🚀` 
          : `You're down ${formatCurrency(Math.abs(totalPnL))} (${Math.abs(totalPnLPercent).toFixed(2)}%) overall. 📉`
      }\n\nWould you like me to show you a breakdown of your assets?`;
    }

    // Asset queries
    if (lowerMessage.includes('how many') && (lowerMessage.includes('asset') || lowerMessage.includes('coin') || lowerMessage.includes('crypto'))) {
      const activeAssets = assets.filter(a => a.amount > 0);
      return `You currently hold **${activeAssets.length} different cryptocurrencies** in your portfolio. 📊\n\nYour largest holdings are:\n${
        activeAssets
          .sort((a, b) => (b.amount * b.price) - (a.amount * a.price))
          .slice(0, 3)
          .map((asset, index) => `\n${index + 1}. **${asset.name}** (${asset.symbol}): ${formatCurrency(asset.amount * asset.price)} - ${((asset.amount * asset.price / totalValue) * 100).toFixed(1)}% of portfolio`)
          .join('')
      }`;
    }

    // Best performer
    if (lowerMessage.includes('best') && (lowerMessage.includes('perform') || lowerMessage.includes('gain'))) {
      const bestAsset = assets
        .filter(a => a.amount > 0)
        .reduce((best, asset) => {
          const currentPnl = ((asset.price - asset.avgBuy) / asset.avgBuy) * 100;
          const bestPnl = best ? ((best.price - best.avgBuy) / best.avgBuy) * 100 : -Infinity;
          return currentPnl > bestPnl ? asset : best;
        }, null);

      if (bestAsset) {
        const pnlPercent = ((bestAsset.price - bestAsset.avgBuy) / bestAsset.avgBuy) * 100;
        return `Your best performing asset is **${bestAsset.name} (${bestAsset.symbol})** with a gain of **${pnlPercent.toFixed(2)}%**! 🏆\n\n• Current price: ${formatCurrency(bestAsset.price)}\n• Average buy price: ${formatCurrency(bestAsset.avgBuy)}\n• Holdings: ${bestAsset.amount} ${bestAsset.symbol}\n• Total value: ${formatCurrency(bestAsset.amount * bestAsset.price)}`;
      }
      return "You don't have any assets with gains yet. Keep holding! 💎🙌";
    }

    // Recent transactions
    if (lowerMessage.includes('recent') && lowerMessage.includes('transaction')) {
      const recentTx = transactions.slice(0, 5);
      if (recentTx.length === 0) {
        return "You don't have any transactions yet. Would you like to add one? You can also upload a screenshot of your trades!";
      }
      
      return `Here are your ${Math.min(5, recentTx.length)} most recent transactions:\n${
        recentTx.map((tx, index) => {
          const asset = assets.find(a => a.id === tx.assetId);
          const date = new Date(tx.date);
          return `\n${index + 1}. **${tx.type.toUpperCase()}** ${asset?.symbol || 'Unknown'} - ${formatCurrency(tx.total)}\n   ${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        }).join('')
      }\n\nNeed help with anything else?`;
    }

    // Help queries
    if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
      return `I'm here to help you manage your crypto portfolio! Here's what I can do:\n\n**📊 Portfolio Analysis**\n• Check your total portfolio value\n• Find your best/worst performing assets\n• Analyze your profit/loss\n• Show asset allocation\n\n**💬 Natural Language Transactions**\n• Just tell me about your trades naturally!\n• "I bought 0.5 BTC at 45k today"\n• "Sold 2 ETH for $3,200 each"\n• "Purchased 100 ADA at $1.50 yesterday"\n\n**📸 Screenshot Analysis**\n• Upload screenshots of your trades\n• I'll extract transaction details automatically\n• Review and add them to your portfolio\n\n**Try these examples:**\n• "I bought 0.2 BTC at 55k"\n• "What's my portfolio worth?"\n• "Show my best performing asset"\n• "How many cryptos do I own?"`;
    }

    // Worst performer
    if (lowerMessage.includes('worst') && (lowerMessage.includes('perform') || lowerMessage.includes('loss'))) {
      const worstAsset = assets
        .filter(a => a.amount > 0)
        .reduce((worst, asset) => {
          const currentPnl = ((asset.price - asset.avgBuy) / asset.avgBuy) * 100;
          const worstPnl = worst ? ((worst.price - worst.avgBuy) / worst.avgBuy) * 100 : Infinity;
          return currentPnl < worstPnl ? asset : worst;
        }, null);

      if (worstAsset) {
        const pnlPercent = ((worstAsset.price - worstAsset.avgBuy) / worstAsset.avgBuy) * 100;
        return `Your worst performing asset is **${worstAsset.name} (${worstAsset.symbol})** with a ${pnlPercent >= 0 ? 'gain' : 'loss'} of **${pnlPercent.toFixed(2)}%** 📉\n\n• Current price: ${formatCurrency(worstAsset.price)}\n• Average buy price: ${formatCurrency(worstAsset.avgBuy)}\n• Holdings: ${worstAsset.amount} ${worstAsset.symbol}\n• Total value: ${formatCurrency(worstAsset.amount * worstAsset.price)}\n\n${pnlPercent < -20 ? "Remember: You only lose if you sell! Consider if this is still a good long-term investment. 💎🙌" : ""}`;
      }
      return "All your assets are performing well! 🎉";
    }

    // Asset breakdown
    if (lowerMessage.includes('breakdown') || lowerMessage.includes('allocation') || lowerMessage.includes('all assets')) {
      const activeAssets = assets.filter(a => a.amount > 0);
      if (activeAssets.length === 0) {
        return "You don't have any assets in your portfolio yet. Would you like to add some?";
      }
      
      return `Here's your complete portfolio breakdown:\n${
        activeAssets
          .sort((a, b) => (b.amount * b.price) - (a.amount * a.price))
          .map((asset) => {
            const value = asset.amount * asset.price;
            const allocation = (value / totalValue) * 100;
            const pnl = ((asset.price - asset.avgBuy) / asset.avgBuy) * 100;
            return `\n**${asset.name} (${asset.symbol})**\n• Value: ${formatCurrency(value)} (${allocation.toFixed(1)}%)\n• P&L: ${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}%\n• Holdings: ${asset.amount}`;
          }).join('\n')
      }\n\n**Total Portfolio: ${formatCurrency(totalValue)}**`;
    }

    // Default response
    return "I can help you analyze your portfolio, check specific assets, review transactions, or add new ones from screenshots. What would you like to know?\n\n**Quick actions:**\n• Check portfolio value\n• See best performers\n• View recent transactions\n• Upload trade screenshot";
  };

  // Simulate transaction extraction from image
  const extractTransactionsFromImage = async () => {
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock extracted transactions
    const mockTransactions = [
      {
        type: 'buy',
        assetSymbol: 'BTC',
        assetName: 'Bitcoin',
        amount: 0.0015,
        price: 45000,
        total: 67.5,
        date: new Date().toISOString(),
        fee: 2.5,
        extracted: true
      },
      {
        type: 'buy',
        assetSymbol: 'ETH',
        assetName: 'Ethereum',
        amount: 0.25,
        price: 3200,
        total: 800,
        date: new Date(Date.now() - 86400000).toISOString(),
        fee: 5,
        extracted: true
      }
    ];
    
    return mockTransactions;
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() && !uploadedImage) return;

    const userMessageText = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    try {
      if (uploadedImage) {
        // Handle image analysis
        let extractedTx;
        
        if (useRealAI && aiService.isConfigured()) {
          try {
            console.log('Using real AI for image analysis...');
            console.log('Image preview length:', imagePreview?.length);
            console.log('Image preview start:', imagePreview?.substring(0, 50));
            
            // Use real AI for image analysis
            extractedTx = await aiService.analyzeTransactionImage(imagePreview);
            
            console.log('AI extracted transactions:', extractedTx);
            
            // If AI returns empty array, show appropriate message
            if (!extractedTx || extractedTx.length === 0) {
              const noTransactionsMsg = {
                id: Date.now() + 1,
                type: 'bot',
                content: "I couldn't extract any clear transaction details from this screenshot. Please make sure the image shows:\n\n• Transaction type (buy/sell)\n• Asset name and amount\n• Price information\n\nTry uploading a clearer screenshot of your transaction details.",
                timestamp: new Date()
              };
              setMessages(prev => [...prev, noTransactionsMsg]);
              setUploadedImage(null);
              setImagePreview(null);
              setIsLoading(false);
              return;
            }
            
          } catch (error) {
            console.error('AI image analysis error:', error);
            
            // Show error message
            const errorMsg = {
              id: Date.now() + 0.5,
              type: 'bot',
              content: `⚠️ Vision API Error: ${error.message}\n\nFalling back to demonstration mode with sample data.`,
              timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);
            
            // Use mock data as fallback
            extractedTx = await extractTransactionsFromImage();
          }
        } else {
          console.log('Using mock data - AI not configured or useRealAI is false');
          console.log('useRealAI:', useRealAI);
          console.log('isConfigured:', aiService.isConfigured());
          
          // Use mock data
          extractedTx = await extractTransactionsFromImage();
        }
        
        setExtractedTransactions(extractedTx);
        
        const botResponse = {
          id: Date.now() + 1,
          type: 'bot',
          content: `Great! I've analyzed your screenshot and found **${extractedTx.length} transactions**. Here's what I extracted:`,
          transactions: extractedTx,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, botResponse]);
        setShowTransactionConfirm(true);
        setUploadedImage(null);
        setImagePreview(null);
      } else {
        // For text-only messages, first check if it's a transaction
        let response;
        
        if (useRealAI && aiService.isConfigured()) {
          // Create a temporary message array with the new user message
          const tempMessages = [...messages, {
            id: Date.now(),
            type: 'user',
            content: userMessageText,
            timestamp: new Date()
          }];
          
          // Use AI service to parse
          const aiResponse = await aiService.batchRequest(tempMessages, {
            assets,
            transactions,
            totalValue,
            totalPnL,
            totalPnLPercent
          });
          
          // Now add the user message to the actual messages
          const userMessage = {
            id: Date.now(),
            type: 'user',
            content: userMessageText,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, userMessage]);
          
          if (aiResponse.type === 'transaction') {
            // Handle transaction
            const tx = aiResponse.data;
            setExtractedTransactions([tx]);
            
            const botResponse = {
              id: Date.now() + 1,
              type: 'bot',
              content: `I understood that you want to ${tx.type} **${tx.amount} ${tx.assetSymbol}** at **${formatCurrency(tx.price)}** for a total of **${formatCurrency(tx.total)}**.\n\nLet me add this transaction to your portfolio:`,
              transactions: [tx],
              timestamp: new Date()
            };
            
            setMessages(prev => [...prev, botResponse]);
            setShowTransactionConfirm(true);
            setIsLoading(false);
            return;
          } else {
            // Regular response
            response = aiResponse.content;
          }
        } else {
          // No AI - use local parsing
          const transactionData = parseTransactionFromText(userMessageText);
          
          // Add user message
          const userMessage = {
            id: Date.now(),
            type: 'user',
            content: userMessageText,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, userMessage]);
          
          if (transactionData) {
            setExtractedTransactions([transactionData]);
            
            const botResponse = {
              id: Date.now() + 1,
              type: 'bot',
              content: `I understood that you want to ${transactionData.type} **${transactionData.amount} ${transactionData.assetSymbol}** at **${formatCurrency(transactionData.price)}** for a total of **${formatCurrency(transactionData.total)}**.\n\nLet me add this transaction to your portfolio:`,
              transactions: [transactionData],
              timestamp: new Date()
            };
            
            setMessages(prev => [...prev, botResponse]);
            setShowTransactionConfirm(true);
            setIsLoading(false);
            return;
          } else {
            response = await generateAIResponse(userMessageText);
          }
        }
        
        // Send the text response
        const botResponse = {
          id: Date.now() + 1,
          type: 'bot',
          content: response,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, botResponse]);
      }
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
      
      // Add user message even on error
      const userMessage = {
        id: Date.now(),
        type: 'user',
        content: userMessageText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);
      
      const errorResponse = {
        id: Date.now() + 1,
        type: 'bot',
        content: "I'm sorry, I encountered an error processing your request. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddExtractedTransactions = async () => {
    for (const tx of extractedTransactions) {
      // Find or create asset
      let asset = assets.find(a => a.symbol === tx.assetSymbol);
      
      if (!asset) {
        // Add new asset if it doesn't exist
        const newAsset = {
          id: tx.assetSymbol.toLowerCase(),
          name: tx.assetName,
          symbol: tx.assetSymbol,
          amount: 0,
          price: tx.price,
          avgBuy: tx.price,
          change24h: 0,
          color: `#${Math.floor(Math.random()*16777215).toString(16)}`
        };
        addAsset(newAsset);
        asset = newAsset;
      }

      // Add transaction
      const transaction = {
        id: Date.now() + Math.random(),
        type: tx.type,
        assetId: asset.id,
        amount: tx.amount,
        price: tx.price,
        total: tx.total,
        fee: tx.fee || 0,
        date: tx.date,
        notes: 'Added via AI screenshot analysis'
      };
      
      addTransaction(transaction);
    }

    const confirmMessage = {
      id: Date.now() + 2,
      type: 'bot',
      content: `✅ Successfully added ${extractedTransactions.length} transactions to your portfolio!\n\nYour portfolio has been updated. Would you like to:\n• Check your new portfolio value\n• See your updated holdings\n• Add more transactions`,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, confirmMessage]);
    setExtractedTransactions([]);
    setShowTransactionConfirm(false);
  };

  const suggestedQuestions = [
    "I bought 0.5 ETH at $2,500",
    "What's my portfolio value?",
    "Show my best performer",
    "Recent transactions"
  ];

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-120px)] bg-gray-900/50 rounded-2xl border border-gray-800/50">
      {/* Chat Messages */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth"
      >
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
            <div className={`flex items-start space-x-3 max-w-[85%] md:max-w-[70%] ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                message.type === 'user' 
                  ? 'bg-blue-600' 
                  : 'bg-gradient-to-br from-purple-600 to-blue-600'
              }`}>
                {message.type === 'user' ? (
                  <User className="w-5 h-5 text-white" />
                ) : (
                  <Sparkles className="w-5 h-5 text-white" />
                )}
              </div>
              
              <div className="flex-1">
                <div className={`rounded-2xl px-4 py-3 ${
                  message.type === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-800/80 text-gray-100 border border-gray-700/50'
                }`}>
                  {message.image && (
                    <img src={message.image} alt="Uploaded" className="mb-3 rounded-lg max-h-48 object-cover" />
                  )}
                  <div 
                    className="whitespace-pre-wrap text-sm leading-relaxed" 
                    dangerouslySetInnerHTML={{ 
                      __html: message.content
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/•/g, '&nbsp;&nbsp;•')
                    }}
                  />
                  
                  {/* Display extracted transactions */}
                  {message.transactions && (
                    <div className="mt-4 space-y-3">
                      {message.transactions.map((tx, index) => (
                        <div key={index} className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/50">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                                tx.type === 'buy' ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'
                              }`}>
                                {tx.type.toUpperCase()}
                              </div>
                              <span className="font-semibold text-white">{tx.assetSymbol}</span>
                              <span className="text-gray-400 text-sm">{tx.assetName}</span>
                            </div>
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-gray-500">Amount:</span>
                              <span className="ml-2 text-white font-medium">{tx.amount}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Price:</span>
                              <span className="ml-2 text-white font-medium">{formatCurrency(tx.price)}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Total:</span>
                              <span className="ml-2 text-white font-medium">{formatCurrency(tx.total)}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Date:</span>
                              <span className="ml-2 text-white font-medium">{new Date(tx.date).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {showTransactionConfirm && (
                        <div className="flex items-center justify-end space-x-3 mt-4 pt-4 border-t border-gray-700/50">
                          <button
                            onClick={() => {
                              setShowTransactionConfirm(false);
                              setExtractedTransactions([]);
                            }}
                            className="px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm font-medium"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleAddExtractedTransactions}
                            className="px-5 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:shadow-lg hover:shadow-green-600/25 transition-all duration-200 flex items-center space-x-2 text-sm font-medium"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Add to Portfolio</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1.5 ml-1">
                  {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start animate-fadeIn">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div className="bg-gray-800/80 rounded-2xl px-4 py-3 border border-gray-700/50">
                <div className="flex items-center space-x-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={chatEndRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollDown && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-24 right-8 p-3 bg-gray-800 border border-gray-700 rounded-full shadow-lg hover:bg-gray-700 transition-all duration-200"
        >
          <ChevronDown className="w-5 h-5 text-white" />
        </button>
      )}

      {/* Suggested Questions - Only show when chat is empty or has only welcome message */}
      {messages.length === 1 && (
        <div className="px-6 pb-2">
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => setInputMessage(question)}
                className="px-4 py-2 bg-gray-800/50 text-gray-300 rounded-full hover:bg-gray-700/50 transition-all duration-200 text-sm border border-gray-700/50 hover:border-gray-600"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-gray-800/50 p-4 bg-gray-900/30 backdrop-blur-sm">
        {imagePreview && (
          <div className="mb-3 inline-flex items-center space-x-2 bg-gray-800/50 rounded-lg p-2 border border-gray-700/50">
            <img src={imagePreview} alt="Preview" className="h-12 w-12 rounded object-cover" />
            <span className="text-sm text-gray-300">Image ready to send</span>
            <button
              onClick={() => {
                setUploadedImage(null);
                setImagePreview(null);
              }}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        )}
        
        <div className="flex items-end space-x-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-gray-400 hover:text-white bg-gray-800/50 rounded-xl hover:bg-gray-700/50 transition-all duration-200 border border-gray-700/50"
            title="Upload screenshot"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              placeholder="Ask about your portfolio or upload a screenshot..."
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 pr-12 transition-all duration-200"
            />
            <button
              onClick={handleSendMessage}
              disabled={(!inputMessage.trim() && !uploadedImage) || isLoading}
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all duration-200 ${
                (!inputMessage.trim() && !uploadedImage) || isLoading
                  ? 'text-gray-600 cursor-not-allowed' 
                  : 'text-blue-500 hover:bg-blue-500/10'
              }`}
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-gray-600">
            Upload screenshots of your trades and I'll automatically extract the transaction details
          </p>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowApiKeyPrompt(true)}
              className={`text-xs flex items-center space-x-1 px-2 py-1 rounded-lg transition-colors ${
                useRealAI 
                  ? 'text-green-400 bg-green-400/10 hover:bg-green-400/20' 
                  : 'text-gray-500 hover:text-gray-400'
              }`}
            >
              <Settings className="w-3 h-3" />
              <span>{useRealAI ? 'OpenAI Connected' : 'Connect OpenAI'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* API Key Configuration Modal */}
      {showApiKeyPrompt && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-2">Connect OpenAI</h3>
            <p className="text-gray-400 text-sm mb-4">
              Connect your OpenAI API key to enable advanced AI features like GPT-4 conversations and image analysis.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  OpenAI API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Get your API key from{' '}
                  <a 
                    href="https://platform.openai.com/api-keys" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300"
                  >
                    OpenAI Dashboard
                  </a>
                </p>
              </div>
              
              <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-3">
                <p className="text-xs text-blue-300">
                  <strong>Features unlocked:</strong>
                  <br />• Natural conversations with GPT-4
                  <br />• Advanced portfolio analysis
                  <br />• Automatic screenshot text extraction
                  <br />• Smarter transaction parsing
                </p>
              </div>
              
              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  onClick={() => {
                    setShowApiKeyPrompt(false);
                    setApiKey('');
                  }}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Skip for now
                </button>
                <button
                  onClick={() => {
                    if (apiKey.trim()) {
                      aiService.setApiKey(apiKey.trim());
                      setUseRealAI(true);
                      setShowApiKeyPrompt(false);
                      setApiKey('');
                      
                      // Add success message
                      const successMsg = {
                        id: Date.now() + 10,
                        type: 'bot',
                        content: "🎉 Great! I'm now connected to OpenAI GPT-4. I can provide more intelligent responses, better understand your questions, and analyze images more accurately. How can I help you with your portfolio?",
                        timestamp: new Date()
                      };
                      setMessages(prev => [...prev, successMsg]);
                    }
                  }}
                  disabled={!apiKey.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Connect
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIChat;