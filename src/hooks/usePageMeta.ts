import { useEffect } from 'react';

export interface PageMetaOptions {
  title: string;
  description?: string;
  keywords?: string[];
  canonicalPath?: string;
  ogType?: 'website' | 'article' | 'profile';
  ogImage?: string;
  jsonLd?: Record<string, unknown> | null;
}

const DEFAULT_DESCRIPTION =
  'F1 // ARCHIVE — The Evolution of Speed. Explore 77 unbroken Formula 1 seasons (1950–2026), 920+ pilot profiles, interactive 3D technical chassis, and cross-era race analytics.';
const DEFAULT_IMAGE = '/favicon.ico';
const SITE_URL = typeof window !== 'undefined' ? window.location.origin : 'https://f1-archive.pages.dev';

function setMetaTag(key: string, value: string, isProperty = false) {
  const attribute = isProperty ? 'property' : 'name';
  let el = document.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attribute, key);
    document.head.appendChild(el);
  }
  el.content = value;
}

function setCanonical(href: string) {
  let el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.rel = 'canonical';
    document.head.appendChild(el);
  }
  el.href = href;
}

/**
 * Zero-dependency route SEO and JSON-LD structured data injection hook.
 * Avoids react-helmet bloat, maintains idempotent single #f1-archive-jsonld tag,
 * and ensures modern OpenGraph and Twitter card compliance.
 */
export function usePageMeta(options: PageMetaOptions) {
  const {
    title,
    description = DEFAULT_DESCRIPTION,
    canonicalPath,
    ogType = 'website',
    ogImage = DEFAULT_IMAGE,
    jsonLd
  } = options;

  useEffect(() => {
    const fullTitle = title ? `${title} — F1 // ARCHIVE` : 'F1 // ARCHIVE — The Evolution of Speed';
    document.title = fullTitle;

    // Standard meta
    setMetaTag('description', description);

    // OpenGraph
    setMetaTag('og:title', fullTitle, true);
    setMetaTag('og:description', description, true);
    setMetaTag('og:type', ogType, true);
    setMetaTag('og:site_name', 'F1 // ARCHIVE', true);

    const fullUrl = canonicalPath ? `${SITE_URL}${canonicalPath}` : window.location.href;
    setMetaTag('og:url', fullUrl, true);
    setCanonical(fullUrl);

    const fullImage = ogImage.startsWith('http') ? ogImage : `${SITE_URL}${ogImage}`;
    setMetaTag('og:image', fullImage, true);

    // Twitter
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:title', fullTitle);
    setMetaTag('twitter:description', description);
    setMetaTag('twitter:image', fullImage);

    // Upsert single unique JSON-LD block
    let jsonLdScript = document.getElementById('f1-archive-jsonld') as HTMLScriptElement | null;
    if (jsonLd) {
      if (!jsonLdScript) {
        jsonLdScript = document.createElement('script');
        jsonLdScript.id = 'f1-archive-jsonld';
        jsonLdScript.type = 'application/ld+json';
        document.head.appendChild(jsonLdScript);
      }
      jsonLdScript.textContent = JSON.stringify(jsonLd);
    } else if (jsonLdScript) {
      jsonLdScript.remove();
    }

    return () => {
      // Cleanup jsonld on route change so stale schemas don't linger
      const tag = document.getElementById('f1-archive-jsonld');
      if (tag) tag.remove();
    };
  }, [title, description, canonicalPath, ogType, ogImage, jsonLd]);
}

/**
 * Lightweight helper to set document title and reset on unmount.
 */
export function useDocumentTitle(pageTitle?: string) {
  useEffect(() => {
    document.title = pageTitle ? `${pageTitle} — F1 // ARCHIVE` : 'F1 // ARCHIVE';
    return () => {
      document.title = 'F1 // ARCHIVE';
    };
  }, [pageTitle]);
}
