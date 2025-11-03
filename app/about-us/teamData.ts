export interface TeamMember {
  id: string;
  name: string;
  role: string;
  description: string;
  photo: string;
  linkedin?: string;
  email?: string;
}

export const teamData: TeamMember[] = [
  {
    id: "1",
    name: "Aphrodite Mirafuentes",
    role: "Project Manager",
    description: "As the Project Manager and Group Leader, I took charge of overseeing our project's progress and ensuring that every task was completed efficiently. I closely monitored all revisions, whether in the documentation and research paper or in the backend and frontend development of the system. Through consistent communication and coordination, I made sure that our team stayed aligned and that the project met our goals and standards.",
    photo: "/images/about-us/Aprodhite-Mirafuentes.svg",
    linkedin: "https://linkedin.com/in/aphrodite-mirafuentes",
    email: "aphrodite@harvesthub.ph"
  },
  {
    id: "2",
    name: "Raymond Bautista",
    role: "Full Stack Developer",
    description: "I worked on both the frontend and backend features of the project, ensuring that each component functioned efficiently and aligned with the system's overall design. I also took charge of deployments and server management to maintain smooth operation and reliability. Additionally, I helped design the platform's look and feel, focusing on simplicity and ease of use to provide an intuitive experience for users.",
    photo: "/images/about-us/Raymond-Bautista.svg",
    linkedin: "https://linkedin.com/in/raymond-bautista",
    email: "raymond@harvesthub.ph"
  },
  {
    id: "3",
    name: "Albert Jeck Santos",
    role: "Full Stack Developer",
    description: "I contributed to both the frontend and backend development of the system, helping ensure a responsive and efficient user experience. I also managed version control using Git and GitHub, maintaining an organized workflow for code collaboration and deployment across the team. Through these efforts, I supported smooth development processes and consistent project progress.",
    photo: "/images/about-us/Albert-Jeck-Santos.svg",
    linkedin: "https://linkedin.com/in/albert-santos",
    email: "albert@harvesthub.ph"
  },
  {
    id: "4",
    name: "Arcel Espiritu",
    role: "UI/UX Designer",
    description: "I focused on designing intuitive and visually engaging user interfaces that ensured a seamless experience across the platform. My work emphasized balancing aesthetics and usability, maintaining a clean, consistent, and easy-to-navigate design that enhanced overall user satisfaction.",
    photo: "/images/about-us/Arcel-Espiritu.svg",
    linkedin: "https://linkedin.com/in/arcel-espiritu",
    email: "arcel@harvesthub.ph"
  },
  {
    id: "5",
    name: "Emil John Vieron",
    role: "Documentation",
    description: "As a Documentation Assistant and UI Support Member, I contributed to maintaining the project's documentation, ensuring that all records were accurate and up to date. I also provided occasional support in UI design tasks, assisting in refining the design and improving the user experience. Through attention to detail and collaboration with the development team, I helped uphold the project's quality and consistency.",
    photo: "/images/about-us/Emil-John-Vieron.svg",
    linkedin: "https://linkedin.com/in/emil-vilaron",
    email: "emil@harvesthub.ph"
  },
  {
    id: "6",
    name: "Julius Robert Cadalso Alag",
    role: "Documentation",
    description: "As part of the documentation team, I contributed to organizing and maintaining the project's records, ensuring that all information was clearly presented and up to date. I also helped ensure consistency across project files by reviewing content and aligning it with established formats and standards. Through these efforts, I supported the team in maintaining a cohesive and reliable documentation system.",
    photo: "/images/about-us/Julius-Robert-Cadalso-Alag.svg",
    linkedin: "https://linkedin.com/in/julius-alag",
    email: "julius@harvesthub.ph"
  },
  {
    id: "7",
    name: "Jimboy Beriño",
    role: "Documentation",
    description: "As a Supporting Member of the team, I provided basic assistance in maintaining project documentation, helping ensure that important details were properly recorded and organized. I also contributed small but meaningful inputs during the design process, offering ideas that supported the team's creative direction. Through collaboration and willingness to assist, I played a part in enhancing both the project's organization and overall design quality.",
    photo: "/images/about-us/Jimboy-Berino.svg",
    linkedin: "https://linkedin.com/in/jimboy-berido",
    email: "jimboy@harvesthub.ph"
  }
];

export const companyStory = {
  mission: "Bridging Farmers to Buyers",
  subtitle: "Empowering local farmers through digital connection and fair trade",
  story: `HarvestHub was born out of a simple yet transformative vision: to create a direct bridge between hardworking farmers and conscious consumers. Founded by agricultural professionals who witnessed firsthand the challenges faced by small-scale farmers in accessing fair markets, we set out to build more than just a platform—we built a community.

From fruit farmers struggling to compete with industrial operations to dedicated buyers seeking fresh, locally-sourced produce, our digital marketplace creates meaningful connections that benefit everyone involved in the agricultural ecosystem.

Today, HarvestHub continues to grow as a beacon of hope for sustainable agriculture, fair trade practices, and community empowerment throughout the Philippines.`,
  
  timeline: [
    {
      phase: "Concept",
      description: "Identified the gap between farmers and direct market access"
    },
    {
      phase: "Development", 
      description: "Built the platform with farmer-first design principles"
    },
    {
      phase: "Launch",
      description: "Connected our first farming communities with local buyers"
    }
  ],

  values: [
    {
      title: "Problem",
      icon: "⚠️",
      description: "Small-scale farmers struggle with market access, fair pricing, and direct buyer connections, often relying on middlemen who reduce their profits."
    },
    {
      title: "Vision", 
      icon: "🌱",
      description: "Creating direct pathways between farmers and buyers through technology, ensuring fair compensation and fresh produce for all."
    },
    {
      title: "Academic Purpose",
      icon: "🎓", 
      description: "Demonstrating how digital platforms can solve real-world agricultural challenges while supporting sustainable farming communities."
    }
  ]
};