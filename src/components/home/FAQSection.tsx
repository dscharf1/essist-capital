import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What credit score do I need to qualify?",
    answer: "We work with a wide range of credit profiles. While a higher credit score may help you secure better terms, we consider multiple factors in our approval process. You can check your eligibility without impacting your credit score.",
  },
  {
    question: "How much can I borrow?",
    answer: "Our financing ranges from $1,000 to $100,000 depending on your project needs and financial profile. Most home improvement projects fall within this range, from small upgrades to major renovations.",
  },
  {
    question: "Are there any hidden fees?",
    answer: "Absolutely not. We believe in complete transparency. All fees and rates are disclosed upfront before you sign anything. There are no prepayment penalties, no annual fees, and no surprises.",
  },
  {
    question: "How long does approval take?",
    answer: "Most applications receive an instant decision. In some cases, we may need additional documentation, but even then, you'll typically have an answer within 24 hours.",
  },
  {
    question: "Can I use any contractor?",
    answer: "Yes! You can work with any licensed and insured contractor of your choice. We also have a network of vetted contractors if you need recommendations.",
  },
  {
    question: "What happens if my project costs change?",
    answer: "We understand that project costs can evolve. If you need additional financing, you can apply for a top-up loan. If your project costs less than expected, you'll simply pay back less.",
  },
];

const FAQSection = () => {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-4">
              FAQ
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Common Questions
            </h2>
            <p className="text-lg text-muted-foreground">
              Everything you need to know about financing your home improvement project
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, idx) => (
              <AccordionItem
                key={idx}
                value={`item-${idx}`}
                className="bg-card rounded-xl px-6 shadow-soft border-none"
              >
                <AccordionTrigger className="text-left font-semibold hover:text-primary hover:no-underline py-5">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
