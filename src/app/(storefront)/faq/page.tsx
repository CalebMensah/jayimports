"use client";

import { useState } from "react";
import Link from "next/link";
import { HiOutlineChevronDown } from "react-icons/hi";
import { BUSINESS } from "@/lib/constants";

const FAQS = [
  {
    question: "How does ordering work on Jay Imports?",
    answer:
      "Browse our shop and add items to your cart. Some items are in stock and ship right away; others are preorder items sourced specifically for you from our international suppliers once you order.",
  },
  {
    question: "What's the difference between in-stock and preorder items?",
    answer:
      "In-stock items are ready to ship or pick up immediately. Preorder items are purchased from our suppliers specifically based on your order, so they take longer to arrive — the estimated timeline is shown on each preorder product page.",
  },
  {
    question: "How long do preorders take to arrive?",
    answer:
      "It takes approximately 6-12 weeks for the things to arrive in Ghana.",
  },
  {
    question: "How do I pay?",
    answer:
      "We accept Mobile Money and Bank Transfer, both processed instantly and securely through Paystack. Your order is confirmed automatically once payment goes through.",
  },
  {
    question: "Can I cancel my order after paying?",
    answer:
      "Once an order is confirmed and payment is made, it generally can't be cancelled — especially for preorder items, since we begin sourcing them right away. Please see our full Order Policies for details.",
  },
  {
    question: "What if my item arrives faulty or never arrives?",
    answer:
      "We offer refunds if an item arrives faulty/damaged, or is confirmed lost or unavailable during importation. See our Order Policies page for the full refund process.",
  },
  {
    question: "Do you offer delivery or pickup?",
    answer:
      `Both. You can choose delivery to your address or pickup at our location in ${BUSINESS.location} during checkout.`,
  },
  {
    question: "Can I track my order?",
    answer:
      "Yes — after checkout, save your order number (shown on the confirmation page). Use it along with your phone number on our Track Order page anytime to check your order status.",
  },
  {
    question: "Is there a minimum order quantity?",
    answer:
      "Some products have a minimum order quantity (MOQ), shown on the product page. Where an MOQ applies, you won't be able to order fewer than that amount of that item.",
  },
  {
    question: "How can I reach you if I have a question about my order?",
    answer: `Call or WhatsApp us at ${BUSINESS.phone}, or email ${BUSINESS.email}. You can also use the WhatsApp button at the bottom of any page.`,
  },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-14">
      <h1 className="font-display text-2xl text-navy-900 mb-2">Frequently Asked Questions</h1>
      <p className="text-sm text-navy-500 mb-8">
        Answers to common questions about ordering, payment, and delivery. Still stuck? {" "}
        <Link href="/about" className="text-ocean hover:underline">Contact us</Link>.
      </p>

      <div className="border border-navy-100 rounded divide-y divide-navy-100">
        {FAQS.map((faq, i) => {
          const isOpen = openIndex === i;
          return (
            <div key={i}>
              <button
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="w-full flex items-center justify-between gap-4 text-left px-4 py-3.5"
              >
                <span className="text-sm text-navy-900 font-medium">{faq.question}</span>
                <HiOutlineChevronDown
                  className={`w-4 h-4 text-navy-400 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
              </button>
              {isOpen && (
                <p className="px-4 pb-4 text-sm text-navy-600 leading-relaxed">{faq.answer}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
