'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import dynamic from 'next/dynamic'
const JFSFlutuante = dynamic(() => import('../../components/JFSFlutuante'), { ssr: false })

export default function Calendario() {
  const [utilizador, setUtilizador] = useState<any>(null)
  const [recolhas, setRecolhas] = useState<any[]>([])
  const [municipio, setMunicipio] = useState('')
  const [data, setData] = useState('')
  const [turno, setTurno] = useState('manha')
  const [adicionando, setAdicionando] = useState(false)
  const [mesActual, setMesActual] = useState(new Date())

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
    setMunicipio(perfil?.municipio || '')
    await carregarRecolhas()
  }

  async function carregarRecolhas() {
    const { data } = await supabase.from('calendario_recolhas')
      .select('*').order('data_recolha', { ascending: true })
    setRecolhas(data || [])
  }

  async function agendarRecolha() {
    if (!municipio || !data) return
    setAdicionando(true)
    await supabase.from('calendario_recolhas').insert({
      municipio,
      data_recolha: data,
      turno,
      estado: 'agendado'
    })
    setData('')
    await carregarRecolhas()
    setAdicionando(false)
  }

  async function mudarEstado(id: string, estado: string) {
    const estados = ['agendado', 'em_curso', 'concluido']
    const proximo = estados[(estados.indexOf(estado) + 1) % estados.length]
    await supabase.from('calendario_recolhas').update({ estado: proximo }).eq('id', id)
    await carregarRecolhas()
  }

  function corEstado(estado: string) {
    if (estado === 'agendado') return 'bg-blue-700 text-blue-200'
    if (estado === 'em_curso') return 'bg-yellow-700 text-yellow-200'
    return 'bg-green-700 text-green-200'
  }

  function iconeEstado(estado: string) {
    if (estado === 'agendado') return '📅'
    if (estado === 'em_curso') return '🚛'
    return '✅'
  }

  const hoje = new Date().toISOString().split('T')[0]
  const recolhasHoje = recolhas.filter(r => r.data_recolha === hoje)
  const recolhasPendentes = recolhas.filter(r => r.estado !== 'concluido')

  async function sair() { await supabase.auth.signOut(); window.location.href = '/login' }

  return (
    <main className="min-h-screen bg-green-950 text-white">
      <nav className="flex items-center justify-between px-8 py-4 bg-green-900 shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-2xl">♻️</span>
          <span className="text-xl font-bold text-green-300">Luanda Limpa</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="/dashboard" className="text-green-200 hover:text-white">Dashboard</a>
          <a href="/rotas" className="text-green-200 hover:text-white">🚛 Rotas</a>
          <button onClick={sair} className="bg-red-700 hover:bg-red-600 text-white px-4 py-1 rounded-full text-sm">Sair</button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-8 py-8">
        <h1 className="text-3xl font-bold text-green-300 mb-2">🗓️ Calendário de Recolhas</h1>
        <p className="text-green-400 mb-8">Agenda e gestão de recolhas por município</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-green-900 rounded-2xl p-4 text-center">
            <p className="text-green-400 text-xs">Recolhas hoje</p>
            <p className="text-3xl font-bold text-green-300">{recolhasHoje.length}</p>
          </div>
          <div className="bg-green-900 rounded-2xl p-4 text-center">
            <p className="text-green-400 text-xs">Pendentes</p>
            <p className="text-3xl font-bold text-yellow-300">{recolhasPendentes.length}</p>
          </div>
          <div className="bg-green-900 rounded-2xl p-4 text-center">
            <p className="text-green-400 text-xs">Total agendadas</p>
            <p className="text-3xl font-bold text-blue-300">{recolhas.length}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* AGENDAR */}
          {(utilizador?.papel === 'admin' || utilizador?.papel === 'gestor') && (
            <div className="bg-green-900 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-green-300 mb-4">➕ Agendar recolha</h2>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-green-300 text-xs mb-1 block">Município</label>
                  <select value={municipio} onChange={e => setMunicipio(e.target.value)}
                    className="w-full bg-green-800 text-white px-3 py-2 rounded-xl border border-green-700 focus:outline-none text-sm">
                    {municipios.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-green-300 text-xs mb-1 block">Data</label>
                  <input type="date" value={data} onChange={e => setData(e.target.value)}
                    className="w-full bg-green-800 text-white px-3 py-2 rounded-xl border border-green-700 focus:outline-none text-sm"/>
                </div>
                <div>
                  <label className="text-green-300 text-xs mb-1 block">Turno</label>
                  <select value={turno} onChange={e => setTurno(e.target.value)}
                    className="w-full bg-green-800 text-white px-3 py-2 rounded-xl border border-green-700 focus:outline-none text-sm">
                    <option value="manha">🌅 Manhã (06:00 - 12:00)</option>
                    <option value="tarde">☀️ Tarde (12:00 - 18:00)</option>
                    <option value="noite">🌙 Noite (18:00 - 00:00)</option>
                  </select>
                </div>
                <button onClick={agendarRecolha} disabled={adicionando || !municipio || !data}
                  className="bg-green-500 hover:bg-green-400 text-white font-bold py-2 rounded-xl transition disabled:opacity-50">
                  {adicionando ? 'A agendar...' : '✅ Agendar'}
                </button>
              </div>
            </div>
          )}

          {/* LISTA */}
          <div className={`${utilizador?.papel === 'admin' || utilizador?.papel === 'gestor' ? 'lg:col-span-2' : 'lg:col-span-3'} bg-green-900 rounded-2xl p-6`}>
            <h2 className="text-lg font-bold text-green-300 mb-4">📋 Recolhas agendadas</h2>
            {recolhas.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-4xl">🗓️</span>
                <p className="text-green-400 mt-3">Nenhuma recolha agendada.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3 max-h-96 overflow-y-auto">
                {recolhas.map(r => (
                  <div key={r.id} className={`bg-green-800 rounded-xl p-4 flex items-center justify-between ${
                    r.data_recolha === hoje ? 'border border-yellow-500' : ''
                  }`}>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{iconeEstado(r.estado)}</span>
                        <p className="font-bold text-green-300">{r.municipio}</p>
                        {r.data_recolha === hoje && (
                          <span className="text-xs bg-yellow-600 text-yellow-200 px-2 py-0.5 rounded-full">HOJE</span>
                        )}
                      </div>
                      <p className="text-green-400 text-sm">
                        📅 {new Date(r.data_recolha).toLocaleDateString('pt-PT')} · {
                          r.turno === 'manha' ? '🌅 Manhã' :
                          r.turno === 'tarde' ? '☀️ Tarde' : '🌙 Noite'
                        }
                      </p>
                    </div>
                    <button onClick={() => mudarEstado(r.id, r.estado)}
                      className={`text-xs px-3 py-1.5 rounded-full font-medium transition hover:opacity-80 ${corEstado(r.estado)}`}>
                      {r.estado === 'agendado' ? 'Agendado' : r.estado === 'em_curso' ? 'Em curso' : 'Concluído'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <JFSFlutuante pagina="dashboard" nomeUtilizador={utilizador?.nome} papel={utilizador?.papel} />
    </main>
  )
}