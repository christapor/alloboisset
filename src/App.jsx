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

  const VERSION = "1.63"; // DEBUG MODE
  const LISTE_ADMINS = ["0660419226", "0619872263"]; 
  const LISTE_NOIRE = ["merde", "putain", "connard", "salope"]; 

  const nav = (newView) => {
    if (newView !== view) {
      window.history.pushState({ view: newView }, '', '');
      setView(newView);
    }
  };
  
  // FONCTION DE CONTACT CORRIGÉE AVEC LOGS ET ATTENTE
  const contacterEtNotifier = async (trajet) => {
    console.log("🚀 Tentative de notification pour le trajet de:", trajet.driver_name);
    
    try {
      // ÉTAPE 1 : Notification (On l'attend avec await)
      console.log("📡 Appel de la Edge Function notify-message...");
      const { data, error } = await supabase.functions.invoke('notify-message', {
        body: {
          userIdToNotify: trajet.driver_id,
          title: `📞 Appel pour un covoit'`,
          body: `${currentUser.nom} cherche à vous joindre pour le trajet ${trajet.origin} ➔ ${trajet.destination}.`,
          url: '/' 
        }
      });

      if (error) {
        console.error("❌ Erreur Edge Function:", error);
      } else {
        console.log("✅ Notification envoyée avec succès:", data);
      }

    } catch (err) {
      console.error("💥 Erreur globale notification:", err);
    }

    // ÉTAPE 2 : On lance l'appel (après un tout petit délai pour être sûr)
    console.log("☎️ Lancement de l'appel tel:", trajet.driver_id);
    setTimeout(() => {
      window.location.href = `tel:${trajet.driver_id}`;
    }, 500);
  };

  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state && event.state.view) setView(event.state.view);
      else {
        const savedUser = localStorage.getItem('user_boisset');
        setView(savedUser ? 'trajets' : 'login');
      }
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

  const envoyerMessage = async (e) => {
    if (e) e.preventDefault();
    if (!nouveauMessage.trim()) return;
    const { error } = await supabase.from('village_messages').insert([{ sender_name: currentUser.nom, text: nouveauMessage.trim() }]);
    if (!error) { setNouveauMessage(''); chargerMessages(); }
  };

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (!acceptCGU) return alert("Validez les CGU.");
    const user = { nom: loginPrenom.trim(), telephone: loginTel, pin: loginPin };
    setCurrentUser(user);
    localStorage.setItem('user_boisset', JSON.stringify(user));
    nav('trajets');
  };

  const publierTrajet = async () => {
    const prefixe = isDemande ? "🙋 " : "🚗 ";
    const trajetData = {
      origin: depart, destination: arrivee, departure_time: `${dateTrajet} ${heureTrajet}`,
      driver_id: currentUser.telephone, driver_name: prefixe + currentUser.nom
    };
    const { error } = editId ? await supabase.from('rides').update(trajetData).eq('id', editId) : await supabase.from('rides').insert([trajetData]);
    if (!error) { setArrivee(''); nav('trajets'); chargerTrajets(); }
  };

  const estAdmin = (tel) => LISTE_ADMINS.includes(tel);

  return (
    <div className="min-h-screen bg-fixed bg-cover font-sans flex flex-col select-none" style={{ backgroundImage: "linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url('/alloboisset_fond.jpg')", backgroundPosition: 'center top' }}>
      <header className="bg-white/90 shadow-xl p-3 sticky top-0 z-20 border-b-8 border-[#4A86B4] flex flex-col items-center">
        <div className="flex items-center gap-5 w-full justify-between px-4">
          <img src="/blason.png" className="h-10 w-10 object-contain" alt="L" />
          <div className="flex flex-col text-center">
            <h1 className="text-xl font-black text-[#4A86B4] uppercase">AlloBoisset</h1>
          </div>
          <button onClick={() => navigator.share({url: window.location.href})} className="text-[#4A86B4] p-2"><Share2 size={24}/></button>
        </div>
      </header>

      <main className="flex-1 max-w-xl mx-auto w-full p-3 pb-32">
        {view === 'login' && (
          <form onSubmit={handleLogin} className="bg-white/95 p-6 rounded-3xl shadow-xl space-y-4 text-center">
            <h2 className="text-xl font-black uppercase">Identification</h2>
            <input type="text" placeholder="PRÉNOM" value={loginPrenom} onChange={(e)=>setLoginPrenom(e.target.value)} required className="w-full p-4 rounded-xl border-4 border-gray-100 font-bold" />
            <input type="tel" placeholder="TÉLÉPHONE" value={loginTel} onChange={(e)=>setLoginTel(e.target.value)} required className="w-full p-4 rounded-xl border-4 border-gray-100 font-bold" />
            <input type="password" placeholder="CODE PIN" value={loginPin} onChange={(e)=>setLoginPin(e.target.value)} required className="w-full p-4 rounded-xl border-4 border-orange-200 font-bold text-center" />
            <label className="flex items-center gap-3 p-2 bg-orange-50 rounded-xl cursor-pointer">
                <input type="checkbox" checked={acceptCGU} onChange={(e)=>setAcceptCGU(e.target.checked)} />
                <span className="text-[10px] font-bold">J'ACCEPTE LES CONDITIONS</span>
            </label>
            <button type="submit" className="w-full p-4 bg-[#4A86B4] text-white rounded-xl text-xl font-black uppercase">Entrer</button>
          </form>
        )}

        {view === 'trajets' && (
          <div className="space-y-4">
            <div className="flex justify-center"><span className="bg-white/90 px-5 py-1 rounded-full font-black text-[#4A86B4]">Bonjour {currentUser?.nom}</span></div>
            <button onClick={() => nav('liste_offres')} className="w-full p-4 bg-[#4A86B4] text-white rounded-3xl font-black text-lg uppercase flex items-center justify-center gap-3"><Car size={32}/>Je vous emmène</button>
            <button onClick={() => nav('liste_demandes')} className="w-full p-4 bg-[#8E44AD] text-white rounded-3xl font-black text-lg uppercase flex items-center justify-center gap-3"><Users size={32}/>Emmenez-moi</button>
            <div className="grid grid-cols-2 gap-3">
                <button onClick={() => {setIsDemande(false); setEditId(null); nav('nouveau');}} className="p-4 bg-[#5B8C4E] text-white rounded-3xl font-black uppercase text-sm flex flex-col items-center"><Plus size={24}/>Proposer</button>
                <button onClick={() => {setIsDemande(true); setEditId(null); nav('nouveau');}} className="p-4 bg-[#E67E22] text-white rounded-3xl font-black uppercase text-sm flex flex-col items-center"><HelpCircle size={24}/>Demander</button>
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
                <button onClick={() => contacterEtNotifier(t)} className="w-full bg-[#4A86B4] text-white p-3 rounded-xl font-black uppercase flex items-center justify-center gap-2 shadow-lg"><Phone size={20}/> Contacter</button>
              </div>
            ))}
          </div>
        )}

        {view === 'messages' && (
          <div className="flex flex-col h-[70vh] bg-white/90 rounded-3xl p-4">
             <button onClick={() => nav('trajets')} className="mb-2 text-[#4A86B4] font-black flex items-center gap-1"><ArrowLeft size={18}/> RETOUR</button>
             <div className="flex-1 overflow-y-auto space-y-2">
                {messages.slice().reverse().map(m => (
                    <div key={m.id} className="p-2 bg-gray-100 rounded-xl">
                        <p className="text-[10px] font-black text-gray-500 uppercase">{m.sender_name}</p>
                        <p className="text-sm font-bold">{m.text}</p>
                    </div>
                ))}
             </div>
             <form onSubmit={envoyerMessage} className="mt-2 flex gap-2">
                <input value={nouveauMessage} onChange={(e)=>setNouveauMessage(e.target.value)} className="flex-1 p-2 border-2 border-[#4A86B4] rounded-xl font-bold" />
                <button type="submit" className="bg-[#4A86B4] text-white p-2 rounded-xl"><Send size={20}/></button>
             </form>
          </div>
        )}

        {view === 'nouveau' && (
          <div className="bg-white/95 p-6 rounded-3xl space-y-4">
            <button onClick={() => nav('trajets')} className="text-[#4A86B4] font-black flex items-center gap-1"><ArrowLeft size={18}/> RETOUR</button>
            <h2 className="text-center font-black uppercase">{isDemande ? 'Je cherche' : 'Je propose'}</h2>
            <input type="text" placeholder="DÉPART" value={depart} onChange={(e)=>setDepart(e.target.value)} className="w-full p-4 border-2 rounded-xl font-bold" />
            <input type="text" placeholder="DESTINATION" value={arrivee} onChange={(e)=>setArrivee(e.target.value)} className="w-full p-4 border-2 rounded-xl font-bold uppercase" />
            <input type="date" value={dateTrajet} onChange={(e)=>setDateTrajet(e.target.value)} className="w-full p-4 border-2 rounded-xl font-bold" />
            <input type="time" value={heureTrajet} onChange={(e)=>setHeureTrajet(e.target.value)} className="w-full p-4 border-2 rounded-xl font-bold" />
            <button onClick={publierTrajet} className="w-full bg-[#4A86B4] text-white p-4 rounded-xl font-black uppercase">Publier</button>
          </div>
        )}

        {view === 'parametres' && (
          <div className="bg-white/95 p-6 rounded-3xl space-y-4 text-center">
            <div className="bg-orange-50 p-4 rounded-2xl border-2 border-orange-200">
                <p className="text-sm font-black text-orange-700 mb-2">ALRTES DIRECTES</p>
                <button onClick={subscribeToPush} className="w-full bg-orange-500 text-white p-3 rounded-xl font-black uppercase flex items-center justify-center gap-2">
                  <Bell size={20}/> {pushLoading ? 'Activation...' : 'Activer les alertes'}
                </button>
            </div>
            <p className="font-black text-lg">{currentUser?.nom} - {currentUser?.telephone}</p>
            <button onClick={() => {localStorage.removeItem('user_boisset'); window.location.reload();}} className="w-full border-2 border-red-500 text-red-500 p-2 rounded-xl font-black uppercase">Déconnexion</button>
            <p className="text-[10px] font-bold text-gray-400">VERSION {VERSION}</p>
          </div>
        )}
      </main>

      {currentUser && (
        <nav className="fixed bottom-0 w-full bg-white/90 border-t-8 border-[#4A86B4] flex justify-around p-2 z-30">
          <button onClick={() => nav('trajets')} className="flex flex-col items-center font-black text-[10px] text-gray-400"><Car size={32} /> ACCUEIL</button>
          <button onClick={() => nav('messages')} className="flex flex-col items-center font-black text-[10px] text-gray-400"><MessageCircle size={32} /> MESSAGES</button>
          <button onClick={() => nav('parametres')} className="flex flex-col items-center font-black text-[10px] text-gray-400"><ShieldCheck size={32} /> RÉGLAGES</button>
        </nav>
      )}
    </div>
  );
}
