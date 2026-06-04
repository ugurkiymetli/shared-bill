import React, { useState, useEffect } from 'react';
import { Calculator, FileText, Settings, Sparkles, X, CheckCircle, AlertCircle, Info, Sun, Moon, Home } from 'lucide-react';
import { Analytics } from '@vercel/analytics/react';
import NewBillForm from './components/NewBillForm';
import ShareCard from './components/ShareCard';
import HistoryArchive from './components/HistoryArchive';
import SettingsPanel from './components/SettingsPanel';
import { calculateBill } from './utils/calculations';

const DEFAULT_RESIDENTS = [
  { id: 1, name: "Ahmet", count: 2 },
  { id: 2, name: "Mehmet", count: 1 }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('calculate');
  const [residents, setResidents] = useState([]);
  const [apartmentName, setApartmentName] = useState("Apartman");
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });
  const [bills, setBills] = useState([]);
  const [activeBill, setActiveBill] = useState(null);
  const [initialFormValues, setInitialFormValues] = useState(null);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Load initial data from localStorage
  useEffect(() => {
    // Apartment Name
    const storedName = localStorage.getItem('apartment_name');
    if (storedName) {
      setApartmentName(storedName);
    } else {
      setApartmentName("Apartman");
      localStorage.setItem('apartment_name', "Apartman");
    }

    // Residents
    const storedResidents = localStorage.getItem('apartment_residents');
    if (storedResidents) {
      try {
        setResidents(JSON.parse(storedResidents));
      } catch (e) {
        console.error("Failed to parse stored residents", e);
        setResidents(DEFAULT_RESIDENTS);
        localStorage.setItem('apartment_residents', JSON.stringify(DEFAULT_RESIDENTS));
      }
    } else {
      setResidents(DEFAULT_RESIDENTS);
      localStorage.setItem('apartment_residents', JSON.stringify(DEFAULT_RESIDENTS));
    }

    // Bills
    const storedBills = localStorage.getItem('apartment_bills');
    if (storedBills) {
      try {
        setBills(JSON.parse(storedBills));
      } catch (e) {
        console.error("Failed to parse stored bills", e);
        setBills([]);
      }
    }
  }, []);

  // Toast Helper
  const addToast = ({ type = 'info', message }) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Save settings (residents list and apartment name)
  const handleSaveSettings = (updatedResidents, updatedName) => {
    setResidents(updatedResidents);
    localStorage.setItem('apartment_residents', JSON.stringify(updatedResidents));

    setApartmentName(updatedName);
    localStorage.setItem('apartment_name', updatedName);

    addToast({ type: 'success', message: 'Ayarlar başarıyla güncellendi!' });

    // If there is an active bill, let's recalculate it to stay synced
    if (activeBill) {
      const splits = calculateBill({
        type: activeBill.type,
        totalAmount: activeBill.totalAmount,
        residents: updatedResidents,
        electricityRatios: activeBill.ratios
      });
      const updatedActiveBill = { ...activeBill, splits };
      setActiveBill(updatedActiveBill);

      // Update in history as well
      const updatedBills = bills.map(b => b.id === activeBill.id ? updatedActiveBill : b);
      setBills(updatedBills);
      localStorage.setItem('apartment_bills', JSON.stringify(updatedBills));
    }
  };

  // Reset settings & residents list to default
  const handleResetSettings = () => {
    setResidents(DEFAULT_RESIDENTS);
    localStorage.setItem('apartment_residents', JSON.stringify(DEFAULT_RESIDENTS));
    setApartmentName("Apartman");
    localStorage.setItem('apartment_name', "Apartman");
    addToast({ type: 'info', message: 'Ayarlar ve sakin listesi sıfırlandı.' });
    return DEFAULT_RESIDENTS;
  };

  // Calculate bill & archive it
  const handleCalculateBill = (formValues) => {
    const splits = calculateBill({
      type: formValues.type,
      totalAmount: formValues.totalAmount,
      residents,
      electricityRatios: formValues.ratios
    });

    const isEdit = initialFormValues && initialFormValues.id;
    const billId = isEdit ? initialFormValues.id : Date.now().toString();

    const newBill = {
      id: billId,
      type: formValues.type,
      totalAmount: formValues.totalAmount,
      period: formValues.period,
      dueDate: formValues.dueDate,
      ratios: formValues.ratios,
      splits,
      savedAt: isEdit ? initialFormValues.savedAt : new Date().toISOString()
    };

    setActiveBill(newBill);

    let updatedBills;
    if (isEdit) {
      updatedBills = bills.map(b => b.id === billId ? newBill : b);
      addToast({ type: 'success', message: 'Fatura başarıyla güncellendi ve yeniden hesaplandı!' });
      setInitialFormValues(null); // clear edit state
    } else {
      updatedBills = [newBill, ...bills];
      addToast({ type: 'success', message: 'Fatura hesaplandı ve arşive eklendi!' });
    }

    setBills(updatedBills);
    localStorage.setItem('apartment_bills', JSON.stringify(updatedBills));
  };

  // Load archived bill into preview card
  const handleViewDetails = (bill) => {
    setActiveBill(bill);
    setInitialFormValues(null); // ensure we aren't pre-filling the form unless we click edit
    setActiveTab('calculate');
    addToast({ type: 'info', message: `${bill.period} faturası detayları yüklendi.` });

    // Smooth scroll to card preview
    setTimeout(() => {
      const el = document.getElementById('share-card-container');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // Edit archived bill (pre-fills form)
  const handleEditBill = (bill) => {
    setInitialFormValues(bill);
    setActiveBill(null); // clear preview until they re-calculate
    setActiveTab('calculate');
    addToast({ type: 'info', message: 'Fatura düzenleme modu aktif. Değerleri güncelleyip hesaplayın.' });
  };

  // Delete bill from archive
  const handleDeleteBill = (id) => {
    if (window.confirm("Bu faturayı arşivden silmek istediğinize emin misiniz?")) {
      const updatedBills = bills.filter(b => b.id !== id);
      setBills(updatedBills);
      localStorage.setItem('apartment_bills', JSON.stringify(updatedBills));
      addToast({ type: 'success', message: 'Fatura arşivden başarıyla silindi.' });

      // If deleted bill was the one active, clear it
      if (activeBill && activeBill.id === id) {
        setActiveBill(null);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between pb-12 bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100 transition-colors duration-300">
      {/* Top Glassmorphic Navigation */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-900 px-4 py-3.5">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-neutral-900 dark:bg-neutral-100 flex items-center justify-center text-white dark:text-neutral-950 shadow-md">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-neutral-900 dark:text-white tracking-tight font-outfit m-0 leading-none uppercase">
                {apartmentName}
              </h1>
              <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-semibold tracking-wider uppercase mt-1">
                Fatura Bölüşüm Paneli
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Navigation Tabs */}
            <nav className="flex-grow sm:flex-grow-0 flex bg-neutral-100 dark:bg-neutral-900/60 p-1 rounded-xl border border-neutral-200 dark:border-neutral-800/80">
              <button
                onClick={() => {
                  setActiveTab('calculate');
                  setInitialFormValues(null);
                }}
                className={`flex-grow sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'calculate'
                  ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-950 shadow-sm'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
              >
                <Calculator className="w-3.5 h-3.5" />
                Hesapla
              </button>
              <button
                onClick={() => setActiveTab('archive')}
                className={`flex-grow sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'archive'
                  ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-950 shadow-sm'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Arşiv
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex-grow sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'settings'
                  ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-950 shadow-sm'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
              >
                <Settings className="w-3.5 h-3.5" />
                Ayarlar
              </button>
            </nav>

            {/* Dark / Light Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800/80 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-all shadow-sm"
              title={theme === 'dark' ? 'Aydınlık Tema' : 'Karanlık Tema'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow max-w-4xl w-full mx-auto px-4 py-6 md:py-8 space-y-8">

        {/* Active Tab View Rendering */}
        {activeTab === 'calculate' && (
          <div className="space-y-8">
            <NewBillForm
              onCalculate={handleCalculateBill}
              initialFormValues={initialFormValues}
            />

            {activeBill && (
              <div id="share-card-container" className="pt-2 border-t border-neutral-200 dark:border-neutral-800">
                <ShareCard bill={activeBill} apartmentName={apartmentName} onAddToast={addToast} />
              </div>
            )}
          </div>
        )}

        {activeTab === 'archive' && (
          <HistoryArchive
            bills={bills}
            onViewDetails={handleViewDetails}
            onEditBill={handleEditBill}
            onDeleteBill={handleDeleteBill}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsPanel
            residents={residents}
            apartmentName={apartmentName}
            onSaveSettings={handleSaveSettings}
            onResetResidents={handleResetSettings}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto w-full px-4 text-center text-xs text-neutral-550 dark:text-neutral-600 border-t border-neutral-200 dark:border-neutral-900 pt-6 space-y-2">
        <div className="flex items-center justify-center gap-2.5 font-mono text-[10px] text-neutral-500 dark:text-neutral-500">
          <span>built by ugur</span>
          <a href="https://github.com/ugurkiymetli" target="_blank" rel="noopener noreferrer" className="hover:text-neutral-900 dark:hover:text-white transition-colors" title="GitHub">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" /><path d="M9 18c-4.51 2-5-2-7-2" /></svg>
          </a>
          <a href="https://www.linkedin.com/in/ugurkiymetli" target="_blank" rel="noopener noreferrer" className="hover:text-neutral-900 dark:hover:text-white transition-colors" title="LinkedIn">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect width="4" height="12" x="2" y="9" rx="1" /><circle cx="4" cy="4" r="2" /></svg>
          </a>
        </div>
      </footer>

      {/* Global Slide-in Toast Notifications */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          const icons = {
            success: <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
            error: <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />,
            info: <Info className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
          };

          const borderColors = {
            success: 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/95 dark:bg-emerald-950/95 shadow-lg text-emerald-900 dark:text-emerald-100',
            error: 'border-rose-200 dark:border-rose-900/50 bg-rose-50/95 dark:bg-rose-950/95 shadow-lg text-rose-900 dark:text-rose-100',
            info: 'border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 shadow-lg text-neutral-900 dark:text-neutral-100'
          };

          return (
            <div
              key={toast.id}
              className={`p-4 rounded-xl border flex items-start gap-3 pointer-events-auto shadow-2xl animate-fade-in ${borderColors[toast.type]}`}
            >
              <div className="flex-shrink-0 mt-0.5">{icons[toast.type]}</div>
              <div className="flex-grow">
                <p className="text-xs font-semibold">{toast.message}</p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className={`flex-shrink-0 transition-colors p-0.5 rounded-lg ${toast.type === 'success'
                    ? 'text-emerald-500 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300'
                    : toast.type === 'error'
                      ? 'text-rose-500 hover:text-rose-800 dark:text-rose-400 dark:hover:text-rose-300'
                      : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'
                  }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
      <Analytics />
    </div>
  );
}
