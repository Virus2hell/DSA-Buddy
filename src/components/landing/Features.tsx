import { Users, Filter, BookOpen, Share2, MessageCircle, Shield } from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Partner Matching",
    description: "Find partners based on skill level, role, and preferred programming language. Get matched with developers who complement your learning style.",
  },
  {
    icon: Filter,
    title: "Smart Filters",
    description: "Browse users using advanced filters. Search by experience level, college student or working professional, and programming language preference.",
  },
  {
    icon: BookOpen,
    title: "Personal DSA Sheet",
    description: "Maintain your own DSA problem sheet with solved/unsolved tracking. Keep all your practice problems organized in one place.",
  },
  {
    icon: Share2,
    title: "Shared Workspaces",
    description: "Create private shared DSA sheets with your partners. Collaborate on problem sets and track your combined progress.",
  },
  {
    icon: MessageCircle,
    title: "Real-time Chat",
    description: "Communicate with your partners through built-in messaging. Discuss problems, share approaches, and learn together.",
  },
  {
    icon: Shield,
    title: "Privacy First",
    description: "Your personal DSA sheet is visible only to you and your connected partners. Full control over who sees your progress.",
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 px-4 bg-card">
      <div className="container mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything You Need to{" "}
            <span className="text-gradient">Master DSA</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            A complete platform designed to make your DSA preparation more collaborative, organized, and effective.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="p-6 rounded-xl bg-background border border-border hover:border-primary/50 hover:shadow-lg transition-all duration-300"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
