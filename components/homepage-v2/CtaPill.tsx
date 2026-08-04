import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react'
import Link, { type LinkProps } from 'next/link'
import { cn } from '@/utils/cn'

const ICON_VARIANT_CLASSES = {
  copper: 'border-[var(--gz-copper-500)] text-[var(--gz-copper-500)]',
  default: 'border-[var(--gz-border-default)] text-[var(--gz-ink-200)]',
} as const

interface CtaPillSharedProps {
  children: ReactNode
  icon?: ReactNode
  iconPosition?: 'left' | 'right'
  iconVariant?: keyof typeof ICON_VARIANT_CLASSES
  /** 'colors' skips the hover lift/transform — use for pills whose position
   *  is already driven by an inline `style.transform` from scroll-linked JS
   *  (e.g. homepage-v2/PortfolioGallery's reveal link), where a competing
   *  CSS transition on transform would fight the per-frame inline style. */
  transition?: 'all' | 'colors'
  className?: string
}

type CtaPillAsAnchor = { as?: 'a' } & CtaPillSharedProps &
  Omit<ComponentPropsWithoutRef<'a'>, 'className' | 'children'>

type CtaPillAsLink = { as: 'link' } & CtaPillSharedProps &
  Omit<LinkProps, 'className' | 'children'> &
  Omit<ComponentPropsWithoutRef<'a'>, 'className' | 'children' | 'href'>

type CtaPillAsButton = { as: 'button' } & CtaPillSharedProps &
  Omit<ComponentPropsWithoutRef<'button'>, 'className' | 'children'>

export type CtaPillProps = CtaPillAsAnchor | CtaPillAsLink | CtaPillAsButton

/**
 * Shared arrow-circle pill CTA for the /homepage-v2, /aftercare-v2 and
 * /portfolio-v2 draft pages — consolidates markup that was previously
 * copy-pasted (with slight drift) across Navbar, Hero, MobileNav, both
 * PortfolioGallery variants, InquireForm, ArtistsPreview and About.
 */
export const CtaPill = forwardRef<HTMLAnchorElement | HTMLButtonElement, CtaPillProps>(
  function CtaPill(
    {
      as = 'a',
      children,
      icon = '→',
      iconPosition = 'left',
      iconVariant = 'copper',
      transition = 'all',
      className,
      ...rest
    },
    ref,
  ) {
    const pillClassName = cn(
      'inline-flex items-center gap-3 rounded-full border border-[var(--gz-border-default)] bg-[var(--gz-ink-900)] py-[7px] text-[15px] text-[var(--gz-paper-050)] shadow-[inset_0_1px_0_rgba(242,238,231,0.06)] duration-200 ease-out hover:border-[var(--gz-border-strong)] hover:bg-[var(--gz-ink-800)] disabled:pointer-events-none disabled:opacity-60',
      transition === 'all' ? 'transition-all hover:-translate-y-0.5' : 'transition-colors',
      iconPosition === 'right' ? 'pl-6 pr-[7px]' : 'pl-[7px] pr-6',
      className,
    )

    const iconEl = (
      <span
        className={cn(
          'flex h-[38px] w-[38px] flex-none items-center justify-center rounded-full border',
          ICON_VARIANT_CLASSES[iconVariant],
        )}
      >
        {icon}
      </span>
    )

    const content = (
      <>
        {iconPosition === 'left' && iconEl}
        {children}
        {iconPosition === 'right' && iconEl}
      </>
    )

    if (as === 'button') {
      return (
        <button
          ref={ref as React.Ref<HTMLButtonElement>}
          className={pillClassName}
          {...(rest as ComponentPropsWithoutRef<'button'>)}
        >
          {content}
        </button>
      )
    }

    if (as === 'link') {
      const { href, ...linkProps } = rest as LinkProps & ComponentPropsWithoutRef<'a'>
      return (
        <Link
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          className={pillClassName}
          {...linkProps}
        >
          {content}
        </Link>
      )
    }

    return (
      <a
        ref={ref as React.Ref<HTMLAnchorElement>}
        className={pillClassName}
        {...(rest as ComponentPropsWithoutRef<'a'>)}
      >
        {content}
      </a>
    )
  },
)
