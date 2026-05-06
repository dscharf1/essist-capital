import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-10">
    <h2 className="text-base font-bold text-white mb-3">{title}</h2>
    <div className="text-white/45 leading-relaxed space-y-3 text-sm">{children}</div>
  </section>
);

const PrivacyPolicy = () => (
  <div className="min-h-screen" style={{ background: "#091918" }}>
    <Header />
    <main className="pt-32 pb-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-2xl">

        <div className="mb-12">
          <p className="text-[#0d9488] text-xs font-bold uppercase tracking-widest mb-3">Legal</p>
          <h1 className="text-4xl font-black text-white mb-3">Privacy Policy</h1>
          <p className="text-white/30 text-sm">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }} className="pt-10">

          <Section title="1. Introduction">
            <p>
              Essist Capital LLC ("Essist Capital," "we," "our," or "us") is committed to protecting the privacy of our borrowers and website visitors. This Privacy Policy describes how we collect, use, store, and share information about you when you use our services and website.
            </p>
            <p>
              This policy complies with the Gramm-Leach-Bliley Act (GLBA), the Fair Credit Reporting Act (FCRA), and applicable New Jersey and New York privacy laws.
            </p>
          </Section>

          <Section title="2. Information We Collect">
            <p>We collect the following categories of information:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li><span className="text-white/70 font-medium">Identity:</span> Name, date of birth, Social Security Number or EIN, government-issued ID.</li>
              <li><span className="text-white/70 font-medium">Contact:</span> Email address, phone number, mailing address.</li>
              <li><span className="text-white/70 font-medium">Financial:</span> Income, bank account information, credit history, loan amounts, and repayment data.</li>
              <li><span className="text-white/70 font-medium">Property:</span> Property address, property type, ownership status.</li>
              <li><span className="text-white/70 font-medium">Application Data:</span> Project descriptions, contractor information, loan terms, and e-signature records.</li>
              <li><span className="text-white/70 font-medium">Technical:</span> IP address, browser type, device information, cookies, and usage logs.</li>
            </ul>
          </Section>

          <Section title="3. How We Use Your Information">
            <ul className="list-disc pl-5 space-y-2">
              <li>To evaluate and process your loan application</li>
              <li>To verify your identity and prevent fraud</li>
              <li>To service your loan, including sending payment reminders and statements</li>
              <li>To comply with our legal and regulatory obligations</li>
              <li>To communicate with you about your account and our services</li>
              <li>To improve our products, services, and website</li>
              <li>To report to credit bureaus as required or permitted by law</li>
            </ul>
          </Section>

          <Section title="4. Sharing Your Information">
            <p>We do not sell your personal information. We may share it with:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li><span className="text-white/70 font-medium">Service Providers:</span> Third-party vendors who help us operate our platform, bound by contract to use your data only as directed by us.</li>
              <li><span className="text-white/70 font-medium">Credit Bureaus:</span> We may report loan account information to consumer reporting agencies.</li>
              <li><span className="text-white/70 font-medium">Legal Authorities:</span> When required by law, court order, or to protect our rights.</li>
              <li><span className="text-white/70 font-medium">Business Transfers:</span> In the event of a merger or acquisition, your information may transfer as part of that transaction.</li>
            </ul>
          </Section>

          <Section title="5. Data Storage and Security">
            <p>
              Your data is stored using Supabase, a secure cloud infrastructure provider. We use industry-standard security including encryption in transit (TLS) and at rest, role-based access controls, and audit logging.
            </p>
            <p>
              We retain your information for as long as your account is active and as required by law — typically 7 years for financial records.
            </p>
          </Section>

          <Section title="6. Cookies and Tracking">
            <p>
              We use cookies to operate our website and analyze usage via Google Analytics 4. You can opt out of Google Analytics tracking at any time using the Google Analytics Opt-out Browser Add-on.
            </p>
          </Section>

          <Section title="7. Your Rights">
            <p>Depending on your state of residence, you may have the right to:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Know what personal information we collect about you</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your information (subject to legal retention requirements)</li>
              <li>Opt out of certain uses of your information</li>
              <li>Access your credit report as provided by the FCRA</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, contact us at <a href="mailto:dscharf@essistcap.com" className="text-[#0d9488] hover:underline">dscharf@essistcap.com</a>. We will respond within 30 days.
            </p>
          </Section>

          <Section title="8. Children's Privacy">
            <p>
              Our services are not directed to individuals under 18. We do not knowingly collect personal information from children. If you believe we have done so inadvertently, contact us immediately.
            </p>
          </Section>

          <Section title="9. Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time. We will notify you of material changes by email or by posting a notice on our website. Continued use of our services after the effective date constitutes acceptance of the revised policy.
            </p>
          </Section>

          <Section title="10. Contact Us">
            <p>Questions about this Privacy Policy? Reach us at:</p>
            <div className="mt-3 rounded-xl p-4 text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <p className="text-white font-semibold mb-1">Essist Capital LLC — Privacy Office</p>
              <p>Email: <a href="mailto:dscharf@essistcap.com" className="text-[#0d9488] hover:underline">dscharf@essistcap.com</a></p>
              <p className="text-white/30 mt-1">Licensed in New Jersey &amp; New York</p>
            </div>
          </Section>

          <div className="pt-6 text-white/25 text-xs" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            See also: <Link to="/terms" className="text-[#0d9488]/70 hover:text-[#0d9488] transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </main>
    <Footer />
  </div>
);

export default PrivacyPolicy;
