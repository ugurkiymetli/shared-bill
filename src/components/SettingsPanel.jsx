import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Save, RotateCcw, Trash2, Home } from 'lucide-react';

export default function SettingsPanel({ residents, apartmentName, onSaveSettings, onResetResidents }) {
  const [localResidents, setLocalResidents] = useState([...residents]);
  const [localApartmentName, setLocalApartmentName] = useState(apartmentName || "Apartman");
  const [newlyAddedId, setNewlyAddedId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    setLocalApartmentName(apartmentName || "Apartman");
  }, [apartmentName]);

  useEffect(() => {
    setLocalResidents([...residents]);
  }, [residents]);

  // Scroll to newly added input on mobile/desktop
  useEffect(() => {
    if (newlyAddedId) {
      const el = document.getElementById(`resident-name-${newlyAddedId}`);
      if (el) {
        // Scroll with a small timeout to let the input render first and keyboard to open
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
      }
    }
  }, [newlyAddedId]);

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
    setNewlyAddedId(nextId);
    setLocalResidents(prev => [
      ...prev,
      { id: nextId, name: `Yeni Daire ${nextId}`, count: 1 }
    ]);
  };

  const handleDeleteResident = (id) => {
    setDeletingId(id);
    // Let the fade-out / collapse animation play for 300ms before removing from DOM
    setTimeout(() => {
      setLocalResidents(prev => prev.filter(r => r.id !== id));
      if (newlyAddedId === id) setNewlyAddedId(null);
      setDeletingId(null);
    }, 300);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveSettings(localResidents, localApartmentName);
  };

  const handleReset = () => {
    if (window.confirm("Ayarları ve sakin listesini varsayılan ayarlara döndürmek istediğinizden emin misiniz?")) {
      const defaults = onResetResidents();
      setLocalResidents([...defaults]);
      setLocalApartmentName("Apartman");
    }
  };

  const totalResidentsCount = localResidents.reduce((sum, r) => sum + Number(r.count), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-neutral-900/60 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2 font-outfit">
            <Users className="w-5 h-5 text-neutral-800 dark:text-neutral-200" />
            Apartman ve Sakin Yönetimi
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Apartman adını ve daire sakinlerinin detaylarını buradan güncelleyebilirsiniz.
          </p>
        </div>
        <div className="flex items-center gap-4 bg-neutral-100 dark:bg-neutral-950/80 px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs">
          <div>
            <span className="text-neutral-500 dark:text-neutral-400 block">Daire Sayısı</span>
            <span className="text-neutral-900 dark:text-neutral-200 font-bold text-base">{localResidents.length}</span>
          </div>
          <div className="h-8 w-px bg-neutral-300 dark:bg-neutral-800" />
          <div>
            <span className="text-neutral-500 dark:text-neutral-400 block">Toplam Kişi</span>
            <span className="text-neutral-900 dark:text-white font-extrabold text-base">{totalResidentsCount}</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Apartment Name Config */}
        <div className="bg-white dark:bg-neutral-900/40 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800/80 shadow-lg dark:shadow-2xl space-y-4">
          <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 font-outfit flex items-center gap-2">
            <Home className="w-4 h-4 text-neutral-800 dark:text-neutral-200" />
            Genel Ayarlar
          </h3>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">Apartman Adı</label>
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

        <div className="bg-white dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800/80 rounded-2xl overflow-hidden shadow-lg dark:shadow-2xl">
          <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-3 bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-6">Daire Sahibi / Sakini</div>
            <div className="col-span-3 text-center">Kişi Sayısı</div>
            <div className="col-span-2 text-right">İşlem</div>
          </div>

          <div className="divide-y divide-neutral-200 dark:divide-neutral-800/60 max-h-[500px] overflow-y-auto">
            {localResidents.length === 0 ? (
              <div className="p-8 text-center text-neutral-500">
                Kayıtlı sakin bulunmamaktadır. Yeni daire ekleyin.
              </div>
            ) : (
              localResidents.map((res, index) => {
                const isDeleting = res.id === deletingId;
                return (
                  <div
                    key={res.id}
                    className={`flex flex-col sm:grid sm:grid-cols-12 gap-3 sm:gap-4 px-5 py-4 sm:items-center hover:bg-neutral-100 dark:hover:bg-neutral-900/25 transition-all duration-300 ease-out ${
                      isDeleting ? 'opacity-0 max-h-0 py-0 overflow-hidden border-b-0' : 'max-h-[200px] border-b border-neutral-200 dark:border-neutral-800/60'
                    }`}
                  >
                    {/* Mobile Header: ID and Delete side-by-side */}
                    <div className="flex sm:hidden justify-between items-center pb-2 border-b border-neutral-200 dark:border-neutral-800/60">
                      <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 font-mono">Daire #{index + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteResident(res.id)}
                        className="text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 p-1.5 rounded-lg transition-all"
                        title="Daireyi Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Desktop ID column */}
                    <div className="hidden sm:block sm:col-span-1 text-neutral-500 text-center text-xs font-mono font-bold">
                      {index + 1}
                    </div>

                    {/* Input columns: side-by-side on mobile */}
                    <div className="grid grid-cols-12 gap-3 sm:col-span-9 sm:contents">
                      {/* Name input */}
                      <div className="col-span-7 sm:col-span-6">
                        <label className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 sm:hidden block mb-1">Daire Sakini</label>
                        <input
                          type="text"
                          id={`resident-name-${res.id}`}
                          value={res.name}
                          autoFocus={res.id === newlyAddedId}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => handleNameChange(res.id, e.target.value)}
                          className="w-full glass-input px-3.5 py-2.5 rounded-xl text-sm"
                          placeholder="Örn: Ahmet"
                          required
                        />
                      </div>

                      {/* Count input */}
                      <div className="col-span-5 sm:col-span-3">
                        <label className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 sm:hidden block mb-1">Kişi Sayısı</label>
                        <div className="flex items-center justify-between bg-neutral-100 dark:bg-neutral-950/40 rounded-xl border border-neutral-200 dark:border-neutral-800 px-1 py-0.5">
                          <button
                            type="button"
                            onClick={() => handleCountChange(res.id, Math.max(0, res.count - 1))}
                            className="w-7 h-7 flex items-center justify-center text-neutral-550 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white text-base transition-colors"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={res.count}
                            onChange={(e) => handleCountChange(res.id, e.target.value)}
                            className="w-8 text-center bg-transparent border-0 focus:ring-0 text-sm font-bold text-neutral-950 dark:text-neutral-100 font-mono p-0"
                          />
                          <button
                            type="button"
                            onClick={() => handleCountChange(res.id, res.count + 1)}
                            className="w-7 h-7 flex items-center justify-center text-neutral-550 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white text-base transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Desktop delete button column */}
                    <div className="hidden sm:block sm:col-span-2 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteResident(res.id)}
                        className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:text-rose-300 dark:hover:bg-rose-950/20 p-2.5 rounded-xl transition-all inline-flex items-center gap-1 text-sm justify-center"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleAddResident}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white hover:bg-neutral-50 dark:bg-neutral-900 dark:hover:bg-neutral-800 border border-neutral-300 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm"
            >
              <UserPlus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Yeni Daire Ekle
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white hover:bg-neutral-50 dark:bg-neutral-900 dark:hover:bg-neutral-800 border border-neutral-300 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm"
            >
              <RotateCcw className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
              Sıfırla
            </button>
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-neutral-950 hover:bg-neutral-850 active:bg-neutral-900 dark:bg-white dark:hover:bg-neutral-200 dark:active:bg-neutral-100 text-white dark:text-neutral-950 px-6 py-2.5 rounded-xl text-sm font-semibold shadow-md shadow-neutral-950/10 dark:shadow-neutral-950/35 transition-all"
          >
            <Save className="w-4 h-4" />
            Apartman Listesini Kaydet
          </button>
        </div>
      </form>
    </div>
  );
}
