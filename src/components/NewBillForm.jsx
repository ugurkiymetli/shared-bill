import React, { useState, useEffect } from 'react';
import { Calculator, AlertCircle, ChevronDown, ChevronUp, RefreshCw, FileText, Calendar, DollarSign, Camera, Check, Paperclip, Eye, Trash2, Info } from 'lucide-react';
import { createWorker } from 'tesseract.js';

export default function NewBillForm({ onCalculate, initialFormValues, residents }) {
  const [billType, setBillType] = useState('electricity');
  const [totalAmount, setTotalAmount] = useState('');
  const [period, setPeriod] = useState('');
  const [dueDate, setDueDate] = useState('');

  // OCR state
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [fileName, setFileName] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [periodOptions, setPeriodOptions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Electricity ratios state
  const [ratios, setRatios] = useState({ common: 10, fixed: 30, personal: 60 });
  const [ratiosOpen, setRatiosOpen] = useState(false);

  // Set default values based on current time (June 2026) or pre-fill if editing
  useEffect(() => {
    // Generate period options: from currentMonth - 2 to December of current year
    const now = new Date('2026-06-05T10:00:00+03:00');
    const months = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];
    const currentYear = now.getFullYear();
    const currentMonthIdx = now.getMonth();
    const options = [];
    const startIdx = Math.max(0, currentMonthIdx - 2);
    for (let m = startIdx; m <= 11; m++) {
      options.push(`${months[m]} ${currentYear}`);
    }
    setPeriodOptions(options);

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
      const currentMonth = months[currentMonthIdx];
      setPeriod(`${currentMonth} ${currentYear}`);

      // Default due date: 10 days from today (2026-06-15)
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

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    if (fileUrl) {
      URL.revokeObjectURL(fileUrl);
    }
    setFileUrl(URL.createObjectURL(file));

    setIsScanning(true);
    setScanProgress(0);
    setScanSuccess(false);

    try {
      // Create worker with turkish language support
      const worker = await createWorker('tur', 1, {
        logger: m => {
          if (m.status === 'recognizing text') {
            setScanProgress(Math.round(m.progress * 100));
          }
        }
      });
      
      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();

      parseOcrResult(text);
      setScanSuccess(true);
      setTimeout(() => setScanSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert("Fatura taranırken bir hata oluştu: " + err.message);
    } finally {
      setIsScanning(false);
    }
  };

  const handleClearFile = () => {
    setFileName('');
    if (fileUrl) {
      URL.revokeObjectURL(fileUrl);
    }
    setFileUrl('');
  };

  const handleResetForm = () => {
    setTotalAmount('');
    setFileName('');
    if (fileUrl) {
      URL.revokeObjectURL(fileUrl);
    }
    setFileUrl('');
    
    const now = new Date('2026-06-05T10:00:00+03:00');
    const months = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];
    const currentMonthIdx = now.getMonth();
    const currentYear = now.getFullYear();
    setPeriod(`${months[currentMonthIdx]} ${currentYear}`);

    const defaultDue = new Date(now);
    defaultDue.setDate(now.getDate() + 10);
    const yyyy = defaultDue.getFullYear();
    const mm = String(defaultDue.getMonth() + 1).padStart(2, '0');
    const dd = String(defaultDue.getDate()).padStart(2, '0');
    setDueDate(`${yyyy}-${mm}-${dd}`);
  };

  const parseOcrResult = (text) => {
    const normalizedText = text.replace(/\s+/g, ' ');
    const lowerText = text.toLowerCase();
    
    console.log("=== OCR SCAN START ===");
    console.log("Raw OCR Text:", text);
    console.log("Normalized OCR Text:", normalizedText);

    // 1. Detect Bill Type
    if (lowerText.includes('su fatura') || lowerText.includes('ıskı') || lowerText.includes('iski')) {
      setBillType('water');
    } else if (lowerText.includes('elektrik') || lowerText.includes('enerji') || lowerText.includes('gediz') || lowerText.includes('ck bogazici')) {
      setBillType('electricity');
    } else if (lowerText.includes('aidat') || lowerText.includes('ortak gider') || lowerText.includes('yonetim')) {
      setBillType('maintenance');
    }

    // 2. Extract Dates (DD/MM/YYYY or DD.MM.YYYY)
    // Allows separator to be misread as 1, l, i, ı, | or / or . or -
    const dateRegex = /(\d{2})[-./1ıil|]?(\d{2})[-./1ıil|]?(\d{4})/g;
    const dates = [];
    let match;
    while ((match = dateRegex.exec(normalizedText)) !== null) {
      // Validate month (1-12) and day (1-31) to avoid false matches
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10);
      const year = parseInt(match[3], 10);
      
      if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 2000 && year <= 2100) {
        dates.push({
          original: match[0],
          formatted: `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`, // YYYY-MM-DD
          dateObj: new Date(year, month - 1, day),
          index: match.index
        });
      }
    }
    console.log("Detected Dates:", dates);

    // Look for due date keyword context
    let detectedDueDate = '';
    const sonOdemeKeywords = ['son odeme', 'odeme tarihi', 'son'];
    let bestDateMatch = null;
    let minDistance = Infinity;

    sonOdemeKeywords.forEach(kw => {
      const kwIndex = normalizedText.toLowerCase().indexOf(kw);
      if (kwIndex !== -1) {
        dates.forEach(d => {
          const dist = Math.abs(d.index - kwIndex);
          if (dist < minDistance) {
            minDistance = dist;
            bestDateMatch = d;
          }
        });
      }
    });

    if (bestDateMatch) {
      detectedDueDate = bestDateMatch.formatted;
    } else if (dates.length > 0) {
      // Fallback: Use the latest date found in the bill as the due date
      const sortedDates = [...dates].sort((a, b) => b.dateObj - a.dateObj);
      detectedDueDate = sortedDates[0].formatted;
    }

    if (detectedDueDate) {
      setDueDate(detectedDueDate);
      console.log("Selected Due Date:", detectedDueDate);
    }

    // 3. Extract Amount
    // Matches patterns like "7.904,00" or "7,904.00" or "7686,00" or "7686.00" (with or without thousands separator)
    const amountRegex = /\b\d+(?:[.,]\d{3})*[.,]\d{2}\b/g;
    const amounts = [];
    
    const parseTurkishOrUniversalFloat = (str) => {
      const lastComma = str.lastIndexOf(',');
      const lastDot = str.lastIndexOf('.');
      if (lastComma > lastDot) {
        // e.g. 7.904,00 -> 7904.00
        return parseFloat(str.replace(/\./g, '').replace(',', '.'));
      } else if (lastDot > lastComma) {
        // e.g. 7,904.00 -> 7904.00
        return parseFloat(str.replace(/,/g, ''));
      } else {
        return parseFloat(str.replace(',', '.'));
      }
    };

    while ((match = amountRegex.exec(normalizedText)) !== null) {
      const val = parseTurkishOrUniversalFloat(match[0]);
      if (!isNaN(val)) {
        amounts.push({
          val,
          original: match[0],
          index: match.index
        });
      }
    }
    console.log("Detected Amounts:", amounts);

    let detectedAmount = '';
    const amountKeywords = ['odenecek', 'tutar', 'toplam', 'donem tutar', 'tl'];
    let bestAmountMatch = null;
    let minAmountDistance = Infinity;

    amountKeywords.forEach(kw => {
      const kwIndex = normalizedText.toLowerCase().indexOf(kw);
      if (kwIndex !== -1) {
        amounts.forEach(a => {
          const dist = Math.abs(a.index - kwIndex);
          if (dist < minAmountDistance) {
            minAmountDistance = dist;
            bestAmountMatch = a;
          }
        });
      }
    });

    if (bestAmountMatch) {
      detectedAmount = bestAmountMatch.val.toString();
    } else if (amounts.length > 0) {
      // Fallback: pick the largest amount that is not suspiciously huge
      const reasonableAmounts = amounts.filter(a => a.val > 5 && a.val < 100000);
      if (reasonableAmounts.length > 0) {
        reasonableAmounts.sort((a, b) => b.val - a.val);
        detectedAmount = reasonableAmounts[0].val.toString();
      }
    }

    if (detectedAmount) {
      setTotalAmount(detectedAmount);
      console.log("Selected Amount:", detectedAmount);
    }

    // 4. Period detection
    if (dates.length > 0) {
      const months = [
        'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
        'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
      ];
      const dateToUse = dates.find(d => d.formatted !== detectedDueDate) || dates[0];
      if (dateToUse) {
        const m = dateToUse.dateObj.getMonth();
        const y = dateToUse.dateObj.getFullYear();
        const detectedPeriod = `${months[m]} ${y}`;
        // Verify if the detected period is within options, otherwise fallback to first option
        if (periodOptions.includes(detectedPeriod)) {
          setPeriod(detectedPeriod);
        }
        console.log("Selected Period:", detectedPeriod);
      }
    }
    console.log("=== OCR SCAN END ===");
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-200 dark:border-neutral-800/80">
        <div className="flex items-center gap-2.5">
          <Calculator className="w-5 h-5 text-neutral-900 dark:text-neutral-100" />
          <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 font-outfit">Fatura Girişi ve Bölüşüm</h2>
        </div>
        
        {/* OCR Scan Button */}
        <div>
          <label className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
            isScanning
              ? 'bg-neutral-100 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-500'
              : scanSuccess
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              : 'bg-white hover:bg-neutral-50 dark:bg-neutral-900 dark:hover:bg-neutral-800 border-neutral-300 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200'
          }`}>
            {isScanning ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-neutral-500" />
                <span>Taranıyor (%{scanProgress})...</span>
              </>
            ) : scanSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Fatura Okundu</span>
              </>
            ) : (
              <>
                <Camera className="w-3.5 h-3.5 text-neutral-550 dark:text-neutral-400" />
                <span>Fatura Fotoğrafı Yükle</span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={isScanning}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {fileName && (
        <div className="flex flex-col gap-3">
          {/* File details bar */}
          <div className="flex items-center gap-2 px-3 py-2 bg-neutral-50 dark:bg-neutral-950/20 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-600 dark:text-neutral-400 animate-fade-in">
            <Paperclip className="w-3.5 h-3.5 text-neutral-400" />
            <span className="font-semibold truncate max-w-[150px] sm:max-w-[300px]">{fileName}</span>
            <div className="ml-auto flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-neutral-50 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 rounded-lg border border-neutral-300 dark:border-neutral-800 font-bold transition-colors cursor-pointer"
              >
                <Eye className="w-3 h-3 text-neutral-550 dark:text-neutral-400" />
                <span>Görüntüle</span>
              </button>
              <button
                type="button"
                onClick={handleClearFile}
                className="flex items-center justify-center p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg border border-rose-500/25 transition-colors cursor-pointer"
                title="Görseli Kaldır"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          
          {/* Warning banner */}
          <div className="flex items-start gap-2.5 p-3.5 bg-neutral-100 dark:bg-neutral-950/40 border border-neutral-200 dark:border-neutral-800 text-[11px] text-neutral-600 dark:text-neutral-400 rounded-xl font-medium animate-fade-in leading-relaxed">
            <Info className="w-4 h-4 flex-shrink-0 text-neutral-900 dark:text-neutral-100 mt-0.5" />
            <div>
              <span className="font-bold text-neutral-950 dark:text-white">Doğrulama Gerekli:</span> Fatura görselinin kalitesi, ışığı veya katlanma izleri OCR doğruluğunu etkileyebilir. Lütfen faturadaki tutar ve tarihi aşağıdaki alanlardan kontrol ediniz.
            </div>
          </div>
        </div>
      )}

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
              type="text"
              inputMode="decimal"
              value={(() => {
                if (!totalAmount) return '';
                const parts = totalAmount.toString().split('.');
                const integerPart = parts[0];
                const decimalPart = parts[1];
                const formattedInteger = Number(integerPart).toLocaleString('tr-TR');
                if (integerPart === '' || isNaN(Number(integerPart))) {
                  return '';
                }
                let result = formattedInteger;
                if (totalAmount.toString().includes('.')) {
                  result += ',' + (decimalPart !== undefined ? decimalPart : '');
                }
                return result;
              })()}
              onChange={(e) => {
                let clean = e.target.value.replace(/\./g, '').replace(/,/g, '.');
                // Keep only numbers and at most one dot
                const dotCount = (clean.match(/\./g) || []).length;
                if (dotCount > 1) {
                  const firstDotIndex = clean.indexOf('.');
                  clean = clean.slice(0, firstDotIndex + 1) + clean.slice(firstDotIndex + 1).replace(/\./g, '');
                }
                const parts = clean.split('.');
                if (parts[1] && parts[1].length > 2) {
                  clean = parts[0] + '.' + parts[1].slice(0, 2);
                }
                // Allow empty or partial/numeric inputs
                if (clean === '' || clean === '.' || !isNaN(parseFloat(clean)) || (parts[0] !== undefined && !isNaN(Number(parts[0])))) {
                  setTotalAmount(clean);
                }
              }}
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
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="w-full glass-input px-3.5 py-3 rounded-xl text-sm"
          >
            {periodOptions.map((opt) => (
              <option key={opt} value={opt} className="bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
                {opt}
              </option>
            ))}
          </select>
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
            className="block w-full min-w-0 max-w-full glass-input px-3.5 py-3 rounded-xl text-sm font-mono appearance-none"
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
                  step={5}
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
                  step={5}
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
                  step={5}
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

      {/* Vacation / Partial stay Mode Information Banner */}
      {residents && (residents.some(r => r.isVacation) || residents.some(r => r.stayDays !== undefined && r.stayDays < 30)) && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-850 dark:text-amber-300 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold">
            <Info className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Kısmi Konaklama ve Tatil Modu Bilgilendirmesi</span>
          </div>
          <div className="space-y-1">
            {residents.some(r => r.stayDays === 0 || (r.stayDays === undefined && r.isVacation)) && (
              <p>
                Şu sakinler tatile çıkmıştır (0 aktif gün):{' '}
                <strong className="text-amber-900 dark:text-amber-150 font-bold">
                  {residents.filter(r => r.stayDays === 0 || (r.stayDays === undefined && r.isVacation)).map(r => r.name).join(', ')}
                </strong>
              </p>
            )}
            {residents.some(r => r.stayDays !== undefined && r.stayDays > 0 && r.stayDays < 30) && (
              <p>
                Şu sakinler kısmi konaklama yapmaktadır:{' '}
                <strong className="text-amber-900 dark:text-amber-150 font-bold">
                  {residents.filter(r => r.stayDays !== undefined && r.stayDays > 0 && r.stayDays < 30).map(r => `${r.name} (${r.stayDays} gün)`).join(', ')}
                </strong>
              </p>
            )}
            <ul className="list-disc list-inside space-y-0.5 opacity-90 pl-1 mt-1.5">
              {billType === 'water' && (
                <li>Su faturasında bu sakinlerin payları aktif gün oranına göre (aktif gün / 30) düşürülerek hesaplanacaktır.</li>
              )}
              {billType === 'electricity' && (
                <li>Elektrik faturasında ortak payı tam ödeyecekler, sabit payı sadece aktif olanlar (aktif gün &gt; 0) eşit ödeyecek, kişisel kullanım payı ise aktif gün oranına göre hesaplanacaktır.</li>
              )}
              {billType === 'maintenance' && (
                <li>Ortak gider faturasında eşit pay ödemeye devam edeceklerdir.</li>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={handleResetForm}
          className="w-full sm:w-auto px-5 py-3.5 bg-white hover:bg-neutral-50 dark:bg-neutral-900 dark:hover:bg-neutral-800 border border-neutral-300 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 rounded-xl text-sm font-bold transition-all order-2 sm:order-1"
        >
          Formu Sıfırla
        </button>
        <button
          type="submit"
          disabled={billType === 'electricity' && !isRatioValid}
          className={`w-full sm:flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold shadow-lg transition-all border order-1 sm:order-2 ${
            billType === 'electricity' && !isRatioValid
              ? 'bg-neutral-100 dark:bg-neutral-900 text-neutral-400 dark:text-neutral-600 cursor-not-allowed border-neutral-200 dark:border-neutral-800'
              : 'bg-neutral-950 hover:bg-neutral-850 text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-neutral-950 border-transparent shadow-neutral-950/10'
          }`}
        >
          <Calculator className="w-4.5 h-4.5" />
          <span>Hesapla ve Önizleme Oluştur</span>
        </button>
      </div>

      {/* In-app Image Viewer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="relative bg-white dark:bg-neutral-900 rounded-2xl max-w-xl w-full max-h-[85vh] overflow-hidden flex flex-col border border-neutral-200 dark:border-neutral-850 shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800">
              <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400 truncate pr-4">{fileName}</span>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-xs font-bold px-3 py-1.5 bg-neutral-950 hover:bg-neutral-850 text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-neutral-950 rounded-lg transition-colors cursor-pointer"
              >
                Kapat
              </button>
            </div>
            <div className="p-4 flex-grow overflow-auto flex items-center justify-center bg-neutral-950/5 dark:bg-neutral-950/20">
              <img src={fileUrl} alt="Fatura Görseli" className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-sm" />
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
