import { createBrowserRouter } from 'react-router'
import SiteLayout from '@/components/layout/SiteLayout'
import Home from '@/pages/Home'
import Cardapio from '@/pages/Cardapio'
import Produto from '@/pages/Produto'
import Carrinho from '@/pages/Carrinho'
import Agendamento from '@/pages/Agendamento'
import Dados from '@/pages/Dados'
import Revisao from '@/pages/Revisao'
import Confirmacao from '@/pages/Confirmacao'
import TesteBanco from '@/pages/TesteBanco'
import NaoEncontrada from '@/pages/NaoEncontrada'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <SiteLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'cardapio', element: <Cardapio /> },
      { path: 'produto/:id', element: <Produto /> },
      { path: 'carrinho', element: <Carrinho /> },
      { path: 'agendamento', element: <Agendamento /> },
      { path: 'dados', element: <Dados /> },
      { path: 'revisao', element: <Revisao /> },
      { path: 'confirmacao', element: <Confirmacao /> },
      { path: 'teste-banco', element: <TesteBanco /> },
      { path: '*', element: <NaoEncontrada /> },
    ],
  },
])