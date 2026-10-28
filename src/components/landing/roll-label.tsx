// Button text whose letters roll up one after another on hover (see .roll in landing.css). The hover itself is
// driven by the parent's .btn-roll class; screen readers get the plain text.
export function RollLabel({ children }: { children: string }) {
  return (
    <>
      <span className="roll" aria-hidden="true">
        {[...children].map((ch, i) => {
          const c = ch === " " ? " " : ch;
          return (
            <span key={i} className="roll-ch" style={{ "--i": i } as React.CSSProperties}>
              <span>{c}</span>
              <span>{c}</span>
            </span>
          );
        })}
      </span>
      <span className="sr-only">{children}</span>
    </>
  );
}
