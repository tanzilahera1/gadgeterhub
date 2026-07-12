export const metadata = {
  title: "শিপিং ও ডেলিভারি | GadgeterHub",
  description: "GadgeterHub এর ডেলিভারি চার্জ ও শিপিং তথ্য।",
};

import { Truck, Clock, MapPin, CheckCircle } from "lucide-react";

export default function ShippingInfoPage() {
  return (
    <div className="min-h-screen py-16 px-4">
      <div className="max-w-3xl mx-auto space-y-10">
        <div className="text-center space-y-4">
          <div className="inline-flex p-4 bg-primary/10 rounded-3xl">
            <Truck className="size-10 text-primary" />
          </div>
          <h1 className="text-4xl font-black tracking-tight">শিপিং ও ডেলিভারি</h1>
          <p className="text-muted-foreground">দ্রুত ও নির্ভরযোগ্য ডেলিভারি সেবা</p>
        </div>

        {/* Delivery Zones */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="bg-card/40 border-2 border-primary/30 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <MapPin className="size-5 text-primary" />
              </div>
              <div>
                <p className="font-black text-foreground">ঢাকার ভেতরে</p>
                <p className="text-xs text-muted-foreground">Inside Dhaka</p>
              </div>
            </div>
            <p className="text-3xl font-black text-primary">৳60</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="size-3.5" />
              <span>১–২ কার্যদিবস</span>
            </div>
          </div>

          <div className="bg-card/40 border-2 border-border/40 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="size-10 bg-accent/50 rounded-xl flex items-center justify-center">
                <MapPin className="size-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-black text-foreground">ঢাকার বাইরে</p>
                <p className="text-xs text-muted-foreground">Outside Dhaka</p>
              </div>
            </div>
            <p className="text-3xl font-black">৳120</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="size-3.5" />
              <span>২–৫ কার্যদিবস</span>
            </div>
          </div>
        </div>

        {/* Info Points */}
        <div className="space-y-4">
          {[
            "অর্ডার কনফার্মের পর পরবর্তী কার্যদিবসে পণ্য শিপমেন্ট করা হয়।",
            "ডেলিভারির আগে আমাদের প্রতিনিধি ফোনে যোগাযোগ করবেন।",
            "ফোনে কথা না হলে পণ্য ফেরত আসতে পারে, তাই ফোন রিসিভ করুন।",
            "মোবাইল পেমেন্টের অর্ডার অগ্রাধিকার ভিত্তিতে প্রসেস করা হয়।",
          ].map((point, i) => (
            <div key={i} className="flex items-start gap-3 bg-card/30 border border-border/30 rounded-xl p-4">
              <CheckCircle className="size-4 text-primary shrink-0 mt-0.5" />
              <p className="text-[14px] text-muted-foreground leading-relaxed">{point}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
