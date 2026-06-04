import React, { useState, useEffect } from 'react';
import { Calculator, AlertCircle, ChevronDown, ChevronUp, RefreshCw, FileText, Calendar, DollarSign } from 'lucide-react';

export default function NewBillForm({ onCalculate, initialFormValues }) {
  const [billType, setBillType] = useState('electricity');
  const [totalAmount, setTotalAmount] = useState('');
  const [period, setPeriod] = useState('');
  const [dueDate, setDueDate] = useState('');

  // Electricity ratios state
  const [ratios, setRatios] = useState({ common: 10, fixed: 30, personal: 60 });
  const [ratiosOpen, setRatiosOpen] = useState(false);

  // Set default values based on current time (June 2026) or pre-fill if editing
  useEffect(() => {
    if (initialFormValues) {
      setBillType(initialFormValues.type || 'electricity');
      setTotalAmount(initialFormValues.totalAmount || '');
      setPeriod(initialFormValues.period || '');
      setDueDate(initialFormValues.dueDate || '');
      if (initialFormValues.ratios) {
        setRatios(initialFormValues.ratios);
      }
    } else {
      // Default period: Current Turkish Month + Year (e.g. "Haziran 2026")
      const now = new Date('2026-06-04T21:34:45+03:00');
      const months = [
        'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
        'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
      ];
      const currentMonth = months[now.getMonth()];
      const currentYear = now.getFullYear();
      setPeriod(`${currentMonth} ${currentYear}`);

      // Default due date: 10 days from today (2026-06-14)
      const defaultDue = new Date(now);
      defaultDue.setDate(now.getDate() + 10);
      const yyyy = defaultDue.getFullYear();
      const mm = String(defaultDue.getMonth() + 1).padStart(2, '0');
      const dd = String(defaultDue.getDate()).padStart(2, '0');
      setDueDate(`${yyyy}-${mm}-${dd}`);
    }
  }, [initialFormValues]);

  const ratioSum = Number(ratios.common) + Number(ratios.fixed) + Number(ratios.personal);
  const isRatioValid = ratioSum === 100;

  const handleRatioChange = (key, value) => {
    const numValue = parseInt(value, 10);
    const cleanValue = isNaN(numValue) ? 0 : Math.max(0, Math.min(100, numValue));
    setRatios(prev => ({
      ...prev,
      [key]: cleanValue
    }));
  };

  const resetRatios = () => {
    setRatios({ common: 10, fixed: 30, personal: 60 });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (billType === 'electricity' && !isRatioValid) {
      alert("Elektrik faturası için toplam oran %100 olmalıdır!");
      return;
    }

    onCalculate({
      type: billType,
      totalAmount: parseFloat(totalAmount),
      period,
      dueDate,
      ratios: billType === 'electricity' ? ratios : null
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 bg-white dark:bg-neutral-900/40 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-lg dark:shadow-2xl animate-fade-in transition-all">
      <div className="flex items-center gap-2.5 pb-4 border-b border-neutral-200 dark:border-neutral-800/80">
        <Calculator className="w-5 h-5 text-neutral-900 dark:text-neutral-100" />
        <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 font-outfit">Fatura Girişi ve Bölüşüm</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Bill Type Dropdown */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" />
            Fatura Türü
          </label>
          <select
            value={billType}
            onChange={(e) => setBillType(e.target.value)}
            className="w-full glass-input px-3.5 py-3 rounded-xl text-sm"
          >
            <option value="electricity" className="bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">⚡ Elektrik Faturası</option>
            <option value="water" className="bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">💧 Su Faturası</option>
            <option value="maintenance" className="bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">🏢 Ortak Gider (Aidat / Bakım)</option>
          </select>
        </div>

        {/* Total Amount Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" />
            Toplam Tutar (₺)
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 font-bold text-sm">₺</span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              className="w-full glass-input pl-8 pr-3.5 py-3 rounded-xl text-sm font-semibold font-mono"
              placeholder="0,00"
              required
            />
          </div>
        </div>

        {/* Bill Period */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" />
            Fatura Dönemi
          </label>
          <input
            type="text"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="w-full glass-input px-3.5 py-3 rounded-xl text-sm"
            placeholder="Örn: Haziran 2026"
            required
          />
        </div>

        {/* Due Date */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" />
            Son Ödeme Tarihi
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full glass-input px-3.5 py-3 rounded-xl text-sm font-mono"
            required
          />
        </div>
      </div>

      {/* Electricity Sliders Accordion */}
      {billType === 'electricity' && (
        <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden bg-neutral-50/50 dark:bg-neutral-950/20">
          <button
            type="button"
            onClick={() => setRatiosOpen(!ratiosOpen)}
            className="w-full flex items-center justify-between px-4 py-3 bg-neutral-100 dark:bg-neutral-900/30 hover:bg-neutral-200/50 dark:hover:bg-neutral-900/60 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Elektrik Dağıtım Oranları (Ortak / Sabit / Kişisel)</span>
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${isRatioValid 
                ? 'bg-neutral-900 text-neutral-100 dark:bg-neutral-100 dark:text-neutral-900' 
                : 'bg-transparent text-neutral-500 dark:text-neutral-400 border border-neutral-300 dark:border-neutral-750'
                }`}>
                Toplam: %{ratioSum}
              </span>
            </div>
            {ratiosOpen ? <ChevronUp className="w-4 h-4 text-neutral-500 dark:text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />}
          </button>

          {ratiosOpen && (
            <div className="p-4 space-y-4 border-t border-neutral-200 dark:border-neutral-850">
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mb-1.5 flex justify-between items-center">
                <span>Rasyo paylarını sürgüleri kaydırarak düzenleyebilirsiniz.</span>
                <button
                  type="button"
                  onClick={resetRatios}
                  className="flex items-center gap-1 text-neutral-900 dark:text-neutral-100 hover:underline font-semibold transition-all"
                >
                  <RefreshCw className="w-3 h-3" />
                  Sıfırla (%10 / %30 / %60)
                </button>
              </div>

              {/* Slider 1: Common */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  <span>🏢 Ortak Pay (Bina Ortak Gideri):</span>
                  <span className="font-bold text-neutral-950 dark:text-white">% {ratios.common}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={ratios.common}
                  onChange={(e) => handleRatioChange('common', e.target.value)}
                  className="w-full accent-neutral-950 dark:accent-neutral-100 bg-neutral-200 dark:bg-neutral-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Slider 2: Fixed */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  <span>⚙️ Sabit Pay (Daire Başı Eşit):</span>
                  <span className="font-bold text-neutral-950 dark:text-white">% {ratios.fixed}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={ratios.fixed}
                  onChange={(e) => handleRatioChange('fixed', e.target.value)}
                  className="w-full accent-neutral-950 dark:accent-neutral-100 bg-neutral-200 dark:bg-neutral-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Slider 3: Personal */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  <span>👥 Kişisel Pay (Kişi Sayısına Göre):</span>
                  <span className="font-bold text-neutral-950 dark:text-white">% {ratios.personal}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={ratios.personal}
                  onChange={(e) => handleRatioChange('personal', e.target.value)}
                  className="w-full accent-neutral-950 dark:accent-neutral-100 bg-neutral-200 dark:bg-neutral-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {!isRatioValid && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-neutral-100 dark:bg-neutral-900/60 border border-neutral-300 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 text-xs mt-2 font-medium">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-neutral-900 dark:text-neutral-100" />
                  <span>Toplam oran %100 olmalıdır. Lütfen oranları ayarlayın (Şu an: <strong>%{ratioSum}</strong>).</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Action Button */}
      <button
        type="submit"
        disabled={billType === 'electricity' && !isRatioValid}
        className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold shadow-lg transition-all border ${billType === 'electricity' && !isRatioValid
          ? 'bg-neutral-100 dark:bg-neutral-900 text-neutral-400 dark:text-neutral-600 cursor-not-allowed border-neutral-200 dark:border-neutral-800'
          : 'bg-neutral-950 hover:bg-neutral-850 text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-neutral-950 border-transparent shadow-neutral-950/10'
          }`}
      >
        <Calculator className="w-4.5 h-4.5" />
        Hesapla ve Önizleme Oluştur
      </button>
    </form>
  );
}
