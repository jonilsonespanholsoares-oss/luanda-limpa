'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function Registo() {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [municipio, setMunicipio] = useState('')
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)
  const [carregando, setCarregando] = useState(false)

  const municipios = [
    'Belas', 'Cacuaco', 'Cazenga', 'Icolo e Bengo',
    'Kilamba Kiaxi', 'Luanda', 'Maianga', 'Mulenvos',
    'Quissama', 'Sambizanga', 'Talatona', 'Viana'
  ]

  async function registar() {
    setCarregando(true)
    setErro('')
    const { data, error } = await supabase.auth.signUp({ email, password: senha })
    if (error) {
      setErro('Erro ao criar conta: ' + error.message)
      setCarregando(false)
      return
    }
    if (data.user) {
      await supabase.from('perfis').insert({
        id: data.user.id,
        nome,
        email,
        municipio,
        papel: 'funcionario'
      })
    }
    setSucesso(true)
    setCarregando(false)
  }

  if (sucesso) return (
    <main className="min-h-screen bg-green-950 flex items-center justify-center px-4">
      <div className="bg-green-900 rounded-2xl p-8 w-full max-w-md text-center shadow-xl">
        <span className="text-5xl">✅</span>
        <h2 className="text-2xl font-bold text-green-300 mt-4">Conta criada!</h2>
        <p className="text-green-400 mt-2">Verifica o teu email para confirmar a conta.</p>
        <a href="/login" className="mt-6 inline-block bg-green-500 text-white px-6 py-3 rounded-xl hover:bg-green-400 transition">
          Ir para Login
        </a>
      </div>
    </main>
  )

  return (
    <main className="min-h-screen bg-green-950 flex items-center justify-center px-4">
      <div className="bg-green-900 rounded-2xl p-8 w-full max-w-md shadow-xl">

        <div className="flex flex-col items-center mb-8">
          <span className="text-5xl mb-3">♻️</span>
          <h1 className="text-2xl font-bold text-green-300">Criar conta</h1>
          <p className="text-green-400 text-sm mt-1">Junta-te ao Luanda Limpa</p>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-green-300 text-sm mb-1 block">Nome completo</label>
            <input
              type="text"
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="O teu nome"
              className="w-full bg-green-800 text-white px-4 py-3 rounded-xl border border-green-700 focus:outline-none focus:border-green-400 placeholder-green-600"
            />
          </div>

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
              placeholder="mínimo 6 caracteres"
              className="w-full bg-green-800 text-white px-4 py-3 rounded-xl border border-green-700 focus:outline-none focus:border-green-400 placeholder-green-600"
            />
          </div>

          <div>
            <label className="text-green-300 text-sm mb-1 block">Município</label>
            <select
              value={municipio}
              onChange={e => setMunicipio(e.target.value)}
              className="w-full bg-green-800 text-white px-4 py-3 rounded-xl border border-green-700 focus:outline-none focus:border-green-400"
            >
              <option value="">Selecciona o município</option>
              {municipios.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {erro && <p className="text-red-400 text-sm">{erro}</p>}

          <button
            onClick={registar}
            disabled={carregando}
            className="bg-green-500 hover:bg-green-400 text-white font-semibold py-3 rounded-xl transition mt-2 disabled:opacity-50"
          >
            {carregando ? 'A criar conta...' : 'Criar conta'}
          </button>

          <p className="text-green-400 text-sm text-center">
            Já tens conta?{' '}
            <a href="/login" className="text-green-300 hover:text-white underline">
              Entrar
            </a>
          </p>
        </div>
      </div>
    </main>
  )
}