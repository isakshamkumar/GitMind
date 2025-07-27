"use client";

import { ArrowRightIcon } from "@radix-ui/react-icons";
import {
  BookOpen,
  Code2,
  MessageCircle,
  Sparkles,
  Users,
  Bot,
  Zap,
  GitBranch,
  Code,
  Github,
} from "lucide-react";
import Link from "next/link";

import { AnimatedGridPattern } from "@/components/magicui/animated-grid-pattern";
import { Marquee } from "@/components/magicui/marquee";
import { Ripple } from "@/components/magicui/ripple";
import { DotPattern } from "@/components/magicui/dot-pattern";
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { IconCloud } from "@/components/magicui/icon-cloud";
import { OrbitingCircles } from "@/components/magicui/orbiting-circles";
import { FeatureCard, features as featureData } from "@/components/ui/feature-card";
import { TextHoverEffect } from "@/components/ui/texthovereffect";
import { PointerHighlight } from "@/components/ui/pointer-highlight";
import { Cover } from "@/components/ui/cover";
import { ReactIcon, TypescriptIcon, VscodeIcon } from "@/components/magicui/tech-icons";
import { StickyScroll } from "@/components/ui/sticky-scroll-reveal";
import { featuresContent } from "@/lib/constant";

const testimonials = [
  {
    name: "John Doe",
    handle: "@johndoe",
    avatar: "/avatars/01.png",
    comment:
      "This AI code assistant has revolutionized my workflow. I can't imagine coding without it now.",
  },
  {
    name: "Jane Smith",
    handle: "@janesmith",
    avatar: "/avatars/02.png",
    comment:
      "The code analysis is incredibly accurate and has helped me identify potential bugs before they become major issues.",
  },
  {
    name: "Sam Wilson",
    handle: "@samwilson",
    avatar: "/avatars/03.png",
    comment:
      "As a team lead, this tool has been invaluable for onboarding new developers and ensuring code quality.",
  },
  {
    name: "Emily White",
    handle: "@emilywhite",
    avatar: "/avatars/04.png",
    comment:
      "The natural language Q&A is a game-changer. I can get answers to my questions without ever leaving my editor.",
  },
];

const problems = [
  {
    title: "Codebase Complexity",
    description:
      "Navigating large and complex codebases can be a daunting task, leading to slower development cycles and increased onboarding time for new developers.",
  },
  {
    title: "Knowledge Silos",
    description:
      "Critical knowledge often resides in the minds of a few senior developers, creating bottlenecks and risking knowledge loss when team members leave.",
  },
  {
    title: "Inefficient Collaboration",
    description:
      "Miscommunication and lack of shared understanding within development teams can lead to duplicated work, inconsistent code, and project delays.",
  },
];

const solutions = [
  {
    title: "Instant Code Understanding",
    description:
      "Our AI provides a clear overview of your codebase, making it easy to understand the architecture, identify key components, and trace data flows.",
    icon: Bot,
    gradientFrom: "blue-500",
    gradientTo: "purple-500",
  },
  {
    title: "Centralized Knowledge Hub",
    description:
      "GITMIND acts as a single source of truth, capturing and organizing knowledge from your codebase and team discussions in one accessible place.",
    icon: BookOpen,
    gradientFrom: "green-500",
    gradientTo: "emerald-500",
  },
  {
    title: "Enhanced Team Synergy",
    description:
      "Facilitate better communication and collaboration with shared insights, automated summaries, and a common platform for discussing code.",
    icon: Users,
    gradientFrom: "orange-500",
    gradientTo: "red-500",
  },
];

export default function Page() {
  return (
    <div className="bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="size-6" />
            <span className="text-lg font-bold">GITMIND</span>
          </div>
          <div className="hidden items-center gap-4 md:flex">
            <Link href="#features" className="text-sm font-medium">
              Features
            </Link>
            <Link href="#solutions" className="text-sm font-medium">
              Solutions
            </Link>
            <Link href="#testimonials" className="text-sm font-medium">
              Testimonials
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/dashboard">Login</Link>
            </Button>
            <ShimmerButton>
              <Link href="/dashboard">Get Started</Link>
            </ShimmerButton>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <DotPattern className="absolute inset-0 opacity-20" />
        <div className="container relative z-10 text-center">
          <Badge
            variant="outline"
            className="mb-6 animate-fade-in-up border-border"
          >
            <Sparkles className="mr-2 size-4" />
            Introducing GITMIND
          </Badge>

          {/* === REPLACED CODE START === */}
          <h1 className="text-4xl font-bold tracking-tighter text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
            Understand any codebase,{" "}
            <PointerHighlight
              rectangleClassName="bg-blue-100 dark:bg-blue-900/40 border-blue-300 dark:border-blue-700"
              pointerClassName="text-blue-500"
              containerClassName="inline-block"
            >
  <Cover>
          <span className="relative z-10">collaborate</span>
        </Cover>            </PointerHighlight>{" "}
            with your team.
          </h1>
          {/* === REPLACED CODE END === */}
          
          <p className="mx-auto mt-6 max-w-3xl text-lg text-muted-foreground md:text-xl">
            Your AI-powered coding companion for better code understanding and
            team collaboration.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <ShimmerButton>
              <Link
                href="/dashboard"
                className="flex items-center gap-2"
              >
                <Zap className="size-4" />
                <span className="whitespace-pre-wrap text-center text-sm font-medium leading-none tracking-tight text-white dark:text-black lg:text-lg z-10">Get Started for Free</span>
              </Link>
            </ShimmerButton>
            <Button variant="outline" asChild>
              <Link href="#features">
                <span>Learn More</span>
                <ArrowRightIcon className="ml-2 size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

   {/* "Join Thousands" Section */}
<section className="py-12">
  <div className="container">
    <div className="relative flex w-full flex-col items-center justify-center overflow-hidden rounded-lg border bg-background p-20 md:shadow-xl">
      <p className="z-10 whitespace-pre-wrap text-center text-5xl font-medium tracking-tighter text-foreground">
        Join Thousands of Developers
      </p>
      <Ripple />

      {/* Inner circle with relevant tech icons */}
      <OrbitingCircles
        className="h-[30px] w-[30px] border-none"
        radius={120}
        duration={20}
        delay={10}
      >
        <ReactIcon className="h-full w-full" />
      </OrbitingCircles>
      <OrbitingCircles
        className="h-[30px] w-[30px] border-none"
        radius={120}
        duration={20}
        delay={20}
      >
        <TypescriptIcon className="h-full w-full" />
      </OrbitingCircles>

      {/* Outer circle with more icons */}
      <OrbitingCircles
        className="h-[50px] w-[50px] border-none"
        radius={220}
        duration={30}
        reverse
      >
        <VscodeIcon className="h-full w-full" />
      </OrbitingCircles>
      <OrbitingCircles
        className="h-[50px] w-[50px] border-none"
        radius={220}
        duration={30}
        delay={15}
        reverse
      >
        <Github className="h-full w-full" />
      </OrbitingCircles>
    </div>
  </div>
</section>

      {/* Problem Section */}
      <section className="py-20">
        <div className="container">
          <h2 className="mb-12 text-center text-3xl font-bold tracking-tighter md:text-4xl">
            The Challenge of Modern Software Development
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            {problems.map((problem, i) => (
              <div key={i} className="rounded-lg border p-6">
                <h3 className="mb-4 text-xl font-semibold">{problem.title}</h3>
                <p className="text-muted-foreground">{problem.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
{/* ... after the "Problem Section" ... */}

{/* New Features Section with Sticky Scroll */}
<section id="features" className="py-20 bg-slate-950">
    <div className="container">
         <h2 className="mb-12 text-center text-3xl font-bold tracking-tighter text-white md:text-4xl">
            Your Codebase, Supercharged
         </h2>
        <StickyScroll content={featuresContent} />
    </div>
</section>

{/* ... before the "Testimonials Section" ... */}

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20">
        <div className="container">
          <h2 className="mb-12 text-center text-3xl font-bold tracking-tighter md:text-4xl">
            Loved by Developers Worldwide
          </h2>
          <div className="relative">
            <Marquee pauseOnHover className="[--duration:60s]" repeat={100}>
              {testimonials.map((testimonial, i) => (
                <div
                  key={i}
                  className="w-80 rounded-lg border p-6"
                >
                  <div className="mb-4 flex items-center gap-4">
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="size-12 rounded-full"
                    />
                    <div>
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {testimonial.handle}
                      </p>
                    </div>
                  </div>
                  <p className="text-muted-foreground">{testimonial.comment}</p>
                </div>
              ))}
            </Marquee>
            <div className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-background"></div>
            <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-background"></div>
          </div>
        </div>
      </section>

      {/* Animated Grid Pattern */}
      <section className="py-20">
        <div className="container">
          <div className="relative flex h-96 w-full flex-col items-center justify-center overflow-hidden rounded-lg border bg-background md:shadow-xl">
            <p className="z-10 whitespace-pre-wrap text-center text-5xl font-medium tracking-tighter text-foreground">
              Your Codebase, Supercharged
            </p>
            <AnimatedGridPattern
              numSquares={30}
              maxOpacity={0.5}
              duration={3}
              repeatDelay={1}
              className={cn(
                "[mask-image:radial-gradient(ellipse_at_center,white,transparent)]",
                "inset-x-0 inset-y-[-30%] h-[200%] skew-y-12",
              )}
            />
            <IconCloud
              icons={[
                <Code key="code" className="h-10 w-10 text-primary" />,
                <GitBranch key="git" className="h-10 w-10 text-primary" />,
                <Github key="github" className="h-10 w-10 text-primary" />,
                <Bot key="bot" className="h-10 w-10 text-primary" />,
                <Zap key="zap" className="h-10 w-10 text-primary" />,
              ]}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container text-center">
          <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
            Ready to Get Started?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Sign up for a free trial and experience the future of software
            development. No credit card required.
          </p>
          <div className="mt-8">
            <ShimmerButton>
              <Link href="/dashboard">
                <span className="whitespace-pre-wrap text-center text-sm font-medium leading-none tracking-tight text-white dark:text-black lg:text-lg">
                  Start Your Free Trial
                </span>
              </Link>
            </ShimmerButton>
          </div>
        </div>
      </section>

      {/* Footer with Text Hover Effect */}
      <footer className="border-t py-12">
        <div className="container">
          <div className="flex flex-col items-center justify-center mb-8">
            {/* GIVING THE COMPONENT MORE HEIGHT */}
            <div className="h-60 w-full max-w-4xl">
              <TextHoverEffect text="GITMIND" />
            </div>
          </div>
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2">
              <Bot className="size-6" />
              <p className="text-sm font-medium">
                © {new Date().getFullYear()} GITMIND
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Link href="#" className="hover:text-foreground">
                Terms of Service
              </Link>
              <Link href="#" className="hover:text-foreground">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}