import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Search from "./pages/Search";
import Login from "./pages/Login";
import Register from "./pages/Register";
import HowItWorks from "./pages/HowItWorks";
import NotFound from "./pages/NotFound";
import DonorDashboard from "./pages/dashboard/DonorDashboard";
import PatientDashboard from "./pages/dashboard/PatientDashboard";
import HospitalDashboard from "./pages/dashboard/HospitalDashboard";
import BloodBankDashboard from "./pages/dashboard/BloodBankDashboard";
import AdminDashboard from "./pages/dashboard/AdminDashboard";

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<Search />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard/donor" element={<DonorDashboard />} />
              <Route path="/dashboard/patient" element={<PatientDashboard />} />
              <Route path="/dashboard/hospital" element={<HospitalDashboard />} />
              <Route path="/dashboard/bloodbank" element={<BloodBankDashboard />} />
              <Route path="/dashboard/admin" element={<AdminDashboard />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}
