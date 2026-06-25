'use client'
import JFSFlutuante from '../../components/JFSFlutuante'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function Dashboard() {
  const [utilizador, setUtilizador] = useState<any>(null)
  const [stats, setStats] = useState({
    pontos: 0,
    rotas: 0,
    mensagens: 0
  })

  useEffect(() => {
    async function carregarDados() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }

      const { data: perfil } = await supabase
        .from('perfis').select('*').eq('id', user.id).single()
      setUtilizador(perfil)

      const { count: pontos } = await supabase
        .from('pontos_recolha').select('*', { count: 'exact', head: true })
      const { count: rotas } = await supabase
        .from('rotas').select('*', { count: 'exact', head: true })
      const { count: mensagens } = await supabase
        .from('mensagens').select('*', { count: 'exact', head: true })

      setStats({ pontos: pontos || 0, rotas: rotas || 0, mensagens: mensagens || 0 })
    }
    carregarDados()
  }, [])

  async function sair() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <main className="min-h-screen bg-green-950 text-white">

      {/* NAVBAR */}
      <nav className="flex items-center justify-between px-8 py-4 bg-green-900 shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-2xl">♻️</span>
          <span className="text-xl font-bold text-green-300">Luanda Limpa</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="/mapa" className="text-green-200 hover:text-white transition">🗺️ Mapa</a>
          <a href="/rotas" className="text-green-200 hover:text-white transition">🚛 Rotas</a>
          <a href="/dialogo" className="text-green-200 hover:text-white transition">💬 Diálogo</a>
          <a href="/relatorios" className="text-green-200 hover:text-white transition">📊 Relatórios</a>
           <a href="/alertas" className="text-green-200 hover:text-white transition">🔴 Alertas</a>
          <button onClick={sair} className="bg-red-700 hover:bg-red-600 text-white px-4 py-1 rounded-full text-sm transition">
            Sair
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-8 py-10">

        {/* BOAS VINDAS */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-green-300">
            Olá, {utilizador?.nome || 'Utilizador'} 👋
          </h1>
          <p className="text-green-400 mt-1">
            Município: {utilizador?.municipio || '—'} · Função: {utilizador?.papel || '—'}
          </p>
        </div>

        {/* CARDS DE ESTATÍSTICAS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
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
        </div>

        {/* ACÇÕES RÁPIDAS */}
        <h2 className="text-xl font-bold text-green-300 mb-4">Acções rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a href="/mapa" className="bg-green-900 hover:bg-green-800 rounded-2xl p-6 flex items-center gap-4 shadow transition">
            <span className="text-4xl">🗺️</span>
            <div>
              <h3 className="font-bold text-green-300">Ver mapa</h3>
              <p className="text-green-400 text-sm">Pontos de recolha em Luanda</p>
            </div>
          </a>
          <a href="/rotas" className="bg-green-900 hover:bg-green-800 rounded-2xl p-6 flex items-center gap-4 shadow transition">
            <span className="text-4xl">🚛</span>
            <div>
              <h3 className="font-bold text-green-300">Gerir rotas</h3>
              <p className="text-green-400 text-sm">Optimização com IA JFS</p>
            </div>
          </a>
          <a href="/dialogo" className="bg-green-900 hover:bg-green-800 rounded-2xl p-6 flex items-center gap-4 shadow transition">
            <span className="text-4xl">💬</span>
            <div>
              <h3 className="font-bold text-green-300">Sala de diálogo</h3>
              <p className="text-green-400 text-sm">Comunicação com IA integrada</p>
            </div>
          </a>
          <a href="/pontos" className="bg-green-900 hover:bg-green-800 rounded-2xl p-6 flex items-center gap-4 shadow transition">
            <span className="text-4xl">📍</span>
            <div>
              <h3 className="font-bold text-green-300">Pontos de recolha</h3>
              <p className="text-green-400 text-sm">Gerir contentores e locais</p>
            </div>
          </a>
        </div>
        <a href="/relatorios" className="bg-green-900 hover:bg-green-800 rounded-2xl p-6 flex items-center gap-4 shadow transition">
  <span className="text-4xl">📊</span>
  <div>
    <h3 className="font-bold text-green-300">Relatórios</h3>
    <p className="text-green-400 text-sm">Análise e estatísticas do sistema</p>
  </div>
</a>
<a href="/alertas" className="bg-red-950 hover:bg-red-900 rounded-2xl p-6 flex items-center gap-4 shadow transition border border-red-800">
  <span className="text-4xl">🔴</span>
  <div>
    <h3 className="font-bold text-red-300">Alertas</h3>
    <p className="text-red-400 text-sm">Contentores cheios e urgências</p>
  </div>
</a>
<a href="/calendario" className="bg-green-900 hover:bg-green-800 rounded-2xl p-6 flex items-center gap-4 shadow transition">
  <span className="text-4xl">🗓️</span>
  <div>
    <h3 className="font-bold text-green-300">Calendário</h3>
    <p className="text-green-400 text-sm">Agenda de recolhas</p>
  </div>
</a>
<a href="/avaliacoes" className="bg-green-900 hover:bg-green-800 rounded-2xl p-6 flex items-center gap-4 shadow transition">
  <span className="text-4xl">⭐</span>
  <div>
    <h3 className="font-bold text-green-300">Avaliações</h3>
    <p className="text-green-400 text-sm">Limpeza por município</p>
  </div>
</a>
<a href="/analytics" className="bg-green-900 hover:bg-green-800 rounded-2xl p-6 flex items-center gap-4 shadow transition">
  <span className="text-4xl">📈</span>
  <div>
    <h3 className="font-bold text-green-300">Analytics</h3>
    <p className="text-green-400 text-sm">Previsões e métricas em tempo real</p>
  </div>
</a>

      </div>
      <JFSFlutuante pagina="dashboard" nomeUtilizador={utilizador?.nome} papel={utilizador?.papel} />
    </main>
  )
}