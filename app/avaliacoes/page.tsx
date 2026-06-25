'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import dynamic from 'next/dynamic'
const JFSFlutuante = dynamic(() => import('../../components/JFSFlutuante'), { ssr: false })

export default function Avaliacoes() {
  const [utilizador, setUtilizador] = useState<any>(null)
  const [avaliacoes, setAvaliacoes] = useState<any[]>([])
  const [municipio, setMunicipio] = useState('')
  const [bairro, setBairro] = useState('')
  const [nota, setNota] = useState(0)
  const [comentario, setComentario] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [mediaNotas, setMediaNotas] = useState<Record<string, number>>({})

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
    await carregarAvaliacoes()
  }

  async function carregarAvaliacoes() {
    const { data } = await supabase.from('avaliacoes')
      .select('*').order('criado_em', { ascending: false })
    setAvaliacoes(data || [])

    const medias: Record<string, number> = {}
    municipios.forEach(m => {
      const avsMunicipio = (data || []).filter((a: any) => a.municipio === m)
      if (avsMunicipio.length > 0) {
        medias[m] = avsMunicipio.reduce((sum: number, a: any) => sum + a.nota, 0) / avsMunicipio.length
      }
    })
    setMediaNotas(medias)
  }

  async function enviarAvaliacao() {
    if (!municipio || nota === 0) return
    setEnviando(true)
    await supabase.from('avaliacoes').insert({
      municipio,
      bairro,
      nota,
      comentario,
      utilizador_id: utilizador.id
    })
    setNota(0); setComentario(''); setBairro('')
    setSucesso(true)
    setTimeout(() => setSucesso(false), 3000)
    await carregarAvaliacoes()
    setEnviando(false)
  }

  function estrelas(n: number) {
    return '⭐'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n))
  }

  return (
    <main className="min-h-screen bg-green-950 text-white">
      <nav className="flex items-center justify-between px-8 py-4 bg-green-900 shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-2xl">♻️</span>
          <span className="text-xl font-bold text-green-300">Luanda Limpa</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="/dashboard" className="text-green-200 hover:text-white">Dashboard</a>
          <a href="/relatorios" className="text-green-200 hover:text-white">📊 Relatórios</a>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-8 py-8">
        <h1 className="text-3xl font-bold text-green-300 mb-2">⭐ Avaliações de Limpeza</h1>
        <p className="text-green-400 mb-8">Avalia a limpeza dos municípios de Luanda</p>

        {sucesso && (
          <div className="bg-green-700 border border-green-500 rounded-2xl px-6 py-4 mb-6 text-center">
            <p className="text-white font-bold">✅ Avaliação enviada com sucesso!</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* FORMULÁRIO */}
          <div className="bg-green-900 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-green-300 mb-4">➕ Nova avaliação</h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-green-300 text-sm mb-1 block">Município</label>
                <select value={municipio} onChange={e => setMunicipio(e.target.value)}
                  className="w-full bg-green-800 text-white px-3 py-2 rounded-xl border border-green-700 focus:outline-none text-sm">
                  <option value="">Selecciona...</option>
                  {municipios.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="text-green-300 text-sm mb-1 block">Bairro (opcional)</label>
                <input value={bairro} onChange={e => setBairro(e.target.value)}
                  placeholder="Ex: Sambizanga Centro"
                  className="w-full bg-green-800 text-white px-3 py-2 rounded-xl border border-green-700 focus:outline-none text-sm placeholder-green-600"/>
              </div>
              <div>
                <label className="text-green-300 text-sm mb-2 block">Nota de limpeza</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} onClick={() => setNota(n)}
                      className={`text-2xl transition ${nota >= n ? 'opacity-100' : 'opacity-30'}`}>
                      ⭐
                    </button>
                  ))}
                </div>
                <p className="text-green-500 text-xs mt-1">
                  {nota === 1 ? 'Muito mau' : nota === 2 ? 'Mau' : nota === 3 ? 'Razoável' : nota === 4 ? 'Bom' : nota === 5 ? 'Excelente' : 'Clica para avaliar'}
                </p>
              </div>
              <div>
                <label className="text-green-300 text-sm mb-1 block">Comentário</label>
                <textarea value={comentario} onChange={e => setComentario(e.target.value)}
                  placeholder="Descreve a situação de limpeza..."
                  rows={3}
                  className="w-full bg-green-800 text-white px-3 py-2 rounded-xl border border-green-700 focus:outline-none text-sm placeholder-green-600 resize-none"/>
              </div>
              <button onClick={enviarAvaliacao} disabled={enviando || !municipio || nota === 0}
                className="bg-green-500 hover:bg-green-400 text-white font-bold py-3 rounded-xl transition disabled:opacity-50">
                {enviando ? 'A enviar...' : '⭐ Enviar avaliação'}
              </button>
            </div>
          </div>

          {/* MÉDIAS POR MUNICÍPIO */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="bg-green-900 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-green-300 mb-4">📊 Média por município</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {municipios.map(m => (
                  <div key={m} className="bg-green-800 rounded-xl p-3 text-center">
                    <p className="text-green-300 text-sm font-medium">{m}</p>
                    {mediaNotas[m] ? (
                      <>
                        <p className="text-lg">{estrelas(mediaNotas[m])}</p>
                        <p className="text-green-400 text-xs">{mediaNotas[m].toFixed(1)}/5</p>
                      </>
                    ) : (
                      <p className="text-green-600 text-xs mt-1">Sem avaliações</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-green-900 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-green-300 mb-4">💬 Avaliações recentes</h2>
              {avaliacoes.length === 0 ? (
                <p className="text-green-500 text-sm">Nenhuma avaliação ainda.</p>
              ) : (
                <div className="flex flex-col gap-3 max-h-64 overflow-y-auto">
                  {avaliacoes.slice(0, 10).map(a => (
                    <div key={a.id} className="bg-green-800 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-bold text-green-300 text-sm">{a.municipio}{a.bairro ? ` · ${a.bairro}` : ''}</p>
                        <span className="text-sm">{estrelas(a.nota)}</span>
                      </div>
                      {a.comentario && <p className="text-green-400 text-xs">{a.comentario}</p>}
                      <p className="text-green-600 text-xs mt-1">{new Date(a.criado_em).toLocaleDateString('pt-PT')}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <JFSFlutuante pagina="dashboard" nomeUtilizador={utilizador?.nome} papel={utilizador?.papel} />
    </main>
  )
}