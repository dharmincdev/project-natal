export const APP_CONFIG = {
  name: 'Project Natal',
  shortName: 'Natal',
  description: 'Build, visualize, and share interactive family trees with AI.',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  slug: 'project-natal',
  themeColor: '#18181b',
  backgroundColor: '#ffffff',
} as const;
