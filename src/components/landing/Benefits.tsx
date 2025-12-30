import { TrendingUp, Clock, Target, Heart } from "lucide-react";

const benefits = [
  {
    icon: TrendingUp,
    title: "Faster Progress",
    stat: "2x",
    description: "Learn twice as fast with a study partner who keeps you accountable",
  },
  {
    icon: Clock,
    title: "Consistent Practice",
    stat: "87%",
    description: "of users report more consistent daily practice with a partner",
  },
  {
    icon: Target,
    title: "Better Understanding",
    stat: "95%",
    description: "say discussing problems leads to deeper understanding",
  },
  {
    icon: Heart,
    title: "Motivation Boost",
    stat: "3x",
    description: "more likely to complete your DSA goals with peer support",
  },
];

export function Benefits() {
  return (
    <section id="benefits" className="py-20 px-4 bg-card">
      <div className="container mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Why Practice{" "}
            <span className="text-gradient">Together?</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            The data speaks for itself — collaborative learning leads to better outcomes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((benefit) => (
            <div
              key={benefit.title}
              className="p-6 rounded-xl bg-background border border-border text-center hover:shadow-lg transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <benefit.icon className="w-7 h-7 text-primary" />
              </div>
              <p className="text-4xl font-bold text-gradient mb-2">{benefit.stat}</p>
              <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
              <p className="text-sm text-muted-foreground">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
