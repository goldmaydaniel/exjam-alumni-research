"use client";

import Link from "next/link";
import { Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram } from "lucide-react";
import Image from "next/image";
import { useSiteConfig } from "@/hooks/useSiteConfig";

export function Footer() {
  const { footerLogo, siteName, contactEmail, contactPhone, socialLinks } = useSiteConfig();
  return (
    <footer className="border-t bg-background">
      {/* Main Footer Content */}
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Brand Section */}
          <div>
            <div className="mb-4 flex items-center gap-3">
              <Image
                src={footerLogo}
                alt={`${siteName} Logo`}
                width={32}
                height={32}
                className="h-8 w-8 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/exjam-logo.svg";
                }}
              />
              <h3 className="text-xl font-bold">{siteName}</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Air Force Military School Alumni Association • United by honor, driven by excellence.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">Quick Links</h3>
            <ul className="space-y-2 text-sm">
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
                  href="/alumni"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Alumni Directory
                </Link>
              </li>
              <li>
                <Link
                  href="/membership"
                  className="font-semibold text-muted-foreground transition-colors hover:text-foreground"
                >
                  Join / Membership
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
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">Get in Touch</h3>
            <ul className="space-y-3 text-sm">
              {contactEmail && (
                <li className="flex items-center gap-2 text-muted-foreground">
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
                <li className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <a
                    href={`tel:${contactPhone}`}
                    className="transition-colors hover:text-foreground"
                  >
                    {contactPhone}
                  </a>
                </li>
              )}
              <li className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span>Jos, Plateau State</span>
              </li>
            </ul>

            {/* Social Links */}
            {(socialLinks.facebook ||
              socialLinks.twitter ||
              socialLinks.linkedin ||
              socialLinks.instagram) && (
              <div className="mt-4">
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider">Follow Us</h4>
                <div className="flex gap-2">
                  {socialLinks.facebook && (
                    <a
                      href={socialLinks.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground transition-colors hover:text-blue-600"
                    >
                      <Facebook className="h-4 w-4" />
                    </a>
                  )}
                  {socialLinks.twitter && (
                    <a
                      href={socialLinks.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground transition-colors hover:text-sky-500"
                    >
                      <Twitter className="h-4 w-4" />
                    </a>
                  )}
                  {socialLinks.linkedin && (
                    <a
                      href={socialLinks.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground transition-colors hover:text-blue-700"
                    >
                      <Linkedin className="h-4 w-4" />
                    </a>
                  )}
                  {socialLinks.instagram && (
                    <a
                      href={socialLinks.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground transition-colors hover:text-pink-600"
                    >
                      <Instagram className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Squadron Bar */}
        <div className="mt-8 border-t pt-8">
          <div className="mb-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Four Squadrons
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-4 text-xs font-bold uppercase tracking-wider">
            <span className="text-red-600 dark:text-red-500">★ Alpha</span>
            <span className="text-green-600 dark:text-green-500">★ Jaguar</span>
            <span className="text-blue-600 dark:text-blue-500">★ Dornier</span>
            <span className="text-orange-600 dark:text-orange-500">★ Puma</span>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {siteName} • Ex-Junior Airmen • AFMS Jos. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
