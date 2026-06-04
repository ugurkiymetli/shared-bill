import React, { useState, useRef } from 'react';
import * as htmlToImage from 'html-to-image';
import { Image, Copy, Check, Table, Smartphone, Share2 } from 'lucide-react';

export default function ShareCard({ bill, apartmentName = "Apartman", onAddToast, theme }) {
  const [viewMode, setViewMode] = useState('mobile'); // 'excel' or 'mobile'
  const [copying, setCopying] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showDetails, setShowDetails] = useState(true);
  const cardRef = useRef(null);

  if (!bill || !bill.splits || bill.splits.length === 0) return null;

  const billTypeLabels = {
    electricity: 'ELEKTRİK',
    water: 'SU',
    maintenance: 'ORTAK GİDER (AİDAT / BAKIM)'
  };

  // Unified currency formatting helper
  const formatCurrency = (val) => {
    return Number(val || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Format date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}.${parts[1]}.${parts[0]}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  // Generate plain text for WhatsApp clipboard copying
  const handleCopyText = () => {
    setCopying(true);
    
    let text = `*${apartmentName} - ${billTypeLabels[bill.type]} Faturası*\n`;
    text += `Dönem: ${bill.period}\n`;
    text += `Toplam Tutar: ₺${formatCurrency(bill.totalAmount)}\n`;
    text += `Son Ödeme Tarihi: ${formatDate(bill.dueDate)}\n`;
    text += `----------------------------\n`;
    
    bill.splits.forEach(item => {
      text += `• ${item.name} (${item.count} Kişi): ₺${formatCurrency(item.share)}\n`;
      if (bill.type === 'electricity' && showDetails && item.breakdown) {
        const bd = item.breakdown;
        text += `  (Ortak: ₺${formatCurrency(bd.commonShare)} | Sabit: ₺${formatCurrency(bd.fixedShare)} | Kişisel: ₺${formatCurrency(bd.personalShare)})\n`;
      }
    });
    
    text += `----------------------------\n`;
    text += `*Hesaplama Detayları:*\n`;
    if (bill.type === 'electricity') {
      text += `Rasyolar: %${bill.ratios?.common || 10} Ortak | %${bill.ratios?.fixed || 30} Sabit | %${bill.ratios?.personal || 60} Kişisel\n`;
    } else if (bill.type === 'water') {
      const totalCount = bill.splits.reduce((sum, item) => sum + item.count, 0);
      const perResident = bill.totalAmount / totalCount;
      text += `Kişi Başı Su Ücreti: ₺${formatCurrency(perResident)}\n`;
    } else {
      text += `Eşit Paylaşım: Daire Başı ₺${formatCurrency(bill.totalAmount / 9)}\n`;
    }

    navigator.clipboard.writeText(text)
      .then(() => {
        onAddToast({ type: 'success', message: 'Fatura metni WhatsApp formatında kopyalandı!' });
        setTimeout(() => setCopying(false), 2000);
      })
      .catch(err => {
        console.error('Kopyalama hatası:', err);
        setCopying(false);
      });
  };

  // Export card as image
  const handleExportImage = async () => {
    if (!cardRef.current) return;
    setExporting(true);
    onAddToast({ type: 'info', message: 'Görsel oluşturuluyor, lütfen bekleyin...' });

    try {
      const isDark = document.documentElement.classList.contains('dark');
      
      // Use html-to-image to render the node as PNG data URL.
      const imgData = await htmlToImage.toPng(cardRef.current, {
        backgroundColor: isDark ? '#020617' : '#ffffff',
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
        },
        pixelRatio: 2, // High resolution output
        cacheBust: true,
        fontEmbedCSS: '', // Disable embedding of web fonts to prevent HMR/CORS hangs
        skipFonts: true, // Skip font loading to prevent stylesheet reading blocks
      });

      // Check for Web Share support
      if (navigator.share && navigator.canShare) {
        const response = await fetch(imgData);
        const blob = await response.blob();
        const file = new File([blob], `${apartmentName.replace(/\s+/g, '_')}_${bill.type}_Faturasi_${bill.period.replace(/\s+/g, '_')}.png`, { type: 'image/png' });

        if (navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: `${apartmentName} - ${billTypeLabels[bill.type]} Faturası`,
              text: `${apartmentName} ${bill.period} dönemi ${billTypeLabels[bill.type]} faturası bölüşüm tablosu.`,
            });
            onAddToast({ type: 'success', message: 'Görsel başarıyla paylaşıldı!' });
            setExporting(false);
            return;
          } catch (shareError) {
            console.log('Share dismissed, downloading file instead:', shareError);
          }
        }
      }

      // Download Fallback
      const link = document.createElement('a');
      link.download = `${apartmentName.replace(/\s+/g, '_')}_${bill.type}_Faturasi_${bill.period.replace(/\s+/g, '_')}.png`;
      link.href = imgData;
      link.click();
      onAddToast({ type: 'success', message: 'Görsel indirildi!' });
    } catch (error) {
      console.error('Görsel kaydetme hatası:', error);
      onAddToast({ type: 'error', message: 'Görsel oluşturulurken bir hata oluştu.' });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-neutral-900/60 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800">
        <div>
          <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 font-outfit">Paylaşım Kartı Önizlemesi</h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Daire sakinleriyle paylaşmak için görsel olarak indirin veya kopyalayın.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
          {bill.type === 'electricity' && (
            <label className="flex items-center gap-2 text-xs font-semibold text-neutral-700 dark:text-neutral-350 cursor-pointer">
              <input
                type="checkbox"
                checked={showDetails}
                onChange={(e) => setShowDetails(e.target.checked)}
                className="w-4 h-4 rounded border-neutral-350 dark:border-neutral-800 text-neutral-950 dark:text-neutral-100 focus:ring-0 focus:ring-offset-0 bg-transparent accent-neutral-950 dark:accent-neutral-100 cursor-pointer"
              />
              <span>Detaylı Görünüm</span>
            </label>
          )}
          <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-950/60 p-1 rounded-xl border border-neutral-200 dark:border-neutral-800 w-full sm:w-auto">
            <button
              onClick={() => setViewMode('mobile')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'mobile'
                  ? 'bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 shadow-md'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              Mobil Görünüm
            </button>
            <button
              onClick={() => setViewMode('excel')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'excel'
                  ? 'bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 shadow-md'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              Excel Tablo
            </button>
          </div>
        </div>
      </div>

      {/* Capture Area */}
      <div className="overflow-x-auto rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xl dark:shadow-2xl">
        <div
          id="share-card"
          ref={cardRef}
          className="p-6 sm:p-8 bg-white dark:bg-slate-950 text-neutral-900 dark:text-slate-100 border-2 border-neutral-200 dark:border-neutral-800 rounded-2xl min-w-[320px] max-w-[650px] mx-auto space-y-6 relative overflow-hidden transition-colors"
        >
          {/* Background Ambient Decorative Light */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-neutral-500/5 dark:bg-white/2 rounded-full blur-3xl -z-10 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-neutral-500/5 dark:bg-white/2 rounded-full blur-3xl -z-10 pointer-events-none" />

          {/* Header */}
          <div className="text-center pb-4 border-b border-neutral-200 dark:border-neutral-800/80">
            <span className="inline-block px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider mb-2 bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-950 uppercase border border-transparent">
              {billTypeLabels[bill.type]} BÖLÜŞÜMÜ
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-950 dark:text-white font-outfit uppercase">
              {apartmentName}
            </h1>
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 mt-2.5 text-xs text-neutral-500 dark:text-neutral-400 font-medium">
              <span>Dönem: <strong className="text-neutral-800 dark:text-neutral-200">{bill.period}</strong></span>
              <span className="text-neutral-300 dark:text-neutral-700">•</span>
              <span>Toplam Tutar: <strong className="text-neutral-900 dark:text-white font-extrabold">₺{formatCurrency(bill.totalAmount)}</strong></span>
            </div>
            <p className="text-xs text-neutral-800 dark:text-neutral-200 font-bold mt-2 bg-neutral-100 dark:bg-neutral-900 py-1 px-3.5 rounded-lg border border-neutral-200 dark:border-neutral-800 inline-block">
              Son Ödeme Tarihi: {formatDate(bill.dueDate)}
            </p>
          </div>

          {/* Content Layout */}
          {viewMode === 'mobile' ? (
            /* Mobile Card Layout */
            <div className="space-y-2.5 max-w-md mx-auto">
              {bill.splits.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800/80 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-xs font-mono font-bold text-neutral-500 dark:text-neutral-400">
                      {idx + 1}
                    </div>
                    <div>
                      <span className="font-bold text-neutral-900 dark:text-neutral-200 text-sm block">{item.name}</span>
                      <span className="text-[10px] text-neutral-500 dark:text-neutral-500 block font-medium">
                        {item.count} Kişi {bill.type === 'electricity' && showDetails && item.breakdown && (
                          <span>• Ortak: ₺{formatCurrency(item.breakdown.commonShare)} | Sabit: ₺{formatCurrency(item.breakdown.fixedShare)} | Kişisel: ₺{formatCurrency(item.breakdown.personalShare)}</span>
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-neutral-950 dark:text-white block font-mono">
                      ₺{formatCurrency(item.share)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Excel-Style Table Layout */
            <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full border-collapse border border-neutral-200 dark:border-neutral-800 text-left text-xs bg-neutral-50/50 dark:bg-neutral-900/40 rounded-xl overflow-hidden">
                <thead>
                  <tr className="bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 text-[10px] font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                    <th className="p-3 border-r border-neutral-200 dark:border-neutral-800 text-center">#</th>
                    <th className="p-3 border-r border-neutral-200 dark:border-neutral-800">Daire Sakini</th>
                    <th className="p-3 border-r border-neutral-200 dark:border-neutral-800 text-center">Kişi</th>
                    {bill.type === 'electricity' && showDetails ? (
                      <>
                        <th className="p-3 border-r border-neutral-200 dark:border-neutral-800 text-right">Ortak Pay</th>
                        <th className="p-3 border-r border-neutral-200 dark:border-neutral-800 text-right">Sabit Pay</th>
                        <th className="p-3 border-r border-neutral-200 dark:border-neutral-800 text-right">Kişisel Pay</th>
                      </>
                    ) : null}
                    <th className="p-3 text-right">Toplam Tutar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800/80 font-mono text-neutral-700 dark:text-neutral-300">
                  {bill.splits.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-neutral-100 dark:hover:bg-neutral-900/30">
                      <td className="p-3 border-r border-neutral-200 dark:border-neutral-800 text-center text-neutral-400 dark:text-neutral-500 font-bold">{idx + 1}</td>
                      <td className="p-3 border-r border-neutral-200 dark:border-neutral-800 font-sans font-bold text-neutral-900 dark:text-neutral-200">{item.name}</td>
                      <td className="p-3 border-r border-neutral-200 dark:border-neutral-800 text-center">{item.count}</td>
                      {bill.type === 'electricity' && showDetails && item.breakdown ? (
                        <>
                          <td className="p-3 border-r border-neutral-200 dark:border-neutral-800 text-right">₺{formatCurrency(item.breakdown.commonShare)}</td>
                          <td className="p-3 border-r border-neutral-200 dark:border-neutral-800 text-right">₺{formatCurrency(item.breakdown.fixedShare)}</td>
                          <td className="p-3 border-r border-neutral-200 dark:border-neutral-800 text-right">₺{formatCurrency(item.breakdown.personalShare)}</td>
                        </>
                      ) : null}
                      <td className="p-3 text-right font-extrabold text-neutral-950 dark:text-white bg-neutral-100/50 dark:bg-neutral-900/10">
                        ₺{formatCurrency(item.share)}
                      </td>
                    </tr>
                  ))}
                  {/* Totals Row */}
                  <tr className="bg-neutral-100 dark:bg-neutral-900 font-bold border-t-2 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white">
                    <td className="p-3 border-r border-neutral-200 dark:border-neutral-800 text-center">-</td>
                    <td className="p-3 border-r border-neutral-200 dark:border-neutral-800 font-sans">TOPLAM</td>
                    <td className="p-3 border-r border-neutral-200 dark:border-neutral-800 text-center">
                      {bill.splits.reduce((sum, item) => sum + item.count, 0)}
                    </td>
                    {bill.type === 'electricity' && showDetails ? (
                      <>
                        <td className="p-3 border-r border-neutral-200 dark:border-neutral-800 text-right">
                          ₺{formatCurrency(bill.splits.reduce((sum, item) => sum + (item.breakdown?.commonShare || 0), 0))}
                        </td>
                        <td className="p-3 border-r border-neutral-200 dark:border-neutral-800 text-right">
                          ₺{formatCurrency(bill.splits.reduce((sum, item) => sum + (item.breakdown?.fixedShare || 0), 0))}
                        </td>
                        <td className="p-3 border-r border-neutral-200 dark:border-neutral-800 text-right">
                          ₺{formatCurrency(bill.splits.reduce((sum, item) => sum + (item.breakdown?.personalShare || 0), 0))}
                        </td>
                      </>
                    ) : null}
                    <td className="p-3 text-right text-neutral-950 dark:text-white font-black">
                      ₺{formatCurrency(bill.totalAmount)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Footer Details */}
          <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800/80 text-[10px] text-neutral-500 dark:text-neutral-500 font-medium space-y-1">
            <p className="flex justify-between">
              <span>Bölüşüm Yöntemi:</span>
              <span className="text-neutral-800 dark:text-neutral-400 font-semibold">
                {bill.type === 'electricity' 
                  ? `%${bill.ratios?.common || 10} Ortak | %${bill.ratios?.fixed || 30} Sabit | %${bill.ratios?.personal || 60} Kişisel`
                  : bill.type === 'water' 
                  ? 'Kişi Sayısına Göre Orantılı Su Dağıtımı' 
                  : 'Daire Başı Eşit Aidat Dağıtımı'}
              </span>
            </p>
            <p className="text-center text-[9px] text-neutral-400 dark:text-neutral-600 pt-2 font-mono">
              {apartmentName} Yönetimi tarafından otomatik hesaplanmıştır.
            </p>
          </div>
        </div>
      </div>

      {/* Share card action buttons */}
      <div className="flex flex-col sm:flex-row justify-center items-center gap-3">
        <button
          onClick={handleCopyText}
          disabled={copying}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white hover:bg-neutral-50 dark:bg-neutral-900 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 active:bg-neutral-100 dark:active:bg-neutral-950 text-neutral-800 dark:text-neutral-200 px-6 py-3 rounded-xl text-sm font-semibold transition-all shadow-md"
        >
          {copying ? (
            <>
              <Check className="w-4 h-4 text-neutral-950 dark:text-white" />
              Kopyalandı!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
              WhatsApp Metnini Kopyala
            </>
          )}
        </button>

        <button
          onClick={handleExportImage}
          disabled={exporting}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-neutral-950 hover:bg-neutral-800 active:bg-neutral-900 dark:bg-white dark:hover:bg-neutral-200 dark:active:bg-neutral-100 text-white dark:text-neutral-950 px-6 py-3 rounded-xl text-sm font-semibold shadow-lg shadow-neutral-950/10 dark:shadow-neutral-950/35 transition-all"
        >
          {exporting ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white dark:border-neutral-950/30 dark:border-t-neutral-950 rounded-full animate-spin" />
          ) : (
            <Share2 className="w-4 h-4" />
          )}
          Tabloyu Görsel Olarak Paylaş / İndir
        </button>
      </div>
    </div>
  );
}
