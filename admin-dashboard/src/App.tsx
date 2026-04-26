import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { Layout } from "@/components/layout/Layout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Users from "@/pages/Users";
import UserDetail from "@/pages/UserDetail";
import Tours from "@/pages/Tours";
import TourDetail from "@/pages/TourDetail";
import Reports from "@/pages/Reports";
import Analytics from "@/pages/Analytics";
import PictureCompareTuning from "@/pages/PictureCompareTuning";
import ARModels from "@/pages/ARModels";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/users" element={<Users />} />
            <Route path="/users/:id" element={<UserDetail />} />
            <Route path="/tours" element={<Tours />} />
            <Route path="/tours/:id" element={<TourDetail />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/ar-models" element={<ARModels />} />
            <Route path="/picture-compare-tuning" element={<PictureCompareTuning />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
