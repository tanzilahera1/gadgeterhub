export const metadata = {
  title: "রিটার্ন পলিসি | GadgeterHub",
  description: "GadgeterHub এর পণ্য ফেরত ও রিফান্ড নীতিমালা।",
};

import { RefreshCcw } from "lucide-react";

export default function ReturnPolicyPage() {
  return (
    <div className="min-h-screen py-16 px-4">
      <div className="max-w-3xl mx-auto space-y-10">
        <div className="text-center space-y-4">
          <div className="inline-flex p-4 bg-primary/10 rounded-3xl">
            <RefreshCcw className="size-10 text-primary" />
          </div>
          <h1 className="text-4xl font-black tracking-tight">রিটার্ন পলিসি</h1>
          <p className="text-muted-foreground">সর্বশেষ আপডেট: এপ্রিল ২০২৫</p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
          {[
            {
              title: "পণ্য ফেরতের শর্তাবলী",
              content: "পণ্য হাতে পাওয়ার ৭ দিনের মধ্যে ফেরত দেওয়া যাবে, যদি পণ্যটি ডেলিভারিতে ক্ষতিগ্রস্ত হয়ে থাকে অথবা ভুল পণ্য আসে। পণ্যটি অবশ্যই অব্যবহৃত ও মূল প্যাকেজিংসহ থাকতে হবে।",
            },
            {
              title: "রিটার্নের জন্য যোগাযোগ",
              content: "রিটার্নের জন্য প্রথমে আমাদের সাথে ফোন বা WhatsApp এর মাধ্যমে যোগাযোগ করুন। পণ্যের ছবি ও অর্ডার আইডি সহ বিস্তারিত জানান। আমাদের টিম ২৪ ঘন্টার মধ্যে সাড়া দেবে।",
            },
            {
              title: "রিফান্ড প্রক্রিয়া",
              content: "পণ্য ফেরত নিশ্চিত হওয়ার পর ৫-৭ কার্যদিবসের মধ্যে রিফান্ড দেওয়া হবে। মোবাইল ব্যাংকিং (bKash/Nagad/Rocket) বা ক্যাশ-অন-ডেলিভারির ক্ষেত্রে নগদ ফেরত দেওয়া হবে।",
            },
            {
              title: "যা রিটার্ন করা যাবে না",
              content: "ব্যবহারকৃত বা ক্ষতিগ্রস্ত পণ্য, মূল প্যাকেজিং ছাড়া পণ্য, ডিজিটাল পণ্য বা সফটওয়্যার, এবং ফ্ল্যাশ সেলের পণ্য রিটার্ন গ্রহণযোগ্য নয়।",
            },
          ].map((section) => (
            <div key={section.title} className="bg-card/40 border border-border/40 rounded-2xl p-6 space-y-3">
              <h2 className="text-lg font-black text-foreground">{section.title}</h2>
              <p className="text-muted-foreground leading-relaxed text-[15px]">{section.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
