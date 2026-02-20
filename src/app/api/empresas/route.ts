import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('empresas')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'Erro ao buscar empresas' }, { status: 500 })
    }

    return NextResponse.json({ empresas: data })
  } catch (err) {
    console.error('Erro na API:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nome, segmento, consultor_responsavel } = body

    if (!nome) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    }

    // Gerar código de acesso único (6 caracteres)
    const codigo = Math.random().toString(36).substring(2, 8).toUpperCase()

    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('empresas')
      .insert({
        nome,
        segmento: segmento || null,
        codigo_acesso: codigo,
        consultor_responsavel: consultor_responsavel || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar empresa:', error)
      return NextResponse.json({ error: 'Erro ao cadastrar empresa' }, { status: 500 })
    }

    return NextResponse.json({ empresa: data })
  } catch (err) {
    console.error('Erro na API:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
