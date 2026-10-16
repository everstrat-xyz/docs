import Image from "next/image";
import Link from "next/link";
import { Children, cloneElement, isValidElement, type ReactNode } from "react";

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

const categories = [
  ["", "All updates"],
  ["app", "App"],
  ["contracts", "Contracts"],
  ["strategies", "Strategies"],
  ["automation", "Automation"],
  ["data-and-integrations", "Data"],
] as const;

export function ChangelogNav({ active = "" }: { active?: string }) {
  return (
    <nav className="changelog-nav" aria-label="Filter changelog by component">
      {categories.map(([slug, label]) => (
        <Link
          key={slug}
          href={`/changelog${slug ? `/${slug}` : ""}`}
          aria-current={active === slug ? "page" : undefined}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}

/** Keep dates, headings, and release copy in MDX for search and Markdown exports. */
export function ChangeEntry({
  category,
  status,
  children,
}: {
  category: string;
  status?: string;
  children: ReactNode;
}) {
  const nodes = Children.toArray(children);
  const dateIndex = nodes.findIndex(isValidElement);
  const date = nodes[dateIndex];
  let dateHeading = date;
  if (
    isValidElement<{ children?: ReactNode }>(date) &&
    typeof date.props.children === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(date.props.children)
  ) {
    const value = date.props.children;
    dateHeading = cloneElement(
      date,
      {},
      <time dateTime={value}>
        {dateFormatter.format(new Date(`${value}T00:00:00Z`))}
      </time>,
    );
  }

  return (
    <section className="change-entry" aria-label={`${category} update`}>
      <div className="change-entry-meta">
        <span className="change-category">{category}</span>
        {dateHeading}
        {status ? <span className="change-status">{status}</span> : null}
      </div>
      <div className="change-entry-content">
        {nodes.filter((_, index) => index !== dateIndex)}
      </div>
    </section>
  );
}

const screenshots = {
  metrics: {
    src: "/changelog/metrics-earnings.png",
    alt: "Everstrat Metrics showing Protocol Earnings and Pending Redemptions, with numbered highlights.",
    width: 1728,
    height: 942,
    marks: [
      { left: 79.2, top: 23.5, width: 14.4, height: 15.2 },
      { left: 65.7, top: 82, width: 14.1, height: 15.5 },
    ],
    crop: "metrics",
  },
  portfolio: {
    src: "/changelog/portfolio-history.png",
    alt: "Portfolio position-history preview with Return/Value and USD/ETH controls highlighted. Example data.",
    width: 1440,
    height: 900,
    marks: [
      { left: 65.2, top: 12.7, width: 17.1, height: 4.8 },
      { left: 17.4, top: 18.6, width: 65.6, height: 28.9 },
    ],
    crop: "portfolio",
  },
  sharing: {
    src: "/changelog/snapshot-sharing.png",
    alt: "October 12 Metrics interface with the Copy snapshot link control highlighted; the control later moved to Admin.",
    width: 1440,
    height: 900,
    marks: [{ left: 86.7, top: 21.5, width: 10.1, height: 3.6 }],
    crop: "sharing",
  },
  admin: {
    src: "/changelog/admin-snapshot.png",
    alt: "Admin Insights campaign link builder with Copy snapshot link highlighted in its new location.",
    width: 1728,
    height: 941,
    marks: [{ left: 82.4, top: 48.6, width: 8.4, height: 3 }],
    crop: "admin",
  },
  snapshot: {
    src: "/changelog/public-snapshot.png",
    alt: "Public protocol snapshot page with the fixed timestamp and historical NAV and holder count highlighted.",
    width: 1440,
    height: 900,
    marks: [
      { left: 16.6, top: 16.5, width: 25.5, height: 3.3 },
      { left: 18.7, top: 70, width: 30.4, height: 4.3 },
    ],
    crop: "snapshot",
  },
  wallet: {
    src: "/changelog/wallet-connection.png",
    alt: "Wallet chooser captured during development of wallet connection recovery, with WalletConnect highlighted.",
    width: 1440,
    height: 900,
    marks: [{ left: 35.2, top: 52.4, width: 29.7, height: 7.8 }],
    crop: "wallet",
  },
  invitation: {
    src: "/changelog/invite-access.png",
    alt: "Historical invitation interface with request and existing invite-code entry paths highlighted. Captured October 6, after the August introduction.",
    width: 1440,
    height: 900,
    marks: [
      { left: 8.1, top: 72.9, width: 23, height: 4.5 },
      { left: 14.8, top: 79.6, width: 11.5, height: 2.2 },
    ],
    crop: "invitation",
  },
} as const;

export function ChangeScreenshot({
  name,
  children,
}: {
  name: keyof typeof screenshots;
  children: ReactNode;
}) {
  const shot = screenshots[name];

  return (
    <figure className="change-screenshot">
      <a
        className={`change-screenshot-frame change-crop-${shot.crop}`}
        href={shot.src}
        target="_blank"
        rel="noreferrer"
        aria-label={`Open full-size screenshot: ${shot.alt}`}
      >
        <div className="change-screenshot-canvas">
          <Image
            src={shot.src}
            alt={shot.alt}
            width={shot.width}
            height={shot.height}
            sizes={
              shot.crop === "wallet" || shot.crop === "invitation"
                ? "(max-width: 767px) 220vw, 1680px"
                : "(max-width: 767px) 92vw, 700px"
            }
          />
          {shot.marks.map((mark, index) => (
            <span
              key={mark.left}
              className="change-screenshot-mark"
              aria-hidden="true"
              style={{
                left: `${mark.left}%`,
                top: `${mark.top}%`,
                width: `${mark.width}%`,
                height: `${mark.height}%`,
              }}
            >
              <span>{index + 1}</span>
            </span>
          ))}
        </div>
      </a>
      <figcaption>{children}</figcaption>
    </figure>
  );
}
