// Configuration file for the application
// DO NOT commit API keys to version control!

const config = {
    // OpenAI Configuration
    openai: {
      // DO NOT hardcode your API key here!
      // Options for API key management:
      
      // Option 1: Environment variable (recommended for production)
      apiKey: process.env.REACT_APP_OPENAI_API_KEY || '',
      
      // Option 2: Local storage (set by user in UI)
      // apiKey is managed by aiService.js
      
      // Option 3: Backend proxy (most secure)
      // apiEndpoint: process.env.REACT_APP_API_ENDPOINT || 'http://localhost:3001/api/ai',
      
      // Model configuration
      model: 'gpt-3.5-turbo', // Changed from 'gpt-4' to save money
      visionModel: 'gpt-4-vision-preview', // Keep this for image analysis
      temperature: 0.3, // Lower temperature = more consistent, less tokens
      maxTokens: 150 // Reduced from 500 to save tokens
    },
  
    // Other API configurations
    coingecko: {
      apiUrl: 'https://api.coingecko.com/api/v3',
      // Add your CoinGecko API key if you have pro account
      apiKey: process.env.REACT_APP_COINGECKO_API_KEY || ''
    },
  
    // App configuration
    app: {
      name: 'CryptoTracker',
      version: '1.0.0',
      supportEmail: 'support@cryptotracker.com'
    },
  
    // Feature flags
    features: {
      enableAI: true,
      enableScreenshotAnalysis: true,
      enableExport: true,
      enableImport: true
    }
  };
  
  export default config;