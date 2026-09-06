import { BUSINESS } from "@/lib/constants";
import { HiOutlinePhone, HiOutlineMail, HiOutlineLocationMarker } from "react-icons/hi";
import { FaInstagram, FaTiktok } from "react-icons/fa";

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-14">
      <p className="text-turquoise-dark text-sm font-medium mb-2">About us</p>
      <h1 className="font-display text-3xl text-navy-900 mb-6">{BUSINESS.name}</h1>

      <p className="text-navy-600 leading-relaxed mb-4">{BUSINESS.description}</p>

      <div className="grid sm:grid-cols-2 gap-4 mt-8">
        {BUSINESS.categories.map((cat) => (
          <div key={cat} className="border border-navy-100 rounded p-4">
            <p className="text-sm text-navy-700">{cat}</p>
          </div>
        ))}
      </div>

<div className="mt-10 border-t border-navy-100 pt-6 text-sm text-navy-600 space-y-2">
        <p className="flex items-center gap-2">
          <HiOutlinePhone className="w-4 h-4 text-navy-400" />
          <a href={`tel:${BUSINESS.phone}`} className="text-ocean hover:underline">{BUSINESS.phone}</a>
        </p>
        <p className="flex items-center gap-2">
          <HiOutlineMail className="w-4 h-4 text-navy-400" />
          <a href={`mailto:${BUSINESS.email}`} className="text-ocean hover:underline">{BUSINESS.email}</a>
        </p>
        <p className="flex items-center gap-2">
          <HiOutlineLocationMarker className="w-4 h-4 text-navy-400" />
          {BUSINESS.location}
        </p>
        <p className="flex items-center gap-3 pt-1">
          <FaInstagram className="w-4 h-4 text-navy-400" /> {BUSINESS.instagram}
          <FaTiktok className="w-4 h-4 text-navy-400 ml-2" /> @{BUSINESS.tiktok}
        </p>
      </div>
    </div>
  );
}