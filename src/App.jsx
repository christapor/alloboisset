import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import { Car, User, MessageCircle, Plus, MapPin, Calendar, Clock, Users, Phone, ArrowLeft, Send, LogOut } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState('login'); 
  const [loginNom, setLoginNom] = useState('');
  const [loginTel, setLoginTel] = useState('');

  // États pour le nouveau trajet
  const [depart, setDepart] = useState('Boisset');
  const [arrivee, setArrivee] = useState('');

  const handleLogin = () => {
    if (loginNom.trim() && loginTel.trim()) {
      setCurrentUser({ nom: loginNom, telephone: loginTel });
      setView('trajets');
    }
  };

  const bigBtnClass = "flex flex-col items-center justify-center p-8 rounded-3xl shadow-xl transition-all active:scale-95 text-white font-bold text-2xl uppercase";
  const inputClass = "w-full p-5 text-xl rounded-2xl border-4 border-gray-100 focus:border-[#4A86B4] outline-none bg-white/90";

  return (
    <div className="min-h-screen bg-fixed bg-cover bg-center font-sans" 
         style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.6), rgba(255,255,255,0.6)), url('/alloboisset_fond.jpg')" }}>
      
      {/* HEADER */}
      <header className="bg-white/90 backdrop-blur-md shadow-lg p-4 sticky top-0 z-20 flex justify-between items-center border-b-4 border-[#4A86B4]">
        <div className="flex items-center gap-4">
          <img src="/alloboisset_logo.jpg" alt="Logo" className="h-16 w-16 object-contain" />
          <div>
            <h1 className="text-3xl font-black text-[#4A86B4] leading-none">AlloBoisset</h1>
            <p className="text-sm font-bold text-[#5B8C4E]">Covoiturage Villageois</p>
          </div>
        </div>
        {currentUser && (
          <button onClick={() => setView('login')} className="p-3 bg-gray-100 rounded-full text-[#4A86B4]">
            <LogOut size={28} />
          </button>
        )}
      </header>

      <main className="max-w-xl mx-auto p-6 pb-24">
        
        {/* 1. VUE CONNEXION */}
        {view === 'login' && (
          <div className="bg-white/90 p-8 rounded-3xl shadow-2xl mt-10 border-2 border-[#4A86B4]">
            <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">Bienvenue à Boisset !</h2>
            <div className="space-y-6">
              <input type="text" placeholder="Votre Prénom et Nom" value={loginNom} onChange={(e)=>setLoginNom(e.target.value)} className={inputClass} />
              <input type="tel" placeholder="Votre n° de Téléphone" value={loginTel} onChange={(e)=>setLoginTel(e.target.value)} className={inputClass} />
              <button onClick={handleLogin} className="w-full bg-[#4A86B4] text-white p-6 rounded-2xl text-2xl font-bold shadow-lg">COMMENCER</button>
            </div>
          </div>
        )}

        {/* 2. VUE PRINCIPALE */}
        {view === 'trajets' && (
          <div className="space-y-8 mt-6">
            <h2 className="text-3xl font-bold text-center text-gray-900">Bonjour {currentUser?.nom} !</h2>
            <button onClick={() => setView('liste')} className={`${bigBtnClass} bg-[#4A86B4] w-full`}><Car size={80} className="mb-4" />Je cherche un trajet</button>
            <button onClick={() => setView('nouveau')} className={`${bigBtnClass} bg-[#5B8C4E] w-full`}><Plus size={80} className="mb-4" />Je propose un trajet</button>
          </div>
        )}

        {/* 3. VUE NOUVEAU TRAJET (LE BLOC QUI MANQUAIT !) */}
        {view === 'nouveau' && (
          <div className="space-y-6">
            <button onClick={() => setView('trajets')} className="flex items-center gap-2 font-bold text-[#4A86B4] text-xl"><ArrowLeft /> Retour</button>
            <h2 className="text-3xl font-bold text-gray-800">Votre proposition</h2>
            
            <div className="bg-white/80 p-8 rounded-3xl shadow-xl space-y-6 border-2 border-[#5B8C4E]">
              <div>
                <label className="block text-xl font-bold mb-2">Départ :</label>
                <input type="text" value={depart} onChange={(e)=>setDepart(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block text-xl font-bold mb-2">Destination :</label>
                <input type="text" placeholder="Où allez-vous ?" value={arrivee} onChange={(e)=>setArrivee(e.target.value)} className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-lg font-bold mb-2">Date :</label>
                  <input type="date" className={inputClass} />
                </div>
                <div>
                  <label className="block text-lg font-bold mb-2">Heure :</label>
                  <input type="time" className={inputClass} />
                </div>
              </div>
              <button onClick={() => setView('trajets')} className="w-full bg-[#5B8C4E] text-white p-6 rounded-2xl text-2xl font-bold shadow-lg uppercase">Publier mon trajet</button>
            </div>
          </div>
        )}

        {/* 4. VUE LISTE */}
        {view === 'liste' && (
          <div className="space-y-6">
            <button onClick={() => setView('trajets')} className="flex items-center gap-2 font-bold text-[#4A86B4] text-xl"><ArrowLeft /> Retour</button>
            <h2 className="text-3xl font-bold text-gray-800">Trajets disponibles</h2>
            <div className="bg-white/80 p-10 rounded-3xl shadow-inner text-center italic text-gray-500 text-xl border-2 border-dashed border-gray-300">
              Aucun trajet pour le moment...
            </div>
          </div>
        )}

      </main>

      {/* NAV BASSE */}
      {currentUser && (
        <nav className="fixed bottom-0 w-full bg-white border-t-4 border-[#4A86B4] flex justify-around p-4 shadow-2xl z-20">
          <button onClick={() => setView('trajets')} className="flex flex-col items-center text-[#4A86B4] font-black text-xs uppercase"><Car size={35} /> Accueil</button>
          <button className="flex flex-col items-center text-gray-400 font-bold text-xs uppercase"><MessageCircle size={35} /> Messages</button>
          <button className="flex flex-col items-center text-gray-400 font-bold text-xs uppercase"><User size={35} /> Profil</button>
        </nav>
      )}
    </div>
  );
}
