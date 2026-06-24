'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import dynamic from 'next/dynamic'
const JFSFlutuante = dynamic(() => import('../../components/JFSFlutuante'), { ssr: false })
const MapaComponent = dynamic(() => import('../../components/MapaComponent'), { ssr: false })

export default function DashboardCamionista() {
  const [utilizador, setUtilizador] = useState<any>(null)
  const [rotas, setRotas] = useState<any[]>([])
  const [rotaActiva, setRotaActiva] = useState<any>(null)
  const [pontos, setPontos] = useState<any[]>([])
  const [rotaCoordenadas, setRotaCoordenadas] = useState<[number, number][]>([])
  const [infoRota, setInfoRota] = useState<any>(null)
  const [confirmando, setConfirmando] = useState<string | null>(null)
  const [confirmados, setConfirmados] = useState<string[]>([])

  useEffect(() => { carregarDados() }, [])

  async function carregarDados() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    const { data: perfil } = await supabase.from('perfis').select('*').eq('id', user.id).single()
    if (perfil?.papel !== 'camionista') { window.location.href = '/dashboard'; return }
    setUtilizador(perfil)
    const { data: rotasData } = await supabase.from('rotas')
      .select('*').eq('municipio', perfil.municipio).order('criado_em', { ascending: false })
    setRotas(rotasData || [])
  }

  async function activarRota(rota: any) {
    setRotaActiva(rota)
    setRotaCoordenadas([])
    setInfoRota(null)
    const { data: pontosData } = await supabase.from('pontos_recolha')
      .select('*').eq('municipio', rota.municipio)
    setPontos(pontosData || [])

    if (pontosData && pontosData.length >= 2) {
      const coords = pontosData.map((p: any) => `${p.longitude},${p.latitude}`).join(';')
      const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`
      const res = await fetch(url)
      const dados = await res.json()
      if (dados.routes?.[0]) {
        const coordsRota: [number, number][] = dados.routes[0].geometry.coordinates.map(
          (c: number[]) => [c[1], c[0]] as [number, number]
        )
        setRotaCoordenadas(coordsRota)
        setInfoRota({
          distancia: (dados.routes[0].distance / 1000).toFixed(1),
          duracao: Math.round(dados.routes[0].duration / 60),
          pontos: pontosData.length
        })
      }
    }
  }

  async function confirmarRecolha(pontoId: string, pontoNome: string) {
    setConfirmando(pontoId)
    await supabase.from('pontos_recolha').update({ estado: 'activo', capacidade: 'normal' }).eq('id', pontoId)
    await supabase.from('mensagens').insert({
      utilizador_id: utilizador.id,
      conteudo: `✅ Recolha confirmada: ${pontoNome} em ${utilizador.municipio} — ${new Date().toLocaleTimeString('pt-PT')}`,
      tipo: 'sistema',
      sala: 'publica',
      eliminada: false
    })
    setConfirmados(prev => [...prev, pontoId])
    setConfirmando(null)
  }

  async function sair() { await supabase.auth.signOut(); window.location.href = '/login' }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <nav className="flex items-center justify-between px-8 py-4 bg-gray-900 shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-2xl">♻️</span>
          <span className="text-xl font-bold text-gray-300">Luanda Limpa</span>
          <span className="ml-2 bg-gray-700 text-gray-200 text-xs px-2 py-1 rounded-full">🚛 Camionista</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="/dialogo" className="text-gray-200 hover:text-white">💬 Diálogo</a>
          <button onClick={sair} className="bg-red-700 hover:bg-red-600 text-white px-4 py-1 rounded-full text-sm">Sair</button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-300">Olá, {utilizador?.nome} 🚛</h1>
          <p className="text-gray-400 mt-1">Camionista · 📍 {utilizador?.municipio}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* PAINEL ESQUERDO */}
          <div className="flex flex-col gap-4">
            <div className="bg-gray-900 rounded-2xl p-4">
              <h2 className="text-sm font-bold text-gray-300 mb-3">🗓️ Rotas disponíveis</h2>
              {rotas.length === 0 ? (
                <p className="text-gray-500 text-sm">Nenhuma rota disponível.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {rotas.slice(0, 5).map(r => (
                    <button key={r.id} onClick={() => activarRota(r)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-sm transition ${
                        rotaActiva?.id === r.id ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}>
                      <p className="font-medium">{r.nome}</p>
                      <p className="text-xs opacity-70">{new Date(r.criado_em).toLocaleDateString('pt-PT')}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {infoRota && (
              <div className="bg-gray-900 rounded-2xl p-4">
                <h2 className="text-sm font-bold text-gray-300 mb-3">📊 Info da rota</h2>
                <div className="flex flex-col gap-2">
                  <div className="bg-gray-800 rounded-xl px-3 py-2 flex justify-between">
                    <span className="text-gray-400 text-xs">Distância</span>
                    <span className="text-gray-300 font-bold">{infoRota.distancia} km</span>
                  </div>
                  <div className="bg-gray-800 rounded-xl px-3 py-2 flex justify-between">
                    <span className="text-gray-400 text-xs">Duração</span>
                    <span className="text-gray-300 font-bold">{infoRota.duracao} min</span>
                  </div>
                  <div className="bg-gray-800 rounded-xl px-3 py-2 flex justify-between">
                    <span className="text-gray-400 text-xs">Paragens</span>
                    <span className="text-gray-300 font-bold">{infoRota.pontos}</span>
                  </div>
                </div>
              </div>
            )}

            {/* CONFIRMAÇÃO DE RECOLHAS */}
            {pontos.length > 0 && (
              <div className="bg-gray-900 rounded-2xl p-4">
                <h2 className="text-sm font-bold text-gray-300 mb-3">✅ Confirmar recolhas</h2>
                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                  {pontos.map(p => (
                    <div key={p.id} className="bg-gray-800 rounded-xl px-3 py-2">
                      <p className="text-xs font-medium text-gray-300">{p.nome}</p>
                      <button
                        onClick={() => confirmarRecolha(p.id, p.nome)}
                        disabled={confirmando === p.id || confirmados.includes(p.id)}
                        className={`w-full mt-1 py-1.5 rounded-lg text-xs font-medium transition ${
                          confirmados.includes(p.id)
                            ? 'bg-green-700 text-green-300'
                            : 'bg-green-600 hover:bg-green-500 text-white'
                        } disabled:opacity-50`}
                      >
                        {confirmados.includes(p.id) ? '✅ Recolhido' : confirmando === p.id ? '...' : '📍 Confirmar recolha'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* MAPA */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl overflow-hidden border border-gray-800" style={{height: '600px'}}>
              {rotaActiva ? (
                <MapaComponent
                  pontos={pontos}
                  rotaCoordenadas={rotaCoordenadas}
                  municipioFiltro={utilizador?.municipio}
                />
              ) : (
                <div className="h-full bg-gray-900 flex items-center justify-center flex-col gap-4">
                  <span className="text-6xl">🚛</span>
                  <p className="text-gray-400">Selecciona uma rota para ver o percurso no mapa</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <JFSFlutuante pagina="rotas" nomeUtilizador={utilizador?.nome} papel="camionista" />
    </main>
  )
}