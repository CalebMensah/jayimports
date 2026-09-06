import { BUSINESS } from "@/lib/constants";
import Link from "next/link";
import { HiOutlinePhone, HiOutlineMail, HiOutlineLocationMarker } from "react-icons/hi";


export function Footer() {
  return (
    <footer className="bg-navy-900 text-navy-200 mt-16">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
        <div>
          <p className="font-display text-white text-base mb-2">Jay Imports</p>
          <p className="text-navy-300">{BUSINESS.description}</p>
        </div>
        <div>
          <p className="text-white font-medium mb-2">Contact</p>
          <p className="flex items-center gap-2"><HiOutlinePhone className="w-4 h-4" /> {BUSINESS.phone}</p>
          <p className="flex items-center gap-2"><HiOutlineMail className="w-4 h-4" /> {BUSINESS.email}</p>
          <p className="flex items-center gap-2 mt-2 text-navy-300"><HiOutlineLocationMarker className="w-4 h-4" /> {BUSINESS.location}</p>
        </div>
        <div>
          <p className="text-white font-medium mb-2">Follow</p>
          <p>Instagram: {BUSINESS.instagram}</p>
          <p>TikTok: @{BUSINESS.tiktok}</p>
        </div>
        <div className="flex gap-4 mt-2 text-xs text-navy-400">
  <a href="/policies" className="hover:text-white">Order Policies</a>
  <a href="/terms" className="hover:text-white">Terms of Service</a>
</div>
      </div>
      <div className="border-t border-white/10 text-center text-xs text-navy-400 py-4">
        © {new Date().getFullYear()} Jay Imports and Wholesale. All rights reserved.
      </div>
    </footer>
  );
}