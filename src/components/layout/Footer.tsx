import { Link } from "react-router-dom";
import Logo from "@/components/Logo";

const Footer = () => (
  <footer style={{ background: "#091918", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link to="/"><Logo size="sm" light={true} /></Link>

        <div className="flex items-center gap-6 text-xs text-white/30">
          <Link to="/about" className="hover:text-white/60 transition-colors">About</Link>
          <Link to="/contact" className="hover:text-white/60 transition-colors">Contact</Link>
          <Link to="/terms" className="hover:text-white/60 transition-colors">Terms</Link>
          <Link to="/privacy" className="hover:text-white/60 transition-colors">Privacy</Link>
          <a href="mailto:dscharf@essistcap.com" className="hover:text-white/60 transition-colors">dscharf@essistcap.com</a>
        </div>

        <p className="text-xs text-white/20 text-center sm:text-right">
          © {new Date().getFullYear()} Essist Capital LLC · NJ &amp; NY Licensed Lender
        </p>
      </div>

      <p className="text-center text-white/15 text-xs mt-5 max-w-2xl mx-auto leading-relaxed">
        Essist Capital LLC is a licensed lender in New Jersey and New York. All loans subject to credit approval.
        Rates shown are flat add-on rates, not APR. See our <Link to="/terms" className="underline underline-offset-2 hover:text-white/30 transition-colors">Terms</Link> and <Link to="/privacy" className="underline underline-offset-2 hover:text-white/30 transition-colors">Privacy Policy</Link> for full details.
      </p>
    </div>
  </footer>
);

export default Footer;
