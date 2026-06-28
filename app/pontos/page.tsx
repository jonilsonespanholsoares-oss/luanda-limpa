'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import QRCode from 'react-qr-code'
import dynamic from 'next/dynamic'
const JFSFlutuante = dynamic(() => import('../../components/JFSFlutuante'), { ssr: false })

export default function Pontos() {
  const [utilizador, setUtilizador] = useState<any>(null)
  const [pontos, setPontos] = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)
  const [filtroMunicipio, setFiltroMunicipio] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [qrActivo, setQrActivo] = useState<string | null>(null)
  const [pesquisa, setPesquisa] = useState('')

  const municipios = [
    'Belas', 'Cacuaco', 'Cazenga', 'Icolo e Bengo',
    'Kilamba Kiaxi', 'Luanda', 'Maianga', 'Mulenvos',
    'Quissama', 'Sambizanga', 'Talatona', 'Viana'
  ]

  useEffect(() => { carregarDados() }, [])

  async function carregarDados() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    const { data: perfil } = await supabase.from('perfis').select('*').eq('id', user.id).single()
    setUtilizador(perfil)
    const { data } = await supabase.from('pontos_recolha').select('*').order('municipio')
    setPontos(data || [])
    setCarregando(false)
  }

  async function actualizarEstado(id: string, novoEstado: string) {
    await supabase.from('pontos_recolha').update({
      estado: novoEstado,
      capacidade: novoEstado === 'cheio' ? 'cheio' : 'normal'
    }).eq('id', id)
    await carregarDados()
  }

  async function eliminarPonto(id: string) {
    if (!confirm('Tens a certeza que queres eliminar este ponto?')) return
    await supabase.from('pontos_recolha').delete().eq('id', id)
    await carregarDados()
  }

  const pontosFiltrados = pontos.filter(p => {
    const matchMunicipio = !filtroMunicipio || p.municipio === filtroMunicipio
    const matchEstado = !filtroEstado || p.estado === filtroEstado
    const matchPesquisa = !pesquisa || p.nome.toLowerCase().includes(pesquisa.toLowerCase())
    return matchMunicipio && matchEstado && matchPesquisa
  })

  const totalCheios = pontos.filter(p => p.estado === 'cheio').length
  const totalNormais = pontos.filter(p => p.estado !== 'cheio').length

  if (carregando) return (
    <main className="min-h-screen bg-green-950 flex items-center justify-center">
      <p className="text-green-400">A carregar pontos...</p>
    </main>
  )

  return (
    <main className="min-h-screen bg-green-950 text-white">
      <nav className="flex items-center justify-between px-8 py-4 bg-green-900 shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-2xl">♻️</span>
          <span className="text-xl font-bold text-green-300">Luanda Limpa</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="/dashboard" className="text-green-200 hover:text-white">Dashboard</a>
          <a href="/mapa" className="text-green-200 hover:text-white">🗺️ Mapa</a>
          <a href="/alertas" className="text-green-200 hover:text-white">🔴 Alertas</a>
        </div>
      </nav>

      {/* MODAL QR CODE */}
      {qrActivo && (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4 max-w-sm w-full mx-4">
            <h2 className="text-green-800 font-bold text-lg text-center">
              {pontos.find(p => p.id === qrActivo)?.nome}
            </h2>
            <QRCode
              value={`LUANDA-LIMPA:${qrActivo}:${pontos.find(p => p.id === qrActivo)?.municipio}`}
              size={200}
              style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
            />
            <p className="text-green-700 text-xs text-center">
              {pontos.find(p => p.id === qrActivo)?.qr_code || `LL-${qrActivo.substring(0, 8).toUpperCase()}`}
            </p>
            <p className="text-green-600 text-xs text-center">
              📍 {pontos.find(p => p.id === qrActivo)?.municipio}
            </p>
            <button onClick={() => setQrActivo(null)}
              className="bg-green-600 text-white px-6 py-2 rounded-xl hover:bg-green-500 transition">
              Fechar
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-8 py-8">
        <h1 className="text-3xl font-bold text-green-300 mb-2">📍 Pontos de Recolha</h1>
        <p className="text-green-400 mb-6">Gestão completa de todos os contentores de Luanda</p>

        {/* STATS */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-green-900 rounded-2xl p-4 text-center">
            <p className="text-green-400 text-xs">Total</p>
            <p className="text-3xl font-bold text-green-300">{pontos.length}</p>
          </div>
          <div className="bg-green-900 rounded-2xl p-4 text-center">
            <p className="text-green-400 text-xs">Normais</p>
            <p className="text-3xl font-bold text-green-300">{totalNormais}</p>
          </div>
          <div className="bg-red-950 rounded-2xl p-4 text-center border border-red-800">
            <p className="text-red-400 text-xs">Cheios</p>
            <p className="text-3xl font-bold text-red-300">{totalCheios}</p>
          </div>
        </div>

        {/* FILTROS */}
        <div className="bg-green-900 rounded-2xl p-4 mb-6 flex flex-wrap gap-3">
          <input
            value={pesquisa}
            onChange={e => setPesquisa(e.target.value)}
            placeholder="🔍 Pesquisar por nome..."
            className="flex-1 min-w-48 bg-green-800 text-white px-4 py-2 rounded-xl border border-green-700 focus:outline-none focus:border-green-400 placeholder-green-600 text-sm"
          />
          <select value={filtroMunicipio} onChange={e => setFiltroMunicipio(e.target.value)}
            className="bg-green-800 text-white px-4 py-2 rounded-xl border border-green-700 focus:outline-none text-sm">
            <option value="">Todos os municípios</option>
            {municipios.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
            className="bg-green-800 text-white px-4 py-2 rounded-xl border border-green-700 focus:outline-none text-sm">
            <option value="">Todos os estados</option>
            <option value="activo">🟢 Normal</option>
            <option value="cheio">🔴 Cheio</option>
          </select>
          <button onClick={() => { setFiltroMunicipio(''); setFiltroEstado(''); setPesquisa('') }}
            className="bg-green-700 hover:bg-green-600 text-white px-4 py-2 rounded-xl text-sm transition">
            Limpar
          </button>
        </div>

        <p className="text-green-500 text-sm mb-4">{pontosFiltrados.length} pontos encontrados</p>

        {/* LISTA */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pontosFiltrados.map(p => (
            <div key={p.id} className={`rounded-2xl p-4 border ${
              p.estado === 'cheio' ? 'bg-red-950 border-red-800' : 'bg-green-900 border-green-800'
            }`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="font-bold text-white text-sm">{p.nome}</p>
                  <p className="text-green-400 text-xs">📍 {p.municipio}</p>
                  <p className="text-green-600 text-xs mt-0.5">
                    {p.latitude?.toFixed(4)}, {p.longitude?.toFixed(4)}
                  </p>
                  {p.ultima_recolha && (
                    <p className="text-green-500 text-xs mt-0.5">
                      ✅ {new Date(p.ultima_recolha).toLocaleDateString('pt-PT')}
                    </p>
                  )}
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  p.estado === 'cheio' ? 'bg-red-700 text-red-200' : 'bg-green-700 text-green-200'
                }`}>
                  {p.estado === 'cheio' ? '🔴 Cheio' : '🟢 Normal'}
                </span>
              </div>

              {p.foto_url && (
                <img src={p.foto_url} alt="Foto" className="w-full h-24 object-cover rounded-xl mb-2"/>
              )}

              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => actualizarEstado(p.id, p.estado === 'cheio' ? 'activo' : 'cheio')}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-medium transition ${
                    p.estado === 'cheio'
                      ? 'bg-green-700 hover:bg-green-600 text-white'
                      : 'bg-red-700 hover:bg-red-600 text-white'
                  }`}
                >
                  {p.estado === 'cheio' ? '✅ Marcar normal' : '🔴 Marcar cheio'}
                </button>
                <button
                  onClick={() => setQrActivo(p.id)}
                  className="bg-blue-700 hover:bg-blue-600 text-white px-3 py-1.5 rounded-xl text-xs transition"
                >
                  🔲 QR
                </button>
                {(utilizador?.papel === 'admin') && (
                  <button
                    onClick={() => eliminarPonto(p.id)}
                    className="bg-red-800 hover:bg-red-700 text-white px-3 py-1.5 rounded-xl text-xs transition"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <JFSFlutuante pagina="dashboard" nomeUtilizador={utilizador?.nome} papel={utilizador?.papel} />
    </main>
  )
}