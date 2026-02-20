'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { AnaliseIA, SolucaoRecomendada } from '@/types/diagnostico'

function BadgeAplicabilidade({ nivel }: { nivel: string }) {
  const cls = nivel === 'Alta' ? 'badge-alta' : nivel === 'Média' ? 'badge-media' : 'badge-baixa'
  return <span className={`badge-sm ${cls}`}>{nivel}</span>
}

function BadgeComplexidade({ nivel }: { nivel: string }) {
  const cls = nivel === 'Baixa' ? 'badge-alta' : nivel === 'Média' ? 'badge-media' : 'badge-baixa'
  return <span className={`badge-sm ${cls}`}>Cx: {nivel}</span>
}

function BadgeFase({ fase }: { fase?: string }) {
  if (!fase) return null
  const cores: Record<string, string> = {
    'Fase 1': '#dcfce7',
    'Fase 2': '#dbeafe',
    'Fase 3': '#fef3c7',
    'Fase 4': '#f3e8ff',
  }
  const coresTxt: Record<string, string> = {
    'Fase 1': '#166534',
    'Fase 2': '#1e40af',
    'Fase 3': '#92400e',
    'Fase 4': '#6b21a8',
  }
  return (
    <span
      className="badge-sm"
      style={{ background: cores[fase] || '#f1f5f9', color: coresTxt[fase] || '#475569' }}
    >
      {fase}
    </span>
  )
}

function SolucaoCard({ solucao }: { solucao: SolucaoRecomendada }) {
  return (
    <div className="solution-card">
      <div className="solution-header">
        <div>
          <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.8rem' }}>
            #{solucao.numero} — Prioridade {solucao.prioridade}
          </span>
          <div className="solution-title">{solucao.titulo}</div>
        </div>
        <div className="solution-badges">
          <BadgeAplicabilidade nivel={solucao.aplicabilidade} />
          <BadgeComplexidade nivel={solucao.complexidade} />
          <BadgeFase fase={solucao.fase_roadmap} />
        </div>
      </div>

      <p style={{ fontSize: '0.9rem', color: 'var(--text)', marginBottom: 8 }}>
        {solucao.descricao}
      </p>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', fontStyle: 'italic', marginBottom: 4 }}>
        Dor: {solucao.dor_identificada}
      </p>
      {solucao.entregaveis && (
        <p style={{ fontSize: '0.8rem', color: 'var(--secondary)', fontWeight: 500 }}>
          Entregaveis: {solucao.entregaveis}
        </p>
      )}

      <div className="solution-meta">
        <div className="meta-item">
          <span className="meta-label">Modulo AIOS</span>
          <span className="meta-value">{solucao.modulo_aios}</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Tempo Estimado</span>
          <span className="meta-value">{solucao.tempo_estimado}</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Implementacao</span>
          <span className="meta-value">{solucao.valor_implementacao}</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Manutencao/mes</span>
          <span className="meta-value">{solucao.valor_manutencao_mensal}</span>
        </div>
      </div>
    </div>
  )
}

function RelatorioContent() {
  const searchParams = useSearchParams()
  const empresaId = searchParams.get('empresa_id')
  const [analise, setAnalise] = useState<AnaliseIA | null>(null)
  const [empresaNome, setEmpresaNome] = useState('')
  const [loading, setLoading] = useState(true)
  const [dataAnalise, setDataAnalise] = useState('')
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (!empresaId) {
      setErro('Nenhuma empresa selecionada')
      setLoading(false)
      return
    }
    carregarAnalise()
  }, [empresaId])

  async function carregarAnalise() {
    try {
      const [analiseRes, empresaRes] = await Promise.all([
        fetch(`/api/analise?empresa_id=${empresaId}`),
        fetch(`/api/empresas`),
      ])

      if (empresaRes.ok) {
        const empData = await empresaRes.json()
        const emp = empData.empresas?.find((e: { id: string }) => e.id === empresaId)
        if (emp) setEmpresaNome(emp.nome)
      }

      if (analiseRes.ok) {
        const data = await analiseRes.json()
        setAnalise(data.analise)
        setDataAnalise(data.created_at || new Date().toISOString())
      } else {
        setErro('Nenhuma analise encontrada. Gere uma analise primeiro.')
      }
    } catch {
      setErro('Erro ao carregar analise')
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p>Carregando relatorio...</p>
      </div>
    )
  }

  if (erro) {
    return (
      <div className="container">
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <h2>{erro}</h2>
          <a href="/admin/respostas">
            <button className="btn btn-primary" style={{ marginTop: 20, maxWidth: 300 }}>
              Voltar ao Painel
            </button>
          </a>
        </div>
      </div>
    )
  }

  if (!analise) return null

  const solucoesOrdenadas = [...(analise.solucoes || [])].sort((a, b) => a.prioridade - b.prioridade)
  const quickWins = solucoesOrdenadas.filter(s => s.aplicabilidade === 'Alta' && s.complexidade === 'Baixa')
  const totalImplementacao = solucoesOrdenadas.length
  const inv = analise.investimento_total

  return (
    <div className="container-wide">
      {/* Header */}
      <div className="report-header">
        <p style={{ opacity: 0.7, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Relatorio de Diagnostico Empresarial — Powered by Claude AI
        </p>
        <h1>{empresaNome}</h1>
        <p>
          Gerado em {new Date(dataAnalise).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
          {' '} | {totalImplementacao} solucoes recomendadas | {quickWins.length} quick wins
        </p>
      </div>

      {/* Botoes */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <a href="/admin/respostas" style={{ textDecoration: 'none' }}>
          <button className="btn btn-secondary" style={{ padding: '10px 20px', fontSize: '0.85rem' }}>
            Voltar ao Painel
          </button>
        </a>
        <button
          className="btn btn-primary"
          style={{ padding: '10px 20px', fontSize: '0.85rem', width: 'auto' }}
          onClick={() => window.print()}
        >
          Imprimir / Salvar PDF
        </button>
      </div>

      {/* Resumo Executivo */}
      <div className="report-section">
        <h2>Resumo Executivo</h2>
        <p style={{ fontSize: '0.95rem', lineHeight: 1.7 }}>{analise.resumo_executivo}</p>
      </div>

      {/* Perfil da Empresa */}
      <div className="report-section">
        <h2>Perfil da Empresa</h2>
        <p style={{ fontSize: '0.95rem', lineHeight: 1.7 }}>{analise.perfil_empresa}</p>
      </div>

      {/* Principais Dores */}
      <div className="report-section">
        <h2>Principais Dores Identificadas</h2>
        <ul style={{ paddingLeft: 20 }}>
          {analise.principais_dores?.map((dor, i) => (
            <li key={i} style={{ marginBottom: 10, fontSize: '0.95rem', lineHeight: 1.6 }}>
              {dor}
            </li>
          ))}
        </ul>
      </div>

      {/* Cruzamento */}
      <div className="report-section">
        <h2>Cruzamento Diretoria x Equipe</h2>
        <p style={{ fontSize: '0.95rem', lineHeight: 1.7 }}>{analise.cruzamento_diretoria_equipe}</p>
      </div>

      {/* Solucoes Recomendadas */}
      <div className="report-section">
        <h2>Solucoes Recomendadas ({solucoesOrdenadas.length})</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: 20 }}>
          Ordenadas por prioridade. Quick wins primeiro para gerar valor rapido.
        </p>

        {solucoesOrdenadas.map(solucao => (
          <SolucaoCard key={solucao.numero} solucao={solucao} />
        ))}
      </div>

      {/* Roadmap */}
      <div className="report-section">
        <h2>Roadmap de Implementacao</h2>
        <p style={{ fontSize: '0.95rem', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
          {analise.roadmap_sugerido}
        </p>
      </div>

      {/* ROI */}
      <div className="report-section">
        <h2>ROI Estimado</h2>
        <p style={{ fontSize: '0.95rem', lineHeight: 1.7 }}>{analise.roi_estimado}</p>
      </div>

      {/* Investimento Total */}
      <div className="report-section" style={{ background: '#f0f9ff', border: '2px solid var(--primary)' }}>
        <h2>Resumo Financeiro</h2>
        <div className="stats-grid">
          <div className="stat-card" style={{ textAlign: 'center' }}>
            <div className="stat-value" style={{ fontSize: '1.5rem' }}>{totalImplementacao}</div>
            <div className="stat-label">Solucoes Totais</div>
          </div>
          <div className="stat-card" style={{ textAlign: 'center' }}>
            <div className="stat-value" style={{ fontSize: '1.5rem', color: 'var(--secondary)' }}>
              {quickWins.length}
            </div>
            <div className="stat-label">Quick Wins</div>
          </div>
          <div className="stat-card" style={{ textAlign: 'center' }}>
            <div className="stat-value" style={{ fontSize: '1.5rem', color: 'var(--accent)' }}>
              {solucoesOrdenadas.filter(s => s.aplicabilidade === 'Alta').length}
            </div>
            <div className="stat-label">Alta Aplicabilidade</div>
          </div>
        </div>

        {inv && (
          <div style={{ marginTop: 16 }}>
            <div className="stats-grid" style={{ marginBottom: 16 }}>
              <div className="stat-card">
                <div className="stat-label">Implementacao Total</div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', marginTop: 4 }}>
                  {inv.implementacao_minimo} — {inv.implementacao_maximo}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Manutencao Mensal</div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', marginTop: 4 }}>
                  {inv.mensal_minimo} — {inv.mensal_maximo}/mes
                </div>
              </div>
            </div>
            {inv.pacote_sugerido && (
              <div style={{
                background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 8,
                padding: 16, fontSize: '0.9rem', lineHeight: 1.6,
              }}>
                <strong style={{ color: '#065f46' }}>Pacote Sugerido:</strong>{' '}
                {inv.pacote_sugerido}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Proximos Passos */}
      {analise.proximos_passos && analise.proximos_passos.length > 0 && (
        <div className="report-section" style={{ background: '#fffbeb', border: '2px solid var(--accent)' }}>
          <h2>Proximos Passos</h2>
          <ol style={{ paddingLeft: 20 }}>
            {analise.proximos_passos.map((passo, i) => (
              <li key={i} style={{ marginBottom: 8, fontSize: '0.95rem', lineHeight: 1.6 }}>
                {passo}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-light)', fontSize: '0.8rem' }}>
        <p>Relatorio gerado por Diagnostico Empresarial AIOS</p>
        <p>Analise realizada por Claude AI (Anthropic) — Consultoria em Transformacao Digital</p>
      </div>
    </div>
  )
}

export default function RelatorioPage() {
  return (
    <Suspense
      fallback={
        <div className="loading-container">
          <div className="spinner" />
          <p>Carregando...</p>
        </div>
      }
    >
      <RelatorioContent />
    </Suspense>
  )
}
