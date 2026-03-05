declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

type AnalyticsParams = Record<string, string | number | boolean | null | undefined>;

function appendScriptOnce(src: string, attrs: Record<string, string> = {}): void {
  const existing = document.querySelector(`script[src="${src}"]`);
  if (existing) return;

  const script = document.createElement('script');
  script.src = src;
  script.async = true;

  Object.entries(attrs).forEach(([key, value]) => {
    script.setAttribute(key, value);
  });

  document.head.appendChild(script);
}

export function initGoogleIntegrations(): void {
  const gaMeasurementId = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim();
  const isDev = import.meta.env.DEV;

  if (gaMeasurementId) {
    appendScriptOnce(`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`);

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function gtag(...args: unknown[]) {
      window.dataLayer?.push(args);
    };

    window.gtag('js', new Date());
    window.gtag('config', gaMeasurementId);
    trackEvent('game_session_start', {
      platform: 'web',
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight,
    });

    if (isDev) {
      console.info('[analytics] GA4 enabled', { measurementId: gaMeasurementId });
    }
  } else if (isDev) {
    console.info('[analytics] GA4 disabled. Set VITE_GA_MEASUREMENT_ID to enable tracking.');
  }

}

export function trackEvent(eventName: string, params: AnalyticsParams = {}): void {
  if (!window.gtag) {
    return;
  }

  window.gtag('event', eventName, params);
}

export function trackScreenView(screenName: string): void {
  trackEvent('screen_view', {
    screen_name: screenName,
  });
}
