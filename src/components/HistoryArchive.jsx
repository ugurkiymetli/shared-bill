import React from 'react';
import { Calendar, Trash2, Edit2, Eye, FileText } from 'lucide-react';

export default function HistoryArchive({ bills, onViewDetails, onEditBill, onDeleteBill }) {
  
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

  // Date formatter
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

  const sortedBills = [...bills].sort((a, b) => new Date(b.savedAt || 0) - new Date(a.savedAt || 0));

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-neutral-900/60 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2 font-outfit">
            <FileText className="w-5 h-5 text-neutral-900 dark:text-neutral-100" />
            Fatura Arşivi
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Kaydedilmiş geçmiş faturaları görüntüleyin, düzenleyin veya silin.
          </p>
        </div>
        <div className="bg-neutral-100 dark:bg-neutral-950/80 px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-600 dark:text-neutral-400">
          Toplam Kayıt: <strong className="text-neutral-900 dark:text-neutral-100 font-bold">{bills.length}</strong> adet
        </div>
      </div>

      {sortedBills.length === 0 ? (
        <div className="bg-neutral-100/50 dark:bg-neutral-900/20 border border-neutral-200 dark:border-neutral-800/80 rounded-2xl p-12 text-center text-neutral-400 dark:text-neutral-550">
          <FileText className="w-12 h-12 mx-auto text-neutral-300 dark:text-neutral-700 mb-3" />
          <p className="text-sm font-semibold">Arşivde henüz fatura bulunmuyor.</p>
          <p className="text-xs text-neutral-400 dark:text-neutral-600 mt-1">Yeni fatura hesaplayıp kaydederek arşivi doldurabilirsiniz.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedBills.map((bill) => {
            const meta = billTypeMetadata[bill.type] || {
              label: 'Diğer',
              icon: '📋',
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
                    className="flex items-center gap-1 text-xs font-semibold text-neutral-700 dark:text-neutral-350 hover:text-neutral-950 dark:hover:text-white bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 px-3 py-2 rounded-xl transition-all"
                    title="Paylaşım Kartını Gör"
                  >
                    <Eye className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" />
                    Detaylar
                  </button>
                  <button
                    onClick={() => onEditBill(bill)}
                    className="flex items-center gap-1 text-xs font-semibold text-neutral-700 dark:text-neutral-350 hover:text-neutral-950 dark:hover:text-white bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 px-3 py-2 rounded-xl transition-all"
                    title="Düzenle ve Yeniden Hesapla"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" />
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
