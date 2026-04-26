// src\components\layout\Footer.tsx
import Link from "next/image";
import LinkNext from "next/link";
import Image from "next/image";
import {
  FacebookIcon,
  InstagramIcon,
  WhatsAppIcon,
  YouTubeIcon,
  TikTokIcon,
} from "@/socialCustomSVGIcon/SocialCustomSVGIcon";

// IMO Icon Path (যেহেতু আপনার ফাইলে ছিল না)
const ImoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm3.145 15.281c-.244.607-1.111 1.054-1.747 1.121-.433.047-.993.061-1.606-.021-2.587-.347-4.573-2.313-4.887-4.86-.073-.593-.033-1.127.027-1.547.093-.653.567-1.487 1.187-1.707.307-.113.807-.06 1.107.127l.113.067c.36.213.627.653.687 1.087.053.4.007.827-.12 1.2-.14.413-.427.767-.78 1.007-.053.033-.067.067-.04.1.287.353.647.667 1.06.94.047.027.087.02.113-.02.267-.327.653-.573 1.087-.687.367-.1.78-.1 1.153-.007.44.113.827.42 1.007.827l.067.147c.127.3.167.753.073 1.147z" />
  </svg>
);

const FOOTER_DATA = {
  shop: [
    { label: "সকল প্রোডাক্ট", href: "/products" },
    { label: "অফারসমূহ", href: "/products?sale=true" },
    { label: "নতুন কালেকশন", href: "/products?sort=newest" },
    { label: "বেস্টসেলার", href: "/products?sort=bestseller" },
  ],
  support: [
    { label: "অর্ডার ট্র্যাক করুন", href: "/track" },
    { label: "যোগাযোগ করুন", href: "/contact" },
    { label: "রিটার্ন পলিসি", href: "/return-policy" },
    { label: "ডেলিভারি চার্জ", href: "/shipping-info" },
  ],
  account: [
    { label: "আমার প্রোফাইল", href: "/dashboard" },
    { label: "অর্ডার হিস্টোরি", href: "/dashboard/orders" },
    { label: "উইশলিস্ট", href: "/wishlist" },
    { label: "লগইন", href: "/login" },
  ],
  socials: [
    { label: "Facebook", Icon: FacebookIcon, href: "https://facebook.com", color: "hover:bg-[#1877F2]" },
    { label: "Instagram", Icon: InstagramIcon, href: "https://instagram.com", color: "hover:bg-[#E4405F]" },
    { label: "WhatsApp", Icon: WhatsAppIcon, href: "https://wa.me/8801XXXXXXXXX", color: "hover:bg-[#25D366]" },
    { label: "IMO", Icon: ImoIcon, href: "imomessage://+8801XXXXXXXXX", color: "hover:bg-[#0091FF]" },
    { label: "YouTube", Icon: YouTubeIcon, href: "https://youtube.com", color: "hover:bg-[#FF0000]" },
    { label: "TikTok", Icon: TikTokIcon, href: "https://tiktok.com", color: "hover:bg-[#000000]" },
  ],
};

export default function Footer() {
  return (
    <footer className="relative border-t border-border/40 bg-card/30 backdrop-blur-3xl mt-20 overflow-hidden">
      {/* 🌟 Background Decorative Glow */}
      <div className="absolute top-0 left-1/4 size-64 bg-primary/5 rounded-full blur-[120px] -z-10" />

      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4 lg:grid-cols-5">
          
          {/* Brand & Dynamic Socials */}
          <div className="col-span-2 lg:col-span-2 space-y-8">
            <div className="space-y-4">
              <LinkNext href="/" className="flex items-center gap-2 group">
                <div className="relative size-10 transition-transform duration-700 group-hover:rotate-[360deg]">
                  <Image src="/logo.svg" alt="GadgetCollections" fill className="object-contain" />
                </div>
                <span className="text-2xl font-black tracking-tighter uppercase italic">
                  Gadget<span className="text-primary">Collections</span>
                </span>
              </LinkNext>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
                প্রিমিয়াম গ্যাজেট এবং স্মার্ট এক্সেসরিজের নির্ভরযোগ্য গন্তব্য। আমরা দিচ্ছি অরিজিনাল প্রোডাক্টের নিশ্চয়তা এবং দ্রুত ডেলিভারি।
              </p>
            </div>

            {/* Social Icons Container */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Follow Us</h4>
              <div className="flex flex-wrap gap-3">
                {FOOTER_DATA.socials.map(({ label, Icon, href, color }) => (
                  <LinkNext
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className={`
                      flex size-10 items-center justify-center rounded-xl 
                      bg-muted/40 text-muted-foreground 
                      transition-all duration-300 
                      hover:text-white hover:-translate-y-1.5 shadow-sm
                      ${color}
                    `}
                  >
                    <Icon />
                  </LinkNext>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Links Group */}
          <div className="space-y-6">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-foreground">Shop</h3>
            <ul className="space-y-3">
              {FOOTER_DATA.shop.map((link) => (
                <li key={link.href}>
                  <LinkNext href={link.href} className="text-[13px] text-muted-foreground hover:text-primary transition-all flex items-center gap-2 group">
                    <span className="size-1 rounded-full bg-primary scale-0 group-hover:scale-100 transition-transform" />
                    {link.label}
                  </LinkNext>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-6">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-foreground">Support</h3>
            <ul className="space-y-3">
              {FOOTER_DATA.support.map((link) => (
                <li key={link.href}>
                  <LinkNext href={link.href} className="text-[13px] text-muted-foreground hover:text-primary transition-all flex items-center gap-2 group">
                    <span className="size-1 rounded-full bg-primary scale-0 group-hover:scale-100 transition-transform" />
                    {link.label}
                  </LinkNext>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-6">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-foreground">Account</h3>
            <ul className="space-y-3">
              {FOOTER_DATA.account.map((link) => (
                <li key={link.href}>
                  <LinkNext href={link.href} className="text-[13px] text-muted-foreground hover:text-primary transition-all flex items-center gap-2 group">
                    <span className="size-1 rounded-full bg-primary scale-0 group-hover:scale-100 transition-transform" />
                    {link.label}
                  </LinkNext>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 💳 Trust Badges & Payment */}
        <div className="mt-16 pt-8 border-t border-border/20 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col items-center md:items-start gap-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Payment Partners</p>
            <div className="flex items-center gap-5 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-700">
              <Image src="/payment-method-logo/bkash.svg" alt="bkash" width={45} height={25} />
              <Image src="/payment-method-logo/nagad.svg" alt="nagad" width={45} height={25} />
              <Image src="/payment-method-logo/rocket.png" alt="rocket" width={45} height={25} />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="flex flex-col items-end gap-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Certified Secure</p>
                <div className="flex gap-2">
                   <span className="px-2 py-1 rounded bg-foreground/5 text-[9px] font-black border border-border/40">SSL SECURED</span>
                   <span className="px-2 py-1 rounded bg-foreground/5 text-[9px] font-black border border-border/40">100% ORIGINAL</span>
                </div>
             </div>
          </div>
        </div> 

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          <p>© {new Date().getFullYear()} GadgetCollections. Developed with ❤️ in Bangladesh.</p>
          <div className="flex gap-6">
            <LinkNext href="/privacy" className="hover:text-primary transition-colors">Privacy</LinkNext>
            <LinkNext href="/terms" className="hover:text-primary transition-colors">Terms</LinkNext>
          </div>
        </div>
      </div>
    </footer>
  );
}