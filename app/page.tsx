
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Camera,
  Check,
  Flower2,
  Gem,
  Heart,
  Menu,
  Music,
  Search,
  ShieldCheck,
  Sparkles,
  Utensils,
  X,
} from "lucide-react";

const categories = [
  {
    name: "Photography",
    description: "Capture every beautiful moment.",
    icon: Camera,
    image: "photo-card",
  },
  {
    name: "Venues",
    description: "Find the perfect place to celebrate.",
    icon: Gem,
    image: "venue-card",
  },
  {
    name: "Decoration",
    description: "Bring your dream wedding to life.",
    icon: Flower2,
    image: "decoration-card",
  },
  {
    name: "Catering",
    description: "Delight your guests with great food.",
    icon: Utensils,
    image: "catering-card",
  },
  {
    name: "Music & Entertainment",
    description: "Make your celebration unforgettable.",
    icon: Music,
    image: "music-card",
  },
  {
    name: "Wedding Planning",
    description: "Let the experts handle every detail.",
    icon: Heart,
    image: "planning-card",
  },
];

const benefits = [
  {
    number: "01",
    title: "Discover your style",
    description:
      "Explore wedding services and find inspiration that matches your vision.",
    icon: Sparkles,
  },
  {
    number: "02",
    title: "Connect with vendors",
    description:
      "Explore service providers, compare their offerings and send booking requests.",
    icon: Heart,
  },
  {
    number: "03",
    title: "Celebrate with confidence",
    description:
      "Keep your bookings organized and focus on the moments that matter.",
    icon: Check,
  },
];

export default function Home() {
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return categories;

    return categories.filter(
      (category) =>
        category.name.toLowerCase().includes(query) ||
        category.description.toLowerCase().includes(query)
    );
  }, [search]);

  return (
    <main>
      <header className="site-header">
        <div className="header-inner">
          <Link href="/" className="brand" aria-label="WedPlan home">
            <span className="brand-mark">
              <Heart size={19} fill="currentColor" />
            </span>
            <span>
              Wed<span className="brand-accent">Plan</span>
              <small>YOUR DAY, YOUR WAY</small>
            </span>
          </Link>

          <nav className={`main-nav ${menuOpen ? "nav-open" : ""}`}>
            <a href="#services" onClick={() => setMenuOpen(false)}>
              Explore services
            </a>
            <a href="#how-it-works" onClick={() => setMenuOpen(false)}>
              How it works
            </a>
            <a href="#why-wedplan" onClick={() => setMenuOpen(false)}>
              Why WedPlan
            </a>
            <a href="#get-started" onClick={() => setMenuOpen(false)}>
              For vendors
            </a>
          </nav>

          <div className="header-actions">
            <Link href="/sign-in" className="login-link">
              Log in
            </Link>
            <Link href="/sign-up" className="button button-dark header-cta">
              Get started <ArrowUpRight size={16} />
            </Link>
          </div>

          <button
            type="button"
            className="mobile-menu-button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={23} /> : <Menu size={23} />}
          </button>
        </div>
      </header>

      <section className="hero">
        <div className="hero-image" />
        <div className="hero-overlay" />

        <div className="hero-content page-container">
          <span className="eyebrow hero-eyebrow">
            <Sparkles size={14} /> YOUR DREAM WEDDING STARTS HERE
          </span>

          <h1>
            Every love story
            <br />
            deserves a <em>beautiful</em>
            <br />
            beginning.
          </h1>

          <p className="hero-description">
            From finding the perfect venue to choosing every little detail,
            discover everything you need to make your wedding unforgettable.
          </p>

          <div className="hero-buttons">
            <a href="#services" className="button button-gold">
              Explore wedding services <ArrowRight size={17} />
            </a>
            <a href="#how-it-works" className="hero-text-link">
              Discover WedPlan <ArrowUpRight size={16} />
            </a>
          </div>

          <div className="hero-note">
            <span className="hero-note-icon">
              <Heart size={16} />
            </span>
            <span>One place for all your wedding plans.</span>
          </div>
        </div>

        <div className="hero-bottom page-container">
          <span>MADE FOR YOUR MOST SPECIAL DAY</span>
          <span>LOVE · DETAILS · MEMORIES</span>
        </div>
      </section>

      <section className="intro-section page-container" id="why-wedplan">
        <div className="intro-label">
          <span className="eyebrow">A LITTLE MORE MAGIC</span>
          <span className="intro-line" />
        </div>

        <div className="intro-content">
          <h2>
            Planning a wedding should feel like
            <em> falling in love.</em>
          </h2>
          <p>
            The excitement, the little details, the beautiful possibilities.
            WedPlan brings wedding services and planning together so you can
            spend less time searching and more time dreaming.
          </p>
        </div>
      </section>

      <section className="services-section" id="services">
        <div className="page-container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">EXPLORE THE POSSIBILITIES</span>
              <h2>
                Everything you need,
                <br />
                <em>all in one place.</em>
              </h2>
            </div>
            <p>
              Find the right people, places and services to bring your
              celebration to life.
            </p>
          </div>

          <div className="service-search">
            <Search size={19} />
            <input
              type="search"
              placeholder="Search photography, venues, catering..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search wedding services"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                <X size={17} />
              </button>
            )}
            <span className="search-hint">EXPLORE SERVICES</span>
          </div>

          <div className="category-grid">
            {filteredCategories.map((category) => {
              const Icon = category.icon;

              return (
                <Link
                  href="/sign-up"
                  className="category-card"
                  key={category.name}
                >
                  <div className={`category-image ${category.image}`}>
                    <span className="category-icon">
                      <Icon size={20} />
                    </span>
                    <span className="category-arrow">
                      <ArrowUpRight size={19} />
                    </span>
                  </div>
                  <div className="category-info">
                    <div>
                      <h3>{category.name}</h3>
                      <p>{category.description}</p>
                    </div>
                    <ArrowRight size={18} className="category-link-icon" />
                  </div>
                </Link>
              );
            })}
          </div>

          {filteredCategories.length === 0 && (
            <div className="empty-search">
              <Search size={26} />
              <h3>No matching services found</h3>
              <p>Try another search term to explore our categories.</p>
              <button
                type="button"
                className="text-button"
                onClick={() => setSearch("")}
              >
                Clear search
              </button>
            </div>
          )}

          <div className="services-bottom">
            <span>
              <Heart size={15} /> Find inspiration for every detail.
            </span>
            <Link href="/sign-up" className="text-button">
              Start exploring <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <section className="process-section page-container" id="how-it-works">
        <div className="process-image">
          <div className="process-image-caption">
            <span>THE ART OF A BEAUTIFUL DAY</span>
            <Heart size={18} />
          </div>
        </div>

        <div className="process-content">
          <span className="eyebrow">SIMPLE. THOUGHTFUL. BEAUTIFUL.</span>
          <h2>
            Your journey to
            <br />
            <em>forever, simplified.</em>
          </h2>
          <p className="process-description">
            Great celebrations begin with a little planning. WedPlan helps
            you organize the journey, one meaningful step at a time.
          </p>

          <div className="process-list">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;

              return (
                <div className="process-item" key={benefit.number}>
                  <span className="process-number">{benefit.number}</span>
                  <div className="process-item-icon">
                    <Icon size={19} />
                  </div>
                  <div>
                    <h3>{benefit.title}</h3>
                    <p>{benefit.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <Link href="/sign-up" className="button button-dark">
            Begin your journey <ArrowRight size={17} />
          </Link>
        </div>
      </section>

      <section className="trust-section" id="get-started">
        <div className="page-container trust-inner">
          <div className="trust-heading">
            <span className="eyebrow">A BETTER WAY TO PLAN</span>
            <h2>
              Thoughtful planning.
              <br />
              <em>Meaningful memories.</em>
            </h2>
          </div>

          <div className="trust-grid">
            <div className="trust-item">
              <ShieldCheck size={27} />
              <h3>Organized planning</h3>
              <p>Keep your wedding service requests and bookings together.</p>
            </div>
            <div className="trust-item">
              <Heart size={27} />
              <h3>Made for everyone</h3>
              <p>A dedicated experience for couples and wedding vendors.</p>
            </div>
            <div className="trust-item">
              <Sparkles size={27} />
              <h3>Your own vision</h3>
              <p>Discover services that help shape your special celebration.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="final-cta page-container">
        <div className="final-cta-decoration">
          <Heart size={32} />
        </div>
        <span className="eyebrow">YOUR STORY. YOUR CELEBRATION.</span>
        <h2>
          Let&apos;s make something
          <br />
          <em>beautiful together.</em>
        </h2>
        <p>
          Your dream wedding is made of a thousand little moments.
         Let&apos;s start planning them.
        </p>
        <div className="final-cta-actions">
          <Link href="/sign-up" className="button button-gold">
            Create your account <ArrowUpRight size={17} />
          </Link>
          <Link href="/sign-in" className="final-login-link">
            Already have an account? Log in
          </Link>
        </div>
      </section>

      <footer className="site-footer">
        <div className="page-container footer-main">
          <Link href="/" className="brand footer-brand">
            <span className="brand-mark">
              <Heart size={19} fill="currentColor" />
            </span>
            <span>
              Wed<span className="brand-accent">Plan</span>
              <small>YOUR DAY, YOUR WAY</small>
            </span>
          </Link>

          <p>Thoughtfully bringing wedding dreams together.</p>

          <div className="footer-links">
            <a href="#services">Services</a>
            <a href="#how-it-works">How it works</a>
            <Link href="/sign-in">Log in</Link>
            <Link href="/sign-up">Join WedPlan</Link>
          </div>
        </div>

        <div className="page-container footer-bottom">
         <span>© 2026 WedPlan. All rights reserved.</span>
          <span>MADE WITH LOVE <Heart size={13} fill="currentColor" /></span>
        </div>
      </footer>
    </main>
  );
}
