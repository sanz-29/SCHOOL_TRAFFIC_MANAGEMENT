/**
 * Core Data Types for GateFlow AI
 */

export type UserRole = 'principal' | 'transport_coordinator' | 'gate_staff' | 'parent';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  title: string;
  department: string;
}

export interface UserSession {
  user: AuthUser;
  token: string;
  expiresAt: number; // timestamp in ms
}

export type DataSource = 'Observed' | 'Synthetic' | 'Assumed';

export type SimulationEngine = 'Fast model' | 'SUMO' | 'Fallback simulator';

export type VehicleType = 'two_wheeler' | 'car' | 'auto_rickshaw' | 'school_bus' | 'van';

export interface VehicleMixItem {
  type: VehicleType;
  label: string;
  percentage: number;
  avgOccupancy: number; // students per vehicle
  vehicleLengthMeters: number;
  safetyGapMeters: number;
  typicalDwellSeconds: number;
}

export interface StudentGroup {
  id: string;
  name: string;
  gradeBand: string;
  studentCount: number;
  baselineArrival: string; // e.g. "07:50"
  baselineDeparture: string; // e.g. "14:15"
  permittedShiftMin: number; // e.g. -15
  permittedShiftMax: number; // e.g. +15
  assignedZoneId: string;
  isFixed?: boolean;
  siblingPriority?: boolean;
}

export interface TimeBinDemand {
  binLabel: string; // e.g. "07:45 - 07:50"
  startTime: string; // "07:45"
  twoWheelerArrivals: number;
  carArrivals: number;
  autoArrivals: number;
  busArrivals: number;
  vanArrivals: number;
  totalVehicles: number;
}

export interface DwellTimeDistribution {
  vehicleType: VehicleType;
  minSeconds: number;
  typicalSeconds: number;
  maxSeconds: number;
}

export interface DemandProfile {
  id: string;
  source: DataSource;
  dateCollected?: string;
  sampleLocation: string;
  bins: TimeBinDemand[];
  dwellDistributions: DwellTimeDistribution[];
  uncertaintyBandPct: number; // +/- % band
}

export type ConstraintType = 
  | 'fixed_group' 
  | 'max_shift' 
  | 'sibling_alignment' 
  | 'earliest_latest_start' 
  | 'dedicated_bus_zone';

export interface Constraint {
  id: string;
  name: string;
  type: ConstraintType;
  isHard: boolean; // Hard constraints cannot be traded away
  description: string;
  enabled: boolean;
  parameters: {
    targetGroupId?: string;
    maxShiftMinutes?: number;
    earliestStartTime?: string;
    latestStartTime?: string;
    alignedGroupIds?: string[];
    dedicatedZoneId?: string;
  };
  violated?: boolean;
  violationDetails?: string;
}

export interface CandidateSchedule {
  id: string;
  name: string;
  tag: 'Minimal change' | 'Balanced' | 'Congestion-focused' | 'Keep as is' | 'Experimental' | 'Infeasible';
  offsetsPerGroup: Record<string, number>; // groupId -> shift in minutes (e.g. -10, 0, +5)
  jDelay: number; // sum of Q_t * dt (vehicle-minutes)
  jDisruption: number; // sum of N_g * |shift_g| (student-minutes)
  isFeasible: boolean;
  infeasibilityReason?: string;
  isParetoOptimal: boolean;
  peakQueue: number; // vehicles
  waitP95: number; // minutes
  spillbackMinutes: number; // minutes queue exceeds gate bay
  zoneViolations: number; // instances of over-capacity
  simulatedReductionVsBaselinePct: number; // 100 * (Baseline - Candidate) / Baseline
  engineUsed: SimulationEngine;
}

export interface ZoneVerificationChecklist {
  legalAccess: boolean;
  pedestrianSafety: boolean;
  emergencyClearance: boolean;
  lightingAndSignage: boolean;
}

export interface PickupZone {
  id: string;
  name: string;
  code: string;
  description: string;
  lat: number;
  lng: number;
  usableLengthMeters: number;
  allowedVehicleTypes: VehicleType[];
  capacityVehicles: number; // floor(usableLength / (vehicleLength + gap))
  assignedVehicleCount: number;
  isOverCapacity: boolean;
  legalSafetyVerified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  verificationChecklist: ZoneVerificationChecklist;
}

export interface TimeSeriesPoint {
  time: string;
  queueExisting: number;
  queueCandidate: number;
  inflowRate: number;
  outflowRate: number;
  spillbackThreshold: number;
}

export interface WaitDistributionPoint {
  waitRange: string;
  existingPct: number;
  candidatePct: number;
}

export interface SimulationRun {
  runId: string;
  scenarioName: string;
  seed: number;
  modelVersion: string;
  engine: SimulationEngine;
  dataSource: DataSource;
  simulatedTimestamp: string;
  metrics: {
    peakQueueVehicles: number;
    waitP95Minutes: number;
    totalDelayVehicleMinutes: number;
    spillbackMinutes: number;
    zoneViolations: number;
    simulatedReductionVsBaselinePct: number;
  };
  timeSeries: TimeSeriesPoint[];
  waitDistribution: WaitDistributionPoint[];
  mismatchWithSumo?: {
    hasMismatch: boolean;
    differenceDescription: string;
    recommendedModel: 'SUMO';
  };
}

export interface StressScenarioResult {
  conditionId: string;
  conditionName: string;
  description: string;
  demandFactor: number; // 1.0 = normal, 1.3 = +30%
  stopTimeFactor: number;
  complianceRate: number; // 1.0 = 100%, 0.6 = 60%
  meanQueue: number;
  p95Wait: number;
  worstCaseQueue: number;
  isFragile: boolean;
  fragilityReason?: string;
}

export interface ApprovedPlan {
  id: string;
  candidateScheduleId: string;
  planName: string;
  approvedBy: string;
  approvedByRole: 'principal';
  approvedAt: string;
  status: 'draft' | 'approved' | 'released_to_parents';
  principalConfirmation: boolean;
  principalNotes: string;
  effectiveDate: string;
  scheduleMap: Record<string, {
    groupName: string;
    shiftMinutes: number;
    newArrival: string;
    newDeparture: string;
    assignedZoneName: string;
    zoneCode: string;
  }>;
}

export interface ParentNoticeGroupItem {
  groupId: string;
  groupName: string;
  gradeBand: string;
  dropoffWindow: string;
  pickupWindow: string;
  zoneName: string;
  gateInstructions: string;
}

export interface ParentNotice {
  id: string;
  approvedPlanId: string;
  schoolName: string;
  effectiveDate: string;
  principalName: string;
  contactEmail: string;
  contactPhone: string;
  language: 'en' | 'ta';
  introTitleEn: string;
  introTitleTa: string;
  introMessageEn: string;
  introMessageTa: string;
  groups: ParentNoticeGroupItem[];
  safetyGuidelinesEn: string[];
  safetyGuidelinesTa: string[];
  isReleased: boolean;
  releasedAt?: string;
  verifierReport: {
    groupId: string;
    timeMatched: boolean;
    zoneMatched: boolean;
    overallPass: boolean;
    message: string;
  }[];
}

export interface GateObservation {
  id: string;
  timestamp: string;
  timeBin: string;
  vehicleType: VehicleType;
  observedCount: number;
  predictedExpectedMin: number;
  predictedExpectedMax: number;
  recordedBy: string;
  notes?: string;
  isAnomaly: boolean;
}

export interface School {
  id: string;
  name: string;
  tagline: string;
  address: string;
  gateCount: number;
  gateSideCapacity: number; // vehicles
  lat: number;
  lng: number;
  studentCountTotal: number;
}
