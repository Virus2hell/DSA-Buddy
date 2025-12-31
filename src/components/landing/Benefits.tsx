import { TrendingUp, Target, Heart } from "lucide-react";

const benefits = [
  {
    icon: TrendingUp,
    title: "Faster Progress",
    stat: "2x",
    description: "Learn twice as fast with a study partner who keeps you accountable",
    color: "green" // Green for first card
  },
  {
    icon: Target,
    title: "Better Understanding",
    stat: "95%",
    description: "say discussing problems leads to deeper understanding",
    color: "yellow" // Yellow for second card
  },
  {
    icon: Heart,
    title: "Motivation Boost",
    stat: "3x",
    description: "more likely to complete your DSA goals with peer support",
    color: "red" // Red for third card
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
            Stop studying alone. Start mastering DSA with the perfect partner.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {benefits.map((benefit, index) => (
            <div
              key={benefit.title}
              className="p-6 rounded-xl bg-background border border-border text-center hover:shadow-lg hover:border-primary/50 transition-all duration-300 group style={{ animationDelay: `${index * 0.1}s` }}"
            >
              {/* Colored Icon Circle */}
              <div className={`w-14 h-14 rounded-full bg-${benefit.color}-500/10 group-hover:bg-${benefit.color}-500/20 flex items-center justify-center mx-auto mb-4 transition-all duration-300 border border-${benefit.color}-500/20`}>
                <benefit.icon 
                  className={`w-7 h-7 stroke-${benefit.color}-400 group-hover:scale-110 transition-all duration-300 drop-shadow-sm`} 
                  strokeWidth={2.5}
                />
              </div>
              
              {/* Stat */}
              <p className="text-4xl font-bold text-gradient mb-2 group-hover:scale-105 transition-transform">{benefit.stat}</p>
              
              {/* Title */}
              <h3 className="text-lg font-semibold mb-2 text-foreground group-hover:text-primary transition-colors">{benefit.title}</h3>
              
              {/* Description */}
              <p className="text-sm text-muted-foreground">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
