import { Helmet } from "react-helmet-async";

type SeoProps = {
  title: string;
  description?: string;
  canonicalUrl?: string;
  robots?: string;
  ogImageUrl?: string;
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>;
};

export default function Seo({
  title,
  description,
  canonicalUrl,
  robots = "index,follow",
  ogImageUrl,
  jsonLd,
}: SeoProps) {
  return (
    <Helmet>
      <title>{title}</title>

      {description ? <meta name="description" content={description} /> : null}
      {robots ? <meta name="robots" content={robots} /> : null}

      {canonicalUrl ? <link rel="canonical" href={canonicalUrl} /> : null}

      <meta property="og:title" content={title} />
      {description ? <meta property="og:description" content={description} /> : null}
      {canonicalUrl ? <meta property="og:url" content={canonicalUrl} /> : null}
      <meta property="og:type" content="website" />
      {ogImageUrl ? <meta property="og:image" content={ogImageUrl} /> : null}

      <meta name="twitter:card" content={ogImageUrl ? "summary_large_image" : "summary"} />
      <meta name="twitter:title" content={title} />
      {description ? <meta name="twitter:description" content={description} /> : null}
      {ogImageUrl ? <meta name="twitter:image" content={ogImageUrl} /> : null}

      {jsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd),
          }}
        />
      ) : null}
    </Helmet>
  );
}