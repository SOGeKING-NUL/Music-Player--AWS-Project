"use client";
import { cn } from "@/lib/utils";
import { IconLayoutNavbarCollapse } from "@tabler/icons-react";
import {
  AnimatePresence,
  MotionValue,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import { useRef, useState } from "react";

export const FloatingDock = ({
  items,
  desktopClassName,
  mobileClassName,
  children,
}: {
  items: { title: string; icon: React.ReactNode; href?: string; onClick?: () => void }[];
  desktopClassName?: string;
  mobileClassName?: string;
  children?: React.ReactNode;
}) => {
  return (
    <>
      <FloatingDockDesktop items={items} className={desktopClassName}>
        {children}
      </FloatingDockDesktop>
      <FloatingDockMobile items={items} className={mobileClassName}>
        {children}
      </FloatingDockMobile>
    </>
  );
};

const FloatingDockMobile = ({
  items,
  className,
  children,
}: {
  items: { title: string; icon: React.ReactNode; href?: string; onClick?: () => void }[];
  className?: string;
  children?: React.ReactNode;
}) => {
  const [open, setOpen] = useState(false);
  return (
    <div className={cn("relative block md:hidden", className)}>
      <AnimatePresence>
        {open && (
          <motion.div
            layoutId="nav"
            className="absolute inset-x-0 bottom-full mb-2 flex flex-col gap-2"
          >
            {items.map((item, idx) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  y: 10,
                  transition: {
                    delay: idx * 0.05,
                  },
                }}
                transition={{ delay: (items.length - 1 - idx) * 0.05 }}
              >
                {item.href ? (
                  <a
                    href={item.href}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-black shadow-md border border-neutral-800 text-white"
                  >
                    <div className="h-4 w-4">{item.icon}</div>
                  </a>
                ) : (
                  <button
                    onClick={item.onClick}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-black shadow-md border border-neutral-800 text-white"
                  >
                    <div className="h-4 w-4">{item.icon}</div>
                  </button>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex items-center gap-2">
        {children}
        <button
          onClick={() => setOpen(!open)}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-black shadow-lg border border-neutral-800 text-white"
        >
          <IconLayoutNavbarCollapse className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

const FloatingDockDesktop = ({
  items,
  className,
  children,
}: {
  items: { title: string; icon: React.ReactNode; href?: string; onClick?: () => void }[];
  className?: string;
  children?: React.ReactNode;
}) => {
  let mouseX = useMotionValue(Infinity);
  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className={cn(
        "mx-auto hidden h-16 items-end gap-3 rounded-full bg-white/30 backdrop-blur-3xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.1)] px-4 pb-2 pt-2 md:flex",
        className,
      )}
    >
      {/* Player Section / Additional nodes rendered inside the dock */}
      {children && (
        <div 
          className="flex items-center h-full border-r border-black/10 pr-4 mr-1"
          onMouseMove={(e) => {
            e.stopPropagation();
            mouseX.set(Infinity);
          }}
        >
          {children}
        </div>
      )}

      {/* Dock Icons */}
      {items.map((item) => (
        <IconContainer mouseX={mouseX} key={item.title} {...item} />
      ))}
    </motion.div>
  );
};

function IconContainer({
  mouseX,
  title,
  icon,
  href,
  onClick,
}: {
  mouseX: MotionValue;
  title: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
}) {
  let ref = useRef<HTMLButtonElement & HTMLAnchorElement>(null);

  let distance = useTransform(mouseX, (val) => {
    let bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  let widthTransform = useTransform(distance, [-150, 0, 150], [48, 80, 48]);
  let heightTransform = useTransform(distance, [-150, 0, 150], [48, 80, 48]);

  let widthTransformIcon = useTransform(distance, [-150, 0, 150], [24, 40, 24]);
  let heightTransformIcon = useTransform(
    distance,
    [-150, 0, 150],
    [24, 40, 24],
  );

  let width = useSpring(widthTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });
  let height = useSpring(heightTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  let widthIcon = useSpring(widthTransformIcon, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });
  let heightIcon = useSpring(heightTransformIcon, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  const [hovered, setHovered] = useState(false);

  // Cast refs to any to avoid TypeScript complaints with dynamic element rendering
  const isLink = Boolean(href);

  return (
    <>
      {isLink ? (
        <a href={href!} ref={ref as any}>
          <motion.div
            style={{ width, height }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className="relative flex aspect-square items-center justify-center rounded-full bg-black shadow-lg text-white group"
          >
            <AnimatePresence>
              {hovered && (
                <motion.div
                  initial={{ opacity: 0, y: 10, x: "-50%" }}
                  animate={{ opacity: 1, y: 0, x: "-50%" }}
                  exit={{ opacity: 0, y: 2, x: "-50%" }}
                  className="absolute -top-10 left-1/2 w-fit rounded-lg border border-black/10 bg-white/90 backdrop-blur-md px-3 py-1.5 text-xs font-bold text-black drop-shadow-md whitespace-nowrap z-50 pointer-events-none"
                >
                  {title}
                </motion.div>
              )}
            </AnimatePresence>
            <motion.div
              style={{ width: widthIcon, height: heightIcon }}
              className="flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity"
            >
              {icon}
            </motion.div>
          </motion.div>
        </a>
      ) : (
        <button onClick={onClick} ref={ref as any}>
          <motion.div
            style={{ width, height }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className="relative flex aspect-square items-center justify-center rounded-full bg-black shadow-lg text-white group"
          >
            <AnimatePresence>
              {hovered && (
                <motion.div
                  initial={{ opacity: 0, y: 10, x: "-50%" }}
                  animate={{ opacity: 1, y: 0, x: "-50%" }}
                  exit={{ opacity: 0, y: 2, x: "-50%" }}
                  className="absolute -top-10 left-1/2 w-fit rounded-lg border border-black/10 bg-white/90 backdrop-blur-md px-3 py-1.5 text-xs font-bold text-black drop-shadow-md whitespace-nowrap z-50 pointer-events-none"
                >
                  {title}
                </motion.div>
              )}
            </AnimatePresence>
            <motion.div
              style={{ width: widthIcon, height: heightIcon }}
              className="flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity"
            >
              {icon}
            </motion.div>
          </motion.div>
        </button>
      )}
    </>
  );
}
