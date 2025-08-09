import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./override.css";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import Home from "./pages/Home";
import SettingsPage from "./pages/Settings";
import Guide from "./pages/Guide";
import NotFound from "./pages/Lost";
import CreateItem from "./pages/Item";
import { HeroUIProvider } from "@heroui/react";
import { ToastProvider } from "@heroui/toast";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/home",
    element: <Home />,
  },
  {
    path: "/settings",
    element: <SettingsPage />,
  },
  {
    path: "/guide",
    element: <Guide />,
  },
  {
    path: "/create-item",
    element: <CreateItem />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <HeroUIProvider>
      {" "}
      <ToastProvider />
      <RouterProvider router={router} />
    </HeroUIProvider>
  </StrictMode>,
);
