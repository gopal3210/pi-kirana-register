const TABS = [
  { id: 'dashboard', label: 'Home', icon: '馃彔' },
  { id: 'sales', label: 'Sales', icon: '馃泹锔�' },
  { id: 'stock', label: 'Stock', icon: '馃摝' },
  { id: 'expenses', label: 'Expense', icon: '馃捀' },
  { id: 'invoices', label: 'Bills', icon: '馃Ь' },
  { id: 'settings', label: 'Setup', icon: '鈿欙笍' },
];

export default function BottomNav({ active, onChange }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-between px-1 py-1 z-20 max-w-md mx-auto">
      {TABS.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`flex-1 flex flex-col items-center py-1.5 rounded-lg text-xs font-medium ${
            active === t.id ? 'text-brand-600 bg-brand-50' : 'text-gray-500'
          }`}
        >
          <span className="text-lg leading-none">{t.icon}</span>
          {t.label}
        </button>
      ))}
    </nav>
  );
}
