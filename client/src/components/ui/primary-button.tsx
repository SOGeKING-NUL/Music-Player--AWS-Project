import { NoiseBackground } from "./noise-background";

interface PrimaryButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

export function PrimaryButton({ children, onClick, disabled, type = "button" }: PrimaryButtonProps) {
  return (
    <NoiseBackground
      containerClassName="w-fit p-2 rounded-full"
      gradientColors={[
        "rgb(255, 100, 150)",
        "rgb(100, 150, 255)",
        "rgb(255, 200, 100)",
      ]}
    >
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className="h-full w-full cursor-pointer rounded-full bg-black px-6 py-3 text-white font-semibold transition-all duration-200 ease-out hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {children}
      </button>
    </NoiseBackground>
  );
}
