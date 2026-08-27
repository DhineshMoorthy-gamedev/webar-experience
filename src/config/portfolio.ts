export interface ProjectItem {
  id: string;
  title: string;
  subtitle: string;
  role: string;
  company: string;
  period: string;
  description: string;
  techStack: string[];
  badge: string;
  highlights: string[];
  color: string;
  accentColor: string;
  icon: string;
  linkText?: string;
  linkUrl?: string;
}

export interface CareerMilestone {
  year: string;
  displayYear: string;
  eraTitle: string;
  headline: string;
  company: string;
  role: string;
  location: string;
  summary: string;
  badge: string;
  accentColor: string;
  secondaryColor: string;
  techKeywords: string[];
  projects: ProjectItem[];
}

export interface PortfolioConfig {
  developerName: string;
  title: string;
  tagline: string;
  studio: string;
  flagshipGame: string;
  socials: {
    github: string;
    linkedin: string;
    email: string;
    studioWebsite?: string;
  };
  milestones: CareerMilestone[];
}

export const PORTFOLIO_DATA: PortfolioConfig = {
  developerName: 'Dhinesh Moorthy',
  title: 'Game Developer & XR Creator',
  tagline: 'Crafting immersive interactive worlds, tactile XR simulations & indie game experiences.',
  studio: 'Olai Digital Studios',
  flagshipGame: 'Zen Fourier',
  socials: {
    github: 'https://github.com/DhineshMoorthy-gamedev',
    linkedin: 'https://linkedin.com/in/dhinesh-moorthy',
    email: 'mailto:dhineshmoorthy.gamedev@gmail.com',
    studioWebsite: 'https://github.com/DhineshMoorthy-gamedev'
  },
  milestones: [
    {
      year: '2022',
      displayYear: '2022',
      eraTitle: 'Industry Kickoff & Dual Milestones',
      headline: 'From College Graduation to Core Game Dev & Haptic Research',
      company: 'Fabbox Studios & Merkel Haptics (IITM)',
      role: 'Junior Unity Developer ➔ Project Associate',
      location: 'Chennai, India',
      summary: 'Graduated college in April 2022, built commercial mobile titles at Fabbox Studios, and advanced to tactile virtual simulation research at IIT Madras Research Park.',
      badge: '🎓 KICKOFF',
      accentColor: '#00e5ff',
      secondaryColor: '#7c4dff',
      techKeywords: ['Unity 3D', 'C#', 'Mobile Dev', 'Game Loops', 'Physics', 'Haptics'],
      projects: [
        {
          id: 'fabbox-games',
          title: 'Fabbox Commercial Games',
          subtitle: 'Mobile Gameplay Architecture',
          role: 'Junior Unity Developer (Aug 2022)',
          company: 'Fabbox Studios',
          period: 'August 2022',
          description: 'Engineered responsive mobile touch controls, game state loops, optimized particle effects, and monetization SDK integrations for mobile releases.',
          techStack: ['Unity', 'C#', 'UI Toolkit', 'Mobile Profiling', 'AdMob/IAP'],
          badge: '📱 Mobile Gaming',
          highlights: [
            'Built fluid 60fps arcade and puzzle mechanics',
            'Optimized draw calls and texture atlases for low-end devices',
            'Implemented robust save systems and level progression managers'
          ],
          color: '#00e5ff',
          accentColor: '#00b0ff',
          icon: '🎮'
        },
        {
          id: 'merkel-intro',
          title: 'Tactile Simulation Systems',
          subtitle: 'IIT Madras Research Park Startup',
          role: 'Project Associate (Oct 2022)',
          company: 'Merkel Haptic Systems',
          period: 'October 2022',
          description: 'Transitioned into high-fidelity haptic virtual reality simulators, exploring force-feedback device integration and tactile surgical training environments.',
          techStack: ['Unity', 'C#', 'Haptic APIs', 'Force Feedback', 'Physics Simulation'],
          badge: '🔬 Research & Haptics',
          highlights: [
            'Interfaced custom hardware haptic styluses with Unity 3D',
            'Developed real-time collision detection for soft-body virtual organs',
            'Programmed precise sub-millimeter force response algorithms'
          ],
          color: '#7c4dff',
          accentColor: '#651fff',
          icon: '🦾'
        }
      ]
    },
    {
      year: '2023',
      displayYear: '2023 - 2024',
      eraTitle: 'Tactile XR & High-Precision VR',
      headline: 'Pioneering Medical & Industrial Haptic VR Simulators',
      company: 'Merkel Haptic Systems (IITM)',
      role: 'Project Associate & XR Simulation Specialist',
      location: 'IIT Madras Research Park, Chennai',
      summary: 'Spearheaded immersive VR interaction toolkits, multi-sensory feedback algorithms, and medical training simulators with real-time tactile force response.',
      badge: '🥽 XR & HAPTICS',
      accentColor: '#00e676',
      secondaryColor: '#00b0ff',
      techKeywords: ['Unity XR', 'OpenXR', 'Haptic SDKs', 'Medical VR', 'Kinematics', 'C#'],
      projects: [
        {
          id: 'surgical-haptic-sim',
          title: 'Medical Haptic VR Simulator',
          subtitle: 'High-Fidelity Virtual Surgery',
          role: 'Lead Unity & Haptic Programmer',
          company: 'Merkel Haptic Systems',
          period: '2023 - 2024',
          description: 'Comprehensive virtual surgical trainer providing realistic tissue resistance, bone cutting tactile feedback, and real-time medical performance analytics.',
          techStack: ['Unity 3D', 'OpenXR', 'Custom Haptics C++ DLL', 'Kinematics', 'Shader Graph'],
          badge: '🏥 Healthcare VR',
          highlights: [
            'Zero-latency tactile force-feedback loop running at 1000Hz',
            'Realistic volumetric tissue deformation and incision mechanics',
            'Demonstrated at national medical conferences and IITM research expos'
          ],
          color: '#00e676',
          accentColor: '#00c853',
          icon: '🥽'
        },
        {
          id: 'industrial-tactile-lab',
          title: 'Tactile Interaction Toolkit',
          subtitle: 'Reusable Unity XR Framework',
          role: 'Core Architect',
          company: 'Merkel Haptic Systems',
          period: '2023 - 2024',
          description: 'Architected a modular Unity framework that unified multiple haptic glove and robotic arm controllers into a single drag-and-drop SDK.',
          techStack: ['Unity XR Interaction Toolkit', 'OpenXR', 'C# Event Bus', 'Physics Matrices'],
          badge: '⚙️ SDK Architecture',
          highlights: [
            'Standardized force-feedback event triggers for 3D objects',
            'Reduced simulator development time by 40% across studio teams',
            'Cross-device compatibility across PCVR and standalone headsets'
          ],
          color: '#00b0ff',
          accentColor: '#0091ea',
          icon: '⚡'
        }
      ]
    },
    {
      year: '2024',
      displayYear: '2024 - 2025',
      eraTitle: 'Senior Systems & Architecture',
      headline: 'High-Performance Game Engineering & Shaders',
      company: 'Abhiwan Technologies',
      role: 'Senior Unity Developer',
      location: 'Noida / Remote',
      summary: 'Joined in Dec 2024 to lead core client game architectures, custom GPU shader pipelines, multiplayer synchronization, and top-tier performance profiling.',
      badge: '⚡ SENIOR DEV',
      accentColor: '#ffd600',
      secondaryColor: '#ff6d00',
      techKeywords: ['Advanced C#', 'HLSL/Shader Graph', 'Multiplayer Netcode', 'DOTS/ECS', 'Profiling'],
      projects: [
        {
          id: 'abhiwan-core-architecture',
          title: 'Next-Gen Game Architecture',
          subtitle: 'Enterprise-Grade Client Framework',
          role: 'Senior Unity Developer',
          company: 'Abhiwan Technologies',
          period: 'Dec 2024 - 2025',
          description: 'Designed decoupled MVVM/Service-Locator architecture for scalable live-ops gaming titles supporting millions of concurrent data payloads.',
          techStack: ['Unity', 'Advanced C#', 'Zenject/VContainer', 'UniTask', 'Addressables'],
          badge: '🏛️ Architecture',
          highlights: [
            'Built modular event-driven gameplay subsystems with zero GC allocations',
            'Dynamic asset streaming via Addressables reducing initial download size by 65%',
            'Engineered custom shader pipelines for cinematic lighting on mobile GPUs'
          ],
          color: '#ffd600',
          accentColor: '#ffab00',
          icon: '💎'
        },
        {
          id: 'abhiwan-multiplayer-systems',
          title: 'Real-Time Multiplayer Systems',
          subtitle: 'Low-Latency Matchmaking & Sync',
          role: 'Senior Developer',
          company: 'Abhiwan Technologies',
          period: '2025',
          description: 'Real-time multiplayer synchronization, lag compensation, client-side prediction, and authoritative server tick reconciliation.',
          techStack: ['Photon / Netcode', 'WebSockets', 'Predictive Smoothing', 'Shader Optimization'],
          badge: '🌐 Multiplayer Netcode',
          highlights: [
            'Client-side prediction with interpolated rollbacks under 80ms latency',
            'GPU instancing and compute buffers for massive onscreen battle armies',
            'Mentored junior and mid-level developers in C# clean code practices'
          ],
          color: '#ff6d00',
          accentColor: '#dd2c00',
          icon: '🔥'
        }
      ]
    },
    {
      year: '2026',
      displayYear: '2026 (Present)',
      eraTitle: 'Studio Founder & Debut Game: "Zen Fourier"',
      headline: 'Olai Digital Studios & Original Flagship Release',
      company: 'Olai Digital Studios',
      role: 'Founder & Game Director',
      location: 'Chennai, India',
      summary: 'Founded Olai Digital Studios to create innovative, artistically evocative, and intellectually stimulating games. Leading the development of debut title "Zen Fourier".',
      badge: '🚀 FOUNDER & INDIE',
      accentColor: '#ff007f',
      secondaryColor: '#00e5ff',
      techKeywords: ['Olai Digital Studios', 'Zen Fourier', 'Harmonic Physics', 'Procedural Audio', 'Indie Dev'],
      projects: [
        {
          id: 'zen-fourier',
          title: 'Zen Fourier',
          subtitle: 'Flagship Debut Indie Title',
          role: 'Game Creator & Director',
          company: 'Olai Digital Studios',
          period: '2026',
          description: 'A mesmerizing harmonic puzzle-adventure where players manipulate frequency waveforms, Fourier transforms, and resonant acoustic physics to heal a shattered universe.',
          techStack: ['Unity / Custom Engine', 'DSP Audio Synthesis', 'Fourier Math FX', 'Dynamic Shaders', 'Acoustic Optics'],
          badge: '🌟 Flagship Game',
          highlights: [
            'Innovative core mechanic: Transform complex sound waves into navigable 3D geometric pathways',
            'Dynamic procedural soundtrack composed in real-time by player puzzle solving',
            'Minimalist glowing neon/zen aesthetic powered by custom mathematical compute shaders'
          ],
          color: '#ff007f',
          accentColor: '#d500f9',
          icon: '🌌',
          linkText: 'Explore Zen Fourier',
          linkUrl: 'https://github.com/DhineshMoorthy-gamedev'
        },
        {
          id: 'olai-digital-studios',
          title: 'Olai Digital Studios',
          subtitle: 'Independent Game & XR Venture',
          role: 'Founder',
          company: 'Olai Digital Studios',
          period: '2026 - Future',
          description: 'An independent creative studio pushing the boundaries of interactive storytelling, acoustic gameplay mechanics, and next-generation WebXR experiences.',
          techStack: ['Game Design', 'WebXR / 8th Wall', 'Interactive Art', 'Studio Direction'],
          badge: '🚀 Studio Leadership',
          highlights: [
            'Pioneering mathematical-philosophical gaming genres',
            'Developing cross-platform WebAR / PC / Console titles',
            'Championing indie innovation from India to global players'
          ],
          color: '#00e5ff',
          accentColor: '#00b0ff',
          icon: '👑',
          linkText: 'Studio GitHub',
          linkUrl: 'https://github.com/DhineshMoorthy-gamedev'
        }
      ]
    }
  ]
};
