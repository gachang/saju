export const controlClass =
  "h-[52px] w-full rounded-[13px] border border-[#faf999]/20 bg-[#001e3b] px-[14px] [font-family:var(--font-diphylleia)] text-[16px] text-white outline-none transition-colors placeholder:text-white/60 focus:border-[#faf999]/60";

export const invalidControlClass =
  "border-[#ff6b6b] shadow-[0_0_0_1px_rgba(255,107,107,0.28)] focus:border-[#ff6b6b]";

export function Segment({
  selected,
  disabled,
  onClick,
  children,
}: {
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-full min-w-0 flex-1 items-center justify-center rounded-[10px] [font-family:var(--font-diphylleia)] text-[13px] font-bold transition-colors ${
        selected ? "bg-[#054787] text-[#f3ef9c]" : "text-[#fcfcf4]/60"
      }`}
    >
      {children}
    </button>
  );
}

export function FieldLabel({
  children,
  hint,
  invalid = false,
}: {
  children: React.ReactNode;
  hint?: string;
  invalid?: boolean;
}) {
  return (
    <div className="flex items-end gap-2 whitespace-nowrap">
      <span className={`[font-family:var(--font-diphylleia)] text-[16px] leading-[normal] ${invalid ? "text-[#ff8f8f]" : "text-[#fcfcf4]"}`}>
        {children}
      </span>
      {hint && (
        <span className="pb-px [font-family:var(--font-diphylleia)] text-[12px] leading-[normal] text-[#fcfcf4]/60">
          {hint}
        </span>
      )}
    </div>
  );
}

export function FieldError({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p id={id} role="alert" className="mt-1.5 text-[11px] leading-[1.45] text-[#ff8f8f]">
      {children}
    </p>
  );
}
