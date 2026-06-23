import emailjs from '@emailjs/browser'

const SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!
const TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!
const PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!

export async function enviarNotificacao({
  nome,
  emailDestino,
  assunto,
  mensagem,
  municipio
}: {
  nome: string
  emailDestino: string
  assunto: string
  mensagem: string
  municipio: string
}) {
  await emailjs.send(
    SERVICE_ID,
    TEMPLATE_ID,
    {
      nome,
      email: emailDestino,
      assunto,
      mensagem,
      municipio,
      data: new Date().toLocaleDateString('pt-PT')
    },
    PUBLIC_KEY
  )
}