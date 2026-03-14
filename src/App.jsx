import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import { Car, User, MessageCircle, Plus, ArrowLeft, Trash2, Phone, ShieldCheck, Users } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState('login'); 
  const [loginPrenom, setLoginPrenom] = useState('');
  const [loginNomFamille, setLoginNomFamille] = useState('');
  const [loginTel, setLoginTel] = useState(localStorage.getItem('last_tel') || '');
  const [loginPin, setLoginPin] = useState('');
  const [trajets, setTrajets] = useState([]);
  const [confirmLogout, setConfirmLogout] = useState(false);
  
  const [isDemande, setIsDemande] = useState(false);
  const [depart, setDepart] = useState('Boisset');
  const [arrivee, setArrivee] = useState('');
  const [dateTrajet, setDateTrajet] = useState('');
  const [heureTrajet, setHeureTrajet] = useState('');

  const VERSION = "1.27"; 

  useEffect(() => {
    const savedUser = localStorage.getItem('user_boisset');
    if (savedUser) { 
      try {
        setCurrentUser(JSON.parse(savedUser)); 
        setView('trajets'); 
      } catch (e) {
        localStorage.removeItem('user_boisset');
      }
    }
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
    if (loginPrenom.trim() && loginTel.trim() && loginPin.length === 4) {
      // Formatage propre : Prénom + Initiale.
      const prenom = loginPrenom.trim();
      const nom = loginNomFamille.trim();
      const nomConvivial = nom ? `${prenom} ${nom.charAt(0).toUpperCase()}.` : prenom;
      
      const user = { nom: nomConvivial, telephone: loginTel, pin: loginPin };
      setCurrentUser(user);
      localStorage.setItem('user_boisset', JSON.stringify(user));
      localStorage.setItem('last_tel', loginTel);
      setView('trajets');
    } else {
      alert("Prénom, Téléphone et PIN requis !");
    }
  };

  const publierTrajet = async () => {
    if (!arrivee || !dateTrajet || !heureTrajet) return alert("Champs vides !");
    const prefixe = isDemande ? "🙋 " : "🚗 ";
    const { error } = await supabase.from('rides').insert([{
      origin: depart, 
      destination: arrivee, 
      departure_time: `${dateTrajet} ${heureTrajet}`,
      driver_id: currentUser.telephone, 
      driver_name: prefixe + currentUser.nom
    }]);
    if (!error) { setArrivee(''); chargerTrajets(); setView('liste'); }
  };

  const supprimerTrajet = async (id) => {
    if (window.confirm("Supprimer ce trajet ?")) {
      const { error } = await supabase.from('rides').delete().eq('id', id);
      if (!error) chargerTrajets();
    }
  };

  const formatMaDate = (d) => {
    if(!d) return "";
    const parts = d.split(' ')[0].split('-');
    return `${parts[2]}/${parts[1]}/${parts[0].slice(2)}`;
  };

  return (
    <div className="min-h-screen bg-fixed bg-cover bg-center font-sans flex flex-col select-none" 
         style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.6), rgba(255,255,255,0.6)), url('/alloboisset_fond.jpg')" }}>
      
      <header className="bg-white/95 shadow-xl p-3 sticky top-0 z-20 border-b-8 border-[#4A86B4] flex flex-col items-center">
        <div className="flex items-center gap-5 w-full justify-center">
          <img src="/alloboisset_logo.jpg" className="h-16 w-16 object-contain" alt="Logo" />
          <div className="flex flex-col text-center">
            <h1 className="text-2xl font-black text-[#4A86B4] uppercase leading-none">AlloBoisset</h1>
            <p className="text-[11px] font-black text-[#5B8C4E] uppercase tracking-[0.2em] mt-1 border-t-2 border-[#5B8C4E] pt-1">Covoiturage Villageois</p>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-xl mx-auto w-full p-4 pb-32">
        {view === 'login' && (
          <form onSubmit={handleLogin} className="bg-white/95 p-6 rounded-3xl shadow-xl mt-4 border-2 border-[#4A86B4] space-y-4">
            <h2 className="text-xl font-black text-center uppercase">Identification</h2>
            <input type="text" placeholder="PRÉNOM" value={loginPrenom} onChange={(e)=>setLoginPrenom(e.target.value)} required className="w-full p-4 text-lg rounded-xl border-4 border-gray-100 font-bold" />
            <input type="text" placeholder="NOM (FACULTATIF)" value={loginNomFamille} onChange={(e)=>setLoginNomFamille(e.target.value)} className="w-full p-4 text-lg rounded-xl border-4 border-gray-100 font-bold bg-gray-
