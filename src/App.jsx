import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './lib/supabaseClient';
import { 
  Car, User, MessageCircle, Plus, ArrowLeft, Trash2, Phone, 
  ShieldCheck, Users, Edit, HelpCircle, Share2, Send, Info, 
  FileText, CheckCircle2, Bell 
} from 'lucide-react';

import { usePushNotifications } from './hooks/usePushNotifications';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState('login'); 
  const [loginPrenom, setLoginPrenom] = useState('');
  const [loginNomFamille, setLoginNomFamille] = useState('');
  const [loginTel, setLoginTel] = useState(localStorage.getItem('last_tel') || '');
  const [loginPin, setLoginPin] = useState('');
  const [acceptCGU, setAcceptCGU] = useState(false);
  const [trajets, setTrajets] = useState([]);
  const [messages, setMessages] = useState([]);
  const [nouveauMessage, setNouveauMessage] = useState('');
  const [confirmLogout, setConfirmLogout] = useState(false);
  
  const [isDemande, setIsDemande] = useState(false);
  const [editId, setEditId] = useState(null);
  const [depart, setDepart] = useState('Boisset');
  const [arrivee, setArrivee] = useState('');
  const [dateTrajet, setDateTrajet] = useState('');
  const [heureTrajet, setHeureTrajet] = useState('');

  const messagesEndRef = useRef(null);
  const { subscribeToPush, loading: pushLoading } = usePushNotifications();

  const VERSION = "1.64 - FORCE UPDATE"; 

  const nav = (newView) => {
    if (newView !== view) {
      window.history.pushState({ view: newView }, '', '');
      setView(newView);
    }
  };
  
  const contacterEtNotifier = async (trajet) => {
    // ALERT DE DEBUG POUR ÊTRE SÛR QUE LE CODE TOURNE
    alert("Debug: Lancement de la procédure de notification...");
    console.log("🚀 Début du script de contact");
    
    try {
      console.log("📡 Envoi à Supabase pour l'utilisateur:", trajet.driver_id);
      const { data, error } = await supabase.functions.invoke('notify-message', {
        body: {
          userIdToNotify: trajet.driver_id,
          title: `📞 Appel de ${currentUser.nom}`,
          body: `Besoin d'un trajet pour ${trajet.destination} !`,
          url: '/' 
        }
      });

      if (error) console.error("❌ Erreur retournée par Supabase:", error);
      else console.log("✅ Réponse Supabase:", data);

    } catch (err) {
      console.error("💥 Crash pendant l'appel function:", err);
    }

    // On attend 1 seconde pour laisser le temps à la requête de partir
    setTimeout(() => {
      console.log("☎️ Exécution du lien TEL");
      window.location.href = `tel:${trajet.driver_id}`;
    }, 1000);
  };

  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state && event.state.view) setView(event.state.view);
    };
    window.addEventListener('popstate', handlePopState);
    const savedUser = localStorage.getItem('user_boisset');
    if (savedUser) { 
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user); 
        setView('trajets'); 
      } catch (e) { localStorage.removeItem('user_boisset'); }
    }
    chargerTrajets();
    chargerMessages();
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const chargerTrajets = async () => {
    const { data } = await supabase.from('rides').select('*').order('id', { ascending: false });
    if (data) {
      const maintenant = new Date();
      setTrajets(data.filter(t => {
        const d = new Date(t.departure_time.replace(' ', 'T'));
        return new Date(d.getTime() + 30 * 60000) > maintenant;
      }));
    }
  };

  const chargerMessages = async () => {
    const dateLimite = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const { data } = await supabase.from('village_messages').select('*').gt('created_at', dateLimite).order('created_at', { ascending: false }).limit(100);
    if (data) setMessages(data);
  };

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (!acceptCGU) return alert("Validez les CGU.");
    const user = { nom: loginPrenom.trim(), telephone: loginTel, pin: loginPin };
    setCurrentUser(user);
    localStorage.setItem('user_boisset', JSON.stringify(user));
    nav('trajets');
  };

  return (
    <div className="min-h-screen bg-fixed bg-cover font-sans flex flex-col select-none" style={{ backgroundImage: "linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url('/alloboisset_fond.jpg')", backgroundPosition: 'center top' }}>
      <header className="bg-white/90 shadow-xl p-3 sticky top-0 z-20 border-b-8 border-[#4A86B4] flex flex-col items-center">
        <div className="flex items-center gap-5 w-full justify-between px-4">
          <img src="/blason.png" className="h-10 w-10" alt="L" />
          <h1 className="text-xl font-black text-[#4A86B4] uppercase">AlloBoisset <span className="text-[10px] text-red-500">v{VERSION}</span></h1>
          <button onClick={() => navigator.share({url: window.location.href})} className="text-[#4A86B4] p-2"><Share2 size={24}/></button>
        </div>
      </header>

      <main className="flex-1 max-w-xl mx-auto w-full p-3 pb-32">
        {view === 'login' && (
          <form onSubmit={handleLogin} className="bg-white/95 p-6 rounded-3xl space-y-4 text-center">
            <h2 className="text-xl font-black uppercase">Identification</h2>
            <input type="text" placeholder="PRÉNOM" value={loginPrenom} onChange={(e)=>setLoginPrenom(e.target.value)} required className="w-full p-4 rounded-xl border-4 border-gray-100" />
            <input type="tel" placeholder="TÉLÉPHONE" value={loginTel} onChange={(e)=>setLoginTel(e.target.value)} required className="w-full p-4 rounded-xl border-4 border-gray-100" />
            <input type="password" placeholder="CODE PIN" value={loginPin} onChange={(e)=>setLoginPin(e.target.value)} required className="w-full p-4 rounded-xl border-4 border-orange-200 text-center" />
            <label className="flex items-center gap-3 p-2 cursor-pointer"><input type="checkbox" checked={acceptCGU} onChange={(e)=>setAcceptCGU(e.target.checked)} /><span className="text-[10px] font-bold">J'ACCEPTE LES CGU</span></label>
            <button type="submit" className="w-full p-4 bg-[#4A86B4] text-white rounded-xl text-xl font-black uppercase">Entrer</button>
          </form>
        )}

        {view === 'trajets' && (
          <div className="space-y-4">
             <div className="flex justify-center"><span className="bg-white/90 px-5 py-1 rounded-full font-black text-[#4A86B4]">Bonjour {currentUser?.nom}</span></div>
             <button onClick={() => nav('liste_offres')} className="w-full p-6 bg-[#4A86B4] text-white rounded-3xl font-black text-xl uppercase">🚗 Je vous emmène</button>
             <button onClick={() => nav('liste_demandes')} className="w-full p-6 bg-[#8E44AD] text-white rounded-3xl font-black text-xl uppercase">🙋 Emmenez-moi</button>
             <div className="grid grid-cols-2 gap-3">
                <button onClick={() => {setIsDemande(false); setEditId(null); nav('nouveau');}} className="p-4 bg-[#5B8C4E] text-white rounded-2xl font-black uppercase"><Plus/> Proposer</button>
                <button onClick={() => {setIsDemande(true); setEditId(null); nav('nouveau');}} className="p-4 bg-[#E67E22] text-white rounded-2xl font-black uppercase"><HelpCircle/> Demander</button>
             </div>
          </div>
        )}

        {(view === 'liste_offres' || view === 'liste_demandes') && (
          <div className="space-y-4">
            <button onClick={() => nav('trajets')} className="bg-white border-4 border-[#4A86B4] text-[#4A86B4] px-4 py-2 rounded-xl font-black flex items-center gap-2"><ArrowLeft size={24} /> RETOUR</button>
            {trajets.filter(t => view === 'liste_offres' ? !t.driver_name.includes('🙋') : t.driver_name.includes('🙋')).map(t => (
              <div key={t.id} className="bg-white/95 p-5 rounded-[2rem] shadow-md border-l-8 border-[#4A86B4]">
                <p className="font-black text-xl uppercase">{t.origin} ➔ {t.destination}</p>
                <p className="text-sm text-gray-500 font-bold mb-4">{t.departure_time} - {t.driver_name}</p>
                {/* BOUTON MODIFIÉ POUR TEST : COULEUR ORANGE SI C'EST LE NOUVEAU CODE */}
                <button 
                  onClick={() => contacterEtNotifier(t)} 
                  className="w-full bg-orange-600 text-white p-4 rounded-2xl font-black uppercase flex items-center justify-center gap-2 shadow-lg active:scale-95"
                >
                  <Phone size={24}/> TEST NOTIF + APPEL
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {currentUser && (
        <nav className="fixed bottom-0 w-full bg-white/90 border-t-8 border-[#4A86B4] flex justify-around p-2 z-30">
          <button onClick={() => nav('trajets')} className="flex flex-col items-center font-black text-[10px] text-gray-400"><Car size={32} /> ACCUEIL</button>
          <button onClick={() => nav('parametres')} className="flex flex-col items-center font-black text-[10px] text-gray-400"><ShieldCheck size={32} /> RÉGLAGES</button>
        </nav>
      )}
    </div>
  );
}
