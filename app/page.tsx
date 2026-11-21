"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { motion } from "motion/react";

import {

  ArrowRight,

  ArrowUpRight,

  Camera,

  Check,

  Flower2,

  Gem,

  Heart,

  Loader2,

  Mail,

  MapPin,

  Menu,

  Phone,

  Search,

  ShieldCheck,

  Sparkles,

  Utensils,

  X,

} from "lucide-react";

type Service = {

  _id: string;

  serviceName: string;

  category: string;

  description: string;

  price: number;

  location: string;

  images: string[];

  vendor?: {

    _id: string;

    name: string;

    businessName?: string;

  };

};

type ServicesResponse = {

  success: boolean;

  data: Service[];

  pagination?: {

    total: number;

    totalPages: number;

  };

  message?: string;

};

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

const categories = [

  {

    name: "Photography & Videography",

    backendCategory: "Photography & Videography",

    description: "Capture every beautiful moment.",

    icon: Camera,

    image: "photo-card",

  },

  {

    name: "Wedding Venues",

    backendCategory: "Wedding Venues",

    description: "Find the perfect place to celebrate.",

    icon: Gem,

    image: "venue-card",

  },

  {

    name: "Decoration & Florist",

    backendCategory: "Decoration & Florist",

    description: "Bring your dream wedding to life.",

    icon: Flower2,

    image: "decoration-card",

  },

  {

    name: "Catering Services",

    backendCategory: "Catering Services",

    description: "Delight your guests with great food.",

    icon: Utensils,

    image: "catering-card",

  },

  {

    name: "Wedding Fashion",

    backendCategory: "Wedding Fashion",

    description: "Discover outfits and fashion details for your wedding day.",

    icon: Gem,

    image: "music-card",

  },

  {

    name: "Makeup & Styling",

    backendCategory: "Makeup & Styling",

    description: "Find the perfect look for your special day.",

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

const formatPrice = (price: number) =>

new Intl.NumberFormat("en-BD", {

    style: "currency",

    currency: "BDT",

    maximumFractionDigits: 0,

  }).format(price);

const reveal = {

  hidden: { opacity: 0, y: 24 },

  visible: { opacity: 1, y: 0 },

};

export default function Home() {

  const [search, setSearch] = useState("");

  const [menuOpen, setMenuOpen] = useState(false);

  const [services, setServices] = useState<Service[]>([]);

  const [servicesLoading, setServicesLoading] = useState(true);

  const [servicesError, setServicesError] = useState("");

  useEffect(() => {

    const controller = new AbortController();

    const loadFeaturedServices = async () => {

      if (!API_URL) {

        setServicesError("The service API is not configured.");

        setServicesLoading(false);

        return;

      }

      try {

        const response = await fetch(

          `${API_URL}/services?page=1&limit=12&sort=newest`,

          {

            method: "GET",

            signal: controller.signal,

            cache: "no-store",

          }

        );

        const result = (await response.json()) as ServicesResponse;

        if (!response.ok || !result.success || !Array.isArray(result.data)) {

          throw new Error(

            result.message || "Unable to load featured wedding services."

          );

        }

        setServices(result.data.slice(0, 6));

        setServicesError("");

      } catch (error) {

        if (error instanceof Error && error.name === "AbortError") return;

        setServicesError(

          error instanceof Error

            ? error.message

            : "Unable to load featured services."

        );

      } finally {

        if (!controller.signal.aborted) {

          setServicesLoading(false);

        }

      }

    };

    void loadFeaturedServices();

    return () => controller.abort();

  }, []);

  const filteredCategories = useMemo(() => {

    const query = search.trim().toLowerCase();

    if (!query) return categories;

    return categories.filter(

      (category) =>

        category.name.toLowerCase().includes(query) ||

        category.backendCategory.toLowerCase().includes(query) ||

        category.description.toLowerCase().includes(query)

    );

  }, [search]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {

    event.preventDefault();

    const query = search.trim();

    if (query) {

      window.location.href = `/services?search=${encodeURIComponent(query)}`;

    } else {

      window.location.href = "/services";

    }

  };

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
            <Link href="/sign-in" onClick={() => setMenuOpen(false)}>
  Log in
</Link>

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

        <motion.div

className="hero-content page-container"

initial="hidden"

animate="visible"

variants={{

            hidden: {},

            visible: {

              transition: { staggerChildren: 0.15 },

            },

          }}

        >

          <motion.span

className="eyebrow hero-eyebrow"

variants={reveal}

          >

            <Sparkles size={14} /> YOUR DREAM WEDDING STARTS HERE

          </motion.span>

          <motion.h1 variants={reveal}>

            Every love story

            <br />

            deserves a <em>beautiful</em>

            <br />

            beginning.

          </motion.h1>

          <motion.p

className="hero-description"

variants={reveal}

          >

            From finding the perfect venue to choosing every little detail,

            discover everything you need to make your wedding unforgettable.

          </motion.p>

          <motion.div className="hero-buttons" variants={reveal}>

            <Link href="/services" className="button button-gold">

              Explore wedding services <ArrowRight size={17} />

            </Link>

            <a href="#how-it-works" className="hero-text-link">

              Discover WedPlan <ArrowUpRight size={16} />

            </a>

          </motion.div>

          <motion.div className="hero-note" variants={reveal}>

            <span className="hero-note-icon">

              <Heart size={16} />

            </span>

            <span>One place for all your wedding plans.</span>

          </motion.div>

        </motion.div>

        <div className="hero-bottom page-container">

          <span>MADE FOR YOUR MOST SPECIAL DAY</span>

          <span>LOVE · DETAILS · MEMORIES</span>

        </div>

      </section>

      <motion.section

className="intro-section page-container"

id="why-wedplan"

initial="hidden"

whileInView="visible"

viewport={{ once: true, amount: 0.2 }}

variants={reveal}

transition={{ duration: 0.6 }}

      >

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

      </motion.section>

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

          <form className="service-search" onSubmit={handleSearch}>

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

            <button type="submit" className="text-button">

              Search

            </button>

          </form>

          <div className="category-grid">

            {filteredCategories.map((category, index) => {

              const Icon = category.icon;

              return (

                <motion.div

key={category.name}

initial="hidden"

whileInView="visible"

viewport={{ once: true, amount: 0.15 }}

variants={reveal}

transition={{ duration: 0.45, delay: index * 0.06 }}

                >

                  <Link

href={`/services?category=${encodeURIComponent(

category.backendCategory

                    )}`}

className="category-card"

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

                      <ArrowRight

size={18}

className="category-link-icon"

                      />

                    </div>

                  </Link>

                </motion.div>

              );

            })}

          </div>

          {filteredCategories.length === 0 && (

            <div className="empty-search">

              <Search size={26} />

              <h3>No matching categories found</h3>

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

            <Link href="/services" className="text-button">

              Browse all services <ArrowUpRight size={16} />

            </Link>

          </div>

        </div>

      </section>

      <section className="featured-section page-container">

        <div className="section-heading">

          <div>

            <span className="eyebrow">HANDPICKED FOR YOUR DAY</span>

            <h2>

              Featured wedding

              <br />

              <em>services.</em>

            </h2>

          </div>

          <p>

            Explore approved services from vendors on WedPlan and discover

            the right fit for your celebration.

          </p>

        </div>

        {servicesLoading ? (

          <div className="flex min-h-52 items-center justify-center rounded-2xl border border-[#eee5dc] bg-white">

            <div className="text-center">

              <Loader2

className="mx-auto animate-spin text-[#a77946]"

size={32}

              />

              <p className="mt-3 text-sm text-[#897d82]">

                Loading featured services...

              </p>

            </div>

          </div>

        ) : servicesError ? (

          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">

            <p className="font-semibold text-red-700">

              Featured services are temporarily unavailable.

            </p>

            <p className="mt-2 text-sm text-red-600">{servicesError}</p>

            <Link

href="/services"

className="mt-5 inline-flex items-center gap-2 font-semibold text-[#49313e]"

            >

              Browse services <ArrowRight size={16} />

            </Link>

          </div>

        ) : services.length === 0 ? (

          <div className="rounded-2xl border border-dashed border-[#dfd0c2] bg-white px-6 py-12 text-center">

            <Heart className="mx-auto text-[#a77946]" size={30} />

            <h3 className="mt-4 text-xl font-semibold text-[#49313e]">

              New services are on their way

            </h3>

            <p className="mt-2 text-sm text-[#897d82]">

              Check the service catalogue to explore available wedding services.

            </p>

            <Link

href="/services"

className="mt-5 inline-flex items-center gap-2 font-semibold text-[#49313e]"

            >

              Explore services <ArrowRight size={16} />

            </Link>

          </div>

        ) : (

          <>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

              {services.map((service, index) => (

                <motion.article

key={service._id}

className="overflow-hidden rounded-2xl border border-[#eee5dc] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"

initial="hidden"

whileInView="visible"

viewport={{ once: true, amount: 0.1 }}

variants={reveal}

transition={{ duration: 0.45, delay: index * 0.07 }}

                >

                  <Link

href={`/services/${service._id}`}

className="block"

                  >

                    <div className="relative h-56 overflow-hidden bg-[#f2ece4]">

                      {service.images?.[0] ? (

                        <img

src={service.images[0]}

alt={service.serviceName}

className="h-full w-full object-cover transition duration-500 hover:scale-105"

                        />

                      ) : (

                        <div className="flex h-full items-center justify-center text-[#a77946]">

                          <Heart size={38} />

                        </div>

                      )}

                      <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-[#49313e]">

                        {service.category}

                      </span>

                    </div>

                    <div className="p-5">

                      <h3 className="line-clamp-1 text-lg font-bold text-[#49313e]">

                        {service.serviceName}

                      </h3>

                      <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-6 text-[#897d82]">

                        {service.description}

                      </p>

                      <div className="mt-4 flex items-center gap-2 text-sm text-[#897d82]">

                        <MapPin

size={16}

className="shrink-0 text-[#a77946]"

                        />

                        <span className="line-clamp-1">

                          {service.location}

                        </span>

                      </div>

                      <div className="mt-5 flex items-center justify-between border-t border-[#f0e7df] pt-4">

                        <div>

                          <p className="text-xs text-[#a09599]">

                            Starting price

                          </p>

                          <p className="mt-1 text-lg font-bold text-[#49313e]">

                            {formatPrice(service.price)}

                          </p>

                        </div>

                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#a77946]">

                          View details <ArrowUpRight size={16} />

                        </span>

                      </div>

                      {service.vendor && (

                        <p className="mt-3 text-xs text-[#897d82]">

                          By {service.vendor.businessName || service.vendor.name}

                        </p>

                      )}

                    </div>

                  </Link>

                </motion.article>

              ))}

            </div>

            <div className="mt-8 text-center">

              <Link href="/services" className="button button-dark">

                View all wedding services <ArrowRight size={17} />

              </Link>

            </div>

          </>

        )}

      </section>

            <section

className="process-section page-container"

id="how-it-works"

      >

        <div className="process-image">

          <div className="process-image-caption">

            <span>THE ART OF A BEAUTIFUL DAY</span>

            <Heart size={18} />

          </div>

        </div>

        <div className="process-content">

          <span className="eyebrow">

            SIMPLE. THOUGHTFUL. BEAUTIFUL.

          </span>

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

            <span className="eyebrow">WHY COUPLES CHOOSE US</span>

            <h2>Why choose WedPlan?</h2>

          </div>

          <div className="trust-grid">

            <div className="trust-item">

              <ShieldCheck size={27} />

              <h3>Organized planning</h3>

              <p>

                Keep your wedding service requests and bookings together.

              </p>

            </div>

            <div className="trust-item">

              <Heart size={27} />

              <h3>Made for everyone</h3>

              <p>

                A dedicated experience for couples and wedding vendors.

              </p>

            </div>

            <div className="trust-item">

              <Sparkles size={27} />

              <h3>Your own vision</h3>

              <p>

                Discover services that help shape your special celebration.

              </p>

            </div>

          </div>

        </div>

      </section>

      <section className="final-cta page-container">

        <div className="final-cta-decoration">

          <Heart size={32} />

        </div>

        <span className="eyebrow">

          YOUR STORY. YOUR CELEBRATION.

        </span>

        <h2>

          Lets make something

          <br />

          <em>beautiful together.</em>

        </h2>

        <p>

          Your dream wedding is made of a thousand little moments.

          Lets start planning them.

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

          <div className="footer-brand-section">

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

          </div>

          <div className="footer-column">

            <h3>Quick Links</h3>

            <div className="footer-links">

              <Link href="/services">Browse Services</Link>

              <a href="#how-it-works">How It Works</a>

              <a href="#why-wedplan">Why WedPlan</a>

              <Link href="/sign-in">Log In</Link>

              <Link href="/sign-up">Join WedPlan</Link>

            </div>

          </div>

          <div className="footer-column">

            <h3>Contact Us</h3>

            <div className="footer-contact">

              <a href="mailto:YOUR_EMAIL_HERE">

                <Mail size={15} />

                YOUR_EMAIL_HERE

              </a>

              <a href="tel:YOUR_PHONE_HERE">

                <Phone size={15} />

                YOUR_PHONE_HERE

              </a>

            </div>

          </div>

          <div className="footer-column">

            <h3>Follow Us</h3>

           <div className="footer-socials">

  <a

href="YOUR_INSTAGRAM_URL"

target="_blank"

rel="noopener noreferrer"

aria-label="Instagram"

  >

    <span aria-hidden="true">◎</span>

  </a>

  <a

href="YOUR_FACEBOOK_URL"

target="_blank"

rel="noopener noreferrer"

aria-label="Facebook"

  >

    <span aria-hidden="true">f</span>

  </a>

  <a

href="YOUR_LINKEDIN_URL"

target="_blank"

rel="noopener noreferrer"

aria-label="LinkedIn"

  >

    <span aria-hidden="true">in</span>

  </a>

</div>
          </div>
        </div>
      </footer>     

    </main>

  );

}