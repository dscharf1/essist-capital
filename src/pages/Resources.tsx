import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, Clock, User, Tag } from "lucide-react";

const blogPosts = [
  {
    title: "10 Kitchen Renovation Ideas That Add Value to Your Home",
    excerpt: "Discover the top kitchen upgrades that provide the best return on investment when it's time to sell.",
    category: "Kitchen",
    author: "Sarah Chen",
    date: "Dec 15, 2025",
    readTime: "5 min read",
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=400&fit=crop",
  },
  {
    title: "How to Finance Your Bathroom Remodel: A Complete Guide",
    excerpt: "Learn about different financing options for your bathroom renovation, from personal loans to BNPL solutions.",
    category: "Financing",
    author: "Michael Roberts",
    date: "Dec 12, 2025",
    readTime: "7 min read",
    image: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600&h=400&fit=crop",
  },
  {
    title: "Energy-Efficient Home Upgrades That Pay for Themselves",
    excerpt: "Explore home improvements that reduce your energy bills and may qualify for tax credits.",
    category: "Energy",
    author: "Emily Watson",
    date: "Dec 8, 2025",
    readTime: "6 min read",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop",
  },
  {
    title: "Choosing the Right Contractor for Your Project",
    excerpt: "Essential tips for vetting contractors, getting quotes, and ensuring a successful renovation.",
    category: "Tips",
    author: "David Park",
    date: "Dec 5, 2025",
    readTime: "8 min read",
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&h=400&fit=crop",
  },
  {
    title: "2026 Home Improvement Trends to Watch",
    excerpt: "From sustainable materials to smart home integration, here's what's trending in home renovation.",
    category: "Trends",
    author: "Sarah Chen",
    date: "Dec 1, 2025",
    readTime: "4 min read",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop",
  },
  {
    title: "Understanding Your Home Improvement Loan Options",
    excerpt: "Compare personal loans, home equity loans, and BNPL financing to find the right fit for you.",
    category: "Financing",
    author: "Michael Roberts",
    date: "Nov 28, 2025",
    readTime: "9 min read",
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=400&fit=crop",
  },
];

const categories = ["All", "Kitchen", "Bathroom", "Financing", "Energy", "Trends", "Tips"];

const Resources = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24">
        {/* Hero */}
        <section className="py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center">
              <span className="inline-block px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-6">
                Resources
              </span>
              <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-6">
                Home Improvement <span className="gradient-text">Insights</span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Expert advice, industry trends, and financing tips to help you make the most of your home improvement projects.
              </p>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-4">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap justify-center gap-2">
              {categories.map((category, idx) => (
                <button
                  key={idx}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    idx === 0
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Blog Posts */}
        <section className="py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogPosts.map((post, idx) => (
                <article
                  key={idx}
                  className="bg-card rounded-2xl overflow-hidden shadow-soft hover:shadow-card transition-all duration-300 hover:-translate-y-1 group"
                >
                  <div className="aspect-[3/2] overflow-hidden">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-medium">
                        {post.category}
                      </span>
                    </div>
                    <h2 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors line-clamp-2">
                      {post.title}
                    </h2>
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {post.author}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {post.readTime}
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="text-center mt-12">
              <Button variant="outline" size="lg">
                Load More Articles
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </section>

        {/* Newsletter */}
        <section className="py-16 bg-muted/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
              <p className="text-muted-foreground mb-8">
                Get the latest home improvement tips and financing advice delivered to your inbox.
              </p>
              <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <Button>Subscribe</Button>
              </form>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Resources;
