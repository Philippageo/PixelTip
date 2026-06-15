"use client";

import { useEffect, useState } from "react";
import TickerTape from "@/components/TickerTape";
import HeroPanel from "@/components/HeroPanel";
import ServicesPanel from "@/components/ServicesPanel";
import PortfolioPanel from "@/components/PortfolioPanel";
import TutorPanel from "@/components/TutorPanel";
import ContactPanel from "@/components/ContactPanel";
import Footer from "@/components/Footer";
import NavBar from "@/components/NavBar";

export default function Home() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          timeZone: "Europe/London",
        }) + " GMT"
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <NavBar time={time} />
      <TickerTape />
      <HeroPanel />
      <ServicesPanel />
      <PortfolioPanel />
      <TutorPanel />
      <ContactPanel />
      <Footer />
    </main>
  );
}
