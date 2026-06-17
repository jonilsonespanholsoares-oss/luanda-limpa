export default function Home() {
  return (
    <main className="min-h-screen bg-green-950 text-white">
      
      {/* NAVBAR */}
      <nav className="flex items-center justify-between px-8 py-4 bg-green-900 shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-2xl">♻️</span>
          <span className="text-xl font-bold text-green-300">Luanda Limpa</span>
        </div>
        <div className="flex gap-4">
          <a href="/mapa" className="text-green-200 hover:text-white transition">Mapa</a>
          <a href="/rotas" className="text-green-200 hover:text-white transition">Rotas</a>
          <a href="/dialogo" className="text-green-200 hover:text-white transition">Sala de Diálogo</a>
          <a href="/login" className="bg-green-500 hover:bg-green-400 text-white px-4 py-1 rounded-full transition">Entrar</a>
        </div>
      </nav>

      {/* HERO */}
      <section className="flex flex-col items-center justify-center text-center px-4 py-24 gap-6">
        <span className="text-6xl">🌍</span>
        <h1 className="text-5xl font-bold text-green-300">
          Luanda Limpa
        </h1>
        <p className="text-xl text-green-200 max-w-2xl">
          Plataforma inteligente de gestão de resíduos para a cidade de Luanda. 
          Optimizamos rotas de recolha com Inteligência Artificial para uma cidade mais saudável.
        </p>
        <div className="flex gap-4 mt-4">
          <a href="/mapa" className="bg-green-500 hover:bg-green-400 text-white px-8 py-3 rounded-full text-lg font-semibold transition">
            Ver Mapa
          </a>
          <a href="/login" className="border border-green-400 text-green-300 hover:bg-green-800 px-8 py-3 rounded-full text-lg transition">
            Começar
          </a>
        </div>
      </section>

      {/* CARDS */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 px-8 pb-20 max-w-5xl mx-auto">
        
        <div className="bg-green-900 rounded-2xl p-6 flex flex-col gap-3 shadow">
          <span className="text-4xl">🗺️</span>
          <h2 className="text-xl font-bold text-green-300">Mapa Interactivo</h2>
          <p className="text-green-200 text-sm">
            Visualiza todos os pontos de recolha de lixo dos municípios de Luanda em tempo real.
          </p>
        </div>

        <div className="bg-green-900 rounded-2xl p-6 flex flex-col gap-3 shadow">
          <span className="text-4xl">🤖</span>
          <h2 className="text-xl font-bold text-green-300">IA JFS</h2>
          <p className="text-green-200 text-sm">
            Inteligência artificial que optimiza automaticamente as rotas de recolha para maior eficiência.
          </p>
        </div>

        <div className="bg-green-900 rounded-2xl p-6 flex flex-col gap-3 shadow">
          <span className="text-4xl">💬</span>
          <h2 className="text-xl font-bold text-green-300">Sala de Diálogo</h2>
          <p className="text-green-200 text-sm">
            Canal de comunicação entre funcionários e chefes de departamento com IA integrada.
          </p>
        </div>

      </section>

      {/* FOOTER */}
      <footer className="text-center py-6 text-green-600 text-sm border-t border-green-900">
        © 2025 Luanda Limpa · Desenvolvido para a cidade de Luanda
      </footer>

    </main>
  );
}