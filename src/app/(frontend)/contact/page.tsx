"use client";

import { useState } from "react";
import {
  Phone,
  MapPin,
  Send,
  Loader2,
  MessageSquare,
} from "lucide-react";
import { WhatsAppIcon } from "@/socialCustomSVGIcon/SocialCustomSVGIcon";
import { toast } from "sonner";
import { submitContactForm } from "@/actions/contact";
import { Button } from "@/components/ui/button";

export default function ContactPage() {
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await submitContactForm(formData);

    setIsLoading(false);
    if (result.success) {
      toast.success("Message sent successfully!", {
        description: "We will get back to you as soon as possible.",
        icon: <MessageSquare className="size-4" />,
      });
      (e.target as HTMLFormElement).reset();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pt-8 pb-16">
      {/* Container */}
      <div className="container max-w-6xl px-4 mx-auto space-y-12">
        {/* Header Section */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-2">
            <MessageSquare className="size-8 text-primary" />
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
            Stay Connected
          </h1>
          <p className="text-slate-500 font-medium md:text-lg leading-relaxed">
            Have a question, feedback, or need help with your pending orders? We
            are here round the clock to support your GadgeterHub
            experience.
          </p>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start mt-8">
          {/* Left: Contact Info Info Cards */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Phone className="size-32" />
              </div>
              <div className="relative z-10 space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-1">
                    Call Us
                  </h3>
                  <p className="text-slate-500 text-sm">
                    Mon - Fri, 9am - 8pm BDT
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="size-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                    <Phone className="size-5" />
                  </div>
                  <span className="text-lg font-bold text-slate-700 tracking-wide">
                    +880 1568390014
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <MapPin className="size-32" />
              </div>
              <div className="relative z-10 space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-1">
                    Operating Hub
                  </h3>
                  <p className="text-slate-500 text-sm">Online Operations Only</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="size-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                    <MapPin className="size-5" />
                  </div>
                  <span className="text-base font-bold text-slate-700">
                    South Keranigonj, Dhaka,
                    <br />
                    Bangladesh.
                  </span>
                </div>
              </div>
            </div>

            <a 
              href="https://wa.me/8801568390014" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm relative overflow-hidden group block hover:border-[#25D366]/30 hover:shadow-[#25D366]/10 transition-all cursor-pointer"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:text-[#25D366] transition-colors">
                <WhatsAppIcon className="size-32" />
              </div>
              <div className="relative z-10 space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-1 group-hover:text-[#25D366] transition-colors">
                    WhatsApp Us
                  </h3>
                  <p className="text-slate-500 text-sm">Instant replies.</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="size-12 bg-[#25D366]/10 text-[#25D366] rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <WhatsAppIcon className="size-5" />
                  </div>
                  <span className="text-base font-bold text-slate-700">
                    +880 1568390014
                  </span>
                </div>
              </div>
            </a>
          </div>

          {/* Right: Modern Contact Form */}
          <div className="lg:col-span-7 bg-white rounded-[2.5rem] p-6 md:p-10 border border-slate-100 shadow-2xl shadow-slate-200/50">
            <div className="mb-8">
              <h2 className="text-2xl font-black text-slate-900">
                Send us a Message
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                We typically reply within a few hours.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div className="space-y-2">
                  <label
                    htmlFor="name"
                    className="text-sm font-bold text-slate-700 pl-1"
                  >
                    Full Name *
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    placeholder="John Doe"
                    disabled={isLoading}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all focus:bg-white"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <label
                    htmlFor="phone"
                    className="text-sm font-bold text-slate-700 pl-1"
                  >
                    Phone Number *
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    placeholder="017XXXXXXXX"
                    disabled={isLoading}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all focus:bg-white"
                  />
                </div>
              </div>



              {/* Subject */}
              <div className="space-y-2">
                <label
                  htmlFor="subject"
                  className="text-sm font-bold text-slate-700 pl-1"
                >
                  Subject *
                </label>
                <input
                  id="subject"
                  name="subject"
                  type="text"
                  required
                  placeholder="How can we help?"
                  disabled={isLoading}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all focus:bg-white"
                />
              </div>

              {/* Message */}
              <div className="space-y-2">
                <label
                  htmlFor="message"
                  className="text-sm font-bold text-slate-700 pl-1"
                >
                  Your Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  required
                  placeholder="Tell us everything..."
                  disabled={isLoading}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all focus:bg-white resize-y"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-14 rounded-2xl text-base font-bold shadow-xl shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] transition-all"
                >
                  {isLoading ? (
                    <Loader2 className="size-5 animate-spin mx-auto text-white" />
                  ) : (
                    <>
                      <Send className="size-5 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
