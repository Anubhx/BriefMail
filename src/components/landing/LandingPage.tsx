"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomCursor } from "./CustomCursor";
import { Nav } from "./Nav";
import { Hero } from "./Hero";
import { ProblemSection } from "./ProblemSection";
import { PipelineSection } from "./PipelineSection";
import { SurfacesGrid } from "./SurfacesGrid";
import { PhilosophySection } from "./PhilosophySection";
import { FinalCTA } from "./FinalCTA";
import { Footer } from "./Footer";

// Register ScrollTrigger safely
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      // Set all elements to visible immediately without animation
      const elements = container.querySelectorAll(
        "[data-reveal], [data-reveal-item], [data-reveal-hero], [data-demo-row], [data-demo-tag]"
      );
      elements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        htmlEl.style.opacity = "1";
        htmlEl.style.transform = "none";
      });
      return;
    }

    const mm = gsap.matchMedia();

    const ctx = gsap.context(() => {
      // Nav scroll class toggle
      const navEl = document.getElementById("nav");
      if (navEl) {
        ScrollTrigger.create({
          start: 40,
          onUpdate: (self) => {
            if (self.scroll() > 40) {
              navEl.classList.add("scrolled");
            } else {
              navEl.classList.remove("scrolled");
            }
          },
        });
      }

      // Hero load sequence timeline
      const heroTl = gsap.timeline({
        defaults: { ease: "power3.out" },
        delay: 0.1,
      });

      heroTl
        .from("[data-reveal-hero]", {
          y: 22,
          opacity: 0,
          duration: 0.9,
          stagger: 0.12,
        })
        .from(
          "[data-demo-row]",
          {
            opacity: 0,
            x: 14,
            duration: 0.5,
            stagger: 0.1,
          },
          "-=0.5"
        )
        .to(
          "[data-demo-tag]",
          {
            opacity: 1,
            x: 0,
            duration: 0.4,
            stagger: 0.12,
            ease: "back.out(1.6)",
          },
          "-=0.2"
        );

      // DESKTOP specific animations (screen > 768px)
      mm.add("(min-width: 769px)", () => {
        // Individual scroll-triggered reveals
        const revealElements = gsap.utils.toArray<HTMLElement>("[data-reveal]");
        revealElements.forEach((el) => {
          gsap.fromTo(
            el,
            { y: 26, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.9,
              ease: "power3.out",
              scrollTrigger: {
                trigger: el,
                start: "top 85%",
                once: true,
              },
            }
          );
        });

        // Group reveals with stagger
        const revealGroups = gsap.utils.toArray<HTMLElement>("[data-reveal-group]");
        revealGroups.forEach((group) => {
          const items = group.querySelectorAll("[data-reveal-item]");
          gsap.fromTo(
            items,
            { y: 22, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.7,
              ease: "power3.out",
              stagger: 0.09,
              scrollTrigger: {
                trigger: group,
                start: "top 82%",
                once: true,
              },
            }
          );
        });

        // Pipeline tier emphasis
        const tiers = gsap.utils.toArray<HTMLElement>(".tier");
        tiers.forEach((tier) => {
          gsap.fromTo(
            tier,
            { opacity: 0.4 },
            {
              opacity: 1,
              duration: 0.6,
              scrollTrigger: {
                trigger: tier,
                start: "top 80%",
                once: true,
              },
            }
          );
        });

        // Surface cards subtle scrub parallax
        const cards = gsap.utils.toArray<HTMLElement>(".surface-card");
        cards.forEach((card, i) => {
          gsap.to(card, {
            y: i % 2 === 0 ? -10 : -4,
            ease: "none",
            scrollTrigger: {
              trigger: card,
              start: "top bottom",
              end: "bottom top",
              scrub: 1,
            },
          });
        });
      });

      // MOBILE specific animations (screen <= 768px): faster, lighter, no parallax scrub
      mm.add("(max-width: 768px)", () => {
        const revealElements = gsap.utils.toArray<HTMLElement>("[data-reveal]");
        revealElements.forEach((el) => {
          gsap.fromTo(
            el,
            { y: 16, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.5,
              ease: "power2.out",
              scrollTrigger: {
                trigger: el,
                start: "top 90%",
                once: true,
              },
            }
          );
        });

        const revealGroups = gsap.utils.toArray<HTMLElement>("[data-reveal-group]");
        revealGroups.forEach((group) => {
          const items = group.querySelectorAll("[data-reveal-item]");
          gsap.fromTo(
            items,
            { y: 14, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.5,
              ease: "power2.out",
              stagger: 0.06,
              scrollTrigger: {
                trigger: group,
                start: "top 88%",
                once: true,
              },
            }
          );
        });

        const tiers = gsap.utils.toArray<HTMLElement>(".tier");
        tiers.forEach((tier) => {
          gsap.fromTo(
            tier,
            { opacity: 0.5 },
            {
              opacity: 1,
              duration: 0.4,
              scrollTrigger: {
                trigger: tier,
                start: "top 85%",
                once: true,
              },
            }
          );
        });
      });
    }, container);

    return () => {
      mm.revert();
      ctx.revert();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-[var(--canvas)] text-[var(--text)] selection:bg-[var(--brand-muted)] selection:text-[var(--text)] overflow-x-hidden font-ui relative"
    >
      {/* Desktop custom cursor */}
      <CustomCursor />

      {/* Navigation */}
      <Nav />

      {/* Hero Section */}
      <Hero />

      {/* Main Content Sections */}
      <main>
        <ProblemSection />
        <PipelineSection />
        <SurfacesGrid />
        <PhilosophySection />
        <FinalCTA />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
