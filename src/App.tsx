import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import InvoicesList from './pages/invoices/InvoicesList';
import InvoiceDetails from './pages/invoices/InvoiceDetails';
import InvoiceForm from './pages/invoices/InvoiceForm';
import CustomersList from './pages/customers/CustomersList';
import CustomerDetails from './pages/customers/CustomerDetails';
import CustomerForm from './pages/customers/CustomerForm';
import SendersList from './pages/senders/SendersList';
import SenderDetails from './pages/senders/SenderDetails';
import SenderForm from './pages/senders/SenderForm';
import UsersHome from './pages/users/UsersHome';
import UserCreate from './pages/users/UserCreate';
import UserLookup from './pages/users/UserLookup';
import Layout from './components/Layout';
import RequireAuth from './components/RequireAuth';
import RequireAdmin from './components/RequireAdmin';
import LoginPage from './pages/auth/LoginPage';

// The create and edit routes for each entity (e.g. /invoices/new and /invoices/:id/edit) render
// the same component type at the same position in the tree, so React Router reuses the mounted
// instance across a client-side navigation between them instead of remounting it — the form's
// `useState` initializers never rerun, and whatever was being edited leaks into the "new" form (or
// vice versa). Keying each form element on the current pathname forces a fresh mount whenever the
// route actually changes, while leaving in-place re-renders (e.g. the same edit route re-rendering
// after its own fetch resolves) untouched.
// Exported (not just used internally) so a test can drive it inside its own MemoryRouter/Routes
// wrapper without dragging in the real BrowserRouter — see App.routing.test.tsx.
export const AppRoutes: React.FC = () => {
  const location = useLocation();
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/invoices" replace />} />
          {/* Invoices */}
          <Route path="/invoices" element={<InvoicesList />} />
          <Route path="/invoices/new" element={<InvoiceForm key={location.pathname} mode="create" />} />
          <Route path="/invoices/:id" element={<InvoiceDetails />} />
          <Route path="/invoices/:id/edit" element={<InvoiceForm key={location.pathname} mode="edit" />} />
          {/* Customers */}
          <Route path="/customers" element={<CustomersList />} />
          <Route path="/customers/new" element={<CustomerForm key={location.pathname} mode="create" />} />
          <Route path="/customers/:id" element={<CustomerDetails />} />
          <Route path="/customers/:id/edit" element={<CustomerForm key={location.pathname} mode="edit" />} />
          {/* Senders */}
          <Route path="/senders" element={<SendersList />} />
          <Route path="/senders/new" element={<SenderForm key={location.pathname} mode="create" />} />
          <Route path="/senders/:id" element={<SenderDetails />} />
          <Route path="/senders/:id/edit" element={<SenderForm key={location.pathname} mode="edit" />} />
          {/* Users (Admin only) */}
          <Route element={<RequireAdmin />}>
            <Route path="/users" element={<UsersHome />} />
            <Route path="/users/new" element={<UserCreate />} />
            <Route path="/users/:userId" element={<UserLookup />} />
          </Route>
          <Route path="*" element={<Navigate to="/invoices" replace />} />
        </Route>
      </Route>
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
};

export default App;
