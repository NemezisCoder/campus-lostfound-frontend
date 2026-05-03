import { Helmet } from "react-helmet-async";

type JsonLdValue = Record<string, unknown> | Array<Record<string, unknown>>;

type SeoProps = {
  title: string;
  description?: string;
  canonicalUrl?: string;
  canonical?: string;
  robots?: string;
  ogImageUrl?: string;
  jsonLd?: JsonLdValue;
};

export default function Seo({
  title,
  description,
  canonicalUrl,
  canonical,
  robots = "index,follow",
  ogImageUrl,
  jsonLd,
}: SeoProps) {
  const resolvedCanonical = canonicalUrl ?? canonical;

  return (
    <Helmet>
      <title>{title}</title>

      {description && <meta name="description" content={description} />}
      {robots && <meta name="robots" content={robots} />}

      {resolvedCanonical && <link rel="canonical" href={resolvedCanonical} />}

      <meta property="og:title" content={title} />
      {description && <meta property="og:description" content={description} />}
      {resolvedCanonical && <meta property="og:url" content={resolvedCanonical} />}
      <meta property="og:type" content="website" />
      {ogImageUrl && <meta property="og:image" content={ogImageUrl} />}

      <meta
        name="twitter:card"
        content={ogImageUrl ? "summary_large_image" : "summary"}
      />
      <meta name="twitter:title" content={title} />
      {description && <meta name="twitter:description" content={description} />}
      {ogImageUrl && <meta name="twitter:image" content={ogImageUrl} />}

      {jsonLd ? (
  <script type="application/ld+json">
    {JSON.stringify(jsonLd)}
  </script>
) : null}
    </Helmet>
  );
}