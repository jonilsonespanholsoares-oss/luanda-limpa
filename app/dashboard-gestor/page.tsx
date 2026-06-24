'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import dynamic from 'next/dynamic'
const JFSFlutuante = dynamic(() => import('../../components/JFSFlutuante'), { ssr: false })

export default function DashboardGestor() {
  const [utilizador, setUtilizador] = useState<any>(null)
  const [stats, setStats] = useState({ pontos: 0, cheios: 0, rotas: 0 })
  const [pontos, setPontos] = useState<any[]>([])

  useEffect(() => { carregarDados() }, [])

  async function carregarDados() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    const { data: perfil } = await supabase.from('perfis').select('*').eq('id', user.id).single()
    if (perfil?.papel !== 'gestor') { window.location.href = '/dashboard'; return }
    setUtilizador(perfil)

    const { count: pontos } = await supabase.from('pontos_recolha')
      .select('*', { count: 'exact', head: true }).eq('municipio', perfil.municipio)
    const { count: cheios } = await supabase.from('pontos_recolha')
      .select('*', { count: 'exact', head: true }).eq('municipio', perfil.municipio).eq('estado', 'cheio')
    const { count: rotas } = await supabase.from('rotas')
      .select('*', { count: 'exact', head: true }).eq('municipio', perfil.municipio)
    const { data: listaPontos } = await supabase.from('pontos_recolha')
      .select('*').eq('municipio', perfil.municipio).order('estado')

    setStats({ pontos: pontos || 0, cheios: cheios || 0, rotas: rotas || 0 })
    setPontos(listaPontos || [])
  }

  async function sair() { await supabase.auth.signOut(); window.location.href = '/login' }

  return (
    <main className="min-h-screen bg-blue-950 text-white">
      <nav className="flex items-center justify-between px-8 py-4 bg-blue-900 shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-2xl">♻️</span>
          <span className="text-xl font-bold text-blue-300">Luanda Limpa</span>
          <span className="ml-2 bg-blue-700 text-blue-200 text-xs px-2 py-1 rounded-full">🏛️ Gestor</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="/mapa" className="text-blue-200 hover:text-white">🗺️ Mapa</a>
          <a href="/rotas" className="text-blue-200 hover:text-white">🚛 Rotas</a>
          <a href="/dialogo" className="text-blue-200 hover:text-white">💬 Diálogo</a>
          <a href="/relatorios" className="text-blue-200 hover:text-white">📊 Relatórios</a>
          <button onClick={sair} className="bg-red-700 hover:bg-red-600 text-white px-4 py-1 rounded-full text-sm">Sair</button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-300">Olá, {utilizador?.nome} 🏛️</h1>
          <p className="text-blue-400 mt-1">Gestor Municipal · 📍 {utilizador?.municipio}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-900 rounded-2xl p-6">
            <p className="text-blue-400 text-sm">Pontos no município</p>
            <p className="text-4xl font-bold text-blue-300 mt-2">{stats.pontos}</p>
          </div>
          <div className="bg-red-950 rounded-2xl p-6 border border-red-800">
            <p className="text-red-400 text-sm">Contentores cheios</p>
            <p className="text-4xl font-bold text-red-300 mt-2">{stats.cheios}</p>
          </div>
          <div className="bg-blue-900 rounded-2xl p-6">
            <p className="text-blue-400 text-sm">Rotas geradas</p>
            <p className="text-4xl font-bold text-blue-300 mt-2">{stats.rotas}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <a href="/mapa" className="bg-blue-900 hover:bg-blue-800 rounded-2xl p-6 flex items-center gap-4">
            <span className="text-4xl">🗺️</span>
            <div><h3 className="font-bold text-blue-300">Ver mapa do município</h3>
            <p className="text-blue-400 text-sm">{utilizador?.municipio}</p></div>
          </a>
          <a href="/rotas" className="bg-blue-900 hover:bg-blue-800 rounded-2xl p-6 flex items-center gap-4">
            <span className="text-4xl">🚛</span>
            <div><h3 className="font-bold text-blue-300">Gerir rotas</h3>
            <p className="text-blue-400 text-sm">Optimizar com IA JFS</p></div>
          </a>
          <a href="/alertas" className="bg-red-950 hover:bg-red-900 rounded-2xl p-6 flex items-center gap-4 border border-red-800">
            <span className="text-4xl">🔴</span>
            <div><h3 className="font-bold text-red-300">Alertas urgentes</h3>
            <p className="text-red-400 text-sm">{stats.cheios} contentores cheios</p></div>
          </a>
          <a href="/dialogo" className="bg-blue-900 hover:bg-blue-800 rounded-2xl p-6 flex items-center gap-4">
            <span className="text-4xl">💬</span>
            <div><h3 className="font-bold text-blue-300">Sala de diálogo</h3>
            <p className="text-blue-400 text-sm">Comunicar com equipa</p></div>
          </a>
        </div>

        <div className="bg-blue-900 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-blue-300 mb-4">📍 Contentores em {utilizador?.municipio}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
            {pontos.map(p => (
              <div key={p.id} className="bg-blue-800 rounded-xl px-4 py-2 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-300">{p.nome}</p>
                  <p className="text-xs text-blue-500">{p.capacidade}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${p.estado === 'cheio' ? 'bg-red-700 text-red-200' : 'bg-green-700 text-green-200'}`}>
                  {p.estado === 'cheio' ? '🔴 Cheio' : '🟢 Normal'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <JFSFlutuante pagina="dashboard" nomeUtilizador={utilizador?.nome} papel="gestor" />
    </main>
  )
}