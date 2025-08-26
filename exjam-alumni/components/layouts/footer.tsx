"use client";

import Link from "next/link";
import { Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram, ChevronRight, Calendar, Users, Award, Heart } from "lucide-react";
import Image from "next/image";
import { useSiteConfig } from "@/hooks/useSiteConfig";

export function Footer() {
  const { footerLogo, siteName, contactEmail, contactPhone, socialLinks } = useSiteConfig();
  
  const squadrons = [
    { name: "ALPHA", color: "text-red-600 dark:text-red-400", bgColor: "bg-red-600/10 dark:bg-red-400/10", borderColor: "border-red-600/20 dark:border-red-400/20" },
    { name: "JAGUAR", color: "text-green-600 dark:text-green-400", bgColor: "bg-green-600/10 dark:bg-green-400/10", borderColor: "border-green-600/20 dark:border-green-400/20" },
    { name: "DORNIER", color: "text-blue-600 dark:text-blue-400", bgColor: "bg-blue-600/10 dark:bg-blue-400/10", borderColor: "border-blue-600/20 dark:border-blue-400/20" },
    { name: "PUMA", color: "text-orange-600 dark:text-orange-400", bgColor: "bg-orange-600/10 dark:bg-orange-400/10", borderColor: "border-orange-600/20 dark:border-orange-400/20" },
  ];

  return (
    <footer className="relative bg-gradient-to-b from-background via-muted/30 to-muted/50 border-t">
      {/* Decorative top border */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      
      {/* Main Footer Content */}
      <div className="container relative">
        <div className="py-16">
          <div className="grid gap-12 lg:grid-cols-4 md:grid-cols-2">
            {/* Brand Section - Larger on desktop */}
            <div className="lg:col-span-1">
              <div className="mb-6 flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 animate-pulse-glow rounded-full blur-lg bg-primary/20" />
                  <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary/90 to-primary shadow-lg">
                    <Image
                      src={footerLogo}
                      alt={`${siteName} Logo`}
                      width={32}
                      height={32}
                      className="h-8 w-8 object-contain filter brightness-0 invert"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/exjam-logo.svg";
                      }}
                    />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    {siteName}
                  </h3>
                  <p className="text-xs text-muted-foreground">AFMS Alumni Association</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground mb-6">
                United by honor, driven by excellence. Building lasting connections among Ex-Junior Airmen since 1980.
              </p>
              
              {/* Stats badges */}
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  <Users className="h-3 w-3" />
                  6,000+ Alumni
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-green-600/10 px-3 py-1 text-xs font-medium text-green-600 dark:text-green-400">
                  <Award className="h-3 w-3" />
                  Est. 1980
                </span>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="mb-6 text-sm font-semibold uppercase tracking-wider text-foreground flex items-center gap-2">
                <ChevronRight className="h-4 w-4 text-primary" />
                Quick Links
              </h3>
              <ul className="space-y-3">
                {[
                  { href: "/about", label: "About Us" },
                  { href: "/events", label: "Events & Conference", highlight: true },
                  { href: "/alumni", label: "Alumni Directory" },
                  { href: "/membership", label: "Join / Membership", highlight: true },
                  { href: "/gallery", label: "Photo Gallery" },
                  { href: "/contact", label: "Contact Us" },
                ].map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={`text-sm transition-all duration-200 hover:translate-x-1 inline-flex items-center gap-2 group ${
                        link.highlight
                          ? "text-primary font-medium hover:text-primary/80"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span className="h-1 w-1 rounded-full bg-primary/50 group-hover:bg-primary transition-colors" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="mb-6 text-sm font-semibold uppercase tracking-wider text-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Resources
              </h3>
              <ul className="space-y-3">
                {[
                  { href: "/events", label: "Upcoming Conference" },
                  { href: "/register", label: "Event Registration" },
                  { href: "/scholarships", label: "Scholarships" },
                  { href: "/careers", label: "Career Center" },
                  { href: "/news", label: "News & Updates" },
                  { href: "/donate", label: "Support Us" },
                ].map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-all duration-200 hover:text-foreground hover:translate-x-1 inline-flex items-center gap-2 group"
                    >
                      <span className="h-1 w-1 rounded-full bg-primary/50 group-hover:bg-primary transition-colors" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="mb-6 text-sm font-semibold uppercase tracking-wider text-foreground flex items-center gap-2">
                <Heart className="h-4 w-4 text-primary" />
                Connect With Us
              </h3>
              <div className="space-y-4">
                {contactEmail && (
                  <a
                    href={`mailto:${contactEmail}`}
                    className="flex items-center gap-3 text-sm text-muted-foreground transition-colors hover:text-primary group"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                      <Mail className="h-4 w-4 text-primary" />
                    </div>
                    <span className="hover:underline">{contactEmail}</span>
                  </a>
                )}
                {contactPhone && (
                  <a
                    href={`tel:${contactPhone}`}
                    className="flex items-center gap-3 text-sm text-muted-foreground transition-colors hover:text-primary group"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600/10 transition-colors group-hover:bg-green-600/20">
                      <Phone className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="hover:underline">{contactPhone}</span>
                  </a>
                )}
                <div className="flex items-start gap-3 text-sm text-muted-foreground">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/10">
                    <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span>
                    Jos, Plateau State<br />
                    Nigeria
                  </span>
                </div>

                {/* Social Links */}
                {(socialLinks.facebook ||
                  socialLinks.twitter ||
                  socialLinks.linkedin ||
                  socialLinks.instagram) && (
                  <div className="pt-4 border-t">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Follow Us
                    </p>
                    <div className="flex gap-2">
                      {socialLinks.facebook && (
                        <a
                          href={socialLinks.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted transition-all hover:bg-blue-600 hover:text-white group"
                          aria-label="Facebook"
                        >
                          <Facebook className="h-4 w-4" />
                        </a>
                      )}
                      {socialLinks.twitter && (
                        <a
                          href={socialLinks.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted transition-all hover:bg-sky-500 hover:text-white group"
                          aria-label="Twitter"
                        >
                          <Twitter className="h-4 w-4" />
                        </a>
                      )}
                      {socialLinks.linkedin && (
                        <a
                          href={socialLinks.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted transition-all hover:bg-blue-700 hover:text-white group"
                          aria-label="LinkedIn"
                        >
                          <Linkedin className="h-4 w-4" />
                        </a>
                      )}
                      {socialLinks.instagram && (
                        <a
                          href={socialLinks.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted transition-all hover:bg-gradient-to-br hover:from-purple-600 hover:to-pink-600 hover:text-white group"
                          aria-label="Instagram"
                        >
                          <Instagram className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Squadron Bar - Enhanced */}
        <div className="border-t border-border/50 py-8">
          <div className="mb-6 text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Our Squadron Heritage
            </p>
            <p className="text-xs text-muted-foreground mt-1">"Strive to Excel" - United in Brotherhood</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {squadrons.map((squadron) => (
              <div
                key={squadron.name}
                className={`flex items-center gap-2 rounded-full border px-4 py-2 transition-all hover:scale-105 ${squadron.bgColor} ${squadron.borderColor}`}
              >
                <span className="text-lg">★</span>
                <span className={`text-xs font-bold uppercase tracking-wider ${squadron.color}`}>
                  {squadron.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar - Copyright and Legal */}
        <div className="border-t border-border/50 py-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-xs text-muted-foreground text-center sm:text-left">
              © {new Date().getFullYear()} {siteName} • Ex-Junior Airmen • AFMS Jos
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <Link
                href="/privacy"
                className="text-muted-foreground transition-colors hover:text-primary"
              >
                Privacy Policy
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link
                href="/terms"
                className="text-muted-foreground transition-colors hover:text-primary"
              >
                Terms of Service
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link
                href="/code-of-conduct"
                className="text-muted-foreground transition-colors hover:text-primary"
              >
                Code of Conduct
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
