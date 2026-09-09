import { Nav } from "../_components/layout/nav";
import { Footer } from "../../_components/layout/footer";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <Nav
        tabs={[
          {
            label: "Discover",
            href: "/",
            subRoutes: ["/resources/register"],
          },
          {
            label: "All",
            href: "/all",
          },
          {
            label: "Facilitators",
            href: "/facilitators",
          },
          {
            label: "Networks",
            href: "/networks",
          },
        ]}
      />
      <div className="flex flex-1 flex-col py-6 md:py-8">{children}</div>
      <Footer />
    </div>
  );
}
