import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { mensagens } = await req.json()

    const chave = process.env.GROQ_API_KEY
    if (!chave) {
      return NextResponse.json({ resposta: 'Erro: chave GROQ_API_KEY não encontrada no servidor.' })
    }

    const resposta = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${chave}`
      },
      body: JSON.stringify({
        model: 'gemma2-9b-it',
        messages: [
          {
            role: 'system',
            content: `És o JFS, o assistente de inteligência artificial do sistema Luanda Limpa. 
            Respondes sempre em português. Ajudas com gestão de resíduos em Luanda.`
          },
          ...mensagens
        ],
        max_tokens: 1024,
        temperature: 0.7
      })
    })

    const texto = await resposta.text()

    if (!resposta.ok) {
      return NextResponse.json({ resposta: `Erro Groq: ${resposta.status} — ${texto}` })
    }

    const dados = JSON.parse(texto)
    const conteudo = dados.choices?.[0]?.message?.content || 'Sem resposta.'
    return NextResponse.json({ resposta: conteudo })

  } catch (erro: any) {
    return NextResponse.json({ resposta: `Erro interno: ${erro.message}` })
  }
}