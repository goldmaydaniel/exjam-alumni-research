"use client";

// import Link from "next/link";
import { SafeLink as Link } from "@/components/SafeLink";
import { Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram } from "lucide-react";
import { useSiteConfig } from "@/hooks/useSiteConfig";
import { Logo } from "@/components/ui/logo";

export function SimpleFooter() {
  const { footerLogo, siteName, contactEmail, contactPhone, socialLinks } = useSiteConfig();
  return (
    <footer className="border-t bg-background">
      {/* Main Footer Content */}
      <div className="container px-4 py-8 sm:px-6 sm:py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* Brand Section */}
          <div>
            <div className="mb-6 flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-3">
              <Logo
                src={footerLogo}
                alt={`${siteName} Logo`}
                width={56}
                height={56}
                className="rounded-lg shadow-lg"
              />
              <div className="text-center sm:text-left">
                <h3 className="text-xl font-bold sm:text-2xl">{siteName}</h3>
                <p className="text-sm text-muted-foreground">Ex-Junior Airmen</p>
              </div>
            </div>
            <p className="mb-4 text-center text-sm text-muted-foreground sm:text-left">
              President General's Conference 2025
              <br />
              NAF Conference Centre, FCT, ABUJA
            </p>
            <div className="flex flex-wrap justify-center gap-2 text-xs sm:justify-start">
              <span className="rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1 text-yellow-600 dark:text-yellow-400">
                AFMS Jos
              </span>
              <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-blue-600 dark:text-blue-400">
                Est. 1980
              </span>
              <span className="rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-green-600 dark:text-green-400">
                Alumni Network
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="text-center sm:text-left">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">Quick Links</h3>
            <ul className="space-y-3 text-sm sm:space-y-2">
              <li>
                <Link
                  href="/about"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/events"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Events
                </Link>
              </li>
              <li>
                <Link
                  href="/register"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Membership
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="text-center sm:col-span-2 sm:text-left lg:col-span-1">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">Get in Touch</h3>
            <ul className="space-y-3 text-sm">
              {contactEmail && (
                <li className="flex items-center justify-center gap-2 text-muted-foreground sm:justify-start">
                  <Mail className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  <a
                    href={`mailto:${contactEmail}`}
                    className="transition-colors hover:text-foreground"
                  >
                    {contactEmail}
                  </a>
                </li>
              )}
              {contactPhone && (
                <li className="flex items-center justify-center gap-2 text-muted-foreground sm:justify-start">
                  <Phone className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <a
                    href={`tel:${contactPhone}`}
                    className="transition-colors hover:text-foreground"
                  >
                    {contactPhone}
                  </a>
                </li>
              )}
              <li className="flex items-start justify-center gap-2 text-muted-foreground sm:justify-start">
                <MapPin className="mt-0.5 h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span>Jos, Plateau State</span>
              </li>
            </ul>

            {/* Social Links */}
            {socialLinks &&
              (socialLinks.facebook ||
                socialLinks.twitter ||
                socialLinks.linkedin ||
                socialLinks.instagram) && (
                <div className="mt-6">
                  <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider">Follow Us</h4>
                  <div className="flex justify-center gap-3 sm:justify-start">
                    {socialLinks.facebook && (
                      <a
                        href={socialLinks.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full bg-muted p-2 text-muted-foreground transition-colors hover:bg-blue-600 hover:text-white"
                        aria-label="Follow us on Facebook"
                      >
                        <Facebook className="h-5 w-5" />
                      </a>
                    )}
                    {socialLinks.twitter && (
                      <a
                        href={socialLinks.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full bg-muted p-2 text-muted-foreground transition-colors hover:bg-sky-500 hover:text-white"
                        aria-label="Follow us on Twitter"
                      >
                        <Twitter className="h-5 w-5" />
                      </a>
                    )}
                    {socialLinks.linkedin && (
                      <a
                        href={socialLinks.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full bg-muted p-2 text-muted-foreground transition-colors hover:bg-blue-700 hover:text-white"
                        aria-label="Follow us on LinkedIn"
                      >
                        <Linkedin className="h-5 w-5" />
                      </a>
                    )}
                    {socialLinks.instagram && (
                      <a
                        href={socialLinks.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full bg-muted p-2 text-muted-foreground transition-colors hover:bg-pink-600 hover:text-white"
                        aria-label="Follow us on Instagram"
                      >
                        <Instagram className="h-5 w-5" />
                      </a>
                    )}
                  </div>
                </div>
              )}
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 border-t pt-8 text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} The EXJAM Association • Ex-Junior Airmen • AFMS Jos. All
            rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
