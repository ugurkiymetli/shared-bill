import React, { useState, useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
import Header from './components/Header';
import Footer from './components/Footer';
import Toaster from './components/Toaster';
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

  // Sync theme class on <html>
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
    const storedName = localStorage.getItem('apartment_name');
    if (storedName) {
      setApartmentName(storedName);
    } else {
      setApartmentName("Apartman");
      localStorage.setItem('apartment_name', "Apartman");
    }

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

  // ── Toast helpers ──────────────────────────────────────────────────────────
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

  // ── Settings ───────────────────────────────────────────────────────────────
  const handleSaveSettings = (updatedResidents, updatedName) => {
    setResidents(updatedResidents);
    localStorage.setItem('apartment_residents', JSON.stringify(updatedResidents));

    setApartmentName(updatedName);
    localStorage.setItem('apartment_name', updatedName);

    addToast({ type: 'success', message: 'Ayarlar başarıyla güncellendi!' });

    if (activeBill) {
      const splits = calculateBill({
        type: activeBill.type,
        totalAmount: activeBill.totalAmount,
        residents: updatedResidents,
        electricityRatios: activeBill.ratios
      });
      const updatedActiveBill = { ...activeBill, splits };
      setActiveBill(updatedActiveBill);

      const updatedBills = bills.map(b => b.id === activeBill.id ? updatedActiveBill : b);
      setBills(updatedBills);
      localStorage.setItem('apartment_bills', JSON.stringify(updatedBills));
    }
  };

  const handleResetSettings = () => {
    setResidents(DEFAULT_RESIDENTS);
    localStorage.setItem('apartment_residents', JSON.stringify(DEFAULT_RESIDENTS));
    setApartmentName("Apartman");
    localStorage.setItem('apartment_name', "Apartman");
    addToast({ type: 'info', message: 'Ayarlar ve sakin listesi sıfırlandı.' });
    return DEFAULT_RESIDENTS;
  };

  // ── Bill handlers ──────────────────────────────────────────────────────────
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
      setInitialFormValues(null);
    } else {
      updatedBills = [newBill, ...bills];
      addToast({ type: 'success', message: 'Fatura hesaplandı ve arşive eklendi!' });
    }

    setBills(updatedBills);
    localStorage.setItem('apartment_bills', JSON.stringify(updatedBills));
  };

  const handleViewDetails = (bill) => {
    setActiveBill(bill);
    setInitialFormValues(null);
    setActiveTab('calculate');
    addToast({ type: 'info', message: `${bill.period} faturası detayları yüklendi.` });

    setTimeout(() => {
      const el = document.getElementById('share-card-container');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleEditBill = (bill) => {
    setInitialFormValues(bill);
    setActiveBill(null);
    setActiveTab('calculate');
    addToast({ type: 'info', message: 'Fatura düzenleme modu aktif. Değerleri güncelleyip hesaplayın.' });
  };

  const handleDeleteBill = (id) => {
    if (window.confirm("Bu faturayı arşivden silmek istediğinize emin misiniz?")) {
      const updatedBills = bills.filter(b => b.id !== id);
      setBills(updatedBills);
      localStorage.setItem('apartment_bills', JSON.stringify(updatedBills));
      addToast({ type: 'success', message: 'Fatura arşivden başarıyla silindi.' });

      if (activeBill && activeBill.id === id) {
        setActiveBill(null);
      }
    }
  };

  // ── Tab change helper (clears edit state when navigating away) ─────────────
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab !== 'calculate') {
      setInitialFormValues(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between pb-12 bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100 transition-colors duration-300">
      <Header
        apartmentName={apartmentName}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <main className="flex-grow max-w-4xl w-full mx-auto px-4 py-6 md:py-8 space-y-8">
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

      <Footer />

      <Toaster toasts={toasts} onRemoveToast={removeToast} />

      <Analytics />
    </div>
  );
}
