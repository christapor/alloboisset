import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import { Car, User, MessageCircle, Plus, MapPin, Calendar, Clock, ArrowLeft, Trash2, Phone, ShieldCheck, Info } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState('login'); 
  const [loginNom, setLoginNom] = useState(localStorage.getItem('last_nom') || '');
  const [loginTel, setLoginTel] = useState(localStorage.getItem('last_tel') || '');
  const [trajets, setTrajets] = useState([]);
  const [confirmLogout, setConfirmLogout] = useState(false);

  const [depart, setDepart] = useState('Boisset');
  const [arrivee, setArrivee] = useState('');
  const [dateTrajet, setDateTrajet] = useState('');
  const [heureTrajet, setHeureTrajet] = useState('');

  const VERSION = "1.14"; 

  useEffect(() => {
    const savedUser = localStorage.getItem('user_boisset');
    if (savedUser) { setCurrentUser(JSON.parse(savedUser)); setView('trajets'); }
    chargerTrajets();
  }, []);

  useEffect(() => {
    const handlePopState = () => { if (view !== 'trajets' && view !== 'login') setView('trajets'); };
    if (view !== 'trajets' && view !== 'login') window.history.pushState({ view }, "");
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [view]);

  const chargerTrajets = async () => {
    const { data } = await supabase.from('rides').select('*').order('id', { ascending: false });
    if (data) setTrajets(data);
  };

  const handleLogin = (e) => {
    if (e) e.preventDefault();
    if (loginNom.trim() && loginTel.trim()) {
      const user = { nom: loginNom, telephone: loginTel };
      setCurrentUser(user);
      localStorage.setItem('user_boisset', JSON.stringify(user));
      localStorage.setItem('last_nom', loginNom);
      localStorage.setItem('last_tel', loginTel);
      setView('trajets');
    }
  };

  const publierTrajet = async () => {
    if (!arrivee || !dateTrajet || !heureTrajet) return alert("Champs vides !");
    const { error } = await supabase.from('rides').insert([{
      origin: depart, destination: arrivee, departure_time: `${dateTrajet} ${heureTrajet}`,
      driver_id: currentUser.telephone, driver_name: currentUser.nom
    }]);
    if (!error) { setArrivee(''); chargerTrajets(); setView('liste'); }
  };

  const supprimerTrajet = async (id) => {
    if (window.confirm("Supprimer ce trajet ?")) {
      const { error } = await supabase.from('rides').delete().eq('id', id);
      if (!error) chargerTrajets();
    }
  };

  const formatMaDate = (d) => d ? `${d.split('-')[2]}/${d.split('-')[1]}/${d.split('-')[0].slice(2)}` : "";

  return (
    <div className="min-h-screen bg-fixed bg-cover bg-center font-sans flex flex-col select-none" 
         style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.6), rgba(255,255,255,0.6)), url('/alloboisset_fond.jpg')" }}>
      
      <header className="bg-white/95 shadow-xl p-3 sticky top-0 z-20 border-b-8 border-[#4A86B4] flex flex-col items-center">
        <div className="flex items-center gap-5 w-full justify-center">
          <img src="/alloboisset_logo.jpg" className="h-20 w-20 object-contain" alt="Logo" />
          <div className="flex flex-col">
            <h1 className="text-3xl font-black text-[#4A86B4] uppercase leading-none">AlloBoisset</h1>
            <p className="text-[13px] font-black text-[#5B8C4E] uppercase tracking-[0.2em] mt-1 border-t-2 border-[#5B8C4E] pt-1 text-center">Covoiturage Villageois</p>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-xl mx-auto w-full p-4 pb-32">
        {view === 'login' && (
          <form onSubmit={handleLogin} className="bg-white/95 p-6 rounded-3xl shadow-xl mt-4 border-2 border-[#4A86B4] space-y-4">
            <h2 className="text-xl font-black text-center uppercase">Identification</h2>
            <input name="name" type="text" placeholder="NOM ET PRÉNOM" value={loginNom} onChange={(e)=>setLoginNom(e.target.value)} className="w-full p-4 text-lg rounded-xl border-4 border-gray-100 font-bold" />
            <input name="tel" type="tel" placeholder="TÉLÉPHONE" value={loginTel} onChange={(e)=>setLoginTel(e.target.value)} className="w-full p-4 text-lg rounded-xl border-4 border-gray-100 font-bold" />
            <button type="submit" className="w-full bg-[#4A86B4] text-white p-4 rounded-xl text-xl font-black uppercase shadow-lg">Entrer</button>
          </form>
        )}

        {view === 'trajets' && (
          <div className="space-y-6 mt-4">
            <p className="text-center font-black text-xl text-[#4A86B4] italic">Bonjour {currentUser?.nom} !</p>
            <button onClick={() => setView('liste')} className="flex flex-col items-center justify-center p-8 rounded-[2.5rem] shadow-xl bg-[#4A86B4] w-full text-white font-black text-2xl uppercase"><Car size={70} className="mb-2" />Chercher</button>
            <button onClick={() => setView('nouveau')} className="flex flex-col items-center justify-center p-8 rounded-[2.5rem] shadow-xl bg-[#5B8C4E] w-full text-white font-black text-2xl uppercase"><Plus size={70} className="mb-2" />Proposer</button>
          </div>
        )}

        {view === 'nouveau' && (
          <div className="space-y-4">
            <button onClick={() => setView('trajets')} className="bg-white border-[6px] border-[#4A86B4] text-[#4A86B4] px-5 py-3 rounded-xl font-black flex items-center gap-2 text-xl uppercase shadow-xl active:scale-95 transition-transform"><ArrowLeft size={32} /> RETOUR</button>
            <div className="bg-white/95 p-6 rounded-3xl shadow-lg space-y-4 border-2 border-[#5B8C4E]">
              <h2 className="text-xl font-black text-center uppercase text-[#5B8C4E]">Nouveau trajet</h2>
              <input type="text" value={depart} onChange={(e)=>setDepart(e.target.value)} className="w-full p-4 border-2 rounded-xl font-bold" />
              <input type="text" placeholder="Destination ?" value={arrivee
