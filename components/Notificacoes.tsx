'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Notificacoes({ utilizadorId }: { utilizadorId: string }) {
  const [notificacoes, setNotificacoes] = useState<any[]>([])
  const [aberto, setAberto] = useState(false)
  const naoLidas = notificacoes.filter(n => !n.lida).length

  useEffect(() => {
    if (!utilizadorId) return
    carregarNotificacoes()
    const canal = supabase
      .channel('notificacoes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notificacoes',
        filter: `utilizador_id=eq.${utilizadorId}`
      }, () => carregarNotificacoes())
      .subscribe()
    return () => { supabase.removeChannel(canal) }
  }, [utilizadorId])

  async function carregarNotificacoes() {
    const { data } = await supabase
      .from('notificacoes')
      .select('*')
      .eq('utilizador_id', utilizadorId)
      .order('criado_em', { ascending: false })
      .limit(20)
    setNotificacoes(data || [])
  }

  async function marcarLida(id: string) {
    await supabase.from('notificacoes').update({ lida: true }).eq('id', id)
    await carregarNotificacoes()
  }

  async function marcarTodasLidas() {
    await supabase.from('notificacoes')
      .update({ lida: true }).eq('utilizador_id', utilizadorId)
    await carregarNotificacoes()
  }

  function icone(tipo: string) {
    if (tipo === 'alerta') return '🔴'
    if (tipo === 'rota') return '🚛'
    if (tipo === 'recolha') return '✅'
    if (tipo === 'previsao') return '📈'
    return '🔔'
  }

  return (
    <div className="relative">
      <button onClick={() => setAberto(!aberto)}
        className="relative w-10 h-10 bg-green-800 hover:bg-green-700 rounded-full flex items-center justify-center transition">
        🔔
        {naoLidas > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-bold">
            {naoLidas > 9 ? '9+' : naoLidas}
          </div>
        )}
      </button>

      {aberto && (
        <div className="absolute right-0 top-12 bg-green-900 border border-green-700 rounded-2xl shadow-2xl z-50 w-80">
          <div className="flex items-center justify-between px-4 py-3 border-b border-green-800">
            <h3 className="font-bold text-green-300 text-sm">🔔 Notificações</h3>
            <div className="flex gap-2">
              {naoLidas > 0 && (
                <button onClick={marcarTodasLidas}
                  className="text-green-400 hover:text-white text-xs transition">
                  Marcar todas lidas
                </button>
              )}
              <button onClick={() => setAberto(false)} className="text-green-500 hover:text-white">✕</button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notificacoes.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <span className="text-3xl">🔔</span>
                <p className="text-green-500 text-sm mt-2">Sem notificações</p>
              </div>
            ) : (
              notificacoes.map(n => (
                <div key={n.id}
                  onClick={() => marcarLida(n.id)}
                  className={`px-4 py-3 border-b border-green-800 cursor-pointer hover:bg-green-800 transition ${!n.lida ? 'bg-green-800/50' : ''}`}>
                  <div className="flex items-start gap-2">
                    <span>{icone(n.tipo)}</span>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${!n.lida ? 'text-white' : 'text-green-400'}`}>{n.titulo}</p>
                      <p className="text-green-500 text-xs mt-0.5">{n.mensagem}</p>
                      <p className="text-green-700 text-xs mt-1">
                        {new Date(n.criado_em).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {!n.lida && <div className="w-2 h-2 bg-green-400 rounded-full mt-1 flex-shrink-0"/>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}