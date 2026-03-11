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

  const VERSION = "1.08";

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
    if (!arrivee || !dateTrajet || !heureTrajet) return alert("Oups ! Les cases sont vides.");
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
    if (window.confirm("Voulez-vous vraiment supprimer ce trajet ?")) {
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
  const inputClass = "w-full p-5 text-xl rounded-2xl border-4 border-gray-100 outline-none bg-white/90 font-bold";

  return (
    <div className="min-h-screen bg-fixed bg-cover bg-center font-sans select-none" 
         style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.6), rgba(255,255,255,0.6)), url('/alloboisset_fond.jpg')" }}>
      
      {/* HEADER VERSION XXL POUR LA VISIBILITÉ */}
      <header className="bg-white/95 shadow-xl p-4 sticky top-0 z-20 border-b-8 border-[#4A86B4] flex flex-col items-center gap-2">
        <div className="flex items-center gap-6 w-full justify-center">
          <img src="/alloboisset_logo.jpg" className="h-28 w-28 object-contain shadow-sm" alt="Logo" />
          <div className="flex flex-col">
            <h1 className="text-4xl font-black text-[#4A86B4] uppercase tracking-tighter leading-none">AlloBoisset</h1>
            <p className="text-lg font-black text-[#5B8C4E] uppercase tracking-widest mt-1 border-t-2 border-[#5B8C4E] pt-1">Covoiturage Villageois</p>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto p-4 pb-36 text-gray-800">
        {view === 'login' && (
          <div className="bg-white/95 p-8 rounded-3xl shadow-2xl mt-6 border-2 border-[#4A86B4] space-y-6">
            <h2 className="text-3xl font-black text-center uppercase tracking-tight">Qui êtes-vous ?</h2>
            <input type="text" placeholder="VOTRE NOM ET PRÉNOM" value={loginNom} onChange={(e)=>setLoginNom(e.target.value)} className={inputClass} />
            <input type="tel" placeholder="VOTRE TÉLÉPHONE" value={loginTel} onChange={(e)=>setLoginTel(e.target.value)} className={inputClass} />
            <button onClick={handleLogin} className="w-full bg-[#4A86B4] text-white p-6 rounded-2xl text-2xl font-black uppercase shadow-lg">ENTRER</button>
          </div>
        )}

        {view === 'trajets' && (
          <div className="space-y-8 mt-6">
            <p className="text-center font-black italic text-2xl text-[#4A86B4] drop-shadow-sm">Bonjour {currentUser?.nom} !</p>
            <button onClick={() => setView('liste')} className={`${bigBtnClass} bg-[#4A86B4] w-full`}><Car size={85} className="mb-4" />Chercher un trajet</button>
            <button onClick={() => setView('nouveau')} className={`${bigBtnClass} bg-[#5B8C4E] w-full`}><Plus size={85} className="mb-4" />Proposer un trajet</button>
          </div>
        )}

        {view === 'nouveau' && (
          <div className="space-y-4">
            <button onClick={() => setView('trajets')} className="flex items-center gap-3 font-black text-[#4A86B4] text-2xl uppercase"><ArrowLeft size={30} /> Retour</button>
            <div className="bg-white/95 p-8 rounded-3xl shadow-xl space-y-6 border-2 border-[#5B8C4E]">
              <h2 className="text-2xl font-black text-center uppercase text-[#5B8C4E]">Nouveau trajet</h2>
              <div className="space-y-2">
                <label className="text-lg font-black ml-2 uppercase">Départ :</label>
                <input type="text" value={depart} onChange={(e)=>setDepart(e.target.value)} className={inputClass} />
              </div>
              <div className="space-y-2">
                <label className="text-lg font-black ml-2 uppercase text-[#4A86B4]">Destination :</label>
                <input type="text" placeholder="Vers quelle ville ?" value={arrivee} onChange={(e)=>setArrivee(e.target.value)} className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-lg font-black ml-2 uppercase">Date :</label>
                  <input type="date" value={dateTrajet} onChange={(e)=>setDateTrajet(e.target.value)} className="w-full p-4 text-xl rounded-2xl border-4 border-gray-100 outline-none font-black" />
                </div>
                <div className="space-y-2">
                  <label className="text-lg font-black ml-2 uppercase">Heure :</label>
                  <input type="time" value={heureTrajet} onChange={(e)=>setHeureTrajet(e.target.value)} className="w-full p-4 text-xl rounded-2xl border-4 border-gray-100 outline-none font-black" />
                </div>
              </div>
              <button onClick={publierTrajet} className="w-full bg-[#5B8C4E] text-white p-6 rounded-2xl text-2xl font-black uppercase shadow-lg">Publier mon trajet</button>
            </div>
          </div>
        )}

        {view === 'liste' && (
          <div className="space-y-6">
            <button onClick={() => setView('trajets')} className="flex items-center gap-3 font-black text-[#4A86B4] text-2xl uppercase"><ArrowLeft size={30}/> Retour</button>
            <h2 className="text-3xl font-black uppercase text-gray-900 tracking-tight">Trajets disponibles</h2>
            {trajets.length === 0 ? <p className="text-center p-12 bg-white/80 rounded-3xl font-bold italic text-xl border-2 border-dashed border-gray-400">Aucun trajet pour l'instant.</p> : 
              trajets.map(t => (
                <div key={t.id} className="bg-white p-6 rounded-[2.5rem] shadow-xl border-l-[12px] border-[#4A86B4] mb-4">
                  <div className="flex justify-between items-start">
                    <p className="font-black text-[#5B8C4E] text-2xl uppercase leading-none mb-2">{t.origin} ➔ {t.destination}</p>
                    {t.driver_id === currentUser?.telephone && (
                      <button onClick={() => supprimerTrajet(t.id)} className="text-red-600 p-2 bg-red-50 rounded-full"><Trash2 size={28}/></button>
                    )}
                  </div>
                  <div className="flex gap-6 mt-3 text-gray-700 font-black text-lg">
                    <span className="flex items-center gap-2"><Calendar size={20} className="text-[#4A86B4]"/> {formatMaDate(t.departure_time.split(' ')[0])}</span>
                    <span className="flex items-center gap-2"><Clock size={20} className="text-[#4A86B4]"/> {t.departure_time.split(' ')[1]}</span>
                  </div>
                  <a href={`tel:${t.driver_id}`} className="mt-6 w-full bg-[#4A86B4] text-white p-5 rounded-2xl font-black shadow-lg block text-center flex items-center justify-center gap-4 text-2xl uppercase">
                    <Phone size={28}/> APPELER
                  </a>
                </div>
              ))
            }
          </div>
        )}

        {view === 'messages' && (
          <div className="text-center mt-12 space-y-6">
            <MessageCircle size={100} className="mx-auto text-[#4A86B4]" />
            <h2 className="text-3xl font-black uppercase text-[#4A86B4]">Messagerie</h2>
            <div className="bg-white/95 p-8 rounded-3xl border-4 border-dashed border-[#4A86B4] shadow-lg">
              <p className="text-xl font-bold italic text-gray-800">Bientôt disponible !<br/><br/>Utilisez le bouton "Appeler" pour l'instant.</p>
            </div>
          </div>
        )}

        {view === 'parametres' && (
          <div className="space-y-8">
            <div className="bg-white/95 p-10 rounded-3xl shadow-2xl mt-4 border-4 border-[#4A86B4] text-center space-y-6">
              <div className="w-24 h-24 bg-[#4A86B4] rounded-full mx-auto flex items-center justify-center text-white shadow-xl">
                <User size={55} />
              </div>
              <div className="space-y-1">
                <h2 className="text-3xl font-black uppercase text-gray-900 tracking-tighter">{currentUser?.nom}</h2>
                <p className="text-2xl text-[#4A86B4] font-black tracking-widest">{currentUser?.telephone}</p>
              </div>

              {!confirmLogout ? (
                <button onClick={() => setConfirmLogout(true)} className="w-full bg-red-50 text-red-600 p-6 rounded-2xl font-black uppercase border-4 border-red-600 mt-6 text-xl">
                  Se déconnecter
                </button>
              ) : (
                <div className="space-y-3 p-4 bg-red-50 rounded-2xl border-2 border-red-200">
                  <p className="text-red-700 font-black text-xl uppercase">Sûr à 100% ?</p>
                  <div className="flex gap-4">
                    <button onClick={handleLogout} className="flex-1 bg-red-600 text-white p-5 rounded-2xl font-black uppercase shadow-lg text-lg">OUI</button>
                    <button onClick={() => setConfirmLogout(false)} className="flex-1 bg-white text-gray-800 p-5 rounded-2xl font-black uppercase border-2 border-gray-300 text-lg">NON</button>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white/80 p-6 rounded-2xl text-center space-y-2 border-2 border-[#4A86B4]">
              <p className="text-lg font-black text-[#4A86B4] uppercase leading-none">VERSION {VERSION}</p>
              <p className="text-sm font-bold text-[#5B8C4E] uppercase">Propulsé gracieusement par Chris TAPOR</p>
            </div>
          </div>
        )}
      </main>

      {currentUser && (
        <nav className="fixed bottom-0 w-full bg-white border-t-8 border-[#4A86B4] flex justify-around p-5 shadow-2xl z-30">
          <button onClick={() => {setView('trajets'); setConfirmLogout(false);}} className={`flex flex-col items-center font-black text-[12px] uppercase ${['trajets', 'liste', 'nouveau'].includes(view) ? 'text-[#4A86B4]' : 'text-gray-400'}`}><Car size={45} /> Accueil</button>
          <button onClick={() => {setView('messages'); setConfirmLogout(false);}} className={`flex flex-col items-center font-black text-[12px] uppercase ${view === 'messages' ? 'text-[#4A86B4]' : 'text-gray-400'}`}><MessageCircle size={45} /> Messages</button>
          <button onClick={() => {setView('parametres'); setConfirmLogout(false);}} className={`flex flex-col items-center font-black text-[12px] uppercase ${view === 'parametres' ? 'text-[#4A86B4]' : 'text-gray-400'}`}><ShieldCheck size={45} /> Paramètres</button>
        </nav>
      )}
    </div>
  );
}
