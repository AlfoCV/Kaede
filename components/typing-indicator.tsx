export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-[var(--color-text-secondary)] mr-2">Kaede está escribiendo</span>
      <span className="w-1.5 h-1.5 bg-[var(--color-accent)] rounded-full typing-dot"></span>
      <span className="w-1.5 h-1.5 bg-[var(--color-accent)] rounded-full typing-dot"></span>
      <span className="w-1.5 h-1.5 bg-[var(--color-accent)] rounded-full typing-dot"></span>
    </div>
  );
}
