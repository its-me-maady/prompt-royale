/**
 * agent-notes: { ctx: "Interactive Chat Box UI for Student Prompt Lab with Markdown rendering, RAG context, and Gemini restyling", deps: ["apps/web/src/app/api/rag/route.ts", "apps/web/src/app/api/kb/courses/route.ts", "apps/web/src/components/MarkdownRenderer.tsx", "apps/web/src/utils/supabase/client.ts"], state: "canonical", last: "sato@2026-09-01" }
 */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { MarkdownRenderer } from '../../components/MarkdownRenderer';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  sources?: string[];
  courseId?: string;
  timestamp: string;
}

export default function PromptLabPage() {
  const supabaseClient = createClient();
  const [prompt, setPrompt] = useState('');
  const [courses, setCourses] = useState<string[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [customCourse, setCustomCourse] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRestyling, setIsRestyling] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initAuthAndCourses = async () => {
      try {
        const { data } = await supabaseClient.auth.getSession();
        if (!data?.session) {
          await supabaseClient.auth.signInAnonymously();
        }
      } catch (e) {
        // Ignore auth error in test environment
      }

      try {
        const res = await fetch('/api/kb/courses');
        if (res.ok) {
          const data = await res.json();
          if (data.courses && Array.isArray(data.courses)) {
            setCourses(data.courses);
          }
        }
      } catch (e) {
        setCourses(['CS101', 'CS102', 'MATH201', 'PHYS101']);
      }
    };
    initAuthAndCourses();
  }, []);

  const scrollToBottom = () => {
    if (typeof messagesEndRef.current?.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const effectiveCourseId = selectedCourse === 'custom' ? customCourse.trim() : selectedCourse;

  const handleEnhancePrompt = async () => {
    if (!prompt.trim() || isRestyling) return;
    setIsRestyling(true);

    try {
      const res = await fetch('/api/prompt-lab/restyle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: prompt.trim() })
      });
      const data = await res.json();
      if (res.ok && data.restyledSummary) {
        setPrompt(data.restyledSummary);
      }
    } catch (e) {
      // Ignore restyle failure
    } finally {
      setIsRestyling(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    const userText = prompt.trim();
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: userText,
      courseId: effectiveCourseId,
      timestamp: now
    };

    setMessages((prev) => [...prev, userMsg]);
    setPrompt('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userText,
          courseId: effectiveCourseId
        })
      });

      let data;
      try {
        data = await res.json();
      } catch (jsonErr) {
        throw new Error('Server returned non-JSON response');
      }

      if (!res.ok) {
        throw new Error(data?.error || `HTTP ${res.status} error`);
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: data.answer || 'No response generated.',
        sources: data.sources || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: `Error: ${err.message || String(err)}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 flex flex-col items-center justify-between p-4 md:p-6 overflow-hidden">
      <div className="w-full max-w-5xl h-full flex flex-col bg-slate-900/60 backdrop-blur-2xl border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Header Bar */}
        <div className="p-4 md:p-5 bg-slate-900/80 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
              ⚡
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Prompt Lab
              </h1>
              <p className="text-xs text-slate-400">Interactive Knowledge Base Study Assistant</p>
            </div>
          </div>

          {/* Subject / Course Selector Dropdown */}
          <div className="flex items-center gap-2">
            <label htmlFor="course-select" className="text-xs font-semibold text-slate-400 hidden sm:inline">
              Subject / Course:
            </label>
            <select
              id="course-select"
              aria-label="Subject / Course"
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="bg-slate-950/90 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Subjects / Knowledge Base</option>
              {courses.map((course) => (
                <option key={course} value={course}>
                  {course}
                </option>
              ))}
              <option value="custom">Custom Subject ID...</option>
            </select>

            {selectedCourse === 'custom' && (
              <input
                type="text"
                placeholder="Subject ID..."
                value={customCourse}
                onChange={(e) => setCustomCourse(e.target.value)}
                className="bg-slate-950/90 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-28"
              />
            )}
          </div>
        </div>

        {/* Scrollable Chat Feed */}
        <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-indigo-950/60 border border-indigo-700/40 flex items-center justify-center text-3xl">
                💬
              </div>
              <h2 className="text-xl font-bold text-slate-200">Start a Conversation with Prompt Lab</h2>
              <p className="text-sm text-slate-400 max-w-md">
                Ask questions about your lecture slides, course materials, or algorithms. Prompt Lab will search your subject Knowledge Base and generate study answers.
              </p>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                {[
                  "Explain binary search trees with code",
                  "What are the main concepts in Lecture 1?",
                  "Summarize key formulas and definitions"
                ].map((suggestion, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPrompt(suggestion)}
                    className="text-xs px-3 py-2 bg-slate-950/80 hover:bg-slate-900 border border-slate-800 text-slate-300 rounded-xl transition-colors"
                  >
                    💡 {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} space-y-1`}
              >
                <div
                  className={`max-w-[85%] md:max-w-[75%] p-4 rounded-2xl ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-none shadow-lg shadow-indigo-600/10'
                      : 'bg-slate-950/90 border border-slate-800 text-slate-100 rounded-bl-none shadow-md'
                  }`}
                >
                  {msg.sender === 'user' ? (
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.text}</p>
                  ) : (
                    <MarkdownRenderer content={msg.text} />
                  )}

                  {/* Sources Accordion for AI Responses */}
                  {msg.sender === 'assistant' && msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-800/80">
                      <p className="text-xs font-semibold text-indigo-400 mb-1 flex items-center gap-1">
                        📚 Retrieved Context ({msg.sources.length}):
                      </p>
                      <ul className="list-disc pl-4 space-y-1 text-xs text-slate-400">
                        {msg.sources.map((src, i) => (
                          <li key={i} className="break-all">{src}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <span className="text-[10px] text-slate-500 px-2">{msg.timestamp}</span>
              </div>
            ))
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex items-start gap-2">
              <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 rounded-bl-none">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
                  Synthesizing answer from Knowledge Base...
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Input Area */}
        <div className="p-3 md:p-4 bg-slate-900/90 border-t border-slate-800/80">
          <form onSubmit={handleSubmit} className="flex items-end gap-2 bg-slate-950/90 border border-slate-800 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-indigo-500">
            <textarea
              id="prompt-input"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter your prompt here..."
              className="flex-1 bg-transparent border-0 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-0 resize-none max-h-32 min-h-[44px] p-2"
              disabled={isLoading}
              rows={1}
            />

            <button
              type="button"
              onClick={handleEnhancePrompt}
              disabled={isRestyling || !prompt.trim()}
              className="px-3 py-2.5 bg-indigo-950/80 border border-indigo-700/50 hover:bg-indigo-900/80 text-indigo-300 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {isRestyling ? 'Enhancing...' : '✨ Enhance Prompt'}
            </button>

            <button
              type="submit"
              name="Run Prompt"
              disabled={isLoading || !prompt.trim()}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-semibold text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-600/20 whitespace-nowrap"
            >
              {isLoading ? 'Running...' : 'Run Prompt'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
