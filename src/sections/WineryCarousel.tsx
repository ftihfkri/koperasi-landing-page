import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { wineryCarouselConfig, navigationConfig } from '../config';

export function WineryCarousel() {
  // Null check: if config is empty, render nothing
  if (!wineryCarouselConfig.mainTitle || wineryCarouselConfig.slides.length === 0) return null;

  const slides = wineryCarouselConfig.slides;

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.05, rootMargin: '0px' }
    );

    const elements = sectionRef.current?.querySelectorAll('.fade-up, .slide-in-left, .slide-in-right');
    elements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const goToSlide = (index: number, dir: 'next' | 'prev' = 'next') => {
    if (isAnimating) return;
    setIsAnimating(true);
    setDirection(dir);
    setCurrentSlide(index);
    setTimeout(() => setIsAnimating(false), 600);
  };

  const nextSlide = () => {
    goToSlide((currentSlide + 1) % slides.length, 'next');
  };

  const prevSlide = () => {
    goToSlide((currentSlide - 1 + slides.length) % slides.length, 'prev');
  };

  // Auto-advance slides
  useEffect(() => {
    const timer = setInterval(nextSlide, 6000);
    return () => clearInterval(timer);
  }, [currentSlide]);

  return (
    <section
      id="benefits"
      ref={sectionRef}
      className="section-padding relative overflow-hidden"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(45deg, #d2a855 25%, transparent 25%), linear-gradient(-45deg, #d2a855 25%, transparent 25%)`,
          backgroundSize: '60px 60px',
          backgroundPosition: '0 0, 30px 0'
        }} />
      </div>

      <div className="container-custom relative">
        {/* Section Header */}
        <div className="fade-up text-center mb-12">
          <span className="font-script text-3xl text-gold-400 block mb-2">{wineryCarouselConfig.scriptText}</span>
          <span className="text-gold-500 text-xs uppercase tracking-[0.2em] mb-4 block">
            {wineryCarouselConfig.subtitle}
          </span>
          <h2 className="font-serif text-h1 text-white">
            {wineryCarouselConfig.mainTitle}
          </h2>
        </div>

        {/* Carousel */}
        <div className="slide-in-left" style={{ transitionDelay: '0.1s' }}>
          <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-0 items-stretch">
            {/* Image Side with Ken Burns */}
            <div className="relative aspect-[4/3] xs:aspect-[5/4] sm:aspect-[4/3] lg:aspect-auto lg:min-h-[500px] lg:max-h-none rounded-lg lg:rounded-r-none overflow-hidden bg-gradient-to-br from-gold-100 to-white">
              {slides.map((slide, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-all duration-700 ease-out ${
                    index === currentSlide
                      ? 'opacity-100 scale-100 z-10'
                      : index === (currentSlide - 1 + slides.length) % slides.length && direction === 'next'
                        ? 'opacity-0 -translate-x-full z-0'
                        : index === (currentSlide + 1) % slides.length && direction === 'prev'
                          ? 'opacity-0 translate-x-full z-0'
                          : 'opacity-0 z-0 pointer-events-none'
                  }`}
                >
                  <img
                    src={slide.image}
                    alt={`${slide.title} - ${slide.description}`}
                    loading={index === 0 ? 'eager' : 'lazy'}
                    className={`w-full h-full object-contain p-2 sm:p-6 ${index === currentSlide ? 'kenburns' : ''}`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
                </div>
              ))}

              {/* Navigation Arrows */}
              <div className="absolute bottom-3 sm:bottom-6 left-3 sm:left-6 flex gap-2 sm:gap-3 z-30">
                <button
                  type="button"
                  onClick={prevSlide}
                  className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/40 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white hover:bg-gold-500 hover:border-gold-500 transition-all duration-300 touch-manipulation"
                  aria-label="Previous slide"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={nextSlide}
                  className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/40 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white hover:bg-gold-500 hover:border-gold-500 transition-all duration-300 touch-manipulation"
                  aria-label="Next slide"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Slide Indicators */}
              <div className="absolute bottom-4 sm:bottom-7 right-3 sm:right-6 flex gap-2 z-30">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => goToSlide(index, index > currentSlide ? 'next' : 'prev')}
                    className={`h-2 rounded-full transition-all duration-300 touch-manipulation ${
                      index === currentSlide
                        ? 'w-8 bg-gold-500'
                        : 'w-4 bg-white/50 hover:bg-white/70'
                    }`}
                    aria-label={`Go to slide ${index + 1}: ${slides[index].title}`}
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  />
                ))}
              </div>
            </div>

            {/* Content Side */}
            <div className="lg:bg-white/5 lg:border-y lg:border-r lg:border-white/10 lg:rounded-r-lg p-6 sm:p-8 lg:p-12 flex flex-col justify-center relative overflow-hidden">
              {slides.map((slide, index) => (
                <div
                  key={index}
                  className={`transition-all duration-500 ${
                    index === currentSlide
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 translate-y-4 absolute'
                  }`}
                  style={{ display: index === currentSlide ? 'block' : 'none' }}
                >
                  {/* Location Tag */}
                  {wineryCarouselConfig.locationTag && (
                    <div className="flex items-center gap-2 text-gold-500 text-sm mb-4">
                      <MapPin className="w-4 h-4" />
                      <span>{wineryCarouselConfig.locationTag}</span>
                    </div>
                  )}

                  {/* Title */}
                  <h3 className="font-serif text-h3 text-white mb-2">
                    {slide.title}
                  </h3>
                  <p className="text-white/70 text-lg mb-6">
                    {slide.subtitle}
                  </p>

                  {/* Area Stats */}
                  <div className="flex items-baseline gap-2 mb-6 flex-wrap">
                    <span className="font-serif text-4xl sm:text-5xl lg:text-6xl text-gold-500">
                      {slide.area}
                    </span>
                    <span className="text-white/70 text-base sm:text-lg">{slide.unit}</span>
                  </div>

                  {/* Description */}
                  <p className="text-white/75 leading-relaxed mb-8">
                    {slide.description}
                  </p>

                  {/* CTA */}
                  {navigationConfig.ctaButtonText && (
                    <a
                      href={navigationConfig.ctaButtonUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-dark rounded-sm inline-block w-fit"
                      aria-label={navigationConfig.ctaButtonText}
                    >
                      {navigationConfig.ctaButtonText}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Slide Counter */}
        <div className="fade-up mt-8 flex justify-center lg:justify-start" style={{ transitionDelay: '0.2s' }}>
          <div className="flex items-center gap-4 text-sm">
            <span className="font-serif text-2xl text-gold-500">
              {String(currentSlide + 1).padStart(2, '0')}
            </span>
            <div className="w-12 h-px bg-white/30" />
            <span className="text-white/60">
              {String(slides.length).padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}