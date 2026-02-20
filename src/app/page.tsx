'use client'

import { useState } from 'react'

export default function HomePage() {
  const [showCadastro, setShowCadastro] = useState(false)
  const [nomeEmpresa, setNomeEmpresa] = useState('')
  const [segmento, setSegmento] = useState('')
  const [criando, setCriando] = useState(false)
  const [empresaCriada, setEmpresaCriada] = useState<{ nome: string; codigo_acesso: string } | null>(null)

  async function criarEmpresa(e: React.FormEvent) {
    e.preventDefault()
    if (!nomeEmpresa.trim()) return

    setCriando(true)
    try {
      const res = await fetch('/api/empresas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: nomeEmpresa.trim(), segmento: segmento.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        setEmpresaCriada(data.empresa)
      } else {
        alert(data.error || 'Erro ao cadastrar')
      }
    } catch {
      alert('Erro ao conectar com o servidor')
    }
    setCriando(false)
  }

  return (
    <div>
      <div className="home-hero">
        <h1>Diagnóstico Empresarial</h1>
        <p>
          Sistema inteligente de diagnóstico para identificar oportunidades de
          transformação digital na sua empresa.
        </p>
      </div>

      {/* Cards de formulários */}
      <div className="cards-grid">
        <a href="/formulario/diretoria" className="card-link">
          <div className="card">
            <div className="card-icon">&#x1F3E2;</div>
            <h3>Formulário Diretoria</h3>
            <p>Visão estratégica da liderança sobre gargalos, investimentos e crescimento</p>
            <span className="badge badge-diretoria" style={{ marginTop: 12 }}>~15 min</span>
          </div>
        </a>

        <a href="/formulario/equipe" className="card-link">
          <div className="card">
            <div className="card-icon">&#x1F465;</div>
            <h3>Formulário Equipe</h3>
            <p>Visão operacional do dia a dia sobre processos, ferramentas e frustrações</p>
            <span className="badge badge-equipe" style={{ marginTop: 12 }}>~10 min</span>
          </div>
        </a>
      </div>

      {/* Área do Consultor */}
      <div className="container" style={{ marginTop: 20 }}>
        <div className="question-card" style={{ textAlign: 'center' }}>
          <div className="question-number">Área do Consultor</div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 16 }}>
            <button
              className="btn btn-secondary"
              style={{ padding: '10px 24px', fontSize: '0.85rem', width: 'auto' }}
              onClick={() => setShowCadastro(!showCadastro)}
            >
              {showCadastro ? 'Fechar Cadastro' : 'Cadastrar Nova Empresa'}
            </button>
            <a href="/admin/respostas" style={{ textDecoration: 'none' }}>
              <button
                className="btn btn-primary"
                style={{ padding: '10px 24px', fontSize: '0.85rem', width: 'auto' }}
              >
                Painel de Respostas
              </button>
            </a>
          </div>

          {/* Form de cadastro de empresa */}
          {showCadastro && !empresaCriada && (
            <form onSubmit={criarEmpresa} style={{ marginTop: 24, maxWidth: 400, margin: '24px auto 0' }}>
              <div className="id-field" style={{ marginBottom: 12 }}>
                <label>Nome da Empresa *</label>
                <input
                  type="text"
                  value={nomeEmpresa}
                  onChange={e => setNomeEmpresa(e.target.value)}
                  placeholder="Ex: ABC Engenharia"
                  required
                />
              </div>
              <div className="id-field" style={{ marginBottom: 16 }}>
                <label>Segmento</label>
                <input
                  type="text"
                  value={segmento}
                  onChange={e => setSegmento(e.target.value)}
                  placeholder="Ex: Construção Civil"
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={criando}>
                {criando ? 'Cadastrando...' : 'Cadastrar Empresa'}
              </button>
            </form>
          )}

          {/* Empresa criada */}
          {empresaCriada && (
            <div style={{
              marginTop: 24, padding: 24, background: '#d1fae5', borderRadius: 8,
              maxWidth: 400, margin: '24px auto 0',
            }}>
              <p style={{ fontWeight: 700, marginBottom: 8, color: '#065f46' }}>
                Empresa cadastrada com sucesso!
              </p>
              <p style={{ fontSize: '0.9rem', marginBottom: 4 }}>
                <strong>Empresa:</strong> {empresaCriada.nome}
              </p>
              <p style={{ fontSize: '1.2rem', fontWeight: 800, color: '#065f46' }}>
                Código de Acesso: {empresaCriada.codigo_acesso}
              </p>
              <p style={{ fontSize: '0.8rem', color: '#065f46', marginTop: 8 }}>
                Compartilhe este código com os respondentes para que preencham os formulários.
              </p>
              <button
                className="btn btn-secondary"
                style={{ marginTop: 12, padding: '8px 20px', fontSize: '0.8rem', width: 'auto' }}
                onClick={() => { setEmpresaCriada(null); setShowCadastro(false); setNomeEmpresa(''); setSegmento('') }}
              >
                Cadastrar outra empresa
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Como funciona */}
      <div className="container" style={{ marginTop: 8 }}>
        <div className="question-card">
          <div className="question-number">Como Funciona</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginTop: 16 }}>
            <div>
              <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>1.</div>
              <strong>Cadastre a Empresa</strong>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginTop: 4 }}>
                O consultor cadastra a empresa e recebe um código de acesso único.
              </p>
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>2.</div>
              <strong>Colete Respostas</strong>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginTop: 4 }}>
                Diretoria e equipe respondem seus formulários usando o código.
              </p>
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>3.</div>
              <strong>IA Analisa</strong>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginTop: 4 }}>
                O sistema cruza todas as respostas e gera um diagnóstico inteligente.
              </p>
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>4.</div>
              <strong>Relatório Final</strong>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginTop: 4 }}>
                10-20 soluções priorizadas com valores, prazos e roadmap de implementação.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-light)', fontSize: '0.8rem' }}>
        <p>Diagnóstico Empresarial AIOS — Consultoria em Transformação Digital</p>
      </div>
    </div>
  )
}
