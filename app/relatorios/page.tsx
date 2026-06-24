'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import dynamic from 'next/dynamic'
const JFSFlutuante = dynamic(() => import('../../components/JFSFlutuante'), { ssr: false })

export default function Relatorios() {
  const [utilizador, setUtilizador] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [carregando, setCarregando] = useState(true)
  const [relatorioIA, setRelatorioIA] = useState('')
  const [gerandoRelatorio, setGerandoRelatorio] = useState(false)

  useEffect(() => {
    carregarDados()
  }, [])

  async function carregarDados() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }

    const { data: perfil } = await supabase
      .from('perfis').select('*').eq('id', user.id).single()
    setUtilizador(perfil)

    const { count: totalPontos } = await supabase
      .from('pontos_recolha').select('*', { count: 'exact', head: true })

    const { count: pontosCheios } = await supabase
      .from('pontos_recolha').select('*', { count: 'exact', head: true })
      .eq('estado', 'cheio')

    const { count: totalRotas } = await supabase
      .from('rotas').select('*', { count: 'exact', head: true })

    const { count: totalMensagens } = await supabase
      .from('mensagens').select('*', { count: 'exact', head: true })

    const { count: totalUtilizadores } = await supabase
      .from('perfis').select('*', { count: 'exact', head: true })

    const { data: pontosPorMunicipio } = await supabase
      .from('pontos_recolha').select('municipio')

    const municipioStats: Record<string, number> = {}
    pontosPorMunicipio?.forEach(p => {
      municipioStats[p.municipio] = (municipioStats[p.municipio] || 0) + 1
    })

    setStats({
      totalPontos,
      pontosCheios,
      totalRotas,
      totalMensagens,
      totalUtilizadores,
      municipioStats
    })
    setCarregando(false)
  }

  async function gerarRelatorioIA() {
    setGerandoRelatorio(true)
    setRelatorioIA('')

    const res = await fetch('/api/jfs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mensagens: [{
          role: 'user',
          content: `Gera um relatório executivo profissional do sistema Luanda Limpa com os seguintes dados:
          - Total de pontos de recolha: ${stats?.totalPontos}
          - Contentores cheios: ${stats?.pontosCheios}
          - Rotas geradas: ${stats?.totalRotas}
          - Mensagens na sala de diálogo: ${stats?.totalMensagens}
          - Utilizadores registados: ${stats?.totalUtilizadores}
          - Distribuição por município: ${JSON.stringify(stats?.municipioStats)}
          
          O relatório deve incluir: resumo executivo, análise da situação actual, 
          municípios prioritários, recomendações e conclusão. Sê profissional e conciso.`
        }]
      })
    })

    const dados = await res.json()
    setRelatorioIA(dados.resposta)
    setGerandoRelatorio(false)
  }

  function imprimirRelatorio() {
    window.print()
  }

  if (carregando) return (
    <main className="min-h-screen bg-green-950 flex items-center justify-center">
      <p className="text-green-400">A carregar dados...</p>
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
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-green-300">📊 Relatórios</h1>
            <p className="text-green-400 mt-1">Análise completa do sistema — {new Date().toLocaleDateString('pt-PT')}</p>
          </div>
          <button
            onClick={imprimirRelatorio}
            className="bg-green-700 hover:bg-green-600 text-white px-4 py-2 rounded-xl transition flex items-center gap-2"
          >
            🖨️ Imprimir
          </button>
        </div>

        {/* CARDS DE ESTATÍSTICAS */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: 'Pontos de recolha', valor: stats?.totalPontos, icone: '📍', cor: 'text-green-300' },
            { label: 'Contentores cheios', valor: stats?.pontosCheios, icone: '🔴', cor: 'text-red-300' },
            { label: 'Rotas geradas', valor: stats?.totalRotas, icone: '🚛', cor: 'text-blue-300' },
            { label: 'Mensagens', valor: stats?.totalMensagens, icone: '💬', cor: 'text-yellow-300' },
            { label: 'Utilizadores', valor: stats?.totalUtilizadores, icone: '👥', cor: 'text-purple-300' },
          ].map((s, i) => (
            <div key={i} className="bg-green-900 rounded-2xl p-4 text-center">
              <span className="text-2xl">{s.icone}</span>
              <p className={`text-3xl font-bold ${s.cor} mt-1`}>{s.valor || 0}</p>
              <p className="text-green-500 text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* DISTRIBUIÇÃO POR MUNICÍPIO */}
        <div className="bg-green-900 rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-bold text-green-300 mb-4">📍 Pontos por município</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(stats?.municipioStats || {})
              .sort((a, b) => (b[1] as number) - (a[1] as number))
              .map(([municipio, count]) => (
                <div key={municipio} className="bg-green-800 rounded-xl px-4 py-3 flex items-center justify-between">
                  <span className="text-green-300 text-sm">{municipio}</span>
                  <div className="flex items-center gap-2">
                    <div className="bg-green-600 rounded-full h-2" style={{width: `${Math.min((count as number) * 4, 60)}px`}}/>
                    <span className="text-green-400 font-bold text-sm">{count as number}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* RELATÓRIO IA */}
        <div className="bg-green-900 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-green-300">🤖 Relatório executivo gerado pelo JFS</h2>
            <button
              onClick={gerarRelatorioIA}
              disabled={gerandoRelatorio}
              className="bg-green-500 hover:bg-green-400 text-white px-4 py-2 rounded-xl text-sm transition disabled:opacity-50"
            >
              {gerandoRelatorio ? 'A gerar...' : '✨ Gerar relatório'}
            </button>
          </div>

          {relatorioIA ? (
            <div className="bg-green-800 rounded-xl p-6 text-green-100 text-sm leading-relaxed whitespace-pre-wrap">
              {relatorioIA}
            </div>
          ) : (
            <div className="bg-green-800 rounded-xl p-8 text-center">
              <span className="text-4xl">📋</span>
              <p className="text-green-400 mt-3">Clica em "Gerar relatório" para o JFS criar uma análise completa do sistema.</p>
            </div>
          )}
        </div>
      </div>

      <JFSFlutuante pagina="dashboard" nomeUtilizador={utilizador?.nome} papel={utilizador?.papel} />
    </main>
  )
}