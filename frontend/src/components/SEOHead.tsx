import { Helmet } from 'react-helmet-async';
import { SITE_URL } from '../lib/site';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  noIndex?: boolean;
}

const BASE_URL = SITE_URL;
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;
const SITE_NAME = 'CMS-360';

export default function SEOHead({ title, description, keywords, image, url, noIndex = false }: SEOHeadProps) {
  const fullTitle = title ? `${title} | CMS-360` : 'CMS-360 | Church Management Software in Kenya';
  const metaDescription = description || 'Cloud-based church management platform for Kenya. Manage members, attendance, donations, payroll and finance in one system.';
  const metaImage = image || DEFAULT_IMAGE;
  const metaUrl = url ? `${BASE_URL}${url}` : BASE_URL;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      {keywords && <meta name="keywords" content={keywords} />}
      {noIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow" />
      )}
      <link rel="canonical" href={metaUrl} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:url" content={metaUrl} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content="website" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={metaImage} />
    </Helmet>
  );
}
