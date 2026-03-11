import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import { Car, User, MessageCircle, Plus, MapPin, Calendar, Clock, ArrowLeft, LogOut } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState('login'); 
  const [loginNom, setLoginNom] = useState('');
  const [loginTel, setLoginTel] = useState('');
  const [trajets, setTrajets] = useState([]);

  const [depart, setDepart] = useState('Boisset');
  const [arrivee, setArrivee] = useState('');
  const [dateTrajet, setDateTrajet] = useState('');
  const [heureTrajet, setHeureTrajet] = useState('');

  // GESTION MÉMOIRE ET NAVIGATION RETOUR
  useEffect(() => {
    const savedUser = localStorage.getItem('user_boisset');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
      setView('trajets');
    }
    chargerTrajets();
  }, []);

  // GESTION DU BOUTON RETOUR PHYSIQUE
  useEffect(() => {
    const handlePopState = () => {
      if (view !== 'trajets' && view !== 'login') {
        setView('trajets');
      }
    };

    if (view !== 'trajets' && view !== 'login') {
      window.history.pushState({ view }, ""); 
    }

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

  const publierTrajet = async () => {
    if (!arrivee || !dateTrajet || !heureTrajet) return alert("Oups ! Il manque des infos.");
    const { error } = await supabase.from('rides').insert([{
      origin: depart,
      destination: arrivee,
      departure_time: `${dateTrajet} ${heureTrajet}`,
      driver_id: currentUser.telephone,
      seats: 3
    }]);
    if (!error) { setArrivee(''); chargerTrajets(); setView('liste'); }
    else { alert("Erreur d'enregistrement..."); }
  };

  const bigBtnClass = "flex flex-col items-center justify-center p-8 rounded-3xl shadow-xl transition-all active:scale-95 text-white font-bold text-2xl uppercase";
  const inputClass = "w-full p-5 text-xl rounded-2xl border-4 border-gray-100 outline-none bg-white/90";
  // Case date ultra-optimisée pour mobile
  const dateInputClass = "w-full p-2 text-[15px] rounded-xl border-4 border-gray-100 outline-none bg-white/90 font-bold appearance-none";

  return (
    <div className="min-h-screen bg-fixed bg-cover bg-center font-sans select-none" 
         style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.6), rgba(255,255,255,0.6)), url('/alloboisset_fond.jpg')" }}>
      
      <header className="bg-white/90 shadow-lg p-4 sticky top-0 z-20 flex justify-between items-center border-b-4 border-[#4A86B4]">
        <div className="flex items-center gap-3">
          <img src="/alloboisset_logo.jpg" className="h-12 w-12 object-contain" />
          <h1 className="text-xl font-black text-[#4A86B4] uppercase">AlloBoisset</h1>
        </div>
        {currentUser && <button onClick={() => { localStorage.removeItem('user_boisset'); setCurrentUser(null); setView('login'); }} className="p-2 bg-gray-100 rounded-full text-[#4A86B4]"><LogOut size={20}/></button>}
      </header>

      <main className="max-w-xl mx-auto p-4 pb-24">
        {view === 'login' && (
          <div className="bg-white/95 p-6 rounded-3xl shadow-2xl mt-4 border-2 border-[#4A86B4]">
            <h2 className="text-2xl font-bold text-center mb-6">Bienvenue !</h2>
            <div className="space-y-4">
              <input type="text" placeholder="Nom et Prénom" value={loginNom} onChange={(e)=>setLoginNom(e.target.value)} className={inputClass} />
              <input type="tel" placeholder="N° de Téléphone" value={loginTel} onChange={(e)=>setLoginTel(e.target.value)} className={inputClass} />
              <button onClick={handleLogin} className="w-full bg-[#4A86B4] text-white p-5 rounded-2xl text-xl font-bold uppercase shadow-md">Entrer</button>
            </div>
          </div>
        )}

        {view === 'trajets' && (
          <div className="space-y-6 mt-4 text-gray-800">
            <p className="text-center font-bold italic">Ravi de vous voir, {currentUser?.nom} !</p>
            <button onClick={() => setView('liste')} className={`${bigBtnClass} bg-[#4A86B4] w-full`}><Car size={70} className="mb-2" />Chercher un trajet</button>
            <button onClick={() => setView('nouveau')} className={`${bigBtnClass} bg-[#5B8C4E] w-full`}><Plus size={70} className="mb-2" />Proposer un trajet</button>
          </div>
        )}

        {view === 'nouveau' && (
          <div className="space-y-4">
            <button onClick={() => setView('trajets')} className="flex items-center gap-2 font-bold text-[#4A86B4]"><ArrowLeft /> Retour</button>
            <div className="bg-white/95 p-6 rounded-3xl shadow-xl space-y-4 border-2 border-[#5B8C4E]">
              <h2 className="text-xl font-bold text-center uppercase text-[#5B8C4E]">Proposer un trajet</h2>
              <div className="space-y-1">
                <label className="text-sm font-bold ml-2">Départ :</label>
                <input type="text" value={depart} onChange={(e)=>setDepart(e.target.value)} className={inputClass} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold ml-2 text-[#4A86B4]">Destination :</label>
                <input type="text" placeholder="Ex: Firminy" value={arrivee} onChange={(e)=>setArrivee(e.target.value)} className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-sm font-bold ml-2">Date :</label>
                  <input type="date" value={dateTrajet} onChange={(e)=>setDateTrajet(e.target.value)} className={dateInputClass} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold ml-2">Heure :</label>
                  <input type="time" value={heureTrajet} onChange={(e)=>setHeureTrajet(e.target.value)} className={dateInputClass} />
                </div>
              </div>
              <button onClick={publierTrajet} className="w-full bg-[#5B8C4E] text-white p-5 rounded-2xl text-xl font-bold uppercase shadow-lg mt-2">Publier</button>
            </div>
          </div>
        )}

        {view === 'liste' && (
          <div className="space-y-4 text-gray-800">
            <button onClick={() => setView('trajets')} className="flex items-center gap-2 font-bold text-[#4A86B4]"><ArrowLeft /> Retour</button>
            <h2 className="text-2xl font-bold">Trajets disponibles</h2>
            {trajets.length === 0 ? <p className="text-center p-10 bg-white/50 rounded-3xl italic">Aucun trajet pour l'instant.</p> : 
              trajets.map(t => (
                <div key={t.id} className="bg-white/95 p-5 rounded-3xl shadow-md border-l-8 border-[#4A86B4] mb-2">
                  <p className="font-black text-[#5B8C4E] text-lg uppercase">{t.origin} ➔ {t.destination}</p>
                  <div className="flex gap-4 mt-1 text-gray-600 font-bold">
                    <span className="flex items-center gap-1"><Calendar size={16}/> {t.departure_time.split(' ')[0]}</span>
                    <span className="flex items-center gap-1"><Clock size={16}/> {t.departure_time.split(' ')[1]}</span>
                  </div>
                  <button className="mt-4 w-full bg-[#4A86B4] text-white p-3 rounded-xl font-bold shadow">CONTACTER</button>
                </div>
              ))
            }
          </div>
        )}
      </main>
    </div>
  );
}
