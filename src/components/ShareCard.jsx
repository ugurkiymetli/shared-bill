import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import { Image, Copy, Check, Table, Smartphone, Share2 } from 'lucide-react';

export default function ShareCard({ bill, apartmentName = "Apartman", onAddToast }) {
  const [viewMode, setViewMode] = useState('mobile'); // 'excel' or 'mobile'
  const [copying, setCopying] = useState(false);
  const [exporting, setExporting] = useState(false);
  const cardRef = useRef(null);

  if (!bill || !bill.splits || bill.splits.length === 0) return null;

  const billTypeLabels = {
    electricity: 'ELEKTRİK',
    water: 'SU',
    maintenance: 'ORTAK GİDER (AİDAT / BAKIM)'
  };

  const billTypeColorSchemes = {
    electricity: {
      border: 'border-amber-500/30',
      badge: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
      glow: 'shadow-glow-amber',
      accentText: 'text-amber-400',
      accentBg: 'bg-amber-500/20'
    },
    water: {
      border: 'border-blue-500/30',
      badge: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
      glow: 'shadow-glow-blue',
      accentText: 'text-blue-400',
      accentBg: 'bg-blue-500/20'
    },
    maintenance: {
      border: 'border-emerald-500/30',
      badge: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      glow: 'shadow-glow-emerald',
      accentText: 'text-emerald-400',
      accentBg: 'bg-emerald-500/20'
    }
  };

  const scheme = billTypeColorSchemes[bill.type] || billTypeColorSchemes.maintenance;

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
    text += `Toplam Tutar: ₺${Number(bill.totalAmount).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
    text += `Son Ödeme Tarihi: ${formatDate(bill.dueDate)}\n`;
    text += `----------------------------\n`;
    
    bill.splits.forEach(item => {
      text += `• ${item.name} (${item.count} Kişi): ₺${Number(item.share).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
      if (bill.type === 'electricity' && item.breakdown) {
        const bd = item.breakdown;
        text += `  (Ortak: ₺${bd.commonShare} | Sabit: ₺${bd.fixedShare} | Kişisel: ₺${bd.personalShare})\n`;
      }
    });
    
    text += `----------------------------\n`;
    text += `*Hesaplama Detayları:*\n`;
    if (bill.type === 'electricity') {
      text += `Rasyolar: %${bill.ratios?.common || 10} Ortak | %${bill.ratios?.fixed || 30} Sabit | %${bill.ratios?.personal || 60} Kişisel\n`;
    } else if (bill.type === 'water') {
      const totalCount = bill.splits.reduce((sum, item) => sum + item.count, 0);
      const perResident = (bill.totalAmount / totalCount).toFixed(2);
      text += `Kişi Başı Su Ücreti: ₺${perResident}\n`;
    } else {
      text += `Eşit Paylaşım: Daire Başı ₺${(bill.totalAmount / 9).toFixed(2)}\n`;
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
      // Create high resolution image using scale
      const canvas = await html2canvas(cardRef.current, {
        useCORS: true,
        scale: 2, 
        backgroundColor: '#020617', // Slate-950
        logging: false,
        allowTaint: true,
      });

      const imgData = canvas.toDataURL('image/png');

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
            // User cancelled or share dismissed, proceed to default download fallback
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-slate-100 font-outfit">Paylaşım Kartı Önizlemesi</h3>
          <p className="text-xs text-slate-400 mt-0.5">Daire sakinleriyle paylaşmak için görsel olarak indirin veya kopyalayın.</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-950/60 p-1 rounded-xl border border-slate-800 w-full sm:w-auto">
          <button
            onClick={() => setViewMode('mobile')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'mobile'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            Mobil Görünüm
          </button>
          <button
            onClick={() => setViewMode('excel')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'excel'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            Excel Tablo
          </button>
        </div>
      </div>

      {/* Capture Area */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 shadow-2xl">
        <div
          id="share-card"
          ref={cardRef}
          className={`p-6 sm:p-8 bg-slate-950 text-slate-100 border-2 ${scheme.border} ${scheme.glow} rounded-2xl min-w-[320px] max-w-[650px] mx-auto space-y-6 relative overflow-hidden`}
        >
          {/* Background Ambient Decorative Light */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />

          {/* Header */}
          <div className="text-center pb-4 border-b border-slate-800/80">
            <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold tracking-wider mb-2 uppercase ${scheme.badge}`}>
              {billTypeLabels[bill.type]} BÖLÜŞÜMÜ
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-outfit uppercase">
              {apartmentName}
            </h1>
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 mt-2.5 text-xs text-slate-400 font-medium">
              <span>Dönem: <strong className="text-slate-200">{bill.period}</strong></span>
              <span className="text-slate-600">•</span>
              <span>Toplam Tutar: <strong className={scheme.accentText}>₺{Number(bill.totalAmount).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
            </div>
            <p className="text-xs text-rose-400/90 font-semibold mt-2 bg-rose-950/20 py-1 px-3 rounded-lg border border-rose-500/10 inline-block">
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
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/60 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-xs font-mono font-bold text-slate-400">
                      {idx + 1}
                    </div>
                    <div>
                      <span className="font-bold text-slate-200 text-sm block">{item.name}</span>
                      <span className="text-[10px] text-slate-500 block font-medium">
                        {item.count} Kişi {bill.type === 'electricity' && item.breakdown && (
                          <span>• Ortak: ₺{item.breakdown.commonShare} | Sabit: ₺{item.breakdown.fixedShare} | Kişisel: ₺{item.breakdown.personalShare}</span>
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-white block font-mono">
                      ₺{Number(item.share).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Excel-Style Table Layout */
            <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full border-collapse border border-slate-800 text-left text-xs bg-slate-900/40 rounded-xl overflow-hidden">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="p-3 border-r border-slate-800 text-center">#</th>
                    <th className="p-3 border-r border-slate-800">Daire Sakini</th>
                    <th className="p-3 border-r border-slate-800 text-center">Kişi</th>
                    {bill.type === 'electricity' ? (
                      <>
                        <th className="p-3 border-r border-slate-800 text-right">Ortak Pay</th>
                        <th className="p-3 border-r border-slate-800 text-right">Sabit Pay</th>
                        <th className="p-3 border-r border-slate-800 text-right">Kişisel Pay</th>
                      </>
                    ) : bill.type === 'water' ? (
                      <th className="p-3 border-r border-slate-800 text-right">Kişi Başı</th>
                    ) : null}
                    <th className="p-3 text-right">Toplam Tutar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-mono text-slate-300">
                  {bill.splits.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-slate-900/30">
                      <td className="p-3 border-r border-slate-800 text-center text-slate-500 font-bold">{idx + 1}</td>
                      <td className="p-3 border-r border-slate-800 font-sans font-bold text-slate-200">{item.name}</td>
                      <td className="p-3 border-r border-slate-800 text-center">{item.count}</td>
                      {bill.type === 'electricity' && item.breakdown ? (
                        <>
                          <td className="p-3 border-r border-slate-800 text-right">₺{item.breakdown.commonShare}</td>
                          <td className="p-3 border-r border-slate-800 text-right">₺{item.breakdown.fixedShare}</td>
                          <td className="p-3 border-r border-slate-800 text-right">₺{item.breakdown.personalShare}</td>
                        </>
                      ) : bill.type === 'water' && item.breakdown ? (
                        <td className="p-3 border-r border-slate-800 text-right">₺{item.breakdown.perResident}</td>
                      ) : null}
                      <td className="p-3 text-right font-extrabold text-white bg-slate-900/10">
                        ₺{Number(item.share).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                  {/* Totals Row */}
                  <tr className="bg-slate-900 font-bold border-t-2 border-slate-800 text-white">
                    <td className="p-3 border-r border-slate-800 text-center">-</td>
                    <td className="p-3 border-r border-slate-800 font-sans">TOPLAM</td>
                    <td className="p-3 border-r border-slate-800 text-center">
                      {bill.splits.reduce((sum, item) => sum + item.count, 0)}
                    </td>
                    {bill.type === 'electricity' ? (
                      <>
                        <td className="p-3 border-r border-slate-800 text-right">
                          ₺{bill.splits.reduce((sum, item) => sum + (item.breakdown?.commonShare || 0), 0).toFixed(2)}
                        </td>
                        <td className="p-3 border-r border-slate-800 text-right">
                          ₺{bill.splits.reduce((sum, item) => sum + (item.breakdown?.fixedShare || 0), 0).toFixed(2)}
                        </td>
                        <td className="p-3 border-r border-slate-800 text-right">
                          ₺{bill.splits.reduce((sum, item) => sum + (item.breakdown?.personalShare || 0), 0).toFixed(2)}
                        </td>
                      </>
                    ) : bill.type === 'water' ? (
                      <td className="p-3 border-r border-slate-800 text-right">-</td>
                    ) : null}
                    <td className="p-3 text-right text-emerald-400 font-extrabold">
                      ₺{Number(bill.totalAmount).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Footer Details */}
          <div className="pt-4 border-t border-slate-800/80 text-[10px] text-slate-500 font-medium space-y-1">
            <p className="flex justify-between">
              <span>Bölüşüm Yöntemi:</span>
              <span className="text-slate-400 font-semibold">
                {bill.type === 'electricity' 
                  ? `%${bill.ratios?.common || 10} Ortak | %${bill.ratios?.fixed || 30} Sabit | %${bill.ratios?.personal || 60} Kişisel`
                  : bill.type === 'water' 
                  ? 'Kişi Sayısına Göre Orantılı Su Dağıtımı' 
                  : 'Daire Başı Eşit Aidat Dağıtımı'}
              </span>
            </p>
            <p className="text-center text-[9px] text-slate-600 pt-2 font-mono">
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
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 active:bg-slate-950 text-slate-200 px-6 py-3 rounded-xl text-sm font-semibold transition-all shadow-md"
        >
          {copying ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              Kopyalandı!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-slate-400" />
              WhatsApp Metnini Kopyala
            </>
          )}
        </button>

        <button
          onClick={handleExportImage}
          disabled={exporting}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white px-6 py-3 rounded-xl text-sm font-semibold shadow-lg shadow-emerald-950/30 hover:shadow-glow-emerald transition-all"
        >
          {exporting ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Share2 className="w-4 h-4" />
          )}
          Tabloyu Görsel Olarak Paylaş / İndir
        </button>
      </div>
    </div>
  );
}
