import { useState, useEffect } from 'react';
import { loadData, saveData, STORAGE_KEYS, generateId } from './utils';
import Dashboard from './components/Dashboard';
import Stock from './components/Stock';
import Sales from './components/Sales';
import Cart from './components/Cart';
import Expenses from './components/Expenses';
import InvoiceHistory from './components/InvoiceHistory';
import SettingsView from './components/Settings';
import Receipt from './components/Receipt';
import BottomNav from './components/BottomNav';
import InvoiceModal from './components/InvoiceModal';

const DEFAULT_SETTINGS = {
  shopName: 'My Kirana Store',
  lowStockThreshold: 5,
  secondaryCurrency: 'INR',
};

export default function App() {
  const [route, setRoute] = useState(window.location.hash);

  useEffect(() => {
    const onHashChange = () => setRoute(window.location.hash);
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Customer-facing receipt view, opened by scanning the invoice QR code.
  // Fully client-side: the invoice data is encoded directly in the URL hash,
  // so no backend or database is needed to serve the receipt.
  if (route.startsWith('#/receipt/')) {
    const encoded = route.replace('#/receipt/', '');
    return <Receipt encoded={encoded} />;
  }

  return <MainApp />;
}

function MainApp() {
  const [tab, setTab] = useState('dashboard');
  const [products, setProducts] = useState(() => loadData(STORAGE_KEYS.PRODUCTS, []));
  const [expenses, setExpenses] = useState(() => loadData(STORAGE_KEYS.EXPENSES, []));
  const [sales, setSales] = useState(() => loadData(STORAGE_KEYS.SALES, []));
  const [settings, setSettings] = useState(() => loadData(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS));
  const [cart, setCart] = useState([]);
  const [activeInvoice, setActiveInvoice] = useState(null);

  useEffect(() => saveData(STORAGE_KEYS.PRODUCTS, products), [products]);
  useEffect(() => saveData(STORAGE_KEYS.EXPENSES, expenses), [expenses]);
  useEffect(() => saveData(STORAGE_KEYS.SALES, sales), [sales]);
  useEffect(() => saveData(STORAGE_KEYS.SETTINGS, settings), [settings]);

  function addToCart(items) {
    setCart((prev) => {
      const next = [...prev];
      items.forEach((item) => {
        const idx = next.findIndex((c) => c.productId === item.productId);
        if (idx >= 0) {
          next[idx] = { ...next[idx], qty: next[idx].qty + item.qty };
        } else {
          next.push(item);
        }
      });
      return next;
    });
  }

  function removeFromCart(productId) {
    setCart((prev) => prev.filter((c) => c.productId !== productId));
  }

  function updateCartQty(productId, qty) {
    setCart((prev) => prev.map((c) => (c.productId === productId ? { ...c, qty } : c)));
  }

  function checkout() {
    if (cart.length === 0) return null;

    const updatedProducts = products.map((p) => ({ ...p }));
    const lineItems = cart.map((c) => {
      const p = updatedProducts.find((pr) => pr.id === c.productId);
      if (p) p.stock = Math.max(0, p.stock - c.qty);
      return {
        productId: c.productId,
        name: p ? p.name : 'Unknown',
        priceUsd: p ? p.priceUsd : 0,
        costUsd: p ? p.costUsd || 0 : 0,
        qty: c.qty,
      };
    });

    const totalUsd = lineItems.reduce((sum, li) => sum + li.priceUsd * li.qty, 0);
    const totalCostUsd = lineItems.reduce((sum, li) => sum + li.costUsd * li.qty, 0);

    const invoice = {
      id: generateId(),
      invoiceNumber: 'INV-' + (sales.length + 1).toString().padStart(4, '0'),
      items: lineItems,
      totalUsd,
      totalCostUsd,
      profitUsd: totalUsd - totalCostUsd,
      date: new Date().toISOString(),
      shopName: settings.shopName,
    };

    setProducts(updatedProducts);
    setSales((prev) => [invoice, ...prev]);
    setCart([]);
    setActiveInvoice(invoice);
    return invoice;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header settings={settings} cartCount={cart.length} onCartClick={() => setTab('cart')} />

      <main className="max-w-md mx-auto px-3 pt-3">
        {tab === 'dashboard' && <Dashboard sales={sales} expenses={expenses} />}
        {tab === 'stock' && (
          <Stock products={products} setProducts={setProducts} lowStockThreshold={settings.lowStockThreshold} />
        )}
        {tab === 'sales' && (
          <Sales products={products} onAddToCart={addToCart} lowStockThreshold={settings.lowStockThreshold} />
        )}
        {tab === 'cart' && (
          <Cart
            cart={cart}
            products={products}
            onUpdateQty={updateCartQty}
            onRemove={removeFromCart}
            onCheckout={checkout}
          />
        )}
        {tab === 'expenses' && <Expenses expenses={expenses} setExpenses={setExpenses} />}
        {tab === 'invoices' && <InvoiceHistory sales={sales} />}
        {tab === 'settings' && <SettingsView settings={settings} setSettings={setSettings} />}
      </main>

      <BottomNav active={tab} onChange={setTab} />

      {activeInvoice && (
        <InvoiceModal invoice={activeInvoice} settings={settings} onClose={() => setActiveInvoice(null)} />
      )}
    </div>
  );
}

function Header({ settings, cartCount, onCartClick }) {
  return (
    <header className="bg-brand-600 text-white px-4 py-3 sticky top-0 z-10 flex items-center justify-between shadow">
      <h1 className="font-bold text-lg truncate">{settings.shopName}</h1>
      <button onClick={onCartClick} className="relative bg-brand-700 px-3 py-1.5 rounded-lg text-sm font-medium">
        🛒 Cart
        {cartCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {cartCount}
          </span>
        )}
      </button>
    </header>
  );
}
