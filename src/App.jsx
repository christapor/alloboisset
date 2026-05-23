import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './lib/supabaseClient';
import { 
  Car, User, MessageCircle, Plus, ArrowLeft, Trash2, Phone, 
  ShieldCheck, Users, Edit, HelpCircle, Share2, Send, Info, 
  FileText, CheckCircle2, Bell, Smartphone 
} from 'lucide-react';

import { usePushNotifications } from './hooks/usePushNotifications';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState('login'); 
  const [loginPrenom, setLoginPrenom] = useState('');
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

  const VERSION = "1.70"; 

  const nav = (newView) => {
    if (newView !== view) {
      window.history.pushState({ view: newView }, '', '');
      setView(newView);
    }
  };

  const contacterEtNotifier = async (trajet) => {
    try {
      supabase.functions.invoke('notify-message', {
        body: {
          userIdToNotify: trajet.driver_id,
          title: `📞 Appel de ${currentUser.nom}`,
          body: `Pour le trajet : ${trajet.origin} ➔ ${trajet.destination}`,
          url: '/' 
        }
      });
    } catch (err) { console.error(err); }
    window.location.href = `tel:${trajet.driver_id}`;
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

  const envoyerMessage = async (e) => {
    if (e) e.preventDefault();
    if (!nouveauMessage.trim()) return;
    const texte = nouveauMessage.trim();
    const { error } = await supabase.from('village_messages').insert([{ sender_name: currentUser.nom, text: texte }]);
    
    if (!error) {
      setNouveauMessage('');
      chargerMessages();
      // NOTIFICATION MUR DU VILLAGE (BROADCAST)
      supabase.functions.invoke('notify-message', {
        body: {
          broadcast: true,
          title: `💬 Mur du village`,
          body: `${currentUser.nom} : ${texte.substring(0, 50)}...`,
          url: '/messages'
        }
      });
    }
  };

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (!acceptCGU) return alert("Veuillez accepter les conditions.");
    const user = { nom: loginPrenom.trim(), telephone: loginTel, pin: loginPin };
    setCurrentUser(user);
    localStorage.setItem('user_boisset', JSON.stringify(user));
    nav('trajets');
  };

  return (
    <div className="min-h-screen bg-fixed bg-cover font-sans flex flex-col select-none" style={{ backgroundImage: "linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url('/alloboisset_fond.jpg')", backgroundPosition: 'center top' }}>
      
      <header className="bg-white/90 shadow-xl p-3 sticky top-0 z-20 border-b-8 border-[#4A86B4] flex flex-col items-center backdrop-blur-sm">
        <div className="flex items-center gap-5 w-full justify-between px-4">
          <img src="/blason.png" className="h-10 w-10 object-contain" alt="Logo" />
          <h1 className="text-xl font-black text-[#4A86B4] uppercase tracking-tighter">AlloBoisset</h1>
          <button onClick={() => navigator.share({url: window.location.href})} className="text-[#4A86B4] p-2 rounded-full"><Share2 size={24}/></button>
        </div>
      </header>

      <main className="flex-1 max-w-xl mx-auto w-full p-3 pb-32 flex flex-col">
        {view === 'login' && (
          <form onSubmit={handleLogin} className="bg-white/95 p-6 rounded-3xl shadow-xl mt-2 border-2 border-[#4A86B4] space-y-4 text-center">
            <h2 className="text-xl font-black uppercase italic">Identification</h2>
            <input type="text" placeholder="PRÉNOM" value={loginPrenom} onChange={(e)=>setLoginPrenom(e.target.value)} required className="w-full p-4 text-lg rounded-xl border-4 border-gray-100 font-bold" />
            <input type="tel" placeholder="TÉLÉPHONE" value={loginTel} onChange={(e)=>setLoginTel(e.target.value)} required className="w-full p-4 text-lg rounded-xl border-4 border-gray-100 font-bold" />
            <input type="password" placeholder="CODE PIN" value={loginPin} onChange={(e)=>setLoginPin(e.target.value)} required className="w-full p-4 text-lg rounded-xl border-4 border-orange-200 font-bold text-center" />
            <label className="flex items-center gap-3 cursor-pointer p-2 bg-orange-50 rounded-xl">
              <input type="checkbox" checked={acceptCGU} onChange={(e)=>setAcceptCGU(e.target.checked)} />
              <span className="text-[10px] font-black uppercase text-gray-800">J'accepte les conditions</span>
            </label>
            <button type="submit" className="w-full p-4 bg-[#4A86B4] text-white rounded-xl text-xl font-black uppercase shadow-lg">Entrer</button>
          </form>
        )}

        {view === 'trajets' && (
          <div className="flex-1 flex flex-col gap-4">
            <div className="flex justify-center mt-1"><span className="bg-white/90 px-5 py-1.5 rounded-full font-black text-[#4A86B4] border-2 border-[#4A86B4]">Bonjour {currentUser?.nom}</span></div>
            <button onClick={() => {chargerTrajets(); nav('liste_offres');}} className="p-6 rounded-[2rem] shadow-lg bg-[#4A86B4] text-white font-black text-xl uppercase flex flex-col items-center gap-2"><Car size={40} />Je vous emmène</button>
            <button onClick={() => {chargerTrajets(); nav('liste_demandes');}} className="p-6 rounded-[2rem] shadow-lg bg-[#8E44AD] text-white font-black text-xl uppercase flex flex-col items-center gap-2"><Users size={40} />Emmenez-moi</button>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => {setIsDemande(false); setEditId(null); nav('nouveau');}} className="p-4 rounded-2xl shadow-lg bg-[#5B8C4E] text-white font-black uppercase flex flex-col items-center"><Plus size={30} />Proposer</button>
              <button onClick={() => {setIsDemande(true); setEditId(null); nav('nouveau');}} className="p-4 rounded-2xl shadow-lg bg-[#E67E22] text-white font-black uppercase flex flex-col items-center"><HelpCircle size={30} />Demander</button>
            </div>
          </div>
        )}

        {view === 'aide' && (
          <div className="flex-1 flex flex-col gap-4">
            <button onClick={() => nav('parametres')} className="bg-white border-4 border-[#4A86B4] text-[#4A86B4] px-4 py-2 rounded-xl font-black flex items-center gap-2 w-fit shadow-md"><ArrowLeft size={24} /> RETOUR</button>
            <div className="bg-white/95 p-6 rounded-3xl shadow-xl space-y-6">
              <h2 className="text-xl font-black uppercase text-[#4A86B4] border-b-4 border-[#4A86B4] pb-2 italic text-center">Mode d'emploi</h2>
              
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-2xl border-2 border-blue-200">
                  <p className="font-black text-blue-800 flex items-center gap-2 mb-2"><Smartphone size={20}/> SUR ANDROID</p>
                  <ol className="text-xs font-bold text-gray-700 space-y-2 list-decimal ml-4">
                    <li>Ouvrez AlloBoisset dans Chrome.</li>
                    <li>Appuyez sur les 3 points (en haut à droite).</li>
                    <li>Choisissez <b>"Installer l'application"</b>.</li>
                    <li>Allez dans vos réglages téléphone > Notifications > AlloBoisset et autorisez tout.</li>
                  </ol>
                </div>

                <div className="bg-purple-50 p-4 rounded-2xl border-2 border-purple-200">
                  <p className="font-black text-purple-800 flex items-center gap-2 mb-2"><Smartphone size={20}/> SUR IPHONE</p>
                  <ol className="text-xs font-bold text-gray-700 space-y-2 list-decimal ml-4">
                    <li>Ouvrez AlloBoisset dans Safari.</li>
                    <li>Appuyez sur le bouton <b>Partager</b> (carré avec une flèche).</li>
                    <li>Faites défiler et appuyez sur <b>"Sur l'écran d'accueil"</b>.</li>
                    <li>Ouvrez l'icône créée sur votre écran, allez dans Réglages et activez les alertes.</li>
                  </ol>
                </div>

                <div className="bg-orange-50 p-4 rounded-2xl border-2 border-orange-200">
                  <p className="font-black text-orange-800 flex items-center gap-2 mb-2"><Bell size={20}/> LES NOTIFICATIONS</p>
                  <p className="text-xs font-bold text-gray-700">Une fois l'app installée, allez dans <b>"RÉGLAGES"</b> (en bas à droite) et appuyez sur le gros bouton orange <b>"Activer les alertes"</b>. C'est l'étape cruciale !</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {(view === 'liste_offres' || view === 'liste_demandes') && (
          <div className="space-y-4">
            <button onClick={() => nav('trajets')} className="bg-white border-4 border-[#4A86B4] text-[#4A86B4] px-4 py-2 rounded-xl font-black flex items-center gap-2 shadow-xl"><ArrowLeft size={24} /> RETOUR</button>
            {trajets.filter(t => view === 'liste_offres' ? !t.driver_name.includes('🙋') : t.driver_name.includes('🙋')).map(t => (
              <div key={t.id} className="bg-white/95 p-5 rounded-[2rem] shadow-md border-l-8 border-[#4A86B4]">
                <p className="font-black text-xl uppercase leading-none">{t.origin} ➔ {t.destination}</p>
                <p className="text-sm text-gray-500 font-bold mb-4">{t.departure_time} - {t.driver_name}</p>
                <button onClick={() => contacterEtNotifier(t)} className="w-full bg-[#4A86B4] text-white p-4 rounded-2xl font-black uppercase flex items-center justify-center gap-2 shadow-lg"><Phone size={24}/> Contacter</button>
              </div>
            ))}
          </div>
        )}

        {view === 'messages' && (
          <div className="flex flex-col h-[70vh] bg-white/90 rounded-3xl p-4 shadow-xl border-2 border-[#4A86B4]">
             <button onClick={() => nav('trajets')} className="mb-2 text-[#4A86B4] font-black flex items-center gap-1"><ArrowLeft size={18}/> RETOUR</button>
             <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                {messages.slice().reverse().map(m => (
                    <div key={m.id} className="p-3 bg-gray-50 rounded-2xl border-l-4 border-gray-300">
                        <p className="text-[10px] font-black text-gray-500 uppercase">{m.sender_name}</p>
                        <p className="text-sm font-bold leading-tight">{m.text}</p>
                    </div>
                ))}
             </div>
             <form onSubmit={envoyerMessage} className="mt-3 flex gap-2">
                <input value={nouveauMessage} onChange={(e)=>setNouveauMessage(e.target.value)} className="flex-1 p-3 border-2 border-[#4A86B4] rounded-xl font-bold" placeholder="Message au village..." />
                <button type="submit" className="bg-[#4A86B4] text-white p-3 rounded-xl shadow-md"><Send size={20}/></button>
             </form>
          </div>
        )}

        {view === 'parametres' && (
          <div className="bg-white/95 p-6 rounded-3xl shadow-xl text-center space-y-6">
            <div className="bg-orange-50 p-4 rounded-2xl border-2 border-orange-200 space-y-3">
                <p className="text-sm font-black text-orange-700 uppercase">Alertes en direct</p>
                <button onClick={subscribeToPush} disabled={pushLoading} className="w-full bg-orange-500 text-white p-4 rounded-xl font-black uppercase flex items-center justify-center gap-2 shadow-lg active:scale-95">
                  <Bell size={24}/> {pushLoading ? 'Activation...' : 'Activer les alertes'}
                </button>
                <button onClick={() => nav('aide')} className="w-full bg-white border-2 border-orange-500 text-orange-500 p-2 rounded-xl font-black uppercase text-xs flex items-center justify-center gap-2">
                  <Info size={16}/> Mode d'emploi
                </button>
            </div>
            <div className="py-2 border-t border-gray-100">
              <p className="font-black text-lg text-gray-700 uppercase">{currentUser?.nom}</p>
              <p className="font-bold text-[#4A86B4]">{currentUser?.telephone}</p>
            </div>
            <button onClick={() => {localStorage.removeItem('user_boisset'); window.location.reload();}} className="w-full border-2 border-red-500 text-red-500 p-2 rounded-xl font-black uppercase text-xs">Déconnexion</button>
            <p className="text-[10px] font-bold text-gray-300 uppercase">Version {VERSION}</p>
          </div>
        )}
      </main>

      {currentUser && (
        <nav className="fixed bottom-0 w-full bg-white/90 backdrop-blur-md border-t-8 border-[#4A86B4] flex justify-around p-2 z-30 shadow-2xl">
          <button onClick={() => nav('trajets')} className={`flex flex-col items-center font-black text-[10px] uppercase ${view === 'trajets' ? 'text-[#4A86B4]' : 'text-gray-400'}`}><Car size={32} /> Accueil</button>
          <button onClick={() => nav('messages')} className={`flex flex-col items-center font-black text-[10px] uppercase ${view === 'messages' ? 'text-[#4A86B4]' : 'text-gray-400'}`}><MessageCircle size={32} /> Messages</button>
          <button onClick={() => nav('parametres')} className={`flex flex-col items-center font-black text-[10px] uppercase ${view === 'parametres' ? 'text-[#4A86B4]' : 'text-gray-400'}`}><ShieldCheck size={32} /> Réglages</button>
        </nav>
      )}
    </div>
  );
}
