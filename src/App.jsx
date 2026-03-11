import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import { Car, User, MessageCircle, Plus, MapPin, Calendar, Clock, ArrowLeft, Trash2, Phone } from 'lucide-react';

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

  const publierTrajet = async () => {
    if (!arrivee || !dateTrajet || !heureTrajet) return alert("Oups ! Champs vides.");
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
    if (window.confirm("Supprimer ce trajet ?")) {
      const { error } = await supabase.from('rides').delete().eq('id', id);
      if (!error) chargerTrajets();
    }
  };

  // Formatage JJ/MM/AA pour l'affichage
  const formatMaDate = (dateStr) => {
    if (!dateStr) return "";
    const parts = dateStr.split('-');
    return `${parts[2]}/${parts[1]}/${parts[0].slice(2)}`;
  };

  const bigBtnClass = "flex flex-col items-center justify-center p-8 rounded-3xl shadow-xl transition-all active:scale-95 text-white font-bold text-2xl uppercase";
  const inputClass = "w-full p-5 text-xl rounded-2xl border-4 border-gray-100 outline-none bg-white/90";
  const dateInputClass = "w-full p-2 text-[15px] rounded-xl border-4 border-gray-100 outline-none bg-white/90 font-bold";

  return (
    <div className="min-h-screen bg-fixed bg-cover bg-center font-sans select-none" 
         style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.6), rgba(255,255,255,0.6)), url('/alloboisset_fond.jpg')" }}>
      
      <header className="bg-white/90 shadow-lg p-4 sticky top-0 z-20 border-b-4 border-[#4A86B4] flex items-center gap-3">
        <img src="/alloboisset_logo.jpg" className="h-12 w-12 object-contain" />
        <h1 className="text-xl font-black text-[#4A86B4] uppercase">AlloBoisset</h1>
      </header>

      <main className="max-w-xl mx-auto p-4 pb-32">
        {view === 'login' && (
          <div className="bg-white/95 p-6 rounded-3xl shadow-2xl mt-4 border-2 border-[#4A86B4] space-y-4">
            <h2 className="text-2xl font-bold text-center">Bienvenue !</h2>
            <input type="text" placeholder="Nom et Prénom" value={loginNom} onChange={(e)=>setLoginNom(e.target.value)} className={inputClass} />
            <input type="tel" placeholder="Téléphone" value={loginTel} onChange={(e)=>setLoginTel(e.target.value)} className={inputClass} />
            <button onClick={handleLogin} className="w-full bg-[#4A86B4] text-white p-5 rounded-2xl text-xl font-bold uppercase shadow-md">Entrer</button>
          </div>
        )}

        {view === 'trajets' && (
          <div className="space-y-6 mt-4">
            <p className="text-center font-bold text-gray-800 italic">Bonjour {currentUser?.nom} !</p>
            <button onClick={() => setView('liste')} className={`${bigBtnClass} bg-[#4A86B4] w-full`}><Car size={70} className="mb-2" />Chercher</button>
            <button onClick={() => setView('nouveau')} className={`${bigBtnClass} bg-[#5B8C4E] w-full`}><Plus size={70} className="mb-2" />Proposer</button>
          </div>
        )}

        {view === 'nouveau' && (
          <div className="space-y-4">
            <button onClick={() => setView('trajets')} className="flex items-center gap-2 font-bold text-[#4A86B4]"><ArrowLeft /> Retour</button>
            <div className="bg-white/95 p-6 rounded-3xl shadow-xl space-y-4 border-2 border-[#5B8C4E]">
              <h2 className="text-xl font-bold text-center uppercase text-[#5B8C4E]">Proposer un trajet</h2>
              <input type="text" value={depart} onChange={(e)=>setDepart(e.target.value)} className={inputClass} />
              <input type="text" placeholder="Vers où ?" value={arrivee} onChange={(e)=>setArrivee(e.target.value)} className={inputClass} />
              <div className="grid grid-cols-2 gap-3">
                <input type="date" value={dateTrajet} onChange={(e)=>setDateTrajet(e.target.value)} className={dateInputClass} />
                <input type="time" value={heureTrajet} onChange={(e)=>setHeureTrajet(e.target.value)} className={dateInputClass} />
              </div>
              <button onClick={publierTrajet} className="w-full bg-[#5B8C4E] text-white p-5 rounded-2xl text-xl font-bold uppercase shadow-lg">Publier</button>
            </div>
          </div>
        )}

        {view === 'liste' && (
          <div className="space-y-4 text-gray-800">
            <button onClick={() => setView('trajets')} className="flex items-center gap-2 font-bold text-[#4A86B4]"><ArrowLeft /> Retour</button>
            <h2 className="text-2xl font-bold">Trajets disponibles</h2>
            {trajets.length === 0 ? <p className="text-center p-10 italic">Aucun trajet.</p> : 
              trajets.map(t => (
                <div key={t.id} className="bg-white/95 p-5 rounded-3xl shadow-md border-l-8 border-[#4A86B4]">
                  <div className="flex justify-between items-start">
                    <p className="font-black text-[#5B8C4E] text-lg uppercase">{t.origin} ➔ {t.destination}</p>
                    {t.driver_id === currentUser?.telephone && (
                      <button onClick={() => supprimerTrajet(t.id)} className="text-red-500 p-1"><Trash2 size={20}/></button>
                    )}
                  </div>
                  <div className="flex gap-4 mt-1 text-gray-600 font-bold text-sm">
                    <span className="flex items-center gap-1"><Calendar size={14}/> {formatMaDate(t.departure_time.split(' ')[0])}</span>
                    <span className="flex items-center gap-1"><Clock size={14}/> {t.departure_time.split(' ')[1]}</span>
                  </div>
                  <a href={`tel:${t.driver_id}`} className="mt-4 w-full bg-[#4A86B4] text-white p-3 rounded-xl font-bold shadow block text-center flex items-center justify-center gap-2">
                    <Phone size={18}/> CONTACTER
                  </a>
                </div>
              ))
            }
          </div>
        )}
      </main>

      {currentUser && (
        <nav className="fixed bottom-0 w-full bg-white border-t-4 border-[#4A86B4] flex justify-around p-4 shadow-2xl z-30">
          <button onClick={() => setView('trajets')} className={`flex flex-col items-center font-black text-xs uppercase ${view === 'trajets' ? 'text-[#4A86B4]' : 'text-gray-400'}`}><Car size={35} /> Accueil</button>
          <button className="flex flex-col items-center text-gray-400 font-bold text-xs uppercase"><MessageCircle size={35} /> Messages</button>
          <button className="flex flex-col items-center text-gray-400 font-bold text-xs uppercase"><User size={35} /> Profil</button>
        </nav>
      )}
    </div>
  );
}
