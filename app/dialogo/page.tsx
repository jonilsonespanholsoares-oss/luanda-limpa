'use client'
import { useState, useRef, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import dynamic from 'next/dynamic'
const JFSFlutuante = dynamic(() => import('../../components/JFSFlutuante'), { ssr: false })

interface Mensagem {
  id: string
  conteudo: string
  tipo: string
  sala: string
  eliminada: boolean
  criado_em: string
  utilizador_id: string
  perfis?: { nome: string; papel: string; municipio: string }
}

export default function Dialogo() {
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [input, setInput] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [utilizador, setUtilizador] = useState<any>(null)
  const [sala, setSala] = useState<'publica' | 'privada'>('publica')
  const [gravando, setGravando] = useState(false)
  const [jfsAtivo, setJfsAtivo] = useState(false)
  const fimRef = useRef<HTMLDivElement>(null)
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  useEffect(() => {
    carregarUtilizador()
  }, [])

  useEffect(() => {
    if (utilizador) carregarMensagens()
  }, [utilizador, sala])

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens])

  async function carregarUtilizador() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    const { data: perfil } = await supabase
      .from('perfis').select('*').eq('id', user.id).single()
    setUtilizador(perfil)
  }

  async function carregarMensagens() {
    const { data } = await supabase
      .from('mensagens')
      .select('*, perfis(nome, papel, municipio)')
      .eq('sala', sala)
      .eq('eliminada', false)
      .order('criado_em', { ascending: true })
      .limit(100)
    setMensagens(data || [])

    supabase
      .channel(`sala-${sala}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'mensagens',
        filter: `sala=eq.${sala}`
      }, () => carregarMensagens())
      .subscribe()
  }

  async function enviar(conteudo?: string) {
    const texto = conteudo || input
    if (!texto.trim() || carregando) return
    setInput('')
    setCarregando(true)

    await supabase.from('mensagens').insert({
      utilizador_id: utilizador.id,
      conteudo: texto,
      tipo: 'humano',
      sala,
      eliminada: false
    })

    if (jfsAtivo) {
      const res = await fetch('/api/jfs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensagens: [{ role: 'user', content: texto }]
        })
      })
      const dados = await res.json()
      await supabase.from('mensagens').insert({
        utilizador_id: utilizador.id,
        conteudo: dados.resposta,
        tipo: 'jfs',
        sala,
        eliminada: false
      })
    }

    await carregarMensagens()
    setCarregando(false)
  }

  async function eliminarMensagem(id: string) {
    await supabase.from('mensagens').update({ eliminada: true }).eq('id', id)
    await carregarMensagens()
  }

  async function iniciarGravacao() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = e => chunksRef.current.push(e.data)
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const reader = new FileReader()
        reader.onload = async () => {
          await supabase.from('mensagens').insert({
            utilizador_id: utilizador.id,
            conteudo: '🎤 Mensagem de voz',
            tipo: 'voz',
            sala,
            eliminada: false
          })
          await carregarMensagens()
        }
        reader.readAsDataURL(blob)
        stream.getTracks().forEach(t => t.stop())
      }
      recorder.start()
      mediaRef.current = recorder
      setGravando(true)
    } catch {
      alert('Não foi possível aceder ao microfone.')
    }
  }

  function pararGravacao() {
    mediaRef.current?.stop()
    setGravando(false)
  }

  function teclaEnter(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar() }
  }

  function corPapel(papel: string) {
    const cores: Record<string, string> = {
      admin: 'bg-red-700 text-red-100',
      gestor: 'bg-blue-700 text-blue-100',
      operador: 'bg-yellow-700 text-yellow-100',
      camionista: 'bg-green-700 text-green-100'
    }
    return cores[papel] || 'bg-gray-700 text-gray-100'
  }

  function iconePapel(papel: string) {
    const icones: Record<string, string> = {
      admin: '👑', gestor: '🏛️', operador: '🔧', camionista: '🚛'
    }
    return icones[papel] || '👤'
  }

  const podeSala = utilizador?.papel === 'admin' || utilizador?.papel === 'gestor'

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
          <a href="/rotas" className="text-green-200 hover:text-white transition">🚛 Rotas</a>
        </div>
      </nav>

      {/* CABEÇALHO */}
      <div className="px-8 py-3 bg-green-900 border-t border-green-800">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-xl">💬</div>
            <div>
              <h1 className="font-bold text-green-300">Sala de Diálogo</h1>
              <p className="text-green-500 text-xs">{mensagens.length} mensagens · {sala === 'publica' ? '🌐 Pública' : '🔒 Privada'}</p>
            </div>
          </div>

          {/* CONTROLOS */}
          <div className="flex items-center gap-3">
            {/* TOGGLE JFS */}
            <button
              onClick={() => setJfsAtivo(!jfsAtivo)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition ${
                jfsAtivo ? 'bg-green-500 text-white' : 'bg-green-800 text-green-400'
              }`}
            >
              🤖 JFS {jfsAtivo ? 'ON' : 'OFF'}
            </button>

            {/* SELECTOR DE SALA */}
            {podeSala && (
              <div className="flex bg-green-800 rounded-full p-1 gap-1">
                <button
                  onClick={() => setSala('publica')}
                  className={`px-3 py-1 rounded-full text-sm transition ${
                    sala === 'publica' ? 'bg-green-500 text-white' : 'text-green-400'
                  }`}
                >
                  🌐 Pública
                </button>
                <button
                  onClick={() => setSala('privada')}
                  className={`px-3 py-1 rounded-full text-sm transition ${
                    sala === 'privada' ? 'bg-green-500 text-white' : 'text-green-400'
                  }`}
                >
                  🔒 Privada
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MENSAGENS */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-5xl mx-auto flex flex-col gap-3">

          {mensagens.length === 0 && (
            <div className="text-center py-12">
              <span className="text-5xl">💬</span>
              <p className="text-green-400 mt-3">Nenhuma mensagem ainda. Começa a conversa!</p>
            </div>
          )}

          {mensagens.map(m => (
            <div key={m.id} className={`flex gap-3 ${m.utilizador_id === utilizador?.id ? 'flex-row-reverse' : ''}`}>

              {/* AVATAR */}
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${
                m.tipo === 'jfs' ? 'bg-green-500' : 'bg-green-700'
              }`}>
                {m.tipo === 'jfs' ? '🤖' : iconePapel(m.perfis?.papel || '')}
              </div>

              {/* CONTEÚDO */}
              <div className={`max-w-xl ${m.utilizador_id === utilizador?.id ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-green-300 text-xs font-bold">
                    {m.tipo === 'jfs' ? '🤖 JFS' : m.perfis?.nome || 'Utilizador'}
                  </span>
                  {m.perfis?.papel && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${corPapel(m.perfis.papel)}`}>
                      {m.perfis.papel}
                    </span>
                  )}
                  {m.perfis?.municipio && (
                    <span className="text-green-600 text-xs">📍 {m.perfis.municipio}</span>
                  )}
                  <span className="text-green-700 text-xs">
                    {new Date(m.criado_em).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className={`relative group rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  m.tipo === 'jfs'
                    ? 'bg-green-900 border border-green-700 text-green-100 rounded-bl-sm'
                    : m.utilizador_id === utilizador?.id
                    ? 'bg-green-600 text-white rounded-br-sm'
                    : 'bg-green-900 border border-green-800 text-green-100 rounded-bl-sm'
                }`}>
                  <p className="whitespace-pre-wrap">{m.conteudo}</p>

                  {/* BOTÃO ELIMINAR */}
                  {(m.utilizador_id === utilizador?.id || utilizador?.papel === 'admin' || utilizador?.papel === 'gestor') && m.tipo !== 'jfs' && (
                    <button
                      onClick={() => eliminarMensagem(m.id)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 hover:bg-red-500 rounded-full text-xs hidden group-hover:flex items-center justify-center transition"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {carregando && (
            <div className="flex gap-3">
              <div className="w-9 h-9 bg-green-500 rounded-full flex items-center justify-center text-sm">🤖</div>
              <div className="bg-green-900 border border-green-700 rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}/>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}/>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}/>
                </div>
              </div>
            </div>
          )}
          <div ref={fimRef} />
        </div>
      </div>

      {/* INPUT */}
      <div className="px-4 py-4 bg-green-900 border-t border-green-800">
        <div className="max-w-5xl mx-auto">

          {sala === 'privada' && (
            <div className="flex items-center gap-2 mb-2 px-2">
              <span className="text-yellow-400 text-xs">🔒 Sala privada — apenas Admin e Gestores</span>
            </div>
          )}

          <div className="flex gap-3 items-end">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={teclaEnter}
              placeholder={jfsAtivo ? "Escreve para a equipa e o JFS vai responder..." : "Escreve uma mensagem para a equipa..."}
              rows={1}
              className="flex-1 bg-green-800 text-white px-4 py-3 rounded-xl border border-green-700 focus:outline-none focus:border-green-400 placeholder-green-600 resize-none"
            />

            {/* BOTÃO DE VOZ */}
            <button
              onMouseDown={iniciarGravacao}
              onMouseUp={pararGravacao}
              onTouchStart={iniciarGravacao}
              onTouchEnd={pararGravacao}
              className={`px-4 py-3 rounded-xl transition flex items-center gap-2 ${
                gravando
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-green-800 text-green-300 hover:bg-green-700'
              }`}
            >
              🎤
            </button>

            {/* BOTÃO ENVIAR */}
            <button
              onClick={() => enviar()}
              disabled={carregando || !input.trim()}
              className="bg-green-500 hover:bg-green-400 text-white px-6 py-3 rounded-xl font-semibold transition disabled:opacity-50"
            >
              Enviar
            </button>
          </div>
          <p className="text-center text-green-700 text-xs mt-2">
            Enter para enviar · Mantém 🎤 premido para gravar voz · Passa o rato sobre uma mensagem para eliminar
          </p>
        </div>
      </div>

      <JFSFlutuante pagina="dialogo" nomeUtilizador={utilizador?.nome} papel={utilizador?.papel} />
    </main>
  )
}