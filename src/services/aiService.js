import config from '../config/config';

// AI Service for connecting to OpenAI or other LLMs
class AIService {
  constructor() {
    this.apiKey = config.openai.apiKey || localStorage.getItem('openai_api_key') || '';
    this.baseURL = 'https://api.openai.com/v1';
    this.model = 'gpt-3.5-turbo'; // Cheaper model for text
    this.visionModel = 'gpt-4o'; // Updated vision model (or 'gpt-4-turbo' if you don't have access to gpt-4o)
    this.temperature = 0.3; // More deterministic = fewer tokens
    this.maxTokens = 150; // Limit response length
  }

  // Set API key (can be called from settings)
  setApiKey(apiKey) {
    this.apiKey = apiKey;
    localStorage.setItem('openai_api_key', apiKey);
  }

  // Get API key from localStorage
  getApiKey() {
    return this.apiKey || localStorage.getItem('openai_api_key');
  }

  // Check if API key is configured
  isConfigured() {
    return !!this.getApiKey();
  }

  // Logging utility
  log(message, data = {}) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[AIService] ${message}`, data);
    }
  }

  // Create system prompt with portfolio context
  createSystemPrompt(portfolio) {
    const { assets, totalValue, totalPnL, totalPnLPercent } = portfolio;
    return `You are a cryptocurrency portfolio assistant. 
Current portfolio context:
- Total Value: $${totalValue.toFixed(2)}
- Total P&L: ${totalPnL >= 0 ? '+' : ''}$${totalPnL.toFixed(2)} (${totalPnLPercent.toFixed(2)}%)
- Assets: ${assets.filter(a => a.amount > 0).length}

Help answer questions about the portfolio. DO NOT parse transactions - only answer portfolio questions.`;
  }

  // Batch request with local parsing priority
  async batchRequest(messages, portfolio) {
    this.log('Batch request called', {
      messageCount: messages.length,
      portfolioValue: portfolio.totalValue
    });

    try {
      // Get the last USER message (not bot message)
      const userMessages = messages.filter(m => m.type === 'user');
      const lastUserMessage = userMessages[userMessages.length - 1];
      
      if (!lastUserMessage) {
        return {
          type: 'response',
          content: 'How can I help you with your portfolio today?'
        };
      }
      
      const messageText = lastUserMessage.content;
      this.log('Processing user message:', messageText);
      
      // FIRST: Try local parsing for transactions
      const transactionData = this.parseTransactionLocally(messageText);
      
      if (transactionData) {
        this.log('Transaction parsed locally:', transactionData);
        return {
          type: 'transaction',
          data: transactionData
        };
      }
      
      // ONLY use OpenAI for non-transaction queries
      if (this.isConfigured()) {
        const lowerMessage = messageText.toLowerCase();
        const isPortfolioQuery = 
          lowerMessage.includes('portfolio') ||
          lowerMessage.includes('value') ||
          lowerMessage.includes('worth') ||
          lowerMessage.includes('performance') ||
          lowerMessage.includes('best') ||
          lowerMessage.includes('worst') ||
          lowerMessage.includes('how much') ||
          lowerMessage.includes('total');
        
        if (isPortfolioQuery) {
          return await this.getOpenAIResponse(messages, portfolio);
        }
      }
      
      // Default fallback response
      return {
        type: 'response',
        content: this.generateLocalResponse(messageText, portfolio)
      };

    } catch (error) {
      this.log('Batch request error:', error);
      return {
        type: 'response',
        content: `I encountered an error: ${error.message}. You can still add transactions by saying things like "buy 1 ETH at 3000" or "sold 0.5 BTC for 45000".`
      };
    }
  }

  // Local transaction parser
  parseTransactionLocally(text) {
    this.log('Attempting local parse of:', text);
    
    // Normalize text - remove extra spaces and lowercase
    const normalizedText = text.toLowerCase().trim().replace(/\s+/g, ' ');
    this.log('Normalized text:', normalizedText);
    
    // Enhanced patterns for better matching
    const patterns = [
      // Pattern 1: "buy X ASSET at PRICE" - most common format
      {
        regex: /(?:buy|bought|purchase|purchased)\s+(\d+(?:\.\d+)?)\s+([a-z]+)\s+(?:at|for|@)\s+\$?(\d+(?:\.\d+)?(?:k|m)?)/i,
        type: 'buy',
        name: 'Buy with at/for'
      },
      // Pattern 2: "sell X ASSET at PRICE"
      {
        regex: /(?:sell|sold)\s+(\d+(?:\.\d+)?)\s+([a-z]+)\s+(?:at|for|@)\s+\$?(\d+(?:\.\d+)?(?:k|m)?)/i,
        type: 'sell',
        name: 'Sell with at/for'
      },
      // Pattern 3: "buy X ASSET PRICE" - without "at"
      {
        regex: /(?:buy|bought|purchase|purchased)\s+(\d+(?:\.\d+)?)\s+([a-z]+)\s+\$?(\d+(?:\.\d+)?(?:k|m)?)/i,
        type: 'buy',
        name: 'Buy without at'
      },
      // Pattern 4: "sell X ASSET PRICE" - without "at"
      {
        regex: /(?:sell|sold)\s+(\d+(?:\.\d+)?)\s+([a-z]+)\s+\$?(\d+(?:\.\d+)?(?:k|m)?)/i,
        type: 'sell',
        name: 'Sell without at'
      }
    ];
    
    for (const pattern of patterns) {
      this.log(`Trying ${pattern.name}...`);
      const match = text.match(pattern.regex);
      
      if (match) {
        this.log(`${pattern.name} matched!`, match);
        const [fullMatch, amountStr, assetStr, priceStr] = match;
        
        // Parse amount
        const amount = parseFloat(amountStr);
        
        // Parse asset - uppercase and clean
        const asset = assetStr.toUpperCase().trim();
        
        // Parse price - handle k/m notation
        let price = priceStr.replace(/[$,]/g, '');
        if (price.toLowerCase().endsWith('k')) {
          price = parseFloat(price.slice(0, -1)) * 1000;
        } else if (price.toLowerCase().endsWith('m')) {
          price = parseFloat(price.slice(0, -1)) * 1000000;
        } else {
          price = parseFloat(price);
        }
        
        // Validate parsed values
        if (isNaN(amount) || isNaN(price) || amount <= 0 || price <= 0) {
          this.log('Invalid values parsed:', { amount, price });
          continue;
        }
        
        const result = {
          type: pattern.type,
          amount: amount,
          assetSymbol: asset,
          assetName: this.getCryptoName(asset),
          price: price,
          total: amount * price,
          date: new Date().toISOString(),
          fee: 0,
          parsed: true
        };
        
        this.log('Successfully parsed transaction:', result);
        return result;
      }
    }
    
    this.log('No transaction pattern matched');
    return null;
  }

  // Generate local response
  generateLocalResponse(message, portfolio) {
    const lower = message.toLowerCase();
    
    if (lower.includes('help')) {
      return `I can help you track your crypto portfolio! Here's what I can do:
      
**Add Transactions:**
• Type "buy" followed by amount, asset, and price
• Type "sell" followed by amount, asset, and price
• Use "at" or "for" to specify the price

**Check Portfolio:**
• Ask about your portfolio value
• Ask about your best performer
• Ask about your assets

Current portfolio value: $${portfolio.totalValue.toFixed(2)}`;
    }
    
    if (lower.includes('portfolio') && (lower.includes('value') || lower.includes('worth'))) {
      return `Your portfolio is currently worth **$${portfolio.totalValue.toFixed(2)}**`;
    }
    
    if (lower.includes('hi') || lower.includes('hello')) {
      return `Hi! I'm your AI Portfolio Assistant 👋

I can help you:
• Check your portfolio value and performance
• Analyze your investments
• Add transactions from screenshots
• Parse transactions from natural language

What would you like to do today?`;
    }
    
    return `I understand you said: "${message}". 

I can help with:
• Adding transactions (type: buy/sell + amount + asset + price)
• Checking portfolio value
• Analyzing performance

What would you like to know?`;
  }

  // OpenAI response for complex queries
  async getOpenAIResponse(messages, portfolio) {
    try {
      const systemPrompt = this.createSystemPrompt(portfolio);
      
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getApiKey()}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.slice(-5).map(msg => ({
              role: msg.type === 'user' ? 'user' : 'assistant',
              content: msg.content
            }))
          ],
          temperature: 0.7,
          max_tokens: 150
        })
      });

      if (!response.ok) {
        throw new Error('OpenAI API error');
      }

      const data = await response.json();
      return {
        type: 'response',
        content: data.choices[0].message.content
      };
      
    } catch (error) {
      this.log('OpenAI error:', error);
      throw error;
    }
  }

  // Get crypto name from symbol
  getCryptoName(symbol) {
    const cryptoMap = {
      'BTC': 'Bitcoin',
      'ETH': 'Ethereum',
      'BNB': 'Binance Coin',
      'ADA': 'Cardano',
      'SOL': 'Solana',
      'XRP': 'Ripple',
      'DOT': 'Polkadot',
      'DOGE': 'Dogecoin',
      'MATIC': 'Polygon',
      'LINK': 'Chainlink',
      'AVAX': 'Avalanche',
      'USDT': 'Tether',
      'USDC': 'USD Coin',
      'UNI': 'Uniswap',
      'ATOM': 'Cosmos',
      'LTC': 'Litecoin',
      'ALGO': 'Algorand',
      'NEAR': 'NEAR Protocol',
      'BCH': 'Bitcoin Cash',
      'TRX': 'TRON',
      'XLM': 'Stellar'
    };
    
    return cryptoMap[symbol.toUpperCase()] || symbol.toUpperCase();
  }

  // Updated analyzeTransactionImage method with model fallback
  async analyzeTransactionImage(imageBase64) {
    const apiKey = this.getApiKey();
    
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Validate image format
    if (!imageBase64.startsWith('data:image')) {
      throw new Error('Invalid image format. Image must be base64 encoded with data URI.');
    }

    // Vision-capable models to try in order
    const visionModels = ['gpt-4o', 'gpt-4-turbo', 'gpt-4o-mini'];
    let lastError = null;

    for (const model of visionModels) {
      try {
        this.log(`Trying vision model: ${model}...`);
        
        const response = await fetch(`${this.baseURL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: model,
            messages: [
              {
                role: 'system',
                content: `You are a cryptocurrency transaction analyzer. Extract transaction details from screenshots.
                  Return ONLY a JSON array of transactions with this exact structure:
                  [
                    {
                      "type": "buy" or "sell",
                      "assetSymbol": "BTC", "ETH", etc.,
                      "assetName": "Bitcoin", "Ethereum", etc.,
                      "amount": numeric value,
                      "price": price per unit in USD,
                      "total": total transaction value in USD,
                      "date": ISO date string,
                      "fee": transaction fee in USD (0 if not visible),
                      "extracted": true
                    }
                  ]
                  
                  Important:
                  - Extract ALL visible transactions
                  - Use standard crypto symbols (BTC, ETH, etc.)
                  - Convert all prices to USD if shown in other currencies
                  - Use current date if date is not visible
                  - Return empty array [] if no transactions found
                  - DO NOT include any explanation or text outside the JSON array`
              },
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: 'Extract all cryptocurrency transactions from this screenshot. Look for order details, trades, or transaction history.'
                  },
                  {
                    type: 'image_url',
                    image_url: {
                      url: imageBase64,
                      detail: 'high'
                    }
                  }
                ]
              }
            ],
            max_tokens: 1500,
            temperature: 0.1
          })
        });

        if (response.ok) {
          const data = await response.json();
          this.log(`Successfully used model: ${model}`);
          
          const content = data.choices[0].message.content;
          this.log('AI Response:', content);
          
          // Parse the JSON response
          try {
            // Clean the response in case there's extra text
            const jsonMatch = content.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              const transactions = JSON.parse(jsonMatch[0]);
              
              // Validate and clean the data
              const validTransactions = transactions.map(tx => ({
                type: tx.type || 'buy',
                assetSymbol: (tx.assetSymbol || '').toUpperCase(),
                assetName: tx.assetName || this.getCryptoName(tx.assetSymbol || ''),
                amount: parseFloat(tx.amount) || 0,
                price: parseFloat(tx.price) || 0,
                total: parseFloat(tx.total) || (parseFloat(tx.amount) * parseFloat(tx.price)),
                date: tx.date || new Date().toISOString(),
                fee: parseFloat(tx.fee) || 0,
                extracted: true
              })).filter(tx => tx.amount > 0 && tx.price > 0);

              this.log('Extracted transactions:', validTransactions);
              return validTransactions;
            }
            
            this.log('No valid JSON found in response');
            return [];
            
          } catch (parseError) {
            this.log('Failed to parse AI response:', parseError);
            return [];
          }
        } else {
          const errorData = await response.json();
          lastError = errorData.error?.message || 'Unknown error';
          this.log(`Model ${model} failed:`, lastError);
          
          // If it's not a model error, throw immediately
          if (!lastError.includes('model') && !lastError.includes('does not exist')) {
            throw new Error(lastError);
          }
        }
      } catch (error) {
        lastError = error.message;
        this.log(`Error with model ${model}:`, error);
        
        // If it's not a model-specific error, throw it
        if (!error.message.includes('model') && !error.message.includes('does not exist')) {
          throw error;
        }
      }
    }

    // All models failed
    throw new Error(`Vision analysis failed. ${lastError}. Please ensure your API key has access to vision models.`);
  }
}

// Create and export a singleton instance
const aiService = new AIService();
export default aiService;