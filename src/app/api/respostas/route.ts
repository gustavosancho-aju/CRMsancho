import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tipo, respondente_nome, respondente_cargo, empresa_nome, codigo_acesso, respostas } = body

    if (!tipo || !respondente_nome || !empresa_nome || !codigo_acesso || !respostas) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    const supabase = createServerClient()

    // Verificar se a empresa existe com o código de acesso
    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .select('id')
      .eq('codigo_acesso', codigo_acesso)
      .single()

    if (empresaError || !empresa) {
      return NextResponse.json(
        { error: 'Código de acesso inválido. Verifique com o consultor.' },
        { status: 404 }
      )
    }

    // Inserir resposta
    const { data, error } = await supabase
      .from('respostas')
      .insert({
        empresa_id: empresa.id,
        tipo,
        respondente_nome,
        respondente_cargo: respondente_cargo || null,
        respostas,
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao inserir resposta:', error)
      return NextResponse.json({ error: 'Erro ao salvar respostas' }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: data.id })
  } catch (err) {
    console.error('Erro na API:', err)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const empresaId = searchParams.get('empresa_id')

    const supabase = createServerClient()

    let query = supabase.from('respostas').select('*').order('created_at', { ascending: false })

    if (empresaId) {
      query = query.eq('empresa_id', empresaId)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: 'Erro ao buscar respostas' }, { status: 500 })
    }

    return NextResponse.json({ respostas: data })
  } catch (err) {
    console.error('Erro na API:', err)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
