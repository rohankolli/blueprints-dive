import { HomeHero } from "@/components/HomeHero";
import { SiteHeader } from "@/components/SiteHeader";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <HomeHero />
      <footer className="mx-auto w-full max-w-5xl px-5 pb-10 text-sm text-ink-soft">
        <p>
          Surplus is an unofficial engagement game inspired by rare-answer dailies, themed for{" "}
          <a className="underline" href="https://www.blueprintsforpangaea.org/" target="_blank" rel="noreferrer">
            Blueprints for Pangaea
          </a>
          . Official spelling: Pangaea. Placeholder prompts until Rohan supplies real ones.
        </p>
      </footer>
    </>
  );
}
