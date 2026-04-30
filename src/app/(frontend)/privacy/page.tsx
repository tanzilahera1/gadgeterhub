export const metadata = {
  title: "গোপনীয়তা নীতি | GadgetCollections",
  description: "GadgetCollections এর ব্যক্তিগত তথ্য সুরক্ষা নীতিমালা।",
};

import { ShieldCheck } from "lucide-react";

export default function PrivacyPage() {
  const sections = [
    {
      title: "আমরা কী তথ্য সংগ্রহ করি",
      content: "আপনার নাম, ফোন নম্বর, ইমেইল, ও ডেলিভারি ঠিকানা সংগ্রহ করা হয়। পেমেন্টের ক্ষেত্রে ট্রানজেকশন আইডি সংরক্ষণ করা হয়। আমরা কোনো ব্যাংক কার্ড বা পূর্ণ আর্থিক তথ্য সংগ্রহ করি না।",
    },
    {
      title: "তথ্য ব্যবহারের উদ্দেশ্য",
      content: "সংগৃহীত তথ্য শুধুমাত্র অর্ডার প্রসেসিং, ডেলিভারি নিশ্চিতকরণ, এবং কাস্টমার সাপোর্টের জন্য ব্যবহার করা হয়। আমরা কোনো থার্ড পার্টির কাছে আপনার তথ্য বিক্রি করি না।",
    },
    {
      title: "কুকিজ ও ট্র্যাকিং",
      content: "আমাদের সাইট পারফরম্যান্স উন্নয়নের জন্য বেসিক কুকিজ ব্যবহার করে। আপনি ব্রাউজার সেটিংস থেকে কুকিজ বন্ধ করতে পারেন, তবে কিছু ফিচার সীমিত হতে পারে।",
    },
    {
      title: "তথ্য সুরক্ষা",
      content: "আপনার ডেটা SSL এনক্রিপশনের মাধ্যমে সুরক্ষিত। আমাদের সার্ভারে সকল ডেটা এনক্রিপ্টেড অবস্থায় সংরক্ষিত থাকে।",
    },
    {
      title: "আপনার অধিকার",
      content: "আপনি যেকোনো সময় আপনার ব্যক্তিগত তথ্য মুছে ফেলার অনুরোধ করতে পারেন। এর জন্য আমাদের সাপোর্ট টিমের সাথে যোগাযোগ করুন।",
    },
  ];

  return (
    <div className="min-h-screen py-16 px-4">
      <div className="max-w-3xl mx-auto space-y-10">
        <div className="text-center space-y-4">
          <div className="inline-flex p-4 bg-primary/10 rounded-3xl">
            <ShieldCheck className="size-10 text-primary" />
          </div>
          <h1 className="text-4xl font-black tracking-tight">গোপনীয়তা নীতি</h1>
          <p className="text-muted-foreground">সর্বশেষ আপডেট: এপ্রিল ২০২৫</p>
        </div>

        <div className="space-y-5">
          {sections.map((s) => (
            <div key={s.title} className="bg-card/40 border border-border/40 rounded-2xl p-6 space-y-3">
              <h2 className="text-lg font-black text-foreground">{s.title}</h2>
              <p className="text-muted-foreground leading-relaxed text-[15px]">{s.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
