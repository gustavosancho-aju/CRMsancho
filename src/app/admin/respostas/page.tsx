'use client'

import { useState, useEffect } from 'react'

interface Empresa {
  id: string
  nome: string
  segmento: string
  codigo_acesso: string
  created_at: string
}

interface Resposta {
  id: string
  empresa_id: string
  tipo: string
  respondente_nome: string
  respondente_cargo: string
  created_at: string
}

export default function AdminRespostasPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [respostas, setRespostas] = useState<Resposta[]>([])
  const [empresaSelecionada, setEmpresaSelecionada] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [gerando, setGerando] = useState(false)

  useEffect(() => {
    carregarDados()
  }, [])

  async function carregarDados() {
    setLoading(true)
    try {
      const [empRes, respRes] = await Promise.all([
        fetch('/api/empresas'),
        fetch('/api/respostas'),
      ])
      if (empRes.ok) {
        const empData = await empRes.json()
        setEmpresas(empData.empresas || [])
      }
      if (respRes.ok) {
        const respData = await respRes.json()
        setRespostas(respData.respostas || [])
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
    }
    setLoading(false)
  }

  async function gerarAnalise(empresaId: string) {
    setGerando(true)
    try {
      const res = await fetch('/api/analise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empresa_id: empresaId }),
      })
      const data = await res.json()
      if (res.ok) {
        window.location.href = `/admin/relatorio?empresa_id=${empresaId}`
      } else {
        alert(data.error || 'Erro ao gerar análise')
      }
    } catch {
      alert('Erro ao conectar com o servidor')
    }
    setGerando(false)
  }

  const respostasFiltradas = empresaSelecionada
    ? respostas.filter(r => r.empresa_id === empresaSelecionada)
    : respostas

  const totalDiretoria = respostasFiltradas.filter(r => r.tipo === 'diretoria').length
  const totalEquipe = respostasFiltradas.filter(r => r.tipo === 'equipe').length

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p>Carregando dados...</p>
      </div>
    )
  }

  return (
    <div className="container-wide">
      <div className="admin-header">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Painel do Consultor</h1>
          <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>
            Gerencie respostas e gere relatórios de diagnóstico
          </p>
        </div>
        <a href="/" style={{ textDecoration: 'none' }}>
          <button className="btn btn-secondary" style={{ padding: '10px 20px', fontSize: '0.85rem' }}>
            Voltar ao Início
          </button>
        </a>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{empresas.length}</div>
          <div className="stat-label">Empresas Cadastradas</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{respostas.length}</div>
          <div className="stat-label">Total de Respostas</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{totalDiretoria}</div>
          <div className="stat-label">Respostas Diretoria</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{totalEquipe}</div>
          <div className="stat-label">Respostas Equipe</div>
        </div>
      </div>

      {/* Filtro por empresa */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: 6 }}>
          Filtrar por empresa:
        </label>
        <select
          value={empresaSelecionada}
          onChange={e => setEmpresaSelecionada(e.target.value)}
          style={{
            padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)',
            fontSize: '0.9rem', fontFamily: 'inherit', minWidth: 250,
          }}
        >
          <option value="">Todas as empresas</option>
          {empresas.map(emp => (
            <option key={emp.id} value={emp.id}>{emp.nome}</option>
          ))}
        </select>

        {empresaSelecionada && (
          <button
            className="btn btn-primary"
            style={{ marginLeft: 16, padding: '10px 24px', fontSize: '0.85rem', width: 'auto' }}
            onClick={() => gerarAnalise(empresaSelecionada)}
            disabled={gerando || totalDiretoria === 0}
          >
            {gerando ? 'Gerando análise com IA...' : 'Gerar Relatório com IA'}
          </button>
        )}
      </div>

      {/* Tabela de respostas */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Empresa</th>
              <th>Tipo</th>
              <th>Respondente</th>
              <th>Cargo</th>
            </tr>
          </thead>
          <tbody>
            {respostasFiltradas.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--text-light)' }}>
                  Nenhuma resposta encontrada
                </td>
              </tr>
            ) : (
              respostasFiltradas.map(resp => {
                const empresa = empresas.find(e => e.id === resp.empresa_id)
                return (
                  <tr key={resp.id}>
                    <td>{new Date(resp.created_at).toLocaleDateString('pt-BR')}</td>
                    <td>{empresa?.nome || '—'}</td>
                    <td>
                      <span className={`badge badge-${resp.tipo}`} style={{ fontSize: '0.75rem' }}>
                        {resp.tipo === 'diretoria' ? 'Diretoria' : 'Equipe'}
                      </span>
                    </td>
                    <td>{resp.respondente_nome}</td>
                    <td>{resp.respondente_cargo || '—'}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
