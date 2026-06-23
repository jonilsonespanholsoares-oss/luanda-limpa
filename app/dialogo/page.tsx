'use client'
import { useState, useRef, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

interface Mensagem {
  role: 'user' | 'assistant'
  content: string
  nome?: string
}

export default function Dialogo() {
  const [mensagens, setMensagens] = useState<Mensagem[]>([
    {
      role: 'assistant',
      content: 'Olá! Sou o JFS, o vosso assistente de inteligência artificial do Luanda Limpa. Estou aqui para ajudar com rotas de recolha, gestão de contentores e coordenação entre equipas. Como posso ajudar?',
      nome: 'JFS'
    }
  ])
  const [input, setInput] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [utilizador, setUtilizador] = useState<any>(null)
  const fimRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function carregar() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: perfil } = await supabase
          .from('perfis').select('*').eq('id', user.id).single()
        setUtilizador(perfil)
      }
    }
    carregar()
  }, [])

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens])

  async function enviar() {
    if (!input.trim() || carregando) return

    const novaMensagem: Mensagem = {
      role: 'user',
      content: input,
      nome: utilizador?.nome || 'Utilizador'
    }

    const novaLista = [...mensagens, novaMensagem]
    setMensagens(novaLista)
    setInput('')
    setCarregando(true)

    try {
      const res = await fetch('/api/jfs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensagens: novaLista
            .filter(m => m.role === 'user' || m.role === 'assistant')
            .map(m => ({ role: m.role, content: m.content }))
        })
      })

      const dados = await res.json()
      setMensagens(prev => [...prev, {
        role: 'assistant',
        content: dados.resposta,
        nome: 'JFS'
      }])

      if (utilizador) {
        await supabase.from('mensagens').insert({
          utilizador_id: utilizador.id,
          conteudo: input,
          tipo: 'humano'
        })
      }
    } catch {
      setMensagens(prev => [...prev, {
        role: 'assistant',
        content: 'Erro de ligação ao JFS. Tenta novamente.',
        nome: 'JFS'
      }])
    }

    setCarregando(false)
  }

  function teclaEnter(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      enviar()
    }
  }

  return (
    <main className="min-h-screen bg-green-950 text-white flex flex-col">

      {/* NAVBAR */}
      <nav className="flex items-center justify-between px-8 py-4 bg-green-900 shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-2xl">♻️</span>
          <span className="text-xl font-bold text-green-300">Luanda Limpa</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="/dashboard" className="text-green-200 hover:text-white transition">Dashboard</a>
          <a href="/mapa" className="text-green-200 hover:text-white transition">🗺️ Mapa</a>
        </div>
      </nav>

      {/* CABEÇALHO */}
      <div className="px-8 py-4 bg-green-900 border-t border-green-800">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="bg-green-500 rounded-full w-10 h-10 flex items-center justify-center text-xl">🤖</div>
          <div>
            <h1 className="font-bold text-green-300">JFS — Assistente Inteligente</h1>
            <p className="text-green-400 text-xs">Luanda Limpa · Online</p>
          </div>
        </div>
      </div>

      {/* MENSAGENS */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto flex flex-col gap-4">
          {mensagens.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-2xl rounded-2xl px-4 py-3 ${
                m.role === 'user'
                  ? 'bg-green-600 text-white rounded-br-sm'
                  : 'bg-green-900 text-green-100 rounded-bl-sm border border-green-800'
              }`}>
                <p className="text-xs font-bold mb-1 opacity-70">
                  {m.role === 'assistant' ? '🤖 JFS' : `👤 ${m.nome || 'Tu'}`}
                </p>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
              </div>
            </div>
          ))}

          {carregando && (
            <div className="flex justify-start">
              <div className="bg-green-900 border border-green-800 rounded-2xl rounded-bl-sm px-4 py-3">
                <p className="text-xs font-bold mb-1 opacity-70">🤖 JFS</p>
                <p className="text-sm text-green-400">A pensar...</p>
              </div>
            </div>
          )}
          <div ref={fimRef} />
        </div>
      </div>

      {/* INPUT */}
      <div className="px-4 py-4 bg-green-900 border-t border-green-800">
        <div className="max-w-4xl mx-auto flex gap-3">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={teclaEnter}
            placeholder="Escreve uma mensagem para o JFS..."
            rows={1}
            className="flex-1 bg-green-800 text-white px-4 py-3 rounded-xl border border-green-700 focus:outline-none focus:border-green-400 placeholder-green-600 resize-none"
          />
          <button
            onClick={enviar}
            disabled={carregando || !input.trim()}
            className="bg-green-500 hover:bg-green-400 text-white px-6 py-3 rounded-xl font-semibold transition disabled:opacity-50"
          >
            Enviar
          </button>
        </div>
        <p className="text-center text-green-700 text-xs mt-2">Enter para enviar · Shift+Enter para nova linha</p>
      </div>

    </main>
  )
}