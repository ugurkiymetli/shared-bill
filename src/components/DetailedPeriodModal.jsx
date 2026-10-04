import React, { useState } from 'react';
import { Calendar, Plus, Trash2, Check, AlertCircle, RefreshCw, X, Sparkles } from 'lucide-react';

export default function DetailedPeriodModal({ resident, onSave, onClose }) {
  const initialPeriods = (resident.periods && resident.periods.length > 0)
    ? resident.periods.map(p => ({ days: Number(p.days) || 0, count: Number(p.count) || 0 }))
    : [
        { days: 10, count: Number(resident.count) || 2 },
        { days: 20, count: Number(resident.count) || 3 }
      ];

  const [periods, setPeriods] = useState(initialPeriods);

  const totalDays = periods.reduce((sum, p) => sum + (Number(p.days) || 0), 0);
  const totalPersonDays = periods.reduce((sum, p) => sum + (Number(p.days) || 0) * (Number(p.count) || 0), 0);
  const avgCount = (totalPersonDays / 30).toFixed(1).replace('.0', '');

  const handlePeriodChange = (index, field, value) => {
    const numVal = parseInt(value, 10);
    const cleanVal = isNaN(numVal) ? 0 : Math.max(0, numVal);
    setPeriods(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: cleanVal };
      return copy;
    });
  };

  const handleAddPeriod = () => {
    const remainingDays = Math.max(0, 30 - totalDays);
    setPeriods(prev => [...prev, { days: remainingDays > 0 ? remainingDays : 10, count: 2 }]);
  };

  const handleDeletePeriod = (index) => {
    if (periods.length <= 1) return;
    setPeriods(prev => prev.filter((_, i) => i !== index));
  };

  const applyPreset = (presetType) => {
    if (presetType === '10_20') {
      setPeriods([
        { days: 10, count: Number(resident.count) || 2 },
        { days: 20, count: Number(resident.count) || 3 }
      ]);
    } else if (presetType === '10_10_10') {
      setPeriods([
        { days: 10, count: 2 },
        { days: 10, count: 3 },
        { days: 10, count: 4 }
      ]);
    } else if (presetType === '15_15') {
      setPeriods([
        { days: 15, count: 2 },
        { days: 15, count: 4 }
      ]);
    }
  };

  const handleSave = () => {
    onSave({
      ...resident,
      entryMode: 'detailed',
      periods: periods.filter(p => p.days > 0)
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-neutral-900 dark:bg-neutral-100 flex items-center justify-center text-white dark:text-neutral-950">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white font-outfit">
                {resident.name} - Detaylı Dönem Girişi
              </h3>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                30 günlük dönemi parçalara bölerek kişi sayılarını girin.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 p-1.5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-grow">
          {/* Quick Presets */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Hızlı Şablonlar
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => applyPreset('10_20')}
                className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-semibold transition-all border border-neutral-200 dark:border-neutral-700"
              >
                10g + 20g
              </button>
              <button
                type="button"
                onClick={() => applyPreset('10_10_10')}
                className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-semibold transition-all border border-neutral-200 dark:border-neutral-700"
              >
                10g + 10g + 10g
              </button>
              <button
                type="button"
                onClick={() => applyPreset('15_15')}
                className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-semibold transition-all border border-neutral-200 dark:border-neutral-700"
              >
                15g + 15g
              </button>
            </div>
          </div>

          {/* Period Rows */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider px-1">
              <span>Dönem / Süre (Gün)</span>
              <span>Kişi Sayısı</span>
              <span className="w-8"></span>
            </div>

            <div className="space-y-2.5">
              {periods.map((p, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-200 dark:border-neutral-800"
                >
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-neutral-400 w-5">#{idx + 1}</span>
                    <div className="flex items-center gap-1.5 flex-1">
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={p.days}
                        onChange={(e) => handlePeriodChange(idx, 'days', e.target.value)}
                        className="w-full glass-input px-3 py-2 rounded-xl text-sm font-bold font-mono text-center"
                        placeholder="Gün"
                      />
                      <span className="text-xs text-neutral-500 font-semibold shrink-0">Gün</span>
                    </div>
                  </div>

                  <div className="flex-1 flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={p.count}
                      onChange={(e) => handlePeriodChange(idx, 'count', e.target.value)}
                      className="w-full glass-input px-3 py-2 rounded-xl text-sm font-bold font-mono text-center"
                      placeholder="Kişi"
                    />
                    <span className="text-xs text-neutral-500 font-semibold shrink-0">Kişi</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeletePeriod(idx)}
                    disabled={periods.length <= 1}
                    className="p-2 text-rose-500 hover:text-rose-600 disabled:opacity-30 disabled:hover:text-rose-500 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddPeriod}
              className="w-full py-2.5 border border-dashed border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-300 flex items-center justify-center gap-2 transition-all hover:bg-neutral-50 dark:hover:bg-neutral-850"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Dönem Ekle</span>
            </button>
          </div>

          {/* Progress / Status Summary Bar */}
          <div className="p-4 rounded-xl bg-neutral-100 dark:bg-neutral-950/80 border border-neutral-200 dark:border-neutral-800 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-neutral-700 dark:text-neutral-300">Dönem Gün Toplamı:</span>
              <span className={`font-mono text-sm ${totalDays === 30 ? 'text-emerald-600 dark:text-emerald-400' : totalDays > 30 ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`}>
                {totalDays} / 30 Gün
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${totalDays === 30 ? 'bg-emerald-500' : totalDays > 30 ? 'bg-rose-500' : 'bg-amber-500'}`}
                style={{ width: `${Math.min(100, (totalDays / 30) * 100)}%` }}
              />
            </div>

            <div className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-start gap-1.5 pt-1">
              {totalDays === 30 ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>30 günlük tam dönem tanımlandı. (30 Günlük Ağırlıklı Ort: <strong>{avgCount} Kişi</strong>)</span>
                </>
              ) : totalDays < 30 ? (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <span>Kalan <strong>{30 - totalDays} gün</strong> otomatik olarak 0 kişi (boş/tatil) hesaplanacaktır.</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                  <span>Toplam gün sayısı 30 günü geçmektedir! Lütfen günleri ayarlayın.</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all"
          >
            İptal
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={totalDays > 30}
            className="px-5 py-2.5 rounded-xl bg-neutral-900 dark:bg-neutral-100 hover:bg-neutral-800 dark:hover:bg-white text-white dark:text-neutral-950 text-xs font-bold transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>Kaydet ve Dönemi Uygula</span>
          </button>
        </div>
      </div>
    </div>
  );
}
