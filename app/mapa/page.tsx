'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import dynamic from 'next/dynamic'

const MapaComponent = dynamic(() => import('../../components/MapaComponent'), { ssr: false })
const JFSFlutuante = dynamic(() => import('../../components/JFSFlutuante'), { ssr: false })

export default function Mapa() {
  const [pontos, setPontos] = useState<any[]>([])
  const [municipioFiltro, setMunicipioFiltro] = useState('')
  const [rotaCoordenadas, setRotaCoordenadas] = useState<[number, number][]>([])
  const [carregandoRota, setCarregandoRota] = useState(false)
  const [infoRota, setInfoRota] = useState<any>(null)
  const [camionistas, setCamionistas] = useState<any[]>([])
  const [utilizador, setUtilizador] = useState<any>(null)

  const municipios = [
    'Belas', 'Cacuaco', 'Cazenga', 'Icolo e Bengo',
    'Kilamba Kiaxi', 'Luanda', 'Maianga', 'Mulenvos',
    'Quissama', 'Sambizanga', 'Talatona', 'Viana'
  ]

  useEffect(() => {
    carregarDados()
    carregarCamionistas()
    const interval = setInterval(carregarCamionistas, 30000)
    return () => clearInterval(interval)
  }, [])

  async function carregarDados() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: perfil } = await supabase.from('perfis').select('*').eq('id', user.id).single()
      setUtilizador(perfil)
    }
    const { data } = await supabase.from('pontos_recolha').select('*')
    setPontos(data || [])
  }

  async function carregarCamionistas() {
    const { data } = await supabase
      .from('localizacoes_tempo_real')
      .select('*, perfis(nome, municipio)')
      .eq('activo', true)
    setCamionistas((data || []).map(c => ({
      nome: c.perfis?.nome || 'Camionista',
      latitude: c.latitude,
      longitude: c.longitude,
      municipio: c.perfis?.municipio || ''
    })))
  }

  async function calcularRota(municipio: string) {
    setMunicipioFiltro(municipio)
    setRotaCoordenadas([])
    setInfoRota(null)
    const pontosMunicipio = pontos.filter(p => p.municipio === municipio)
    if (pontosMunicipio.length < 2) return
    setCarregandoRota(true)
    try {
      const coordenadas = pontosMunicipio.map(p => `${p.longitude},${p.latitude}`).join(';')
      const url = `https://router.project-osrm.org/route/v1/driving/${coordenadas}?overview=full&geometries=geojson&steps=true`
      const res = await fetch(url)
      const dados = await res.json()
      if (dados.routes && dados.routes[0]) {
        const rota = dados.routes[0]
        const coords: [number, number][] = rota.geometry.coordinates.map(
          (c: number[]) => [c[1], c[0]] as [number, number]
        )
        setRotaCoordenadas(coords)
        setInfoRota({
          distancia: (rota.distance / 1000).toFixed(1),
          duracao: Math.round(rota.duration / 60),
          pontos: pontosMunicipio.length
        })
      }
    } catch (e) { console.error(e) }
    setCarregandoRota(false)
  }

  const pontosFiltrados = municipioFiltro ? pontos.filter(p => p.municipio === municipioFiltro) : pontos

  return (
    <main className="min-h-screen bg-green-950 text-white">
      <nav className="flex items-center justify-between px-8 py-4 bg-green-900 shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-2xl">♻️</span>
          <span className="text-xl font-bold text-green-300">Luanda Limpa</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="/dashboard" className="text-green-200 hover:text-white transition">Dashboard</a>
          <a href="/rotas" className="text-green-200 hover:text-white transition">🚛 Rotas</a>
          <a href="/dialogo" className="text-green-200 hover:text-white transition">💬 JFS</a>
          {camionistas.length > 0 && (
            <span className="text-blue-300 text-xs">🚛 {camionistas.length} camionista(s) activo(s)</span>
          )}
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold text-green-300 mb-2">🗺️ Mapa de Luanda</h1>
        <p className="text-green-400 mb-4">
          {pontos.length} pontos · {municipioFiltro ? `${pontosFiltrados.length} em ${municipioFiltro}` : 'Todos os municípios'}
          {camionistas.length > 0 && ` · 🚛 ${camionistas.length} camionista(s) em campo`}
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          <div className="lg:col-span-1 flex flex-col gap-4">
            <div className="bg-green-900 rounded-2xl p-4">
              <h2 className="text-sm font-bold text-green-300 mb-3">Filtrar por município</h2>
              <button
                onClick={() => { setMunicipioFiltro(''); setRotaCoordenadas([]); setInfoRota(null) }}
                className={`w-full px-3 py-2 rounded-xl text-sm mb-2 transition ${
                  !municipioFiltro ? 'bg-green-500 text-white' : 'bg-green-800 text-green-300 hover:bg-green-700'
                }`}
              >
                Todos
              </button>
              <div className="flex flex-col gap-1">
                {municipios.map(m => (
                  <button key={m} onClick={() => calcularRota(m)}
                    className={`w-full px-3 py-2 rounded-xl text-sm text-left transition flex items-center justify-between ${
                      municipioFiltro === m ? 'bg-green-500 text-white' : 'bg-green-800 text-green-300 hover:bg-green-700'
                    }`}>
                    <span>{m}</span>
                    <span className="text-xs opacity-70">{pontos.filter(p => p.municipio === m).length}</span>
                  </button>
                ))}
              </div>
            </div>

            {carregandoRota && (
              <div className="bg-green-900 rounded-2xl p-4 text-center">
                <p className="text-green-400 text-sm">A calcular rota...</p>
              </div>
            )}

            {infoRota && !carregandoRota && (
              <div className="bg-green-900 rounded-2xl p-4">
                <h2 className="text-sm font-bold text-green-300 mb-3">📊 Rota calculada</h2>
                <div className="flex flex-col gap-2">
                  {[
                    { label: 'Distância', valor: `${infoRota.distancia} km` },
                    { label: 'Duração', valor: `${infoRota.duracao} min` },
                    { label: 'Paragens', valor: `${infoRota.pontos} pontos` }
                  ].map((item, i) => (
                    <div key={i} className="bg-green-800 rounded-xl px-3 py-2 flex items-center justify-between">
                      <span className="text-green-400 text-xs">{item.label}</span>
                      <span className="text-green-300 font-bold text-xs">{item.valor}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex gap-3 text-xs">
                  <span className="flex items-center gap-1">🟢 Normal</span>
                  <span className="flex items-center gap-1">🔴 Cheio</span>
                  <span className="flex items-center gap-1">🔵 Camionista</span>
                </div>
              </div>
            )}

            {camionistas.length > 0 && (
              <div className="bg-green-900 rounded-2xl p-4">
                <h2 className="text-sm font-bold text-green-300 mb-3">🚛 Camionistas activos</h2>
                <div className="flex flex-col gap-2">
                  {camionistas.map((c, i) => (
                    <div key={i} className="bg-green-800 rounded-xl px-3 py-2">
                      <p className="text-green-300 text-xs font-medium">🚛 {c.nome}</p>
                      <p className="text-green-500 text-xs">📍 {c.municipio}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-3">
            <div className="rounded-2xl overflow-hidden shadow-xl border border-green-800" style={{height: '600px'}}>
              <MapaComponent
                pontos={pontos}
                rotaCoordenadas={rotaCoordenadas}
                municipioFiltro={municipioFiltro}
                camionistas={camionistas}
              />
            </div>
          </div>
        </div>
      </div>

      <JFSFlutuante pagina="mapa" nomeUtilizador={utilizador?.nome} papel={utilizador?.papel} />
    </main>
  )
}