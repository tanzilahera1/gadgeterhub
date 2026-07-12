export const metadata = {
  title: "ব্যবহারের শর্তাবলী | GadgeterHub",
  description: "GadgeterHub এর সেবা ব্যবহারের নিয়ম ও শর্তাবলী।",
};

import { FileText } from "lucide-react";

export default function TermsPage() {
  const sections = [
    {
      title: "সেবা গ্রহণের শর্ত",
      content: "GadgeterHub এর সেবা ব্যবহার করে আপনি স্বয়ংক্রিয়ভাবে এই শর্তাবলীতে সম্মত হচ্ছেন। ১৮ বছরের কম বয়সীদের অভিভাবকের সম্মতিতে অর্ডার করতে হবে।",
    },
    {
      title: "পণ্য ও মূল্য",
      content: "সকল পণ্যের মূল্য বাংলাদেশি টাকায় প্রদর্শিত। আমরা যেকোনো সময় মূল্য পরিবর্তনের অধিকার রাখি, তবে কনফার্মকৃত অর্ডারের মূল্য অপরিবর্তিত থাকবে।",
    },
    {
      title: "অর্ডার বাতিল",
      content: "অর্ডার কনফার্মের ২ ঘন্টার মধ্যে বাতিল করা যাবে। পণ্য শিপমেন্টের পর অর্ডার বাতিল সম্ভব নয়। বাতিলের জন্য আমাদের সাপোর্ট টিমে যোগাযোগ করুন।",
    },
    {
      title: "দায়বদ্ধতার সীমা",
      content: "GadgeterHub শুধুমাত্র পণ্যের মূল মূল্য পর্যন্ত দায়বদ্ধ। কোনো পরোক্ষ ক্ষতি, ব্যবসায়িক ক্ষতি বা ডেটা ক্ষতির জন্য আমরা দায়ী নই।",
    },
    {
      title: "বিরোধ নিষ্পত্তি",
      content: "যেকোনো বিরোধের ক্ষেত্রে প্রথমে সরাসরি আমাদের কাস্টমার সাপোর্টে যোগাযোগ করুন। আমরা ৩ কার্যদিবসের মধ্যে সমাধান দেওয়ার চেষ্টা করব।",
    },
  ];

  return (
    <div className="min-h-screen py-16 px-4">
      <div className="max-w-3xl mx-auto space-y-10">
        <div className="text-center space-y-4">
          <div className="inline-flex p-4 bg-primary/10 rounded-3xl">
            <FileText className="size-10 text-primary" />
          </div>
          <h1 className="text-4xl font-black tracking-tight">ব্যবহারের শর্তাবলী</h1>
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
