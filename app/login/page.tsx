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
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) {
      setErro('Email ou senha incorrectos.')
    } else {
      window.location.href = '/dashboard'
    }
    setCarregando(false)
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
              placeholder="••••••••"
              className="w-full bg-green-800 text-white px-4 py-3 rounded-xl border border-green-700 focus:outline-none focus:border-green-400 placeholder-green-600"
            />
          </div>

          {erro && <p className="text-red-400 text-sm">{erro}</p>}

          <button
            onClick={entrar}
            disabled={carregando}
            className="bg-green-500 hover:bg-green-400 text-white font-semibold py-3 rounded-xl transition mt-2 disabled:opacity-50"
          >
            {carregando ? 'A entrar...' : 'Entrar'}
          </button>

          <p className="text-green-400 text-sm text-center">
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