import React, { useState, useRef } from 'react';
import { Image, Copy, Check, Table, Smartphone, Share2 } from 'lucide-react';

export default function ShareCard({ bill, apartmentName = "Apartman", onAddToast }) {
  const [viewMode, setViewMode] = useState('mobile');
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

  const billTypeFullLabels = {
    electricity: 'Elektrik Faturası',
    water: 'Su Faturası',
    maintenance: 'Aidat / Bakım'
  };

  const formatCurrency = (val) =>
    Number(val || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) return `${parts[2]}.${parts[1]}.${parts[0]}`;
      return dateStr;
    } catch { return dateStr; }
  };

  // ── WhatsApp text copy ──────────────────────────────────────────────────────
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
    if (bill.type === 'electricity') {
      text += `Rasyolar: %${bill.ratios?.common || 10} Ortak | %${bill.ratios?.fixed || 30} Sabit | %${bill.ratios?.personal || 60} Kişisel\n`;
    } else if (bill.type === 'water') {
      const totalCount = bill.splits.reduce((s, i) => s + i.count, 0);
      text += `Kişi Başı Su Ücreti: ₺${formatCurrency(bill.totalAmount / totalCount)}\n`;
    }
    navigator.clipboard.writeText(text)
      .then(() => {
        onAddToast({ type: 'success', message: 'Fatura metni WhatsApp formatında kopyalandı!' });
        setTimeout(() => setCopying(false), 2000);
      })
      .catch(() => setCopying(false));
  };

  // ── Canvas-based image export ───────────────────────────────────────────────
  const handleExportImage = async () => {
    setExporting(true);
    onAddToast({ type: 'info', message: 'Görsel oluşturuluyor...' });

    try {
      const isDark = document.documentElement.classList.contains('dark');

      // ── Colours ──
      const BG       = isDark ? '#0a0a0a' : '#ffffff';
      const FG       = isDark ? '#f5f5f5' : '#0a0a0a';
      const BORDER   = isDark ? '#2a2a2a' : '#333333';
      const HEAD_BG  = isDark ? '#1a1a1a' : '#1a1a1a';
      const HEAD_FG  = '#ffffff';
      const EVEN_BG  = isDark ? '#111111' : '#f5f5f5';
      const ODD_BG   = isDark ? '#0a0a0a' : '#ffffff';
      const TOTAL_BG = isDark ? '#1a1a1a' : '#1a1a1a';
      const TOTAL_FG = '#ffffff';
      const MUTED    = isDark ? '#888888' : '#555555';

      // ── Layout constants ──
      const SCALE  = 2;          // HiDPI
      const W      = 520;        // logical width
      const PAD    = 24;
      const ROW_H  = 38;
      const INFO_H = 120;        // header info block
      const FOOT_H = 48;

      // Determine columns
      const showElecDetail = bill.type === 'electricity' && showDetails;
      const cols = showElecDetail
        ? ['Daire Sakini', 'Kişi', 'Ortak Pay', 'Sabit Pay', 'Kişisel Pay', 'Toplam']
        : ['Daire Sakini', 'Kişi', 'Toplam Tutar'];

      const colWidths = showElecDetail
        ? [130, 50, 85, 85, 85, 85]
        : [220, 60, 140]; // sums to 420, rest is pad

      const tableW = colWidths.reduce((a, b) => a + b, 0);
      const tableLeft = (W - tableW) / 2;

      const rows = bill.splits.length;
      const totalH = INFO_H + ROW_H + (rows + 1) * ROW_H + FOOT_H + PAD * 2;

      const canvas  = document.createElement('canvas');
      canvas.width  = W * SCALE;
      canvas.height = totalH * SCALE;
      const ctx = canvas.getContext('2d');
      ctx.scale(SCALE, SCALE);

      // helpers
      const rect = (x, y, w, h, fill) => { ctx.fillStyle = fill; ctx.fillRect(x, y, w, h); };
      const line = (x1, y1, x2, y2) => { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); };
      const txt = (t, x, y, font, color, align = 'left') => {
        ctx.font = font; ctx.fillStyle = color; ctx.textAlign = align;
        ctx.fillText(String(t), x, y);
      };

      // ── Background ──
      rect(0, 0, W, totalH, BG);

      // ── Info block ──
      let cy = PAD;
      txt(billTypeFullLabels[bill.type] + ' Bölüşüm Tablosu', W / 2, cy + 18, 'bold 15px Arial', FG, 'center');
      cy += 30;
      txt(apartmentName, W / 2, cy + 16, 'bold 20px Arial', FG, 'center');
      cy += 26;
      txt(`Dönem: ${bill.period}`, W / 2, cy + 14, '13px Arial', MUTED, 'center');
      cy += 20;
      txt(`Toplam: ₺${formatCurrency(bill.totalAmount)}`, W / 2, cy + 14, 'bold 13px Arial', FG, 'center');
      cy += 20;
      if (bill.dueDate) {
        txt(`Son Ödeme: ${formatDate(bill.dueDate)}`, W / 2, cy + 13, '12px Arial', MUTED, 'center');
        cy += 18;
      }
      cy += 8;

      // ── Column header row ──
      ctx.strokeStyle = BORDER;
      ctx.lineWidth = 1;
      let tableTop = cy;

      rect(tableLeft, tableTop, tableW, ROW_H, HEAD_BG);
      let cx = tableLeft;
      cols.forEach((col, i) => {
        const align = i === 0 ? 'left' : 'center';
        const tx = i === 0 ? cx + 8 : cx + colWidths[i] / 2;
        txt(col.toUpperCase(), tx, tableTop + ROW_H / 2 + 5, 'bold 10px Arial', HEAD_FG, align);
        if (i < cols.length - 1) {
          ctx.strokeStyle = '#444';
          line(cx + colWidths[i], tableTop, cx + colWidths[i], tableTop + ROW_H);
        }
        cx += colWidths[i];
      });
      // border around header
      ctx.strokeStyle = BORDER;
      ctx.strokeRect(tableLeft, tableTop, tableW, ROW_H);
      cy += ROW_H;

      // ── Data rows ──
      bill.splits.forEach((item, idx) => {
        const rowBG = idx % 2 === 0 ? EVEN_BG : ODD_BG;
        rect(tableLeft, cy, tableW, ROW_H, rowBG);

        const values = showElecDetail
          ? [
              item.name,
              item.count,
              `₺${formatCurrency(item.breakdown?.commonShare || 0)}`,
              `₺${formatCurrency(item.breakdown?.fixedShare || 0)}`,
              `₺${formatCurrency(item.breakdown?.personalShare || 0)}`,
              `₺${formatCurrency(item.share)}`
            ]
          : [item.name, item.count, `₺${formatCurrency(item.share)}`];

        cx = tableLeft;
        values.forEach((val, i) => {
          const isName  = i === 0;
          const isTotal = i === values.length - 1;
          const align   = isName ? 'left' : 'center';
          const tx      = isName ? cx + 8 : cx + colWidths[i] / 2;
          const font    = isTotal ? 'bold 12px Arial' : isName ? 'bold 12px Arial' : '12px Arial';
          txt(val, tx, cy + ROW_H / 2 + 4, font, FG, align);

          // vertical dividers
          if (i < values.length - 1) {
            ctx.strokeStyle = BORDER;
            line(cx + colWidths[i], cy, cx + colWidths[i], cy + ROW_H);
          }
          cx += colWidths[i];
        });
        ctx.strokeStyle = BORDER;
        ctx.strokeRect(tableLeft, cy, tableW, ROW_H);
        cy += ROW_H;
      });

      // ── Total row ──
      rect(tableLeft, cy, tableW, ROW_H, TOTAL_BG);
      const totalCount = bill.splits.reduce((s, i) => s + i.count, 0);
      const totalValues = showElecDetail
        ? [
            'TOPLAM', totalCount,
            `₺${formatCurrency(bill.splits.reduce((s, i) => s + (i.breakdown?.commonShare || 0), 0))}`,
            `₺${formatCurrency(bill.splits.reduce((s, i) => s + (i.breakdown?.fixedShare || 0), 0))}`,
            `₺${formatCurrency(bill.splits.reduce((s, i) => s + (i.breakdown?.personalShare || 0), 0))}`,
            `₺${formatCurrency(bill.totalAmount)}`
          ]
        : ['TOPLAM', totalCount, `₺${formatCurrency(bill.totalAmount)}`];

      cx = tableLeft;
      totalValues.forEach((val, i) => {
        const align = i === 0 ? 'left' : 'center';
        const tx    = i === 0 ? cx + 8 : cx + colWidths[i] / 2;
        txt(val, tx, cy + ROW_H / 2 + 4, 'bold 12px Arial', TOTAL_FG, align);
        if (i < totalValues.length - 1) {
          ctx.strokeStyle = '#444';
          line(cx + colWidths[i], cy, cx + colWidths[i], cy + ROW_H);
        }
        cx += colWidths[i];
      });
      ctx.strokeStyle = BORDER;
      ctx.strokeRect(tableLeft, cy, tableW, ROW_H);
      cy += ROW_H;

      // ── Footer note ──
      cy += 12;
      txt(`${apartmentName} Yönetimi tarafından otomatik hesaplanmıştır.`, W / 2, cy + 12, '10px Arial', MUTED, 'center');

      // ── Export ──
      const dataUrl = canvas.toDataURL('image/png');
      const fileName = `${apartmentName.replace(/\s+/g, '_')}_${bill.type}_${bill.period.replace(/\s+/g, '_')}.png`;

      // Try Web Share (mobile)
      if (navigator.share && navigator.canShare) {
        const res  = await fetch(dataUrl);
        const blob = await res.blob();
        const file = new File([blob], fileName, { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: `${apartmentName} - ${billTypeLabels[bill.type]} Faturası`,
              text: `${bill.period} dönemi fatura bölüşüm tablosu.`,
            });
            onAddToast({ type: 'success', message: 'Görsel başarıyla paylaşıldı!' });
            return;
          } catch { /* user dismissed — fall through to download */ }
        }
      }

      // Download fallback (desktop)
      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      link.click();
      onAddToast({ type: 'success', message: 'Tablo görseli indirildi!' });

    } catch (err) {
      console.error('Canvas export hatası:', err);
      onAddToast({ type: 'error', message: 'Görsel oluşturulurken bir hata oluştu.' });
    } finally {
      setExporting(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Controls bar */}
      <div className="flex flex-wrap justify-between items-start gap-3 bg-white dark:bg-neutral-900/60 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800">
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 font-outfit">Paylaşım Kartı Önizlemesi</h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Daire sakinleriyle paylaşmak için görsel olarak indirin veya kopyalayın.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {bill.type === 'electricity' && (
            <label className="flex items-center gap-2 text-xs font-semibold text-neutral-700 dark:text-neutral-350 cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={showDetails}
                onChange={(e) => setShowDetails(e.target.checked)}
                className="w-4 h-4 rounded border-neutral-350 dark:border-neutral-800 text-neutral-950 dark:text-neutral-100 focus:ring-0 focus:ring-offset-0 bg-transparent accent-neutral-950 dark:accent-neutral-100 cursor-pointer"
              />
              <span>Detaylı Görünüm</span>
            </label>
          )}
          <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-950/60 p-1 rounded-xl border border-neutral-200 dark:border-neutral-800 shrink-0">
            <button
              onClick={() => setViewMode('mobile')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${viewMode === 'mobile'
                ? 'bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 shadow-md'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'}`}
            >
              <Smartphone className="w-3.5 h-3.5 shrink-0" />
              Mobil Görünüm
            </button>
            <button
              onClick={() => setViewMode('excel')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${viewMode === 'excel'
                ? 'bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 shadow-md'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'}`}
            >
              <Table className="w-3.5 h-3.5 shrink-0" />
              Excel Tablo
            </button>
          </div>
        </div>
      </div>

      {/* Preview card (UI only, not used for export) */}
      <div className="overflow-x-auto rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xl dark:shadow-2xl">
        <div
          id="share-card"
          ref={cardRef}
          className="p-6 bg-white dark:bg-slate-950 text-neutral-900 dark:text-slate-100 border-2 border-neutral-200 dark:border-neutral-800 rounded-2xl min-w-[320px] max-w-[600px] mx-auto space-y-6 relative overflow-hidden transition-colors"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-neutral-500/5 dark:bg-white/2 rounded-full blur-3xl -z-10 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-neutral-500/5 dark:bg-white/2 rounded-full blur-3xl -z-10 pointer-events-none" />

          {/* Header */}
          <div className="text-center pb-4 border-b border-neutral-200 dark:border-neutral-800/80">
            <span className="inline-block px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider mb-2 bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-950 uppercase border border-transparent">
              {billTypeLabels[bill.type]} BÖLÜŞÜMÜ
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight text-neutral-950 dark:text-white font-outfit uppercase">
              {apartmentName}
            </h1>
            <div className="flex flex-col items-center gap-1 mt-2.5 text-xs text-neutral-500 dark:text-neutral-400 font-medium">
              <div className="flex items-center gap-3">
                <span>Dönem: <strong className="text-neutral-800 dark:text-neutral-200">{bill.period}</strong></span>
                <span className="text-neutral-300 dark:text-neutral-700">•</span>
                <span>Toplam Tutar: <strong className="text-neutral-900 dark:text-white font-extrabold">₺{formatCurrency(bill.totalAmount)}</strong></span>
              </div>
            </div>
            <p className="text-xs text-neutral-800 dark:text-neutral-200 font-bold mt-2 bg-neutral-100 dark:bg-neutral-900 py-1 px-3.5 rounded-lg border border-neutral-200 dark:border-neutral-800 inline-block">
              Son Ödeme Tarihi: {formatDate(bill.dueDate)}
            </p>
          </div>

          {/* Content */}
          {viewMode === 'mobile' ? (
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
            <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full border-collapse border border-neutral-200 dark:border-neutral-800 text-left text-xs bg-neutral-50/50 dark:bg-neutral-900/40 rounded-xl overflow-hidden">
                <thead>
                  <tr className="bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 text-[10px] font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                    <th className="p-3 border-r border-neutral-200 dark:border-neutral-800 text-center">#</th>
                    <th className="p-3 border-r border-neutral-200 dark:border-neutral-800">Daire Sakini</th>
                    <th className="p-3 border-r border-neutral-200 dark:border-neutral-800 text-center">Kişi</th>
                    {bill.type === 'electricity' && showDetails && (
                      <>
                        <th className="p-3 border-r border-neutral-200 dark:border-neutral-800 text-right">Ortak Pay</th>
                        <th className="p-3 border-r border-neutral-200 dark:border-neutral-800 text-right">Sabit Pay</th>
                        <th className="p-3 border-r border-neutral-200 dark:border-neutral-800 text-right">Kişisel Pay</th>
                      </>
                    )}
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
                  <tr className="bg-neutral-100 dark:bg-neutral-900 font-bold border-t-2 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white">
                    <td className="p-3 border-r border-neutral-200 dark:border-neutral-800 text-center">-</td>
                    <td className="p-3 border-r border-neutral-200 dark:border-neutral-800 font-sans">TOPLAM</td>
                    <td className="p-3 border-r border-neutral-200 dark:border-neutral-800 text-center">
                      {bill.splits.reduce((s, i) => s + i.count, 0)}
                    </td>
                    {bill.type === 'electricity' && showDetails ? (
                      <>
                        <td className="p-3 border-r border-neutral-200 dark:border-neutral-800 text-right">₺{formatCurrency(bill.splits.reduce((s, i) => s + (i.breakdown?.commonShare || 0), 0))}</td>
                        <td className="p-3 border-r border-neutral-200 dark:border-neutral-800 text-right">₺{formatCurrency(bill.splits.reduce((s, i) => s + (i.breakdown?.fixedShare || 0), 0))}</td>
                        <td className="p-3 border-r border-neutral-200 dark:border-neutral-800 text-right">₺{formatCurrency(bill.splits.reduce((s, i) => s + (i.breakdown?.personalShare || 0), 0))}</td>
                      </>
                    ) : null}
                    <td className="p-3 text-right text-neutral-950 dark:text-white font-black">₺{formatCurrency(bill.totalAmount)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Footer */}
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

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row justify-center items-center gap-3">
        <button
          onClick={handleCopyText}
          disabled={copying}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white hover:bg-neutral-50 dark:bg-neutral-900 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 active:bg-neutral-100 dark:active:bg-neutral-950 text-neutral-800 dark:text-neutral-200 px-6 py-3 rounded-xl text-sm font-semibold transition-all shadow-md"
        >
          {copying ? (<><Check className="w-4 h-4 text-neutral-950 dark:text-white" />Kopyalandı!</>) : (<><Copy className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />WhatsApp Metnini Kopyala</>)}
        </button>

        <button
          onClick={handleExportImage}
          disabled={exporting}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-neutral-950 hover:bg-neutral-800 active:bg-neutral-900 dark:bg-white dark:hover:bg-neutral-200 dark:active:bg-neutral-100 text-white dark:text-neutral-950 px-6 py-3 rounded-xl text-sm font-semibold shadow-lg shadow-neutral-950/10 dark:shadow-neutral-950/35 transition-all"
        >
          {exporting
            ? <span className="w-4 h-4 border-2 border-white/30 border-t-white dark:border-neutral-950/30 dark:border-t-neutral-950 rounded-full animate-spin" />
            : <Share2 className="w-4 h-4" />}
          Tabloyu Görsel Olarak Paylaş / İndir
        </button>
      </div>
    </div>
  );
}
