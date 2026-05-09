import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, Home, BookOpen, Newspaper, Users, Mail, TreePine } from 'lucide-react';
import { navigationConfig } from '../config';

// Icon lookup map for dynamic icon resolution from config strings
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Home, BookOpen, Newspaper, Users, Mail, TreePine, Menu, X, ChevronDown,
};

export function Navigation() {
  // Null check: if config is empty, render nothing
  if (!navigationConfig.brandName) return null;

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
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

  const isHashLink = (href: string) => href.startsWith('#');

  const handleNavigation = (href: string) => {
    if (isHashLink(href)) {
      if (location.pathname !== '/') {
        navigate('/' + href);
      } else {
        const element = document.querySelector(href);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }
    } else {
      navigate(href);
    }
    setIsMobileMenuOpen(false);
    setActiveDropdown(null);
  };

  const navLinks = navigationConfig.navLinks;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? 'bg-wine-800/95 backdrop-blur-md py-3'
          : 'bg-transparent py-5'
      }`}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="container-custom flex items-center justify-between gap-4">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-3 group min-w-0 flex-shrink"
          aria-label={navigationConfig.brandName}
        >
          <img
            src="/logo-kopssb.jpeg"
            alt="KOP-SSB"
            className="h-8 w-auto flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
          />
          <div className="flex flex-col min-w-0 leading-tight">
            <span className="font-serif text-lg sm:text-xl text-white tracking-wide">KOP-SSB</span>
            <span className="text-[9px] sm:text-[10px] text-gold-400 tracking-widest uppercase truncate">{navigationConfig.brandName}</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-4 xl:gap-8 flex-shrink-0" role="menubar">
          {navLinks.map((link) => (
              <div
                key={link.name}
                className="relative"
                onMouseEnter={() => link.dropdown && setActiveDropdown(link.name)}
                onMouseLeave={() => setActiveDropdown(null)}
                role="none"
              >
                <button
                  onClick={() => !link.dropdown && handleNavigation(link.href)}
                  className="flex items-center gap-1 text-sm xl:text-base text-white/80 hover:text-gold-400 transition-colors duration-300 py-2 whitespace-nowrap"
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
                    <div className="bg-wine-800/95 backdrop-blur-md rounded-md overflow-hidden min-w-[180px] border border-white/10">
                      {link.dropdown.map((item) => (
                        <button
                          key={item.name}
                          onClick={() => handleNavigation(item.href)}
                          className="block w-full text-left px-4 py-3 text-sm text-white/80 hover:bg-gold-500/20 hover:text-gold-400 transition-colors"
                          role="menuitem"
                        >
                          {item.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
          ))}
        </div>

        {/* CTA Button */}
        {navigationConfig.ctaButtonText && (
          <a
            href="http://localhost/koperasi-kakitangan/public/login"
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
          className="lg:hidden p-2 text-white"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isMobileMenuOpen}
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
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, height: '100vh', width: '100vw' }}
        />
      )}

      {/* Mobile Menu */}
      <div
        className={`lg:hidden fixed inset-x-0 top-[72px] bottom-0 z-[110] bg-wine-900/95 backdrop-blur-xl transition-all duration-500 overflow-y-auto ${
          isMobileMenuOpen
            ? 'opacity-100 visible'
            : 'opacity-0 invisible pointer-events-none'
        }`}
        role="menu"
        aria-hidden={!isMobileMenuOpen}
      >
        <div className="container-custom py-8 flex flex-col gap-2">
          {navLinks.map((link, index) => {
            const IconComponent = iconMap[link.icon];
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
                      className="flex items-center justify-between w-full py-4 text-lg text-white border-b border-white/10"
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
                        activeDropdown === link.name ? 'max-h-40' : 'max-h-0'
                      }`}
                      role="menu"
                    >
                      {link.dropdown.map((item) => (
                        <button
                          key={item.name}
                          onClick={() => handleNavigation(item.href)}
                          className="block w-full text-left pl-12 py-3 text-white/70 hover:text-gold-400"
                          role="menuitem"
                        >
                          {item.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => handleNavigation(link.href)}
                    className="flex items-center gap-3 w-full py-4 text-lg text-white border-b border-white/10 hover:text-gold-400 transition-colors"
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
              href="http://localhost/koperasi-kakitangan/public/login"
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