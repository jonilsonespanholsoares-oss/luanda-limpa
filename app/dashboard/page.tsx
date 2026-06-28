'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import dynamic from 'next/dynamic'
const JFSFlutuante = dynamic(() => import('../../components/JFSFlutuante'), { ssr: false })
const Notificacoes = dynamic(() => import('../../components/Notificacoes'), { ssr: false })

export default function Dashboard() {
  const [utilizador, setUtilizador] = useState<any>(null)
  const [stats, setStats] = useState({ pontos: 0, rotas: 0, mensagens: 0, alertas: 0 })

  useEffect(() => {
    async function carregarDados() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      const { data: perfil } = await supabase.from('perfis').select('*').eq('id', user.id).single()
      if (!perfil) { window.location.href = '/login'; return }
      if (perfil.papel === 'gestor') { window.location.href = '/dashboard-gestor'; return }
      if (perfil.papel === 'operador') { window.location.href = '/dashboard-operador'; return }
      if (perfil.papel === 'camionista') { window.location.href = '/dashboard-camionista'; return }
      setUtilizador(perfil)

      const { count: pontos } = await supabase.from('pontos_recolha').select('*', { count: 'exact', head: true })
      const { count: rotas } = await supabase.from('rotas').select('*', { count: 'exact', head: true })
      const { count: mensagens } = await supabase.from('mensagens').select('*', { count: 'exact', head: true })
      const { count: alertas } = await supabase.from('pontos_recolha').select('*', { count: 'exact', head: true }).eq('estado', 'cheio')
      setStats({ pontos: pontos || 0, rotas: rotas || 0, mensagens: mensagens || 0, alertas: alertas || 0 })
    }
    carregarDados()
  }, [])

  async function sair() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const accoesRapidas = [
    { href: '/mapa', icone: '🗺️', titulo: 'Ver mapa', desc: 'Pontos de recolha em Luanda', bg: 'bg-green-900 hover:bg-green-800' },
    { href: '/rotas', icone: '🚛', titulo: 'Gerir rotas', desc: 'Optimização com IA JFS', bg: 'bg-green-900 hover:bg-green-800' },
    { href: '/dialogo', icone: '💬', titulo: 'Sala de diálogo', desc: 'Comunicação com IA integrada', bg: 'bg-green-900 hover:bg-green-800' },
    { href: '/pontos', icone: '📍', titulo: 'Pontos de recolha', desc: 'Gerir contentores e locais', bg: 'bg-green-900 hover:bg-green-800' },
    { href: '/relatorios', icone: '📊', titulo: 'Relatórios', desc: 'Análise e estatísticas', bg: 'bg-green-900 hover:bg-green-800' },
    { href: '/analytics', icone: '📈', titulo: 'Analytics', desc: 'Gráficos e previsões IA', bg: 'bg-green-900 hover:bg-green-800' },
    { href: '/alertas', icone: '🔴', titulo: 'Alertas', desc: `${stats.alertas} contentores cheios`, bg: stats.alertas > 0 ? 'bg-red-950 hover:bg-red-900 border border-red-800' : 'bg-green-900 hover:bg-green-800' },
    { href: '/calendario', icone: '🗓️', titulo: 'Calendário', desc: 'Agenda de recolhas', bg: 'bg-green-900 hover:bg-green-800' },
    { href: '/avaliacoes', icone: '⭐', titulo: 'Avaliações', desc: 'Limpeza por município', bg: 'bg-green-900 hover:bg-green-800' },
  ]

  return (
    <main className="min-h-screen bg-green-950 text-white">

      <nav className="flex items-center justify-between px-8 py-4 bg-green-900 shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-2xl">♻️</span>
          <span className="text-xl font-bold text-green-300">Luanda Limpa</span>
          <span className="ml-2 bg-green-700 text-green-200 text-xs px-2 py-1 rounded-full">👑 Admin</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="/mapa" className="text-green-200 hover:text-white transition text-sm">🗺️ Mapa</a>
          <a href="/rotas" className="text-green-200 hover:text-white transition text-sm">🚛 Rotas</a>
          <a href="/dialogo" className="text-green-200 hover:text-white transition text-sm">💬 Diálogo</a>
          <a href="/analytics" className="text-green-200 hover:text-white transition text-sm">📈 Analytics</a>
          {utilizador && <Notificacoes utilizadorId={utilizador.id} />}
          <button onClick={sair} className="bg-red-700 hover:bg-red-600 text-white px-4 py-1 rounded-full text-sm transition">Sair</button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-8 py-10">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-green-300">
            Olá, {utilizador?.nome || 'Administrador'} 👋
          </h1>
          <p className="text-green-400 mt-1">
            Município: {utilizador?.municipio || '—'} · Função: {utilizador?.papel || '—'}
          </p>
        </div>

        {/* CARDS DE ESTATÍSTICAS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="bg-green-900 rounded-2xl p-6 shadow">
            <p className="text-green-400 text-sm">Pontos de recolha</p>
            <p className="text-4xl font-bold text-green-300 mt-2">{stats.pontos}</p>
            <p className="text-green-600 text-sm mt-1">Total registados</p>
          </div>
          <div className="bg-green-900 rounded-2xl p-6 shadow">
            <p className="text-green-400 text-sm">Rotas activas</p>
            <p className="text-4xl font-bold text-green-300 mt-2">{stats.rotas}</p>
            <p className="text-green-600 text-sm mt-1">Em todos os municípios</p>
          </div>
          <div className="bg-green-900 rounded-2xl p-6 shadow">
            <p className="text-green-400 text-sm">Mensagens</p>
            <p className="text-4xl font-bold text-green-300 mt-2">{stats.mensagens}</p>
            <p className="text-green-600 text-sm mt-1">Sala de diálogo</p>
          </div>
          <div className={`rounded-2xl p-6 shadow ${stats.alertas > 0 ? 'bg-red-950 border border-red-800' : 'bg-green-900'}`}>
            <p className={`text-sm ${stats.alertas > 0 ? 'text-red-400' : 'text-green-400'}`}>Alertas urgentes</p>
            <p className={`text-4xl font-bold mt-2 ${stats.alertas > 0 ? 'text-red-300' : 'text-green-300'}`}>{stats.alertas}</p>
            <p className={`text-sm mt-1 ${stats.alertas > 0 ? 'text-red-600' : 'text-green-600'}`}>Contentores cheios</p>
          </div>
        </div>

        {/* ACÇÕES RÁPIDAS */}
        <h2 className="text-xl font-bold text-green-300 mb-4">Acções rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {accoesRapidas.map((a, i) => (
            <a key={i} href={a.href} className={`${a.bg} rounded-2xl p-6 flex items-center gap-4 shadow transition`}>
              <span className="text-4xl">{a.icone}</span>
              <div>
                <h3 className="font-bold text-green-300">{a.titulo}</h3>
                <p className="text-green-400 text-sm">{a.desc}</p>
              </div>
            </a>
          ))}
        </div>
      </div>

      <JFSFlutuante pagina="dashboard" nomeUtilizador={utilizador?.nome} papel={utilizador?.papel} />
    </main>
  )
}