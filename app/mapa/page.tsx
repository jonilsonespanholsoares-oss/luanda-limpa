'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import dynamic from 'next/dynamic'

const MapaComponent = dynamic(() => import('../../components/MapaComponent'), { ssr: false })

export default function Mapa() {
  const [pontos, setPontos] = useState<any[]>([])

  useEffect(() => {
    async function carregarPontos() {
      const { data } = await supabase.from('pontos_recolha').select('*')
      setPontos(data || [])
    }
    carregarPontos()
  }, [])

  return (
    <main className="min-h-screen bg-green-950 text-white">
      <nav className="flex items-center justify-between px-8 py-4 bg-green-900 shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-2xl">♻️</span>
          <span className="text-xl font-bold text-green-300">Luanda Limpa</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="/dashboard" className="text-green-200 hover:text-white transition">Dashboard</a>
          <a href="/dialogo" className="text-green-200 hover:text-white transition">💬 Diálogo</a>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-8 py-8">
        <h1 className="text-3xl font-bold text-green-300 mb-2">🗺️ Mapa de Luanda</h1>
        <p className="text-green-400 mb-6">Pontos de recolha registados: <strong>{pontos.length}</strong></p>

        <div className="rounded-2xl overflow-hidden shadow-xl border border-green-800" style={{height: '500px'}}>
          <MapaComponent pontos={pontos} />
        </div>

        {/* LISTA DE PONTOS */}
        <h2 className="text-xl font-bold text-green-300 mt-8 mb-4">Pontos registados</h2>
        {pontos.length === 0 ? (
          <div className="bg-green-900 rounded-2xl p-8 text-center">
            <span className="text-4xl">📍</span>
            <p className="text-green-400 mt-3">Nenhum ponto registado ainda.</p>
            <a href="/pontos/novo" className="mt-4 inline-block bg-green-500 hover:bg-green-400 text-white px-6 py-2 rounded-full transition">
              Adicionar ponto
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pontos.map(p => (
              <div key={p.id} className="bg-green-900 rounded-2xl p-4 flex items-center gap-4">
                <span className="text-3xl">📍</span>
                <div>
                  <h3 className="font-bold text-green-300">{p.nome}</h3>
                  <p className="text-green-400 text-sm">{p.municipio} · Estado: {p.estado}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}