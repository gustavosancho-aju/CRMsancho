import FormularioDiagnostico from '@/components/FormularioDiagnostico'
import { perguntasDiretoria } from '@/lib/perguntas-diretoria'

export const metadata = {
  title: 'Diagnóstico Estratégico — Diretoria',
}

export default function DiretoriaPage() {
  return <FormularioDiagnostico tipo="diretoria" perguntas={perguntasDiretoria} />
}
