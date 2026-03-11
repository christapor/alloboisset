import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import { Car, User, MessageCircle, Plus, MapPin, Calendar, Clock, ArrowLeft, Trash2, Phone, LogOut, ShieldCheck } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState('login'); 
  const [loginNom, setLoginNom] = useState('');
  const [loginTel, setLoginTel] = useState('');
  const [trajets, setTrajets] = useState([]);
  const [confirmLogout, setConfirmLogout] = useState(false);

  const [depart, setDepart] = useState('Boisset');
  const [arrivee, setArrivee] = useState('');
  const [dateTrajet, setDateTrajet] = useState('');
  const [heureTrajet, setHeureTrajet] = useState('');

  const VERSION = "1.07";

  useEffect(() => {
    const savedUser = localStorage.getItem('user_boisset');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
      setView('trajets');
    }
    chargerTrajets();
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      if (view !== 'trajets' && view !== 'login') setView('trajets');
    };
    if (view !== 'trajets' && view !== 'login') window.history.pushState({ view }, "");
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [view]);

  const chargerTrajets = async () => {
    const { data } = await supabase.from('rides').select('*').order('id', { ascending: false });
    if (data) setTrajets(data);
  };

  const handleLogin = () => {
    if (loginNom.trim() && loginTel.trim()) {
      const user = { nom: loginNom, telephone: loginTel };
      setCurrentUser(user);
      localStorage.setItem('user_boisset', JSON.stringify(user));
      setView('trajets');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user_boisset');
    setCurrentUser(null);
    setConfirmLogout(false);
    setView('login');
  };

  const publierTrajet = async () => {
    if (!arrivee || !dateTrajet || !heureTrajet) return alert("Champs vides !");
    const { error } = await supabase.from('rides').insert([{
      origin: depart,
      destination: arrivee,
      departure_time: `${dateTrajet} ${heureTrajet}`,
      driver_id: currentUser.telephone,
      driver_name: currentUser.nom
    }]);
    if (!error) { setArrivee(''); chargerTrajets(); setView('liste'); }
  };

  const supprimerTrajet = async (id) => {
    if (window.confirm("Supprimer définitivement ce trajet ?")) {
      const { error } = await supabase.from('rides').delete().eq('id', id);
      if (!error) chargerTrajets();
    }
  };

  const formatMaDate = (dateStr) => {
    if (!dateStr) return "";
    const parts = dateStr.split('-');
    return `${parts[2]}/${parts[1]}/${parts[0].slice(2)}`;
  };

  const bigBtnClass = "flex flex-col items-center justify-center p-8 rounded-3xl shadow-xl transition-all active:scale-95 text-white font-bold text-2xl uppercase";
  const inputClass = "w-full p-5 text-xl rounded-2xl border-4 border-gray-100 outline-none bg-white/90";

  return (
    <div className="min-h-screen bg-fixed bg-cover bg-center font-sans select-none" 
         style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.6), rgba(255,255,255,0.6)), url('/alloboisset_fond.jpg')" }}>
      
      {/* HEADER AVEC LOGO AGRANDI */}
      <header className="bg-white/95 shadow-lg p-3 sticky top-0 z-20 border-b-4 border-[#4A86B4] flex items-center justify-center gap-4">
        <img src="/alloboisset_logo.jpg" className="h-20 w-20 object-contain" alt="Logo" />
        <div>
          <h1 className="text-2xl font-black text-[#4A86B4] uppercase tracking-tighter">AlloBoisset</h1>
          <p className="text-[10px] font-bold text-[#5B8C4E] text-center">COVOITURAGE VILLAGEOIS</p>
        </div>
      </header>

      <main className="max-w-xl mx-auto p-4 pb-32 text-gray-800">
        {view === 'login' && (
          <div className="bg-white/95 p-6 rounded-3xl shadow-2xl mt-4 border-2 border-[#4A86B4] space-y-4">
            <h2 className="text-2xl font-bold text-center uppercase">Identification</h2>
            <input type="text" placeholder="Prénom et Nom" value={loginNom} onChange={(e)=>setLoginNom(e.target.value)} className={inputClass} />
            <input type="tel" placeholder="N° de Téléphone" value={loginTel} onChange={(e)=>setLoginTel(e.target.value)} className={inputClass} />
            <button onClick={handleLogin} className="w-full bg-[#4A86B4] text-white p-5 rounded-2xl text-xl font-bold uppercase shadow-md">Entrer</button>
          </div>
        )}

        {view === 'trajets' && (
          <div className="space-y-6 mt-4">
            <p className="text-center font-bold italic text-lg text-[#4A86B4]">Bonjour {currentUser?.nom} !</p>
            <button onClick={() => setView('liste')} className={`${bigBtnClass} bg-[#4A86B4] w-full`}><Car size={70} className="mb-2" />Chercher un trajet</button>
            <button onClick={() => setView('nouveau')} className={`${bigBtnClass} bg-[#5B8C4E] w-full`}><Plus size={70} className="mb-2" />Proposer un trajet</button>
          </div>
        )}

        {view === 'nouveau' && (
          <div className="space-y-4">
            <button onClick={() => setView('trajets')} className="flex items-center gap-2 font-bold text-[#4A86B4] text-lg"><ArrowLeft /> Retour</button>
            <div className="bg-white/95 p-6 rounded-3xl shadow-xl space-y-4 border-2 border-[#5B8C4E]">
              <h2 className="text-xl font-bold text-center uppercase text-[#5B8C4E]">Nouveau trajet</h2>
              <input type="text" value={depart} onChange={(e)=>setDepart(e.target.value)} className={inputClass} />
              <input type="text" placeholder="Destination ?" value={arrivee} onChange={(e)=>setArrivee(e.target.value)} className={inputClass} />
              <div className="grid grid-cols-2 gap-3">
                <input type="date" value={dateTrajet} onChange={(e)=>setDateTrajet(e.target.value)} className="w-full p-2 text-[15px] rounded-xl border-4 border-gray-100 outline-none font-bold" />
                <input type="time" value={heureTrajet} onChange={(e)=>setHeureTrajet(e.target.value)} className="w-full p-2 text-[15px] rounded-xl border-4 border-gray-100 outline-none font-bold" />
              </div>
              <button onClick={publierTrajet} className="w-full bg-[#5B8C4E] text-white p-5 rounded-2xl text-xl font-bold uppercase shadow-lg">Publier</button>
            </div>
          </div>
        )}

        {view === 'liste' && (
          <div className="space-y-4 text-gray-800">
            <button onClick={() => setView('trajets')} className="flex items-center gap-2 font-bold text-[#4A86B4] text-lg"><ArrowLeft /> Retour</button>
            <h2 className="text-2xl font-bold">Trajets disponibles</h2>
            {trajets.length === 0 ? <p className="text-center p-10 italic">Aucun trajet pour l'instant.</p> : 
              trajets.map(t => (
                <div key={t.id} className="bg-white/95 p-5 rounded-3xl shadow-md border-l-8 border-[#4A86B4] mb-2">
                  <div className="flex justify-between items-start">
                    <p className="font-black text-[#5B8C4E] text-lg uppercase leading-tight">{t.origin} ➔ {t.destination}</p>
                    {t.driver_id === currentUser?.telephone && (
                      <button onClick={() => supprimerTrajet(t.id)} className="text-red-500 p-2"><Trash2 size={24}/></button>
                    )}
                  </div>
                  <div className="flex gap-4 mt-2 text-gray-600 font-bold">
                    <span className="flex items-center gap-1"><Calendar size={16}/> {formatMaDate(t.departure_time.split(' ')[0])}</span>
                    <span className="flex items-center gap-1"><Clock size={16}/> {t.departure_time.split(' ')[1]}</span>
                  </div>
                  <a href={`tel:${t.driver_id}`} className="mt-4 w-full bg-[#4A86B4] text-white p-4 rounded-xl font-bold shadow block text-center flex items-center justify-center gap-3 text-lg uppercase">
                    <Phone size={20}/> Appeler
                  </a>
                </div>
              ))
            }
          </div>
        )}

        {view === 'messages' && (
          <div className="text-center mt-10 space-y-4">
            <MessageCircle size={80} className="mx-auto text-[#4A86B4] opacity-50" />
            <h2 className="text-2xl font-bold uppercase tracking-widest">Messagerie</h2>
            <p className="bg-white/80 p-6 rounded-2xl italic border-2 border-dashed border-[#4A86B4]">Bientôt disponible !<br/>Appelez directement pour l'instant.</p>
          </div>
        )}

        {view === 'parametres' && (
          <div className="space-y-6">
            <div className="bg-white/95 p-8 rounded-3xl shadow-xl mt-4 border-2 border-gray-200 text-center space-y-4">
              <div className="w-20 h-20 bg-[#4A86B4] rounded-full mx-auto flex items-center justify-center text-white shadow-inner">
                <User size={45} />
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase text-gray-800 leading-none">{currentUser?.nom}</h2>
                <p className="text-xl text-[#4A86B4] font-bold mt-2 tracking-widest">{currentUser?.telephone}</p>
              </div>

              {!confirmLogout ? (
                <button onClick={() => setConfirmLogout(true)} className="w-full bg-red-100 text-red-600 p-4 rounded-2xl font-bold uppercase border-2 border-red-500 mt-4">
                  Se déconnecter
                </button>
              ) : (
                <div className="space-y-2 animate-pulse">
                  <p className="text-red-600 font-black">VOUS ÊTES SÛR ?</p>
                  <div className="flex gap-2">
                    <button onClick={handleLogout} className="flex-1 bg-red-600 text-white p-4 rounded-2xl font-bold uppercase shadow-lg">OUI</button>
                    <button onClick={() => setConfirmLogout(false)} className="flex-1 bg-gray-200 text-gray-800 p-4 rounded-2xl font-bold uppercase">NON</button>
                  </div>
                </div>
              )}
            </div>

            <div className="text-center space-y-1 opacity-60">
              <p className="text-sm font-bold uppercase text-gray-600">Propulsé gracieusement par Chris TAPOR</p>
              <p className="text-xs font-black">VERSION {VERSION}</p>
            </div>
          </div>
        )}
      </main>

      {currentUser && (
        <nav className="fixed bottom-0 w-full bg-white border-t-4 border-[#4A86B4] flex justify-around p-4 shadow-2xl z-30">
          <button onClick={() => {setView('trajets'); setConfirmLogout(false);}} className={`flex flex-col items-center font-black text-[10px] uppercase ${['trajets', 'liste', 'nouveau'].includes(view) ? 'text-[#4A86B4]' : 'text-gray-400'}`}><Car size={35} /> Accueil</button>
          <button onClick={() => {setView('messages'); setConfirmLogout(false);}} className={`flex flex-col items-center font-black text-[10px] uppercase ${view === 'messages' ? 'text-[#4A86B4]' : 'text-gray-400'}`}><MessageCircle size={35} /> Messages</button>
          <button onClick={() => {setView('parametres'); setConfirmLogout(false);}} className={`flex flex-col items-center font-black text-[10px] uppercase ${view === 'parametres' ? 'text-[#4A86B4]' : 'text-gray-400'}`}><ShieldCheck size={35} /> Paramètres</button>
        </nav>
      )}
    </div>
  );
}
