# portfolio website

Design a futuristic, immersive, and premium portfolio website for a skilled developer.

The visual aesthetic must reflect the style, colors, glow, and modern elegance of the attached image named reference.

Use cutting-edge tools:

GSAP for powerful animation

Locomotive Scroll for smooth parallax scrolling

Spline for 3D integration in the hero section

Site must be fully responsive across all devices.

🔄 GSAP Loading Animation & Progress Bar (New)

Add a modern, cinematic loading animation before the main content appears:

Fullscreen preloader screen with a centered animated logo or text (e.g., "Piyush")

Include a progress bar that fills from 0% to 100% using GSAP

After loading completes:

Progress bar fades out

Preloader scales and fades away

Main content fades in with smooth transitions

Example animation flow (GSAP):

js

Copy

Edit

gsap.to(".progress-bar", {

  width: "100%",

  duration: 2,

  ease: "power2.out",

  onComplete: () => {

    gsap.to(".preloader", {

      opacity: 0,

      scale: 0.9,

      duration: 1,

      onComplete: () => {

        document.querySelector(".preloader").style.display = "none";

      }

    });

  }

});

The loading sequence should set the tone: techy, smooth, and premium.

📄 Pages & Sections

1. Homepage / Hero Section

Large animated headline: “Hi, I’m Piyush – Video Editor”

Subtitle + glowing “Hire Me” CTA button

Background:

Fullscreen Spline 3D model use this embed:

(<iframe src='https://my.spline.design/particles-i3uwyTz8blbIRzC0mPI5UkN6/' frameborder='0' width='100%' height='100%'></iframe> )

Floating neon orbs that scroll subtly

GSAP Animations:

Headline: opacity 0 → 1, y: 50 → 0, blur: 10px → 0

CTA: scale pulse on hover

Spline fades in from right

Background glow elements float using yoyo & repeat

2. About Section

Left: Profile image in glowing circular frame (lift/rotate on hover)

Right: Short bio + grid of skill icons (video editing, motion graphics, sound design, color grading, visual storytelling )

Use Phosphor Icons (light style)

GSAP:

Section fade + blur-clear

Image enters from left

Icons appear staggered

3. Projects Section

Horizontal bento-style scrollable layout

6 glassmorphic project cards:

Attached images project-1 to project-6, title, short description

Tech stack icons, glowing CTA

On hover: cards lift and glow

GSAP + ScrollTrigger:

Cards fade/scale/y position with stagger

Mobile: stack cards and make slider swipeable

4. Contact Section

Form: Name, Email, Message

Submit button: hover glow + scale bounce on send

Social icons (GitHub, LinkedIn)

Glassmorphic inputs with glowing focus

GSAP:

Inputs fade from left

Submit pulses

Icons glow on hover

5. Footer Section

Mini nav links + social icons

Background: glowing floating particles

GSAP: fade + slide-up (y: 60 → 0, blur → 0)

📱 Responsive Behavior

Hero/About stack vertically on small screens

Nav becomes hamburger with full-screen slide tray

Spline model and profile image scale to fit

Projects slider becomes swipeable

⚙️ Animation Strategy

GSAP ScrollTrigger for scroll-based animation

Locomotive Scroll for parallax and smooth scroll

GSAP Timelines for chaining animations

Use:

from(), fromTo(), stagger

blur-to-clear, opacity 0 → 1, y 40 → 0

Floating background elements using:

js

Copy

Edit

gsap.to(".glow-orb", {

  y: -20,

  duration: 3,

  repeat: -1,

  yoyo: true,

  ease: "power1.inOut"

});

🧠 Design System

Font: Inter (light, tight spacing)

Icons: Phosphor (light)

Text: Bold headings, semi-transparent body

Cards: Glassmorphic, blurred backgrounds

Buttons: Neumorphic glow

Colors: Blues, violets, neons, gradients

Effects: Soft shadows, glowing blur, floating visuals

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://ova-gallery.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/98bc422c-d91a-46a8-b749-1cfba9b71418).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
