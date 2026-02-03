import { useTheme } from "../context/ThemeContext";

interface ThemeToggleProps {
  className?: string;
  ariaLabel?: string;
}

export default function ThemeToggle({ className = "", ariaLabel = "Toggle theme" }: ThemeToggleProps) {
  const { darkMode, toggleTheme } = useTheme();

  const classes = ["theme-toggle", "btn-icon", darkMode ? "dark" : "light", className]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      className={classes}
      title={ariaLabel}
      aria-label={ariaLabel}
      aria-pressed={darkMode}
      onClick={toggleTheme}
    >
      <svg
        className="icon-sun"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <path
          d="M12 4V2M12 22v-2M4 12H2M22 12h-2M4.9 4.9L3.5 3.5M20.5 20.5l-1.4-1.4M4.9 19.1l-1.4 1.4M20.5 3.5l-1.4 1.4"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.6" />
      </svg>
      <svg
        className="icon-moon"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <path
          d="M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
