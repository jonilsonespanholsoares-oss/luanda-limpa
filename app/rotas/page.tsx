'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { enviarNotificacao } from '../../lib/email'

export default function Rotas() {
  const [municipioSeleccionado, setMunicipioSeleccionado] = useState('')
  const [pontos, setPontos] = useState<any[]>([])
  const [rotaIA, setRotaIA] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [rotas, setRotas] = useState<any[]>([])
  const [utilizador, setUtilizador] = useState<any>(null)

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
    const { data } = await supabase
      .from('pontos_recolha')
      .select('*')
      .eq('municipio', municipio)
    setPontos(data || [])
    setRotaIA('')
  }

  async function optimizarRota() {
    if (!municipioSeleccionado || pontos.length === 0) return
    setCarregando(true)
    setRotaIA('')

    const listaPontos = pontos.map(p =>
      `- ${p.nome} (Lat: ${p.latitude}, Long: ${p.longitude}, Estado: ${p.estado})`
    ).join('\n')

    const res = await fetch('/api/jfs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mensagens: [{
          role: 'user',
          content: `Sou gestor de resíduos do município de ${municipioSeleccionado} em Luanda. 
          Tenho os seguintes pontos de recolha:
          ${listaPontos}
          
          Por favor optimiza a rota de recolha para o camião de lixo, considerando:
          1. Começar pelo ponto mais a norte
          2. Priorizar contentores com estado "cheio"
          3. Minimizar a distância total percorrida
          4. Dar uma estimativa do tempo total
          
          Apresenta a rota optimizada de forma clara e numerada.`
        }]
      })
    })

    const dados = await res.json()
    setRotaIA(dados.resposta)

    await supabase.from('rotas').insert({
      nome: `Rota ${municipioSeleccionado} — ${new Date().toLocaleDateString('pt-PT')}`,
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
        console.log('Email enviado para:', user.email)
      }
    } catch (e) {
      console.log('Erro ao enviar email:', e)
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

      <div className="max-w-6xl mx-auto px-8 py-10">
        <h1 className="text-3xl font-bold text-green-300 mb-2">🚛 Optimização de Rotas</h1>
        <p className="text-green-400 mb-8">Selecciona um município e o JFS vai optimizar a rota de recolha</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          <div className="flex flex-col gap-6">
            <div className="bg-green-900 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-green-300 mb-4">1. Selecciona o município</h2>
              <div className="grid grid-cols-2 gap-2">
                {municipios.map(m => (
                  <button
                    key={m}
                    onClick={() => carregarPontos(m)}
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition ${
                      municipioSeleccionado === m
                        ? 'bg-green-500 text-white'
                        : 'bg-green-800 text-green-300 hover:bg-green-700'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {pontos.length > 0 && (
              <div className="bg-green-900 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-green-300 mb-4">
                  2. Pontos em {municipioSeleccionado} ({pontos.length})
                </h2>
                <div className="flex flex-col gap-2">
                  {pontos.map(p => (
                    <div key={p.id} className="flex items-center gap-3 bg-green-800 rounded-xl px-4 py-2">
                      <span>{p.estado === 'cheio' ? '🔴' : '🟢'}</span>
                      <div>
                        <p className="text-sm font-medium text-green-300">{p.nome}</p>
                        <p className="text-xs text-green-500">{p.estado} · {p.capacidade}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={optimizarRota}
                  disabled={carregando}
                  className="w-full mt-4 bg-green-500 hover:bg-green-400 text-white font-bold py-3 rounded-xl transition disabled:opacity-50"
                >
                  {carregando ? '🤖 JFS a calcular rota...' : '🤖 Optimizar rota com JFS'}
                </button>
              </div>
            )}

            {municipioSeleccionado && pontos.length === 0 && (
              <div className="bg-green-900 rounded-2xl p-6 text-center">
                <p className="text-green-400">Nenhum ponto registado em {municipioSeleccionado}.</p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-6">
            {rotaIA && (
              <div className="bg-green-900 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-green-300 mb-4">🤖 Rota optimizada pelo JFS</h2>
                <div className="text-green-200 text-sm leading-relaxed whitespace-pre-wrap bg-green-800 rounded-xl p-4">
                  {rotaIA}
                </div>
              </div>
            )}

            <div className="bg-green-900 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-green-300 mb-4">📋 Histórico de rotas</h2>
              {rotas.length === 0 ? (
                <p className="text-green-500 text-sm">Nenhuma rota gerada ainda.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {rotas.slice(0, 8).map(r => (
                    <div key={r.id} className="flex items-center justify-between bg-green-800 rounded-xl px-4 py-2">
                      <div>
                        <p className="text-sm font-medium text-green-300">{r.nome}</p>
                        <p className="text-xs text-green-500">{r.municipio}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        r.estado === 'concluida'
                          ? 'bg-green-600 text-white'
                          : 'bg-yellow-700 text-yellow-200'
                      }`}>
                        {r.estado}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}