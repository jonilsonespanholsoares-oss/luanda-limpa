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
  const [posicaoActual, setPosicaoActual] = useState<[number, number] | null>(null)
  const [verificando, setVerificando] = useState<string | null>(null)
  const [verificacoes, setVerificacoes] = useState<Record<string, any>>({})

  useEffect(() => { carregarDados() }, [])

  useEffect(() => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        pos => setPosicaoActual([pos.coords.latitude, pos.coords.longitude]),
        err => console.log('GPS:', err),
        { enableHighAccuracy: true, timeout: 10000 }
      )
      return () => navigator.geolocation.clearWatch(watchId)
    }
  }, [])

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
    setConfirmados([])
    setVerificacoes({})

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

  function calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371000
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2)
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  }

  async function verificarLocalizacao(ponto: any) {
    setVerificando(ponto.id)

    if (!posicaoActual) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async pos => {
            const lat = pos.coords.latitude
            const lon = pos.coords.longitude
            setPosicaoActual([lat, lon])
            await processarVerificacao(ponto, lat, lon)
          },
          () => {
            setVerificacoes(prev => ({ ...prev, [ponto.id]: { estado: 'erro', msg: 'GPS não disponível' } }))
            setVerificando(null)
          },
          { enableHighAccuracy: true, timeout: 10000 }
        )
      }
      return
    }

    await processarVerificacao(ponto, posicaoActual[0], posicaoActual[1])
  }

  async function processarVerificacao(ponto: any, lat: number, lon: number) {
    const distancia = calcularDistancia(lat, lon, ponto.latitude, ponto.longitude)
    const raio = 500

    if (distancia <= raio) {
      await confirmarRecolha(ponto.id, ponto.nome, lat, lon, distancia)
      setVerificacoes(prev => ({
        ...prev,
        [ponto.id]: { estado: 'confirmado', distancia: Math.round(distancia), msg: '✅ Localização verificada!' }
      }))
    } else {
      setVerificacoes(prev => ({
        ...prev,
        [ponto.id]: { estado: 'longe', distancia: Math.round(distancia), msg: `⚠️ Estás a ${Math.round(distancia)}m do ponto` }
      }))
    }
    setVerificando(null)
  }

  async function confirmarRecolha(pontoId: string, pontoNome: string, lat: number, lon: number, distancia: number) {
    await supabase.from('pontos_recolha')
      .update({ estado: 'activo', capacidade: 'normal' }).eq('id', pontoId)

    await supabase.from('mensagens').insert({
      utilizador_id: utilizador.id,
      conteudo: `✅ Recolha confirmada por GPS: "${pontoNome}" em ${utilizador.municipio}\n📍 Posição: ${lat.toFixed(4)}, ${lon.toFixed(4)}\n📏 Distância ao ponto: ${Math.round(distancia)}m\n🕐 ${new Date().toLocaleTimeString('pt-PT')}`,
      tipo: 'sistema',
      sala: 'publica',
      eliminada: false
    })

    setConfirmados(prev => [...prev, pontoId])
  }

  async function sair() { await supabase.auth.signOut(); window.location.href = '/login' }

  const pontosRecolhidos = confirmados.length
  const totalPontos = pontos.length
  const progresso = totalPontos > 0 ? Math.round((pontosRecolhidos / totalPontos) * 100) : 0

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <nav className="flex items-center justify-between px-8 py-4 bg-gray-900 shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-2xl">♻️</span>
          <span className="text-xl font-bold text-gray-300">Luanda Limpa</span>
          <span className="ml-2 bg-gray-700 text-gray-200 text-xs px-2 py-1 rounded-full">🚛 Camionista</span>
        </div>
        <div className="flex items-center gap-4">
          {posicaoActual && (
            <span className="text-green-400 text-xs flex items-center gap-1">
              📍 GPS activo
            </span>
          )}
          <a href="/dialogo" className="text-gray-200 hover:text-white">💬 Diálogo</a>
          <button onClick={sair} className="bg-red-700 hover:bg-red-600 text-white px-4 py-1 rounded-full text-sm">Sair</button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-300">Olá, {utilizador?.nome} 🚛</h1>
            <p className="text-gray-400 mt-1">Camionista · 📍 {utilizador?.municipio}</p>
          </div>
          {rotaActiva && totalPontos > 0 && (
            <div className="bg-gray-900 rounded-2xl px-6 py-3 text-center">
              <p className="text-gray-400 text-xs mb-1">Progresso da rota</p>
              <div className="w-32 bg-gray-700 rounded-full h-3 mb-1">
                <div className="bg-green-500 h-3 rounded-full transition-all" style={{width: `${progresso}%`}}/>
              </div>
              <p className="text-green-300 font-bold text-sm">{pontosRecolhidos}/{totalPontos} · {progresso}%</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* PAINEL ESQUERDO */}
          <div className="flex flex-col gap-4">

            {/* ROTAS */}
            <div className="bg-gray-900 rounded-2xl p-4">
              <h2 className="text-sm font-bold text-gray-300 mb-3">🗓️ Rotas disponíveis</h2>
              {rotas.length === 0 ? (
                <p className="text-gray-500 text-sm">Nenhuma rota disponível.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {rotas.slice(0, 5).map(r => (
                    <button key={r.id} onClick={() => activarRota(r)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-sm transition ${
                        rotaActiva?.id === r.id
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}>
                      <p className="font-medium">{r.nome}</p>
                      <p className="text-xs opacity-70">{new Date(r.criado_em).toLocaleDateString('pt-PT')}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* INFO ROTA */}
            {infoRota && (
              <div className="bg-gray-900 rounded-2xl p-4">
                <h2 className="text-sm font-bold text-gray-300 mb-3">📊 Info da rota</h2>
                <div className="flex flex-col gap-2">
                  {[
                    { label: 'Distância', valor: `${infoRota.distancia} km` },
                    { label: 'Duração', valor: `${infoRota.duracao} min` },
                    { label: 'Paragens', valor: `${infoRota.pontos} pontos` }
                  ].map((item, i) => (
                    <div key={i} className="bg-gray-800 rounded-xl px-3 py-2 flex justify-between">
                      <span className="text-gray-400 text-xs">{item.label}</span>
                      <span className="text-gray-300 font-bold text-xs">{item.valor}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CONFIRMAÇÃO GPS */}
            {pontos.length > 0 && (
              <div className="bg-gray-900 rounded-2xl p-4">
                <h2 className="text-sm font-bold text-gray-300 mb-1">📍 Confirmar recolhas</h2>
                <p className="text-gray-500 text-xs mb-3">GPS verifica se estás no local correcto</p>
                <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                  {pontos.map(p => (
                    <div key={p.id} className={`rounded-xl px-3 py-2 ${
                      confirmados.includes(p.id) ? 'bg-green-900 border border-green-700' : 'bg-gray-800'
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-medium text-gray-300">{p.nome}</p>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                          p.estado === 'cheio' ? 'bg-red-700 text-red-200' : 'bg-green-700 text-green-200'
                        }`}>
                          {p.estado === 'cheio' ? '🔴' : '🟢'}
                        </span>
                      </div>

                      {verificacoes[p.id] && (
                        <p className={`text-xs mb-1 ${
                          verificacoes[p.id].estado === 'confirmado' ? 'text-green-400' :
                          verificacoes[p.id].estado === 'longe' ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {verificacoes[p.id].msg}
                        </p>
                      )}

                      <button
                        onClick={() => verificarLocalizacao(p)}
                        disabled={verificando === p.id || confirmados.includes(p.id)}
                        className={`w-full py-1.5 rounded-lg text-xs font-medium transition ${
                          confirmados.includes(p.id)
                            ? 'bg-green-700 text-green-300 cursor-default'
                            : verificacoes[p.id]?.estado === 'longe'
                            ? 'bg-yellow-700 hover:bg-yellow-600 text-white'
                            : 'bg-green-600 hover:bg-green-500 text-white'
                        } disabled:opacity-50`}
                      >
                        {confirmados.includes(p.id) ? '✅ Recolhido'
                          : verificando === p.id ? '📍 A verificar GPS...'
                          : verificacoes[p.id]?.estado === 'longe' ? '🔄 Tentar novamente'
                          : '📍 Verificar e confirmar'}
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
                  <p className="text-gray-400 text-center px-8">Selecciona uma rota para ver o percurso no mapa e confirmar as recolhas por GPS</p>
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