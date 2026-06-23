'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function Registo() {
  const [passo, setPasso] = useState(1)
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [telefone, setTelefone] = useState('')
  const [bi, setBi] = useState('')
  const [municipio, setMunicipio] = useState('')
  const [papel, setPapel] = useState('')
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)
  const [carregando, setCarregando] = useState(false)

  const municipios = [
    'Belas', 'Cacuaco', 'Cazenga', 'Icolo e Bengo',
    'Kilamba Kiaxi', 'Luanda', 'Maianga', 'Mulenvos',
    'Quissama', 'Sambizanga', 'Talatona', 'Viana'
  ]

  const papeis = [
    {
      valor: 'admin',
      titulo: 'Administrador',
      descricao: 'Gestão total do sistema, todos os municípios',
      icone: '👑'
    },
    {
      valor: 'gestor',
      titulo: 'Gestor Municipal',
      descricao: 'Gestão de um município específico',
      icone: '🏛️'
    },
    {
      valor: 'operador',
      titulo: 'Operador de Campo',
      descricao: 'Registo e monitorização de contentores',
      icone: '🔧'
    },
    {
      valor: 'camionista',
      titulo: 'Camionista',
      descricao: 'Recolha de lixo e execução de rotas',
      icone: '🚛'
    }
  ]

  async function registar() {
    if (!nome || !email || !senha || !municipio || !papel) {
      setErro('Preenche todos os campos obrigatórios.')
      return
    }
    setCarregando(true)
    setErro('')

    const { data, error } = await supabase.auth.signUp({ email, password: senha })
    if (error) {
      setErro('Erro: ' + error.message)
      setCarregando(false)
      return
    }

    if (data.user) {
      await supabase.from('perfis').insert({
        id: data.user.id,
        nome,
        email,
        telefone,
        bi,
        municipio,
        papel,
        activo: true
      })
    }

    setSucesso(true)
    setCarregando(false)
  }

  if (sucesso) return (
    <main className="min-h-screen bg-green-950 flex items-center justify-center px-4">
      <div className="bg-green-900 rounded-2xl p-8 w-full max-w-md text-center shadow-xl">
        <span className="text-6xl">✅</span>
        <h2 className="text-2xl font-bold text-green-300 mt-4">Conta criada!</h2>
        <p className="text-green-400 mt-2">Verifica o teu email para confirmar a conta.</p>
        <p className="text-green-500 text-sm mt-1">Papel: {papeis.find(p => p.valor === papel)?.titulo}</p>
        <a href="/login" className="mt-6 inline-block bg-green-500 text-white px-6 py-3 rounded-xl hover:bg-green-400 transition">
          Ir para Login
        </a>
      </div>
    </main>
  )

  return (
    <main className="min-h-screen bg-green-950 flex items-center justify-center px-4 py-10">
      <div className="bg-green-900 rounded-2xl p-8 w-full max-w-lg shadow-xl">

        <div className="flex flex-col items-center mb-6">
          <span className="text-5xl mb-3">♻️</span>
          <h1 className="text-2xl font-bold text-green-300">Criar conta</h1>
          <p className="text-green-400 text-sm mt-1">Luanda Limpa — Sistema de Gestão</p>
        </div>

        {/* INDICADOR DE PASSO */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map(p => (
            <div key={p} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition ${
                passo >= p ? 'bg-green-500 text-white' : 'bg-green-800 text-green-500'
              }`}>
                {p}
              </div>
              {p < 3 && <div className={`w-12 h-1 rounded ${passo > p ? 'bg-green-500' : 'bg-green-800'}`}/>}
            </div>
          ))}
        </div>

        {/* PASSO 1 — TIPO DE PERFIL */}
        {passo === 1 && (
          <div>
            <h2 className="text-lg font-bold text-green-300 mb-4">Qual é a tua função?</h2>
            <div className="grid grid-cols-1 gap-3">
              {papeis.map(p => (
                <button
                  key={p.valor}
                  onClick={() => setPapel(p.valor)}
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 transition text-left ${
                    papel === p.valor
                      ? 'border-green-400 bg-green-800'
                      : 'border-green-800 bg-green-800 hover:border-green-600'
                  }`}
                >
                  <span className="text-3xl">{p.icone}</span>
                  <div>
                    <p className="font-bold text-green-300">{p.titulo}</p>
                    <p className="text-green-500 text-sm">{p.descricao}</p>
                  </div>
                  {papel === p.valor && <span className="ml-auto text-green-400">✓</span>}
                </button>
              ))}
            </div>
            <button
              onClick={() => { if (!papel) { setErro('Selecciona o teu papel.'); return; } setErro(''); setPasso(2) }}
              className="w-full mt-6 bg-green-500 hover:bg-green-400 text-white font-bold py-3 rounded-xl transition"
            >
              Continuar →
            </button>
            {erro && <p className="text-red-400 text-sm mt-2 text-center">{erro}</p>}
          </div>
        )}

        {/* PASSO 2 — DADOS PESSOAIS */}
        {passo === 2 && (
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-bold text-green-300 mb-2">Dados pessoais</h2>

            <div>
              <label className="text-green-300 text-sm mb-1 block">Nome completo *</label>
              <input type="text" value={nome} onChange={e => setNome(e.target.value)}
                placeholder="O teu nome completo"
                className="w-full bg-green-800 text-white px-4 py-3 rounded-xl border border-green-700 focus:outline-none focus:border-green-400 placeholder-green-600"/>
            </div>

            <div>
              <label className="text-green-300 text-sm mb-1 block">Email *</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="o.teu@email.com"
                className="w-full bg-green-800 text-white px-4 py-3 rounded-xl border border-green-700 focus:outline-none focus:border-green-400 placeholder-green-600"/>
            </div>

            <div>
              <label className="text-green-300 text-sm mb-1 block">Senha *</label>
              <input type="password" value={senha} onChange={e => setSenha(e.target.value)}
                placeholder="mínimo 6 caracteres"
                className="w-full bg-green-800 text-white px-4 py-3 rounded-xl border border-green-700 focus:outline-none focus:border-green-400 placeholder-green-600"/>
            </div>

            <div>
              <label className="text-green-300 text-sm mb-1 block">Telefone</label>
              <input type="tel" value={telefone} onChange={e => setTelefone(e.target.value)}
                placeholder="+244 9XX XXX XXX"
                className="w-full bg-green-800 text-white px-4 py-3 rounded-xl border border-green-700 focus:outline-none focus:border-green-400 placeholder-green-600"/>
            </div>

            <div>
              <label className="text-green-300 text-sm mb-1 block">Nº Bilhete de Identidade</label>
              <input type="text" value={bi} onChange={e => setBi(e.target.value)}
                placeholder="Ex: 006XXXXXXLA041"
                className="w-full bg-green-800 text-white px-4 py-3 rounded-xl border border-green-700 focus:outline-none focus:border-green-400 placeholder-green-600"/>
            </div>

            <div className="flex gap-3 mt-2">
              <button onClick={() => setPasso(1)}
                className="flex-1 border border-green-600 text-green-300 py-3 rounded-xl hover:bg-green-800 transition">
                ← Voltar
              </button>
              <button
                onClick={() => { if (!nome || !email || !senha) { setErro('Preenche os campos obrigatórios.'); return; } setErro(''); setPasso(3) }}
                className="flex-1 bg-green-500 hover:bg-green-400 text-white font-bold py-3 rounded-xl transition">
                Continuar →
              </button>
            </div>
            {erro && <p className="text-red-400 text-sm text-center">{erro}</p>}
          </div>
        )}

        {/* PASSO 3 — MUNICÍPIO */}
        {passo === 3 && (
          <div>
            <h2 className="text-lg font-bold text-green-300 mb-4">Selecciona o teu município</h2>
            <div className="grid grid-cols-2 gap-2">
              {municipios.map(m => (
                <button key={m} onClick={() => setMunicipio(m)}
                  className={`px-3 py-3 rounded-xl text-sm font-medium transition ${
                    municipio === m ? 'bg-green-500 text-white' : 'bg-green-800 text-green-300 hover:bg-green-700'
                  }`}>
                  {m}
                </button>
              ))}
            </div>

            {erro && <p className="text-red-400 text-sm mt-3 text-center">{erro}</p>}

            <div className="flex gap-3 mt-6">
              <button onClick={() => setPasso(2)}
                className="flex-1 border border-green-600 text-green-300 py-3 rounded-xl hover:bg-green-800 transition">
                ← Voltar
              </button>
              <button onClick={registar} disabled={carregando}
                className="flex-1 bg-green-500 hover:bg-green-400 text-white font-bold py-3 rounded-xl transition disabled:opacity-50">
                {carregando ? 'A criar...' : '✓ Criar conta'}
              </button>
            </div>

            <p className="text-green-400 text-sm text-center mt-4">
              Já tens conta?{' '}
              <a href="/login" className="text-green-300 hover:text-white underline">Entrar</a>
            </p>
          </div>
        )}

      </div>
    </main>
  )
}