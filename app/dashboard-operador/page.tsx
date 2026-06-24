'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import dynamic from 'next/dynamic'
const JFSFlutuante = dynamic(() => import('../../components/JFSFlutuante'), { ssr: false })

export default function DashboardOperador() {
  const [utilizador, setUtilizador] = useState<any>(null)
  const [pontos, setPontos] = useState<any[]>([])
  const [actualizando, setActualizando] = useState<string | null>(null)
  const [novoNome, setNovoNome] = useState('')
  const [novaLat, setNovaLat] = useState('')
  const [novaLong, setNovaLong] = useState('')
  const [adicionando, setAdicionando] = useState(false)

  useEffect(() => { carregarDados() }, [])

  async function carregarDados() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    const { data: perfil } = await supabase.from('perfis').select('*').eq('id', user.id).single()
    if (perfil?.papel !== 'operador') { window.location.href = '/dashboard'; return }
    setUtilizador(perfil)
    const { data } = await supabase.from('pontos_recolha')
      .select('*').eq('municipio', perfil.municipio).order('estado')
    setPontos(data || [])
  }

  async function actualizarEstado(id: string, estado: string) {
    setActualizando(id)
    await supabase.from('pontos_recolha').update({
      estado: estado === 'cheio' ? 'activo' : 'cheio',
      capacidade: estado === 'cheio' ? 'normal' : 'cheio'
    }).eq('id', id)
    await carregarDados()
    setActualizando(null)
  }

  async function adicionarPonto() {
    if (!novoNome || !novaLat || !novaLong) return
    setAdicionando(true)
    await supabase.from('pontos_recolha').insert({
      nome: novoNome,
      municipio: utilizador.municipio,
      latitude: parseFloat(novaLat),
      longitude: parseFloat(novaLong),
      estado: 'activo',
      capacidade: 'normal'
    })
    setNovoNome(''); setNovaLat(''); setNovaLong('')
    await carregarDados()
    setAdicionando(false)
  }

  async function sair() { await supabase.auth.signOut(); window.location.href = '/login' }

  return (
    <main className="min-h-screen bg-yellow-950 text-white">
      <nav className="flex items-center justify-between px-8 py-4 bg-yellow-900 shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-2xl">♻️</span>
          <span className="text-xl font-bold text-yellow-300">Luanda Limpa</span>
          <span className="ml-2 bg-yellow-700 text-yellow-200 text-xs px-2 py-1 rounded-full">🔧 Operador</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="/mapa" className="text-yellow-200 hover:text-white">🗺️ Mapa</a>
          <a href="/dialogo" className="text-yellow-200 hover:text-white">💬 Diálogo</a>
          <button onClick={sair} className="bg-red-700 hover:bg-red-600 text-white px-4 py-1 rounded-full text-sm">Sair</button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-yellow-300">Olá, {utilizador?.nome} 🔧</h1>
          <p className="text-yellow-400 mt-1">Operador de Campo · 📍 {utilizador?.municipio}</p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-yellow-900 rounded-2xl p-6">
            <p className="text-yellow-400 text-sm">Total de contentores</p>
            <p className="text-4xl font-bold text-yellow-300 mt-2">{pontos.length}</p>
          </div>
          <div className="bg-red-950 rounded-2xl p-6 border border-red-800">
            <p className="text-red-400 text-sm">Contentores cheios</p>
            <p className="text-4xl font-bold text-red-300 mt-2">{pontos.filter(p => p.estado === 'cheio').length}</p>
          </div>
        </div>

        {/* ADICIONAR NOVO PONTO */}
        <div className="bg-yellow-900 rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-bold text-yellow-300 mb-4">➕ Registar novo contentor</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input value={novoNome} onChange={e => setNovoNome(e.target.value)}
              placeholder="Nome do contentor"
              className="bg-yellow-800 text-white px-4 py-2 rounded-xl border border-yellow-700 focus:outline-none focus:border-yellow-400 placeholder-yellow-600"/>
            <input value={novaLat} onChange={e => setNovaLat(e.target.value)}
              placeholder="Latitude (ex: -8.8100)"
              className="bg-yellow-800 text-white px-4 py-2 rounded-xl border border-yellow-700 focus:outline-none focus:border-yellow-400 placeholder-yellow-600"/>
            <input value={novaLong} onChange={e => setNovaLong(e.target.value)}
              placeholder="Longitude (ex: 13.2300)"
              className="bg-yellow-800 text-white px-4 py-2 rounded-xl border border-yellow-700 focus:outline-none focus:border-yellow-400 placeholder-yellow-600"/>
          </div>
          <button onClick={adicionarPonto} disabled={adicionando}
            className="mt-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-6 py-2 rounded-xl transition disabled:opacity-50">
            {adicionando ? 'A registar...' : '✅ Registar contentor'}
          </button>
        </div>

        {/* LISTA DE CONTENTORES */}
        <div className="bg-yellow-900 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-yellow-300 mb-4">📍 Contentores em {utilizador?.municipio}</h2>
          <div className="flex flex-col gap-3 max-h-96 overflow-y-auto">
            {pontos.map(p => (
              <div key={p.id} className="bg-yellow-800 rounded-xl px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-yellow-300">{p.nome}</p>
                  <p className="text-xs text-yellow-500">Lat: {p.latitude} · Long: {p.longitude}</p>
                </div>
                <button
                  onClick={() => actualizarEstado(p.id, p.estado)}
                  disabled={actualizando === p.id}
                  className={`px-3 py-1.5 rounded-xl text-sm font-medium transition ${
                    p.estado === 'cheio'
                      ? 'bg-red-700 hover:bg-red-600 text-white'
                      : 'bg-green-700 hover:bg-green-600 text-white'
                  } disabled:opacity-50`}
                >
                  {actualizando === p.id ? '...' : p.estado === 'cheio' ? '🔴 Cheio' : '🟢 Normal'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
      <JFSFlutuante pagina="dashboard" nomeUtilizador={utilizador?.nome} papel="operador" />
    </main>
  )
}