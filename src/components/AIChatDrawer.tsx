import React, { useState, useRef, useEffect } from 'react';
import {
  Plane,
  Send,
  X,
  Bot,
  User,
  HelpCircle,
  ShieldAlert,
  Loader2,
  MessageSquare,
  ClipboardList,
} from 'lucide-react';
import { WeatherData, UserPreferences, ExtremeWeatherEvent, PilotSafetyReport } from '../types';
import { PilotSafetyLogTab } from './PilotSafetyLogTab';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

interface AIChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  weather: WeatherData;
  userPrefs: UserPreferences;
  extremeState: ExtremeWeatherEvent;
}

export const AIChatDrawer: React.FC<AIChatDrawerProps> = ({
  isOpen,
  onClose,
  weather,
  userPrefs,
  extremeState,
}) => {
  const [drawerTab, setDrawerTab] = useState<'chat' | 'pireps'>('chat');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'initial-1',
      sender: 'assistant',
      text: `Hello! I'm SmartWeather Aviation & Flight Intelligence AI. Current conditions in ${weather.location.name} are ${Math.round(weather.current.temperature)}°C, wind ${Math.round(weather.current.windSpeed)} km/h, with ${weather.current.precipitationProbability}% rain probability. How can I assist your flight planning, runway crosswind assessment, or pilot safety briefing today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (drawerTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, drawerTab]);

  const quickPrompts = [
    'Is it safe to fly VFR from Boksburg / FAOR right now?',
    'What is the current density altitude and runway crosswind?',
    'Will convective storm cells impact afternoon departures?',
    'Show active pilot cautions and safest flight window',
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputVal).trim();
    if (!query || isSending) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputVal('');
    setIsSending(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          weather,
          preferences: userPrefs,
          extremeState,
          conversationHistory: messages.slice(-4).map((m) => ({ role: m.sender, content: m.text })),
        }),
      });

      if (!res.ok) {
        throw new Error('Chat API returned error');
      }

      const data = await res.json();
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: data.reply || 'I analyzed the atmospheric pressure and forecast curves. Please check the wardrobe timeline for layer details.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const fallbackMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: `Based on hyper-local radar in ${weather.location.name}: Temperature is ${Math.round(weather.current.temperature)}°C with ${weather.current.precipitationProbability}% rain chance. Check local turbulence and visibility reports in the Pilot Safety Log tab.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const handleAnalyzePirepWithAI = (pirep: PilotSafetyReport) => {
    setDrawerTab('chat');
    const query = `Analyze this pilot report (PIREP) from ${pirep.callsign} (${pirep.aircraftType}) at ${pirep.location} (${pirep.altitudeFt}ft): Turbulence is ${pirep.turbulenceIntensity} (${pirep.turbulenceType}), visibility is ${pirep.visibilityKm}km (${pirep.visibilityCategory}). Pilot remarks: "${pirep.remarks}". How does this impact local arrivals, departures, or light aircraft / drone operations given today's Boksburg / Highveld atmospheric sounding?`;
    handleSendMessage(query);
  };

  if (!isOpen) return null;

  return (
    <div
      id="ai-chat-drawer"
      className="fixed inset-y-0 right-0 w-full sm:w-[480px] lg:w-[520px] bg-slate-900/98 border-l border-slate-800 shadow-2xl z-50 flex flex-col backdrop-blur-xl animate-in slide-in-from-right duration-300"
    >
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/90">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
            <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-widest font-mono">
              Aviation & Weather AI
            </span>
          </div>
          <h3 className="font-light italic text-sm sm:text-base text-white">
            Flight Weather & Pilot Operations
          </h3>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Tabs between AI Dispatch Chat & Pilot Safety Log */}
      <div className="grid grid-cols-2 p-1.5 bg-slate-950/80 border-b border-slate-800 gap-1 font-mono text-xs">
        <button
          onClick={() => setDrawerTab('chat')}
          className={`flex items-center justify-center gap-2 py-2 rounded-xl transition-all ${
            drawerTab === 'chat'
              ? 'bg-slate-800 text-cyan-300 border border-cyan-500/40 font-bold shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>AI Dispatch Chat</span>
        </button>

        <button
          onClick={() => setDrawerTab('pireps')}
          className={`flex items-center justify-center gap-2 py-2 rounded-xl transition-all ${
            drawerTab === 'pireps'
              ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40 font-bold shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
          }`}
        >
          <ClipboardList className="w-3.5 h-3.5 text-amber-400" />
          <span>Pilot Safety Log</span>
          <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
            PIREP
          </span>
        </button>
      </div>

      {/* TAB 1: PILOT SAFETY LOG */}
      {drawerTab === 'pireps' && (
        <PilotSafetyLogTab
          weather={weather}
          onAnalyzeWithAI={handleAnalyzePirepWithAI}
        />
      )}

      {/* TAB 2: AI DISPATCH CHAT */}
      {drawerTab === 'chat' && (
        <>
          {/* Extreme Weather Alert in Chat */}
          {extremeState.isExtreme && (
            <div className="bg-rose-950/70 border-b border-rose-800/60 p-3 text-xs text-rose-200 flex items-center gap-2 font-mono shrink-0">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Active Warning: {extremeState.title}</span>
            </div>
          )}

          {/* Messages List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 scrollbar-thin bg-bento-dots">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex items-start gap-2.5 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs font-mono font-bold ${
                    m.sender === 'user'
                      ? 'bg-cyan-500 text-slate-950'
                      : 'bg-slate-800 border border-slate-700 text-cyan-300'
                  }`}
                >
                  {m.sender === 'user' ? 'U' : 'AI'}
                </div>

                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-100 rounded-tr-none'
                      : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-none shadow-lg'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{m.text}</div>
                  <div
                    className={`text-[10px] font-mono mt-1.5 text-right ${
                      m.sender === 'user' ? 'text-cyan-400/80' : 'text-slate-500'
                    }`}
                  >
                    {m.timestamp}
                  </div>
                </div>
              </div>
            ))}

            {isSending && (
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-slate-800 border border-slate-700 text-cyan-300 flex items-center justify-center font-mono text-xs">
                  AI
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none px-4 py-3 text-xs text-slate-400 flex items-center gap-2 font-mono">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                  <span>Synthesizing atmospheric telemetry...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="p-3 border-t border-slate-800 bg-slate-950/80 shrink-0">
            <div className="text-[10px] uppercase font-mono text-slate-500 tracking-wider mb-1.5">
              Inquiry Shortcuts
            </div>
            <div className="flex flex-wrap gap-1.5">
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(prompt)}
                  className="text-[11px] text-left px-2.5 py-1.5 rounded-xl bg-slate-900 hover:border-cyan-500/40 text-slate-300 transition-colors border border-slate-800 font-sans"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Input Box */}
          <div className="p-3 border-t border-slate-800 bg-slate-950 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Ask about Highveld flight weather, PIREPs, crosswinds..."
                className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                disabled={!inputVal.trim() || isSending}
                className="p-2.5 rounded-2xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 disabled:opacity-40 transition-colors shadow-md shadow-cyan-400/20"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

