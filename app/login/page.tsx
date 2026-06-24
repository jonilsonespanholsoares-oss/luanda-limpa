'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function entrar() {
    setCarregando(true)
    setErro('')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) {
      setErro('Email ou senha incorrectos.')
      setCarregando(false)
      return
    }
    if (data.user) {
      const { data: perfil } = await supabase
        .from('perfis').select('papel').eq('id', data.user.id).single()

      if (perfil?.papel === 'admin') window.location.href = '/dashboard'
      else if (perfil?.papel === 'gestor') window.location.href = '/dashboard-gestor'
      else if (perfil?.papel === 'operador') window.location.href = '/dashboard-operador'
      else if (perfil?.papel === 'camionista') window.location.href = '/dashboard-camionista'
      else window.location.href = '/dashboard'
    }
    setCarregando(false)
  }

  function teclaEnter(e: React.KeyboardEvent) {
    if (e.key === 'Enter') entrar()
  }

  return (
    <main className="min-h-screen bg-green-950 flex items-center justify-center px-4">
      <div className="bg-green-900 rounded-2xl p-8 w-full max-w-md shadow-xl">

        <div className="flex flex-col items-center mb-8">
          <span className="text-5xl mb-3">♻️</span>
          <h1 className="text-2xl font-bold text-green-300">Luanda Limpa</h1>
          <p className="text-green-400 text-sm mt-1">Entra na tua conta</p>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-green-300 text-sm mb-1 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={teclaEnter}
              placeholder="o.teu@email.com"
              className="w-full bg-green-800 text-white px-4 py-3 rounded-xl border border-green-700 focus:outline-none focus:border-green-400 placeholder-green-600"
            />
          </div>

          <div>
            <label className="text-green-300 text-sm mb-1 block">Senha</label>
            <input
              type="password"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              onKeyDown={teclaEnter}
              placeholder="••••••••"
              className="w-full bg-green-800 text-white px-4 py-3 rounded-xl border border-green-700 focus:outline-none focus:border-green-400 placeholder-green-600"
            />
          </div>

          {erro && (
            <div className="bg-red-900 border border-red-700 rounded-xl px-4 py-3">
              <p className="text-red-300 text-sm">{erro}</p>
            </div>
          )}

          <button
            onClick={entrar}
            disabled={carregando}
            className="bg-green-500 hover:bg-green-400 text-white font-semibold py-3 rounded-xl transition mt-2 disabled:opacity-50"
          >
            {carregando ? 'A entrar...' : 'Entrar'}
          </button>

          <div className="flex flex-col gap-2 mt-2">
            <div className="flex items-center gap-3 bg-green-800 rounded-xl px-4 py-2">
              <span>👑</span>
              <p className="text-green-400 text-xs">Admin → Painel completo do sistema</p>
            </div>
            <div className="flex items-center gap-3 bg-green-800 rounded-xl px-4 py-2">
              <span>🏛️</span>
              <p className="text-green-400 text-xs">Gestor → Painel do município</p>
            </div>
            <div className="flex items-center gap-3 bg-green-800 rounded-xl px-4 py-2">
              <span>🔧</span>
              <p className="text-green-400 text-xs">Operador → Registo de contentores</p>
            </div>
            <div className="flex items-center gap-3 bg-green-800 rounded-xl px-4 py-2">
              <span>🚛</span>
              <p className="text-green-400 text-xs">Camionista → Rotas e confirmações</p>
            </div>
          </div>

          <p className="text-green-400 text-sm text-center mt-2">
            Não tens conta?{' '}
            <a href="/registo" className="text-green-300 hover:text-white underline">
              Criar conta
            </a>
          </p>
        </div>
      </div>
    </main>
  )
}