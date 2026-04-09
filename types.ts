
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin'
}

export enum EventState {
  DISCOVERED = 'DISCOVERED',
  REVIEWED = 'REVIEWED',
  SCHEDULED = 'SCHEDULED',
  CONTACTED = 'CONTACTED',
  PROPOSAL_SENT = 'PROPOSAL_SENT',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED'
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  organization?: string;
  role: UserRole;
  isActive: boolean;
  isVisible: boolean;
  interests: string[];
  savedEventIds: string[];
  createdAt: string;
}

export interface MarketingStrategy {
  marketing_steps: string[];
  recommended_materials: string[];
  engagement_idea: string;
  expected_outcome: string;
}

export interface Event {
  id: string;
  title: string;          // Maps from event_name
  description: string;    // Maps from event_description
  date: string;           // Maps from date_time
  location: string;       // Maps from venue
  locationCity?: string;  // Maps from location_city

  category?: string;      // Maps from event_category
  whyItMattersForIworth?: string; // Maps from why_it_matters_for_iworth
  iworthVertical?: string; // Maps from iWorth_vertical

  marketingStrategy?: MarketingStrategy | null;

  // Lead Tracking Metrics
  contactsCollected: number;
  demosGiven: number;
  salesClosed: number;
  partnershipsStarted: number;
  competitorsDetected: string[];

  organizer?: string | null;
  opportunityType?: string | null;
  sourceUrl?: string | null;
  sourceSite?: string | null;
  suggestedAction?: string | null;
  actionTaken?: boolean;
  proposalSent?: boolean;
  proposalAccepted?: boolean;
  dealWon?: boolean;
  estimatedValue?: number | null;
  outcomeNotes?: string | null;

  contactsPotential?: number | null;
  partnershipPotential?: string | null;
  riskLevel?: string | null;
  competitionPresence?: string | null;
  actionPlan?: any | null;

  state: EventState;
  priorityScore: number; // 1-10
  tags: string[];
  conflictStatus: boolean;
  geolocation?: { lat: number; lon: number } | null;
  imageUrl?: string | null;
  createdBy: string; // ID or 'AI_AGENT'
  publishedBy?: string;
  publishedAt?: string;
  rawSource?: string;
}

export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  isRead: boolean;
}

export interface ScraperLog {
  id: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  eventsFound: number;
}
