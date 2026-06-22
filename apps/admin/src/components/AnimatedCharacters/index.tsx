import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import "./index.less";

/* ─── Character Config ────────────────────────────────────────────────── */

interface CharConfig {
  id: string;
  color: string;
  width: number;
  height: number;
  borderRadius: string;
  /** px from left of stage */
  left: number;
  /** px from bottom of stage */
  bottom: number;
  hasEyeballs: boolean;
  blinkEnabled: boolean;
  hasMouth: boolean;
  /** Pupil max orbit radius (px) */
  pupilMaxDist: number;
  /** Body skew sensitivity */
  skewFactor: number;
  faceDefault: { left: number; top: number };
  eyeGap: number;
  eyeSize: number;
  pupilSize: number;
}

const CHARS: CharConfig[] = [
  {
    id: "purple", color: "#6C3FF5", width: 180, height: 400,
    borderRadius: "10px", left: 70, bottom: 0,
    hasEyeballs: true, blinkEnabled: true, hasMouth: false,
    pupilMaxDist: 6, skewFactor: 8,
    faceDefault: { left: 45, top: 150 },
    eyeGap: 32, eyeSize: 18, pupilSize: 7,
  },
  {
    id: "charcoal", color: "#2D2D2D", width: 120, height: 310,
    borderRadius: "8px", left: 240, bottom: 20,
    hasEyeballs: true, blinkEnabled: true, hasMouth: false,
    pupilMaxDist: 4, skewFactor: 6,
    faceDefault: { left: 26, top: 100 },
    eyeGap: 24, eyeSize: 16, pupilSize: 6,
  },
  {
    id: "orange", color: "#FF9B6B", width: 240, height: 200,
    borderRadius: "120px/120px 0 0", left: 20, bottom: 0,
    hasEyeballs: false, blinkEnabled: false, hasMouth: false,
    pupilMaxDist: 5, skewFactor: 4,
    faceDefault: { left: 82, top: 85 },
    eyeGap: 32, eyeSize: 12, pupilSize: 12,
  },
  {
    id: "yellow", color: "#E8D754", width: 140, height: 230,
    borderRadius: "70px/70px 0 0", left: 370, bottom: 10,
    hasEyeballs: false, blinkEnabled: false, hasMouth: true,
    pupilMaxDist: 5, skewFactor: 5,
    faceDefault: { left: 52, top: 75 },
    eyeGap: 24, eyeSize: 12, pupilSize: 12,
  },
];

/* ─── Face Default Positions Map ──────────────────────────────────────── */

const FACE_DEFAULTS: Record<string, { left: number; top: number }> = {};
CHARS.forEach(c => { FACE_DEFAULTS[c.id] = c.faceDefault; });

/* ─── Props ────────────────────────────────────────────────────────────── */

interface AnimatedCharactersProps {
  isTyping?: boolean;
  showPassword?: boolean;
  passwordLength?: number;
}

/* ─── QuickTo Map Type ────────────────────────────────────────────────── */

interface QuickToMap {
  bodySkew: Record<string, ReturnType<typeof gsap.quickTo>>;
  bodyX: Record<string, ReturnType<typeof gsap.quickTo>>;
  bodyHeight: Record<string, ReturnType<typeof gsap.quickTo>>;
  faceLeft: Record<string, ReturnType<typeof gsap.quickTo>>;
  faceTop: Record<string, ReturnType<typeof gsap.quickTo>>;
  faceX: Record<string, ReturnType<typeof gsap.quickTo>>;
  faceY: Record<string, ReturnType<typeof gsap.quickTo>>;
  mouthX: Record<string, ReturnType<typeof gsap.quickTo>>;
  mouthY: Record<string, ReturnType<typeof gsap.quickTo>>;
}

/* ─── Component ────────────────────────────────────────────────────────── */

const AnimatedCharacters: React.FC<AnimatedCharactersProps> = ({
  isTyping = false,
  showPassword = false,
  passwordLength = 0,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef(0);

  // DOM refs
  const bodyRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const faceRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const mouthRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // GSAP quickTo setter functions
  const qt = useRef<QuickToMap>({
    bodySkew: {}, bodyX: {}, bodyHeight: {},
    faceLeft: {}, faceTop: {}, faceX: {}, faceY: {},
    mouthX: {}, mouthY: {},
  });

  // Blink / peek timers
  const blinkTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const peekTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lookingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // State snapshots for RAF
  const isHiding = passwordLength > 0 && !showPassword;
  const isShowing = passwordLength > 0 && showPassword;
  const isLookingRef = useRef(false);
  const stateRef = useRef({ isTyping, isHiding, isShowing, isLooking: false });
  stateRef.current = {
    isTyping, isHiding, isShowing,
    isLooking: isLookingRef.current,
  };

  /* ─── Setup GSAP quickTo (after DOM ready) ──────────────────── */

  useGSAP(() => {
    CHARS.forEach((char) => {
      const body = bodyRefs.current[char.id];
      const face = faceRefs.current[char.id];
      if (!body || !face) return;

      qt.current.bodySkew[char.id] = gsap.quickTo(body, "skewX", {
        duration: 0.3, ease: "power2.out",
      });
      qt.current.bodyX[char.id] = gsap.quickTo(body, "x", {
        duration: 0.3, ease: "power2.out",
      });
      qt.current.bodyHeight[char.id] = gsap.quickTo(body, "height", {
        duration: 0.3, ease: "power2.out",
      });

      if (char.hasEyeballs) {
        // Purple & Charcoal: use CSS left/top for face positioning
        qt.current.faceLeft[char.id] = gsap.quickTo(face, "left", {
          duration: 0.3, ease: "power2.out",
        });
        qt.current.faceTop[char.id] = gsap.quickTo(face, "top", {
          duration: 0.3, ease: "power2.out",
        });
      } else {
        // Orange & Yellow: use transform translate for face
        qt.current.faceX[char.id] = gsap.quickTo(face, "x", {
          duration: 0.2, ease: "power2.out",
        });
        qt.current.faceY[char.id] = gsap.quickTo(face, "y", {
          duration: 0.2, ease: "power2.out",
        });
      }

      if (char.hasMouth) {
        const mouth = mouthRefs.current[char.id];
        if (mouth) {
          qt.current.mouthX[char.id] = gsap.quickTo(mouth, "x", {
            duration: 0.2, ease: "power2.out",
          });
          qt.current.mouthY[char.id] = gsap.quickTo(mouth, "y", {
            duration: 0.2, ease: "power2.out",
          });
        }
      }
    });
  }, { scope: containerRef });

  /* ─── Coordinate helpers ────────────────────────────────────── */

  const calcPos = (el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 3;
    const dx = mouseRef.current.x - cx;
    const dy = mouseRef.current.y - cy;
    return {
      faceX: Math.max(-15, Math.min(15, dx / 20)),
      faceY: Math.max(-10, Math.min(10, dy / 30)),
      bodySkew: Math.max(-6, Math.min(6, -dx / 120)),
    };
  };

  const calcEyePos = (el: HTMLElement, maxDist: number) => {
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dx = mouseRef.current.x - cx;
    const dy = mouseRef.current.y - cy;
    const dist = Math.min(Math.sqrt(dx * dx + dy * dy), maxDist);
    const angle = Math.atan2(dy, dx);
    return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist };
  };

  /* ─── RAF Tick ───────────────────────────────────────────────── */

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", onMove, { passive: true });

    const tick = () => {
      const container = containerRef.current;
      if (!container) return;

      const { isTyping: typing, isHiding: hiding, isShowing: showing, isLooking: looking } = stateRef.current;

      /* ── Bodies & Faces (only when not showing password) ─── */

      if (!showing) {
        CHARS.forEach((char) => {
          const body = bodyRefs.current[char.id];
          const face = faceRefs.current[char.id];
          if (!body || !face) return;

          const pos = calcPos(body);

          if (char.id === "purple") {
            // Purple — extra tilt & stretch when typing or hiding
            if (typing || hiding) {
              qt.current.bodySkew["purple"](pos.bodySkew - 12);
              qt.current.bodyX["purple"](40);
              qt.current.bodyHeight["purple"](440);
            } else {
              qt.current.bodySkew["purple"](pos.bodySkew);
              qt.current.bodyX["purple"](0);
              qt.current.bodyHeight["purple"](400);
            }

            // Face left/top — apply mouse offset from default
            const fL = qt.current.faceLeft["purple"];
            const fT = qt.current.faceTop["purple"];
            if (fL && fT) {
              if (looking) {
                // Looking at each other — fixed position
                fL(55);
                fT(65);
              } else {
                // Mouse tracking with offset from default
                const faceXL = pos.faceX >= 0 ? Math.min(25, pos.faceX * 1.5) : pos.faceX;
                fL(FACE_DEFAULTS.purple.left + faceXL);
                fT(FACE_DEFAULTS.purple.top + pos.faceY);
              }
            }
          } else if (char.id === "charcoal") {
            // Charcoal — extra lean when looking
            if (looking) {
              qt.current.bodySkew["charcoal"](pos.bodySkew * 1.5 + 10);
              qt.current.bodyX["charcoal"](20);
            } else if (typing || hiding) {
              qt.current.bodySkew["charcoal"](pos.bodySkew * 1.5);
              qt.current.bodyX["charcoal"](0);
            } else {
              qt.current.bodySkew["charcoal"](pos.bodySkew);
              qt.current.bodyX["charcoal"](0);
            }

            const fL = qt.current.faceLeft["charcoal"];
            const fT = qt.current.faceTop["charcoal"];
            if (fL && fT) {
              if (looking) {
                fL(32);
                fT(12);
              } else {
                fL(FACE_DEFAULTS.charcoal.left + pos.faceX);
                fT(FACE_DEFAULTS.charcoal.top + pos.faceY);
              }
            }
          } else {
            // Orange & Yellow — just body skew
            qt.current.bodySkew[char.id](pos.bodySkew);

            // Face via transform
            const fX = qt.current.faceX[char.id];
            const fY = qt.current.faceY[char.id];
            if (fX && fY) {
              fX(pos.faceX);
              fY(pos.faceY);
            }

            // Mouth follows face
            const mX = qt.current.mouthX[char.id];
            const mY = qt.current.mouthY[char.id];
            if (mX && mY) {
              mX(pos.faceX);
              mY(pos.faceY);
            }
          }
        });

        /* ── Pupils ──────────────────────────────────────────── */

        CHARS.forEach((char) => {
          const body = bodyRefs.current[char.id];
          if (!body) return;

          if (char.hasEyeballs) {
            // Eyeball inner pupils via class query
            const innerPupils = body.querySelectorAll<HTMLElement>(".al-char__inner-pupil");
            innerPupils.forEach((p) => {
              const maxDist = Number(p.dataset.maxDist) || char.pupilMaxDist;
              const ePos = calcEyePos(p, maxDist);
              gsap.set(p, { x: ePos.x, y: ePos.y });
            });
          } else {
            // Bare pupils
            const barePupils = body.querySelectorAll<HTMLElement>(".al-char__bare-pupil");
            barePupils.forEach((p) => {
              const maxDist = Number(p.dataset.maxDist) || char.pupilMaxDist;
              const ePos = calcEyePos(p, maxDist);
              gsap.set(p, { x: ePos.x, y: ePos.y });
            });
          }
        });
      } else {
        // When showing password — reset all body to neutral
        CHARS.forEach((char) => {
          if (qt.current.bodySkew[char.id]) qt.current.bodySkew[char.id](0);
          if (qt.current.bodyX[char.id]) qt.current.bodyX[char.id](0);
          if (qt.current.bodyHeight[char.id]) qt.current.bodyHeight[char.id](char.height);
        });
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  /* ─── Blinking (purple & charcoal) ──────────────────────────── */

  const scheduleBlink = (charId: string) => {
    const delay = 3000 + Math.random() * 4000;
    const timer = setTimeout(() => {
      const body = bodyRefs.current[charId];
      if (!body) { scheduleBlink(charId); return; }
      const eyeballs = body.querySelectorAll<HTMLElement>(".al-char__eyeball");
      if (!eyeballs.length) { scheduleBlink(charId); return; }

      eyeballs.forEach((eb) => {
        gsap.to(eb, { height: 2, duration: 0.08, ease: "power2.in" });
      });
      setTimeout(() => {
        eyeballs.forEach((eb) => {
          const size = Number(eb.style.width.replace("px", "")) || 18;
          gsap.to(eb, { height: size, duration: 0.08, ease: "power2.out" });
        });
        scheduleBlink(charId);
      }, 150);
    }, delay);
    blinkTimers.current.push(timer);
  };

  useEffect(() => {
    CHARS.filter((c) => c.blinkEnabled).forEach((c) => scheduleBlink(c.id));
    return () => {
      blinkTimers.current.forEach(clearTimeout);
      blinkTimers.current = [];
    };
  }, []);

  /* ─── Typing → Look at each other (800ms) ───────────────────── */

  useEffect(() => {
    if (isTyping && !isShowing) {
      isLookingRef.current = true;
      stateRef.current.isLooking = true;

      if (lookingTimer.current) clearTimeout(lookingTimer.current);
      lookingTimer.current = setTimeout(() => {
        isLookingRef.current = false;
        stateRef.current.isLooking = false;

        // Reset purple & charcoal pupils after looking
        const pBody = bodyRefs.current.purple;
        const cBody = bodyRefs.current.charcoal;
        if (pBody) {
          pBody.querySelectorAll<HTMLElement>(".al-char__inner-pupil").forEach((p) => {
            gsap.killTweensOf(p);
          });
        }
        if (cBody) {
          cBody.querySelectorAll<HTMLElement>(".al-char__inner-pupil").forEach((p) => {
            gsap.killTweensOf(p);
          });
        }
      }, 800);
    } else {
      isLookingRef.current = false;
      stateRef.current.isLooking = false;
      if (lookingTimer.current) clearTimeout(lookingTimer.current);
    }
    return () => {
      if (lookingTimer.current) clearTimeout(lookingTimer.current);
    };
  }, [isTyping, isShowing]);

  /* ─── Hiding password → purple pupils down ─────────────────── */

  useEffect(() => {
    if (!isHiding) return;

    CHARS.forEach((char) => {
      const body = bodyRefs.current[char.id];
      if (!body) return;
      const allPupils = body.querySelectorAll<HTMLElement>(
        char.hasEyeballs ? ".al-char__inner-pupil" : ".al-char__bare-pupil"
      );
      allPupils.forEach((p) => {
        gsap.to(p, { x: -4, y: -4, duration: 0.2, ease: "power2.out", overwrite: "auto" });
      });
    });
  }, [isHiding]);

  /* ─── Showing password → look away + purple peek ───────────── */

  useEffect(() => {
    if (peekTimer.current) { clearTimeout(peekTimer.current); peekTimer.current = null; }

    if (isShowing) {
      // Apply "look away" positions via quickTo
      if (qt.current.faceLeft["purple"]) qt.current.faceLeft["purple"](20);
      if (qt.current.faceTop["purple"]) qt.current.faceTop["purple"](35);
      if (qt.current.faceLeft["charcoal"]) qt.current.faceLeft["charcoal"](10);
      if (qt.current.faceTop["charcoal"]) qt.current.faceTop["charcoal"](28);
      if (qt.current.faceX["orange"]) qt.current.faceX["orange"](50 - (FACE_DEFAULTS.orange?.left || 82));
      if (qt.current.faceY["orange"]) qt.current.faceY["orange"](85 - (FACE_DEFAULTS.orange?.top || 90));
      if (qt.current.faceX["yellow"]) qt.current.faceX["yellow"](20 - (FACE_DEFAULTS.yellow?.left || 52));
      if (qt.current.faceY["yellow"]) qt.current.faceY["yellow"](35 - (FACE_DEFAULTS.yellow?.top || 40));
      if (qt.current.mouthX["yellow"]) qt.current.mouthX["yellow"](10 - (FACE_DEFAULTS.yellow?.left || 52));
      if (qt.current.mouthY["yellow"]) qt.current.mouthY["yellow"](0);

      // Move all pupils to (-4, -4)
      CHARS.forEach((char) => {
        const body = bodyRefs.current[char.id];
        if (!body) return;
        const selector = char.hasEyeballs ? ".al-char__inner-pupil" : ".al-char__bare-pupil";
        body.querySelectorAll<HTMLElement>(selector).forEach((p) => {
          gsap.to(p, { x: -4, y: -4, duration: 0.3, ease: "power2.out", overwrite: "auto" });
        });
      });

      // Purple peek cycle
      const doPeek = () => {
        if (!isShowing) return;
        const pBody = bodyRefs.current.purple;
        if (!pBody) return;
        const purplePupils = pBody.querySelectorAll<HTMLElement>(".al-char__inner-pupil");
        if (!purplePupils.length) return;

        // Peek inward
        if (qt.current.faceLeft["purple"]) qt.current.faceLeft["purple"](20);
        if (qt.current.faceTop["purple"]) qt.current.faceTop["purple"](35);
        purplePupils.forEach((p) => {
          gsap.to(p, { x: 4, y: 5, duration: 0.3, ease: "power2.out", overwrite: "auto" });
        });

        // After dwell, look away again
        setTimeout(() => {
          if (!isShowing) return;
          purplePupils.forEach((p) => {
            gsap.to(p, { x: -4, y: -4, duration: 0.3, ease: "power2.out", overwrite: "auto" });
          });
          // Schedule next peek
          const nextDelay = 2000 + Math.random() * 3000;
          peekTimer.current = setTimeout(doPeek, nextDelay);
        }, 800);
      };

      const firstDelay = 2000 + Math.random() * 3000;
      peekTimer.current = setTimeout(doPeek, firstDelay);
    }

    return () => {
      if (peekTimer.current) { clearTimeout(peekTimer.current); peekTimer.current = null; }
    };
  }, [isShowing]);

  /* ─── Render ────────────────────────────────────────────────── */

  const renderChar = (char: CharConfig) => {
    const fd = char.faceDefault;

    if (char.hasEyeballs) {
      return (
        <div
          key={char.id}
          className="al-char"
          ref={(el) => { bodyRefs.current[char.id] = el; }}
          style={{
            position: "absolute",
            width: char.width,
            height: char.height,
            borderRadius: char.borderRadius,
            backgroundColor: char.color,
            left: char.left,
            bottom: char.bottom,
            transformOrigin: "bottom center",
            willChange: "transform",
          }}
        >
          <div
            className="al-char__face"
            ref={(el) => { faceRefs.current[char.id] = el; }}
            style={{
              position: "absolute",
              display: "flex",
              gap: char.eyeGap,
              left: fd.left,
              top: fd.top,
              willChange: "left, top",
            }}
          >
            {[0, 1].map((i) => (
              <div
                key={i}
                className="al-char__eyeball"
                style={{
                  width: char.eyeSize,
                  height: char.eyeSize,
                  borderRadius: "50%",
                  backgroundColor: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  willChange: "height",
                }}
              >
                <div
                  className="al-char__inner-pupil"
                  data-max-dist={char.pupilMaxDist}
                  style={{
                    width: char.pupilSize,
                    height: char.pupilSize,
                    borderRadius: "50%",
                    backgroundColor: "#2D2D2D",
                    willChange: "transform",
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Orange & Yellow (bare pupils)
    return (
      <div
        key={char.id}
        className="al-char"
        ref={(el) => { bodyRefs.current[char.id] = el; }}
        style={{
          position: "absolute",
          width: char.width,
          height: char.height,
          borderRadius: char.borderRadius,
          backgroundColor: char.color,
          left: char.left,
          bottom: char.bottom,
          transformOrigin: "bottom center",
          willChange: "transform",
        }}
      >
        <div
          className="al-char__face"
          ref={(el) => { faceRefs.current[char.id] = el; }}
          style={{
            position: "absolute",
            display: "flex",
            gap: char.eyeGap,
            left: fd.left,
            top: fd.top,
            willChange: "transform",
          }}
        >
          {[0, 1].map((i) => (
            <div
              key={i}
              className="al-char__bare-pupil"
              data-max-dist={char.pupilMaxDist}
              style={{
                width: char.pupilSize,
                height: char.pupilSize,
                borderRadius: "50%",
                backgroundColor: "#2D2D2D",
                willChange: "transform",
              }}
            />
          ))}
        </div>
        {char.hasMouth && (
          <div
            className="al-char__mouth"
            ref={(el) => { mouthRefs.current[char.id] = el; }}
            style={{
              position: "absolute",
              width: 40,
              height: 4,
              borderRadius: 9999,
              backgroundColor: "#2D2D2D",
              left: (char.width - 40) / 2,
              top: fd.top + 30,
              willChange: "transform",
            }}
          />
        )}
      </div>
    );
  };

  return (
    <div className="al-characters" ref={containerRef}>
      <div className="al-characters__stage">
        {CHARS.map(renderChar)}
      </div>
    </div>
  );
};

export default AnimatedCharacters;
