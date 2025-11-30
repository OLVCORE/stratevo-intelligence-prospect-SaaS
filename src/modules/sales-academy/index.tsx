// src/modules/sales-academy/index.tsx
// Entry point do módulo Sales Academy

import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

// Lazy load das páginas
const AcademyDashboard = lazy(() => import("./pages/AcademyDashboard"));
const LearningPaths = lazy(() => import("./pages/LearningPaths"));
const Certifications = lazy(() => import("./pages/Certifications"));
const PlaybooksLibrary = lazy(() => import("./pages/PlaybooksLibrary"));
const SalesSimulator = lazy(() => import("./pages/SalesSimulator"));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

export function SalesAcademyModule() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AcademyDashboard />} />
        <Route path="learning-paths" element={<Navigate to="/sales-academy/dashboard" replace />} />
        <Route path="learning-paths/:id" element={<LearningPaths />} />
        <Route path="certifications" element={<Certifications />} />
        <Route path="playbooks" element={<PlaybooksLibrary />} />
        <Route path="simulator" element={<SalesSimulator />} />
      </Routes>
    </Suspense>
  );
}

export default SalesAcademyModule;

