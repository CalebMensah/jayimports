import { POLICIES } from "@/lib/constants";

export default function PoliciesPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-14">
      <h1 className="font-display text-2xl text-navy-900 mb-8">Order Policies</h1>

      <section className="mb-8">
        <h2 className="text-sm font-medium text-navy-700 mb-2 uppercase tracking-wide text-xs">Preorders</h2>
        <p className="text-navy-600 leading-relaxed text-sm">{POLICIES.preorder}</p>
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-medium text-navy-700 mb-2 uppercase tracking-wide text-xs">Order Confirmation</h2>
        <p className="text-navy-600 leading-relaxed text-sm">{POLICIES.orderConfirmation}</p>
      </section>

      <section>
        <h2 className="text-sm font-medium text-navy-700 mb-2 uppercase tracking-wide text-xs">Refunds</h2>
        <p className="text-navy-600 leading-relaxed text-sm whitespace-pre-line">{POLICIES.refund}</p>
      </section>
    </div>
  );
}