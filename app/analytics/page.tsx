'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import dynamic from 'next/dynamic'
const JFSFlutuante = dynamic(() => import('../../components/JFSFlutuante'), { ssr: false })

export default function Analytics() {
  const [utilizador, setUtilizador] = useState<any>(null)
  const [dados, setDados] = useState<any>(null)
  const [previsoes, setPrevisoes] = useState<any[]>([])
  const [gerandoPrevisao, setGerandoPrevisao] = useState(false)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => { carregarDados() }, [])

  async function carregarDados() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    const { data: perfil } = await supabase.from('perfis').select('*').eq('id', user.id).single()
    setUtilizador(perfil)

    const { count: totalPontos } = await supabase.from('pontos_recolha').select('*', { count: 'exact', head: true })
    const { count: pontosCheios } = await supabase.from('pontos_recolha').select('*', { count: 'exact', head: true }).eq('estado', 'cheio')
    const { count: totalRotas } = await supabase.from('rotas').select('*', { count: 'exact', head: true })
    const { count: rotasConcluidas } = await supabase.from('rotas').select('*', { count: 'exact', head: true }).eq('estado', 'concluida')
    const { count: totalUtilizadores } = await supabase.from('perfis').select('*', { count: 'exact', head: true })
    const { count: totalMensagens } = await supabase.from('mensagens').select('*', { count: 'exact', head: true })
    const { count: totalAvaliacoes } = await supabase.from('avaliacoes').select('*', { count: 'exact', head: true })
    const { data: avaliacoes } = await supabase.from('avaliacoes').select('nota, municipio')
    const { data: pontosPorMunicipio } = await supabase.from('pontos_recolha').select('municipio, estado')
    const { data: recolhas } = await supabase.from('calendario_recolhas').select('estado, municipio')
    const { data: previsoesSalvas } = await supabase.from('previsoes_contentores').select('*').order('criado_em', { ascending: false }).limit(10)

    const municipioStats: Record<string, { total: number; cheios: number }> = {}
    pontosPorMunicipio?.forEach(p => {
      if (!municipioStats[p.municipio]) municipioStats[p.municipio] = { total: 0, cheios: 0 }
      municipioStats[p.municipio].total++
      if (p.estado === 'cheio') municipioStats[p.municipio].cheios++
    })

    const mediaAvaliacoes = avaliacoes?.length
      ? (avaliacoes.reduce((s, a) => s + a.nota, 0) / avaliacoes.length).toFixed(1)
      : 0

    const eficiencia = totalRotas ? Math.round(((rotasConcluidas || 0) / totalRotas) * 100) : 0
    const taxaOcupacao = totalPontos ? Math.round(((pontosCheios || 0) / totalPontos) * 100) : 0

    setDados({
      totalPontos, pontosCheios, totalRotas, rotasConcluidas,
      totalUtilizadores, totalMensagens, totalAvaliacoes,
      mediaAvaliacoes, eficiencia, taxaOcupacao,
      municipioStats, recolhas
    })
    setPrevisoes(previsoesSalvas || [])
    setCarregando(false)
  }

  async function gerarPrevisaoIA() {
    setGerandoPrevisao(true)
    const { data: pontosCheios } = await supabase.from('pontos_recolha')
      .select('*').eq('estado', 'cheio')
    const { data: todospontos } = await supabase.from('pontos_recolha').select('municipio, estado')

    const municipioStats: Record<string, { total: number; cheios: number }> = {}
    todospontos?.forEach(p => {
      if (!municipioStats[p.municipio]) municipioStats[p.municipio] = { total: 0, cheios: 0 }
      municipioStats[p.municipio].total++
      if (p.estado === 'cheio') municipioStats[p.municipio].cheios++
    })

    const res = await fetch('/api/jfs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mensagens: [{
          role: 'user',
          content: `Analisa os dados do sistema Luanda Limpa e faz previsões:
          
          Distribuição de contentores por município:
          ${Object.entries(municipioStats).map(([m, s]) => `${m}: ${s.cheios}/${s.total} cheios (${Math.round(s.cheios/s.total*100)}%)`).join('\n')}
          
          Com base nestes dados:
          1. Quais municípios vão precisar de recolha urgente nos próximos 3 dias?
          2. Qual é a tendência geral do sistema?
          3. Que acções preventivas recomendas?
          
          Sê conciso e profissional.`
        }]
      })
    })
    const resposta = await res.json()

    for (const ponto of (pontosCheios || []).slice(0, 5)) {
      await supabase.from('previsoes_contentores').insert({
        ponto_id: ponto.id,
        previsao_texto: resposta.resposta,
        dias_para_cheio: 0,
        nivel_risco: 'alto'
      })
    }

    await carregarDados()
    setGerandoPrevisao(false)
  }

  function barraProgresso(valor: number, max: number, cor: string) {
    const pct = max > 0 ? Math.min((valor / max) * 100, 100) : 0
    return (
      <div className="w-full bg-green-800 rounded-full h-2 mt-1">
        <div className={`${cor} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }}/>
      </div>
    )
  }

  if (carregando) return (
    <main className="min-h-screen bg-green-950 flex items-center justify-center">
      <p className="text-green-400">A carregar analytics...</p>
    </main>
  )

  const municipioArray = Object.entries(dados?.municipioStats || {})
    .map(([nome, stats]: any) => ({ nome, ...stats, pct: Math.round(stats.cheios / stats.total * 100) }))
    .sort((a, b) => b.pct - a.pct)

  return (
    <main className="min-h-screen bg-green-950 text-white">
      <nav className="flex items-center justify-between px-8 py-4 bg-green-900 shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-2xl">♻️</span>
          <span className="text-xl font-bold text-green-300">Luanda Limpa</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="/dashboard" className="text-green-200 hover:text-white">Dashboard</a>
          <a href="/relatorios" className="text-green-200 hover:text-white">📊 Relatórios</a>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-green-300">📈 Analytics</h1>
            <p className="text-green-400 mt-1">Análise em tempo real do sistema Luanda Limpa</p>
          </div>
          <button onClick={gerarPrevisaoIA} disabled={gerandoPrevisao}
            className="bg-green-500 hover:bg-green-400 text-white px-4 py-2 rounded-xl transition disabled:opacity-50 flex items-center gap-2">
            {gerandoPrevisao ? '🤖 A analisar...' : '🤖 Previsão IA'}
          </button>
        </div>

        {/* KPIs PRINCIPAIS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Taxa de ocupação', valor: `${dados?.taxaOcupacao}%`, sub: `${dados?.pontosCheios} cheios`, cor: dados?.taxaOcupacao > 50 ? 'text-red-300' : 'text-green-300', bg: dados?.taxaOcupacao > 50 ? 'bg-red-950 border border-red-800' : 'bg-green-900' },
            { label: 'Eficiência rotas', valor: `${dados?.eficiencia}%`, sub: `${dados?.rotasConcluidas}/${dados?.totalRotas} concluídas`, cor: 'text-blue-300', bg: 'bg-green-900' },
            { label: 'Avaliação média', valor: `${dados?.mediaAvaliacoes}⭐`, sub: `${dados?.totalAvaliacoes} avaliações`, cor: 'text-yellow-300', bg: 'bg-green-900' },
            { label: 'Utilizadores', valor: dados?.totalUtilizadores, sub: 'Registados no sistema', cor: 'text-purple-300', bg: 'bg-green-900' },
          ].map((kpi, i) => (
            <div key={i} className={`${kpi.bg} rounded-2xl p-5`}>
              <p className="text-green-400 text-xs">{kpi.label}</p>
              <p className={`text-3xl font-bold ${kpi.cor} mt-1`}>{kpi.valor}</p>
              <p className="text-green-600 text-xs mt-1">{kpi.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

          {/* OCUPAÇÃO POR MUNICÍPIO */}
          <div className="bg-green-900 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-green-300 mb-4">🏙️ Ocupação por município</h2>
            <div className="flex flex-col gap-3">
              {municipioArray.map(m => (
                <div key={m.nome}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-green-300 text-sm">{m.nome}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-green-500 text-xs">{m.cheios}/{m.total}</span>
                      <span className={`text-xs font-bold ${m.pct > 50 ? 'text-red-300' : m.pct > 30 ? 'text-yellow-300' : 'text-green-300'}`}>
                        {m.pct}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-green-800 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${m.pct > 50 ? 'bg-red-500' : m.pct > 30 ? 'bg-yellow-500' : 'bg-green-500'}`}
                      style={{ width: `${m.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* MÉTRICAS GERAIS */}
          <div className="bg-green-900 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-green-300 mb-4">📊 Métricas gerais</h2>
            <div className="flex flex-col gap-4">
              {[
                { label: 'Pontos de recolha', valor: dados?.totalPontos, max: 200, cor: 'bg-green-500' },
                { label: 'Rotas geradas', valor: dados?.totalRotas, max: 50, cor: 'bg-blue-500' },
                { label: 'Mensagens no sistema', valor: dados?.totalMensagens, max: 100, cor: 'bg-purple-500' },
                { label: 'Avaliações recebidas', valor: dados?.totalAvaliacoes, max: 50, cor: 'bg-yellow-500' },
              ].map((m, i) => (
                <div key={i}>
                  <div className="flex justify-between mb-1">
                    <span className="text-green-400 text-sm">{m.label}</span>
                    <span className="text-green-300 font-bold text-sm">{m.valor}</span>
                  </div>
                  {barraProgresso(m.valor, m.max, m.cor)}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* PREVISÕES IA */}
        <div className="bg-green-900 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-green-300 mb-4">🤖 Previsões do JFS</h2>
          {previsoes.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-4xl">📈</span>
              <p className="text-green-400 mt-3">Clica em "🤖 Previsão IA" para o JFS analisar os dados</p>
            </div>
          ) : (
            <div className="bg-green-800 rounded-xl p-4 text-green-200 text-sm leading-relaxed whitespace-pre-wrap">
              {previsoes[0]?.previsao_texto}
            </div>
          )}
        </div>
      </div>

      <JFSFlutuante pagina="dashboard" nomeUtilizador={utilizador?.nome} papel={utilizador?.papel} />
    </main>
  )
}