// =============================================================================
// Koperasi Sabah Softwoods - Employee Investment Cooperative Website
// =============================================================================
// A koperasi kakitangan (employee cooperative) where staff invest and earn dividends
// =============================================================================

// -----------------------------------------------------------------------------
// Site Config
// -----------------------------------------------------------------------------
export interface SiteConfig {
  title: string;
  description: string;
  language: string;
  keywords: string;
  ogImage: string;
  canonical: string;
}

export const siteConfig: SiteConfig = {
  title: "Koperasi Kakitangan Sabah Softwoods Berhad | Employee Investment Cooperative",
  description: "Koperasi Kakitangan Sabah Softwoods Berhad - An employee cooperative empowering staff through collective investment, dividend returns, and sustainable wealth building since 1973.",
  language: "en",
  keywords: "Koperasi Sabah Softwoods, employee cooperative, koperasi kakitangan, investment cooperative, dividend, staff investment, Sabah Softwood",
  ogImage: "/images/og-image.jpg",
  canonical: "https://koperasisabahsoftwoods.coop",
};

// -----------------------------------------------------------------------------
// Navigation Config
// -----------------------------------------------------------------------------
export interface NavDropdownItem {
  name: string;
  href: string;
}

export interface NavLink {
  name: string;
  href: string;
  icon: string;
  dropdown?: NavDropdownItem[];
}

export interface NavigationConfig {
  brandName: string;
  brandSubname: string;
  tagline: string;
  navLinks: NavLink[];
  ctaButtonText: string;
}

export const navigationConfig: NavigationConfig = {
  brandName: "Koperasi Kakitangan Sabah Softwoods",
  brandSubname: "Berhad",
  tagline: "Employee Cooperative Since 2012",
  navLinks: [
    {
      name: "Home",
      href: "#home",
      icon: "Home",
    },
    {
      name: "About Us",
      href: "#about",
      icon: "BookOpen",
      dropdown: [
        { name: "Our Story", href: "#story" },
        { name: "Governance", href: "/governance" },
        { name: "Board Members", href: "/board-members" },
      ],
    },
    {
      name: "Business Portfolio",
      href: "#investments",
      icon: "TreePine",
    },
    {
      name: "Member Benefits",
      href: "#benefits",
      icon: "Users",
    },
    {
      name: "News",
      href: "#news",
      icon: "Newspaper",
    },
    {
      name: "Contact",
      href: "#contact",
      icon: "Mail",
    },
  ],
  ctaButtonText: "Member Login",
};

// -----------------------------------------------------------------------------
// Preloader Config
// -----------------------------------------------------------------------------
export interface PreloaderConfig {
  brandName: string;
  brandSubname: string;
  yearText: string;
}

export const preloaderConfig: PreloaderConfig = {
  brandName: "Koperasi Kakitangan Sabah softwoods",
  brandSubname: "Berhad",
  yearText: "Est. 2012",
};

// -----------------------------------------------------------------------------
// Hero Config
// -----------------------------------------------------------------------------
export interface HeroStat {
  value: number;
  suffix: string;
  label: string;
}

export interface HeroConfig {
  scriptText: string;
  mainTitle: string;
  ctaButtonText: string;
  ctaTarget: string;
  stats: HeroStat[];
  decorativeText: string;
  backgroundImage: string;
}

export const heroConfig: HeroConfig = {
  scriptText: "Empowering Employees Through Collective Investment",
  mainTitle: "Invest Together\nProsper Together",
  ctaButtonText: "Explore Benefits",
  ctaTarget: "#benefits",
  stats: [
    { value: 14, suffix: " Years", label: "Serving Members" },
    { value: 10, suffix: "%", label: "Avg. Annual Dividend" },
    { value: 500, suffix: "+", label: "Active Members" },
    { value: 10, suffix: "RM 1.4M+", label: "Assets Under Management" },
  ],
  decorativeText: "UNITY • INVESTMENT • PROSPERITY",
  backgroundImage: "/images/hero-cooperative.jpeg",
};

// -----------------------------------------------------------------------------
// Investment Portfolio Config (adapted from Wine Showcase)
// -----------------------------------------------------------------------------
export interface Wine {
  id: string;
  name: string;
  subtitle: string;
  year: string;
  image: string;
  filter: string;
  glowColor: string;
  description: string;
  tastingNotes: string;
  alcohol: string;
  temperature: string;
  aging: string;
}

export interface WineFeature {
  icon: string;
  title: string;
  description: string;
}

export interface WineQuote {
  text: string;
  attribution: string;
  prefix: string;
}

export interface WineShowcaseConfig {
  scriptText: string;
  subtitle: string;
  mainTitle: string;
  wines: Wine[];
  features: WineFeature[];
  quote: WineQuote;
}

export const wineShowcaseConfig: WineShowcaseConfig = {
  scriptText: "Our Portfolio",
  subtitle: "DIVERSIFIED BUSINESS INVESTMENT STRATEGY",
  mainTitle: "Portfolio Ventures",
  wines: [
    {
      id: "business_petron",
      name: "Wholesale & Retail Activities",
      subtitle: "Revenue Streams",
      year: "Growing Portfolio",
      image: "/images/petron-kop.png",
      filter: "",
      glowColor: "bg-green-700/20",
      description: "Wholesale and retail activities involving rice, flour, sugar, and daily necessities, including petrol station operations",
      tastingNotes: "Multiple revenue sources strengthening cooperative finances",
      alcohol: "",
      temperature: "Business Units",
      aging: "Profitable",
    },
    {
      id: "business_insurans",
      name: "Sales Agent For Insurance",
      subtitle: "Revenue Streams",
      year: "Growing Portfolio",
      image: "/images/kop-insurans.png",
      filter: "",
      glowColor: "bg-green-700/20",
      description: "Services as an insurance sales agent",
      tastingNotes: "Multiple revenue sources strengthening cooperative finances",
      alcohol: "",
      temperature: "Business Units",
      aging: "Profitable",
    },
    {
      id: "business_sawit",
      name: "Transporting Oil Palm",
      subtitle: "Revenue Streams",
      year: "Growing Portfolio",
      image: "/images/kop-sawit.png",
      filter: "",
      glowColor: "bg-green-700/20",
      description: "Contract services for transporting oil palm fruit and other contract work related to agricultural activities.",
      tastingNotes: "Multiple revenue sources strengthening cooperative finances",
      alcohol: "",
      temperature: "Business Units",
      aging: "Profitable",
    },
    { 
      id: "business_tyre",
      name: "Automotive Care & Tyre Solutions",
      subtitle: "Service & Retail Division",
      year: "Growing Portfolio",
      image: "/images/tyre-shop.png",
      filter: "",
      glowColor: "bg-green-700/20",
      description: "Providing professional tyre repair, replacement, wheel alignment, and car battery solutions to ensure safety and performance on the road.",
      tastingNotes: "Reliable, high-demand services contributing to stable cooperative revenue",
      alcohol: "",
      temperature: "Business Units",
      aging: "Profitable",
    },
    {
      id: "business_rnr",
      name: "R&R Commercial & MSME Hub",
      subtitle: "Integrated Revenue Platform",
      year: "Growing Portfolio",
      image: "/images/kop-rnr.png",
      filter: "",
      glowColor: "bg-green-700/20",
      description: "A strategically positioned Rest & Relaxation (R&R) destination designed to serve highway travelers while functioning as a commercial hub for Micro, Small, and Medium Enterprises (MSMEs). The facility integrates food & beverage outlets, retail spaces, and service-based businesses to generate consistent foot traffic and diversified revenue streams.",
      tastingNotes: "Multi-tenant MSME ecosystem driving recurring income, local economic participation, and long-term value creation",
      alcohol: "",
      temperature: "Business Units",
      aging: "Profitable",
    },
  ],
  features: [

    {
      icon: "Thermometer",
      title: "Competitive Returns",
      description: "Historical dividend yields 10% annually, outperforming many savings instruments",
    },
    {
      icon: "Clock",
      title: "Consistent and Transparent",
      description: "14 years of serving employees with transparency and accountability",
    },
    {
      icon: "Sparkles",
      title: "Member Benefits",
      description: "Access to the Bereavement fund, cooperative human capital fund, cooperative welfare fund and annual bonuses",
    },
  ],
  quote: {
    text: "To Improve the Economic Level of Cooperative Members Through the Mobilization of Available Resources.",
    attribution: "Koperasi Kakitangan Sabah softwoods Vision",
    prefix: "Our Vision",
  },
};

// -----------------------------------------------------------------------------
// Member Benefits Carousel Config (adapted from Winery Carousel)
// -----------------------------------------------------------------------------
export interface BenefitSlide {
  image: string;
  title: string;
  subtitle: string;
  area: string;
  unit: string;
  description: string;
}

export interface MemberBenefitsConfig {
  scriptText: string;
  subtitle: string;
  mainTitle: string;
  locationTag: string;
  slides: BenefitSlide[];
}

export const wineryCarouselConfig: MemberBenefitsConfig = {
  scriptText: "Member Privileges : Unlock More Value Within",
  subtitle: "WHAT MEMBERS ENJOY",
  mainTitle: "Benefits of Membership",
  locationTag: "For All Active Members",
  slides: [
    {
      image: "/images/benefit-dividend.png",
      title: "Annual Dividends",
      subtitle: "Share in Our Success",
      area: "10",
      unit: "% returns",
      description: "Members receive annual dividends based on cooperative performance and their shareholding. Dividends are declared at the Annual General Meeting and distributed to all qualifying members.",
    },
    {
      image: "/images/khairat-kematian.png",
      title: "Bereavement Fund",
      subtitle: "Khairat Kematian",
      area: "",
      unit: "",
      description: "Immediate financial assistance to the next of kin of deceased members to ease the burden of funeral expenses.",
    },
    {
      image: "/images/wang-modal-insan.png",
      title: "Cooperative human capital fund",
      subtitle: "Kumpulan wang modal insan",
      area: "",
      unit: "",
      description: "Allocation of funds for the development of competencies, skills, and training of KOP-SSB members and staff, in line with the action plan of the Malaysian Cooperative Commission (SKM)",
    },
    {
      image: "/images/wang-kebajikan.png",
      title: "Cooperative welfare fund",
      subtitle: "Kumpulan wang kebajikan",
      area: "",
      unit: "",
      description: "Fund established under the by-laws of a KOP-SSB to provide financial assistance to members in the event of fire mishape or natural disaster.",
    },
  ],
};

// -----------------------------------------------------------------------------
// About/Governance Config (adapted from Museum)
// -----------------------------------------------------------------------------
export interface TimelineEvent {
  year: string;
  event: string;
}

export interface AboutTabContent {
  title: string;
  description: string;
  highlight: string;
}

export interface AboutTab {
  id: string;
  name: string;
  icon: string;
  image: string;
  content: AboutTabContent;
}

export interface AboutQuote {
  prefix: string;
  text: string;
  attribution: string;
}

export interface AboutConfig {
  scriptText: string;
  subtitle: string;
  mainTitle: string;
  introText: string;
  timeline: TimelineEvent[];
  tabs: AboutTab[];
  openingHours: string;
  openingHoursLabel: string;
  ctaButtonText: string;
  quote: AboutQuote;
  founderPhotoAlt: string;
  founderPhoto: string;
}

export const museumConfig: AboutConfig = {
  scriptText: "Our Cooperative",
  subtitle: "GOVERNANCE & STRUCTURE",
  mainTitle: "The Koperasi Story",
  introText: "Founded in 2012, Koperasi Sabah softwoods has grown from a small staff group into a thriving employee cooperative with over 500 members and more than RM 1,400,000 in assets under management.",
  timeline: [
    { year: "2012", event: "Koperasi Sabah softwoods established" },
    { year: "2017", event: "The cooperative’s name has been changed to Koperasi Kakitangan Sabah softwoods Berhad (KOP-SSB)." },
    { year: "2022", event: "Inaugural PCS kiosk operation" },
    { year: "2025", event: "Achieving active member more than 500+" },
    { year: "2026", event: "Assets more than RM 1,400,000" },
  ],
  tabs: [
    {
      id: "governance",
      name: "Governance",
      icon: "History",
      image: "/images/governance.jpg",
      content: {
        title: "Governance",
        description: "Our cooperative is governed by an elected Board of Directors, all of whom are employees of Sabah Softwoods Berhad. Major decisions are made at Annual General Meetings where every member has a vote. We operate under the Cooperative Societies Act of Malaysia with full regulatory compliance.",
        highlight: "Member-owned, member-governed",
      },
    },
    {
      id: "board",
      name: "Board Members",
      icon: "BookOpen",
      image: "/images/board-members.png",
      content: {
        title: "Leadership Team",
        description: "Our Board comprises elected representatives from various departments including Operations, Finance, Human Resources, and Plantation divisions. Elections are held every one years ensuring fresh perspectives and continued member representation.",
        highlight: "Elected by members, for members",
      },
    },
    {
      id: "reports",
      name: "Annual Reports",
      icon: "Award",
      image: "/images/annual-report.jpg",
      content: {
        title: "Transparency & Accountability",
        description: "To prepare the cooperative’s annual reports in accordance with SKM, the following guidelines must be adhered to:\n\n• Annual Reporting Compliance:\nCooperatives must comply with the Cooperative Act 1993 (Amendment 2007) and the Cooperative Financial Statement Reporting Guidelines (GP23) issued by SKM.\n\n• Financial Statements Requirement:\nThe annual financial report must include:\n- Profit and Loss Account\n- Balance Sheet\n- Statement of the Cooperative’s Affairs\n- Auditor’s Report",
        highlight: "Full financial transparency",
      },
    },
  ],
  openingHours: "Office: Monday - Friday, 8:00 AM - 4:00 PM",
  openingHoursLabel: "Operating Hours",
  ctaButtonText: "Download Annual Report",
  quote: {
    prefix: "Our Mission",
    text: "To Provide Efficient Services and Quality Products in Line with the Philosophy and Principles of Cooperatives.",
    attribution: "Koperasi Kakitangan Sabah Softwoods Mission",
  },
  founderPhotoAlt: "Cooperative members at Annual General Meeting",
  founderPhoto: "/images/agm-meeting.jpg",
};

// -----------------------------------------------------------------------------
// News Config
// -----------------------------------------------------------------------------
export interface NewsArticle {
  id: number;
  image: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
}

export interface Testimonial {
  name: string;
  role: string;
  text: string;
  rating: number;
}

export interface StoryQuote {
  prefix: string;
  text: string;
  attribution: string;
}

export interface StoryTimelineItem {
  value: string;
  label: string;
}

export interface NewsConfig {
  scriptText: string;
  subtitle: string;
  mainTitle: string;
  viewAllText: string;
  readMoreText: string;
  articles: NewsArticle[];
  testimonialsScriptText: string;
  testimonialsSubtitle: string;
  testimonialsMainTitle: string;
  testimonials: Testimonial[];
  storyScriptText: string;
  storySubtitle: string;
  storyTitle: string;
  storyParagraphs: string[];
  storyTimeline: StoryTimelineItem[];
  storyQuote: StoryQuote;
  storyImage: string;
  storyImageCaption: string;
}

export const newsConfig: NewsConfig = {
  scriptText: "Latest Updates",
  subtitle: "NEWS & ANNOUNCEMENTS",
  mainTitle: "Our Shared Journey -Moments & Milestones",
  viewAllText: "View All News",
  readMoreText: "Read More",
  articles: [
    {
      id: 1,
      image: "/images/news-dividend-2024.jpeg",
      title: "2024 Dividend Rate Announced: 10%",
      excerpt: "We are pleased to announce an 10% dividend for 2024, reflecting another strong year for our cooperative. Dividends will be credited to member accounts by March 31, 2025.",
      date: "June 24, 2025",
      category: "Dividend",
    },
    {
      id: 2,
      image: "/images/news-agm-2024.jpg",
      title: "8th Annual General Meeting Scheduled",
      excerpt: "Join us on June 24, 2025 for our AGM where we will present the 2024 financial reports, declare dividends, and elect new board members. All members are encouraged to attend.",
      date: "February 20, 2025",
      category: "AGM",
    },
  ],
  testimonialsScriptText: "Member Stories",
  testimonialsSubtitle: "TESTIMONIALS",
  testimonialsMainTitle: "What Members Say",
  testimonials: [
  ],
  storyScriptText: "Our Journey",
  storySubtitle: "BUILDING WEALTH TOGETHER",
  storyTitle: "14 Years of Member Success",
  storyParagraphs: [
    "Since 2012, Koperasi Sabah Softwoods has been the trusted investment partner for employees of Sabah Softwoods Berhad. What started as a small savings group has evolved into a thriving cooperative managing over RM 1,400,000 in member assets.",
    "Our success is measured not just in financial returns, but in the real impact on members' lives - homes built, children educated, emergencies managed, and retirements secured. Together, we continue to grow stronger.",
  ],
  storyTimeline: [
    { value: "500+", label: "Active Members" },
    { value: "1.4M +", label: "RM Assets" },
    { value: "10%", label: "2024 Dividend" },
    { value: "14", label: "Years" },
  ],
  storyQuote: {
    prefix: "Our Objective",
    text: "To Provide Facilities and Safeguard the Welfare of Cooperative Members Through the Implementation of Profitable Activities.",
    attribution: "Koperasi Kakitangan Sabah Softwoods Objective",
  },
  storyImage: "/images/member-gathering.jpeg",
  storyImageCaption: "Members celebrating at the 10th Anniversary dinner",
};

// -----------------------------------------------------------------------------
// Contact Form Config
// -----------------------------------------------------------------------------
export interface ContactInfoItem {
  icon: string;
  label: string;
  value: string;
  subtext: string;
}

export interface ContactFormFields {
  nameLabel: string;
  namePlaceholder: string;
  emailLabel: string;
  emailPlaceholder: string;
  phoneLabel: string;
  phonePlaceholder: string;
  visitDateLabel: string;
  visitorsLabel: string;
  visitorsOptions: string[];
  messageLabel: string;
  messagePlaceholder: string;
  submitText: string;
  submittingText: string;
  successMessage: string;
  errorMessage: string;
}

export interface ContactFormConfig {
  scriptText: string;
  subtitle: string;
  mainTitle: string;
  introText: string;
  contactInfoTitle: string;
  contactInfo: ContactInfoItem[];
  form: ContactFormFields;
  privacyNotice: string;
  formEndpoint: string;
}

export const contactFormConfig: ContactFormConfig = {
  scriptText: "Get In Touch",
  subtitle: "CONTACT US",
  mainTitle: "We're Here to Help",
  introText: "Have questions about membership, investments, loans, or dividends? Our team is ready to assist you. Reach out to us or visit our office.",
  contactInfoTitle: "Contact Information",
  contactInfo: [
    {
      icon: "MapPin",
      label: "Office Address",
      value: "KM 44, Jalan Tawau - Kalabakan, P.O.Box 60966, 91019 Tawau, Sabah, Malaysia.",
      subtext: "",
    },
    {
      icon: "Phone",
      label: "Phone",
      value: "6010-9621558",
      subtext: "Office hours only",
    },
    {
      icon: "Mail",
      label: "Email",
      value: "koperasi@kop-ssb.com",
      subtext: "We respond within 24 hours",
    },
    {
      icon: "Clock",
      label: "Office Hours",
      value: "Monday - Friday, 8AM - 4PM",
      subtext: "Closed on weekends & public holidays",
    },
  ],
  form: {
    nameLabel: "Full Name",
    namePlaceholder: "Your full name",
    emailLabel: "Email Address",
    emailPlaceholder: "your@email.com",
    phoneLabel: "Phone Number",
    phonePlaceholder: "+60 XXX-XXX-XXXX",
    visitDateLabel: "Preferred Visit Date",
    visitorsLabel: "Inquiry Type",
    visitorsOptions: ["Membership Inquiry", "Dividend Question", "General Question", "Feedback"],
    messageLabel: "Message",
    messagePlaceholder: "How can we help you?",
    submitText: "Send Message",
    submittingText: "Sending...",
    successMessage: "Thank you! We'll respond within 24 hours.",
    errorMessage: "Something went wrong. Please try again or contact us directly.",
  },
  privacyNotice: "By submitting this form, you agree to our privacy policy. Your information will only be used to respond to your inquiry.",
  formEndpoint: "https://formspree.io/f/YOUR_FORM_ID",
};

// -----------------------------------------------------------------------------
// Footer Config
// -----------------------------------------------------------------------------
export interface SocialLink {
  icon: string;
  label: string;
  href: string;
}

export interface FooterLink {
  name: string;
  href: string;
}

export interface FooterLinkGroup {
  title: string;
  links: FooterLink[];
}

export interface FooterContactItem {
  icon: string;
  text: string;
}

export interface FooterConfig {
  brandName: string;
  tagline: string;
  description: string;
  socialLinks: SocialLink[];
  linkGroups: FooterLinkGroup[];
  contactItems: FooterContactItem[];
  newsletterLabel: string;
  newsletterPlaceholder: string;
  newsletterButtonText: string;
  newsletterSuccessText: string;
  newsletterErrorText: string;
  newsletterEndpoint: string;
  copyrightText: string;
  legalLinks: string[];
  icpText: string;
  backToTopText: string;
  ageVerificationText: string;
}

export const footerConfig: FooterConfig = {
  brandName: "Koperasi Sabah Softwoods",
  tagline: "Employee Cooperative Since 2012",
  description: "An employee cooperative empowering staff of Sabah Softwoods Berhad through collective investment, annual dividends, and comprehensive member benefits.",
  socialLinks: [
    { icon: "Facebook", label: "Facebook", href: "#" },
    { icon: "Instagram", label: "Instagram", href: "#" },
    { icon: "Twitter", label: "Twitter", href: "#" },
  ],
  linkGroups: [
    {
      title: "Quick Links",
      links: [
        { name: "About Us", href: "#about" },
        { name: "Business Portfolio", href: "#investments" },
        { name: "Member Benefits", href: "#benefits" },
        { name: "News & Updates", href: "#news" },
      ],
    },
    {
      title: "Member Services",
      links: [
        { name: "Annual Reports", href: "#" },
        { name: "Member Portal", href: "#" },
      ],
    },
  ],
  contactItems: [
    { icon: "MapPin", text: "KM 44, Jalan Tawau - Kalabakan, P.O.Box 60966, 91019 Tawau, Sabah, Malaysia." },
    { icon: "Phone", text: "+60 88-XXX XXXX" },
    { icon: "Mail", text: "koperasi@kop-ssb.com" },
  ],
  newsletterLabel: "Subscribe to updates",
  newsletterPlaceholder: "Enter your email",
  newsletterButtonText: "Subscribe",
  newsletterSuccessText: "Thank you for subscribing!",
  newsletterErrorText: "Please try again.",
  newsletterEndpoint: "https://formspree.io/f/YOUR_NEWSLETTER_ID",
  copyrightText: "© 2026 Koperasi Sabah Softwoods. All rights reserved.",
  legalLinks: ["Privacy Policy", "Terms of Use", "Cooperative Act"],
  icpText: "Registered under Cooperative Societies Act 1993",
  backToTopText: "Back to top",
  ageVerificationText: "",
};

// -----------------------------------------------------------------------------
// Scroll To Top Config
// -----------------------------------------------------------------------------
export interface ScrollToTopConfig {
  ariaLabel: string;
}

export const scrollToTopConfig: ScrollToTopConfig = {
  ariaLabel: "Back to top",
};