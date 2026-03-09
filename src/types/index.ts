export interface IJob {
  _id: string;
  JobID: string;
  JobTitle: string;
  Company: string;
  Location: string;
  ApplicationURL: string;
  PostedDate: string | null;
  Description: string; // The backend scrapes this now
  GermanRequired?: boolean;
  thumbStatus?: 'up' | 'down' | null;
  Department?: string;
  ContractType?: string;
  sourceSite?: string;
  Status?: 'pending_review' | 'active' | 'rejected';
  ConfidenceScore: number;
  scrapedAt?: string;
}

export interface ICompany {
  _id?: string;
  companyName: string;
  openRoles: number;
  cities: string[];
  domain: string;
  source: 'scraped' | 'manual';
  logo?: string;
  industry?: string;
}