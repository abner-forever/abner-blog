import { useRoutes, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "./store";
import AdminLayout from "./components/AdminLayout";
import GlobalWrapper from "./components/GlobalWrapper";
import { authRoutes, adminLayoutChildren } from "./routes";

function App() {
  const { token } = useSelector((state: RootState) => state.auth);

  const routes = useRoutes([
    {
      path: "/login",
      element: token ? (
        <Navigate to="/dashboard" replace />
      ) : (
        authRoutes[0].element
      ),
    },
    {
      path: "/",
      element: token ? <AdminLayout /> : <Navigate to="/login" replace />,
      children: adminLayoutChildren,
    },
    {
      path: "*",
      element: <Navigate to="/dashboard" replace />,
    },
  ]);

  return <GlobalWrapper>{routes}</GlobalWrapper>;
}

export default App;
