import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { gerarPromptAnalise } from '@/lib/prompt-analise'
import OpenAI from 'openai'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { empresa_id } = body

    if (!empresa_id) {
      return NextResponse.json({ error: 'empresa_id é obrigatório' }, { status: 400 })
    }

    const supabase = createServerClient()

    // Buscar empresa
    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .select('*')
      .eq('id', empresa_id)
      .single()

    if (empresaError || !empresa) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 })
    }

    // Buscar todas as respostas da empresa
    const { data: todasRespostas, error: respostasError } = await supabase
      .from('respostas')
      .select('*')
      .eq('empresa_id', empresa_id)

    if (respostasError || !todasRespostas || todasRespostas.length === 0) {
      return NextResponse.json({ error: 'Nenhuma resposta encontrada para esta empresa' }, { status: 404 })
    }

    const respostasDiretoria = todasRespostas
      .filter(r => r.tipo === 'diretoria')
      .map(r => ({ respondente: r.respondente_nome, cargo: r.respondente_cargo, ...r.respostas }))

    const respostasEquipe = todasRespostas
      .filter(r => r.tipo === 'equipe')
      .map(r => ({ respondente: r.respondente_nome, cargo: r.respondente_cargo, area: r.respostas?.eq_area, ...r.respostas }))

    if (respostasDiretoria.length === 0) {
      return NextResponse.json({ error: 'É necessário pelo menos 1 resposta da Diretoria para gerar a análise' }, { status: 400 })
    }

    // Gerar prompt e chamar IA
    const prompt = gerarPromptAnalise(empresa.nome, respostasDiretoria, respostasEquipe)

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Você é um consultor de tecnologia especializado em diagnósticos empresariais. Responda APENAS com JSON válido, sem markdown, sem blocos de código.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 8000,
    })

    const respostaIA = completion.choices[0]?.message?.content || ''

    // Tentar parsear o JSON
    let analise
    try {
      // Limpar possíveis artefatos de markdown
      const jsonLimpo = respostaIA
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()
      analise = JSON.parse(jsonLimpo)
    } catch {
      console.error('Erro ao parsear JSON da IA:', respostaIA.substring(0, 500))
      return NextResponse.json(
        { error: 'Erro ao processar análise da IA. Tente novamente.' },
        { status: 500 }
      )
    }

    // Salvar análise no banco
    const { data: analiseData, error: analiseError } = await supabase
      .from('analises')
      .insert({
        empresa_id,
        analise,
        modelo_ia: 'gpt-4o',
      })
      .select()
      .single()

    if (analiseError) {
      console.error('Erro ao salvar análise:', analiseError)
      // Retorna a análise mesmo se não salvar
      return NextResponse.json({ analise, salvo: false })
    }

    return NextResponse.json({ analise, id: analiseData.id, salvo: true })
  } catch (err) {
    console.error('Erro na API de análise:', err)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const empresaId = searchParams.get('empresa_id')

    if (!empresaId) {
      return NextResponse.json({ error: 'empresa_id é obrigatório' }, { status: 400 })
    }

    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('analises')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Nenhuma análise encontrada' }, { status: 404 })
    }

    return NextResponse.json({ analise: data.analise, id: data.id, created_at: data.created_at })
  } catch (err) {
    console.error('Erro na API:', err)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
