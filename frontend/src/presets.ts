import type { Profile } from './types'

export interface Preset {
  name: string
  hint: string
  profile: Profile
}

export const PRESETS: Preset[] = [
  {
    name: 'Fresher Dev',
    hint: '0 yrs · Bangalore',
    profile: {
      experience_years: 0,
      education: "Bachelor's",
      job_title: 'Software Engineer',
      city: 'Bangalore',
      company_size: 'Startup',
      industry: 'IT Services',
    },
  },
  {
    name: 'Data Scientist',
    hint: '5 yrs · Hyderabad',
    profile: {
      experience_years: 5,
      education: "Master's",
      job_title: 'Data Scientist',
      city: 'Hyderabad',
      company_size: 'MNC',
      industry: 'Fintech',
    },
  },
  {
    name: 'Product Manager',
    hint: '8 yrs · Mumbai',
    profile: {
      experience_years: 8,
      education: "Master's",
      job_title: 'Product Manager',
      city: 'Mumbai',
      company_size: 'Enterprise',
      industry: 'E-commerce',
    },
  },
  {
    name: 'Cloud Architect',
    hint: '12 yrs · Remote',
    profile: {
      experience_years: 12,
      education: "Bachelor's",
      job_title: 'Cloud Architect',
      city: 'Remote',
      company_size: 'MNC',
      industry: 'Product Company',
    },
  },
]
