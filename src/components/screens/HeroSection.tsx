import { SparklesBackground } from "@/components/ui";
import CarShowcaseLoader from "./CarShowcaseLoader";
import { COLORS } from "@/lib/constants";

const features = [
  { title: "EXOTIC SUPERCARS", description: "6 handcrafted exotic cars with authentic performance specs" },
  { title: "BREATH-TAKING TRACKS", description: "3 stunning environments from neon cities to coastal circuits" },
  { title: "REAL-TIME MULTIPLAYER", description: "Race up to 8 players in real-time with synced physics" },
  { title: "CINEMATIC VISUALS", description: "Bloom, motion blur, and post-processing for a premium feel" },
  { title: "SPATIAL AUDIO", description: "Layered engine sounds and dynamic SFX that respond to your inputs" },
  { title: "DRIFT MECHANICS", description: "Master drifting with realistic tire physics and scoring" },
];

const HeroSection = () => {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background">
      <SparklesBackground
        className="absolute inset-0"
        density={1.5}
        particleCount={120}
        color={COLORS.primary}
      />

      <div className="relative z-10 flex min-h-screen flex-col items-center">
        <header className="w-full py-8 px-6 flex justify-between items-center">
          <p className="text-3xl sm:text-4xl font-display font-black neon-text">
            VELOCITY NEXUS
          </p>
          <nav aria-label="Main navigation">
            <ul className="flex items-center gap-4 font-display text-sm font-bold tracking-widest">
              <li>
                <a href="/garage" className="nav-link">GARAGE</a>
              </li>
              <li>
                <a href="/tracks" className="nav-link">TRACKS</a>
              </li>
              <li>
                <a href="/lobby" className="nav-link">MULTIPLAYER</a>
              </li>
            </ul>
          </nav>
        </header>

        <main className="relative z-10 flex flex-col items-center flex-1 w-full">
          <div className="relative w-full max-w-4xl mx-auto text-center py-16 sm:py-24 px-6">
            <h1 className="mb-4 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-black tracking-tight neon-text">
               Find your line.
            </h1>

            <p className="text-lg sm:text-xl text-secondary max-w-2xl mx-auto mb-8">
               A focused browser racer built around clean handling, readable tracks, and
               real competition. Pick a car, learn the circuit, and chase a better lap.
            </p>

            <a
              href="/race?mode=single"
              className="hero-cta inline-flex items-center justify-center px-8 py-4 text-xl tracking-widest"
            >
               Start a race
            </a>
          </div>

          <div className="relative w-full max-w-6xl mx-auto py-8 px-6">
            <CarShowcaseLoader />
          </div>
        </main>

        <section className="relative z-10 w-full py-16">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-center text-3xl font-display font-bold mb-12 neon-text-pink">
              FEATURES
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature) => (
                <div key={feature.title} className="feature-card">
                  <h3 className="text-xl font-display font-bold mb-2" style={{ color: COLORS.primary }}>
                    {feature.title}
                  </h3>
                  <p className="text-sm text-secondary">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <noscript className="relative z-10 w-full py-8">
          <div className="max-w-2xl mx-auto px-6 text-center">
            <div className="inline-block rounded-xl bg-input border border-accent px-6 py-4">
              <p className="text-sm font-display font-bold text-accent mb-2">
                JavaScript IS REQUIRED
              </p>
              <p className="text-secondary">
                The full 3D racing experience uses WebGL and real-time networking.
                Navigation links above still work without JavaScript, but to play,
                please enable JavaScript in your browser.
              </p>
            </div>
          </div>
        </noscript>
      </div>
    </div>
  );
};

export default HeroSection;
