'use client';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Registered once, on the client only.
if (typeof window !== 'undefined') gsap.registerPlugin(ScrollTrigger);

export { gsap, ScrollTrigger };

/** Scroll progress of the hero, 0 to 1, written by GSAP ScrollTrigger and read every frame by the 3D scene. */
export const scrollState = { hero: 0 };

/** The pointer, from -1 to 1 across the window, so 3D scenes can react to it even under overlaid text. */
export const pointerState = { x: 0, y: 0 };
