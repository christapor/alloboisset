import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './lib/supabaseClient';
import { Car, User, MessageCircle, Plus, ArrowLeft, Trash2, Phone, ShieldCheck, Users, Edit, HelpCircle, Share2, Send, Info, FileText } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState('login'); 
  const [loginPrenom, setLoginPrenom] = useState('');
  const [loginNomFamille, setLoginNomFamille] = useState('');
  const [loginTel, setLoginTel] = useState(localStorage.getItem('last_tel') || '');
  const [loginPin, setLoginPin] = useState('');
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

  const VERSION = "1.52"; // Mise à jour avec les CGU
  const EMAIL_ADMIN = "christapor@gmail.com"; 
  const LISTE_ADMINS = ["0660419226", "0619872263"]; 
  const LISTE_NOIRE = ["merde", "putain", "connard", "salope"]; 

  const MAILTO_PIN = `mailto:${EMAIL_ADMIN}?subject=AlloBoisset%20:%20Code%20PIN%20oubli%C3%A9&body=Bonjour%20Chris,%0D%0A%0D%0AJ'ai%20oubli%C3%A9%20mon%20code%20PIN%20pour%20l'application%20AlloBoisset.%0D%0AMon%20num%C3%A9ro%20de%20t%C3%A9l%C3%A9phone%20est%20le%20:%20`;

  // --- LOGIQUE DE NAVIGATION ---
  const nav = (newView) => {
    if (newView !== view) {
      window.history.pushState({ view: newView }, '', '');
      setView(newView);
    }
  };

  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state && event.state.view) {
        setView(event.state.view);
      } else {
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
        window.history.replaceState({ view: 'trajets' }, '', '');
      } catch (e) {
        localStorage.removeItem('user_boisset');
      }
    }

    chargerTrajets();
    chargerMessages();

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (view === 'messages') {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, view]);

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

  const chargerMessages = async () => {
    const troisMoisEnMs = 90 * 24 * 60 * 60 * 1000;
    const dateLimite = new Date(Date.now() - troisMoisEnMs).toISOString();
    const { data } = await supabase.from('village_messages').select('*').gt('created_at', dateLimite).order('created_at', { ascending: false }).limit(100);
    if (data) setMessages(data);
  };

  const filtrerTexte = (texte) => {
    let textePropre = texte;
    LISTE_NOIRE.forEach(mot => {
      const regex = new RegExp(mot, 'gi');
      textePropre = textePropre.replace(regex, '****');
    });
    return textePropre;
  };

  const envoyerMessage = async (e) => {
    if (e) e.preventDefault();
    if (!nouveauMessage.trim()) return;
    const messageFiltre = filtrerTexte(nouveauMessage.trim());
    const { error } = await supabase.from('village_messages').insert([{ sender_name: currentUser.nom, text: messageFiltre }]);
    if (!error) { setNouveauMessage(''); chargerMessages(); }
  };

  const supprimerMessage = async (id) => {
    if (window.confirm("Supprimer ce message du mur ?")) {
      const { error } = await supabase.from('village_messages').delete().eq('id', id);
      if (!error) chargerMessages();
    }
  };

  const handleShare = async () => {
    const shareData = { title: 'AlloBoisset', text: 'Rejoins-nous sur AlloBoisset !', url: window.location.href };
    try { await navigator.share(shareData); } catch (err) { console.log("Erreur partage"); }
  };

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (!loginPrenom.trim() || !loginTel.trim() || loginPin.length !== 4) return alert("Prénom, Téléphone et PIN requis.");
    const { data: profile } = await supabase.from('profiles').select('*').eq('phone', loginTel).maybeSingle();
    if (profile && profile.pin !== loginPin) return alert(`Code PIN incorrect !`);
    else if (!profile) await supabase.from('profiles').insert([{ phone: loginTel, pin: loginPin, name: loginPrenom.trim() }]);
    
    const nomConvivial = loginNomFamille.trim() ? `${loginPrenom.trim()} ${loginNomFamille.trim().charAt(0).toUpperCase()}.` : loginPrenom.trim();
    const user = { nom: nomConvivial, telephone: loginTel, pin: loginPin };
    setCurrentUser(user);
    localStorage.setItem('user_boisset', JSON.stringify(user));
    localStorage.setItem('last_tel', loginTel);
    nav('trajets');
  };

  const publierTrajet = async () => {
    if (!arrivee || !dateTrajet || !heureTrajet) return alert("Champs vides !");
    const prefixe = isDemande ? "🙋 " : "🚗 ";
    const trajetData = {
      origin: depart, destination: arrivee, departure_time: `${dateTrajet} ${heureTrajet}`,
      driver_id: currentUser.telephone, driver_name: prefixe + currentUser.nom
    };
    const { error } = editId ? await supabase.from('rides').update(trajetData).eq('id', editId) : await supabase.from('rides').insert([trajetData]);
    if (!error) { setArrivee(''); setEditId(null); chargerTrajets(); nav('trajets'); }
  };

  const formatMaDate = (d) => {
    if(!d) return "";
    const parts = d.split(' ')[0].split('-');
    return `${parts[2]}/${parts[1]}/${parts[0].slice(2)}`;
  };

  const formatDateTimeMessage = (dateStr) => {
    if(!dateStr) return "";
    const dateObj = new Date(dateStr);
    const optionsDate = { day: 'numeric', month: 'long' };
    const datePart = dateObj.toLocaleDateString('fr-FR', optionsDate);
    return `le ${datePart}, à ${String(dateObj.getHours()).padStart(2, '0')}h${String(dateObj.getMinutes()).padStart(2, '0')}`;
  };

  const estAdmin = (tel) => LISTE_ADMINS.includes(tel);

  return (
    <div className="min-h-screen bg-fixed bg-cover font-sans flex flex-col select-none" 
         style={{ backgroundImage: "linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url('/alloboisset_fond.jpg')", backgroundPosition: 'center top' }}>
      
      <header className="bg-white/90 shadow-xl p-3 sticky top-0 z-20 border-b-8 border-[#4A86B4] flex flex-col items-center backdrop-blur-sm">
        <div className="flex items-center gap-5 w-full justify-between px-4">
          <img src="/blason.png" className="h-10 w-10 object-contain" alt="Logo" />
          <div className="flex flex-col text-center">
            <h1 className="text-xl font-black text-[#4A86B4] uppercase leading-none tracking-tighter">AlloBoisset</h1>
            <p className="text-[9px] font-black text-[#5B8C4E] uppercase tracking-[0.2em] mt-1 border-t-2 border-[#5B8C4E] pt-1">Covoiturage Villageois</p>
          </div>
          <button onClick={handleShare} className="text-[#4A86B4] p-2 rounded-full active:bg-blue-50 transition-colors"><Share2 size={24}/></button>
        </div>
      </header>

      <main className="flex-1 max-w-xl mx-auto w-full p-3 pb-32 flex flex-col">
        {view === 'login' && (
          <form onSubmit={handleLogin} className="bg-white/95 p-6 rounded-3xl shadow-xl mt-2 border-2 border-[#4A86B4] space-y-4 text-center">
            <h2 className="text-xl font-black uppercase italic">Identification</h2>
            <div className="bg-blue-50 p-3 rounded-2xl border-2 border-[#4A86B4]/30 flex items-start gap-2 text-left">
              <Info size={24} className="text-[#4A86B4] shrink-0 mt-1" />
              <p className="text-[11px] font-bold text-gray-700 leading-tight"><span className="text-[#4A86B4] uppercase block mb-1">Première connexion ?</span>Choisissez un code PIN de votre choix (4 chiffres).</p>
            </div>
            <input type="text" placeholder="PRÉNOM" value={loginPrenom} onChange={(e)=>setLoginPrenom(e.target.value)} required className="w-full p-4 text-lg rounded-xl border-4 border-gray-100 font-bold" />
            <input type="text" placeholder="NOM (FACULTATIF)" value={loginNomFamille} onChange={(e)=>setLoginNomFamille(e.target.value)} className="w-full p-4 text-lg rounded-xl border-4 border-gray-100 font-bold bg-gray-50/50" />
            <input type="tel" placeholder="TÉLÉPHONE" value={loginTel} onChange={(e)=>setLoginTel(e.target.value)} required className="w-full p-4 text-lg rounded-xl border-4 border-gray-100 font-bold" />
            <input type="password" inputMode="numeric" maxLength="4" placeholder="CODE PIN" value={loginPin} onChange={(e)=>setLoginPin(e.target.value.replace(/\D/g,''))} required className="w-full p-4 text-lg rounded-xl border-4 border-orange-200 font-bold text-center" />
            <button type="submit" className="w-full bg-[#4A86B4] text-white p-4 rounded-xl text-xl font-black uppercase shadow-lg">Entrer</button>
            <div className="pt-2 border-t border-gray-100">
              <a href={MAILTO_PIN} className="text-sm font-black text-[#4A86B4] underline decoration-2 underline-offset-4">PIN oublié ? Cliquez ici</a>
            </div>
          </form>
        )}

        {view === 'trajets' && (
          <div className="flex-1 flex flex-col justify-between">
            <div className="flex justify-center mt-1"><span className="bg-white/90 backdrop-blur-sm px-5 py-1.5 rounded-full font-black text-md text-[#4A86B4] border-2 border-[#4A86B4]">Bonjour {currentUser?.nom}</span></div>
            <div className="bg-white/30 backdrop-blur-md p-4 rounded-[2.5rem] shadow-2xl border-2 border-white/40 space-y-3 mb-4">
              <button onClick={() => {chargerTrajets(); nav('liste_offres');}} className="flex flex-col items-center justify-center p-3 rounded-[1.5rem] shadow-lg bg-[#4A86B4] w-full text-white font-black text-lg uppercase"><Car size={32} className="mb-1" />Je vous emmène</button>
              <button onClick={() => {chargerTrajets(); nav('liste_demandes');}} className="flex flex-col items-center justify-center p-3 rounded-[1.5rem] shadow-lg bg-[#8E44AD] w-full text-white font-black text-lg uppercase"><Users size={32} className="mb-1" />Emmenez-moi</button>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button onClick={() => {setIsDemande(false); setEditId(null); nav('nouveau');}} className="flex flex-col items-center justify-center p-3 rounded-[1.5rem] shadow-lg bg-[#5B8C4E] text-white font-black text-sm uppercase"><Plus size={30} className="mb-1" />Proposer</button>
                <button onClick={() => {setIsDemande(true); setEditId(null); nav('nouveau');}} className="flex flex-col items-center justify-center p-3 rounded-[1.5rem] shadow-lg bg-[#E67E22] text-white font-black text-sm uppercase"><HelpCircle size={30} className="mb-1" />Demander</button>
              </div>
            </div>
          </div>
        )}

        {view === 'aide' && (
          <div className="space-y-4">
            <button onClick={() => nav('parametres')} className="bg-white border-4 border-[#4A86B4] text-[#4A86B4] px-4 py-2 rounded-xl font-black flex items-center gap-2 mb-2 w-fit shadow-md"><ArrowLeft size={20} /> RETOUR</button>
            <div className="bg-white/95 p-6 rounded-3xl shadow-xl space-y-6">
              <h2 className="text-xl font-black uppercase text-[#4A86B4] border-b-4 border-[#4A86B4] pb-2 text-center italic">Guide AlloBoisset</h2>
              <section className="space-y-2 text-sm font-bold text-gray-700 leading-tight">
                <h3 className="font-black text-[#4A86B4] uppercase flex items-center gap-2 text-base"><Car size={20}/> Covoiturer</h3>
                <p>Proposez ou cherchez un trajet facilement.</p>
                <p className="mt-2 text-xs italic">AlloBoisset facilite la mise en relation entre villageois pour des trajets du quotidien.</p>
              </section>
            </div>
          </div>
        )}

        {view === 'cgu' && (
          <div className="space-y-4">
            <button onClick={() => nav('parametres')} className="bg-white border-4 border-[#4A86B4] text-[#4A86B4] px-4 py-2 rounded-xl font-black flex items-center gap-2 mb-2 w-fit shadow-md"><ArrowLeft size={20} /> RETOUR</button>
            <div className="bg-white/95 p-6 rounded-3xl shadow-xl space-y-4 text-gray-800">
              <h2 className="text-xl font-black uppercase text-[#4A86B4] border-b-4 border-[#4A86B4] pb-2 text-center italic">Conditions Générales</h2>
              <div className="text-[11px] font-bold leading-tight space-y-3 overflow-y-auto max-h-[60vh] pr-2">
                <p><strong>1. SERVICE :</strong> AlloBoisset est un outil technique de mise en relation citoyenne pour le village de Boisset. Le service est strictement bénévole.</p>
                <p><strong>2. GRATUITÉ :</strong> Le partage de frais est interdit. Aucun échange d'argent ne doit avoir lieu. C'est un service d'entraide pure.</p>
                <p><strong>3. ASSURANCES :</strong> Le conducteur certifie être assuré. Les passagers sont couverts par la Responsabilité Civile (RC) obligatoire du conducteur (Loi Badinter).</p>
                <p><strong>4. RESPONSABILITÉ :</strong> Le concepteur et la Mairie déclinent toute responsabilité en cas d'accident, litige ou dommage. L'utilisation se fait sous votre entière responsabilité.</p>
                <p><strong>5. DONNÉES :</strong> Vos infos servent uniquement à la mise en relation et ne sont jamais vendues.</p>
              </div>
            </div>
          </div>
        )}

        {view === 'messages' && (
          <div className="flex flex-col flex-1 h-[72vh]">
            <button onClick={() => nav('trajets')} className="bg-white border-4 border-[#4A86B4] text-[#4A86B4] px-4 py-2 rounded-xl font-black flex items-center gap-2 mb-2 w-fit shadow-md"><ArrowLeft size={20} /> RETOUR</button>
            <div className="flex-1 bg-white/90 backdrop-blur-sm rounded-3xl p-4 overflow-y-auto space-y-3 shadow-inner border-2 border-white/50">
              {messages.slice().reverse().map(m => (
                <div key={m.id} className={`relative max-w-[85%] p-3 rounded-2xl shadow-sm ${m.sender_name === currentUser?.nom ? 'bg-blue-50 ml-auto border-r-4 border-[#4A86B4]' : 'bg-gray-50 border-l-4 border-gray-300'}`}>
                  <div className="flex justify-between items-start mb-1 gap-4">
                    <div className="flex flex-col leading-tight">
                        <span className="text-sm font-black uppercase text-gray-600">{m.sender_name}</span>
                        <span className="text-[10px] lowercase italic text-gray-500 font-bold">a écrit {formatDateTimeMessage(m.created_at)}</span>
                    </div>
                    {estAdmin(currentUser?.telephone) && (
                      <button onClick={() => supprimerMessage(m.id)} className="text-red-400"><Trash2 size={14} /></button>
                    )}
                  </div>
                  <p className="text-sm font-bold leading-tight break-words whitespace-pre-wrap">{m.text}</p>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={envoyerMessage} className="mt-3 flex items-end gap-2 bg-white p-2 rounded-2xl shadow-lg border-2 border-[#4A86B4]">
              <textarea value={nouveauMessage} onChange={(e)=>setNouveauMessage(e.target.value)} placeholder="Écrire au village..." rows="2" className="flex-1 p-2 bg-transparent font-bold text-sm resize-none focus:outline-none" />
              <button type="submit" className="bg-[#4A86B4] text-white p-3 rounded-xl shadow-md"><Send size={20}/></button>
            </form>
          </div>
        )}

        {(view === 'liste_offres' || view === 'liste_demandes') && (
          <div className="space-y-4">
            <button onClick={() => nav('trajets')} className="bg-white border-[6px] border-[#4A86B4] text-[#4A86B4] px-5 py-2 rounded-xl font-black flex items-center gap-2 text-lg shadow-xl"><ArrowLeft size={28} /> RETOUR</button>
            <h2 className="text-xl font-black uppercase italic text-white drop-shadow-md">{view === 'liste_offres' ? '🚗 Voitures disponibles' : '🙋 Voisins à pied'}</h2>
            {trajets.filter(t => view === 'liste_offres' ? !t.driver_name.includes('🙋') : t.driver_name.includes('🙋')).map(t => (
              <div key={t.id} className={`bg-white/95 p-5 rounded-[2rem] shadow-md border-l-8 ${view === 'liste_offres' ? 'border-[#4A86B4]' : 'border-[#8E44AD]'}`}>
                <div className="flex justify-between items-start mb-2">
                  <p className="font-black text-xl uppercase leading-none">{t.origin} ➔ {t.destination}</p>
                  {(t.driver_id === currentUser?.telephone || estAdmin(currentUser?.telephone)) && (
                    <div className="flex gap-2">
                      <button onClick={() => {setEditId(t.id); setDepart(t.origin); setArrivee(t.destination); setDateTrajet(t.departure_time.split(' ')[0]); setHeureTrajet(t.departure_time.split(' ')[1]); setIsDemande(t.driver_name.includes('🙋')); nav('nouveau');}} className="text-blue-500 bg-blue-50 p-2 rounded-full"><Edit size={20}/></button>
                      <button onClick={async () => {if(window.confirm("Supprimer ?")){await supabase.from('rides').delete().eq('id', t.id); chargerTrajets();}}} className="text-red-500 bg-red-50 p-2 rounded-full"><Trash2 size={20}/></button>
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-center mb-4 text-gray-600 font-bold italic text-sm">
                  <span>{formatMaDate(t.departure_time)} à {t.departure_time.split(' ')[1]}</span>
                  <span className="text-[10px] bg-gray-100 px-2 py-1 rounded-full uppercase">{t.driver_name.replace('🙋 ', '').replace('🚗 ', '')}</span>
                </div>
                <a href={`tel:${t.driver_id}`} className="block w-full bg-[#4A86B4] text-white p-3 rounded-xl font-black text-lg text-center uppercase shadow-lg"><Phone size={20} className="inline mr-2"/> Contacter</a>
              </div>
            ))}
          </div>
        )}

        {view === 'nouveau' && (
          <div className="space-y-4">
            <button onClick={() => nav('trajets')} className="bg-white border-[6px] border-[#4A86B4] text-[#4A86B4] px-5 py-2 rounded-xl font-black flex items-center gap-2 text-lg shadow-xl"><ArrowLeft size={28} /> RETOUR</button>
            <div className={`bg-white/95 p-6 rounded-3xl shadow-lg space-y-4 border-4 ${isDemande ? 'border-[#E67E22]' : 'border-[#5B8C4E]'}`}>
              <h2 className="text-xl font-black text-center uppercase">{editId ? 'Modifier' : (isDemande ? 'Je cherche' : 'Je propose')}</h2>
              <input type="text" value={depart} onChange={(e)=>setDepart(e.target.value)} className="w-full p-4 border-2 rounded-xl font-bold text-center" />
              <input type="text" placeholder="DESTINATION ?" value={arrivee} onChange={(e)=>setArrivee(e.target.value)} className="w-full p-4 border-2 rounded-xl font-bold text-center uppercase" />
              <div className="grid grid-cols-2 gap-2">
                <input type="date" value={dateTrajet} onChange={(e)=>setDateTrajet(e.target.value)} className="w-full p-2 border-2 rounded-xl font-bold text-sm" />
                <input type="time" value={heureTrajet} onChange={(e)=>setHeureTrajet(e.target.value)} className="w-full p-2 border-2 rounded-xl font-bold text-sm" />
              </div>
              <button onClick={publierTrajet} className={`w-full text-white p-5 rounded-2xl font-black text-xl uppercase shadow-lg ${isDemande ? 'bg-[#E67E22]' : 'bg-[#5B8C4E]'}`}>Publier</button>
            </div>
          </div>
        )}

        {view === 'parametres' && (
          <div className="space-y-4 px-2">
            <div className="bg-white/95 p-4 rounded-3xl shadow-xl border-4 border-[#4A86B4] text-center space-y-4">
              <div className="flex items-center justify-center gap-4">
                <div className="w-12 h-12 bg-[#4A86B4] rounded-full flex items-center justify-center text-white"><User size={26} /></div>
                <div className="text-left font-black"><h2 className="text-lg uppercase leading-none">{currentUser?.nom}</h2><p className="text-md text-[#4A86B4]">{currentUser?.telephone}</p></div>
              </div>
              
              <button onClick={() => nav('aide')} className="w-full bg-[#4A86B4] text-white p-3 rounded-xl font-black uppercase flex items-center justify-center gap-2 shadow-md"><Info size={20}/> Mode d'emploi</button>
              
              {/* NOUVEAU MENU CGU */}
              <button onClick={() => nav('cgu')} className="w-full bg-gray-100 text-gray-700 p-3 rounded-xl font-black uppercase flex items-center justify-center gap-2 shadow-sm border-2 border-gray-200"><FileText size={20}/> Conditions Générales</button>
              
              {!confirmLogout ? (<button onClick={() => setConfirmLogout(true)} className="w-full border-2 border-red-500 text-red-500 p-2 rounded-xl font-black uppercase text-[12px]">Se déconnecter</button>) : (
                <div className="flex flex-col gap-2 p-2 bg-red-50 rounded-xl border-2 border-red-200">
                  <p className="font-black text-red-600 text-sm italic leading-tight">Voulez-vous vraiment vous déconnecter ?</p>
                  <div className="flex gap-2 justify-center">
                    <button onClick={() => {localStorage.removeItem('user_boisset'); nav('login'); setCurrentUser(null); setConfirmLogout(false);}} className="bg-red-600 text-white px-6 py-2 rounded-lg font-black text-sm">OUI</button>
                    <button onClick={() => setConfirmLogout(false)} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-black text-sm">NON</button>
                  </div>
                </div>
              )}
            </div>
            <div className="bg-white/90 p-3 rounded-2xl border-4 border-[#4A86B4] text-center shadow-md">
              <p className="text-md font-black text-[#4A86B4] uppercase leading-none tracking-tight">VERSION {VERSION}</p>
              <p className="text-[12px] font-black text-[#4A86B4] uppercase mt-1 italic tracking-tight">Gracieusement propulsé par Chris TAPOR</p>
            </div>
          </div>
        )}
      </main>

      {currentUser && (
        <nav className="fixed bottom-0 w-full bg-white/90 backdrop-blur-md border-t-8 border-[#4A86B4] flex justify-around p-2 shadow-2xl z-30">
          <button onClick={() => {nav('trajets'); setConfirmLogout(false);}} className={`flex flex-col items-center font-black text-[10px] uppercase ${['trajets', 'liste_offres', 'liste_demandes', 'nouveau'].includes(view) ? 'text-[#4A86B4]' : 'text-gray-400'}`}><Car size={32} /> Accueil</button>
          <button onClick={() => {nav('messages'); setConfirmLogout(false); chargerMessages();}} className={`flex flex-col items-center font-black text-[10px] uppercase ${view === 'messages' ? 'text-[#4A86B4]' : 'text-gray-400'}`}><MessageCircle size={32} /> Messages</button>
          <button onClick={() => {nav('parametres'); setConfirmLogout(false);}} className={`flex flex-col items-center font-black text-[10px] uppercase ${['parametres', 'aide', 'cgu'].includes(view) ? 'text-[#4A86B4]' : 'text-gray-400'}`}><ShieldCheck size={32} /> Paramètres</button>
        </nav>
      )}
    </div>
  );
}
