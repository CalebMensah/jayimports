import { BUSINESS } from "@/lib/constants";

export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-14">
      <h1 className="font-display text-2xl text-navy-900 mb-2">Terms of Service</h1>
      <p className="text-xs text-navy-400 mb-8">Last updated: September 2026</p>

      <div className="space-y-7 text-sm text-navy-600 leading-relaxed">
        <section>
          <h2 className="text-navy-900 font-medium mb-2">1. About {BUSINESS.name}</h2>
          <p>{BUSINESS.description}</p>
        </section>

        <section>
          <h2 className="text-navy-900 font-medium mb-2">2. Orders</h2>
          <p>
            By placing an order on this website, you confirm that the details you provide (name, phone number,
            delivery address) are accurate. Orders for preorder/sourced items and our refund policy are governed
            separately — see our <a href="/policies" className="text-ocean hover:underline">Order Policies</a> page,
            which forms part of these terms.
          </p>
        </section>

        <section>
          <h2 className="text-navy-900 font-medium mb-2">3. Pricing & Payment</h2>
          <p>
            Prices are listed in Ghana Cedis (GH₵) and may change without prior notice. Payment is accepted via
            Mobile Money, either instantly through our payment partner or manually with confirmation from us.
            An order is only confirmed once payment has been verified.
          </p>
        </section>

        <section>
          <h2 className="text-navy-900 font-medium mb-2">4. Product Information</h2>
          <p>
            We make reasonable efforts to display accurate product images and descriptions. As many products are
            sourced from international suppliers, minor variations in colour, size, or packaging may occur and do
            not constitute a defect.
          </p>
        </section>

        <section>
          <h2 className="text-navy-900 font-medium mb-2">5. Delivery & Pickup</h2>
          <p>
            Delivery timelines, especially for preorder items, are estimates and may vary due to factors outside
            our control, including customs, shipping, and supplier availability. Pickup is available at{" "}
            {BUSINESS.location}.
          </p>
        </section>

        <section>
          <h2 className="text-navy-900 font-medium mb-2">6. Your Information</h2>
          <p>
            We collect your name, phone number, and (optionally) email and delivery address solely to process and
            fulfil your order, and to contact you about it. We do not sell your information to third parties.
            Payment details are handled directly by our payment processor and are never stored on our servers.
          </p>
        </section>

        <section>
          <h2 className="text-navy-900 font-medium mb-2">7. Changes to These Terms</h2>
          <p>
            We may update these terms from time to time. Continued use of this website after changes are posted
            constitutes acceptance of the updated terms.
          </p>
        </section>

        <section>
          <h2 className="text-navy-900 font-medium mb-2">8. Contact</h2>
          <p>
            Questions about these terms can be sent to{" "}
            <a href={`mailto:${BUSINESS.email}`} className="text-ocean hover:underline">{BUSINESS.email}</a>{" "}
            or via WhatsApp at {BUSINESS.phone}.
          </p>
        </section>
      </div>
    </div>
  );
}