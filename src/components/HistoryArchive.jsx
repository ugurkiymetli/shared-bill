import React, { useState, useMemo } from 'react';
import { Calendar, Trash2, Edit2, Eye, FileText, SlidersHorizontal, ArrowUpDown } from 'lucide-react';

const BILL_TYPES = [
  { value: 'all',         label: 'Tüm Tipler' },
  { value: 'electricity', label: '⚡ Elektrik' },
  { value: 'water',       label: '💧 Su' },
  { value: 'maintenance', label: '🏢 Aidat' },
];

const SORT_OPTIONS = [
  { value: 'savedAt_desc',   label: 'Kayıt Tarihi (Yeni → Eski)' },
  { value: 'savedAt_asc',    label: 'Kayıt Tarihi (Eski → Yeni)' },
  { value: 'dueDate_desc',   label: 'Son Ödeme (Yeni → Eski)' },
  { value: 'dueDate_asc',    label: 'Son Ödeme (Eski → Yeni)' },
  { value: 'amount_desc',    label: 'Tutar (Yüksek → Düşük)' },
  { value: 'amount_asc',     label: 'Tutar (Düşük → Yüksek)' },
];

export default function HistoryArchive({ bills, onViewDetails, onEditBill, onDeleteBill }) {
  const [filterType, setFilterType] = useState('all');
  const [sortKey,    setSortKey]    = useState('savedAt_desc');

  const billTypeMetadata = {
    electricity: {
      label: 'Elektrik',
      icon: '⚡',
      color: 'text-neutral-800 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800'
    },
    water: {
      label: 'Su',
      icon: '💧',
      color: 'text-neutral-800 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800'
    },
    maintenance: {
      label: 'Aidat',
      icon: '🏢',
      color: 'text-neutral-800 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800'
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) return `${parts[2]}.${parts[1]}.${parts[0]}`;
      return dateStr;
    } catch { return dateStr; }
  };

  const processedBills = useMemo(() => {
    // 1. Filter
    let result = filterType === 'all' ? [...bills] : bills.filter(b => b.type === filterType);

    // 2. Sort
    const [field, dir] = sortKey.split('_');
    const asc = dir === 'asc';

    result.sort((a, b) => {
      let av, bv;
      if (field === 'savedAt') {
        av = new Date(a.savedAt || 0).getTime();
        bv = new Date(b.savedAt || 0).getTime();
      } else if (field === 'dueDate') {
        av = new Date(a.dueDate || '0000-01-01').getTime();
        bv = new Date(b.dueDate || '0000-01-01').getTime();
      } else if (field === 'amount') {
        av = Number(a.totalAmount || 0);
        bv = Number(b.totalAmount || 0);
      }
      return asc ? av - bv : bv - av;
    });

    return result;
  }, [bills, filterType, sortKey]);

  const controlBase = 'flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border transition-all cursor-pointer whitespace-nowrap';
  const selectBase = 'w-full text-xs font-semibold bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-xl px-3 py-2 pr-7 appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-600 transition-all';

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="bg-white dark:bg-neutral-900/60 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2 font-outfit">
              <FileText className="w-5 h-5" />
              Fatura Arşivi
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Kaydedilmiş geçmiş faturaları görüntüleyin, düzenleyin veya silin.
            </p>
          </div>
          <div className="bg-neutral-100 dark:bg-neutral-950/80 px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-600 dark:text-neutral-400 shrink-0">
            {processedBills.length !== bills.length
              ? <><strong className="text-neutral-900 dark:text-neutral-100">{processedBills.length}</strong> / {bills.length} kayıt</>
              : <>Toplam: <strong className="text-neutral-900 dark:text-neutral-100">{bills.length}</strong> kayıt</>
            }
          </div>
        </div>

        {/* Filter & Sort Controls */}
        {bills.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800/60">
            {/* Filter pills */}
            <div className="flex flex-wrap items-center gap-1.5 flex-1">
              <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500 shrink-0" />
              {BILL_TYPES.map(t => (
                <button
                  key={t.value}
                  onClick={() => setFilterType(t.value)}
                  className={`${controlBase} ${filterType === t.value
                    ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-950 border-transparent shadow-sm'
                    : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700 hover:text-neutral-900 dark:hover:text-white'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Sort dropdown — full width on mobile, auto on desktop */}
            <div className="flex items-center gap-2 sm:shrink-0">
              <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500 shrink-0" />
              <div className="relative flex-1 sm:flex-none">
                <select
                  value={sortKey}
                  onChange={e => setSortKey(e.target.value)}
                  className={selectBase + ' sm:w-auto'}
                >
                  {SORT_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
                  <svg className="w-3 h-3 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Empty states */}
      {bills.length === 0 ? (
        <div className="bg-neutral-100/50 dark:bg-neutral-900/20 border border-neutral-200 dark:border-neutral-800/80 rounded-2xl p-12 text-center text-neutral-400 dark:text-neutral-550">
          <FileText className="w-12 h-12 mx-auto text-neutral-300 dark:text-neutral-700 mb-3" />
          <p className="text-sm font-semibold">Arşivde henüz fatura bulunmuyor.</p>
          <p className="text-xs text-neutral-400 dark:text-neutral-600 mt-1">Yeni fatura hesaplayıp kaydederek arşivi doldurabilirsiniz.</p>
        </div>
      ) : processedBills.length === 0 ? (
        <div className="bg-neutral-100/50 dark:bg-neutral-900/20 border border-neutral-200 dark:border-neutral-800/80 rounded-2xl p-12 text-center text-neutral-400">
          <SlidersHorizontal className="w-10 h-10 mx-auto text-neutral-300 dark:text-neutral-700 mb-3" />
          <p className="text-sm font-semibold">Bu filtre için sonuç bulunamadı.</p>
          <button onClick={() => setFilterType('all')} className="mt-3 text-xs underline text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors">
            Filtreyi temizle
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {processedBills.map((bill) => {
            const meta = billTypeMetadata[bill.type] || {
              label: 'Diğer', icon: '📋',
              color: 'text-neutral-800 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800'
            };

            return (
              <div
                key={bill.id}
                className="bg-white dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800/80 hover:border-neutral-300 dark:hover:border-neutral-700 rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all hover:shadow-md dark:hover:shadow-xl shadow-neutral-950/5 dark:shadow-slate-950/50"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${meta.color}`}>
                        <span>{meta.icon}</span>
                        <span>{meta.label.toUpperCase()}</span>
                      </span>
                      <span className="text-xs text-neutral-400 dark:text-neutral-500 font-mono">
                        {new Date(bill.savedAt).toLocaleDateString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-neutral-950 dark:text-white font-outfit">{bill.period}</h3>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" />
                        Son Ödeme: <span className="text-neutral-700 dark:text-neutral-300 font-bold">{formatDate(bill.dueDate)}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-neutral-400 dark:text-neutral-500 block font-medium">Toplam Tutar</span>
                    <span className="text-lg font-black text-neutral-950 dark:text-neutral-100 font-mono block">
                      ₺{Number(bill.totalAmount).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {bill.type === 'electricity' && bill.ratios && (
                  <div className="text-[10px] text-neutral-500 dark:text-neutral-400 bg-neutral-50/50 dark:bg-neutral-950/40 p-2 rounded-lg border border-neutral-200 dark:border-neutral-800/40 flex justify-between">
                    <span>⚡ Ortak: %{bill.ratios.common}</span>
                    <span>⚙️ Sabit: %{bill.ratios.fixed}</span>
                    <span>👥 Kişisel: %{bill.ratios.personal}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800/60">
                  <button
                    onClick={() => onViewDetails(bill)}
                    className="flex items-center gap-1 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 px-3 py-2 rounded-xl transition-all"
                    title="Paylaşım Kartını Gör"
                  >
                    <Eye className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-400" />
                    Detaylar
                  </button>
                  <button
                    onClick={() => onEditBill(bill)}
                    className="flex items-center gap-1 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 px-3 py-2 rounded-xl transition-all"
                    title="Düzenle ve Yeniden Hesapla"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-400" />
                    Düzenle
                  </button>
                  <button
                    onClick={() => onDeleteBill(bill.id)}
                    className="flex items-center gap-1 text-xs font-semibold text-rose-500 dark:text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/20 px-3 py-2 rounded-xl transition-all"
                    title="Arşivden Sil"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Sil
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
