import Link from 'next/link';
import { APP_CONFIG } from '@/config/app';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ThemeToggle from '@/components/shared/ThemeToggle';
import BentoFeatureGrid from '@/components/shared/BentoFeatureGrid';
import UserNav from '@/components/shared/UserNav';
import { 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
} from 'lucide-react';

export default function HomePage() {
  const sampleTrees = [
    {
      slug: 'smith-family',
      title: 'The Smith Family',
      emoji: '🌳',
      category: 'Nuclear Family',
      members: 10,
      generations: 3,
      description: 'Grandparents Robert & Margaret, their 3 children, and 3 grandchildren in a clean generational hierarchy.',
      accent: 'border-blue-200 dark:border-blue-900/50 hover:border-blue-500',
    },
    {
      slug: 'rivera-chen',
      title: 'Rivera-Chen Family',
      emoji: '🌿',
      category: 'Blended & Multicultural',
      members: 25,
      generations: 4,
      description: 'Spanning Mexico City, Taipei, and California with step-parents, half-siblings, twins, and adoption.',
      accent: 'border-emerald-200 dark:border-emerald-900/50 hover:border-emerald-500',
    },
    {
      slug: 'house-targaryen',
      title: 'House Targaryen Dynasty',
      emoji: '🐉',
      category: 'Epic Royal Lineage',
      members: 35,
      generations: 7,
      description: 'From Aegon the Conqueror through the Dance of the Dragons down to Daenerys Stormborn and Jon Snow.',
      accent: 'border-amber-200 dark:border-amber-900/50 hover:border-amber-500',
    },
  ];



  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      {/* Header */}
      <header className="px-6 py-4 border-b flex justify-between items-center bg-card/60 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🌳</span>
          <h1 className="text-xl font-bold tracking-tight">{APP_CONFIG.name}</h1>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex text-xs font-semibold">
              My Trees & Dashboard
            </Button>
          </Link>
          <Link href="/demo">
            <Button variant="outline" size="sm" className="hidden sm:inline-flex text-xs font-semibold">
              Live Demo
            </Button>
          </Link>
          <UserNav />
          <ThemeToggle />
          <Link href="/dashboard">
            <Button size="sm" className="font-semibold shadow-xs text-xs">
              Start Your Tree <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center">
        <section className="w-full max-w-5xl px-6 pt-16 pb-12 text-center flex flex-col items-center">
          <Badge 
            variant="outline" 
            className="mb-6 px-3 py-1 rounded-full text-xs font-medium border-primary/20 bg-primary/5 text-primary gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            Next-Generation Family Tree Builder
          </Badge>

          <h2 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-3xl leading-tight">
            Your family legacy, beautifully visualized & explored with <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400">AI</span>.
          </h2>

          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
            Replace clunky, outdated software with an intuitive drag-and-drop canvas, instant QR code sharing for family reunions, high-resolution PNG/PDF poster export, and an intelligent AI Family Historian.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/dashboard">
              <Button size="lg" className="font-semibold h-11 px-6 shadow-md gap-2">
                Start Your Family Tree <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/demo">
              <Button size="lg" variant="outline" className="font-semibold h-11 px-6">
                Explore Live Demo
              </Button>
            </Link>
          </div>

          <div className="mt-8 flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Free up to 25 people
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> No credit card required
            </span>
            <span className="flex items-center gap-1.5 hidden sm:flex">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Instant QR Code
            </span>
          </div>
        </section>

        {/* Test Fixtures Showcase */}
        <section className="w-full max-w-6xl px-6 py-12 border-t">
          <div className="text-center mb-10">
            <Badge variant="secondary" className="mb-2 uppercase text-[10px] tracking-wider font-semibold">
              Live Showcase
            </Badge>
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Explore Pre-Built Family Lineages
            </h3>
            <p className="text-muted-foreground text-sm mt-2 max-w-xl mx-auto">
              Click any fixture below to explore its interactive graph, hover over members, and ask questions to the AI Historian.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {sampleTrees.map((tree) => (
              <Link key={tree.slug} href={`/t/${tree.slug}`} className="group block">
                <Card className={`h-full border transition-all duration-200 group-hover:shadow-lg group-hover:-translate-y-1 ${tree.accent}`}>
                  <CardContent className="p-6 flex flex-col justify-between h-full">
                    <div>
                      <div className="flex items-start justify-between mb-4">
                        <span className="text-3xl p-2.5 rounded-xl bg-muted/60 border border-border/50">
                          {tree.emoji}
                        </span>
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant="outline" className="text-[10px] font-semibold">
                            {tree.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {tree.members} members • {tree.generations} gens
                          </span>
                        </div>
                      </div>

                      <h4 className="text-lg font-bold group-hover:text-primary transition-colors">
                        {tree.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                        {tree.description}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t flex items-center justify-between text-xs font-semibold text-primary">
                      <span>Explore Tree</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Apple-Style Bento Feature Showcase */}
        <div className="w-full border-t bg-muted/20 flex justify-center">
          <BentoFeatureGrid />
        </div>

        {/* Event CTA Section */}
        <section className="w-full max-w-5xl px-6 py-16 text-center">
          <div className="rounded-2xl border bg-gradient-to-b from-card to-muted/40 p-8 sm:p-12 shadow-sm relative overflow-hidden">
            <div className="max-w-xl mx-auto space-y-4">
              <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                Family Reunions • Weddings • Anniversaries
              </Badge>
              <h3 className="text-3xl font-bold tracking-tight">
                Planning an upcoming family gathering?
              </h3>
              <p className="text-muted-foreground text-sm">
                Create your tree in minutes, print a custom QR Code for your event tables, and let everyone discover how they connect.
              </p>
              <div className="pt-2">
                <Link href="/dashboard">
                  <Button size="lg" className="font-semibold shadow-md">
                    Start Building For Free
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 px-6 text-center text-xs text-muted-foreground bg-card">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span>🌳</span>
            <span className="font-semibold text-foreground">{APP_CONFIG.name}</span>
            <span>— Interactive Family Trees with AI</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/demo" className="hover:text-foreground transition-colors">Demo</Link>
            <Link href="/t/smith-family" className="hover:text-foreground transition-colors">Smith Family</Link>
            <Link href="/t/rivera-chen" className="hover:text-foreground transition-colors">Rivera-Chen</Link>
            <Link href="/t/house-targaryen" className="hover:text-foreground transition-colors">House Targaryen</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
