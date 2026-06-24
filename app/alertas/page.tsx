'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { enviarNotificacao } from '../../lib/email'
import dynamic from 'next/dynamic'
const JFSFlutuante = dynamic(() => import('../../components/JFSFlutuante'), { ssr: false })

export default function Alertas() {
  const [utilizador, setUtilizador] = useState<any>(null)
  const [pontosCheios, setPontosCheios] = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)
  const [enviando, setEnviando] = useState<string | null>(null)
  const [enviados, setEnviados] = useState<string[]>([])

  useEffect(() => {
    carregarDados()
  }, [])

  async function carregarDados() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    const { data: perfil } = await supabase
      .from('perfis').select('*').eq('id', user.id).single()
    setUtilizador(perfil)

    const { data } = await supabase
      .from('pontos_recolha')
      .select('*')
      .eq('estado', 'cheio')
      .order('municipio')
    setPontosCheios(data || [])
    setCarregando(false)
  }

  async function enviarAlerta(ponto: any) {
    if (!utilizador?.email) return
    setEnviando(ponto.id)
    try {
      await enviarNotificacao({
        nome: utilizador.nome,
        emailDestino: utilizador.email,
        assunto: `🔴 Alerta — Contentor cheio em ${ponto.municipio}`,
        mensagem: `O contentor "${ponto.nome}" em ${ponto.municipio} está cheio e precisa de recolha urgente.\n\nLocalização: Lat ${ponto.latitude}, Long ${ponto.longitude}\nEstado: ${ponto.estado}\nCapacidade: ${ponto.capacidade}`,
        municipio: ponto.municipio
      })
      setEnviados(prev => [...prev, ponto.id])
    } catch (e) {
      console.error(e)
    }
    setEnviando(null)
  }

  async function enviarTodosAlertas() {
    for (const ponto of pontosCheios) {
      await enviarAlerta(ponto)
    }
  }

  async function marcarRecolhido(id: string) {
    await supabase
      .from('pontos_recolha')
      .update({ estado: 'activo', capacidade: 'normal' })
      .eq('id', id)
    await carregarDados()
  }

  if (carregando) return (
    <main className="min-h-screen bg-green-950 flex items-center justify-center">
      <p className="text-green-400">A carregar alertas...</p>
    </main>
  )

  return (
    <main className="min-h-screen bg-green-950 text-white">
      <nav className="flex items-center justify-between px-8 py-4 bg-green-900 shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-2xl">♻️</span>
          <span className="text-xl font-bold text-green-300">Luanda Limpa</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="/dashboard" className="text-green-200 hover:text-white transition">Dashboard</a>
          <a href="/mapa" className="text-green-200 hover:text-white transition">🗺️ Mapa</a>
          <a href="/relatorios" className="text-green-200 hover:text-white transition">📊 Relatórios</a>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-red-300">🔴 Alertas de Contentores</h1>
            <p className="text-green-400 mt-1">{pontosCheios.length} contentores cheios precisam de recolha urgente</p>
          </div>
          {pontosCheios.length > 0 && (
            <button
              onClick={enviarTodosAlertas}
              className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-xl transition flex items-center gap-2"
            >
              📧 Alertar todos
            </button>
          )}
        </div>

        {pontosCheios.length === 0 ? (
          <div className="bg-green-900 rounded-2xl p-12 text-center">
            <span className="text-6xl">✅</span>
            <h2 className="text-2xl font-bold text-green-300 mt-4">Tudo limpo!</h2>
            <p className="text-green-400 mt-2">Não há contentores cheios neste momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pontosCheios.map(p => (
              <div key={p.id} className={`rounded-2xl p-5 border-2 transition ${
                enviados.includes(p.id)
                  ? 'bg-green-900 border-green-600'
                  : 'bg-red-950 border-red-800'
              }`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-white">{p.nome}</h3>
                    <p className="text-green-400 text-sm">📍 {p.municipio}</p>
                    <p className="text-red-400 text-sm mt-1">🔴 Cheio · Recolha urgente</p>
                  </div>
                  <span className="text-3xl">🗑️</span>
                </div>

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => enviarAlerta(p)}
                    disabled={enviando === p.id || enviados.includes(p.id)}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition ${
                      enviados.includes(p.id)
                        ? 'bg-green-700 text-green-300'
                        : 'bg-red-600 hover:bg-red-500 text-white'
                    } disabled:opacity-50`}
                  >
                    {enviados.includes(p.id) ? '✅ Alerta enviado' : enviando === p.id ? 'A enviar...' : '📧 Enviar alerta'}
                  </button>
                  <button
                    onClick={() => marcarRecolhido(p.id)}
                    className="flex-1 py-2 rounded-xl text-sm font-medium bg-green-700 hover:bg-green-600 text-white transition"
                  >
                    ✅ Marcar recolhido
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <JFSFlutuante pagina="dashboard" nomeUtilizador={utilizador?.nome} papel={utilizador?.papel} />
    </main>
  )
}