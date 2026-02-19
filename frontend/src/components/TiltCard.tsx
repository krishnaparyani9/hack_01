import React, { useMemo, useRef } from "react";

type Props = {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  tiltMaxDeg?: number;
};

export default function TiltCard({ children, className, as: Tag = "div", tiltMaxDeg = 8 }: Props) {
  const ref = useRef<HTMLElement | null>(null);

  const handlers = useMemo(
    () => ({
      onMouseMove: (e: React.MouseEvent) => {
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width;
        const py = (e.clientY - rect.top) / rect.height;
        const ry = (px - 0.5) * tiltMaxDeg;
        const rx = (0.5 - py) * tiltMaxDeg;
        el.style.setProperty("--tilt-rx", `${rx.toFixed(2)}deg`);
        el.style.setProperty("--tilt-ry", `${ry.toFixed(2)}deg`);
      },
      onMouseLeave: () => {
        const el = ref.current;
        if (!el) return;
        el.style.setProperty("--tilt-rx", "0deg");
        el.style.setProperty("--tilt-ry", "0deg");
      },
    }),
    [tiltMaxDeg]
  );

  return (
    <Tag ref={ref as any} className={`tilt-card ${className || ""}`} {...handlers}>
      {children}
    </Tag>
  );
}
