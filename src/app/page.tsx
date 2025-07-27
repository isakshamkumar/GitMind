
"use client";
import { ArrowRight, ChevronRight, Menu, X } from 'lucide-react'
import Link from "next/link";
import React from 'react'

import { AnimatedGridPattern } from "@/components/magicui/animated-grid-pattern";
import { Marquee } from "@/components/magicui/marquee";
import { Ripple } from "@/components/magicui/ripple"; // Re-adding Ripple import
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
import { AnimatedGroup } from "@/components/ui/animated-group";
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
import { ArrowRightIcon } from "@radix-ui/react-icons";
import { useMotionValueEvent, useScroll } from "framer-motion";
import { motion } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { useInView } from "framer-motion";
import Image from 'next/image';


// --- NEW LOCAL COMPONENTS ---
interface ProblemCardProps {
    title: string;
    description: string;
}

const ProblemCard = ({ title, description }: ProblemCardProps) => {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 50 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="rounded-lg border bg-card p-6 shadow-md"
        >
            <h3 className="mb-4 text-xl font-semibold">{title}</h3>
            <p className="text-muted-foreground">{description}</p>
        </motion.div>
    );
};

// --- FIXED MARQUEE COMPONENT ---
interface MarqueeProps extends React.ComponentPropsWithoutRef<"div"> {
  className?: string;
  reverse?: boolean;
  pauseOnHover?: boolean;
  children: React.ReactNode;
  vertical?: boolean;
  repeat?: number;
}

function FixedMarquee({
  className,
  reverse = false,
  pauseOnHover = false,
  children,
  vertical = false,
  repeat = 4,
  ...props
}: MarqueeProps) {
  return (
    <div
      {...props}
      className={cn(
        "group flex overflow-hidden p-2 [--duration:20s] [--gap:1rem]",
        vertical ? "flex-col" : "flex-row",
        className,
      )}
    >
      {Array(repeat)
        .fill(0)
        .map((_, i) => (
          <div
            key={i}
            className={cn(
              "flex shrink-0 justify-around [gap:var(--gap)]",
              {
                "animate-marquee flex-row": !vertical,
                "animate-marquee-vertical flex-col": vertical,
                "group-hover:[animation-play-state:paused]": pauseOnHover,
                "[animation-direction:reverse]": reverse,
              },
            )}
          >
            {children}
          </div>
        ))}
    </div>
  );
}

// --- FIXED STICKY SCROLL COMPONENT ---
interface StickyScrollProps {
  content: {
    title: string;
    description: string;
    content?: React.ReactNode | any;
  }[];
  contentClassName?: string;
}

function FixedStickyScroll({
  content,
  contentClassName,
}: StickyScrollProps) {
  const [activeCard, setActiveCard] = React.useState(0);
  const ref = React.useRef<any>(null);
  const { scrollYProgress } = useScroll({
    container: ref,
    offset: ["start start", "end start"],
  });
  const cardLength = content.length;

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (!content || content.length === 0) {
        setActiveCard(0);
        return;
    }
    const cardsBreakpoints = content.map((_, index) => index / cardLength);
    const closestBreakpointIndex = cardsBreakpoints.reduce(
      (acc, breakpoint, index) => {
        const distance = Math.abs(latest - breakpoint);
        if (index < cardsBreakpoints.length && distance < Math.abs(latest - (cardsBreakpoints[acc] || 0))) {
          return index;
        }
        return acc;
      },
      0
    );
    setActiveCard(closestBreakpointIndex);
  });

  return (
    <motion.div
      className="relative h-screen overflow-y-auto flex justify-center space-x-10 rounded-2xl p-2 md:p-10"
      ref={ref}
    >
      <div className="div relative flex items-start px-4">
        <div className="max-w-2xl">
          {content.map((item, index) => (
            <div key={item.title + index} className="my-40">
              <motion.h2
                initial={{
                  opacity: 0,
                }}
                animate={{
                  opacity: activeCard === index ? 1 : 0.3,
                }}
                className="text-2xl font-bold text-slate-100"
              >
                {item.title}
              </motion.h2>
              <motion.p
                initial={{
                  opacity: 0,
                }}
                animate={{
                  opacity: activeCard === index ? 1 : 0.3,
                }}
                className="text-lg mt-10 max-w-sm text-slate-300"
              >
                {item.description}
              </motion.p>
            </div>
          ))}
          <div className="h-60" />
        </div>
      </div>
      <motion.div
        animate={{
          background: 'rgba(0,0,0,0.1)',
        }}
        className={cn(
          "sticky top-10 hidden h-96 w-full max-w-md overflow-hidden rounded-2xl bg-transparent lg:block",
          contentClassName
        )}
      >
        {content && content.length > 0 && content[activeCard] ? content[activeCard].content : null}
      </motion.div>
    </motion.div>
  );
}

// --- NEW COMPONENTS START ---
const menuItems = [
    { name: 'Features', href: '#features' },
    { name: 'Solution', href: '#solutions' },
    { name: 'Testimonials', href: '#testimonials' },
    { name: 'Contact', href: '#' }, // Changed to generic #
]

const Logo = ({ className }: { className?: string }) => {
    return (
        <img
            src="/logo.png"
            alt="GITMIND Logo"
            className={cn('h-5 w-auto', className)}
        />
    )
}

const HeroHeader = () => {
    const [menuState, setMenuState] = React.useState(false)
    const [isScrolled, setIsScrolled] = React.useState(false)

    React.useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])
    return (
        <header>
            <nav
                data-state={menuState && 'active'}
                className="fixed z-20 w-full px-2 group">
                <div className={cn('mx-auto mt-2 max-w-6xl px-6 transition-all duration-300 lg:px-12', isScrolled && 'bg-background/50 max-w-4xl rounded-2xl border backdrop-blur-lg lg:px-5')}>
                    <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
                        <div className="flex w-full justify-between lg:w-auto">
                            <Link
                                href="/"
                                aria-label="home"
                                className="flex items-center space-x-2">
                                <Logo />
                            </Link>

                            <button
                                onClick={() => setMenuState(!menuState)}
                                aria-label={menuState == true ? 'Close Menu' : 'Open Menu'}
                                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden">
                                <Menu className="in-data-[state=active]:rotate-180 group-data-[state=active]:scale-0 group-data-[state=active]:opacity-0 m-auto size-6 duration-200" />
                                <X className="group-data-[state=active]:rotate-0 group-data-[state=active]:scale-100 group-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200" />
                            </button>
                        </div>

                        <div className="absolute inset-0 m-auto hidden size-fit lg:block">
                            <ul className="flex gap-8 text-sm">
                                {menuItems.map((item, index) => (
                                    <li key={index}>
                                        <Link
                                            href={item.href}
                                            className="text-muted-foreground hover:text-accent-foreground block duration-150">
                                            <span>{item.name}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-background group-data-[state=active]:block lg:group-data-[state=active]:flex mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border p-6 shadow-2xl shadow-zinc-300/20 md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none dark:shadow-none dark:lg:bg-transparent">
                            <div className="lg:hidden">
                                <ul className="space-y-6 text-base">
                                    {menuItems.map((item, index) => (
                                        <li key={index}>
                                            <Link
                                                href={item.href}
                                                className="text-muted-foreground hover:text-accent-foreground block duration-150">
                                                <span>{item.name}</span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit">
                                <Button
                                    asChild
                                    variant="outline"
                                    size="sm"
                                    className={cn(isScrolled && 'lg:hidden')}>
                                    <Link href="/dashboard"> {/* Login link */}
                                        <span>Login</span>
                                    </Link>
                                </Button>
                                <Button
                                    asChild
                                    size="sm"
                                    className={cn(isScrolled && 'lg:hidden')}>
                                    <Link href="/dashboard"> {/* Sign up link */}
                                        <span>Sign Up</span>
                                    </Link>
                                </Button>
                                <Button
                                    asChild
                                    size="sm"
                                    className={cn(isScrolled ? 'lg:inline-flex' : 'hidden')}>
                                    <Link href="/dashboard"> {/* Get Started link */}
                                        <span>Get Started</span>
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
        </header>
    )
}
// --- NEW COMPONENTS END ---

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

const transitionVariants = {
    item: {
        hidden: {
            opacity: 0,
            filter: 'blur(12px)',
            y: 12,
        },
        visible: {
            opacity: 1,
            filter: 'blur(0px)',
            y: 0,
            transition: {
                type: 'spring',
                bounce: 0.3,
                duration: 1.5,
            } as any,
        },
    },
}

// Sample features content for sticky scroll
const sampleFeaturesContent = [
  {
    title: "AI Code Analysis",
    description: "Our advanced AI analyzes your entire codebase to provide instant insights, detect patterns, and suggest improvements. Get a bird's eye view of your project architecture.",
    content: (
      <div className="h-full w-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center rounded-xl">
        <div className="text-white text-center p-8">
          <Code className="mx-auto h-16 w-16 mb-4" />
          <h3 className="text-xl font-bold mb-2">Smart Analysis</h3>
          <p className="text-sm opacity-80">AI-powered code understanding</p>
        </div>
      </div>
    ),
  },
  {
    title: "Team Collaboration",
    description: "Enable seamless collaboration with shared insights, real-time discussions, and synchronized understanding across your development team.",
    content: (
      <div className="h-full w-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center rounded-xl">
        <div className="text-white text-center p-8">
          <Users className="mx-auto h-16 w-16 mb-4" />
          <h3 className="text-xl font-bold mb-2">Team Sync</h3>
          <p className="text-sm opacity-80">Collaborate like never before</p>
        </div>
      </div>
    ),
  },
  {
    title: "Instant Q&A",
    description: "Ask questions about your codebase in natural language and get immediate, contextual answers. No more searching through documentation.",
    content: (
      <div className="h-full w-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center rounded-xl">
        <div className="text-white text-center p-8">
          <MessageCircle className="mx-auto h-16 w-16 mb-4" />
          <h3 className="text-xl font-bold mb-2">Smart Q&A</h3>
          <p className="text-sm opacity-80">Get answers instantly</p>
        </div>
      </div>
    ),
  },
  {
    title: "Git Integration",
    description: "Seamlessly integrate with your Git workflow. Track changes, understand commit history, and get insights on code evolution over time.",
    content: (
      <div className="h-full w-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center rounded-xl">
        <div className="text-white text-center p-8">
          <GitBranch className="mx-auto h-16 w-16 mb-4" />
          <h3 className="text-xl font-bold mb-2">Git Integration</h3>
          <p className="text-sm opacity-80">Version control insights</p>
        </div>
      </div>
    ),
  },
];

export default function Page() {
  return (
    <div className="bg-background relative">
      {/* NEW HEADER */}
      <HeroHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <DotPattern className="absolute inset-0 opacity-20" />
        <div aria-hidden className="absolute inset-0 -z-10 size-full [background:radial-gradient(125%_125%_at_50%_100%,transparent_0%,var(--background)_75%)]" />
        <div className="container relative z-10 text-center">
          <Badge
            variant="outline"
            className="mb-6 animate-fade-in-up border-border text-base font-semibold px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white"
          >
            <Sparkles className="mr-2 size-4" />
            Introducing GITMIND
          </Badge>

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
          
          <p className="mx-auto mt-6 max-w-3xl text-lg text-muted-foreground md:text-xl">
            Your AI-powered coding companion for better code understanding and
            team collaboration.
          </p>
          <div className="mt-8 flex justify-center">
            <ShimmerButton>
              <Link
                href="/dashboard"
                className="flex items-center gap-2"
              >
                <Zap className="size-4" />
                <span className="whitespace-pre-wrap text-center text-sm font-medium leading-none tracking-tight text-black dark:text-white lg:text-lg z-10">Get Started for Free</span>
              </Link>
            </ShimmerButton>
          </div>
        </div>
      </section>

   {/* NEW: Product Image Preview Section */}
<section className="py-12">
  <div className="container">
    <div className="relative -mr-56 mt-8 overflow-hidden px-2 sm:mr-0 sm:mt-12 md:mt-20">
      <div
        aria-hidden
        className="bg-gradient-to-b to-background absolute inset-0 z-10 from-transparent from-35%"
      />
      <div className="inset-shadow-2xs ring-background dark:inset-shadow-white/20 bg-background relative mx-auto max-w-6xl overflow-hidden rounded-2xl border p-4 shadow-lg shadow-zinc-950/15 ring-1">
        <Image
          className="bg-background aspect-15/8 relative hidden rounded-2xl dark:block"
          src="/landing-assistant.png"
          alt="app screen"
          width="2700"
          height="1440"
        />
        <Image
          className="z-2 border-border/25 aspect-15/8 relative rounded-2xl border dark:hidden"
          src="/landing-assistant.png"
          alt="app screen"
          width="2700"
          height="1440"
        />
      </div>
    </div>
  </div>
</section>

      {/* Problem Section */}
      <section className="py-20 relative">
        <DotPattern className="absolute inset-0 opacity-20" />
        <div className="container relative z-10">
          <h2 className="mb-12 text-center text-3xl font-bold tracking-tighter md:text-4xl">
            The Challenge of Modern Software Development
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            {problems.map((problem, i) => (
              <ProblemCard key={i} title={problem.title} description={problem.description} />
            ))}
          </div>
        </div>
      </section>

{/* Fixed Features Section with Sticky Scroll */}
<section id="features" className="py-20 bg-slate-950 relative">
    <DotPattern className="absolute inset-0 opacity-20" />
    <div className="container relative z-10">
         <h2 className="mb-12 text-center text-3xl font-bold tracking-tighter text-white md:text-4xl">
            Your Codebase, Supercharged
         </h2>
        <FixedStickyScroll content={sampleFeaturesContent} />
    </div>
</section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 relative">
        <DotPattern className="absolute inset-0 opacity-20" />
        <div className="container relative z-10">
          <h2 className="mb-12 text-center text-3xl font-bold tracking-tighter md:text-4xl">
            Loved by Developers Worldwide
          </h2>
          <div className="relative">
            <FixedMarquee pauseOnHover className="[--duration:20s] [--gap:2rem]" repeat={10}>
              {testimonials.map((testimonial, i) => (
                <div
                  key={i}
                  className="w-80 rounded-lg border p-6 shrink-0"
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
            </FixedMarquee>
            <div className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-background"></div>
            <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-background"></div>
          </div>
        </div>
      </section>

      {/* Animated Grid Pattern */}
      <section className="py-20 relative">
        <DotPattern className="absolute inset-0 opacity-20" />
        <div className="container relative z-10">
          <div className="relative flex h-96 w-full flex-col items-center justify-center overflow-hidden rounded-lg border bg-background md:shadow-xl">
            <p className="z-10 whitespace-pre-wrap text-center text-5xl font-medium tracking-tighter text-foreground relative">
              Your Codebase, Supercharged
            </p>
            <AnimatedGridPattern
              numSquares={30}
              maxOpacity={0.5}
              duration={3}
              repeatDelay={1}
              className={cn(
                "[mask-image:radial-gradient(ellipse_at_center,white,transparent)]",
                "absolute inset-0 h-full w-full",
              )}
            />
            <div className="absolute inset-0 flex items-center justify-center">
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