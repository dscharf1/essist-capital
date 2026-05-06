import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-10">
    <h2 className="text-base font-bold text-white mb-3">{title}</h2>
    <div className="text-white/45 leading-relaxed space-y-3 text-sm">{children}</div>
  </section>
);

const TermsOfService = () => (
  <div className="min-h-screen" style={{ background: "#091918" }}>
    <Header />
    <main className="pt-32 pb-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-2xl">

        <div className="mb-12">
          <p className="text-[#0d9488] text-xs font-bold uppercase tracking-widest mb-3">Legal</p>
          <h1 className="text-4xl font-black text-white mb-3">Terms of Service</h1>
          <p className="text-white/30 text-sm">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }} className="pt-10">

          <Section title="1. Acceptance of Terms">
            <p>
              By accessing or using the services of Essist Capital LLC ("Essist Capital," "we," "our," or "us"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree, do not use our services. These Terms constitute a legally binding agreement between you and Essist Capital LLC.
            </p>
            <p>
              Essist Capital LLC is a licensed lender operating in New Jersey and New York. Our services are limited to residents and property owners in these states.
            </p>
          </Section>

          <Section title="2. Eligibility">
            <p>To be eligible for a loan from Essist Capital, you must:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Be at least 18 years of age</li>
              <li>Own or have a legal interest in property located in New Jersey or New York</li>
              <li>Have a valid U.S. Social Security Number or EIN (for business entities)</li>
              <li>Not be in bankruptcy or have a pending bankruptcy proceeding</li>
              <li>Meet our internal credit and underwriting criteria</li>
            </ul>
            <p>Essist Capital reserves the right to deny any application at its sole discretion.</p>
          </Section>

          <Section title="3. Loan Terms">
            <p>
              Essist Capital offers home improvement loans ranging from $5,000 to $30,000 with repayment terms of 6, 12, 18, or 24 months. Loans carry a flat add-on interest rate applied to the original principal for the full term. An origination fee of 2.5% of the loan amount is charged at funding.
            </p>
            <p>
              The Annual Percentage Rate (APR) will be disclosed to you before you sign any loan agreement, as required by the federal Truth in Lending Act (TILA), 15 U.S.C. § 1601 et seq. The flat add-on rate is not the same as the APR.
            </p>
            <p>
              Loan proceeds may only be used for home improvement purposes at the property identified in your application. Misuse of funds may constitute grounds for immediate repayment demand.
            </p>
          </Section>

          <Section title="4. Repayment">
            <p>
              Borrowers are required to make monthly payments in the amount specified in their loan agreement. Payments are due on the same date each month, beginning one month from the date of funding.
            </p>
            <p>
              It is your responsibility to ensure your payment method is current and has sufficient funds. You will be notified by email prior to each payment due date.
            </p>
            <p>
              Prepayment of your loan in full or in part is permitted at any time without penalty. However, prepayment does not reduce the total finance charge — the flat interest is calculated on the original loan amount for the full term.
            </p>
          </Section>

          <Section title="5. Late Fees and Default">
            <p>
              A payment is considered late if not received within 5 calendar days of its due date. A late fee of $25 or 5% of the payment amount (whichever is greater) may be assessed.
            </p>
            <p>
              A loan is in default if a payment is more than 30 days past due, if you provide false information on your application, if you use loan proceeds for non-approved purposes, or if you file for bankruptcy.
            </p>
            <p>
              Upon default, the entire outstanding balance may become immediately due and payable. Essist Capital reserves the right to pursue all available legal remedies, including referral to collections and reporting to credit bureaus.
            </p>
          </Section>

          <Section title="6. Electronic Signature and Communications">
            <p>
              By using our online application, you consent to receive communications from Essist Capital electronically, including your loan agreement, TILA disclosures, and payment notices. Your electronic signature constitutes a legally binding signature under the E-SIGN Act and applicable state law.
            </p>
          </Section>

          <Section title="7. Privacy and Data">
            <p>
              Your use of our services is also governed by our <Link to="/privacy" className="text-[#0d9488] hover:underline">Privacy Policy</Link>, which is incorporated herein by reference. We collect and process your personal and financial information in accordance with applicable federal and state law, including the Gramm-Leach-Bliley Act.
            </p>
          </Section>

          <Section title="8. Disclaimer of Warranties">
            <p>
              Our services are provided "as is" without warranties of any kind, express or implied. Essist Capital does not warrant that our platform will be uninterrupted, error-free, or completely secure.
            </p>
          </Section>

          <Section title="9. Limitation of Liability">
            <p>
              To the maximum extent permitted by applicable law, Essist Capital shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our services. Our total liability to you shall not exceed the amount of your loan.
            </p>
          </Section>

          <Section title="10. Governing Law and Disputes">
            <p>
              These Terms are governed by the laws of the State of New Jersey, without regard to conflict of law principles. Any dispute shall be subject to the exclusive jurisdiction of the state and federal courts in Essex County, New Jersey.
            </p>
            <p>
              You agree to attempt informal resolution by contacting us at <a href="mailto:dscharf@essistcap.com" className="text-[#0d9488] hover:underline">dscharf@essistcap.com</a> before initiating any legal proceeding.
            </p>
          </Section>

          <Section title="11. Changes to These Terms">
            <p>
              We reserve the right to modify these Terms at any time. Changes will be posted with an updated date. Continued use of our services after changes are posted constitutes acceptance of the revised Terms.
            </p>
          </Section>

          <Section title="12. Contact">
            <div className="rounded-xl p-4 text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <p className="text-white font-semibold mb-1">Essist Capital LLC</p>
              <p>Email: <a href="mailto:dscharf@essistcap.com" className="text-[#0d9488] hover:underline">dscharf@essistcap.com</a></p>
              <p className="text-white/30 mt-1">Licensed in New Jersey &amp; New York</p>
            </div>
          </Section>

          <div className="pt-6 text-white/25 text-xs" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            See also: <Link to="/privacy" className="text-[#0d9488]/70 hover:text-[#0d9488] transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </main>
    <Footer />
  </div>
);

export default TermsOfService;
