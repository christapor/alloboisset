import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import { Car, User, MessageCircle, Plus, ArrowLeft, Trash2, Phone, ShieldCheck, Info } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState('login'); 
  const [loginPrenom, setLoginPrenom] = useState('');
  const [loginNomFamille, setLoginNomFamille] = useState('');
  const [loginTel, setLoginTel] = useState(localStorage.getItem('last_tel') || '');
  const [loginPin, setLoginPin] = useState('');
  const [trajets, setTrajets] = useState([]);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [depart, setDepart] = useState('Boisset');
  const [arrivee, setArrivee] = useState('');
  const [dateTrajet, setDateTrajet] = useState('');
  const [heureTrajet, setHeureTrajet] = useState('');

  const VERSION = "1.21"; 

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
      const initiale = loginNomFamille.trim() ? ` ${loginNomFamille.trim().charAt(0)}.` : "";
      const nomConvivial = loginPrenom.trim() + initiale;
      const user = { nom: nomConvivial, telephone: loginTel, pin: loginPin };
      setCurrentUser(user);
      localStorage.setItem('user_boisset', JSON.stringify(user));
      localStorage.setItem('last_tel', loginTel);
      setView('trajets');
    } else {
      alert("Prénom, Téléphone et PIN (4 chiffres) requis !");
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

  const formatMaDate = (d) => {
    if(!d) return "";
    const parts = d.split(' ')[0].split('-');
    return `${parts[2]}/${parts[1]}/${parts[0].slice(2)}`;
  };

  return (
    <div className="min-h-screen bg-fixed bg-cover bg-center font-sans flex flex-col" 
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
            <input type="text" placeholder="PRÉNOM" value={loginPrenom} onChange={(e)=>setLoginPrenom(e.target.value)} required className="w-full p-4 text-lg rounded-xl border-4 border-gray-100 font-bold placeholder-gray-400" />
            <input type="text" placeholder="NOM (FACULTATIF)" value={loginNomFamille} onChange={(e)=>setLoginNomFamille(e.target.value)} className="w-full p-4 text-lg rounded-xl border-4 border-gray-100 font-bold bg-gray-50/50 placeholder-gray-400" />
            <input type="tel" placeholder="TÉLÉPHONE" value={loginTel} onChange={(e)=>setLoginTel(e.target.value)} required className="w-full p-4 text-lg rounded-xl border-4 border-gray-100 font-bold placeholder-gray-400" />
            <input type="password" inputMode="numeric" maxLength="4" placeholder="CODE PIN (4 CHIFFRES)" value={loginPin} onChange={(e)=>setLoginPin(e.target.value.replace(/\D/g,''))} required className="w-full p-4 text-lg rounded-xl border-4 border-orange-200 font-bold text-center tracking-[0.2em] placeholder-gray-500 placeholder:tracking-normal" />
            <button type="submit" className="w-full bg-[#4A86B4] text-white p-4 rounded-xl text-xl font-black uppercase shadow-lg active:scale-95 transition-transform">Entrer</button>
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
            <button onClick={() => setView('trajets')} className="bg-white border-[6px] border-[#4A86B4] text-[#4A86B4] px-5 py-3 rounded-xl font-black flex items-center gap-2 text-xl shadow-xl active:scale-95 transition-transform"><ArrowLeft size={32} /> RETOUR</button>
            <div className="bg-white/95 p-6 rounded-3xl shadow-lg space-y-4 border-2 border-[#5B8C4E]">
              <h2 className="text-xl font-black text-center uppercase text-[#5B8C4E]">Nouveau trajet</h2>
              <input type="text" value={depart} onChange={(e)=>setDepart(e.target.value)} className="w-full p-4 border-2 rounded-xl font-bold" />
              <input type="text" placeholder="Destination ?" value={arrivee} onChange={(e)=>setArrivee(e.target.value)} className="w-full p-4 border-2 rounded-xl font-bold" />
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="space-y-1"><label className="text-xs font-bold uppercase">Date</label><input type="date" value={dateTrajet} onChange={(e)=>setDateTrajet(e.target.value)} className="w-full p-2 border-2 rounded-xl font-bold text-sm" /></div>
                <div className="space-y-1"><label className="text-xs font-bold uppercase">Heure</label><input type="time" value={heureTrajet} onChange={(e)=>setHeureTrajet(e.target.value)} className="w-full p-2 border-2 rounded-xl font-bold text-sm" /></div>
              </div>
              <button onClick={publierTrajet} className="w-full bg-[#5B8C4E] text-white p-5 rounded-2xl font-black text-xl uppercase shadow-lg">Publier</button>
            </div>
          </div>
        )}

        {view === 'liste' && (
          <div className="space-y-4">
            <button onClick={() => setView('trajets')} className="bg-white border-[6px] border-[#4A86B4] text-[#4A86B4] px-5 py-3 rounded-xl font-black flex items-center gap-2 text-xl shadow-xl active:scale-95 transition-transform"><ArrowLeft size={32} /> RETOUR</button>
            <h2 className="text-2xl font-black uppercase">Trajets prévus</h2>
            {trajets.length === 0 ? <p className="text-center p-12 italic bg-white/50 rounded-3xl">Aucun trajet pour l'instant.</p> : 
              trajets.map(t => (
                <div key={t.id} className="bg-white p-5 rounded-[2rem] shadow-md border-l-8 border-[#4A86B4]">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-black text-[#5B8C4E] text-xl uppercase leading-none">{t.origin} ➔ {t.destination}</p>
                    {t.driver_id === currentUser?.telephone && <button onClick={() => supprimerTrajet(t.id)} className="text-red-500 bg-red-50 p-2 rounded-full"><Trash2 size={24}/></button>}
                  </div>
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex gap-4 text-lg font-black text-gray-600">
                      <span>{formatMaDate(t.departure_time)}</span>
                      <span>{t.departure_time.split(' ')[1]}</span>
                    </div>
                    <span className="text-xs font-bold bg-gray-100 px-2 py-1 rounded text-gray-500">{t.driver_name}</span>
                  </div>
                  <a href={`tel:${t.driver_id}`} className="block w-full bg-[#4A86B4] text-white p-4 rounded-xl font-black text-2xl text-center uppercase shadow-md flex items-center justify-center gap-3"><Phone size={24}/> Appeler</a>
                </div>
              ))
            }
          </div>
        )}

        {view === 'messages' && (
          <div className="text-center mt-12 space-y-6 px-4">
            <MessageCircle size={100} className="mx-auto text-[#4A86B4]" />
            <h2 className="text-3xl font-black uppercase text-[#4A86B4]">Messagerie</h2>
            <div className="bg-white/95 p-8 rounded-3xl border-4 border-dashed border-[#4A86B4] shadow-lg">
              <p className="text-xl font-bold italic text-gray-800">Bientôt disponible !<br/><br/>Appelez directement votre chauffeur en attendant.</p>
            </div>
          </div>
        )}

        {view === 'parametres' && (
          <div className="space-y-4 px-2">
            <div className="bg-white/95 p-4 rounded-3xl shadow-xl border-4 border-[#4A86B4] text-center space-y-2">
              <div className="flex items-center justify-center gap-4">
                <div className="w-12 h-12 bg-[#4A86B4] rounded-full flex items-center justify-center text-white"><User size={26} /></div>
                <div className="text-left">
                  <h2 className="text-lg font-black uppercase leading-none">{currentUser?.nom}</h2>
                  <p className="text-md font-black text-[#4A86B4]">{currentUser?.telephone}</p>
                </div>
              </div>
              {!confirmLogout ? (
                <button onClick={() => setConfirmLogout(true)} className="w-full border-2 border-red-500 text-red-500 p-2 rounded-xl font-black uppercase text-[12px]">Se déconnecter</button>
              ) : (
                <div className="flex gap-2 items-center justify-center"><p className="font-black text-red-600 text-sm">SÛR ?</p><button onClick={() => {localStorage.removeItem('user_boisset'); setView('login'); setCurrentUser(null);}} className="bg-red-600 text-white px-4 py-2 rounded-lg font-black text-sm">OUI</button><button onClick={() => setConfirmLogout(false)} className="bg-gray-100 px-4 py-2 rounded-lg font-black text-sm">NON</button></div>
              )}
            </div>

            <div className="bg-white/90 p-4 rounded-3xl border-4 border-gray-400 space-y-2">
              <h3 className="font-black text-black flex items-center gap-2 uppercase text-[13px]"><ShieldCheck size={20}/> Infos Sécurité</h3>
              <p className="text-base font-black leading-tight text-black">Outil solidaire local. Aucune donnée revendue. Infos servant uniquement à la mise en relation.</p>
            </div>

            <div className="bg-white p-3 rounded-2xl border-4 border-[#4A86B4] text-center shadow-md">
              <p className="text-md font-black text-[#4A86B4] uppercase leading-none">VERSION {VERSION}</p>
              <p className="text-[12px] font-black text-[#4A86B4] uppercase mt-1">Gracieusement propulsé par Chris TAPOR</p>
            </div>
          </div>
        )}
      </main>

      {currentUser && (
        <nav className="fixed bottom-0 w-full bg-white border-t-8 border-[#4A86B4] flex justify-around p-3 shadow-2xl z-30">
          <button onClick={() => setView('trajets')} className={`flex flex-col items-center font-black text-[11px] uppercase ${['trajets', 'liste', 'nouveau'].includes(view) ? 'text-[#4A86B4]' : 'text-gray-400'}`}><Car size={40} /> Accueil</button>
          <button onClick={() => setView('messages')} className={`flex flex-col items-center font-black text-[11px] uppercase ${view === 'messages' ? 'text-[#4A86B4]' : 'text-gray-400'}`}><MessageCircle size={40} /> Messages</button>
          <button onClick={() => setView('parametres')} className={`flex flex-col items-center font-black text-[11px] uppercase ${view === 'parametres' ? 'text-[#4A86B4]' : 'text-gray-400'}`}><ShieldCheck size={40} /> Paramètres</button>
        </nav>
      )}
    </div>
  );
}
