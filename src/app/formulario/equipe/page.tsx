import FormularioDiagnostico from '@/components/FormularioDiagnostico'
import { perguntasEquipe } from '@/lib/perguntas-equipe'

export const metadata = {
  title: 'Diagnóstico Operacional — Equipe',
}

export default function EquipePage() {
  return <FormularioDiagnostico tipo="equipe" perguntas={perguntasEquipe} />
}
