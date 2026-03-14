import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import { Car, User, MessageCircle, Plus, ArrowLeft, Trash2, Phone, ShieldCheck, Users, Edit, Info, HelpCircle } from 'lucide-react';

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
  const [editId, setEditId] = useState(null);
  const [depart, setDepart] = useState('Boisset');
  const [arrivee, setArrivee] = useState('');
  const [dateTrajet, setDateTrajet] = useState('');
  const [heureTrajet, setHeureTrajet] = useState('');

  const VERSION = "1.33"; 
  const EMAIL_ADMIN = "ton-email@exemple.com"; // REMPLACE PAR TON EMAIL ICI

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

  const chargerTrajets = async () => {
    const { data } = await supabase.from('rides').select('*').order('id', { ascending: false });
    if (data) {
      const maintenant = new Date();
      const trajetsActifs = data.filter(t => {
        const departPrevu = new Date(t.departure_time.replace(' ', 'T'));
        const limite = new Date(departPrevu.getTime() + 30 * 60000); 
        return limite > maintenant;
      });
      setTrajets(trajetsActifs);
    }
  };

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (!loginPrenom.trim() || !loginTel.trim() || loginPin.length !== 4) {
      return alert("Prénom, Téléphone et PIN requis.");
    }
    const { data: profile } = await supabase.from('profiles').select('*').eq('phone', loginTel).maybeSingle();
    if (profile && profile.pin !== loginPin) {
      return alert("Code PIN incorrect !");
    } else if (!profile) {
      await supabase.from('profiles').insert([{ phone: loginTel, pin: loginPin, name: loginPrenom.trim() }]);
    }
    const nomConvivial = loginNomFamille.trim() ? `${loginPrenom.trim()} ${loginNomFamille.trim().charAt(0).toUpperCase()}.` : loginPrenom.trim();
    const user = { nom: nomConvivial, telephone: loginTel, pin: loginPin };
    setCurrentUser(user);
    localStorage.setItem('user_boisset', JSON.stringify(user));
    localStorage.setItem('last_tel', loginTel);
    setView('trajets');
  };

  const publierTrajet = async () => {
    if (!arrivee || !dateTrajet || !heureTrajet) return alert("Champs vides !");
    const prefixe = isDemande ? "🙋 " : "🚗 ";
    const trajetData = {
      origin: depart, destination: arrivee, departure_time: `${dateTrajet} ${heureTrajet}`,
      driver_id: currentUser.telephone, driver_name: prefixe + currentUser.nom
    };
    const { error } = editId ? await supabase.from('rides').update(trajetData).eq('id', editId) : await supabase.from('rides').insert([trajetData]);
    if (!error) { setArrivee(''); setEditId(null); chargerTrajets(); setView('trajets'); }
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
          <img src="/alloboisset_logo.jpg" className="h-12 w-12 object-contain" alt="Logo" />
          <div className="flex flex-col text-center">
            <h1 className="text-xl font-black text-[#4A86B4] uppercase leading-none tracking-tighter">AlloBoisset</h1>
            <p className="text-[9px] font-black text-[#5B8C4E] uppercase tracking-[0.2em] mt-1 border-t-2 border-[#5B8C4E] pt-1">Covoiturage Villageois</p>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-xl mx-auto w-full p-3 pb-32">
        {view === 'login' && (
          <form onSubmit={handleLogin} className="bg-white/95 p-6 rounded-3xl shadow-xl mt-2 border-2 border-[#4A86B4] space-y-4 text-center">
            <h2 className="text-xl font-black uppercase italic">Identification</h2>
            <input type="text" placeholder="PRÉNOM" value={loginPrenom} onChange={(e)=>setLoginPrenom(e.target.value)} required className="w-full p-4 text-lg rounded-xl border-4 border-gray-100 font-bold" />
            <input type="text" placeholder="NOM (FACULTATIF)" value={loginNomFamille} onChange={(e)=>setLoginNomFamille(e.target.value)} className="w-full p-4 text-lg rounded-xl border-4 border-gray-100 font-bold bg-gray-50/50" />
            <input type="tel" placeholder="TÉLÉPHONE" value={loginTel} onChange={(e)=>setLoginTel(e.target.value)} required className="w-full p-4 text-lg rounded-xl border-4 border-gray-100 font-bold" />
            <input type="password" inputMode="numeric" maxLength="4" placeholder="CODE PIN (4 CHIFFRES)" value={loginPin} onChange={(e)=>setLoginPin(e.target.value.replace(/\D/g,''))} required className="w-full p-4 text-lg rounded-xl border-4 border-orange-200 font-bold text-center placeholder:tracking-normal" />
            <button type="submit" className="w-full bg-[#4A86B4] text-white p-4 rounded-xl text-xl font-black uppercase shadow-lg">Entrer</button>
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase">PIN oublié ?</p>
              <a href={`mailto:${EMAIL_ADMIN}`} className="text-sm font-black text-[#4A86B4] underline decoration-2 underline-offset-4">{EMAIL_ADMIN}</a>
            </div>
          </form>
        )}

        {view === 'trajets' && (
          <div className="grid grid-cols-1 gap-3 mt-1">
            <div className="flex justify-center mb-1">
               <span className="bg-white px-5 py-1.5 rounded-full font-black text-md text-[#4A86B4] shadow-md border-2 border-[#4A86B4]">Bonjour {currentUser?.nom}</span>
            </div>
            <button onClick={() => {chargerTrajets(); setView('liste_offres');}} className="flex flex-col items-center justify-center p-3 rounded-[1.5rem] shadow-lg bg-[#4A86B4] w-full text-white font-black text-lg uppercase active:scale-95 transition-transform"><Car size={32} className="mb-1" />Je vous emmène</button>
            <button onClick={() => {chargerTrajets(); setView('liste_demandes');}} className="flex flex-col items-center justify-center p-3 rounded-[1.5rem] shadow-lg bg-[#8E44AD] w-full text-white font-black text-lg uppercase active:scale-95 transition-transform"><Users size={32} className="mb-1" />Emmenez-moi</button>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button onClick={() => {setIsDemande(false); setEditId(null); setView('nouveau');}} className="flex flex-col items-center justify-center p-3 rounded-[1.5rem] shadow-lg bg-[#5B8C4E] text-white font-black text-sm uppercase active:scale-95 transition-transform"><Plus size={30} className="mb-1" />Proposer</button>
              <button onClick={() => {setIsDemande(true); setEditId(null); setView('nouveau');}} className="flex flex-col items-center justify-center p-3 rounded-[1.5rem] shadow-lg bg-[#E67E22] text-white font-black text-sm uppercase active:scale-95 transition-transform"><HelpCircle size={30} className="mb-1" />Demander</button>
            </div>
          </div>
        )}

        {(view === 'liste_offres' || view === 'liste_demandes') && (
          <div className="space-y-4">
            <button onClick={() => setView('trajets')} className="bg-white border-[6px] border-[#4A86B4] text-[#4A86B4] px-5 py-2 rounded-xl font-black flex items-center gap-2 text-lg shadow-xl"><ArrowLeft size={28} /> RETOUR</button>
            <h2 className="text-xl font-black uppercase italic">{view === 'liste_offres' ? '🚗 Voitures disponibles' : '🙋 Voisins à pied'}</h2>
            {trajets.filter(t => view === 'liste_offres' ? !t.driver_name.includes('🙋') : t.driver_name.includes('🙋')).length === 0 ? 
              <p className="text-center p-12 italic bg-white/50 rounded-3xl">Rien pour le moment.</p> : 
              trajets.filter(t => view === 'liste_offres' ? !t.driver_name.includes('🙋') : t.driver_name.includes('🙋')).map(t => (
                <div key={t.id} className={`bg-white p-5 rounded-[2rem] shadow-md border-l-8 ${view === 'liste_offres' ? 'border-[#4A86B4]' : 'border-[#8E44AD]'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <p className={`font-black text-xl uppercase leading-none ${view === 'liste_offres' ? 'text-[#4A86B4]' : 'text-[#8E44AD]'}`}>{t.origin} ➔ {t.destination}</p>
                    {t.driver_id === currentUser?.telephone && (
                      <div className="flex gap-2">
                        <button onClick={() => {setEditId(t.id); setDepart(t.origin); setArrivee(t.destination); setDateTrajet(t.departure_time.split(' ')[0]); setHeureTrajet(t.departure_time.split(' ')[1]); setIsDemande(t.driver_name.includes('🙋')); setView('nouveau');}} className="text-blue-500 bg-blue-50 p-2 rounded-full"><Edit size={20}/></button>
                        <button onClick={async () => {if(window.confirm("Supprimer ?")){await supabase.from('rides').delete().eq('id', t.id); chargerTrajets();}}} className="text-red-500 bg-red-50 p-2 rounded-full"><Trash2 size={20}/></button>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-center mb-4 text-gray-600 font-bold italic text-sm">
                    <span>{formatMaDate(t.departure_time)} à {t.departure_time.split(' ')[1]}</span>
                    <span className="text-[10px] bg-gray-100 px-2 py-1 rounded-full uppercase">{t.driver_name.replace('🙋 ', '').replace('🚗 ', '')}</span>
                  </div>
                  <a href={`tel:${t.driver_id}`} className={`block w-full text-white p-3 rounded-xl font-black text-lg text-center uppercase flex items-center justify-center gap-3 shadow-lg ${view === 'liste_offres' ? 'bg-[#4A86B4]' : 'bg-[#8E44AD]'}`}>
                    <Phone size={20}/> {view === 'liste_offres' ? 'Réserver ma place' : "Proposer de l'emmener"}
                  </a>
                </div>
              ))
            }
          </div>
        )}

        {view === 'nouveau' && (
          <div className="space-y-4">
            <button onClick={() => setView('trajets')} className="bg-white border-[6px] border-[#4A86B4] text-[#4A86B4] px-5 py-2 rounded-xl font-black flex items-center gap-2 text-lg shadow-xl"><ArrowLeft size={28} /> RETOUR</button>
            <div className={`bg-white/95 p-6 rounded-3xl shadow-lg space-y-4 border-4 ${isDemande ? 'border-[#E67E22]' : 'border-[#5B8C4E]'}`}>
              <h2 className={`text-xl font-black text-center uppercase ${isDemande ? 'text-[#E67E22]' : 'text-[#5B8C4E]'}`}>{editId ? 'Modifier' : (isDemande ? 'Je cherche' : 'Je propose')}</h2>
              <input type="text" value={depart} onChange={(e)=>setDepart(e.target.value)} className="w-full p-4 border-2 rounded-xl font-bold text-center" />
              <input type="text" placeholder="DESTINATION ?" value={arrivee} onChange={(e)=>setArrivee(e.target.value)} className="w-full p-4 border-2 rounded-xl font-bold text-center uppercase" />
              <div className="grid grid-cols-2 gap-2">
                <input type="date" value={dateTrajet} onChange={(e)=>setDateTrajet(e.target.value)} className="w-full p-2 border-2 rounded-xl font-bold text-sm" />
                <input type="time" value={heureTrajet} onChange={(e)=>setHeureTrajet(e.target.value)} className="w-full p-2 border-2 rounded-xl font-bold text-sm" />
              </div>
              <button onClick={publierTrajet} className={`w-full text-white p-5 rounded-2xl font-black text-xl uppercase shadow-lg ${isDemande ? 'bg-[#E67E22]' : 'bg-[#5B8C4E]'}`}>{editId ? 'Enregistrer' : 'Publier'}</button>
            </div>
          </div>
        )}

        {view === 'parametres' && (
          <div className="space-y-4 px-2">
            <div className="bg-white/95 p-4 rounded-3xl shadow-xl border-4 border-[#4A86B4] text-center space-y-2">
              <div className="flex items-center justify-center gap-4">
                <div className="w-12 h-12 bg-[#4A86B4] rounded-full flex items-center justify-center text-white"><User size={26} /></div>
                <div className="text-left font-black">
                  <h2 className="text-lg uppercase leading-none">{currentUser?.nom}</h2>
                  <p className="text-md text-[#4A86B4]">{currentUser?.telephone}</p>
                </div>
              </div>
              {!confirmLogout ? (
                <button onClick={() => setConfirmLogout(true)} className="w-full border-2 border-red-500 text-red-500 p-2 rounded-xl font-black uppercase text-[12px]">Se déconnecter</button>
              ) : (
                <div className="flex flex-col gap-2 p-2 bg-red-50 rounded-xl border-2 border-red-200">
                  <p className="font-black text-red-600 text-sm italic leading-tight">Voulez-vous vraiment vous déconnecter ?</p>
                  <div className="flex gap-2 justify-center">
                    <button onClick={() => {localStorage.removeItem('user_boisset'); setView('login'); setCurrentUser(null); setConfirmLogout(false);}} className="bg-red-600 text-white px-6 py-2 rounded-lg font-black text-sm">OUI</button>
                    <button onClick={() => setConfirmLogout(false)} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-black text-sm">NON</button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="bg-white/90 p-4 rounded-3xl border-4 border-gray-400 space-y-2">
              <h3 className="font-black text-black flex items-center gap-2 uppercase text-[13px]"><ShieldCheck size={20}/> Charte de sécurité</h3>
              <p className="text-sm font-black leading-tight text-gray-700">Outil villageois solidaire. Vos données (Nom, Tél) ne servent qu'à la mise en relation. Aucun traçage, aucune pub. Votre code PIN est stocké en sécurité dans la base de données.</p>
            </div>

            <div className="bg-white p-3 rounded-2xl border-4 border-[#4A86B4] text-center shadow-md">
              <p className="text-md font-black text-[#4A86B4] uppercase leading-none">VERSION {VERSION}</p>
              <p className="text-[12px] font-black text-[#4A86B4] uppercase mt-1">Propulsé par Chris TAPOR</p>
            </div>
          </div>
        )}
      </main>

      {currentUser && (
        <nav className="fixed bottom-0 w-full bg-white border-t-8 border-[#4A86B4] flex justify-around p-2 shadow-2xl z-30">
          <button onClick={() => {setView('trajets'); setConfirmLogout(false);}} className={`flex flex-col items-center font-black text-[10px] uppercase ${view === 'trajets' || view.includes('liste') || view === 'nouveau' ? 'text-[#4A86B4]' : 'text-gray-400'}`}><Car size={32} /> Accueil</button>
          <button onClick={() => {setView('messages'); setConfirmLogout(false);}} className={`flex flex-col items-center font-black text-[10px] uppercase ${view === 'messages' ? 'text-[#4A86B4]' : 'text-gray-400'}`}><MessageCircle size={32} /> Messages</button>
          <button onClick={() => {setView('parametres'); setConfirmLogout(false);}} className={`flex flex-col items-center font-black text-[10px] uppercase ${view === 'parametres' ? 'text-[#4A86B4]' : 'text-gray-400'}`}><ShieldCheck size={32} /> Paramètres</button>
        </nav>
      )}
    </div>
  );
}
