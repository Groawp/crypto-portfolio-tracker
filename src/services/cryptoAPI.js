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