const CACHE_KEY = 'kr_exchange_rates';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const FALLBACK_RATES = { piUsd: 0.4, piInr: 33, piEur: 0.37, piGbp: 0.32 };

export async function getExchangeRates() {
  const cached = readCache();
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return { ...cached.rates, isLive: true };
  }

  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=pi-network&vs_currencies=usd,inr,eur,gbp'
    );
    if (!res.ok) throw new Error('Rate fetch failed: ' + res.status);
    const json = await res.json();
    const pi = json['pi-network'];
    if (!pi) throw new Error('No pi-network data in response');

    const rates = {
      piUsd: pi.usd ?? FALLBACK_RATES.piUsd,
      piInr: pi.inr ?? FALLBACK_RATES.piInr,
      piEur: pi.eur ?? FALLBACK_RATES.piEur,
      piGbp: pi.gbp ?? FALLBACK_RATES.piGbp,
      fetchedAt: new Date().toISOString(),
    };
    writeCache(rates);
    return { ...rates, isLive: true };
  } catch (err) {
    console.warn('Live rate fetch failed, falling back', err);
    if (cached) return { ...cached.rates, isLive: false };
    return { ...FALLBACK_RATES, fetchedAt: null, isLive: false };
  }
}

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeCache(rates) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ rates, timestamp: Date.now() }));
  } catch (e) {
    console.error('Rate cache save failed', e);
  }
}

// Converts a USD amount into another currency using Pi Network's
// USD/INR/EUR/GBP cross rates from CoinGecko.
export function convertUsdTo(amountUsd, currency, rates) {
  if (currency === 'USD') return amountUsd;
  if (currency === 'PI') return amountUsd / (rates.piUsd || 1);

  const piToTarget = { INR: rates.piInr, EUR: rates.piEur, GBP: rates.piGbp }[currency];
  if (!piToTarget || !rates.piUsd) return amountUsd;

  const usdToTarget = piToTarget / rates.piUsd;
  return amountUsd * usdToTarget;
}
