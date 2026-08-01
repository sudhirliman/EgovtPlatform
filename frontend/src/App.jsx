import React from "react";
import { Routes, Route } from "react-router-dom";
import AppLayout from "./layout/AppLayout.jsx";
import RequireAuth from "./auth/RequireAuth.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import HierarchyPage from "./pages/HierarchyPage.jsx";
import BoardsPage from "./pages/BoardsPage.jsx";
import DepartmentsPage from "./pages/DepartmentsPage.jsx";
import ServicesPage from "./pages/ServicesPage.jsx";
import MasterFormFieldsPage from "./pages/MasterFormFieldsPage.jsx";
import ServiceWizardPage from "./pages/ServiceWizardPage.jsx";
import WorkflowBuilderPage from "./pages/WorkflowBuilderPage.jsx";
import FormDesignerPage from "./pages/FormDesignerPage.jsx";
import ApplicationsPage from "./pages/ApplicationsPage.jsx";
import ApplicationDetailPage from "./pages/ApplicationDetailPage.jsx";
import PaymentsPage from "./pages/PaymentsPage.jsx";
import UsersRolesPage from "./pages/UsersRolesPage.jsx";
import ReportsPage from "./pages/ReportsPage.jsx";
import TicketsPage from "./pages/TicketsPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="hierarchy" element={<HierarchyPage />} />
          <Route path="master/boards" element={<BoardsPage />} />
          <Route path="master/departments" element={<DepartmentsPage />} />
          <Route path="master/services" element={<ServicesPage />} />
          <Route path="master/form-fields" element={<MasterFormFieldsPage />} />
          <Route path="services/new" element={<ServiceWizardPage />} />
          <Route path="workflow-builder" element={<WorkflowBuilderPage />} />
          <Route path="form-designer" element={<FormDesignerPage />} />
          <Route path="applications" element={<ApplicationsPage />} />
          <Route path="applications/:id" element={<ApplicationDetailPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="users-roles" element={<UsersRolesPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="tickets" element={<TicketsPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
