import { NextResponse } from 'next/server';

// Placeholder in-memory data. Later wire to backend store or file.
const sampleJobs = [
  {
    id: '1',
    title: 'LinkedIn Campaign Marketing Specialist for Legal Tech Suite',
    description: 'We are on the lookout for an adept LinkedIn Marketing Specialist to spearhead a dynamic LinkedIn campaign for our suite of legal tech solutions, including WordPress-based websites for law firms (lawyersites.io), AI chatbots for law firms (lawyerbot.co), and our comprehensive marketing platform. This role demands a professional who can seamlessly blend strategic marketing acumen with hands-on execution to drive lead generation and brand awareness in the competitive legal technology space.',
    score: 0.85,
    posted: '4 minutes ago',
    url: '#',
    budget: '$8.00 - $25.00',
    duration: 'Less than 1 month, Less than 30 hrs/week',
    experienceLevel: 'intermediate',
    skills: ['Social Media Account Setup', 'LinkedIn Campaign Manager', 'LinkedIn', 'LinkedIn Development', 'Lead Generation'],
    client: {
      rating: 5.0,
      location: 'United States',
      verified: true,
      totalSpent: '$10K+',
      paymentVerified: true
    },
    proposals: 15,
    aboveThreshold: true
  },
  {
    id: '2',
    title: 'Python Selenium Web Scraper for E-commerce Data',
    description: 'Looking for an experienced Python developer to build a robust web scraping solution using Selenium. The scraper should extract product information, pricing, and availability from multiple e-commerce websites. Must handle dynamic content, CAPTCHA challenges, and implement proper rate limiting. Experience with proxy rotation and anti-detection techniques required.',
    score: 0.92,
    posted: '18 minutes ago',
    url: '#',
    budget: '$30.00 - $60.00',
    duration: '1 to 3 months',
    experienceLevel: 'expert',
    skills: ['Python', 'Selenium', 'Web Scraping', 'Data Mining', 'API Development'],
    client: {
      rating: 4.8,
      location: 'Canada',
      verified: true,
      totalSpent: '$50K+',
      paymentVerified: true
    },
    proposals: 8,
    aboveThreshold: true
  },
  {
    id: '3',
    title: 'N8N Automation Workflow Development',
    description: 'Need an n8n expert to create complex automation workflows connecting various SaaS tools including Salesforce, HubSpot, Slack, and custom APIs. The workflows should handle lead routing, data synchronization, and automated reporting. Experience with webhooks, error handling, and workflow optimization essential.',
    score: 0.78,
    posted: '1 hour ago',
    url: '#',
    budget: '$25.00 - $45.00',
    duration: '1 to 3 months',
    experienceLevel: 'intermediate',
    skills: ['n8n', 'API Integration', 'Automation', 'Webhook Development', 'SaaS Integration'],
    client: {
      rating: 4.9,
      location: 'United Kingdom',
      verified: true,
      totalSpent: '$25K+',
      paymentVerified: true
    },
    proposals: 12,
    aboveThreshold: true
  },
  {
    id: '4',
    title: 'React Dashboard with Real-time Analytics',
    description: 'Build a modern React dashboard for business analytics with real-time data visualization. Should include charts, KPIs, filtering capabilities, and responsive design. Integration with REST APIs and WebSocket for live updates required.',
    score: 0.45,
    posted: '2 hours ago',
    url: '#',
    budget: '$20.00 - $35.00',
    duration: '1 to 3 months',
    experienceLevel: 'intermediate',
    skills: ['React', 'JavaScript', 'Data Visualization', 'Chart.js', 'API Integration'],
    client: {
      rating: 4.2,
      location: 'Australia',
      verified: false,
      totalSpent: '$5K+',
      paymentVerified: true
    },
    proposals: 25,
    aboveThreshold: false
  }
];

export async function GET() {
  return NextResponse.json({ jobs: sampleJobs });
}
