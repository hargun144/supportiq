export type CustomerTier = 'free' | 'premium' | 'enterprise';
export type AgentSpecialty = 'billing' | 'technical' | 'complaint' | 'general';
export type TicketChannel = 'email' | 'chat' | 'phone' | 'social';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'escalated';
export type TicketCategory = 'billing' | 'technical' | 'complaint' | 'general';
export type UserRole = 'admin' | 'agent';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
}

export interface Customer {
  id: number;
  name: string;
  email: string;
  tier: CustomerTier;
  created_at: string;
}

export interface Agent {
  id: number;
  name: string;
  specialty: AgentSpecialty;
  current_load: number;
}

export interface AuditLog {
  id: number;
  ticket_id?: number;
  action: string;
  details?: any;
  timestamp: string;
}

export interface Ticket {
  id: number;
  customer_id: number;
  agent_id?: number | null;
  channel: TicketChannel;
  message_text: string;
  category?: TicketCategory | null;
  priority_score?: number | null;
  risk_score?: number | null;
  status: TicketStatus;
  sentiment?: string | null;
  first_response_time?: number | null;
  resolution_time?: number | null;
  sla_breached: boolean;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  agent?: Agent | null;
  audit_logs?: AuditLog[];
}

export interface TicketPage {
  tickets: Ticket[];
  total: number;
}

export interface Conversation {
  id: number;
  customer_id: number;
  ticket_id?: number | null;
  channel: TicketChannel;
  message: string;
  sender_type: 'customer' | 'agent' | 'system';
  timestamp: string;
}

export interface InteractionHistory {
  id: number;
  customer_id: number;
  interaction_type: string;
  metadata?: any;
  interaction_metadata?: any;
  timestamp: string;
}

export interface Customer360Context {
  customer_profile: Customer;
  customer_tier: CustomerTier;
  previous_tickets: Ticket[];
  conversations: Conversation[];
  interaction_timeline: InteractionHistory[];
  sentiment_history: { ticket_id: number; sentiment: string; created_at: string }[];
  risk_history: { ticket_id: number; risk_score: number; created_at: string }[];
  unresolved_issues: Ticket[];
}

export interface GenerateResponseOutput {
  suggested_response: string;
  confidence_score: number;
  sources_used: string[];
  reasoning: string;
}

export interface PredictiveRiskResult {
  ticket_id: number;
  escalation_probability: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  risk_factors: string[];
  recommended_action: string;
}

export interface DashboardStats {
  total_tickets: number;
  open_tickets: number;
  resolved_tickets: number;
  escalated_tickets: number;
  avg_priority: number;
  avg_risk: number;
  sla_breached_count: number;
  avg_resolution_time_minutes: number;
  tickets_per_category: Record<string, number>;
  tickets_per_agent: Record<string, number>;
  busiest_agent?: { name: string; current_load: number } | null;
  highest_risk_ticket?: { id: number; customer_name: string; risk_score: number } | null;
}
