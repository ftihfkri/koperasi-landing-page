import InvestorCompare from "./pages/investor/InvestorCompare";
import InvestorDashboard from "./pages/investor/InvestorDashboard";
import { useState, useCallback } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Navigation } from "./sections/Navigation";
import { Hero } from "./sections/Hero";
import { WineShowcase } from "./sections/WineShowcase";
import { WineryCarousel } from "./sections/WineryCarousel";
import { Museum } from "./sections/Museum";
import { News } from "./sections/News";
import { ContactForm } from "./sections/ContactForm";
import { Footer } from "./sections/Footer";
import { Preloader } from "./components/Preloader";
import { ScrollToTop } from "./components/ScrollToTop";
import { GovernancePage } from "./pages/GovernancePage";
import { BoardMembersPage } from "./pages/BoardMembersPage";

// Main page component with all sections
function MainPage({ isReady }: { isReady: boolean }) {
  return (
    <>
      <Navigation />
      <main>
        <Hero isReady={isReady} />
        <WineShowcase />
        <WineryCarousel />
        <Museum />
        <News />
        <ContactForm />
      </main>
      <Footer />
      <ScrollToTop />
    </>
  );
}

// Page wrapper that scrolls to top
function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ScrollToTop />
    </>
  );
}

function AppContent() {
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  const handlePreloaderComplete = useCallback(() => {
    setIsLoading(false);
  }, []);

  // Don't show preloader on sub-pages
  const isHomePage = location.pathname === "/";

  return (
    <>
      {isHomePage && isLoading && <Preloader onComplete={handlePreloaderComplete} />}

      <div
        className={`min-h-screen bg-[#0c1a0f] ${
          isHomePage && isLoading ? "overflow-hidden max-h-screen" : ""
        }`}
      >
        <Routes>
          <Route path="/" element={<MainPage isReady={!isLoading} />} />

          <Route
            path="/governance"
            element={
              <PageWrapper>
                <GovernancePage />
              </PageWrapper>
            }
          />

          <Route
            path="/board-members"
            element={
              <PageWrapper>
                <BoardMembersPage />
              </PageWrapper>
            }
          />

          <Route
            path="/investor"
            element={
              <PageWrapper>
                <InvestorDashboard />
              </PageWrapper>
            }
          />

          <Route
            path="/investor/compare"
            element={
              <PageWrapper>
                <InvestorCompare />
              </PageWrapper>
            }
          />
        </Routes>
      </div>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;