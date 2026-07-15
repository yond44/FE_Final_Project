// src/components/ChatHistoryMenu.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Plus, MessageSquare, Trash2, Edit2, ChevronDown, X, Download } from 'lucide-react';
import * as chatApi from '../api/chats.js';
import { useToast } from '../context/ToastContext.jsx';

export default function ChatHistoryMenu({ currentChatId, onChatSelect, onNewChat }) {
  const [isOpen, setIsOpen] = useState(false);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const menuRef = useRef(null);
  const toast = useToast();

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) loadChats();
  }, [isOpen]);

  async function loadChats() {
    setLoading(true);
    try {
      const response = await chatApi.listChats();
      setChats(response.chats || []);
    } catch (error) {
      toast.error('Failed to load chats');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id, e) {
    e.stopPropagation();
    if (!confirm('Delete this chat?')) return;
    try {
      await chatApi.deleteChat(id);
      setChats(chats.filter(c => c.id !== id));
      if (currentChatId === id) onNewChat();
      toast.success('Chat deleted');
    } catch (error) {
      toast.error('Failed to delete chat');
    }
  }

  async function handleRename(id, newTitle) {
    if (!newTitle.trim()) return;
    try {
      const updated = await chatApi.renameChat(id, newTitle);
      setChats(chats.map(c => c.id === id ? updated : c));
      setEditingId(null);
      toast.success('Chat renamed');
    } catch (error) {
      toast.error('Failed to rename chat');
    }
  }

  function startEditing(chat, e) {
    e.stopPropagation();
    setEditingId(chat.id);
    setEditTitle(chat.title);
  }

  // Pulls every question/answer pair across all chats and downloads it as a
  // JSON file. Pages through export/qa in case a user has more than 1000
  // turns (the endpoint's per-request cap).
  async function handleExport(e) {
    e.stopPropagation();
    if (exporting) return;
    setExporting(true);
    try {
      let allTurns = [];
      let skip = 0;
      const limit = 1000;
      while (true) {
        const page = await chatApi.exportAllQA(skip, limit);
        allTurns = allTurns.concat(page.turns || []);
        if (allTurns.length >= (page.total ?? allTurns.length) || (page.turns || []).length < limit) {
          break;
        }
        skip += limit;
      }

      const blob = new Blob([JSON.stringify(allTurns, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast.success(`Exported ${allTurns.length} exchange${allTurns.length !== 1 ? 's' : ''}`);
    } catch (error) {
      toast.error('Failed to export chats');
    } finally {
      setExporting(false);
    }
  }

  const currentChat = chats.find(c => c.id === currentChatId);
  const displayTitle = currentChat?.title || 'Chat History';

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-line bg-white hover:bg-gray-50 transition text-sm"
      >
        <MessageSquare size={16} className="text-muted" />
        <span className="text-ink2 max-w-[120px] truncate">{displayTitle}</span>
        <ChevronDown size={14} className={`text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-xl border border-line shadow-lg z-50 max-h-[400px] flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-line">
            <h3 className="font-semibold text-sm text-ink">Your Chats</h3>
            <div className="flex items-center gap-1">
              <button
                onClick={handleExport}
                disabled={exporting}
                title="Export all Q&A as JSON"
                className="p-1 rounded hover:bg-gray-100 transition disabled:opacity-40"
              >
                <Download size={15} className={exporting ? 'text-muted animate-pulse' : 'text-muted'} />
              </button>
              <button onClick={() => setIsOpen(false)} className="p-1 rounded hover:bg-gray-100 transition">
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="p-3 border-b border-line">
            <button
              onClick={() => { onNewChat(); setIsOpen(false); }}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue text-white px-4 py-2 text-sm font-medium hover:bg-blue/90 transition"
            >
              <Plus size={16} /> New Chat
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {loading ? (
              <div className="text-center text-muted text-sm py-4">Loading...</div>
            ) : chats.length === 0 ? (
              <div className="text-center text-muted text-sm py-8">No chats yet. Start a new conversation!</div>
            ) : (
              <div className="space-y-1">
                {chats.map((chat) => (
                  <div
                    key={chat.id}
                    className={`group flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer transition hover:bg-gray-50 ${currentChatId === chat.id ? 'bg-blue/5 border-l-2 border-blue' : ''}`}
                    onClick={() => { onChatSelect(chat.id); setIsOpen(false); }}
                  >
                    <MessageSquare size={14} className="text-muted flex-shrink-0" />
                    {editingId === chat.id ? (
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={() => handleRename(chat.id, editTitle)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRename(chat.id, editTitle);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        className="flex-1 bg-transparent border border-blue rounded px-2 py-0.5 text-sm focus:outline-none"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span className="flex-1 truncate text-sm text-ink2">{chat.title || 'New Chat'}</span>
                    )}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
                      <button onClick={(e) => startEditing(chat, e)} className="p-1 rounded hover:bg-gray-200">
                        <Edit2 size={12} className="text-muted" />
                      </button>
                      <button onClick={(e) => handleDelete(chat.id, e)} className="p-1 rounded hover:bg-red-50">
                        <Trash2 size={12} className="text-red-400 hover:text-red-600" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="px-4 py-2 border-t border-line text-xs text-muted">
            {chats.length} chat{chats.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  );
}