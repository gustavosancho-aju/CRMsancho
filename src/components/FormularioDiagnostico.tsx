'use client'

import { useState } from 'react'
import { Pergunta, TipoFormulario } from '@/types/diagnostico'

interface Props {
  tipo: TipoFormulario
  perguntas: Pergunta[]
}

export default function FormularioDiagnostico({ tipo, perguntas }: Props) {
  const [respostas, setRespostas] = useState<Record<string, string | string[]>>({})
  const [nome, setNome] = useState('')
  const [cargo, setCargo] = useState('')
  const [empresa, setEmpresa] = useState('')
  const [codigoAcesso, setCodigoAcesso] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [erros, setErros] = useState<Record<string, string>>({})

  const secoes = [...new Set(perguntas.map(p => p.secao))]
  const totalPerguntas = perguntas.length
  const respondidas = perguntas.filter(p => {
    const r = respostas[p.id]
    if (Array.isArray(r)) return r.length > 0
    return !!r
  }).length
  const progresso = Math.round((respondidas / totalPerguntas) * 100)

  function handleSingle(perguntaId: string, valor: string) {
    setRespostas(prev => ({ ...prev, [perguntaId]: valor }))
    setErros(prev => { const n = { ...prev }; delete n[perguntaId]; return n })
  }

  function handleMultiple(perguntaId: string, valor: string) {
    setRespostas(prev => {
      const atual = (prev[perguntaId] as string[]) || []
      const novo = atual.includes(valor)
        ? atual.filter(v => v !== valor)
        : [...atual, valor]
      return { ...prev, [perguntaId]: novo }
    })
    setErros(prev => { const n = { ...prev }; delete n[perguntaId]; return n })
  }

  function handleText(perguntaId: string, valor: string) {
    setRespostas(prev => ({ ...prev, [perguntaId]: valor }))
    setErros(prev => { const n = { ...prev }; delete n[perguntaId]; return n })
  }

  function validar(): boolean {
    const novosErros: Record<string, string> = {}
    if (!nome.trim()) novosErros['nome'] = 'Nome é obrigatório'
    if (!empresa.trim()) novosErros['empresa'] = 'Nome da empresa é obrigatório'
    if (!codigoAcesso.trim()) novosErros['codigo'] = 'Código de acesso é obrigatório'

    perguntas.forEach(p => {
      if (!p.obrigatoria) return
      const r = respostas[p.id]
      if (!r || (Array.isArray(r) && r.length === 0)) {
        novosErros[p.id] = 'Esta pergunta é obrigatória'
      }
    })

    setErros(novosErros)
    if (Object.keys(novosErros).length > 0) {
      const primeiroErro = document.querySelector('.error')
      primeiroErro?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    return Object.keys(novosErros).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validar()) return

    setEnviando(true)
    try {
      const response = await fetch('/api/respostas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo,
          respondente_nome: nome.trim(),
          respondente_cargo: cargo.trim(),
          empresa_nome: empresa.trim(),
          codigo_acesso: codigoAcesso.trim(),
          respostas,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao enviar')
      }

      setEnviado(true)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao enviar respostas. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  if (enviado) {
    return (
      <div className="container">
        <div className="success-container">
          <div className="success-icon">&#10003;</div>
          <h2>Respostas enviadas com sucesso!</h2>
          <p>Obrigado pela sua participação, {nome}.</p>
          <p style={{ marginTop: 8, color: 'var(--text-light)' }}>
            Suas respostas serão analisadas pelo consultor e contribuirão para o diagnóstico da empresa.
          </p>
        </div>
      </div>
    )
  }

  let perguntaIndex = 0

  return (
    <div className="container">
      <div className="header">
        <span className={`badge badge-${tipo}`}>
          {tipo === 'diretoria' ? 'Formulário Diretoria' : 'Formulário Equipe'}
        </span>
        <h1>
          {tipo === 'diretoria'
            ? 'Diagnóstico Estratégico'
            : 'Diagnóstico Operacional'}
        </h1>
        <p>
          {tipo === 'diretoria'
            ? 'Visão da liderança sobre gargalos e oportunidades'
            : 'Visão do dia a dia sobre processos e ferramentas'}
        </p>
      </div>

      <div className="progress-container">
        <div className="progress-info">
          <span>{respondidas} de {totalPerguntas} respondidas</span>
          <span>{progresso}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progresso}%` }} />
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Identificação */}
        <div className="question-card">
          <div className="question-number">Identificação</div>
          <div className="id-fields">
            <div className="id-field">
              <label>Seu nome <span className="required-mark">*</span></label>
              <input
                type="text"
                value={nome}
                onChange={e => { setNome(e.target.value); setErros(prev => { const n = {...prev}; delete n['nome']; return n }) }}
                placeholder="Nome completo"
              />
              {erros['nome'] && <span className="error-message">{erros['nome']}</span>}
            </div>
            <div className="id-field">
              <label>Cargo</label>
              <input
                type="text"
                value={cargo}
                onChange={e => setCargo(e.target.value)}
                placeholder="Seu cargo"
              />
            </div>
            <div className="id-field">
              <label>Empresa <span className="required-mark">*</span></label>
              <input
                type="text"
                value={empresa}
                onChange={e => { setEmpresa(e.target.value); setErros(prev => { const n = {...prev}; delete n['empresa']; return n }) }}
                placeholder="Nome da empresa"
              />
              {erros['empresa'] && <span className="error-message">{erros['empresa']}</span>}
            </div>
            <div className="id-field">
              <label>Código de acesso <span className="required-mark">*</span></label>
              <input
                type="text"
                value={codigoAcesso}
                onChange={e => { setCodigoAcesso(e.target.value); setErros(prev => { const n = {...prev}; delete n['codigo']; return n }) }}
                placeholder="Fornecido pelo consultor"
              />
              {erros['codigo'] && <span className="error-message">{erros['codigo']}</span>}
            </div>
          </div>
        </div>

        {/* Perguntas por seção */}
        {secoes.map(secao => (
          <div key={secao} className="section">
            <div className="section-title">{secao}</div>

            {perguntas
              .filter(p => p.secao === secao)
              .map(pergunta => {
                perguntaIndex++
                const currentIndex = perguntaIndex
                return (
                  <div
                    key={pergunta.id}
                    className={`question-card ${erros[pergunta.id] ? 'error' : ''}`}
                  >
                    <div className="question-number">
                      Pergunta {currentIndex} de {totalPerguntas}
                    </div>
                    <div className="question-text">
                      {pergunta.texto}
                      {pergunta.obrigatoria && <span className="required-mark">*</span>}
                    </div>

                    {/* Single choice */}
                    {pergunta.tipo === 'single' && pergunta.opcoes && (
                      <div className="options-list">
                        {pergunta.opcoes.map(opcao => (
                          <label
                            key={opcao.value}
                            className={`option-item ${respostas[pergunta.id] === opcao.value ? 'selected' : ''}`}
                          >
                            <input
                              type="radio"
                              name={pergunta.id}
                              value={opcao.value}
                              checked={respostas[pergunta.id] === opcao.value}
                              onChange={() => handleSingle(pergunta.id, opcao.value)}
                            />
                            {opcao.label}
                          </label>
                        ))}
                      </div>
                    )}

                    {/* Multiple choice */}
                    {pergunta.tipo === 'multiple' && pergunta.opcoes && (
                      <>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginBottom: 10 }}>
                          Selecione todas que se aplicam
                        </p>
                        <div className="options-list">
                          {pergunta.opcoes.map(opcao => {
                            const selecionados = (respostas[pergunta.id] as string[]) || []
                            return (
                              <label
                                key={opcao.value}
                                className={`option-item ${selecionados.includes(opcao.value) ? 'selected' : ''}`}
                              >
                                <input
                                  type="checkbox"
                                  value={opcao.value}
                                  checked={selecionados.includes(opcao.value)}
                                  onChange={() => handleMultiple(pergunta.id, opcao.value)}
                                />
                                {opcao.label}
                              </label>
                            )
                          })}
                        </div>
                      </>
                    )}

                    {/* Text */}
                    {pergunta.tipo === 'text' && (
                      <textarea
                        className="text-input"
                        value={(respostas[pergunta.id] as string) || ''}
                        onChange={e => handleText(pergunta.id, e.target.value)}
                        placeholder="Escreva sua resposta aqui..."
                      />
                    )}

                    {erros[pergunta.id] && (
                      <div className="error-message">{erros[pergunta.id]}</div>
                    )}
                  </div>
                )
              })}
          </div>
        ))}

        <button type="submit" className="btn btn-primary" disabled={enviando}>
          {enviando ? 'Enviando...' : 'Enviar Respostas'}
        </button>
        <p style={{ textAlign: 'center', marginTop: 12, fontSize: '0.8rem', color: 'var(--text-light)' }}>
          Suas respostas são confidenciais e serão analisadas apenas pelo consultor.
        </p>
      </form>
    </div>
  )
}
