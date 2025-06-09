const https = require('https');
const fs = require('fs');
const path = require('path');

const topCryptos = [
  { symbol: 'btc', url: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png' },
  { symbol: 'eth', url: 'https://cryptologos.cc/logos/ethereum-eth-logo.png' },
  { symbol: 'usdt', url: 'https://cryptologos.cc/logos/tether-usdt-logo.png' },
  { symbol: 'bnb', url: 'https://cryptologos.cc/logos/binance-coin-bnb-logo.png' },
  { symbol: 'xrp', url: 'https://cryptologos.cc/logos/xrp-xrp-logo.png' },
  { symbol: 'sol', url: 'https://cryptologos.cc/logos/solana-sol-logo.png' },
  { symbol: 'usdc', url: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png' },
  { symbol: 'ada', url: 'https://cryptologos.cc/logos/cardano-ada-logo.png' },
  { symbol: 'doge', url: 'https://cryptologos.cc/logos/dogecoin-doge-logo.png' },
  { symbol: 'matic', url: 'https://cryptologos.cc/logos/polygon-matic-logo.png' },
  { symbol: 'dot', url: 'https://cryptologos.cc/logos/polkadot-new-dot-logo.png' },
  { symbol: 'ltc', url: 'https://cryptologos.cc/logos/litecoin-ltc-logo.png' },
  { symbol: 'bch', url: 'https://cryptologos.cc/logos/bitcoin-cash-bch-logo.png' },
  { symbol: 'link', url: 'https://cryptologos.cc/logos/chainlink-link-logo.png' },
  { symbol: 'avax', url: 'https://cryptologos.cc/logos/avalanche-avax-logo.png' },
  { symbol: 'uni', url: 'https://cryptologos.cc/logos/uniswap-uni-logo.png' },
  { symbol: 'atom', url: 'https://cryptologos.cc/logos/cosmos-atom-logo.png' },
  { symbol: 'xlm', url: 'https://cryptologos.cc/logos/stellar-xlm-logo.png' },
  { symbol: 'algo', url: 'https://cryptologos.cc/logos/algorand-algo-logo.png' },
  { symbol: 'vet', url: 'https://cryptologos.cc/logos/vechain-vet-logo.png' }
];

const downloadDir = './public/crypto-logos/';

// Create directory
if (!fs.existsSync(downloadDir)) {
  fs.mkdirSync(downloadDir, { recursive: true });
  console.log('Created crypto-logos directory');
}

function downloadLogo(crypto, index) {
  const filename = path.join(downloadDir, `${crypto.symbol}.png`);
  const file = fs.createWriteStream(filename);
  
  https.get(crypto.url, (response) => {
    if (response.statusCode === 200) {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`✅ Downloaded ${crypto.symbol}.png`);
      });
    } else {
      console.log(`❌ Failed to download ${crypto.symbol}: ${response.statusCode}`);
    }
  }).on('error', (err) => {
    console.error(`❌ Error downloading ${crypto.symbol}:`, err.message);
  });
}

// Download with delay to avoid rate limiting
topCryptos.forEach((crypto, index) => {
  setTimeout(() => downloadLogo(crypto, index), index * 200);
});

console.log('🚀 Starting download of top 20 crypto logos...');