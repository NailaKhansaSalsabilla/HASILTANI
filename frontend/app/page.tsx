"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  Leaf,
  PackageCheck,
  ScanLine,
  Sprout,
  Store,
  UtensilsCrossed,
} from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { ScanAccessLink } from "@/components/ScanAccessLink";

gsap.registerPlugin(ScrollTrigger);

const heroSlides = [
  {
    src: "/brand/hero-slides/slide-komoditas.png",
    alt: "Pisang, tomat, jeruk, dan mangga sebagai empat komoditas HASILTANI",
    position: "center 56%",
  },
  {
    src: "/brand/hero-slides/slide-jeruk.png",
    alt: "Petani memanen jeruk di kebun",
    position: "center 47%",
  },
  {
    src: "/brand/hero-slides/slide-tomat.png",
    alt: "Tomat matang dan belum matang di kebun",
    position: "58% center",
  },
  {
    src: "/brand/hero-slides/slide-mangga.png",
    alt: "Mangga matang sebagai salah satu komoditas HASILTANI",
    position: "center center",
    soft: true,
  },
  {
    src: "/brand/hero-slides/slide-pisang.png",
    alt: "Tandan pisang hijau di kebun",
    position: "58% center",
  },
];

const commodities = [
  {
    slug: "pisang",
    name: "Pisang",
    scientific: "Musa spp.",
    eyebrow: "4 kondisi visual",
    image: "/commodities/pisang.jpg",
    note: "Belum matang, matang, terlalu matang, hingga rusak berat diarahkan ke jalur nilai yang sesuai.",
  },
  {
    slug: "tomat",
    name: "Tomat",
    scientific: "Solanum lycopersicum",
    eyebrow: "4 kondisi visual",
    image: "/commodities/tomat.jpg",
    note: "Kondisi visual membantu menentukan jalur fresh, pematangan lanjutan, pengolahan, atau alternatif.",
  },
  {
    slug: "mangga",
    name: "Mangga",
    scientific: "Mangifera indica",
    eyebrow: "3 kelas AI + verifikasi",
    image: "/commodities/mangga.jpg",
    note: "Tingkat kematangan dibaca AI, sementara rusak berat tetap dapat dikunci melalui verifikasi pengguna.",
  },
  {
    slug: "jeruk",
    name: "Jeruk",
    scientific: "Citrus spp.",
    eyebrow: "3 kelas AI + verifikasi",
    image: "/commodities/jeruk.jpg",
    note: "Analisis kematangan diteruskan ke Smart Destination dengan jalur fresh, olahan, atau nilai alternatif.",
  },
];

const flow = [
  {
    number: "01",
    icon: Camera,
    title: "Ambil foto hasil tani",
    text: "Gunakan kamera langsung atau pilih 1–3 foto dari galeri. Beberapa sudut membantu analisis lebih stabil.",
  },
  {
    number: "02",
    icon: ScanLine,
    title: "AI membaca kondisi",
    text: "Model menganalisis komoditas yang dipilih dan menggabungkan hasil beberapa foto melalui consensus.",
  },
  {
    number: "03",
    icon: CheckCircle2,
    title: "Konfirmasi kondisi",
    text: "Pengguna tetap memegang keputusan akhir agar hasil AI yang meragukan tidak langsung menentukan jalur.",
  },
  {
    number: "04",
    icon: PackageCheck,
    title: "Dapatkan jalur & nilai",
    text: "HASILTANI menerjemahkan kondisi menjadi Smart Destination, buyer yang sesuai, dan nilai potensial.",
  },
];

const routes = [
  {
    icon: Store,
    label: "Jalur A",
    title: "Fresh Market",
    description: "Untuk hasil yang sesuai kebutuhan pasar segar, retail, horeca, dan buyer fresh.",
    examples: "Matang • kualitas visual layak",
    action: "Lihat arah fresh",
    message:
      "Setelah kondisi dikonfirmasi matang dan layak visual, batch diprioritaskan ke kebutuhan pasar segar. Harga mengikuti harga acuan atau penawaran buyer yang tersedia.",
  },
  {
    icon: UtensilsCrossed,
    label: "Jalur B",
    title: "Pengolahan",
    description: "Untuk keripik, puree, sambal, juice, bakery, tepung, dan bentuk olahan lain.",
    examples: "Mentah tertentu • tua • terlalu matang layak",
    action: "Lihat arah olahan",
    message:
      "Hasil yang tidak ideal untuk fresh market tetapi masih layak pangan diarahkan ke kebutuhan pengolahan. Tujuannya menjaga hasil tetap punya pemanfaatan dan nilai.",
  },
  {
    icon: Leaf,
    label: "Jalur C",
    title: "Nilai Alternatif",
    description: "Untuk hasil rusak berat yang tidak diteruskan ke jalur pangan secara otomatis.",
    examples: "Kompos • non-pangan • pakan setelah verifikasi",
    action: "Lihat arah alternatif",
    message:
      "Kondisi rusak berat dibatasi dari jalur pangan. Sistem mengarahkan ke kompos atau pemanfaatan non-pangan; opsi pakan hanya ditampilkan setelah verifikasi yang sesuai.",
  },
];

export default function HomePage() {
  const scope = useRef<HTMLElement | null>(null);
  const heroCycleRef = useRef<gsap.core.Timeline | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeRoute, setActiveRoute] = useState<string | null>(null);

  const animateFlowCard = (card: HTMLElement) => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const icon = card.querySelector<HTMLElement>(".flow-icon");
    const number = card.querySelector<HTMLElement>(".flow-number");

    gsap.killTweensOf([card, icon, number]);

    gsap
      .timeline()
      .to(card, {
        y: 2,
        scale: 0.988,
        duration: 0.08,
        ease: "power2.in",
      })
      .to(card, {
        y: -8,
        scale: 1.018,
        duration: 0.20,
        ease: "power3.out",
      })
      .to(card, {
        y: 0,
        scale: 1,
        duration: 0.48,
        ease: "elastic.out(1, 0.55)",
      });

    if (icon) {
      gsap
        .timeline()
        .to(icon, {
          rotation: -9,
          scale: 0.92,
          duration: 0.10,
          ease: "power2.in",
        })
        .to(icon, {
          rotation: 8,
          scale: 1.09,
          duration: 0.18,
          ease: "power2.out",
        })
        .to(icon, {
          rotation: 0,
          scale: 1,
          duration: 0.35,
          ease: "back.out(2)",
        });
    }

    if (number) {
      gsap
        .timeline()
        .to(number, {
          scale: 1.16,
          color: "#176b43",
          duration: 0.16,
          ease: "power2.out",
        })
        .to(number, {
          scale: 1,
          duration: 0.38,
          ease: "back.out(2)",
        });
    }
  };

  useEffect(() => {
    const root = scope.current;
    if (!root) return;

    const slideElements = Array.from(
      root.querySelectorAll<HTMLElement>(".hero-slide")
    );
    const titleLines = Array.from(
      root.querySelectorAll<HTMLElement>(".hero-title-line")
    );
    const activeElement = slideElements[activeSlide];
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    heroCycleRef.current?.kill();
    gsap.killTweensOf(slideElements);
    gsap.killTweensOf(titleLines);

    slideElements.forEach((slide, index) => {
      if (index === activeSlide) {
        gsap.fromTo(
          slide,
          { autoAlpha: 0 },
          {
            autoAlpha: 1,
            duration: reduceMotion ? 0.01 : 1.15,
            ease: "power2.out",
            overwrite: true,
          }
        );
      } else {
        gsap.to(slide, {
          autoAlpha: 0,
          duration: reduceMotion ? 0.01 : 0.9,
          ease: "power2.out",
          overwrite: true,
        });
      }
    });

    if (activeElement) {
      const activeImage = activeElement.querySelector("img");
      if (activeImage) {
        gsap.killTweensOf(activeImage);
        gsap.fromTo(
          activeImage,
          { scale: reduceMotion ? 1 : 1.075 },
          {
            scale: 1.015,
            duration: reduceMotion ? 0.01 : 6.2,
            ease: "none",
            overwrite: true,
          }
        );
      }
    }

    gsap.set(titleLines, {
      transformPerspective: 1100,
      transformOrigin: "left center",
      transformStyle: "preserve-3d",
    });

    if (reduceMotion) {
      gsap.set(titleLines, {
        autoAlpha: 1,
        x: 0,
        y: 0,
        z: 0,
        scale: 1,
        rotationX: 0,
        filter: "blur(0px)",
      });

      const timer = window.setTimeout(() => {
        setActiveSlide((current) => (current + 1) % heroSlides.length);
      }, 6000);

      return () => window.clearTimeout(timer);
    }

    const cycle = gsap.timeline({
      defaults: { overwrite: "auto" },
      onComplete: () => {
        setActiveSlide((current) => (current + 1) % heroSlides.length);
      },
    });

    cycle
      .fromTo(
        titleLines,
        {
          autoAlpha: 0,
          y: 30,
          z: -230,
          scale: 0.87,
          rotationX: -8,
          filter: "blur(15px)",
        },
        {
          autoAlpha: 1,
          y: 0,
          z: 0,
          scale: 1,
          rotationX: 0,
          filter: "blur(0px)",
          duration: 0.95,
          stagger: 0.13,
          ease: "power3.out",
        }
      )
      .to({}, { duration: 3.05 })
      .to(titleLines, {
        autoAlpha: 0,
        y: -8,
        z: 125,
        scale: 1.045,
        rotationX: 4,
        filter: "blur(9px)",
        duration: 0.68,
        stagger: 0.055,
        ease: "power2.in",
      });

    heroCycleRef.current = cycle;

    return () => {
      cycle.kill();
    };
  }, [activeSlide]);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // ScanAccessLink melakukan pengecekan session secara async dan dapat
        // muncul sesaat setelah render pertama. Karena itu, animasikan wrapper
        // tombol sebagai satu unit, bukan masing-masing child. Ini mencegah
        // salah satu tombol tertinggal dengan transform translateY dari GSAP.
        gsap.set(".home .hero-actions-foundation > *", {
          clearProps: "transform,opacity",
        });

        const intro = gsap.timeline({ defaults: { ease: "power3.out" } });

        intro
          .from(".home .hero-description", {
            y: 20,
            opacity: 0,
            duration: 0.65,
            delay: 0.35,
          })
          .from(
            ".home .hero-actions-foundation",
            {
              y: 16,
              opacity: 0,
              duration: 0.55,
              clearProps: "transform,opacity",
            },
            "-=0.34"
          )
          .from(
            ".home .hero-signal",
            {
              y: 14,
              opacity: 0,
              duration: 0.48,
              stagger: 0.07,
            },
            "-=0.28"
          )
          .from(
            ".home .hero-insight",
            { x: 24, opacity: 0, duration: 0.72 },
            "-=0.55"
          )
          .from(
            ".home .hero-slider-nav > *",
            { y: 8, opacity: 0, duration: 0.4, stagger: 0.06 },
            "-=0.45"
          );

        gsap.to(".home .hero-slides", {
          yPercent: 5,
          ease: "none",
          scrollTrigger: {
            trigger: ".home .hero-foundation",
            start: "top top",
            end: "bottom top",
            scrub: 1.1,
          },
        });

        gsap.utils.toArray<HTMLElement>(".home [data-reveal]").forEach((element) => {
          gsap.from(element, {
            y: 34,
            opacity: 0,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: element,
              start: "top 86%",
              once: true,
            },
          });
        });

        gsap.from(".home .commodity-grid-foundation", {
          y: 18,
          opacity: 0,
          duration: 0.62,
          ease: "power3.out",
          clearProps: "transform,opacity",
          scrollTrigger: {
            trigger: ".home .commodity-grid-foundation",
            start: "top 84%",
            once: true,
          },
        });

        // Cards intentionally do NOT receive individual y/rotation reveal.
        // Hash navigation can enter #komoditas while a stagger is still running,
        // which made the four cards look randomly tilted / vertically offset.
        gsap.set(".home .commodity-card-foundation", {
          clearProps: "transform,opacity,rotation",
        });

        gsap.from(".home .flow-card-foundation", {
          y: 42,
          opacity: 0,
          stagger: 0.1,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".home .flow-grid-foundation",
            start: "top 82%",
            once: true,
          },
        });

        gsap.from(".home .route-card-foundation", {
          x: 42,
          opacity: 0,
          stagger: 0.11,
          duration: 0.75,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".home .route-board-foundation",
            start: "top 76%",
            once: true,
          },
        });

        gsap.to(".home .ambient-orb.one", {
          x: 24,
          y: -16,
          duration: 6,
          yoyo: true,
          repeat: -1,
          ease: "sine.inOut",
        });

        gsap.to(".home .ambient-orb.two", {
          x: -18,
          y: 22,
          duration: 7.5,
          yoyo: true,
          repeat: -1,
          ease: "sine.inOut",
        });
      });

      return () => mm.revert();
    },
    { scope }
  );

  const chooseSlide = (index: number) => {
    if (index === activeSlide) {
      heroCycleRef.current?.restart();
      return;
    }
    setActiveSlide(index);
  };

  return (
    <>
      <SiteHeader />

      <main ref={scope} className="home">
        <section className="hero-foundation hero-slider" id="beranda">
          <div className="hero-slides" aria-hidden="true">
            {heroSlides.map((slide, index) => (
              <div
                className={`hero-slide ${slide.soft ? "soft-source" : ""}`}
                key={slide.src}
                data-slide-index={index}
              >
                <Image
                  src={slide.src}
                  alt=""
                  fill
                  priority={index < 2}
                  sizes="100vw"
                  style={{ objectPosition: slide.position }}
                />
              </div>
            ))}
          </div>

          <div className="hero-overlay-foundation hero-overlay-slider" />
          <div className="hero-grid-pattern" />
          <div className="ambient-orb one" aria-hidden="true" />
          <div className="ambient-orb two" aria-hidden="true" />

          <div className="container hero-content">
            <div className="hero-copy-foundation">
              <h1 className="hero-title-foundation hero-title-slider" aria-label="Setiap Panen Punya Jalur. Setiap Hasil Punya Nilai.">
                <span className="hero-title-mask">
                  <span className="hero-title-line">Setiap Panen</span>
                </span>
                <span className="hero-title-mask">
                  <span className="hero-title-line accent">Punya Jalur.</span>
                </span>
                <span className="hero-title-mask">
                  <span className="hero-title-line compact">Setiap Hasil Punya Nilai.</span>
                </span>
              </h1>

              <p className="hero-description">
                Kelola, pantau, dan salurkan hasil tani dengan lebih mudah melalui satu
                platform terintegrasi—dari analisis kondisi visual hingga jalur pemanfaatan
                dan nilai potensial.
              </p>

              <div className="hero-actions-foundation">
                <ScanAccessLink className="btn-foundation btn-primary-foundation">
                  <ScanLine size={18} />
                  Coba Analisis Hasil
                  <ArrowRight size={17} />
                </ScanAccessLink>
                <Link href="#cara-kerja" className="btn-foundation btn-glass">
                  Lihat Cara Kerja
                </Link>
              </div>

              <div className="hero-signals">
                <div className="hero-signal">
                  <strong>4</strong>
                  <span>komoditas utama</span>
                </div>
                <div className="hero-signal">
                  <strong>1–3</strong>
                  <span>foto per analisis</span>
                </div>
                <div className="hero-signal">
                  <strong>A / B / C</strong>
                  <span>jalur nilai hasil</span>
                </div>
              </div>
            </div>

            <aside className="hero-insight" aria-label="Ringkasan proses HASILTANI">
              <div className="hero-insight-top">
                <span className="live-dot" />
                Alur HASILTANI
              </div>

              <div className="hero-insight-stack">
                <div>
                  <span>01</span>
                  <p>Foto hasil tani</p>
                </div>
                <div>
                  <span>02</span>
                  <p>Analisis kondisi</p>
                </div>
                <div>
                  <span>03</span>
                  <p>Verifikasi pengguna</p>
                </div>
                <div className="active">
                  <span>04</span>
                  <p>Jalur + nilai</p>
                </div>
              </div>

              <div className="hero-insight-footer">
                <Sprout size={18} />
                <span>
                  AI membantu membaca kondisi. Keputusan jalur tetap transparan dan dapat
                  diverifikasi.
                </span>
              </div>
            </aside>
          </div>

          <div className="hero-slider-nav" role="group" aria-label="Pilih gambar hero">
            {heroSlides.map((slide, index) => (
              <button
                type="button"
                key={slide.src}
                className={index === activeSlide ? "active" : ""}
                onClick={() => chooseSlide(index)}
                aria-label={`Tampilkan gambar ${index + 1}: ${slide.alt}`}
                aria-current={index === activeSlide ? "true" : undefined}
              >
                <span />
              </button>
            ))}
          </div>

          <a className="hero-scroll-cue" href="#komoditas" aria-label="Geser ke bagian komoditas">
            <span />
            Jelajahi
          </a>
        </section>

        <section className="commodity-section-foundation commodity-section-catalog section-foundation" id="komoditas">
          <div className="ambient-orb three" aria-hidden="true" />

          <div className="container">
            <div className="commodity-head" data-reveal>
              <div>
                <span className="section-kicker">Komoditas HASILTANI</span>
                <h2>
                  Kenali hasil tani,
                  <br />
                  temukan <em>jalur terbaiknya.</em>
                </h2>
              </div>
              <p>
                Empat komoditas utama dianalisis dengan kelas kondisi yang sesuai.
                Buka detail untuk melihat kondisi, jalur pemanfaatan, nilai demo, dan
                peran AI pada setiap komoditas.
              </p>
            </div>

            <div className="commodity-grid-foundation commodity-grid-catalog">
              {commodities.map((commodity, index) => (
                <Link
                  href={`/komoditas/${commodity.slug}`}
                  className="commodity-card-foundation commodity-card-catalog"
                  key={commodity.name}
                  aria-label={`Lihat detail komoditas ${commodity.name}`}
                >
                  <div className="commodity-image-foundation commodity-image-catalog">
                    <Image
                      src={commodity.image}
                      alt={`${commodity.name} — komoditas HASILTANI`}
                      fill
                      sizes="(max-width: 620px) 100vw, (max-width: 1020px) 50vw, 25vw"
                    />
                    <span className="commodity-index">0{index + 1}</span>
                  </div>

                  <div className="commodity-body-foundation commodity-body-catalog">
                    <div className="commodity-meta">
                      <span>{commodity.eyebrow}</span>
                      <small>{commodity.scientific}</small>
                    </div>
                    <h3>{commodity.name}</h3>
                    <p>{commodity.note}</p>
                    <span className="commodity-link">
                      Lihat Detail
                      <ArrowRight size={16} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="flow-section-foundation section-foundation flow-section-workflow" id="cara-kerja">
          <div className="container flow-container">
            <div className="section-head-foundation centered flow-head" data-reveal>
              <div>
                <span className="section-kicker">Cara kerja</span>
                <h2>
                  Satu alur yang terasa
                  <br />
                  <em>ringkas dan masuk akal.</em>
                </h2>
              </div>
              <p>
                Dari foto menuju keputusan dalam empat langkah yang jelas. Setiap tahap
                dibuat singkat agar pengguna tetap memahami apa yang sedang dilakukan sistem.
              </p>
            </div>

            <div className="flow-grid-foundation flow-grid-workflow">
              {flow.map(({ number, icon: Icon, title, text }) => (
                <article
                  className="flow-card-foundation flow-card-workflow"
                  key={number}
                  role="button"
                  tabIndex={0}
                  aria-label={`${number}. ${title}`}
                  onClick={(event) => animateFlowCard(event.currentTarget)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      animateFlowCard(event.currentTarget);
                    }
                  }}
                >
                  <div className="flow-card-shine" aria-hidden="true" />
                  <div className="flow-card-top">
                    <span className="flow-number">{number}</span>
                    <div className="flow-icon">
                      <Icon size={20} />
                    </div>
                  </div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="route-section-foundation section-foundation route-section-routing" id="jalur">
          <div className="route-glow-foundation route-glow-routing" aria-hidden="true" />

          <div className="container route-container">
            <div className="section-head-foundation light route-head" data-reveal>
              <div>
                <span className="section-kicker">Smart Destination</span>
                <h2>
                  Setiap kondisi
                  <br />
                  <em>punya arah yang jelas.</em>
                </h2>
              </div>
              <p>
                HASILTANI tidak berhenti pada label kondisi. Hasil yang sudah dianalisis dan
                dikonfirmasi diterjemahkan menjadi jalur fresh, pengolahan, atau nilai alternatif.
              </p>
            </div>

            <div className="route-board-foundation route-board-routing">
              <div className="route-source-foundation route-source-routing">
                <div className="route-source-visual-foundation route-source-visual-routing">
                  <Image
                    src="/brand/hero-slides/slide-komoditas.png"
                    alt="Hasil tani untuk dianalisis"
                    fill
                    sizes="(max-width: 820px) 520px, 300px"
                  />
                  <div className="route-scan-line" />
                  <span className="route-source-badge">AI + verifikasi</span>
                </div>

                <div className="route-source-copy-foundation route-source-copy-routing">
                  <span>INPUT</span>
                  <strong>Kondisi hasil tani</strong>
                  <small>Foto → analisis AI → konfirmasi pengguna</small>
                </div>
              </div>

              <div className="route-connector-foundation route-connector-routing" aria-hidden="true">
                <span className="route-runner" />
              </div>

              <div className="route-destinations-foundation route-destinations-routing">
                {routes.map(
                  ({ icon: Icon, label, title, description, examples, action, message }) => {
                    const isOpen = activeRoute === title;

                    return (
                      <article
                        className={`route-card-foundation route-card-routing ${isOpen ? "is-open" : ""}`}
                        key={title}
                      >
                        <div className="route-card-main">
                          <div className="route-card-icon-foundation route-card-icon-routing">
                            <Icon size={20} />
                          </div>

                          <div className="route-card-copy">
                            <span>{label}</span>
                            <h3>{title}</h3>
                            <p>{description}</p>
                            <small>{examples}</small>
                          </div>

                          <button
                            type="button"
                            className="route-action"
                            aria-expanded={isOpen}
                            onClick={() => setActiveRoute(isOpen ? null : title)}
                          >
                            <span>{isOpen ? "Tutup" : action}</span>
                            <ArrowRight
                              size={17}
                              className="route-arrow"
                              aria-hidden="true"
                            />
                          </button>
                        </div>

                        <div
                          className="route-message"
                          aria-hidden={!isOpen}
                        >
                          <div>
                            <strong>Apa yang terjadi?</strong>
                            <p>{message}</p>
                          </div>
                          <ScanAccessLink className="route-message-cta">
                            Coba analisis
                            <ArrowRight size={15} />
                          </ScanAccessLink>
                        </div>
                      </article>
                    );
                  }
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="closing-section-foundation section-foundation closing-section-about" id="tentang">
          <div className="container">
            <div className="closing-card" data-reveal>
              <div className="closing-noise" />
              <div className="closing-copy">
                <span className="section-kicker">HASILTANI</span>
                <h2>
                  Hasil tani tidak berhenti
                  <br />
                  pada satu kondisi.
                </h2>
                <p>
                  Analisis kondisi, verifikasi manusia, Smart Destination, dan nilai potensial
                  disatukan dalam pengalaman yang sederhana untuk digunakan.
                </p>
                <div className="closing-actions">
                  <ScanAccessLink className="btn-foundation btn-light">
                    <ScanLine size={18} />
                    Coba Scan Sekarang
                  </ScanAccessLink>
                  <Link href="/#cara-kerja" className="btn-foundation btn-outline-light">
                    Pelajari HASILTANI
                    <ArrowRight size={17} />
                  </Link>
                </div>
              </div>

              <div className="closing-mark closing-brand" aria-label="HASILTANI">
                <div className="closing-brand-mark">
                  <Image
                    src="/brand/identity-mascot.png"
                    alt=""
                    width={122}
                    height={122}
                  />
                </div>
                <div className="closing-brand-word">
                  <Image
                    src="/brand/identity-wordmark.png"
                    alt="HASILTANI"
                    width={420}
                    height={130}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
