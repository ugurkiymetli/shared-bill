import React, { useState, useEffect } from 'react';
import { Calculator, FileText, Settings, Sparkles, X, CheckCircle, AlertCircle, Info } from 'lucide-react';
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
  const [bills, setBills] = useState([]);
  const [activeBill, setActiveBill] = useState(null);
  const [initialFormValues, setInitialFormValues] = useState(null);
  const [toasts, setToasts] = useState([]);

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
    <div className="min-h-screen flex flex-col justify-between pb-12">
      {/* Top Glassmorphic Navigation */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-900 px-4 py-4">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Sparkles className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-white tracking-tight font-outfit m-0 leading-none uppercase">
                {apartmentName}
              </h1>
              <p className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase mt-1">
                Fatura Bölüşüm Sistemi
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex bg-slate-900/60 p-1 rounded-xl border border-slate-800/80 w-full sm:w-auto">
            <button
              onClick={() => {
                setActiveTab('calculate');
                setInitialFormValues(null);
              }}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'calculate'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              <Calculator className="w-4 h-4" />
              Hesapla
            </button>
            <button
              onClick={() => setActiveTab('archive')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'archive'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              <FileText className="w-4 h-4" />
              Arşiv
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'settings'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              <Settings className="w-4 h-4" />
              Ayarlar
            </button>
          </nav>
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
              <div id="share-card-container" className="pt-2 border-t border-slate-900">
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
      <footer className="max-w-4xl mx-auto w-full px-4 text-center text-xs text-slate-600 border-t border-slate-900 pt-6">
        <p>© 2026 {apartmentName} Fatura Bölüşüm Paneli. Tüm Hakları Saklıdır.</p>
        <p className="mt-1 font-mono text-[10px]">Built with React & Tailwind CSS</p>
      </footer>

      {/* Global Slide-in Toast Notifications */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          const icons = {
            success: <CheckCircle className="w-5 h-5 text-emerald-400" />,
            error: <AlertCircle className="w-5 h-5 text-rose-400" />,
            info: <Info className="w-5 h-5 text-blue-400" />
          };

          const borderColors = {
            success: 'border-emerald-500/20 bg-slate-950/95 shadow-glow-emerald',
            error: 'border-rose-500/20 bg-slate-950/95',
            info: 'border-blue-500/20 bg-slate-950/95 shadow-glow-blue'
          };

          return (
            <div
              key={toast.id}
              className={`p-4 rounded-xl border flex items-start gap-3 pointer-events-auto shadow-2xl animate-fade-in ${borderColors[toast.type]}`}
            >
              <div className="flex-shrink-0 mt-0.5">{icons[toast.type]}</div>
              <div className="flex-grow">
                <p className="text-xs font-semibold text-slate-200">{toast.message}</p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 text-slate-500 hover:text-slate-300 transition-colors p-0.5 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
