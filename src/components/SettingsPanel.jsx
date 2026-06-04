import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Save, RotateCcw, Trash2, Home } from 'lucide-react';

export default function SettingsPanel({ residents, apartmentName, onSaveSettings, onResetResidents }) {
  const [localResidents, setLocalResidents] = useState([...residents]);
  const [localApartmentName, setLocalApartmentName] = useState(apartmentName || "Apartman");
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setLocalApartmentName(apartmentName || "Apartman");
  }, [apartmentName]);

  useEffect(() => {
    setLocalResidents([...residents]);
  }, [residents]);

  const handleCountChange = (id, val) => {
    const numVal = parseInt(val, 10);
    const cleanVal = isNaN(numVal) ? 0 : Math.max(0, numVal);
    setLocalResidents(prev =>
      prev.map(r => (r.id === id ? { ...r, count: cleanVal } : r))
    );
  };

  const handleNameChange = (id, val) => {
    setLocalResidents(prev =>
      prev.map(r => (r.id === id ? { ...r, name: val } : r))
    );
  };

  const handleAddResident = () => {
    const nextId = localResidents.length > 0 ? Math.max(...localResidents.map(r => r.id)) + 1 : 1;
    setLocalResidents(prev => [
      ...prev,
      { id: nextId, name: `Yeni Daire ${nextId}`, count: 1 }
    ]);
  };

  const handleDeleteResident = (id) => {
    setLocalResidents(prev => prev.filter(r => r.id !== id));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveSettings(localResidents, localApartmentName);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleReset = () => {
    if (window.confirm("Ayarları ve sakin listesini varsayılan ayarlara döndürmek istediğinizden emin misiniz?")) {
      const defaults = onResetResidents();
      setLocalResidents([...defaults]);
      setLocalApartmentName("Apartman");
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    }
  };

  const totalResidentsCount = localResidents.reduce((sum, r) => sum + Number(r.count), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2 font-outfit">
            <Users className="w-5 h-5 text-emerald-400" />
            Apartman ve Sakin Yönetimi
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Apartman adını ve daire sakinlerinin detaylarını buradan güncelleyebilirsiniz.
          </p>
        </div>
        <div className="flex items-center gap-4 bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800 text-xs">
          <div>
            <span className="text-slate-500 block">Daire Sayısı</span>
            <span className="text-slate-200 font-bold text-base">{localResidents.length}</span>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <div>
            <span className="text-slate-500 block">Toplam Kişi</span>
            <span className="text-emerald-400 font-bold text-base">{totalResidentsCount}</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Apartment Name Config */}
        <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800/80 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-slate-200 font-outfit flex items-center gap-2">
            <Home className="w-4 h-4 text-emerald-400" />
            Genel Ayarlar
          </h3>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400">Apartman Adı</label>
            <input
              type="text"
              value={localApartmentName}
              onChange={(e) => setLocalApartmentName(e.target.value)}
              className="w-full glass-input px-3.5 py-3 rounded-xl text-sm"
              placeholder="Örn: Apartman veya Huzur Apartmanı"
              required
            />
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
          <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-3 bg-slate-900/80 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-6">Daire Sahibi / Sakini</div>
            <div className="col-span-3 text-center">Kişi Sayısı</div>
            <div className="col-span-2 text-right">İşlem</div>
          </div>

          <div className="divide-y divide-slate-800/60 max-h-[500px] overflow-y-auto">
            {localResidents.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                Kayıtlı sakin bulunmamaktadır. Yeni daire ekleyin.
              </div>
            ) : (
              localResidents.map((res, index) => (
                <div
                  key={res.id}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-center px-6 py-4 hover:bg-slate-900/25 transition-colors"
                >
                  <div className="col-span-1 text-slate-500 sm:text-center text-xs font-mono font-bold flex justify-between sm:block">
                    <span className="sm:hidden text-slate-500">Daire ID:</span>
                    <span>{index + 1}</span>
                  </div>

                  <div className="col-span-1 sm:col-span-6">
                    <label className="text-xs text-slate-500 sm:hidden block mb-1">Sakin Adı</label>
                    <input
                      type="text"
                      value={res.name}
                      onChange={(e) => handleNameChange(res.id, e.target.value)}
                      className="w-full glass-input px-3.5 py-2.5 rounded-xl text-sm"
                      placeholder="Örn: Ahmet"
                      required
                    />
                  </div>

                  <div className="col-span-1 sm:col-span-3">
                    <label className="text-xs text-slate-500 sm:hidden block mb-1">Kişi Sayısı</label>
                    <div className="flex items-center justify-center bg-slate-950/40 rounded-xl border border-slate-800 px-2">
                      <button
                        type="button"
                        onClick={() => handleCountChange(res.id, Math.max(0, res.count - 1))}
                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white text-lg transition-colors"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={res.count}
                        onChange={(e) => handleCountChange(res.id, e.target.value)}
                        className="w-12 text-center bg-transparent border-0 focus:ring-0 text-sm font-bold text-emerald-400 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => handleCountChange(res.id, res.count + 1)}
                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white text-lg transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="col-span-1 sm:col-span-2 text-right">
                    <button
                      type="button"
                      onClick={() => handleDeleteResident(res.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-950/20 p-2.5 rounded-xl transition-all inline-flex items-center gap-1 text-sm sm:w-auto w-full justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="sm:hidden">Sil</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleAddResident}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
            >
              <UserPlus className="w-4 h-4 text-slate-400" />
              Yeni Daire Ekle
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
            >
              <RotateCcw className="w-4 h-4 text-slate-400" />
              Sıfırla
            </button>
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-emerald-950/30 hover:shadow-glow-emerald transition-all"
          >
            <Save className="w-4 h-4" />
            Apartman Listesini Kaydet
          </button>
        </div>
      </form>

      {isSaved && (
        <div className="fixed bottom-6 right-6 bg-slate-900/90 text-emerald-400 px-5 py-3 rounded-2xl border border-emerald-500/30 shadow-2xl flex items-center gap-2.5 z-50 animate-fade-in">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-sm">Apartman sakinleri listesi başarıyla kaydedildi!</span>
        </div>
      )}
    </div>
  );
}
