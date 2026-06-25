'use client'
import { useEffect, useState, useRef } from 'react'
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
  const [fotoActiva, setFotoActiva] = useState<string | null>(null)
  const [capturando, setCapturando] = useState(false)
  const [fotoCapturada, setFotoCapturada] = useState<string | null>(null)
  const [uploadando, setUploadando] = useState(false)
  const [localizando, setLocalizando] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

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
      capacidade: estado === 'cheio' ? 'normal' : 'cheio',
      ultima_recolha: estado === 'cheio' ? new Date().toISOString() : null
    }).eq('id', id)
    await carregarDados()
    setActualizando(null)
  }

  async function obterLocalizacao() {
    setLocalizando(true)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setNovaLat(pos.coords.latitude.toFixed(6))
          setNovaLong(pos.coords.longitude.toFixed(6))
          setLocalizando(false)
        },
        () => { setLocalizando(false); alert('GPS não disponível') },
        { enableHighAccuracy: true, timeout: 10000 }
      )
    }
  }

  async function adicionarPonto() {
    if (!novoNome || !novaLat || !novaLong) return
    setAdicionando(true)
    const qrCode = `LL-${utilizador.municipio.toUpperCase().replace(' ', '')}-${Date.now()}`
    await supabase.from('pontos_recolha').insert({
      nome: novoNome,
      municipio: utilizador.municipio,
      latitude: parseFloat(novaLat),
      longitude: parseFloat(novaLong),
      estado: 'activo',
      capacidade: 'normal',
      qr_code: qrCode
    })
    setNovoNome(''); setNovaLat(''); setNovaLong('')
    await carregarDados()
    setAdicionando(false)
  }

  async function abrirCamera(pontoId: string) {
    setFotoActiva(pontoId)
    setFotoCapturada(null)
    setCapturando(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
    } catch {
      alert('Câmara não disponível')
      setCapturando(false)
      setFotoActiva(null)
    }
  }

  function tirarFoto() {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0)
      const foto = canvas.toDataURL('image/jpeg', 0.8)
      setFotoCapturada(foto)
      fecharCamera()
    }
  }

  function fecharCamera() {
    streamRef.current?.getTracks().forEach(t => t.stop())
    setCapturando(false)
  }

  async function guardarFoto(pontoId: string) {
    if (!fotoCapturada) return
    setUploadando(true)
    await supabase.from('pontos_recolha').update({
      foto_url: fotoCapturada
    }).eq('id', pontoId)
    await carregarDados()
    setFotoActiva(null)
    setFotoCapturada(null)
    setUploadando(false)
  }

  async function sair() { await supabase.auth.signOut(); window.location.href = '/login' }

  const pontosCheios = pontos.filter(p => p.estado === 'cheio').length

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

      {/* MODAL CÂMARA */}
      {capturando && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col items-center justify-center gap-4">
          <p className="text-white font-bold">📸 Fotografar contentor</p>
          <video ref={videoRef} className="rounded-2xl max-w-sm w-full" autoPlay playsInline/>
          <div className="flex gap-4">
            <button onClick={tirarFoto}
              className="bg-white text-black font-bold px-8 py-3 rounded-full">
              📸 Tirar foto
            </button>
            <button onClick={fecharCamera}
              className="bg-red-600 text-white px-6 py-3 rounded-full">
              ✕ Cancelar
            </button>
          </div>
        </div>
      )}

      {/* MODAL FOTO CAPTURADA */}
      {fotoCapturada && fotoActiva && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col items-center justify-center gap-4">
          <p className="text-white font-bold">Foto capturada — confirmar?</p>
          <img src={fotoCapturada} className="rounded-2xl max-w-sm w-full" alt="Foto do contentor"/>
          <canvas ref={canvasRef} className="hidden"/>
          <div className="flex gap-4">
            <button onClick={() => guardarFoto(fotoActiva)} disabled={uploadando}
              className="bg-green-500 text-white font-bold px-8 py-3 rounded-full disabled:opacity-50">
              {uploadando ? 'A guardar...' : '✅ Guardar foto'}
            </button>
            <button onClick={() => { setFotoCapturada(null); abrirCamera(fotoActiva) }}
              className="bg-yellow-600 text-white px-6 py-3 rounded-full">
              🔄 Repetir
            </button>
            <button onClick={() => { setFotoCapturada(null); setFotoActiva(null) }}
              className="bg-red-600 text-white px-6 py-3 rounded-full">
              ✕ Cancelar
            </button>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden"/>

      <div className="max-w-6xl mx-auto px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-yellow-300">Olá, {utilizador?.nome} 🔧</h1>
          <p className="text-yellow-400 mt-1">Operador de Campo · 📍 {utilizador?.municipio}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-yellow-900 rounded-2xl p-4 text-center">
            <p className="text-yellow-400 text-xs">Total</p>
            <p className="text-3xl font-bold text-yellow-300">{pontos.length}</p>
          </div>
          <div className="bg-red-950 rounded-2xl p-4 text-center border border-red-800">
            <p className="text-red-400 text-xs">Cheios</p>
            <p className="text-3xl font-bold text-red-300">{pontosCheios}</p>
          </div>
          <div className="bg-yellow-900 rounded-2xl p-4 text-center">
            <p className="text-yellow-400 text-xs">Normais</p>
            <p className="text-3xl font-bold text-yellow-300">{pontos.length - pontosCheios}</p>
          </div>
          <div className="bg-yellow-900 rounded-2xl p-4 text-center">
            <p className="text-yellow-400 text-xs">Com foto</p>
            <p className="text-3xl font-bold text-yellow-300">{pontos.filter(p => p.foto_url).length}</p>
          </div>
        </div>

        {/* REGISTAR NOVO CONTENTOR */}
        <div className="bg-yellow-900 rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-bold text-yellow-300 mb-4">➕ Registar novo contentor</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <input value={novoNome} onChange={e => setNovoNome(e.target.value)}
              placeholder="Nome do contentor"
              className="bg-yellow-800 text-white px-4 py-2 rounded-xl border border-yellow-700 focus:outline-none focus:border-yellow-400 placeholder-yellow-600"/>
            <div className="flex gap-2">
              <input value={novaLat} onChange={e => setNovaLat(e.target.value)}
                placeholder="Latitude"
                className="flex-1 bg-yellow-800 text-white px-4 py-2 rounded-xl border border-yellow-700 focus:outline-none focus:border-yellow-400 placeholder-yellow-600"/>
              <button onClick={obterLocalizacao} disabled={localizando}
                className="bg-yellow-600 hover:bg-yellow-500 text-white px-3 py-2 rounded-xl transition disabled:opacity-50 text-sm">
                {localizando ? '...' : '📍'}
              </button>
            </div>
            <input value={novaLong} onChange={e => setNovaLong(e.target.value)}
              placeholder="Longitude"
              className="bg-yellow-800 text-white px-4 py-2 rounded-xl border border-yellow-700 focus:outline-none focus:border-yellow-400 placeholder-yellow-600"/>
          </div>
          <button onClick={adicionarPonto} disabled={adicionando || !novoNome || !novaLat || !novaLong}
            className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-6 py-2 rounded-xl transition disabled:opacity-50">
            {adicionando ? 'A registar...' : '✅ Registar contentor'}
          </button>
        </div>

        {/* LISTA DE CONTENTORES */}
        <div className="bg-yellow-900 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-yellow-300 mb-4">
            📍 Contentores em {utilizador?.municipio}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto">
            {pontos.map(p => (
              <div key={p.id} className={`rounded-2xl p-4 border ${
                p.estado === 'cheio' ? 'bg-red-950 border-red-800' : 'bg-yellow-800 border-yellow-700'
              }`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="font-bold text-yellow-200">{p.nome}</p>
                    <p className="text-xs text-yellow-500 mt-0.5">
                      📍 {p.latitude?.toFixed(4)}, {p.longitude?.toFixed(4)}
                    </p>
                    {p.qr_code && (
                      <p className="text-xs text-yellow-600 mt-0.5">🔲 {p.qr_code}</p>
                    )}
                    {p.ultima_recolha && (
                      <p className="text-xs text-green-500 mt-0.5">
                        ✅ Última recolha: {new Date(p.ultima_recolha).toLocaleDateString('pt-PT')}
                      </p>
                    )}
                  </div>
                  {p.foto_url && (
                    <img src={p.foto_url} alt="Foto" className="w-12 h-12 rounded-xl object-cover ml-2"/>
                  )}
                </div>

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => actualizarEstado(p.id, p.estado)}
                    disabled={actualizando === p.id}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                      p.estado === 'cheio'
                        ? 'bg-red-700 hover:bg-red-600 text-white'
                        : 'bg-green-700 hover:bg-green-600 text-white'
                    } disabled:opacity-50`}
                  >
                    {actualizando === p.id ? '...' : p.estado === 'cheio' ? '🔴 Marcar recolhido' : '🟢 Marcar cheio'}
                  </button>
                  <button
                    onClick={() => abrirCamera(p.id)}
                    className="bg-yellow-600 hover:bg-yellow-500 text-white px-3 py-2 rounded-xl text-xs transition"
                  >
                    📸
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <JFSFlutuante pagina="dashboard" nomeUtilizador={utilizador?.nome} papel="operador" />
    </main>
  )
}