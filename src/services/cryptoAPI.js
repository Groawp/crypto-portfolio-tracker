import axios from 'axios';

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

export const getCryptoPrices = async (cryptoIds = ['bitcoin', 'ethereum', 'bitcoin-cash', 'chainlink']) => {
  try {
    const response = await axios.get(`${COINGECKO_API}/simple/price`, {
      params: {
        ids: cryptoIds.join(','),
        vs_currencies: 'usd',
        include_24hr_change: true,
        include_market_cap: true,
        include_24hr_vol: true
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching crypto prices:', error);
    return null;
  }
};

export const getHistoricalData = async (cryptoId = 'bitcoin', days = 7) => {
  try {
    const response = await axios.get(`${COINGECKO_API}/coins/${cryptoId}/market_chart`, {
      params: {
        vs_currency: 'usd',
        days: days,
        interval: days <= 1 ? 'hourly' : 'daily'
      }
    });
    
    const prices = response.data.prices.map(([timestamp, price]) => ({
      time: new Date(timestamp).toLocaleDateString(),
      value: price
    }));
    
    return prices;
  } catch (error) {
    console.error('Error fetching historical data:', error);
    return [];
  }
};

// Get top cryptocurrencies by market cap
export const getTopCryptos = async (limit = 50) => {
  try {
    const response = await axios.get(`${COINGECKO_API}/coins/markets`, {
      params: {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: limit,
        page: 1,
        sparkline: false,
        price_change_percentage: '24h'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching top cryptos:', error);
    return [];
  }
};

// Search for cryptocurrencies
export const searchCryptos = async (query) => {
  try {
    // First, try to search in the coins list
    const searchResponse = await axios.get(`${COINGECKO_API}/search`, {
      params: {
        query: query
      }
    });
    
    // Get the coin IDs from search results
    const coinIds = searchResponse.data.coins.slice(0, 20).map(coin => coin.id);
    
    if (coinIds.length === 0) {
      return [];
    }
    
    // Get detailed market data for these coins
    const marketResponse = await axios.get(`${COINGECKO_API}/coins/markets`, {
      params: {
        vs_currency: 'usd',
        ids: coinIds.join(','),
        order: 'market_cap_desc',
        sparkline: false,
        price_change_percentage: '24h'
      }
    });
    
    return marketResponse.data;
  } catch (error) {
    console.error('Error searching cryptos:', error);
    
    // Fallback: try to get more coins and filter locally
    try {
      const response = await axios.get(`${COINGECKO_API}/coins/markets`, {
        params: {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: 250,
          page: 1,
          sparkline: false,
          price_change_percentage: '24h'
        }
      });
      
      // Filter the results based on the query
      const filtered = response.data.filter(crypto => 
        crypto.name.toLowerCase().includes(query.toLowerCase()) ||
        crypto.symbol.toLowerCase().includes(query.toLowerCase()) ||
        crypto.id.toLowerCase().includes(query.toLowerCase())
      );
      
      return filtered;
    } catch (fallbackError) {
      console.error('Fallback search failed:', fallbackError);
      return [];
    }
  }
};

// Get a list of all supported coins (useful for comprehensive search)
export const getAllCoins = async () => {
  try {
    const response = await axios.get(`${COINGECKO_API}/coins/list`);
    return response.data;
  } catch (error) {
    console.error('Error fetching all coins:', error);
    return [];
  }
};