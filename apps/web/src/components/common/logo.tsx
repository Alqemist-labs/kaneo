import { Link } from "@tanstack/react-router";
import useProjectStore from "@/store/project";

type LogoProps = {
  className?: string;
};

export function Logo({ className = "" }: LogoProps) {
  const { setProject } = useProjectStore();

  return (
    <Link
      onClick={() => {
        setProject(undefined);
      }}
      to="/dashboard"
      className={`w-auto ${className}`}
    >
      <img
        src="/logo-dark.svg"
        alt="Alqemist Tickets"
        className="h-16 w-auto dark:hidden"
      />
      <img
        src="/logo-light.svg"
        alt="Alqemist Tickets"
        className="hidden h-16 w-auto dark:block"
      />
    </Link>
  );
}
