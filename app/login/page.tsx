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