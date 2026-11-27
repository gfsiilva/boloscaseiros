import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router/dom'
import '@fontsource-variable/fraunces'
import '@fontsource-variable/manrope'
import './index.css'
import { router } from '@/router'
import CarrinhoProvider from '@/components/CarrinhoProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CarrinhoProvider>
      <RouterProvider router={router} />
    </CarrinhoProvider>
  </StrictMode>,
)