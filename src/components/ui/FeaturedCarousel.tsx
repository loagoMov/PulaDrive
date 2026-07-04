"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useAnimationFrame, useMotionValue } from "framer-motion";
import CarCard from "./CarCard";

export default function FeaturedCarousel({ cars }: { cars: any[] }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const [mouseDistance, setMouseDistance] = useState(500);
    const [isDragging, setIsDragging] = useState(false);
    const x = useMotionValue(0);
    const [contentWidth, setContentWidth] = useState(0);

    // Calculate the width of one set of cards
    useEffect(() => {
        const updateWidth = () => {
            if (contentRef.current) {
                // Since we duplicate the array exactly once, the width of one set is half the total scrollWidth
                // This relies on the gap being consistent.
                setContentWidth(contentRef.current.scrollWidth / 2);
            }
        };

        updateWidth();
        window.addEventListener("resize", updateWidth);
        return () => window.removeEventListener("resize", updateWidth);
    }, [cars]);

    // Track mouse distance to the container
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            
            // Calculate shortest distance from mouse to the bounding box of the carousel
            const dx = Math.max(rect.left - e.clientX, 0, e.clientX - rect.right);
            const dy = Math.max(rect.top - e.clientY, 0, e.clientY - rect.bottom);
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            setMouseDistance(distance);
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    useAnimationFrame((t, delta) => {
        if (!contentWidth) return;

        // Map distance (0 to 500px) to a speed factor (0.1 to 1)
        const distanceFactor = Math.min(Math.max(mouseDistance / 500, 0.1), 1);
        
        // Base velocity: increased to be a tad bit faster
        const baseVelocity = -1.2; 
        
        let newX = x.get();

        if (!isDragging) {
            const moveBy = baseVelocity * (delta / 16) * distanceFactor;
            newX += moveBy;
        }

        // Wrap around for infinite scroll effect
        if (newX <= -contentWidth) {
            newX += contentWidth;
        } else if (newX > 0) {
            newX -= contentWidth;
        }

        if (!isDragging) {
            x.set(newX);
        }
    });

    if (!cars || cars.length === 0) return null;

    // Duplicate the cars array to allow seamless infinite scrolling
    const displayCars = [...cars, ...cars];

    return (
        <div ref={containerRef} className="overflow-hidden w-full relative group">
            <motion.div 
                ref={contentRef}
                className="flex gap-6 w-max py-4 px-4 sm:px-0 cursor-grab active:cursor-grabbing"
                style={{ x }}
                drag="x"
                onDragStart={() => setIsDragging(true)}
                onDragEnd={() => {
                    setIsDragging(false);
                    // Ensure wrapping happens if dragged out of bounds
                    let currentX = x.get();
                    if (currentX <= -contentWidth) currentX += contentWidth;
                    else if (currentX > 0) currentX -= contentWidth;
                    x.set(currentX);
                }}
                onWheel={(e) => {
                    if (!contentWidth) return;
                    const delta = e.deltaX !== 0 ? e.deltaX : e.deltaY;
                    let newX = x.get() - delta;
                    if (newX <= -contentWidth) newX += contentWidth;
                    else if (newX > 0) newX -= contentWidth;
                    x.set(newX);
                }}
            >
                {displayCars.map((car, index) => (
                    <div key={`${car._id}-${index}`} className="flex-none w-[280px] sm:w-[320px]">
                        <CarCard car={car} priority={index === 0} />
                    </div>
                ))}
            </motion.div>
        </div>
    );
}
