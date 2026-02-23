import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { RunProvider } from "@/context/RunContext";
import App from "./App";
import { OverviewPage } from "@/pages/OverviewPage";
import { DriversPage } from "@/pages/DriversPage";
import { DriverProfilePage } from "@/pages/DriverProfilePage";
import { ManifestPage } from "@/pages/ManifestPage";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <RunProvider>
        <Routes>
          <Route element={<App />}>
            <Route index element={<OverviewPage />} />
            <Route path="drivers" element={<DriversPage />} />
            <Route path="drivers/:driverId" element={<DriverProfilePage />} />
            <Route path="manifest" element={<ManifestPage />} />
          </Route>
        </Routes>
      </RunProvider>
    </BrowserRouter>
  </StrictMode>
);
