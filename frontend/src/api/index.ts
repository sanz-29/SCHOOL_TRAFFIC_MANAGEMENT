/**
 * GateFlow AI Mock API Client
 * Centralized typed API layer. Can later be pointed to real FastAPI backend.
 */

import {
  School,
  StudentGroup,
  VehicleMixItem,
  DemandProfile,
  PickupZone,
  Constraint,
  CandidateSchedule,
  SimulationRun,
  StressScenarioResult,
  ApprovedPlan,
  ParentNotice,
  GateObservation,
  SimulationEngine,
  ZoneVerificationChecklist
} from '../types';

import {
  initialSchool,
  initialStudentGroups,
  initialVehicleMix,
  initialDemandProfile,
  initialPickupZones,
  initialConstraints,
  initialCandidateSchedules,
  baselineSimulationRun,
  activePlanSimulationRun,
  initialStressTestMatrix,
  initialApprovedPlan,
  initialParentNotice,
  initialGateObservations,
} from './mockData';

// In-memory state holding fixtures
let currentSchool: School = { ...initialSchool };
let currentStudentGroups: StudentGroup[] = JSON.parse(JSON.stringify(initialStudentGroups));
let currentVehicleMix: VehicleMixItem[] = JSON.parse(JSON.stringify(initialVehicleMix));
let currentDemandProfile: DemandProfile = JSON.parse(JSON.stringify(initialDemandProfile));
let currentPickupZones: PickupZone[] = JSON.parse(JSON.stringify(initialPickupZones));
let currentConstraints: Constraint[] = JSON.parse(JSON.stringify(initialConstraints));
let currentCandidateSchedules: CandidateSchedule[] = JSON.parse(JSON.stringify(initialCandidateSchedules));
let currentApprovedPlan: ApprovedPlan = JSON.parse(JSON.stringify(initialApprovedPlan));
let currentParentNotice: ParentNotice = JSON.parse(JSON.stringify(initialParentNotice));
let currentGateObservations: GateObservation[] = JSON.parse(JSON.stringify(initialGateObservations));

// Realistic simulated network latency
const delay = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms));

export const api = {
  // School Metadata
  async getSchool(): Promise<School> {
    await delay();
    return { ...currentSchool };
  },

  async updateSchool(updates: Partial<School>): Promise<School> {
    await delay();
    currentSchool = { ...currentSchool, ...updates };
    return { ...currentSchool };
  },

  // Student Groups
  async getStudentGroups(): Promise<StudentGroup[]> {
    await delay();
    return [...currentStudentGroups];
  },

  async updateStudentGroup(id: string, updates: Partial<StudentGroup>): Promise<StudentGroup> {
    await delay();
    const idx = currentStudentGroups.findIndex(g => g.id === id);
    if (idx !== -1) {
      currentStudentGroups[idx] = { ...currentStudentGroups[idx], ...updates };
      return { ...currentStudentGroups[idx] };
    }
    throw new Error(`Student group ${id} not found`);
  },

  // Vehicle Mix
  async getVehicleMix(): Promise<VehicleMixItem[]> {
    await delay();
    return [...currentVehicleMix];
  },

  async updateVehicleMix(items: VehicleMixItem[]): Promise<VehicleMixItem[]> {
    await delay();
    const total = items.reduce((acc, curr) => acc + curr.percentage, 0);
    if (Math.abs(total - 100) > 0.01) {
      throw new Error(`Vehicle percentages must sum to 100%. Current sum: ${total}%`);
    }
    currentVehicleMix = JSON.parse(JSON.stringify(items));
    return [...currentVehicleMix];
  },

  // Demand Profile
  async getDemandProfile(): Promise<DemandProfile> {
    await delay();
    return JSON.parse(JSON.stringify(currentDemandProfile));
  },

  async updateDemandProfile(updates: Partial<DemandProfile>): Promise<DemandProfile> {
    await delay();
    currentDemandProfile = { ...currentDemandProfile, ...updates };
    return JSON.parse(JSON.stringify(currentDemandProfile));
  },

  // Baseline Diagnosis
  async getBaselineDiagnosis(): Promise<SimulationRun> {
    await delay();
    return JSON.parse(JSON.stringify(baselineSimulationRun));
  },

  // Constraints
  async getConstraints(): Promise<Constraint[]> {
    await delay();
    return JSON.parse(JSON.stringify(currentConstraints));
  },

  async saveConstraints(constraints: Constraint[]): Promise<Constraint[]> {
    await delay(150);
    currentConstraints = JSON.parse(JSON.stringify(constraints));
    return JSON.parse(JSON.stringify(currentConstraints));
  },

  async parseNaturalLanguageConstraints(promptText: string): Promise<{
    ruleDescription: string;
    parsedConstraint: Partial<Constraint>;
    isHard: boolean;
  }> {
    await delay(250);
    const lower = promptText.toLowerCase();

    if (lower.includes('kindergarten') || lower.includes('kg') || lower.includes('pre-primary')) {
      return {
        ruleDescription: 'Identified target group: Kindergarten. Added hard lower bound to start time (>= 08:00 AM).',
        parsedConstraint: {
          name: 'Custom: Kindergarten Safety Floor',
          type: 'fixed_group',
          isHard: true,
          description: 'Kindergarten classes cannot start prior to 08:00 AM based on parent council request.',
          parameters: { targetGroupId: 'grp_kg', earliestStartTime: '08:00' },
          enabled: true,
        },
        isHard: true,
      };
    }

    if (lower.includes('sibling') || lower.includes('brother') || lower.includes('sister')) {
      return {
        ruleDescription: 'Identified family linkage rule: Primary (G1-2) and Junior (G3-5) arrival times bound within 5 min window.',
        parsedConstraint: {
          name: 'Custom: Sibling Convenience Alignment',
          type: 'sibling_alignment',
          isHard: false,
          description: 'Align sibling groups within 5 minutes to prevent parents waiting curbside twice.',
          parameters: { alignedGroupIds: ['grp_p12', 'grp_j35'], maxShiftMinutes: 5 },
          enabled: true,
        },
        isHard: false,
      };
    }

    if (lower.includes('bus') || lower.includes('heavy') || lower.includes('coach')) {
      return {
        ruleDescription: 'Identified zone constraint: Contracted school buses segregated strictly into North Perimeter Loop.',
        parsedConstraint: {
          name: 'Custom: Heavy Bus Arterial Protection',
          type: 'dedicated_bus_zone',
          isHard: true,
          description: 'Prohibit school buses from entering Main Gate Lay-by.',
          parameters: { dedicatedZoneId: 'zone_b' },
          enabled: true,
        },
        isHard: true,
      };
    }

    return {
      ruleDescription: 'Identified general boundary: Maximum group schedule shift restricted to ±10 minutes.',
      parsedConstraint: {
        name: 'Custom: Stricter Routine Boundary (±10m)',
        type: 'max_shift',
        isHard: true,
        description: 'Constrain schedule perturbation to a maximum of 10 minutes shift per grade level.',
        parameters: { maxShiftMinutes: 10 },
        enabled: true,
      },
      isHard: true,
    };
  },

  // Schedule Search
  async searchSchedules(weights: { alpha: number; beta: number } = { alpha: 0.6, beta: 0.4 }): Promise<{
    rawCombinationCount: number;
    feasibleCount: number;
    paretoCandidates: CandidateSchedule[];
    allCandidates: CandidateSchedule[];
    alphaWeightDelay: number;
    betaWeightDisruption: number;
  }> {
    await delay(350);
    // 7 shift steps (-15, -10, -5, 0, +5, +10, +15) ^ 6 student groups = 117,649
    const rawCombinationCount = 117649;
    const feasibleCount = 421;

    // Rescore candidates with alpha & beta
    const scored = currentCandidateSchedules.map(c => {
      // Score = alpha * (jDelay / baselineDelay) + beta * (jDisruption / maxDisruption)
      return { ...c };
    });

    return {
      rawCombinationCount,
      feasibleCount,
      paretoCandidates: scored.filter(c => c.isParetoOptimal),
      allCandidates: scored,
      alphaWeightDelay: weights.alpha,
      betaWeightDisruption: weights.beta,
    };
  },

  // Pickup Zones
  async getPickupZones(): Promise<PickupZone[]> {
    await delay();
    return JSON.parse(JSON.stringify(currentPickupZones));
  },

  async updatePickupZone(zoneId: string, updates: Partial<PickupZone>): Promise<PickupZone> {
    await delay();
    const idx = currentPickupZones.findIndex(z => z.id === zoneId);
    if (idx !== -1) {
      // recalculate capacity if length changed
      const current = currentPickupZones[idx];
      const usableLength = updates.usableLengthMeters ?? current.usableLengthMeters;
      // formula: floor(usableLength / (vehicleLength + gap))
      const avgVehicleLength = 4.6;
      const gap = 1.5;
      const calculatedCapacity = Math.floor(usableLength / (avgVehicleLength + gap));

      currentPickupZones[idx] = {
        ...current,
        ...updates,
        usableLengthMeters: usableLength,
        capacityVehicles: updates.capacityVehicles ?? Math.max(1, calculatedCapacity),
      };
      return { ...currentPickupZones[idx] };
    }
    throw new Error(`Pickup zone ${zoneId} not found`);
  },

  async verifyZoneChecklist(
    zoneId: string,
    checklist: ZoneVerificationChecklist,
    userName = 'Principal / Safety Auditor'
  ): Promise<PickupZone> {
    await delay(120);
    const idx = currentPickupZones.findIndex(z => z.id === zoneId);
    if (idx !== -1) {
      const allPassed =
        checklist.legalAccess &&
        checklist.pedestrianSafety &&
        checklist.emergencyClearance &&
        checklist.lightingAndSignage;

      currentPickupZones[idx] = {
        ...currentPickupZones[idx],
        verificationChecklist: checklist,
        legalSafetyVerified: allPassed,
        verifiedBy: allPassed ? userName : undefined,
        verifiedAt: allPassed ? new Date().toISOString().split('T')[0] : undefined,
      };
      return { ...currentPickupZones[idx] };
    }
    throw new Error(`Pickup zone ${zoneId} not found`);
  },

  // Simulation Runs
  async runSimulation(scheduleId: string, engine: SimulationEngine = 'SUMO'): Promise<SimulationRun> {
    await delay(450);
    if (scheduleId === 'cand_baseline') {
      return JSON.parse(JSON.stringify(baselineSimulationRun));
    }
    const run = JSON.parse(JSON.stringify(activePlanSimulationRun));
    run.engine = engine;
    if (engine === 'Fast model') {
      run.modelVersion = 'FastQueue-Analytical-v3';
      run.metrics.peakQueueVehicles = 11;
      run.metrics.waitP95Minutes = 2.9;
    }
    return run;
  },

  // Stress Tests
  async getStressTests(): Promise<StressScenarioResult[]> {
    await delay();
    return JSON.parse(JSON.stringify(initialStressTestMatrix));
  },

  // Plan Comparison & Approval
  async getApprovedPlan(): Promise<ApprovedPlan> {
    await delay();
    return JSON.parse(JSON.stringify(currentApprovedPlan));
  },

  async approvePlan(
    planId: string,
    principalNotes: string,
    checklistConfirmed: boolean,
    approverName = 'Dr. Revathy Soundararajan (Principal)'
  ): Promise<ApprovedPlan> {
    await delay(300);
    currentApprovedPlan = {
      ...currentApprovedPlan,
      status: 'approved',
      principalConfirmation: checklistConfirmed,
      principalNotes: principalNotes || currentApprovedPlan.principalNotes,
      approvedBy: approverName,
      approvedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };
    return JSON.parse(JSON.stringify(currentApprovedPlan));
  },

  // Parent Notice
  async getParentNotice(): Promise<ParentNotice> {
    await delay();
    return JSON.parse(JSON.stringify(currentParentNotice));
  },

  async updateParentNotice(updates: Partial<ParentNotice>): Promise<ParentNotice> {
    await delay();
    currentParentNotice = { ...currentParentNotice, ...updates };
    return JSON.parse(JSON.stringify(currentParentNotice));
  },

  async releaseParentNotice(noticeId: string): Promise<ParentNotice> {
    await delay(250);
    currentParentNotice = {
      ...currentParentNotice,
      isReleased: true,
      releasedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };
    currentApprovedPlan.status = 'released_to_parents';
    return JSON.parse(JSON.stringify(currentParentNotice));
  },

  // Gate Observations (Follow-up)
  async getGateObservations(): Promise<GateObservation[]> {
    await delay();
    return JSON.parse(JSON.stringify(currentGateObservations));
  },

  async recordGateObservation(
    data: Omit<GateObservation, 'id' | 'timestamp' | 'isAnomaly'>
  ): Promise<GateObservation> {
    await delay(180);
    const isAnomaly =
      data.observedCount < data.predictedExpectedMin ||
      data.observedCount > data.predictedExpectedMax;

    const newObs: GateObservation = {
      id: `obs_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      isAnomaly,
      ...data,
    };
    currentGateObservations = [newObs, ...currentGateObservations];
    return { ...newObs };
  },

  // Reset demo fixture
  async resetDemoScenario(): Promise<void> {
    await delay(100);
    currentSchool = { ...initialSchool };
    currentStudentGroups = JSON.parse(JSON.stringify(initialStudentGroups));
    currentVehicleMix = JSON.parse(JSON.stringify(initialVehicleMix));
    currentDemandProfile = JSON.parse(JSON.stringify(initialDemandProfile));
    currentPickupZones = JSON.parse(JSON.stringify(initialPickupZones));
    currentConstraints = JSON.parse(JSON.stringify(initialConstraints));
    currentCandidateSchedules = JSON.parse(JSON.stringify(initialCandidateSchedules));
    currentApprovedPlan = JSON.parse(JSON.stringify(initialApprovedPlan));
    currentParentNotice = JSON.parse(JSON.stringify(initialParentNotice));
    currentGateObservations = JSON.parse(JSON.stringify(initialGateObservations));
  },
};
