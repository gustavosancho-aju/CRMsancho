import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Diagnóstico Empresarial | Consultoria AIOS',
  description: 'Sistema de diagnóstico empresarial inteligente para consultores',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
