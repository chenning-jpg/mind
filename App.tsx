import React, { useState, useEffect, useRef } from 'react';
import { AppView, Message, Tree, Wisdom, CommunityFruit } from './types';
import Navigation from './components/Navigation';
import TreeVisual from './components/TreeVisual';
import { createChatSession, extractWisdom } from './services/geminiService';
import { ArrowUp, Sparkles, Send, X, RefreshCw, User, Lock, ExternalLink, Leaf, Timer, Sprout, Gift, HeartHandshake, Archive, Plus, Download } from 'lucide-react';
import { Chat } from '@google/genai';
import html2canvas from 'html2canvas';

const INITIAL_TREES: Tree[] = [
  { 
    id: '1', 
    wisdomId: 'w1', 
    stage: 'fruiting', 
    plantedAt: Date.now() - 10000000, 
    stageStartedAt: Date.now() - 10000000, 
    lastWatered: Date.now(), 
    type: 'oak',
    hasProduced: true
  }
];

const INITIAL_WISDOM: Wisdom[] = [
  { id: 'w1', title: "言语的重量", situation: "被经理不公平地责骂。", insight: "他人的愤怒往往反映了他们内部的状态，而非你的价值。", date: new Date().toLocaleDateString() }
];

const MOCK_COMMUNITY_FRUITS: CommunityFruit[] = [
  { id: 'cf1', author: 'ZenWalker', insight: "愤怒就像手里握着一块烧红的煤炭想扔给别人，最终烫伤的是你自己。", cost: 1 },
  { id: 'cf2', author: 'StoicGirl', insight: "我们在想象中受的苦，往往比在现实中多。", cost: 1 },
  { id: 'cf3', author: 'ForestSpirit', insight: "大自然从不匆忙，却能完成一切。", cost: 1 },
];

export default function App() {
  const [view, setView] = useState<AppView>(AppView.FOREST);
  const [trees, setTrees] = useState<Tree[]>(INITIAL_TREES);
  const [wisdomArchive, setWisdomArchive] = useState<Wisdom[]>(INITIAL_WISDOM);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showWisdomModal, setShowWisdomModal] = useState(false);
  const [newWisdom, setNewWisdom] = useState<Wisdom | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wisdomCardRef = useRef<HTMLDivElement>(null);
  const [communityInventory, setCommunityInventory] = useState<CommunityFruit[]>(MOCK_COMMUNITY_FRUITS);
  const [myCollection, setMyCollection] = useState<CommunityFruit[]>([]);
  const [isCelebrating, setIsCelebrating] = useState(false);
  
  const [inventory, setInventory] = useState(0); 
  const [stats, setStats] = useState({
    collected: 0 
  });

  useEffect(() => {
    if (!chatSessionRef.current) {
      chatSessionRef.current = createChatSession();
      setMessages([{
        id: 'init',
        role: 'model',
        text: "Hi，我在这里。无论发生什么，我都在听。",
        timestamp: Date.now()
      }]);
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTrees(prevTrees => {
        const updatedTrees = prevTrees.map(tree => {
          const now = Date.now();
          const lastStageTime = tree.stageStartedAt || tree.plantedAt;
          const elapsed = now - lastStageTime;
          const STAGE_DURATION = 60000; 

          let nextStage = tree.stage;
          let shouldUpdate = false;
          let justFruited = false;

          if (tree.stage === 'sapling' && elapsed > STAGE_DURATION) {
            nextStage = 'growing';
            shouldUpdate = true;
          } else if (tree.stage === 'growing' && elapsed > STAGE_DURATION) {
            nextStage = 'mature';
            shouldUpdate = true;
          } else if (tree.stage === 'mature' && elapsed > STAGE_DURATION) {
            nextStage = 'fruiting';
            shouldUpdate = true;
            justFruited = true;
          }
          
          if (tree.stage === 'fruiting' && !tree.hasProduced) {
             return { ...tree, hasProduced: true };
          }

          if (shouldUpdate) {
            if (justFruited) {
              return { ...tree, stage: nextStage, stageStartedAt: now, hasProduced: true };
            }
            return { ...tree, stage: nextStage, stageStartedAt: now };
          }
          return tree;
        });
        return updatedTrees;
      });
    }, 2000); 

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || !chatSessionRef.current) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const result = await chatSessionRef.current.sendMessage({ message: userMsg.text });
      const modelMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: result.text || "我在听。",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, modelMsg]);
    } catch (error) {
      console.error("Chat error", error);
    } finally {
      setIsTyping(false);
    }
  };

  const endSessionAndTransform = async () => {
    setIsExtracting(true);
    try {
      const extracted = await extractWisdom(messages);
      const newWisdomEntry: Wisdom = {
        ...extracted,
        id: Date.now().toString(),
        date: new Date().toLocaleDateString()
      };
      
      const newTree: Tree = {
        id: Date.now().toString(),
        wisdomId: newWisdomEntry.id,
        stage: 'sapling',
        plantedAt: Date.now(),
        stageStartedAt: Date.now(),
        lastWatered: Date.now(),
        type: 'oak',
        hasProduced: false
      };

      setWisdomArchive(prev => [newWisdomEntry, ...prev]);
      setTrees(prev => [...prev, newTree]);
      setNewWisdom(newWisdomEntry);
      
      chatSessionRef.current = createChatSession();
      setMessages([{
        id: Date.now().toString(),
        role: 'model',
        text: "新的开始。当你准备好时，我依然在这里。",
        timestamp: Date.now()
      }]);

      setShowWisdomModal(true);
    } catch (e) {
      console.error("Extraction failed", e);
    } finally {
      setIsExtracting(false);
    }
  };

  const harvestFruit = (treeId: string) => {
    setTrees(prev => prev.map(t => {
      if (t.id === treeId && t.stage === 'fruiting') {
        setInventory(inv => inv + 1);
        return { ...t, stage: 'mature', stageStartedAt: Date.now(), hasProduced: false }; 
      }
      return t;
    }));
  };

  const tradeFruit = (fruit: CommunityFruit) => {
    if (inventory >= fruit.cost) {
      setInventory(prev => prev - fruit.cost);
      setMyCollection(prev => [...prev, fruit]);
      setCommunityInventory(prev => prev.filter(f => f.id !== fruit.id));
      setStats(prev => ({ ...prev, collected: prev.collected + 1 }));

      const friendshipTree: Tree = {
        id: `ft-${Date.now()}`,
        wisdomId: fruit.id, 
        stage: 'sapling',
        plantedAt: Date.now(),
        stageStartedAt: Date.now(),
        lastWatered: Date.now(),
        type: 'cherry',
        hasProduced: false
      };
      
      setTrees(prev => [...prev, friendshipTree]);
      
      // Trigger Celebration Animation
      setIsCelebrating(true);
      setTimeout(() => {
        setIsCelebrating(false);
        setView(AppView.FOREST);
      }, 2500);
    } else {
      alert("你的库存不足。请回到森林，等待树木结果并点击收集。");
    }
  };

  const downloadCard = async () => {
    if (!wisdomCardRef.current) return;
    try {
      const canvas = await html2canvas(wisdomCardRef.current, {
        scale: 3,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true
      });
      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `wisdom-card-${Date.now()}.png`;
      link.click();
    } catch (e) {
      console.error("Download failed", e);
    }
  };

  // --- RE-DESIGNED VIEWS (Bento Style) ---

  const ForestView = () => (
    <div className="min-h-screen bg-[#F2F4F6] pb-32 pt-12 px-6">
      <header className="mb-8 fade-in">
        <h1 className="text-4xl font-extrabold text-[#111827] mb-2 leading-tight tracking-tight">
          你好，<br/>
          你的心灵之森。
        </h1>
        <p className="text-stone-500 font-medium">愿你拥有平静的一天。</p>
      </header>
      
      {/* Bento Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8 fade-in">
        <div className="bg-[#E3F2E1] p-6 rounded-[2rem] flex flex-col justify-between h-40 bento-card shadow-sm border border-white/50">
          <div className="bg-white/40 w-10 h-10 rounded-full flex items-center justify-center text-emerald-700">
            <Archive size={20} />
          </div>
          <div>
            <div className="text-3xl font-bold text-emerald-900 mb-1">{inventory}</div>
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-700/60">心力果实</div>
          </div>
        </div>
        <div className="bg-[#FFF9C4] p-6 rounded-[2rem] flex flex-col justify-between h-40 bento-card shadow-sm border border-white/50">
          <div className="bg-white/40 w-10 h-10 rounded-full flex items-center justify-center text-amber-600">
            <Gift size={20} />
          </div>
          <div>
            <div className="text-3xl font-bold text-amber-900 mb-1">{stats.collected}</div>
            <div className="text-xs font-bold uppercase tracking-wider text-amber-700/60">共鸣交换</div>
          </div>
        </div>
      </div>

      {/* Forest Grid */}
      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-stone-100 min-h-[400px] relative overflow-hidden fade-in delay-100">
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none"></div>
        <div className="grid grid-cols-3 gap-y-8 gap-x-2 place-items-end justify-items-center relative z-10">
          {trees.map((tree) => {
            const isFriend = tree.type === 'cherry';
            const fruit = isFriend ? myCollection.find(f => f.id === tree.wisdomId) : null;
            const wisdom = !isFriend ? wisdomArchive.find(w => w.id === tree.wisdomId) : null;
            const label = isFriend ? (fruit?.author || '友谊') : (wisdom?.title || '成长');

            return (
              <div key={tree.id} className="flex flex-col items-center group relative">
                {tree.type === 'cherry' && (
                  <div className="absolute -top-4 bg-pink-100 text-pink-500 p-1 rounded-full opacity-80 animate-bounce">
                     <HeartHandshake size={12} />
                  </div>
                )}
                <TreeVisual 
                  tree={tree} 
                  onClick={() => {
                    if (tree.stage === 'fruiting') {
                      harvestFruit(tree.id);
                    }
                  }} 
                />
                <span className="mt-2 text-[9px] font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity text-center text-stone-400 bg-white/90 px-2 py-1 rounded-full shadow-sm border border-stone-100">
                  {label}
                </span>
              </div>
            );
          })}
          {[...Array(2)].map((_, i) => (
             <div key={`empty-${i}`} className="w-12 h-2 bg-stone-100 rounded-full mt-24" />
          ))}
        </div>
      </div>

       <div className="fixed bottom-28 right-6 fade-in delay-200 z-40">
          <button 
            onClick={() => setView(AppView.CHAT)}
            className="w-16 h-16 bg-[#111827] text-white rounded-[1.5rem] shadow-xl shadow-black/10 hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
          >
            <Plus size={32} />
          </button>
       </div>
    </div>
  );

  const ChatView = () => (
    <div className="h-screen flex flex-col bg-[#F2F4F6]">
      <div className="px-6 py-6 border-b border-stone-200 bg-white/50 backdrop-blur-md sticky top-0 z-10">
         <h2 className="text-2xl font-extrabold text-[#111827]">心境转化</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 pb-40 space-y-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] p-5 rounded-[1.5rem] text-[15px] font-medium leading-relaxed shadow-sm ${
                msg.role === 'user'
                  ? 'bg-[#111827] text-white rounded-tr-sm'
                  : 'bg-white text-[#111827] rounded-tl-sm border border-stone-100'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isTyping && (
           <div className="flex justify-start">
             <div className="bg-white p-4 rounded-[1.5rem] rounded-tl-sm border border-stone-100 flex gap-1.5 shadow-sm">
               <span className="w-2 h-2 bg-stone-300 rounded-full animate-bounce"></span>
               <span className="w-2 h-2 bg-stone-300 rounded-full animate-bounce delay-75"></span>
               <span className="w-2 h-2 bg-stone-300 rounded-full animate-bounce delay-150"></span>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="fixed bottom-[100px] left-0 right-0 p-4 z-40">
        {messages.length > 2 && !isExtracting && (
           <div className="flex justify-center mb-4 fade-in">
             <button 
                onClick={endSessionAndTransform}
                className="bg-[#D1FAE5] text-emerald-800 px-6 py-3 rounded-full hover:bg-[#A7F3D0] transition-colors flex items-center gap-2 font-bold shadow-sm"
             >
               <RefreshCw size={16} />
               结束并转化
             </button>
           </div>
        )}
        
        <div className="max-w-md mx-auto relative bg-white rounded-full shadow-lg shadow-stone-200/50 p-2 flex items-center border border-stone-100">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="此刻，你在想什么？"
            className="flex-1 pl-4 bg-transparent focus:outline-none text-[#111827] font-medium placeholder-stone-400"
            disabled={isExtracting}
            autoFocus
          />
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || isExtracting}
            className="w-10 h-10 bg-[#111827] text-white rounded-full flex items-center justify-center hover:bg-black disabled:opacity-50 transition-all shrink-0"
          >
            {isExtracting ? <RefreshCw className="animate-spin" size={18} /> : <ArrowUp size={20} />}
          </button>
        </div>
      </div>
    </div>
  );

  const ArchiveView = () => (
    <div className="min-h-screen bg-[#F2F4F6] p-6 pb-32 pt-12">
      <h2 className="text-4xl font-extrabold text-[#111827] mb-8 leading-tight">智慧<br/>档案库</h2>
      <div className="grid gap-4">
        {wisdomArchive.map((w, idx) => {
          // Alternating pastel colors for cards
          const colors = ['bg-[#E1F5FE]', 'bg-[#F3E5F5]', 'bg-[#FFF9C4]', 'bg-[#E3F2E1]'];
          const bg = colors[idx % colors.length];
          
          return (
            <div key={w.id} className={`${bg} p-6 rounded-[2rem] bento-card shadow-sm border border-white/50 relative overflow-hidden`}>
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-xl text-[#111827]">{w.title}</h3>
                  <span className="text-[10px] font-bold bg-white/50 px-2 py-1 rounded-full text-[#111827]/70">{w.date}</span>
                </div>
                <div className="bg-white/40 p-3 rounded-xl mb-4 backdrop-blur-sm">
                   <p className="text-xs font-medium text-[#111827]/70 line-clamp-2">情境: {w.situation}</p>
                </div>
                <p className="text-sm font-medium text-[#111827] leading-relaxed">
                  "{w.insight}"
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const MarketView = () => (
    <div className="min-h-screen bg-[#F2F4F6] p-6 pb-32 pt-12">
      <header className="mb-8">
         <div className="flex justify-between items-end mb-4">
           <h2 className="text-4xl font-extrabold text-[#111827] leading-tight">共生<br/>花园</h2>
           <div className="bg-[#111827] text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg shadow-black/10">
             <Archive size={14} /> {inventory} 心力
           </div>
         </div>
         <div className="bg-[#F3E5F5] p-4 rounded-[1.5rem] text-sm font-medium text-purple-900 border border-purple-100 flex gap-3 items-center">
            <div className="bg-white p-2 rounded-full text-purple-600 shrink-0">
               <Leaf size={16} />
            </div>
            <p>用多余的心力，交换他人的智慧。</p>
         </div>
      </header>

      {/* My Collection */}
      {myCollection.length > 0 && (
        <div className="mb-8 fade-in">
          <h3 className="text-xs font-extrabold text-stone-400 uppercase tracking-widest mb-4 pl-1">我的收藏</h3>
          <div className="grid gap-3">
             {myCollection.map(fruit => (
               <div key={fruit.id} className="bg-white border border-stone-100 p-5 rounded-[1.5rem] flex gap-4 shadow-sm items-center">
                  <div className="bg-pink-100 text-pink-500 w-12 h-12 rounded-full flex items-center justify-center shrink-0">
                    <HeartHandshake size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#111827]">"{fruit.insight}"</p>
                    <p className="text-xs font-bold text-stone-400 mt-1 uppercase tracking-wide">{fruit.author}</p>
                  </div>
               </div>
             ))}
          </div>
        </div>
      )}

      {/* Market */}
      <h3 className="text-xs font-extrabold text-stone-400 uppercase tracking-widest mb-4 pl-1">可交换</h3>
      <div className="grid gap-4">
        {communityInventory.map((fruit) => {
          const canAfford = inventory >= fruit.cost;
          return (
            <div key={fruit.id} className="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm flex flex-col bento-card">
              <div className="flex items-center gap-3 mb-4">
                 <div className="w-10 h-10 rounded-full bg-[#F2F4F6] flex items-center justify-center text-[#111827]">
                    <User size={18} />
                 </div>
                 <div>
                    <div className="text-base font-bold text-[#111827]">{fruit.author}</div>
                    <div className="text-xs font-bold text-stone-400 uppercase tracking-wide">需要: {fruit.cost} 心力</div>
                 </div>
              </div>
              <div className="flex-1 bg-[#F9FAFB] rounded-2xl p-6 flex items-center justify-center text-stone-300 relative overflow-hidden mb-6 border border-stone-100 border-dashed">
                 <Lock size={32} />
              </div>
              <button 
                onClick={() => tradeFruit(fruit)}
                className={`w-full py-4 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2
                  ${canAfford 
                    ? 'bg-[#111827] text-white shadow-lg hover:scale-[1.02] active:scale-95' 
                    : 'bg-[#F2F4F6] text-stone-400 cursor-pointer hover:bg-stone-200'
                  }`}
              >
                 {canAfford ? '解锁智慧' : '去收集心力'} <ExternalLink size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      <div className="min-h-screen bg-[#F2F4F6] text-[#111827]">
        {/* Calling views as functions to prevent re-mounting input on state changes */}
        {view === AppView.FOREST && ForestView()}
        {view === AppView.CHAT && ChatView()}
        {view === AppView.ARCHIVE && ArchiveView()}
        {view === AppView.MARKET && MarketView()}
        
        <Navigation currentView={view} setView={setView} />
      </div>

      {/* Celebration Overlay */}
      {isCelebrating && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
          {/* Flash Background */}
          <div className="absolute inset-0 bg-white/90 animate-[fadeOut_0.5s_ease-out_1.5s_forwards]" />
          
          {/* Animated Rays */}
           <div className="absolute inset-0 flex items-center justify-center opacity-20">
               <div className="w-[150vmax] h-[150vmax] bg-[conic-gradient(from_0deg,transparent_0deg,#F472B6_45deg,transparent_90deg,#34D399_135deg,transparent_180deg,#FBBF24_225deg,transparent_270deg,#60A5FA_315deg,transparent_360deg)] animate-[spin_3s_linear_infinite]" />
           </div>

          {/* Central Pop */}
          <div className="relative z-10 flex flex-col items-center animate-[bounceIn_0.6s_cubic-bezier(0.175,0.885,0.32,1.275)_forwards]">
             <div className="bg-white p-6 rounded-full shadow-2xl mb-6 scale-150">
               <HeartHandshake className="text-pink-500 w-16 h-16" />
             </div>
             <h2 className="text-3xl font-extrabold text-[#111827] bg-white/90 px-6 py-2 rounded-full shadow-lg">
                交换成功
             </h2>
             <p className="text-stone-500 font-bold mt-2 bg-white/50 px-3 py-1 rounded-full">友谊之树已种下</p>
          </div>

          {/* Particle Explosion */}
          <div className="absolute inset-0 flex items-center justify-center">
            {[...Array(16)].map((_, i) => (
               <div 
                 key={i}
                 className="absolute top-1/2 left-1/2 w-0 h-0"
                 style={{ transform: `rotate(${i * 22.5}deg)` }}
               >
                 <div 
                    className="w-3 h-3 rounded-full -ml-1.5 -mt-1.5"
                    style={{
                       backgroundColor: ['#F472B6', '#34D399', '#FBBF24', '#60A5FA'][i % 4],
                       animation: `flyOut 1s cubic-bezier(0,0.9,0.57,1) forwards`
                    }}
                 />
               </div>
            ))}
          </div>

          <style>{`
            @keyframes bounceIn {
              0% { transform: scale(0.3); opacity: 0; }
              50% { transform: scale(1.05); opacity: 1; }
              70% { transform: scale(0.9); }
              100% { transform: scale(1); opacity: 1; }
            }
            @keyframes flyOut {
              0% { transform: translateX(0); opacity: 1; }
              100% { transform: translateX(180px) scale(0.5); opacity: 0; }
            }
            @keyframes fadeOut {
               to { opacity: 0; }
             }
          `}</style>
        </div>
      )}

      {/* New Wisdom Modal */}
      {showWisdomModal && newWisdom && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/20 backdrop-blur-sm fade-in">
          <div ref={wisdomCardRef} className="bg-white rounded-[2.5rem] max-w-sm w-full p-8 shadow-2xl relative overflow-hidden text-center">
            
            <button 
              onClick={downloadCard}
              data-html2canvas-ignore
              className="absolute top-6 right-6 text-stone-300 hover:text-[#111827] transition-colors p-2"
              title="下载高清卡片"
            >
              <Download size={20} />
            </button>

            <div className="w-20 h-20 bg-[#D1FAE5] text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Leaf size={40} />
            </div>

            <h3 className="text-2xl font-extrabold text-[#111827] mb-2">{newWisdom.title}</h3>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-6">转化完成</p>
            
            <p className="text-stone-600 font-medium mb-8 leading-relaxed">
              "{newWisdom.insight}"
            </p>

            <div className="text-sm font-medium text-stone-500 mb-8 bg-[#F9FAFB] p-5 rounded-2xl border border-stone-100">
               一颗新的种子已种下，它将随着你的耐心一同生长。
            </div>

            <button 
              onClick={() => {
                setShowWisdomModal(false);
                setView(AppView.FOREST);
              }}
              data-html2canvas-ignore
              className="w-full py-4 bg-[#111827] text-white rounded-2xl font-bold shadow-xl shadow-black/10 hover:scale-[1.02] transition-transform"
            >
              前往森林
            </button>
          </div>
        </div>
      )}
    </>
  );
}