import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import { Car, User, MessageCircle, Plus, MapPin, Calendar, Clock, Users, Phone, ArrowLeft, Send, LogOut } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState('login'); 
  const [loginNom, setLoginNom] = useState('');
  const [loginTel, setLoginTel] = useState('');
  const [trajets, setTrajets] = useState([]);

  // États pour le nouveau trajet
  const [depart, setDepart] = useState('Boisset');
  const [arrivee, setArrivee] = useState('');
  const [dateTrajet, setDateTrajet] = useState('');
  const [heureTrajet, setHeureTrajet] = useState('');

  // 1. MÉMOIRE : Charger l'utilisateur au démarrage
  useEffect(() => {
    const savedUser = localStorage.getItem('user_boisset');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
      setView('trajets');
    }
    chargerTrajets();
  }, []);

  // 2. RÉCUPÉRER LES TRAJETS DEPUIS SUPABASE
  const chargerTrajets = async () => {
    const { data, error } = await supabase
      .from('rides') // Assure-toi que ta table s'appelle bien 'rides'
      .select('*')
      .order('id', { ascending: false });
    if (data) setTrajets(data);
  };

  const handleLogin = () => {
    if (loginNom.trim() && loginTel.trim()) {
      const user = { nom: loginNom, telephone: loginTel };
      setCurrentUser(user);
      localStorage.setItem('user_boisset', JSON.stringify(user)); // On enregistre !
      setView('trajets');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user_boisset');
    setCurrentUser(null);
    setView('login');
  };

  // 3. ENREGISTRER UN TRAJET
  const publierTrajet = async () => {
    if (!arrivee || !dateTrajet || !heureTrajet) {
      alert("Merci de remplir tous les champs !");
      return;
    }

    const nouveau = {
      origin: depart,
      destination: arrivee,
      departure_time: `${dateTrajet} ${heureTrajet}`,
      driver_id: currentUser.telephone, // On utilise le tel comme identifiant simplifié
      seats: 3
    };

    const { error } = await supabase.from('rides').insert([nouveau]);

    if (!error) {
      setArrivee('');
      chargerTrajets();
      setView('liste');
    } else {
      alert("Erreur lors de l'enregistrement...");
    }
  };

  const bigBtnClass = "flex flex-col items-center justify-center p-8 rounded-3xl shadow-xl transition-all active:scale-95 text-white font-bold text-2xl uppercase";
  const inputClass = "w-full p-5 text-xl rounded-2xl border-4 border-gray-100 focus:border-[#4A86B4] outline-none bg-white/90";
  // Classe spéciale pour la date/heure (plus petite)
  const inputSmallClass = "w-full p-3 text-lg rounded-2xl border-4 border-gray-100 focus:border-[#4A86B4] outline-none bg-white/90";

  return (
    <div className="min-h-screen bg-fixed bg-cover bg-center font-sans" 
         style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.6), rgba(255,255,255,0.6)), url('/alloboisset_fond.jpg')" }}>
      
      {/* HEADER */}
      <header className="bg-white/90 backdrop-blur-md shadow-lg p-4 sticky top-0 z-20 flex justify-between items-center border-b-4 border-[#4A86B4]">
        <div className="flex items-center gap-4">
          <img src="/alloboisset_logo.jpg" alt="Logo" className="h-16 w-16 object-contain" />
          <div>
            <h1 className="text-3xl font-black text-[#4A86B4] leading-none uppercase">AlloBoisset</h1>
            <p className="text-xs font-bold text-[#5B8C4E]">Le covoiturage du village</p>
          </div>
        </div>
        {currentUser && (
          <button onClick={handleLogout} className="p-3 bg-gray-100 rounded-full text-[#4A86B4]">
            <LogOut size={28} />
          </button>
        )}
      </header>

      <main className="max-w-xl mx-auto p-6 pb-24 text-gray-800">
        
        {/* VUE CONNEXION */}
        {view === 'login' && (
          <div className="bg-white/90 p-8 rounded-3xl shadow-2xl mt-10 border-2 border-[#4A86B4]">
            <h2 className="text-3xl font-bold text-center mb-8">Bonjour !</h2>
            <div className="space-y-6">
              <input type="text" placeholder="Prénom et Nom" value={loginNom} onChange={(e)=>setLoginNom(e.target.value)} className={inputClass} />
              <input type="tel" placeholder="Votre Téléphone" value={loginTel} onChange={(e)=>setLoginTel(e.target.value)} className={inputClass} />
              <button onClick={handleLogin} className="w-full bg-[#4A86B4] text-white p-6 rounded-2xl text-2xl font-bold shadow-lg">SE CONNECTER</button>
            </div>
          </div>
        )}

        {/* VUE ACCUEIL */}
        {view === 'trajets' && (
          <div className="space-y-8 mt-6">
            <h2 className="text-3xl font-bold text-center">Que voulez-vous faire, {currentUser?.nom} ?</h2>
            <button onClick={() => setView('liste')} className={`${bigBtnClass} bg-[#4A86B4] w-full`}><Car size={80} className="mb-4" />Je cherche un trajet</button>
            <button onClick={() => setView('nouveau')} className={`${bigBtnClass} bg-[#5B8C4E] w-full`}><Plus size={80} className="mb-4" />Je propose un trajet</button>
          </div>
        )}

        {/* VUE NOUVEAU TRAJET */}
        {view === 'nouveau' && (
          <div className="space-y-6">
            <button onClick={() => setView('trajets')} className="flex items-center gap-2 font-bold text-[#4A86B4] text-xl"><ArrowLeft /> Retour</button>
            <div className="bg-white/95 p-8 rounded-3xl shadow-xl space-y-6 border-2 border-[#5B8C4E]">
              <h2 className="text-2xl font-bold text-center">Proposer un trajet</h2>
              <div>
                <label className="block font-bold mb-1">Départ :</label>
                <input type="text" value={depart} onChange={(e)=>setDepart(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block font-bold mb-1 text-[#4A86B4]">Destination :</label>
                <input type="text" placeholder="Où allez-vous ?" value={arrivee} onChange={(e)=>setArrivee(e.target.value)} className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold mb-1">Date :</label>
                  <input type="date" value={dateTrajet} onChange={(e)=>setDateTrajet(e.target.value)} className={inputSmallClass} />
                </div>
                <div>
                  <label className="block font-bold mb-1">Heure :</label>
                  <input type="time" value={heureTrajet} onChange={(e)=>setHeureTrajet(e.target.value)} className={inputSmallClass} />
                </div>
              </div>
              <button onClick={publierTrajet} className="w-full bg-[#5B8C4E] text-white p-6 rounded-2xl text-2xl font-bold shadow-lg uppercase">PUBLIER MON TRAJET</button>
            </div>
          </div>
        )}

        {/* VUE LISTE */}
        {view === 'liste' && (
          <div className="space-y-6 text-gray-800">
            <button onClick={() => setView('trajets')} className="flex items-center gap-2 font-bold text-[#4A86B4] text-xl"><ArrowLeft /> Retour</button>
            <h2 className="text-3xl font-bold">Trajets prévus</h2>
            {trajets.length === 0 ? (
              <div className="bg-white/80 p-10 rounded-3xl text-center italic text-gray-500 border-2 border-dashed border-gray-300 text-xl">
                Aucun trajet pour l'instant...
              </div>
            ) : (
              <div className="space-y-4">
                {trajets.map((t) => (
                  <div key={t.id} className="bg-white/95 p-6 rounded-3xl shadow-md border-l-8 border-[#4A86B4]">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-black text-[#5B8C4E] text-lg uppercase">{t.origin} ➔ {t.destination}</span>
                    </div>
                    <div className="flex gap-4 text-gray-600 font-bold mb-4">
                      <div className="flex items-center gap-1"><Calendar size={18}/> {t.departure_time.split(' ')[0]}</div>
                      <div className="flex items-center gap-1"><Clock size={18}/> {t.departure_time.split(' ')[1]}</div>
                    </div>
                    <button className="w-full bg-[#4A86B4] text-white p-3 rounded-xl font-bold">CONTACTER</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      <nav className="fixed bottom-0 w-full bg-white border-t-4 border-[#4A86B4] flex justify-around p-4 shadow-2xl z-20">
        <button onClick={() => setView('trajets')} className="flex flex-col items-center text-[#4A86B4] font-black text-xs uppercase"><Car size={35} /> Accueil</button>
        <button className="flex flex-col items-center text-gray-400 font-bold text-xs uppercase"><MessageCircle size={35} /> Messages</button>
        <button className="flex flex-col items-center text-gray-400 font-bold text-xs uppercase"><User size={35} /> Profil</button>
      </nav>
    </div>
  );
}
