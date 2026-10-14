import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import AppLayout from "./components/AppLayout";
import Feed from "./pages/Feed";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import OrgDetail from "./pages/OrgDetail";
import Orgs from "./pages/Orgs";
import PostDetail from "./pages/PostDetail";
import Profile from "./pages/Profile";
import Register from "./pages/Register";

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route element={<AppLayout />}>
              <Route path="/" element={<Feed />} />
              <Route path="/post/:id" element={<PostDetail />} />
              <Route path="/orgs" element={<Orgs />} />
              <Route path="/orgs/:slug" element={<OrgDetail />} />
              <Route path="/u/:username" element={<Profile />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
