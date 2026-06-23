'use client'
import { useState, useEffect, useRef } from 'react'

interface Mensagem {
  role: 'user' | 'assistant'
  content: string
}

interface Props {
  pagina?: string
  nomeUtilizador?: string
  papel?: string
}

export default function JFSFlutuante({ pagina = 'geral', nomeUtilizador, papel }: Props) {
  const [aberto, setAberto] = useState(false)
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [input, setInput] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [boasVindas, setBoasVindas] = useState(false)
  const [pulsando, setPulsando] = useState(true)
  const fimRef = useRef<HTMLDivElement>(null)

  const contextos: Record<string, string> = {
    dashboard: 'O utilizador está no Dashboard. Podes ajudar com estatísticas, navegação e visão geral do sistema.',
    mapa: 'O utilizador está no Mapa. Podes ajudar com pontos de recolha, municípios e interpretação do mapa.',
    rotas: 'O utilizador está na página de Rotas. Podes ajudar com optimização de rotas e gestão de recolha.',
    dialogo: 'O utilizador está na Sala de Diálogo. Podes ajudar com comunicação entre equipas.',
    geral: 'O utilizador está a navegar no sistema Luanda Limpa.'
  }

  const mensagensBoasVindas: Record<string, string> = {
    dashboard: `Olá${nomeUtilizador ? ` ${nomeUtilizador}` : ''}! 👋 Bem-vindo ao teu Dashboard. Aqui podes ver as estatísticas do sistema, aceder ao mapa, gerir rotas e comunicar com a tua equipa. Como posso ajudar?`,
    mapa: `Olá! 🗺️ Estás no Mapa de Luanda. Clica num município no painel lateral para ver os pontos de recolha e a rota optimizada pelas ruas. Tens alguma dúvida?`,
    rotas: `Olá! 🚛 Estás na página de Rotas. Selecciona um município e eu vou calcular a rota de recolha mais eficiente. Queres começar?`,
    dialogo: `Olá! 💬 Estás na Sala de Diálogo. Aqui podes comunicar com toda a equipa e eu estou sempre disponível para ajudar. O que precisas?`,
    geral: `Olá${nomeUtilizador ? ` ${nomeUtilizador}` : ''}! 🤖 Sou o JFS, o assistente inteligente do Luanda Limpa. Estou aqui para te ajudar com qualquer questão sobre gestão de resíduos em Luanda. Como posso ajudar?`
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      const msgBoasVindas = mensagensBoasVindas[pagina] || mensagensBoasVindas.geral
      setMensagens([{ role: 'assistant', content: msgBoasVindas }])
      setBoasVindas(true)
      setTimeout(() => setPulsando(false), 5000)
    }, 1500)
    return () => clearTimeout(timer)
  }, [pagina])

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens])

  async function enviar() {
    if (!input.trim() || carregando) return
    const novaMensagem: Mensagem = { role: 'user', content: input }
    const novaLista = [...mensagens, novaMensagem]
    setMensagens(novaLista)
    setInput('')
    setCarregando(true)

    try {
      const res = await fetch('/api/jfs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensagens: novaLista.map(m => ({
            role: m.role,
            content: m.content
          })),
          contexto: contextos[pagina] || contextos.geral,
          papel: papel || 'utilizador'
        })
      })
      const dados = await res.json()
      setMensagens(prev => [...prev, { role: 'assistant', content: dados.resposta }])
    } catch {
      setMensagens(prev => [...prev, { role: 'assistant', content: 'Erro de ligação. Tenta novamente.' }])
    }
    setCarregando(false)
  }

  function teclaEnter(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar() }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">

      {/* JANELA DO CHAT */}
      {aberto && (
        <div className="bg-green-950 border border-green-800 rounded-2xl shadow-2xl flex flex-col"
          style={{ width: '340px', height: '480px' }}>

          {/* HEADER */}
          <div className="flex items-center gap-3 px-4 py-3 bg-green-900 rounded-t-2xl border-b border-green-800">
            <div className="relative">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-xl">🤖</div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-green-900"></div>
            </div>
            <div>
              <p className="font-bold text-green-300 text-sm">JFS — Assistente IA</p>
              <p className="text-green-500 text-xs">Online · Luanda Limpa</p>
            </div>
            <button onClick={() => setAberto(false)}
              className="ml-auto text-green-500 hover:text-white transition text-lg">✕</button>
          </div>

          {/* MENSAGENS */}
          <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2">
            {mensagens.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'assistant' && (
                  <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-xs mr-2 mt-1 flex-shrink-0">🤖</div>
                )}
                <div className={`max-w-xs rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-green-600 text-white rounded-br-sm'
                    : 'bg-green-900 text-green-100 border border-green-800 rounded-bl-sm'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {carregando && (
              <div className="flex justify-start">
                <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-xs mr-2 mt-1">🤖</div>
                <div className="bg-green-900 border border-green-800 rounded-2xl rounded-bl-sm px-3 py-2">
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

          {/* INPUT */}
          <div className="px-3 py-3 border-t border-green-800 flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={teclaEnter}
              placeholder="Pergunta ao JFS..."
              className="flex-1 bg-green-800 text-white text-xs px-3 py-2 rounded-xl border border-green-700 focus:outline-none focus:border-green-400 placeholder-green-600"
            />
            <button
              onClick={enviar}
              disabled={carregando || !input.trim()}
              className="bg-green-500 hover:bg-green-400 text-white px-3 py-2 rounded-xl transition disabled:opacity-50 text-sm"
            >
              ➤
            </button>
          </div>
        </div>
      )}

      {/* BOTÃO FLUTUANTE */}
      <button
        onClick={() => setAberto(!aberto)}
        className={`relative w-16 h-16 bg-green-500 hover:bg-green-400 rounded-full shadow-2xl flex items-center justify-center text-3xl transition-all ${
          pulsando ? 'animate-pulse' : ''
        }`}
      >
        {aberto ? '✕' : '🤖'}
        {!aberto && boasVindas && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-bold">
            1
          </div>
        )}
      </button>

    </div>
  )
}