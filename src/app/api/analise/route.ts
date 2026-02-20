import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { gerarSystemPrompt, gerarPromptAnalise } from '@/lib/prompt-analise'
import Anthropic from '@anthropic-ai/sdk'

const MODELO_CLAUDE = 'claude-sonnet-4-20250514'

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
      return NextResponse.json(
        { error: 'Nenhuma resposta encontrada para esta empresa' },
        { status: 404 }
      )
    }

    const respostasDiretoria = todasRespostas
      .filter(r => r.tipo === 'diretoria')
      .map(r => ({
        respondente: r.respondente_nome,
        cargo: r.respondente_cargo,
        ...r.respostas,
      }))

    const respostasEquipe = todasRespostas
      .filter(r => r.tipo === 'equipe')
      .map(r => ({
        respondente: r.respondente_nome,
        cargo: r.respondente_cargo,
        area: r.respostas?.eq_area,
        ...r.respostas,
      }))

    if (respostasDiretoria.length === 0) {
      return NextResponse.json(
        { error: 'É necessário pelo menos 1 resposta da Diretoria para gerar a análise' },
        { status: 400 }
      )
    }

    // Gerar prompts
    const systemPrompt = gerarSystemPrompt()
    const userPrompt = gerarPromptAnalise(empresa.nome, respostasDiretoria, respostasEquipe)

    // Chamar Claude via Anthropic SDK
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })

    const message = await anthropic.messages.create({
      model: MODELO_CLAUDE,
      max_tokens: 12000,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt },
      ],
    })

    // Extrair texto da resposta
    const respostaIA = message.content
      .filter(block => block.type === 'text')
      .map(block => {
        if (block.type === 'text') return block.text
        return ''
      })
      .join('')

    // Parsear JSON da resposta
    let analise
    try {
      const jsonLimpo = respostaIA
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()
      analise = JSON.parse(jsonLimpo)
    } catch {
      console.error('Erro ao parsear JSON do Claude:', respostaIA.substring(0, 500))
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
        modelo_ia: MODELO_CLAUDE,
      })
      .select()
      .single()

    if (analiseError) {
      console.error('Erro ao salvar análise:', analiseError)
      return NextResponse.json({ analise, salvo: false })
    }

    return NextResponse.json({ analise, id: analiseData.id, salvo: true })
  } catch (err) {
    console.error('Erro na API de análise:', err)

    const errorMessage = err instanceof Error ? err.message : 'Erro interno do servidor'
    const isAuthError = errorMessage.includes('authentication') || errorMessage.includes('api_key')

    return NextResponse.json(
      {
        error: isAuthError
          ? 'Chave da API Anthropic inválida. Verifique o ANTHROPIC_API_KEY no .env.local'
          : `Erro ao gerar análise: ${errorMessage}`,
      },
      { status: isAuthError ? 401 : 500 }
    )
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

    return NextResponse.json({
      analise: data.analise,
      id: data.id,
      created_at: data.created_at,
    })
  } catch (err) {
    console.error('Erro na API:', err)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
