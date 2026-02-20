export type TipoFormulario = 'diretoria' | 'equipe'

export interface RespostaFormulario {
  id?: string
  tipo: TipoFormulario
  empresa_nome: string
  respondente_nome: string
  respondente_cargo?: string
  respostas: Record<string, string | string[]>
  created_at?: string
}

export interface Diagnostico {
  id?: string
  empresa_nome: string
  respostas_diretoria: RespostaFormulario[]
  respostas_equipe: RespostaFormulario[]
  analise_ia?: AnaliseIA
  created_at?: string
}

export interface SolucaoRecomendada {
  numero: number
  titulo: string
  descricao: string
  dor_identificada: string
  aplicabilidade: 'Alta' | 'Média' | 'Baixa'
  complexidade: 'Baixa' | 'Média' | 'Alta'
  tempo_estimado: string
  valor_implementacao: string
  valor_manutencao_mensal: string
  prioridade: number
  modulo_aios: string
}

export interface AnaliseIA {
  resumo_executivo: string
  perfil_empresa: string
  principais_dores: string[]
  cruzamento_diretoria_equipe: string
  solucoes: SolucaoRecomendada[]
  roadmap_sugerido: string
  roi_estimado: string
}

export interface Pergunta {
  id: string
  texto: string
  tipo: 'single' | 'multiple' | 'text' | 'rating'
  opcoes?: { label: string; value: string }[]
  obrigatoria: boolean
  secao: string
  dicaConsultor?: string
}
