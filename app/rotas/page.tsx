'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { enviarNotificacao } from '../../lib/email'
import dynamic from 'next/dynamic'

const MapaComponent = dynamic(() => import('../../components/MapaComponent'), { ssr: false })
const JFSFlutuante = dynamic(() => import('../../components/JFSFlutuante'), { ssr: false })

export default function Rotas() {
  const [municipioSeleccionado, setMunicipioSeleccionado] = useState('')
  const [pontos, setPontos] = useState<any[]>([])
  const [rotaIA, setRotaIA] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [rotas, setRotas] = useState<any[]>([])
  const [utilizador, setUtilizador] = useState<any>(null)
  const [rotaCoordenadas, setRotaCoordenadas] = useState<[number, number][]>([])
  const [infoRota, setInfoRota] = useState<any>(null)
  const [mostrarMapa, setMostrarMapa] = useState(false)

  const municipios = [
    'Belas', 'Cacuaco', 'Cazenga', 'Icolo e Bengo',
    'Kilamba Kiaxi', 'Luanda', 'Maianga', 'Mulenvos',
    'Quissama', 'Sambizanga', 'Talatona', 'Viana'
  ]

  useEffect(() => {
    carregarRotas()
    carregarUtilizador()
  }, [])

  async function carregarUtilizador() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: perfil } = await supabase
        .from('perfis').select('*').eq('id', user.id).single()
      setUtilizador(perfil)
    }
  }

  async function carregarRotas() {
    const { data } = await supabase.from('rotas').select('*').order('criado_em', { ascending: false })
    setRotas(data || [])
  }

  async function carregarPontos(municipio: string) {
    setMunicipioSeleccionado(municipio)
    setRotaIA('')
    setRotaCoordenadas([])
    setInfoRota(null)
    setMostrarMapa(false)
    const { data } = await supabase
      .from('pontos_recolha').select('*').eq('municipio', municipio)
    setPontos(data || [])
  }

  async function calcularRotaOSRM(pontosList: any[]) {
    if (pontosList.length < 2) return
    try {
      const coords = pontosList.map(p => `${p.longitude},${p.latitude}`).join(';')
      const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=true`
      const res = await fetch(url)
      const dados = await res.json()
      if (dados.routes?.[0]) {
        const rota = dados.routes[0]
        const coordsRota: [number, number][] = rota.geometry.coordinates.map(
          (c: number[]) => [c[1], c[0]] as [number, number]
        )
        setRotaCoordenadas(coordsRota)
        setInfoRota({
          distancia: (rota.distance / 1000).toFixed(1),
          duracao: Math.round(rota.duration / 60),
          pontos: pontosList.length
        })
        setMostrarMapa(true)
      }
    } catch (e) {
      console.error('Erro OSRM:', e)
    }
  }

  async function optimizarRota() {
    if (!municipioSeleccionado || pontos.length === 0) return
    setCarregando(true)
    setRotaIA('')
    setRotaCoordenadas([])
    setMostrarMapa(false)

    const listaPontos = pontos.map(p =>
      `- ${p.nome} (Estado: ${p.estado}, Capacidade: ${p.capacidade})`
    ).join('\n')

    const res = await fetch('/api/jfs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mensagens: [{
          role: 'user',
          content: `Sou gestor de resíduos do município de ${municipioSeleccionado} em Luanda.
          Tenho ${pontos.length} pontos de recolha:
          ${listaPontos}
          
          Optimiza a rota de recolha considerando:
          1. Priorizar contentores com estado "cheio"
          2. Minimizar distância percorrida
          3. Dar estimativa do tempo total
          
          Apresenta a rota de forma clara e numerada. Não incluas coordenadas geográficas.`
        }]
      })
    })

    const dados = await res.json()
    setRotaIA(dados.resposta)

    await calcularRotaOSRM(pontos)

    await supabase.from('rotas').insert({
      nome: `Rota ${municipioSeleccionado} ${new Date().toLocaleDateString('pt-PT')}`,
      municipio: municipioSeleccionado,
      estado: 'pendente'
    })

    carregarRotas()

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        await enviarNotificacao({
          nome: utilizador?.nome || 'Gestor',
          emailDestino: user.email,
          assunto: `Nova rota optimizada — ${municipioSeleccionado}`,
          mensagem: `O JFS optimizou uma nova rota para o município de ${municipioSeleccionado}.`,
          municipio: municipioSeleccionado
        })
      }
    } catch (e) {
      console.log('Erro email:', e)
    }

    setCarregando(false)
  }

  return (
    <main className="min-h-screen bg-green-950 text-white">
      <nav className="flex items-center justify-between px-8 py-4 bg-green-900 shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-2xl">♻️</span>
          <span className="text-xl font-bold text-green-300">Luanda Limpa</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="/dashboard" className="text-green-200 hover:text-white transition">Dashboard</a>
          <a href="/mapa" className="text-green-200 hover:text-white transition">🗺️ Mapa</a>
          <a href="/dialogo" className="text-green-200 hover:text-white transition">💬 JFS</a>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-green-300 mb-2">🚛 Optimização de Rotas</h1>
        <p className="text-green-400 mb-6">Selecciona um município — o JFS optimiza e a rota aparece no mapa</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* PAINEL ESQUERDO */}
          <div className="flex flex-col gap-4">

            {/* MUNICÍPIOS */}
            <div className="bg-green-900 rounded-2xl p-4">
              <h2 className="text-sm font-bold text-green-300 mb-3">1. Selecciona o município</h2>
              <div className="grid grid-cols-2 gap-2">
                {municipios.map(m => (
                  <button key={m} onClick={() => carregarPontos(m)}
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition ${
                      municipioSeleccionado === m
                        ? 'bg-green-500 text-white'
                        : 'bg-green-800 text-green-300 hover:bg-green-700'
                    }`}>
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* PONTOS */}
            {pontos.length > 0 && (
              <div className="bg-green-900 rounded-2xl p-4">
                <h2 className="text-sm font-bold text-green-300 mb-3">
                  2. Pontos em {municipioSeleccionado} ({pontos.length})
                </h2>
                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                  {pontos.map(p => (
                    <div key={p.id} className="flex items-center gap-2 bg-green-800 rounded-xl px-3 py-2">
                      <span>{p.estado === 'cheio' ? '🔴' : '🟢'}</span>
                      <div>
                        <p className="text-xs font-medium text-green-300">{p.nome}</p>
                        <p className="text-xs text-green-600">{p.estado}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={optimizarRota} disabled={carregando}
                  className="w-full mt-3 bg-green-500 hover:bg-green-400 text-white font-bold py-3 rounded-xl transition disabled:opacity-50">
                  {carregando ? '🤖 JFS a calcular...' : '🤖 Optimizar com JFS'}
                </button>
              </div>
            )}

            {municipioSeleccionado && pontos.length === 0 && (
              <div className="bg-green-900 rounded-2xl p-4 text-center">
                <p className="text-green-400 text-sm">Nenhum ponto em {municipioSeleccionado}.</p>
              </div>
            )}

            {/* INFO DA ROTA */}
            {infoRota && (
              <div className="bg-green-900 rounded-2xl p-4">
                <h2 className="text-sm font-bold text-green-300 mb-3">📊 Informação da rota</h2>
                <div className="flex flex-col gap-2">
                  <div className="bg-green-800 rounded-xl px-3 py-2 flex justify-between">
                    <span className="text-green-400 text-xs">Distância total</span>
                    <span className="text-green-300 font-bold">{infoRota.distancia} km</span>
                  </div>
                  <div className="bg-green-800 rounded-xl px-3 py-2 flex justify-between">
                    <span className="text-green-400 text-xs">Duração estimada</span>
                    <span className="text-green-300 font-bold">{infoRota.duracao} min</span>
                  </div>
                  <div className="bg-green-800 rounded-xl px-3 py-2 flex justify-between">
                    <span className="text-green-400 text-xs">Paragens</span>
                    <span className="text-green-300 font-bold">{infoRota.pontos} pontos</span>
                  </div>
                </div>
              </div>
            )}

            {/* HISTÓRICO */}
            <div className="bg-green-900 rounded-2xl p-4">
              <h2 className="text-sm font-bold text-green-300 mb-3">📋 Histórico</h2>
              {rotas.length === 0 ? (
                <p className="text-green-600 text-xs">Nenhuma rota gerada.</p>
              ) : (
                <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
                  {rotas.slice(0, 6).map(r => (
                    <div key={r.id} className="bg-green-800 rounded-xl px-3 py-2 flex justify-between items-center">
                      <div>
                        <p className="text-xs font-medium text-green-300">{r.nome}</p>
                        <p className="text-xs text-green-600">{r.municipio}</p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-yellow-700 text-yellow-200">
                        {r.estado}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* PAINEL DIREITO — MAPA + IA */}
          <div className="lg:col-span-2 flex flex-col gap-4">

            {/* MAPA */}
            <div className="bg-green-900 rounded-2xl overflow-hidden" style={{height: '400px'}}>
              {mostrarMapa ? (
                <MapaComponent
                  pontos={pontos}
                  rotaCoordenadas={rotaCoordenadas}
                  municipioFiltro={municipioSeleccionado}
                />
              ) : (
                <div className="h-full flex items-center justify-center flex-col gap-3">
                  <span className="text-5xl">🗺️</span>
                  <p className="text-green-400">Selecciona um município e optimiza a rota para ver o mapa</p>
                </div>
              )}
            </div>

            {/* RESPOSTA DA IA */}
            {rotaIA && (
              <div className="bg-green-900 rounded-2xl p-5">
                <h2 className="text-sm font-bold text-green-300 mb-3">🤖 Análise do JFS</h2>
                <div className="text-green-200 text-sm leading-relaxed whitespace-pre-wrap bg-green-800 rounded-xl p-4 max-h-64 overflow-y-auto">
                  {rotaIA}
                </div>
              </div>
            )}

            {carregando && (
              <div className="bg-green-900 rounded-2xl p-6 text-center">
                <div className="flex justify-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}/>
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}/>
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}/>
                </div>
                <p className="text-green-400 text-sm">JFS a optimizar rota e calcular trajectória...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <JFSFlutuante pagina="rotas" nomeUtilizador={utilizador?.nome} papel={utilizador?.papel} />
    </main>
  )
}