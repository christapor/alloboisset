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

  const VERSION = "1.09";

  useEffect(() => {
    const savedUser = localStorage.getItem('user_boisset');
    if (savedUser) { setCurrentUser(JSON.parse(savedUser)); setView('trajets'); }
    chargerTrajets();
  }, []);

  const chargerTrajets = async () => {
    const { data } = await supabase.from('rides').select('*').order('id', { ascending: false });
    if (data) setTrajets(data);
  };

  const handleLogin = (e) => {
    e.preventDefault();
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
    if (!arrivee || !dateTrajet || !heureTrajet) return alert("Remplissez tout !");
    const { error } = await supabase.from('rides').insert([{
      origin: depart,
      destination: arrivee,
      departure_time: `${dateTrajet} ${heureTrajet}`,
      driver_id: currentUser.telephone,
      driver_name: currentUser.nom
    }]);
    if (!error) { setArrivee(''); chargerTrajets(); setView('liste'); }
    else { alert("Erreur : la base de données a refusé le trajet."); }
  };

  const supprimerTrajet = async (id) => {
    if (window.confirm("Supprimer ce trajet ?")) {
      const { error } = await supabase.from('rides').delete().eq('id', id);
      if (!error) chargerTrajets();
    }
  };

  const formatMaDate = (d) => d ? `${d.split('-')[2]}/${d.split('-')[1]}/${d.split('-')[0].slice(2)}` : "";

  return (
    <div className="min-h-screen bg-fixed bg-cover bg-center font-sans flex flex-col" 
         style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.6), rgba(255,255,255,0.6)), url('/alloboisset_fond.jpg')" }}>
      
      <header className="bg-white/95 shadow-lg p-3 sticky top-0 z-20 border-b-4 border-[#4A86B4] flex items-center justify-center gap-4">
        <img src="/alloboisset_logo.jpg" className="h-16 w-16 object-contain" alt="Logo" />
        <div className="text-center">
          <h1 className="text-2xl font-black text-[#4A86B4] uppercase leading-none">AlloBoisset</h1>
          <p className="text-sm font-black text-[#5B8C4E] uppercase tracking-tighter">Covoiturage Villageois</p>
        </div>
      </header>

      <main className="flex-1 max-w-xl mx-auto w-full p-4 pb-28 overflow-y-auto">
        {view === 'login' && (
          <form onSubmit={handleLogin} className="bg-white/95 p-6 rounded-3xl shadow-xl mt-4 border-2 border-[#4A86B4] space-y-4">
            <h2 className="text-xl font-black text-center uppercase">Connexion</h2>
            <input name="name" autocomplete="name" type="text" placeholder="NOM ET PRÉNOM" value={loginNom} onChange={(e)=>setLoginNom(e.target.value)} className="w-full p-4 text-lg rounded-xl border-4 border-gray-100 font-bold" />
            <input name="tel" autocomplete="tel" type="tel" placeholder="TÉLÉPHONE" value={loginTel} onChange={(e)=>setLoginTel(e.target.value)} className="w-full p-4 text-lg rounded-xl border-4 border-gray-100 font-bold" />
            <button type="submit" className="w-full bg-[#4A86B4] text-white p-4 rounded-xl text-xl font-black uppercase">Entrer</button>
          </form>
        )}

        {view === 'trajets' && (
          <div className="space-y-6 mt-4">
            <p className="text-center font-black text-[#4A86B4]">Bonjour {currentUser?.nom} !</p>
            <button onClick={() => setView('liste')} className="flex flex-col items-center justify-center p-6 rounded-3xl shadow-xl bg-[#4A86B4] w-full text-white font-black text-xl uppercase"><Car size={60} className="mb-2" />Chercher</button>
            <button onClick={() => setView('nouveau')} className="flex flex-col items-center justify-center p-6 rounded-3xl shadow-xl bg-[#5B8C4E] w-full text-white font-black text-xl uppercase"><Plus size={60} className="mb-2" />Proposer</button>
          </div>
        )}

        {view === 'nouveau' && (
          <div className="space-y-4">
            <button onClick={() => setView('trajets')} className="font-black text-[#4A86B4] flex items-center gap-2"><ArrowLeft /> RETOUR</button>
            <div className="bg-white/95 p-6 rounded-3xl shadow-lg space-y-4 border-2 border-[#5B8C4E]">
              <h2 className="font-black text-center uppercase text-[#5B8C4E]">Nouveau trajet</h2>
              <input type="text" value={depart} onChange={(e)=>setDepart(e.target.value)} className="w-full p-4 border-2 rounded-xl font-bold" />
              <input type="text" placeholder="Destination ?" value={arrivee} onChange={(e)=>setArrivee(e.target.value)} className="w-full p-4 border-2 rounded-xl font-bold" />
              <div className="grid grid-cols-2 gap-2">
                <input type="date" value={dateTrajet} onChange={(e)=>setDateTrajet(e.target.value)} className="w-full p-2 border-2 rounded-xl font-bold text-sm" />
                <input type="time" value={heureTrajet} onChange={(e)=>setHeureTrajet(e.target.value)} className="w-full p-2 border-2 rounded-xl font-bold text-sm" />
              </div>
              <button onClick={publierTrajet} className="w-full bg-[#5B8C4E] text-white p-4 rounded-xl font-black uppercase">Publier</button>
            </div>
          </div>
        )}

        {view === 'liste' && (
          <div className="space-y-4">
            <button onClick={() => setView('trajets')} className="font-black text-[#4A86B4] flex items-center gap-2"><ArrowLeft /> RETOUR</button>
            <h2 className="text-xl font-black uppercase">Trajets disponibles</h2>
            {trajets.map(t => (
              <div key={t.id} className="bg-white p-4 rounded-3xl shadow border-l-8 border-[#4A86B4]">
                <div className="flex justify-between">
                  <p className="font-black text-[#5B8C4E] uppercase">{t.origin} ➔ {t.destination}</p>
                  {t.driver_id === currentUser?.telephone && <button onClick={() => supprimerTrajet(t.id)} className="text-red-500"><Trash2 size={20}/></button>}
                </div>
                <div className="flex gap-4 text-sm font-bold text-gray-500">
                  <span>{formatMaDate(t.departure_time.split(' ')[0])}</span>
                  <span>{t.departure_time.split(' ')[1]}</span>
                </div>
                <a href={`tel:${t.driver_id}`} className="mt-3 block w-full bg-[#4A86B4] text-white p-3 rounded-xl font-black text-center uppercase">Appeler</a>
              </div>
            ))}
          </div>
        )}

        {view === 'parametres' && (
          <div className="space-y-4">
            <div className="bg-white/95 p-6 rounded-3xl shadow-lg border-2 border-[#4A86B4] text-center space-y-4">
              <div className="w-16 h-16 bg-[#4A86B4] rounded-full mx-auto flex items-center justify-center text-white"><User size={30} /></div>
              <h2 className="text-xl font-black uppercase">{currentUser?.nom}</h2>
              <p className="font-bold text-[#4A86B4]">{currentUser?.telephone}</p>
              {!confirmLogout ? (
                <button onClick={() => setConfirmLogout(true)} className="w-full border-2 border-red-500 text-red-500 p-3 rounded-xl font-bold uppercase">Se déconnecter</button>
              ) : (
                <div className="flex gap-2"><button onClick={handleLogout} className="flex-1 bg-red-600 text-white p-3 rounded-xl font-bold">OUI</button><button onClick={() => setConfirmLogout(false)} className="flex-1 bg-gray-200 p-3 rounded-xl font-bold">NON</button></div>
              )}
            </div>
            
            <div className="bg-white/90 p-4 rounded-2xl border-2 border-[#5B8C4E] space-y-2">
              <h3 className="font-black text-[#5B8C4E] flex items-center gap-2 uppercase text-sm"><Info size={18}/> Infos & Confidentialité</h3>
              <p className="text-[11px] font-bold leading-tight text-gray-700">Cette application est un outil solidaire local. Aucune donnée n'est revendue. Vos informations servent uniquement à vous mettre en relation avec les autres habitants de Boisset.</p>
            </div>

            <div className="p-4 bg-white/50 rounded-xl text-center">
              <p className="text-xs font-black text-[#4A86B4]">VERSION {VERSION}</p>
              <p className="text-[10px] font-bold uppercase text-[#5B8C4E]">Propulsé gracieusement par Chris TAPOR</p>
            </div>
          </div>
        )}
      </main>

      {currentUser && (
        <nav className="fixed bottom-0 w-full bg-white border-t-4 border-[#4A86B4] flex justify-around p-2 shadow-2xl z-30">
          <button onClick={() => setView('trajets')} className={`flex flex-col items-center font-black text-[10px] uppercase ${view !== 'parametres' ? 'text-[#4A86B4]' : 'text-gray-400'}`}><Car size={32} /> Accueil</button>
          <button onClick={() => setView('parametres')} className={`flex flex-col items-center font-black text-[10px] uppercase ${view === 'parametres' ? 'text-[#4A86B4]' : 'text-gray-400'}`}><ShieldCheck size={32} /> Infos</button>
        </nav>
      )}
    </div>
  );
}
