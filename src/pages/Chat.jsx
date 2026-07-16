// src/pages/Chat.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, Sparkles, Mail, RotateCcw, Zap } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { THEMES } from '../constants.js';
import * as chatApi from '../api/chats.js';
import * as agentApi from '../api/agent.js';
import { useToast } from '../context/ToastContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import Card from '../components/ui/Card.jsx';
import { Textarea } from '../components/ui/Input.jsx';
import SendModal from '../components/SendModal.jsx';
import AnswerInsights from '../components/AnswerInsights.jsx';
import FilterBar from '../components/FilterBar.jsx';
import ChatHistoryMenu from '../components/ChatHistoryMenu.jsx';

// Helper function to clean malformed markdown
function cleanMarkdown(text) {
  if (!text) return '';
  
  let cleaned = text;
  
  // Fix **text* -> **text**
  cleaned = cleaned.replace(/\*\*([^*]+)\*/g, '**$1**');
  
  // Fix *text** -> **text**
  cleaned = cleaned.replace(/\*([^*]+)\*\*/g, '**$1**');
  
  // Remove orphaned asterisks (single * with no matching pair)
  cleaned = cleaned.replace(/\*(?![^*]*\*)/g, '');
  
  // Fix bold formatting that might be broken
  cleaned = cleaned.replace(/\*{2,}([^*]+)\*{2,}/g, '**$1**');
  
  // Fix list items with broken formatting
  cleaned = cleaned.replace(/^-\s*/gm, '- ');
  
  // Fix numbered lists
  cleaned = cleaned.replace(/^\d+\.\s*/gm, (match) => match);
  
  // Clean up extra spaces
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
}

export default function Chat() {
  const routeParams = useParams();
  console.log('routeParams:', routeParams);
  const routeChatId = routeParams.chatId ?? routeParams.id ?? null;

  const navigate = useNavigate();
  const toast = useToast();
  const { lang, t } = useLanguage();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [showThemes, setShowThemes] = useState(true);
  const [sendPayload, setSendPayload] = useState(null);
  const [filters, setFilters] = useState({});
  const [streamOn, setStreamOn] = useState(true);
  const [chatTitle, setChatTitle] = useState('New Chat');
  const [currentChatId, setCurrentChatId] = useState(null);
  const endRef = useRef(null);
  const taRef = useRef(null);


  const skipNextLoadRef = useRef(null);


  const activeChatIdRef = useRef(null);
  function setActiveChat(id) {
    activeChatIdRef.current = id;
    setCurrentChatId(id);
  }

  
  useEffect(() => {
    if (routeChatId && routeChatId !== 'undefined') {
      if (skipNextLoadRef.current === routeChatId) {
        skipNextLoadRef.current = null;
        setActiveChat(routeChatId);
        return;
      }
      setActiveChat(routeChatId);
      loadChat(routeChatId);
    } else {
      setMessages([{ id: 'welcome', role: 'assistant', text: t('chat.welcome'), content: t('chat.welcome') }]);
      setShowThemes(true);
      setChatTitle('New Chat');
      setActiveChat(null);
    }

  }, [routeChatId]);


  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === 'welcome') {
        return [{ id: 'welcome', role: 'assistant', text: t('chat.welcome'), content: t('chat.welcome') }];
      }
      return prev;
    });
  }, [lang]);

  async function loadChat(id) {
    try {
      const data = await chatApi.getChat(id);

      if (activeChatIdRef.current !== id) return;
      setChatTitle(data.title || 'Chat');
      let formattedMessages = data.messages || [];
      if (formattedMessages.length === 0) {
        formattedMessages = [{ id: 'welcome', role: 'assistant', text: t('chat.welcome'), content: t('chat.welcome') }];
      }
      setMessages(formattedMessages);
      setShowThemes(false);
    } catch (error) {

      toast.error('Failed to load chat');
    }
  }

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, busy]);

  function autosize() {
    const el = taRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 140) + 'px';
  }

  async function send(text) {
    const q = (text ?? input).trim();
    if (!q || busy) return;
    setInput('');
    setShowThemes(false);


    const threadIdAtSend = activeChatIdRef.current;

    const aiId = `assistant_${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: `user_${Date.now()}`, role: 'user', text: q, content: q },
      { id: aiId, role: 'assistant', text: '', streaming: true, question: q },
    ]);

    setBusy(true);
    requestAnimationFrame(autosize);

    const appendToken = (delta) => {
      setMessages((prev) => prev.map((msg) => msg.id === aiId ? { ...msg, text: msg.text + (delta || '') } : msg));
    };

    const patch = (updates) => {
      setMessages((prev) => prev.map((msg) => msg.id === aiId ? { ...msg, ...updates } : msg));
    };

    try {
      const result = await agentApi.ask(q, {
        language: lang,
        thread_id: threadIdAtSend,
        filters: filters,
        onToken: streamOn ? appendToken : null
      });

      if (activeChatIdRef.current !== threadIdAtSend) {

        return;
      }

      const newChatId = result.chat_id;
      if (newChatId && newChatId !== threadIdAtSend) {
        setActiveChat(newChatId);
        if (!threadIdAtSend) {
          skipNextLoadRef.current = newChatId;
          navigate(`/chat/${newChatId}`, { replace: true });
        }
      }

      if (newChatId) {
        const data = await chatApi.getChat(newChatId);
        setChatTitle(data.title || 'Chat');
        const allMessages = data.messages || [];
        const last = allMessages.length > 0 ? allMessages[allMessages.length - 1] : null;
        if (last && last.role === 'assistant') {
          patch({
            streaming: false,
            text: last.text || last.content || '',
            content: last.content || last.text || '',
            meta: {
              sources: last.sources || [],
              groundedness: last.groundedness || null,
              time: result.processing_time_seconds || 0,
            }
          });
        } else {
          patch({
            streaming: false,
            text: result.answer || '',
            content: result.answer || '',
          });
        }
      } else {
        patch({
          streaming: false,
          text: result.answer || '',
          content: result.answer || '',
          meta: {
            time: result.processing_time_seconds || 0,
            sources: result.sources || [],
            groundedness: result.groundedness || null,
            question: q,
          }
        });
      }
    } catch (e) {
      patch({ streaming: false, error: true, text: e.message || t('chat.error') });
      toast.error(t('chat.requestFailed'));
    } finally {
      setBusy(false);
    }
  }

  const suggest = (theme) => send(`Suggest some questions about ${theme.topic}.`);

  return (
    <div className="flex flex-col h-screen bg-white max-w-4xl mx-auto">
      <div className="flex items-center justify-between border-b border-line px-4 py-3 bg-white">
        <div className="flex items-center gap-3">
          <h1 className="font-serif text-xl font-semibold text-ink">💬 Chat</h1>
          <ChatHistoryMenu
            currentChatId={currentChatId}
            onChatSelect={(id) => { setActiveChat(id); navigate(`/chat/${id}`); }}
            onNewChat={() => {
              navigate('/chat');
              setMessages([{ id: 'welcome', role: 'assistant', text: t('chat.welcome'), content: t('chat.welcome') }]);
              setShowThemes(true);
              setChatTitle('New Chat');
              setActiveChat(null);
            }}
          />
        </div>
        <button
          onClick={() => {
            navigate('/chat');
            setMessages([{ id: 'welcome', role: 'assistant', text: t('chat.welcome'), content: t('chat.welcome') }]);
            setShowThemes(true);
            setChatTitle('New Chat');
            setActiveChat(null);
          }}
          className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-medium text-muted hover:border-[#cdbf9d]"
        >
          <RotateCcw size={13} /> New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 bg-gray-50">
        <div className="space-y-4">
          {messages.map((m, i) => {
            if (m.id === 'welcome' && messages.length > 1) return null;
            return (
              <Bubble
                key={m.id ?? i}
                m={m}
                t={t}
                onSend={() => setSendPayload({ question: m.question, answer: m.text })}
                onRec={(r) => send(r)}
              />
            );
          })}
          {showThemes && <ThemesCard onPick={suggest} t={t} />}
          <div ref={endRef} />
        </div>
      </div>

      <div className="border-t border-line p-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="mb-1 flex items-center justify-between">
            <FilterBar value={filters} onChange={setFilters} />
            <button
              type="button"
              onClick={() => setStreamOn((s) => !s)}
              className={`ml-2 inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${streamOn ? 'border-blue bg-bluesoft text-blue' : 'border-line bg-white text-muted hover:border-[#cdbf9d]'}`}
            >
              <Zap size={12} className={streamOn ? 'text-blue' : 'text-faint'} />
              Stream
            </button>
          </div>
          <div className="flex items-end gap-2 rounded-2xl border border-line bg-white p-2 shadow-card focus-within:border-blue focus-within:ring-2 focus-within:ring-bluesoft">
            <Textarea
              ref={taRef}
              value={input}
              onChange={(e) => { setInput(e.target.value); autosize(); }}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              rows={1}
              placeholder={t('chat.composer.ph')}
              className="max-h-36 border-0 bg-transparent px-2 py-2 shadow-none focus:ring-0"
            />
            <button
              onClick={() => send()}
              disabled={busy || !input.trim()}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ink text-white transition hover:bg-[#1a2741] disabled:opacity-40"
            >
              <Send size={17} />
            </button>
          </div>
        </div>
      </div>

      {sendPayload && <SendModal payload={sendPayload} onClose={() => setSendPayload(null)} />}
    </div>
  );
}

function Bubble({ m, t, onSend, onRec }) {
  if (m.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[82%] animate-fadeUp rounded-2xl rounded-tr-md bg-ink px-4 py-3 text-sm leading-relaxed text-white">
          {m.text || m.content}
        </div>
      </div>
    );
  }

  const waiting = m.streaming && !m.text;

  return (
    <div className="flex animate-fadeUp justify-start">
      <div className="max-w-[88%]">
        <div className={`rounded-2xl rounded-tl-md px-4 py-3.5 text-sm leading-relaxed shadow-card ${m.error ? 'border border-[#f0c9c2] bg-[#fcefec] text-[#8a3325]' : 'border-l-[3px] border-blue bg-white text-ink2'}`}>
          {waiting ? (
            <div className="flex items-center gap-1 py-0.5 text-muted">
              <span className="h-1.5 w-1.5 animate-pulse2 rounded-full bg-blue" />
              <span className="text-xs">{t('chat.analyzing')}</span>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                children={cleanMarkdown(m.text || m.content || '')}
                components={{
                  // Custom renderers to fix common issues
                  strong: ({ node, ...props }) => <strong className="font-semibold" {...props} />,
                  em: ({ node, ...props }) => <em className="italic" {...props} />,
                  p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                  ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-2" {...props} />,
                  ol: ({ node, ...props }) => <ol className="list-decimal pl-4 mb-2" {...props} />,
                  li: ({ node, ...props }) => <li className="mb-0.5" {...props} />,
                  h1: ({ node, ...props }) => <h1 className="text-lg font-bold mb-2" {...props} />,
                  h2: ({ node, ...props }) => <h2 className="text-base font-bold mb-2" {...props} />,
                  h3: ({ node, ...props }) => <h3 className="text-sm font-bold mb-1.5" {...props} />,
                  h4: ({ node, ...props }) => <h4 className="text-sm font-semibold mb-1.5" {...props} />,
                  h5: ({ node, ...props }) => <h5 className="text-sm font-semibold mb-1.5" {...props} />,
                  h6: ({ node, ...props }) => <h6 className="text-sm font-semibold mb-1.5" {...props} />,
                  blockquote: ({ node, ...props }) => (
                    <blockquote className="border-l-4 border-blue pl-3 italic my-2" {...props} />
                  ),
                  code: ({ node, inline, ...props }) => 
                    inline ? (
                      <code className="bg-gray-100 px-1 py-0.5 rounded text-sm" {...props} />
                    ) : (
                      <code className="block bg-gray-100 p-3 rounded text-sm overflow-x-auto" {...props} />
                    ),
                  pre: ({ node, ...props }) => <pre className="bg-gray-100 p-3 rounded overflow-x-auto" {...props} />,
                  a: ({ node, ...props }) => <a className="text-blue hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
                  hr: ({ node, ...props }) => <hr className="my-3 border-line" {...props} />,
                }}
              />
              {m.streaming && <span className="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse2 bg-blue align-middle" />}
            </div>
          )}
        </div>

        {m.meta && !m.streaming && m.meta.sources && m.meta.sources.length > 0 && (
          <div className="mt-3 flex items-center gap-4 border-t border-line2 pt-2.5 font-mono text-[11px] text-muted">
            <span>⏱ {Number(m.meta.time || 0).toFixed(2)}s</span>
            <span>📚 {(m.meta.sources || []).length} sources</span>
            <button onClick={onSend} className="ml-auto flex items-center gap-1.5 font-sans font-semibold text-blue hover:underline">
              <Mail size={13} /> Email This
            </button>
          </div>
        )}

        {m.recs?.length > 0 && !m.streaming && (
          <div className="mt-2 flex flex-wrap gap-2">
            {m.recs.map((r, i) => (
              <button key={i} onClick={() => onRec(r)} className="rounded-full border border-line bg-white px-3 py-1.5 text-xs text-muted transition hover:border-blue hover:text-blue">
                {r}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ThemesCard({ onPick, t }) {
  return (
    <Card rule className="animate-fadeUp p-5 pl-6">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-gold">
        <Sparkles size={14} /> Explore Topics
      </div>
      <p className="mt-1.5 text-sm text-muted">Ask about markets, macro, crypto, commodities...</p>
      <div className="mt-3.5 flex flex-wrap gap-2">
        {THEMES.map((theme) => {
          const Icon = theme.icon;
          return (
            <button
              key={theme.labelKey}
              onClick={() => onPick(theme)}
              className="group flex items-center gap-2 rounded-full border border-line bg-white px-3.5 py-2 text-[13px] font-medium text-ink2 transition hover:-translate-y-0.5 hover:border-blue hover:text-blue hover:shadow-card"
            >
              <Icon size={14} className="text-gold group-hover:text-blue" /> {t(theme.labelKey)}
            </button>
          );
        })}
      </div>
    </Card>
  );
}