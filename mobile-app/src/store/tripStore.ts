import { MobileTripPlan, PlanTripParams } from '../services/api';

// Simple, dependable shared state for the React Native app
class TripStore {
  private currentParams: PlanTripParams | null = null;
  private currentPlans: MobileTripPlan[] = [];
  private selectedPlan: MobileTripPlan | null = null;
  private savedTrips: Array<{
    id: string;
    params: PlanTripParams;
    plan: MobileTripPlan;
    savedAt: string;
  }> = [];

  setSearchParams(params: PlanTripParams) {
    this.currentParams = params;
  }

  getSearchParams(): PlanTripParams {
    return this.currentParams || {
      origin: 'Delhi',
      destination: 'Goa',
      departureDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      travelers: 2,
      budget: 25000,
      tripType: 'tour',
      transportation: ['flights', 'trains'],
    };
  }

  setPlans(plans: MobileTripPlan[]) {
    this.currentPlans = plans;
    if (plans.length > 0) {
      this.selectedPlan = plans[0];
    }
  }

  getPlans(): MobileTripPlan[] {
    return this.currentPlans;
  }

  setSelectedPlan(plan: MobileTripPlan) {
    this.selectedPlan = plan;
  }

  getSelectedPlan(): MobileTripPlan | null {
    return this.selectedPlan;
  }

  saveCurrentTrip(): boolean {
    if (!this.selectedPlan || !this.currentParams) return false;
    const exists = this.savedTrips.some(t => t.plan.id === this.selectedPlan!.id);
    if (!exists) {
      this.savedTrips.unshift({
        id: `saved_${Date.now()}`,
        params: this.currentParams,
        plan: this.selectedPlan,
        savedAt: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      });
    }
    return true;
  }

  getSavedTrips() {
    return this.savedTrips;
  }
}

export const tripStore = new TripStore();
