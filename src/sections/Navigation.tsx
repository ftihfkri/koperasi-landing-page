import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, Home, BookOpen, Newspaper, Users, Mail, TreePine } from 'lucide-react';
import { navigationConfig, type NavLink } from '../config';

// Icon lookup map for dynamic icon resolution from config strings
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Home, BookOpen, Newspaper, Users, Mail, TreePine, Menu, X, ChevronDown,
};

// Home-page section IDs the nav can scroll to. Used to drive active-link state.
const HOME_SECTION_IDS = ['home', 'about', 'story', 'investments', 'benefits', 'news', 'contact'];

export function Navigation() {
  // Null check: if config is empty, render nothing
  if (!navigationConfig.brandName) return null;

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>('home');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setActiveDropdown(null);
  }, [location.pathname]);

  // Track which home-page section is in view so the matching nav link can be
  // highlighted. Off-route pages rely on pathname matching instead.
  useEffect(() => {
    if (location.pathname !== '/') {
      setActiveSection('');
      return;
    }

    const observed = HOME_SECTION_IDS
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (observed.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) {
          setActiveSection((visible[0].target as HTMLElement).id);
        }
      },
      { rootMargin: '-35% 0px -50% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    observed.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [location.pathname]);

  // Close desktop dropdown on outside click or Escape
  useEffect(() => {
    if (!activeDropdown) return;

    const handlePointer = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('[data-nav-dropdown]')) {
        setActiveDropdown(null);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveDropdown(null);
    };

    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [activeDropdown]);

  const isHashLink = (href: string) => href.startsWith('#');

  const isLinkActive = (href: string): boolean => {
    if (isHashLink(href)) {
      return location.pathname === '/' && activeSection === href.slice(1);
    }
    return location.pathname === href;
  };

  const isParentActive = (link: NavLink): boolean => {
    if (isLinkActive(link.href)) return true;
    return !!link.dropdown?.some((item) => isLinkActive(item.href));
  };

  const handleNavigation = (href: string) => {
    // Close menu first so body scroll-lock is released before we try to scroll.
    // Without this delay, smooth scrollIntoView is dropped on iOS Safari while
    // the body still has overflow:hidden from the menu being open.
    const wasOpen = isMobileMenuOpen;
    setIsMobileMenuOpen(false);
    setActiveDropdown(null);

    const run = () => {
      if (isHashLink(href)) {
        if (location.pathname !== '/') {
          navigate('/' + href);
        } else {
          const element = document.querySelector(href);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      } else {
        navigate(href);
      }
    };

    if (wasOpen) {
      setTimeout(run, 320);
    } else {
      run();
    }
  };

  const navLinks = navigationConfig.navLinks;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-[120] transition-all duration-500 ${
        isScrolled || isMobileMenuOpen
          ? 'bg-wine-800/95 backdrop-blur-md py-2 sm:py-3'
          : 'bg-transparent py-3 sm:py-5'
      }`}
      style={{ paddingTop: `max(${isScrolled || isMobileMenuOpen ? '0.5rem' : '0.75rem'}, env(safe-area-inset-top))` }}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="container-custom flex items-center justify-between gap-3 sm:gap-4">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 sm:gap-3 group min-w-0 flex-shrink"
          aria-label={navigationConfig.brandName}
        >
          <img
            src="/logo-kopssb.jpeg"
            alt="KOP-SSB"
            className={`w-auto flex-shrink-0 transition-all duration-300 group-hover:scale-110 ${
              isScrolled ? 'h-6 sm:h-7' : 'h-7 sm:h-8'
            }`}
          />
          <div className="flex flex-col min-w-0 leading-tight">
            <span className="font-serif text-base sm:text-lg md:text-xl text-white tracking-wide">KOP-SSB</span>
            <span className="hidden sm:block text-[8px] sm:text-[10px] text-gold-400 tracking-widest uppercase truncate">{navigationConfig.brandName}</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-4 xl:gap-8 flex-shrink-0" role="menubar">
          {navLinks.map((link) => {
            const parentActive = isParentActive(link);
            return (
              <div
                key={link.name}
                className="relative"
                data-nav-dropdown={link.dropdown ? link.name : undefined}
                role="none"
              >
                <button
                  onClick={() => {
                    if (link.dropdown) {
                      setActiveDropdown((current) => (current === link.name ? null : link.name));
                    } else {
                      handleNavigation(link.href);
                    }
                  }}
                  className={`group/navlink relative flex items-center gap-1 text-sm xl:text-base transition-colors duration-300 py-2 whitespace-nowrap ${
                    parentActive ? 'text-gold-400' : 'text-white/80 hover:text-gold-400'
                  }`}
                  role="menuitem"
                  aria-haspopup={link.dropdown ? 'true' : undefined}
                  aria-expanded={link.dropdown ? activeDropdown === link.name : undefined}
                >
                  {link.name}
                  {link.dropdown && (
                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${
                      activeDropdown === link.name ? 'rotate-180' : ''
                    }`} aria-hidden="true" />
                  )}
                  {/* Underline indicator (animates in on hover, stays on for active) */}
                  <span
                    className={`absolute left-0 right-0 -bottom-0.5 h-[2px] bg-gold-500 origin-left transition-transform duration-300 ${
                      parentActive ? 'scale-x-100' : 'scale-x-0 group-hover/navlink:scale-x-100'
                    }`}
                    aria-hidden="true"
                  />
                </button>

                {/* Dropdown Menu */}
                {link.dropdown && (
                  <div
                    className={`absolute top-full left-0 pt-2 transition-all duration-300 ${
                      activeDropdown === link.name
                        ? 'opacity-100 visible translate-y-0'
                        : 'opacity-0 invisible -translate-y-2'
                    }`}
                    role="menu"
                  >
                    <div className="bg-wine-800/95 backdrop-blur-md rounded-md overflow-hidden min-w-[200px] border border-white/10 shadow-xl">
                      {link.dropdown.map((item) => {
                        const itemActive = isLinkActive(item.href);
                        return (
                          <button
                            key={item.name}
                            onClick={() => handleNavigation(item.href)}
                            className={`block w-full text-left px-4 py-3 text-sm transition-colors ${
                              itemActive
                                ? 'bg-gold-500/20 text-gold-400'
                                : 'text-white/80 hover:bg-gold-500/20 hover:text-gold-400'
                            }`}
                            role="menuitem"
                          >
                            {item.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* CTA Button */}
        {navigationConfig.ctaButtonText && (
          <a
            href={navigationConfig.ctaButtonUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:inline-block btn-primary rounded whitespace-nowrap"
            aria-label={navigationConfig.ctaButtonText}
          >
            {navigationConfig.ctaButtonText}
          </a>
        )}

        {/* Mobile Menu Button */}
        <button
          type="button"
          className="lg:hidden relative z-[130] p-3 -mr-2 text-white touch-manipulation"
          onClick={() => setIsMobileMenuOpen((open) => !open)}
          aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isMobileMenuOpen}
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          {isMobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Full Screen Backdrop Blur Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-[100] bg-black/80 backdrop-blur-2xl"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Menu */}
      <div
        className={`lg:hidden fixed inset-x-0 top-0 bottom-0 z-[110] bg-wine-900/95 backdrop-blur-xl transition-all duration-500 overflow-y-auto overscroll-contain ${
          isMobileMenuOpen
            ? 'opacity-100 visible'
            : 'opacity-0 invisible pointer-events-none'
        }`}
        role="menu"
        aria-hidden={!isMobileMenuOpen}
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 4.5rem)' }}
      >
        <div className="container-custom py-6 flex flex-col gap-1">
          {navLinks.map((link, index) => {
            const IconComponent = iconMap[link.icon];
            const parentActive = isParentActive(link);
            return (
              <div
                key={link.name}
                className="animate-fade-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {link.dropdown ? (
                  <div>
                    <button
                      onClick={() => setActiveDropdown(activeDropdown === link.name ? null : link.name)}
                      className={`flex items-center justify-between w-full py-4 text-lg border-b border-white/10 ${
                        parentActive ? 'text-gold-400' : 'text-white'
                      }`}
                      aria-expanded={activeDropdown === link.name}
                      role="menuitem"
                    >
                      <span className="flex items-center gap-3">
                        {IconComponent && <IconComponent className="w-5 h-5 text-gold-500" />}
                        {link.name}
                      </span>
                      <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${
                        activeDropdown === link.name ? 'rotate-180' : ''
                      }`} aria-hidden="true" />
                    </button>
                    <div
                      className={`overflow-hidden transition-all duration-500 ${
                        activeDropdown === link.name ? 'max-h-60' : 'max-h-0'
                      }`}
                      role="menu"
                    >
                      {link.dropdown.map((item) => {
                        const itemActive = isLinkActive(item.href);
                        return (
                          <button
                            key={item.name}
                            onClick={() => handleNavigation(item.href)}
                            className={`block w-full text-left pl-12 py-3 ${
                              itemActive ? 'text-gold-400' : 'text-white/70 hover:text-gold-400'
                            }`}
                            role="menuitem"
                          >
                            {item.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => handleNavigation(link.href)}
                    className={`flex items-center gap-3 w-full py-4 text-lg border-b border-white/10 transition-colors ${
                      parentActive ? 'text-gold-400' : 'text-white hover:text-gold-400'
                    }`}
                    role="menuitem"
                  >
                    {IconComponent && <IconComponent className="w-5 h-5 text-gold-500" />}
                    {link.name}
                  </button>
                )}
              </div>
            );
          })}

          {navigationConfig.ctaButtonText && (
            <a
              href={navigationConfig.ctaButtonUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary rounded mt-6 text-center"
              role="menuitem"
            >
              {navigationConfig.ctaButtonText}
            </a>
          )}
        </div>
      </div>
    </nav>
  );
}
