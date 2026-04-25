// src/components/layout/Footer.tsx
import Link from 'next/link'
import Image from 'next/image'
import { Globe, MessageCircle, Tv, Send } from 'lucide-react'

const LINKS = {
  shop: [
    { label: 'All Products', href: '/products' },
    { label: 'Offers', href: '/products?sale=true' },
    { label: 'New Arrivals', href: '/products?sort=newest' },
    { label: 'Bestsellers', href: '/products?sort=bestseller' },
  ],
  support: [
    { label: 'Track Order', href: '/track' },
    { label: 'Contact Us', href: '/contact' },
    { label: 'Return Policy', href: '/return-policy' },
  ],
  account: [
    { label: 'My Account', href: '/dashboard' },
    { label: 'My Orders', href: '/dashboard/orders' },
    { label: 'Login', href: '/login' },
  ],
}

const SOCIALS = [
  { label: 'Facebook', icon: Globe, href: 'https://facebook.com' },
  { label: 'Instagram', icon: MessageCircle, href: 'https://instagram.com' },
  { label: 'YouTube', icon: Tv, href: 'https://youtube.com' },
  { label: 'Telegram', icon: Send, href: 'https://t.me' },
]

export default function Footer() {
  return (
    <footer className="border-t border-border/40 bg-card/40">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Image src="/logo.svg" alt="GadgetCollections" width={28} height={28} />
              <span className="font-bold">GadgetCollections</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              বাংলাদেশে সেরা গ্যাজেট, সেরা দামে।
            </p>
            <div className="flex gap-2">
              {SOCIALS.map(({ label, icon: Icon, href }) => (
                <Link
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex size-8 items-center justify-center rounded-lg bg-secondary/60 text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-200"
                >
                  <Icon className="size-4" />
                </Link>
              ))}
            </div>
          </div>

          {/* Shop */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Shop</h3>
            <ul className="space-y-2">
              {LINKS.shop.map(({ label, href }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Support</h3>
            <ul className="space-y-2">
              {LINKS.support.map(({ label, href }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Account</h3>
            <ul className="space-y-2">
              {LINKS.account.map(({ label, href }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border/40 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} GadgetCollections. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy-policy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
