import { Link, useLocation, useNavigate } from "react-router";

type Section = "Words" | "Sentences" | "Legacy";

const sentencesPaths = ["/sentence", "/sentenceFull", "/sentenceInverse", "/sentenceList", "/sentenceForm"];
const legacyPaths = ["/groups", "/direct"];

const sectionDefaultPath: Record<Section, string> = {
  Words: "/",
  Sentences: "/sentence",
  Legacy: "/groups",
};

function detectSection(pathname: string): Section {
  if (sentencesPaths.some((p) => pathname === p || pathname.startsWith(p + "/"))) return "Sentences";
  if (legacyPaths.some((p) => pathname === p || pathname.startsWith(p + "/"))) return "Legacy";
  return "Words";
}

const sectionLinks: Record<Section, { name: string; path: string }[]> = {
  Words: [
    { name: "Review", path: "/" },
    { name: "Full", path: "/full" },
    { name: "Inverse", path: "/inverse" },
    { name: "List", path: "/list" },
    { name: "Add", path: "/cardForm" },
  ],
  Sentences: [
    { name: "Review", path: "/sentence" },
    { name: "Full", path: "/sentenceFull" },
    { name: "Inverse", path: "/sentenceInverse" },
    { name: "List", path: "/sentenceList" },
    { name: "Add", path: "/sentenceForm" },
  ],
  Legacy: [
    { name: "Groups", path: "/groups" },
    { name: "Direct", path: "/direct" },
  ],
};

function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const section = detectSection(location.pathname);

  return (
    <nav>
      <select
        className="nav-section-select"
        value={section}
        onChange={(e) => navigate(sectionDefaultPath[e.target.value as Section])}
      >
        <option value="Words">Words</option>
        <option value="Sentences">Sentences</option>
        <option value="Legacy">Legacy</option>
      </select>
      {sectionLinks[section].map((link) => (
        <Link
          key={link.path}
          to={link.path}
          className={location.pathname === link.path ? "nav-link active" : "nav-link"}
        >
          {link.name}
        </Link>
      ))}
    </nav>
  );
}

export default Navigation;
