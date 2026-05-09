import { useEffect, useRef } from 'react';
import { ArrowLeft, Scale, FileText, Users, Shield, Gavel, BookOpen } from 'lucide-react';

export function GovernancePage() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -10% 0px' }
    );

    const elements = sectionRef.current?.querySelectorAll('.fade-up, .slide-in-left, .slide-in-right');
    elements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const goBack = () => {
    window.history.back();
  };

  const governanceAreas = [
    {
      icon: Scale,
      title: "Democratic Structure",
      description: "One member, one vote. All major decisions are made at Annual General Meetings where every member has equal voting rights regardless of shareholding."
    },
    {
      icon: Users,
      title: "Elected Board",
      description: "Our Board of Directors is elected by members every one years. All board members are employees of Sabah Softwoods Berhad, ensuring member representation."
    },
    {
      icon: FileText,
      title: "Transparency",
      description: "Full financial reports are published annually and distributed to all members. Members can inspect records and raise questions at AGMs."
    },
    {
      icon: Shield,
      title: "Regulatory Compliance",
      description: "Registered under the Cooperative Societies Act 1993. We maintain full compliance with Suruhanjaya Koperasi Malaysia regulations."
    },
    {
      icon: Gavel,
      title: "By-Laws",
      description: "Our cooperative operates under comprehensive by-laws that govern membership, elections, dividends, loans, and all operational matters."
    },
    {
      icon: BookOpen,
      title: "Annual Audits",
      description: "Independent auditors review our financial statements annually. Audit reports are presented at AGMs for member approval."
    }
  ];

  const committees = [
    {
      name: "Board of Directors",
      members: "8 elected members",
      role: "Strategic oversight and governance"
    },
    {
      name: "Audit Committee",
      members: "3 board members",
      role: "Financial oversight and audit review"
    },
  ];

  return (
    <div ref={sectionRef} className="min-h-screen bg-[#0c1a0f]">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-wine-800/95 backdrop-blur-md py-3 sm:py-4">
        <div className="container-custom flex items-center gap-3 sm:gap-4">
          <button
            onClick={goBack}
            className="flex items-center gap-2 text-white/80 hover:text-gold-400 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <div className="h-6 w-px bg-white/20" />
          <span className="font-serif text-lg text-white">Governance</span>
        </div>
      </div>

      {/* Hero Section */}
      <section className="pt-32 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-wine-900/30 to-transparent" />
        
        <div className="container-custom relative">
          <div className="fade-up text-center max-w-3xl mx-auto">
            <span className="font-script text-3xl text-gold-400 block mb-2">Our Structure</span>
            <span className="text-gold-500 text-xs uppercase tracking-[0.2em] mb-4 block">
              DEMOCRATIC GOVERNANCE
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-white mb-6">
              How We Are Governed
            </h1>
            <p className="text-white/70 text-base sm:text-lg leading-relaxed">
              Koperasi Sabah Softwoods operates under democratic principles where members 
              have equal say in decision-making. Our governance structure ensures transparency, 
              accountability, and member-centric management.
            </p>
          </div>
        </div>
      </section>

      {/* Governance Areas */}
      <section className="py-16 section-padding">
        <div className="container-custom">
          <div className="fade-up text-center mb-12">
            <h2 className="font-serif text-2xl sm:text-3xl text-white mb-4">Governance Framework</h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              Our cooperative is built on six pillars of good governance
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {governanceAreas.map((area, index) => (
              <div
                key={area.title}
                className="fade-up bg-white/5 border border-white/10 rounded-lg p-6 hover:bg-white/10 transition-all duration-300"
                style={{ transitionDelay: `${index * 0.1}s` }}
              >
                <div className="w-12 h-12 bg-gold-500/20 rounded-lg flex items-center justify-center mb-4">
                  <area.icon className="w-6 h-6 text-gold-500" />
                </div>
                <h3 className="font-serif text-xl text-white mb-3">{area.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{area.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Committees */}
      <section className="py-16 section-padding bg-wine-900/30">
        <div className="container-custom">
          <div className="fade-up text-center mb-12">
            <h2 className="font-serif text-2xl sm:text-3xl text-white mb-4">Our Committees</h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              Specialized committees handle different aspects of cooperative operations
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            {committees.map((committee, index) => (
              <div
                key={committee.name}
                className="fade-up flex items-start gap-4 p-6 border-b border-white/10 last:border-0"
                style={{ transitionDelay: `${index * 0.1}s` }}
              >
                <div className="w-10 h-10 bg-gold-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-gold-500 font-serif">{index + 1}</span>
                </div>
                <div>
                  <h3 className="font-serif text-xl text-white mb-1">{committee.name}</h3>
                  <p className="text-gold-400 text-sm mb-2">{committee.members}</p>
                  <p className="text-white/60 text-sm">{committee.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AGM Info */}
      <section className="py-16 section-padding">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="fade-up">
              <span className="text-gold-500 text-xs uppercase tracking-[0.2em] mb-4 block">
                ANNUAL GENERAL MEETING
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl text-white mb-6">
                Member Participation
              </h2>
              <p className="text-white/70 mb-6 leading-relaxed">
                The Annual General Meeting (AGM) is the highest decision-making body of our cooperative. 
                Held every year, the AGM provides members with:
              </p>
              <ul className="space-y-3">
                {[
                  "Financial reports and performance review",
                  "Dividend declaration and distribution",
                  "Board elections (every 1 years)",
                  "By-law amendments and approvals",
                  "Q&A with the Board of Directors"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-white/70">
                    <span className="w-1.5 h-1.5 bg-gold-500 rounded-full mt-2 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="fade-up bg-white/5 border border-white/10 rounded-lg p-6 sm:p-8">
              <h3 className="font-serif text-xl text-white mb-6">2025 AGM Details</h3>
              <div className="space-y-4">
                <div className="flex justify-between gap-4">
                  <span className="text-white/60 flex-shrink-0">Date</span>
                  <span className="text-white text-right">June 14, 2025</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-white/60 flex-shrink-0">Time</span>
                  <span className="text-white text-right">7:30 AM</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-white/60 flex-shrink-0">Venue</span>
                  <span className="text-white text-right">2nd Floor Banquet Hall, Fajar Club</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-white/60 flex-shrink-0">Dress Code</span>
                  <span className="text-white text-right">Proper Attire</span>
                </div>
                <div className="pt-4 border-t border-white/10">
                  <p className="text-gold-400 text-sm">
                    All members are encouraged to attend and participate
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Documents */}
      <section className="py-16 section-padding bg-wine-900/30">
        <div className="container-custom">
          <div className="fade-up text-center mb-12">
            <h2 className="font-serif text-2xl sm:text-3xl text-white mb-4">Governance Documents</h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              Access our key governance and regulatory documents
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {[
              { name: "Annual Report 2024", type: "PDF", file: "/documents/annual_report_2024.pdf" },
              { name: "By-Laws (UUK)", type: "PDF", file: "/documents/UUK.pdf" }
            ].map((doc, index) => (
              <a
                key={doc.name}
                href={doc.file}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="fade-up bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 hover:border-gold-500/50 transition-all duration-300 text-left block"
                style={{ transitionDelay: `${index * 0.1}s` }}
              >
                <FileText className="w-8 h-8 text-gold-500 mb-3" />
                <h4 className="text-white font-medium mb-1">{doc.name}</h4>
                <span className="text-white/40 text-sm">{doc.type}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-white/10">
        <div className="container-custom text-center">
          <p className="text-white/40 text-sm">
            © 2025 Koperasi Sabah Softwoods. Registered under Cooperative Societies Act 1993.
          </p>
        </div>
      </footer>
    </div>
  );
}