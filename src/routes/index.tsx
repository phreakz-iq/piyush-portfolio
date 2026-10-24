import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import Preloader from "@/components/Preloader";
import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Projects from "@/components/Projects";
import Testimonials from "@/components/Testimonials";
import Certificate from "@/components/Certificate";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Piyush — Video Editor & Motion Designer Portfolio" },
      {
        name: "description",
        content:
          "Portfolio of Piyush, a video editor and motion designer crafting cinematic brand films, reels and campaigns with 3D, motion graphics and color grading.",
      },
      { property: "og:title", content: "Piyush — Video Editor & Motion Designer Portfolio" },
      {
        property: "og:description",
        content:
          "Portfolio of Piyush, a video editor and motion designer crafting cinematic brand films, reels and campaigns with 3D, motion graphics and color grading.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [loaded, setLoaded] = useState(false);
  const handleLoaded = useCallback(() => setLoaded(true), []);

  return (
    <>
      {!loaded && <Preloader onDone={handleLoaded} />}
      <div id="main">
        <Nav />
        <main>
          <Hero />
          <About />
          <Projects />
          <Testimonials />
          <Certificate />
          <Contact />
        </main>
        <Footer />
        
      </div>

    </>
  );
}
