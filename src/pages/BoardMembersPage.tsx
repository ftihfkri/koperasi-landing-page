import { useEffect, useRef } from 'react';
import { ArrowLeft, Mail, Phone, Award, Calendar, Users } from 'lucide-react';

export function BoardMembersPage() {
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

  const boardMembers = [
    {
      name: "Muzaffah Hassan",
      position: "Chairman",
      department: "Oil Palm Plantations",
      tenure: "Since 2020",
      photo: "/images/board/muzzafah_hassan.png",
    },
    {
      name: "Rose Asman Samsul Bahrin",
      position: "Secretary",
      department: "Oil Palm Plantations",
      tenure: "Since 2019",
      photo: "/images/board/rose_asman.png",
    },
    {
      name: "Walter Denesh Veerapathiran",
      position: "Treasurer",
      department: "Corporate Planning",
      tenure: "Since 2018",
      photo: "/images/board/walter_danesh.png",
    },
    {
      name: "Haji Abdul Rashid Hussein",
      position: "Committee Member",
      department: "Oil Palm Plantations",
      tenure: "Since 2022",
      photo: "/images/board/abdul_rashid.png",
    },
    {
      name: "Safiah Yusof",
      position: "Committee Member",
      department: "Human Resources",
      tenure: "Since 2020",
      photo: "/images/board/safiah_yusof.png",
    },
    {
      name: "Masiara Hj Marsuki",
      position: "Committee Member",
      department: "Tree Plantation",
      tenure: "Since 2016",
      photo: "/images/board/masiara_marsuki.png",
    },
    {
      name: "Velis Mohd Said Ismail",
      position: "Committee Member",
      department: "Engineering",
      tenure: "Since 2021",
      photo: "/images/board/velis.png",
    },
    {
      name: "Nordin Otong",
      position: "Committee Member",
      department: "Quality Control",
      tenure: "Since 2022",
      photo: "/images/board/nordin_otong.png",
    },
    {
      name: "Francis Goh",
      position: "Committee Member",
      department: "Tree Plantation(retired)",
      tenure: "Since 2022",
      photo: "/images/board/francis_goh.png",
    }
  ];

  const pastChairmen = [
    { name: "Ibrahim Moin", period: "2018 - 2021" },
    { name: "Mustapah Pailing", period: "2017 (Interim)" },
    { name: "Muzaffah Hassan", period: "2016 - 2017" },
    { name: "Joly Poyong", period: "2012 - 2016" }
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
          <span className="font-serif text-lg text-white">Board Members</span>
        </div>
      </div>

      {/* Hero Section */}
      <section className="pt-32 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-wine-900/30 to-transparent" />
        
        <div className="container-custom relative">
          <div className="fade-up text-center max-w-3xl mx-auto">
            <span className="font-script text-3xl text-gold-400 block mb-2">Leadership</span>
            <span className="text-gold-500 text-xs uppercase tracking-[0.2em] mb-4 block">
              ELECTED BY MEMBERS
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-white mb-6">
              Board of Directors
            </h1>
            <p className="text-white/70 text-base sm:text-lg leading-relaxed">
              Our Board of Directors comprises of elected representatives 
              from members of the KOPSSB which are done through proper nomination 
              and election in the Annual General Meeting. The board of directors 
              serve voluntarily to govern the cooperative and protect members' interest.
            </p>
          </div>
        </div>
      </section>

      {/* Board Stats */}
      <section className="py-12 section-padding bg-wine-900/30">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: "9", label: "Board Members" },
              { value: "1", label: "Year Term" },
              { value: "5", label: "Departments Represented" },
              { value: "12", label: "Years of Service Combined" }
            ].map((stat, index) => (
              <div
                key={stat.label}
                className="fade-up text-center p-6 bg-white/5 rounded-lg"
                style={{ transitionDelay: `${index * 0.1}s` }}
              >
                <div className="font-serif text-3xl sm:text-4xl text-gold-500 mb-2">{stat.value}</div>
                <div className="text-white/60 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Board Members Grid */}
      <section className="py-16 section-padding">
        <div className="container-custom">
          <div className="fade-up text-center mb-12">
            <h2 className="font-serif text-2xl sm:text-3xl text-white mb-4">Current Board (2024-2025)</h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              Elected at the 8th Annual General Meeting (14th June 2025)
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {boardMembers.map((member, index) => (
              <div
                key={member.name}
                className="fade-up group bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:bg-white/10 hover:border-gold-500/30 transition-all duration-300"
                style={{ transitionDelay: `${index * 0.1}s` }}
              >
                {/* Photo Area */}
                <div className="relative w-full aspect-[4/3] bg-gradient-to-br from-gold-800/40 to-gold-900/60 overflow-hidden">
                  <img
                    src={member.photo}
                    alt={member.name}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.style.display = 'none';
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                  {/* Fallback initials - shown if photo not found */}
                  <div
                    className="absolute inset-0 items-center justify-center bg-gradient-to-br from-gold-700/50 to-gold-900/70"
                    style={{ display: 'none' }}
                  >
                    <span className="font-serif text-6xl text-gold-300/80">
                      {member.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </span>
                  </div>

                  {/* Position Badge */}
                  <div className="absolute top-4 right-4 px-3 py-1.5 bg-gold-600/90 backdrop-blur-sm rounded-full text-white text-xs font-medium tracking-wide flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5" />
                    {member.position}
                  </div>
                </div>

                {/* Info */}
                <div className="p-5">
                  <h3 className="font-serif text-xl text-white mb-1 group-hover:text-gold-300 transition-colors">
                    {member.name}
                  </h3>
                  <p className="text-gold-400 text-sm mb-3">{member.department}</p>
                  <div className="flex items-center gap-2 text-white/40 text-xs">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{member.tenure}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Election Process */}
      <section className="py-16 section-padding bg-wine-900/30">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="fade-up">
              <span className="text-gold-500 text-xs uppercase tracking-[0.2em] mb-4 block">
                DEMOCRATIC PROCESS
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl text-white mb-6">
                How Board Members Are Elected
              </h2>
              <p className="text-white/70 mb-6 leading-relaxed">
                Board members are elected through a democratic process at our Annual General Meeting. 
                Any active member in good standing can nominate themselves or be nominated by fellow members.
              </p>
              
              <div className="space-y-4">
                {[
                  {
                    step: "1",
                    title: "Nomination",
                    desc: "Members submit nominations 7 days before AGM"
                  },
                  {
                    step: "2",
                    title: "Campaigning",
                    desc: "Candidates present their vision to members"
                  },
                  {
                    step: "3",
                    title: "Voting",
                    desc: "One member, one vote at the AGM"
                  },
                  {
                    step: "4",
                    title: "Announcement",
                    desc: "Results announced and new board sworn in"
                  }
                ].map((item) => (
                  <div key={item.step} className="flex gap-4">
                    <div className="w-8 h-8 bg-gold-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-gold-500 text-sm font-medium">{item.step}</span>
                    </div>
                    <div>
                      <h4 className="text-white font-medium mb-1">{item.title}</h4>
                      <p className="text-white/50 text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="fade-up">
              <div className="bg-white/5 border border-white/10 rounded-lg p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Users className="w-6 h-6 text-gold-500" />
                  <h3 className="font-serif text-xl text-white">Board Responsibilities</h3>
                </div>
                <ul className="space-y-3">
                  {[
                    "Set strategic direction for the cooperative",
                    "Oversee financial management and audits",
                    "Declare annual dividends",
                    "Ensure regulatory compliance",
                    "Represent member interests",
                    "Appoint and supervise management",
                    "Approve major investments and expenditures"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-white/70">
                      <span className="w-1.5 h-1.5 bg-gold-500 rounded-full mt-2 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Past Chairmen */}
      <section className="py-16 section-padding">
        <div className="container-custom">
          <div className="fade-up text-center mb-12">
            <h2 className="font-serif text-2xl sm:text-3xl text-white mb-4">Past Leadership</h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              Honoring those who have served as Chairman
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
              {pastChairmen.map((chairman, index) => (
                <div
                  key={chairman.name}
                  className="fade-up flex items-center justify-between p-4 border-b border-white/10 last:border-0"
                  style={{ transitionDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gold-500/10 rounded-full flex items-center justify-center">
                      <Award className="w-5 h-5 text-gold-500" />
                    </div>
                    <span className="text-white">{chairman.name}</span>
                  </div>
                  <span className="text-white/50 text-sm">{chairman.period}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 section-padding bg-wine-900/30">
        <div className="container-custom">
          <div className="fade-up text-center max-w-2xl mx-auto">
            <h2 className="font-serif text-2xl sm:text-3xl text-white mb-4">Contact the Board</h2>
            <p className="text-white/60 mb-8">
              Have questions or suggestions? Reach out to our Board Secretary
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:board@sabahsoftwoods.coop"
                className="inline-flex items-center justify-center gap-2 bg-gold-500 text-white px-6 py-3 rounded hover:bg-gold-600 transition-colors"
              >
                <Mail className="w-5 h-5" />
                <span>Email the Board</span>
              </a>
              <a
                href="tel:+60109621558"
                className="inline-flex items-center justify-center gap-2 bg-white/10 text-white px-6 py-3 rounded hover:bg-white/20 transition-colors"
              >
                <Phone className="w-5 h-5" />
                <span>Call Office</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-white/10">
        <div className="container-custom text-center">
          <p className="text-white/40 text-sm">
            © 2026 Koperasi Sabah Softwoods. Board members serve voluntary terms.
          </p>
        </div>
      </footer>
    </div>
  );
}