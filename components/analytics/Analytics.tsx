import Script from 'next/script'
import { analyticsConfig } from '@/lib/analytics'

/**
 * Site-wide analytics loader — renders nothing until an env var in
 * lib/analytics.ts is set, so it's safe to leave mounted in the root
 * layout permanently. Covers every route including /staff/*; if you'd
 * rather not track internal dashboard usage, wrap the relevant `<Script>`
 * in a pathname check once that's a real requirement — not added
 * pre-emptively here since nothing currently asks for it.
 */
export function Analytics() {
  return (
    <>
      {analyticsConfig.gaMeasurementId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${analyticsConfig.gaMeasurementId}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${analyticsConfig.gaMeasurementId}');
            `}
          </Script>
        </>
      )}

      {analyticsConfig.plausibleDomain && (
        <Script
          src={analyticsConfig.plausibleScriptUrl}
          data-domain={analyticsConfig.plausibleDomain}
          strategy="afterInteractive"
        />
      )}
    </>
  )
}
