import Link from "next/link";

type Crumb = { href: string; label: string };

/* Shared masthead for every non-home public page: breadcrumb trail,
   eyebrow, h1, and an optional lede. Keeping it in one place means the
   heading level and landmark structure stay consistent across pages. */
export default function PageHeader({
  eyebrow,
  title,
  lede,
  crumbs = []
}: {
  eyebrow?: string;
  title: string;
  lede?: string;
  crumbs?: Crumb[];
}) {
  return (
    <div className="pub-pagehead">
      <div className="pub-wrap">
        <nav aria-label="Breadcrumb">
          <ol className="pub-crumbs">
            <li>
              <Link href="/">Home</Link>
            </li>
            {crumbs.map((c) => (
              <li key={c.href}>
                <span className="pub-crumbs__sep" aria-hidden="true">
                  /
                </span>{" "}
                <Link href={c.href}>{c.label}</Link>
              </li>
            ))}
            <li>
              <span className="pub-crumbs__sep" aria-hidden="true">
                /
              </span>{" "}
              <span aria-current="page">{title}</span>
            </li>
          </ol>
        </nav>

        {eyebrow && <p className="pub-eyebrow">{eyebrow}</p>}
        <h1 className="pub-pagehead__title">{title}</h1>
        {lede && <p className="pub-lede">{lede}</p>}
      </div>
    </div>
  );
}
