import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/hooks/use-auth'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import Layout from '@/components/Layout'

import Index from '@/pages/Index'
import Login from '@/pages/Login'
import Signup from '@/pages/Signup'
import ResetPassword from '@/pages/ResetPassword'
import Dashboard from '@/pages/Dashboard'
import Patients from '@/pages/Patients'
import PatientDetail from '@/pages/PatientDetail'
import Appointments from '@/pages/Appointments'
import Vaccinations from '@/pages/Vaccinations'
import CareInstructions from '@/pages/CareInstructions'
import WhatsAppCenter from '@/pages/WhatsAppCenter'
import NotFound from '@/pages/NotFound'

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Signup />} />
          <Route path="/redefinir-senha" element={<ResetPassword />} />
          <Route path="/redefinir-senha/:token" element={<ResetPassword />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/painel" element={<Dashboard />} />
              <Route path="/pacientes" element={<Patients />} />
              <Route path="/pacientes/:id" element={<PatientDetail />} />
              <Route path="/agendamentos" element={<Appointments />} />
              <Route path="/vacinacoes" element={<Vaccinations />} />
              <Route path="/orientacoes" element={<CareInstructions />} />
              <Route path="/whatsapp" element={<WhatsAppCenter />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
