import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FadeUp } from "@/components/ui/fade-up";
import { HeroVideo } from "@/components/home/hero-video";
import { Heart, Users, Globe, Sparkles } from "lucide-react";

const VIDEO_ID = "XiXC-6eum5E";
const START_SEC = 84; // 1:24
const END_SEC = 176; // 2:56

const benefits = [
  {
    icon: Heart,
    title: "Pure Joy",
    description:
      "Bachata is raw emotion set to music. Every class leaves you smiling — it is physically impossible not to.",
  },
  {
    icon: Users,
    title: "Instant Community",
    description:
      "Walk into any Bachata social anywhere in the world and you already have a hundred new friends waiting.",
  },
  {
    icon: Globe,
    title: "A Passport to the World",
    description:
      "Danced in 100+ countries, Bachata turns any city into familiar territory. Your skills travel with you.",
  },
  {
    icon: Sparkles,
    title: "Real Confidence",
    description:
      "Learning to move your body changes how you carry yourself — on the dance floor and everywhere else.",
  },
];

export default function Home() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="relative flex min-h-[calc(100svh-4rem)] items-center justify-center overflow-hidden">
        <HeroVideo videoId={VIDEO_ID} startSec={START_SEC} endSec={END_SEC} />

        <div className="pointer-events-none absolute inset-0 bg-black/55" />

        
        <div className="relative z-10 mx-auto max-w-3xl px-4 text-center">
          <FadeUp
            as="h1"
            delay={0.1}
            className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl"
          >
            Master Bachata
            <br />
            <span className="text-primary">in Vienna</span>
          </FadeUp>

          <FadeUp
            as="p"
            delay={0.2}
            className="mx-auto mt-6 max-w-xl text-lg text-white/80"
          >
            From first steps to advanced combinations — join our group classes,
            book a private session, or practise at your own pace with hand-picked video tutorials.
          </FadeUp>

          <FadeUp
            delay={0.3}
            className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
          >
            <Button asChild size="lg" className="shadow-lg">
              <Link href="/book">Book Now</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-white/70 text-white hover:bg-white/10 hover:text-white"
            >
              <Link href="/videos">Browse Videos</Link>
            </Button>
          </FadeUp>
        </div>
      </section>

      {/* ── Bachata Story ── */}
      <section className="bg-background py-24">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <FadeUp
            as="p"
            className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary"
          >
            The Dance
          </FadeUp>

          <FadeUp
            as="h2"
            delay={0.1}
            className="text-3xl font-extrabold tracking-tight sm:text-4xl"
          >
            Born in the Dominican Republic.
            <br />
            <span className="text-primary">Loved by the world.</span>
          </FadeUp>

          <FadeUp
            delay={0.2}
            className="mt-8 space-y-5 text-left text-lg leading-relaxed text-muted-foreground"
          >
            <p>
              Bachata was born in the early 1960s in the poor neighborhoods of
              the Dominican Republic. For decades it was dismissed as{" "}
              <em>música de amargue</em> — music of bitterness — too raw, too
              working-class to be played on the radio. It was banned. Looked
              down upon. Almost forgotten.
            </p>
            <p>
              It survived anyway. Because when music speaks directly to the
              heart, no amount of gatekeeping can silence it.
            </p>
            <p>
              Today Bachata is danced on every continent — from open-air
              festivals in Barcelona to rooftop socials in Tokyo. It has evolved
              into something extraordinary: a conversation between two people,
              told through movement, built on trust, carried by music that makes
              you feel everything at once.
            </p>
          </FadeUp>

          <FadeUp
            as="blockquote"
            delay={0.3}
            className="mt-12 border-l-4 border-primary pl-6 text-left italic text-muted-foreground"
          >
            &ldquo;A music that was once forbidden is now the language that
            connects millions of people who never shared a single word.&rdquo;
          </FadeUp>
        </div>
      </section>

      {/* ── Benefits ── */}
      <section className="bg-foreground py-24">
        <div className="mx-auto max-w-5xl px-4">
          <div className="text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
              What You Gain
            </p>
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              More than just a dance
            </h2>
          </div>

          <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((b, i) => (
              <FadeUp
                key={b.title}
                delay={i * 0.1}
                className="flex flex-col items-center text-center"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                  <b.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-white">{b.title}</h3>
                <p className="text-sm leading-relaxed text-white/60">
                  {b.description}
                </p>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── "Just Try It" CTA ── */}
      <section className="bg-background py-24">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <FadeUp
            as="p"
            className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary"
          >
            Just Try It
          </FadeUp>

          <FadeUp
            as="h2"
            delay={0.1}
            className="text-3xl font-extrabold tracking-tight sm:text-4xl"
          >
            One class. That&apos;s all it takes.
          </FadeUp>

          <FadeUp
            delay={0.2}
            className="mt-8 space-y-5 text-lg leading-relaxed text-muted-foreground"
          >
            <p>
              You don&apos;t need rhythm. You don&apos;t need a partner. You
              don&apos;t need to feel &ldquo;ready.&rdquo; You just need to show
              up once — and let the music do the rest.
            </p>
            <p>
              People who try Bachata rarely stop. Not because they have to. But
              because it becomes the best part of their week — the place where
              stress melts, strangers become lifelong friends, and you remember
              that your body was built for far more than sitting at a desk.
            </p>
            <p>
              You&apos;ll leave your first class with a smile you can&apos;t
              explain, the number of at least three new people in your phone,
              and a very strong urge to come back next week.
            </p>
            <p className="text-xl font-semibold text-foreground">
              Try it. We&apos;re pretty sure you&apos;ll be back for more.
            </p>
          </FadeUp>

          <FadeUp delay={0.3} className="mt-10">
            <Button asChild size="lg" className="shadow-lg">
              <Link href="/book">Book Your First Class</Link>
            </Button>
          </FadeUp>
        </div>
      </section>
    </>
  );
}
