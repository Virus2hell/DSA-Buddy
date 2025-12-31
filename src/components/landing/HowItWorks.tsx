import { UserPlus, Search, Handshake, Rocket } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    step: "01",
    title: "Create Your Profile",
    description: "Sign up and set your skill level, role (student/professional), and preferred programming language.",
  },
  {
    icon: Search,
    step: "02",
    title: "Find Partners",
    description: "Browse through profiles using filters to find developers who match your learning goals and style.",
  },
  {
    icon: Handshake,
    step: "03",
    title: "Connect & Collaborate",
    description: "Send partner requests, get accepted, and start working together on shared DSA problem sheets.",
  },
  {
    icon: Rocket,
    step: "04",
    title: "Level Up Together",
    description: "Track progress, chat in real-time, and motivate each other to consistently improve your DSA skills.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 px-4">
      <div className="container mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Get Started in{" "}
            <span className="text-gradient">4 Simple Steps</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            From sign up to solving problems together, we've made it simple to find your perfect DSA partner.
          </p>
        </div>

        <div className="relative max-w-4xl mx-auto">
          {/* Center line */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-primary/30 to-transparent -translate-x-1/2" />

          <div className="space-y-12">
            {steps.map((step, index) => (
              <div
                key={step.step}
                className={`flex flex-col md:flex-row items-center gap-8 ${
                  index % 2 === 1 ? "md:flex-row-reverse" : ""
                }`}
              >
                {/* Content Card */}
                <div className="flex-1">
                  <div className={`p-6 rounded-xl bg-card shadow-card border border-border hover:shadow-glow hover:border-primary/50 transition-all duration-300 ${index % 2 === 1 ? "md:text-right" : ""}`}>
                    <span className="text-sm font-medium text-primary mb-2 inline-block">Step {step.step}</span>
                    <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                  </div>
                </div>

                {/* Icon */}
                <div className="relative z-10 flex-shrink-0">
                  <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center shadow-glow hover:scale-110 transition-all duration-300">
                    <step.icon className="w-7 h-7 text-primary-foreground" />
                  </div>
                </div>

                {/* Spacer */}
                <div className="flex-1 hidden md:block" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
