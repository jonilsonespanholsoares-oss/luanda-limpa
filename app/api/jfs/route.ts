import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { mensagens } = await req.json()

  const resposta = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: 'llama3-8b-8192',
      messages: [
        {
          role: 'system',
          content: `És o JFS, o assistente de inteligência artificial do sistema Luanda Limpa. 
          O teu objectivo é ajudar os funcionários e chefes de departamento da gestão de resíduos 
          da cidade de Luanda, Angola. Respondes sempre em português de Angola. 
          Podes ajudar com: optimização de rotas de recolha, gestão de contentores, 
          comunicação entre equipas, relatórios e qualquer questão relacionada 
          com a limpeza e gestão de resíduos de Luanda e dos seus 12 municípios.
          És profissional, eficiente e comprometido com uma Luanda mais limpa.`
        },
        ...mensagens
      ],
      max_tokens: 1024,
      temperature: 0.7
    })
  })

  const dados = await resposta.json()
  const texto = dados.choices?.[0]?.message?.content || 'Erro ao obter resposta do JFS.'

  return NextResponse.json({ resposta: texto })
}