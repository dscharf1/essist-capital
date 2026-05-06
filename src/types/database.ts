/**
 * Essist Capital — TypeScript types for all Supabase tables
 */

export type BorrowerType = 'individual' | 'llc';
export type ApplicationStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'funded' | 'closed';
export type CardStatus = 'inactive' | 'active' | 'frozen' | 'closed';
export type PaymentPhase = 'draw_period' | 'repayment';
export type PaymentType = 'interest_only' | 'principal_and_interest';
export type PaymentStatus = 'scheduled' | 'paid' | 'late' | 'missed';
export type DocumentType = 'id' | 'proof_of_income' | 'property_deed' | 'contractor_quote' | 'other';
export type PropertyType = 'single_family' | 'multi_family' | 'condo' | 'mixed_use';
export type ProjectType = 'kitchen' | 'bathroom' | 'roof' | 'hvac' | 'windows' | 'flooring' | 'outdoor' | 'other';

export interface Profile {
  id: string;
  user_id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  date_of_birth: string | null;
  borrower_type: BorrowerType | null;
  llc_name: string | null;
  ein: string | null;
  years_in_business: number | null;
  avatar_url?: string | null;
  created_at: string;
}

export interface Application {
  id: string;
  user_id: string;
  borrower_type: BorrowerType;
  loan_amount: number;
  term_months: number;
  monthly_payment: number;
  total_repayment: number;
  origination_fee: number;
  finance_charge: number;
  apr: number;
  project_type: ProjectType;
  project_description: string | null;
  property_address: string;
  property_city: string;
  property_state: string;
  property_zip: string;
  property_type: PropertyType;
  contractor_name: string | null;
  llc_name: string | null;
  ein: string | null;
  status: ApplicationStatus;
  tila_accepted: boolean;
  tila_accepted_at: string | null;
  esignature_text: string | null;
  esignature_timestamp: string | null;
  payment_type: PaymentType;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface VirtualCard {
  id: string;
  application_id: string;
  user_id: string;
  card_number: string | null;
  card_last_four: string;
  card_expiry_month: number;
  card_expiry_year: number;
  card_cvv: string | null;
  credit_limit: number;
  available_balance: number;
  drawn_amount: number;
  card_status: CardStatus;
  payment_phase: PaymentPhase;
  repayment_started_at: string | null;
  baselane_account_name: string | null;
  billing_zip: string | null;
  issued_at: string;
  updated_at: string;
}

export interface CardTransaction {
  id: string;
  virtual_card_id: string;
  application_id: string;
  user_id: string;
  transaction_date: string;
  merchant_name: string;
  amount: number;
  category: string | null;
  notes: string | null;
  created_at: string;
}

export interface Payment {
  id: string;
  application_id: string;
  user_id: string;
  payment_number: number;
  due_date: string;
  amount_due: number;
  amount_paid: number | null;
  status: PaymentStatus;
  paid_at: string | null;
  created_at: string;
}

export interface ContractorLead {
  id: string;
  name: string;
  company_name: string | null;
  phone: string;
  email: string;
  license_number: string | null;
  service_area: string | null;
  years_in_business: number | null;
  referral_count: number;
  created_at: string;
}

export interface Document {
  id: string;
  application_id: string;
  user_id: string;
  document_type: DocumentType;
  file_url: string;
  file_name: string;
  uploaded_at: string;
  verified: boolean | null;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  admin_user_id: string;
  action_type: string;
  target_table: string;
  target_id: string;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}
