export default function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = "center",
}) {
  const alignCls =
    align === "left" ? "items-start text-left" : "items-center text-center";

  return (
    <div className={`mx-auto flex max-w-2xl flex-col ${alignCls}`}>
      {eyebrow && (
        <span className="inline-flex items-center gap-2 rounded-full border border-gold-400/25 bg-gold-400/10 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-gold-300">
          {eyebrow}
        </span>
      )}
      <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-base leading-relaxed text-slate-400">
          {subtitle}
        </p>
      )}
    </div>
  );
}
