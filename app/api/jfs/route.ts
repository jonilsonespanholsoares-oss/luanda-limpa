import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { mensagens } = await req.json()

    const chave = process.env.GROQ_API_KEY
    if (!chave) {
      return NextResponse.json({ resposta: 'Erro: chave GROQ_API_KEY não encontrada.' })
    }

    const resposta = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${chave}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: `És o JFS, assistente IA do Luanda Limpa. Respondes SEMPRE em português de Angola. 
            És directo e conciso — máximo 3 parágrafos curtos. 
            Ajudas com gestão de resíduos, rotas, contentores e coordenação de equipas em Luanda.`
          },
          ...mensagens.slice(-6)
        ],
        max_tokens: 300,
        temperature: 0.5,
        stream: false
      })
    })

    const dados = await resposta.json()
    const conteudo = dados.choices?.[0]?.message?.content || 'Sem resposta.'
    return NextResponse.json({ resposta: conteudo })

  } catch (erro: any) {
    return NextResponse.json({ resposta: `Erro: ${erro.message}` })
  }
}