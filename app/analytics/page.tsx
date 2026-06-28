'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import dynamic from 'next/dynamic'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts'
const JFSFlutuante = dynamic(() => import('../../components/JFSFlutuante'), { ssr: false })

const CORES = ['#22c55e', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#14b8a6', '#6366f1', '#a78bfa']

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
    const { data: previsoesSalvas } = await supabase.from('previsoes_contentores').select('*').order('criado_em', { ascending: false }).limit(5)
    const { data: perfis } = await supabase.from('perfis').select('papel')

    const municipioStats: Record<string, { total: number; cheios: number; normais: number }> = {}
    pontosPorMunicipio?.forEach(p => {
      if (!municipioStats[p.municipio]) municipioStats[p.municipio] = { total: 0, cheios: 0, normais: 0 }
      municipioStats[p.municipio].total++
      if (p.estado === 'cheio') municipioStats[p.municipio].cheios++
      else municipioStats[p.municipio].normais++
    })

    const papelStats: Record<string, number> = {}
    perfis?.forEach(p => { papelStats[p.papel] = (papelStats[p.papel] || 0) + 1 })

    const mediaAvaliacoes = avaliacoes?.length
      ? (avaliacoes.reduce((s, a) => s + a.nota, 0) / avaliacoes.length).toFixed(1)
      : 0

    const eficiencia = totalRotas ? Math.round(((rotasConcluidas || 0) / totalRotas) * 100) : 0
    const taxaOcupacao = totalPontos ? Math.round(((pontosCheios || 0) / totalPontos) * 100) : 0

    const dadosMunicipio = Object.entries(municipioStats).map(([nome, s]) => ({
      nome: nome.length > 8 ? nome.substring(0, 8) + '...' : nome,
      nomeCompleto: nome,
      cheios: s.cheios,
      normais: s.normais,
      total: s.total,
      pct: Math.round(s.cheios / s.total * 100)
    })).sort((a, b) => b.pct - a.pct)

    const dadosPapel = Object.entries(papelStats).map(([papel, count]) => ({
      name: papel === 'admin' ? 'Admin' : papel === 'gestor' ? 'Gestor' : papel === 'operador' ? 'Operador' : 'Camionista',
      value: count
    }))

    setDados({
      totalPontos, pontosCheios, totalRotas, rotasConcluidas,
      totalUtilizadores, totalMensagens, totalAvaliacoes,
      mediaAvaliacoes, eficiencia, taxaOcupacao,
      dadosMunicipio, dadosPapel
    })
    setPrevisoes(previsoesSalvas || [])
    setCarregando(false)
  }

  async function gerarPrevisaoIA() {
    setGerandoPrevisao(true)
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
          ${Object.entries(municipioStats).map(([m, s]) => `${m}: ${s.cheios}/${s.total} cheios (${Math.round(s.cheios / s.total * 100)}%)`).join('\n')}
          
          1. Quais municípios precisam de recolha urgente nos próximos 3 dias?
          2. Qual é a tendência geral?
          3. Que acções preventivas recomendas?
          Sê conciso e profissional.`
        }]
      })
    })
    const resposta = await res.json()

    const { data: pontosCheiosData } = await supabase.from('pontos_recolha').select('id').eq('estado', 'cheio').limit(3)
    for (const ponto of (pontosCheiosData || [])) {
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

  if (carregando) return (
    <main className="min-h-screen bg-green-950 flex items-center justify-center">
      <p className="text-green-400">A carregar analytics...</p>
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

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Taxa de ocupação', valor: `${dados?.taxaOcupacao}%`, sub: `${dados?.pontosCheios} cheios de ${dados?.totalPontos}`, cor: dados?.taxaOcupacao > 50 ? 'text-red-300' : 'text-green-300', bg: dados?.taxaOcupacao > 50 ? 'bg-red-950 border border-red-800' : 'bg-green-900' },
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

          {/* GRÁFICO DE BARRAS — OCUPAÇÃO POR MUNICÍPIO */}
          <div className="bg-green-900 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-green-300 mb-4">🏙️ Ocupação por município</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={dados?.dadosMunicipio} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#166534" />
                <XAxis dataKey="nome" tick={{ fill: '#86efac', fontSize: 10 }} />
                <YAxis tick={{ fill: '#86efac', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ background: '#14532d', border: '1px solid #166534', borderRadius: '8px' }}
                  labelStyle={{ color: '#86efac' }}
                  formatter={(value: any, name: string) => [value, name === 'cheios' ? '🔴 Cheios' : '🟢 Normais']}
                  labelFormatter={(label) => dados?.dadosMunicipio?.find((d: any) => d.nome === label)?.nomeCompleto || label}
                />
                <Legend formatter={(value) => value === 'cheios' ? '🔴 Cheios' : '🟢 Normais'} />
                <Bar dataKey="normais" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cheios" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* GRÁFICO DE PIE — UTILIZADORES POR PAPEL */}
          <div className="bg-green-900 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-green-300 mb-4">👥 Utilizadores por função</h2>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={dados?.dadosPapel}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={{ stroke: '#86efac' }}
                >
                  {dados?.dadosPapel?.map((_: any, index: number) => (
                    <Cell key={index} fill={CORES[index % CORES.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#14532d', border: '1px solid #166534', borderRadius: '8px' }}
                  labelStyle={{ color: '#86efac' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GRÁFICO DE LINHA — TENDÊNCIA */}
        <div className="bg-green-900 rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-bold text-green-300 mb-4">📊 Métricas gerais do sistema</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Pontos de recolha', valor: dados?.totalPontos, max: 200, cor: '#22c55e' },
              { label: 'Rotas geradas', valor: dados?.totalRotas, max: 50, cor: '#3b82f6' },
              { label: 'Mensagens', valor: dados?.totalMensagens, max: 100, cor: '#8b5cf6' },
              { label: 'Avaliações', valor: dados?.totalAvaliacoes, max: 50, cor: '#f59e0b' },
            ].map((m, i) => (
              <div key={i} className="bg-green-800 rounded-xl p-4">
                <p className="text-green-400 text-xs mb-2">{m.label}</p>
                <p className="text-2xl font-bold text-white mb-2">{m.valor}</p>
                <div className="w-full bg-green-700 rounded-full h-2">
                  <div className="h-2 rounded-full transition-all" style={{
                    width: `${Math.min((m.valor / m.max) * 100, 100)}%`,
                    backgroundColor: m.cor
                  }}/>
                </div>
              </div>
            ))}
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