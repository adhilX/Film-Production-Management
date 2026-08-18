import { projectService } from '@/features/projects/services/project.service';
import { locationService } from '@/features/locations/services/location.service';
import { fundsService } from '@/features/funds/services/funds.service';
import { castCrewService } from '@/features/cast-crew/services/cast-crew.service';

export const productionsService = {
  // Productions
  getProductions: projectService.getProductions.bind(projectService),
  createProduction: projectService.createProduction.bind(projectService),
  updateProduction: projectService.updateProduction.bind(projectService),
  getEligibleManagers: projectService.getEligibleManagers.bind(projectService),

  // Locations (backward-compatibility fallback for old code if any)
  getLocations: locationService.getLocations.bind(locationService),
  createLocation: locationService.createLocation.bind(locationService),
  updateLocationStatus: locationService.updateBookingStatus.bind(locationService),

  // Funds (backward-compatibility fallback for old code if any)
  getFunds: fundsService.getFundRequests.bind(fundsService),
  createFundRequest: fundsService.createFundRequest.bind(fundsService),
  updateFundStatus: fundsService.updateFundRequest.bind(fundsService),

  // Characters
  getCharacters: castCrewService.getCharacters.bind(castCrewService),
  createCharacter: castCrewService.createCharacter.bind(castCrewService),
  updateCharacter: castCrewService.updateCharacter.bind(castCrewService),
  deleteCharacter: castCrewService.deleteCharacter.bind(castCrewService),

  // Cast & Crew
  getCastCrew: castCrewService.getCastCrew.bind(castCrewService),
  assignCastCrew: castCrewService.assignCastCrew.bind(castCrewService),
  updateCastCrew: castCrewService.updateCastCrew.bind(castCrewService),
  removeCastCrew: castCrewService.removeCastCrew.bind(castCrewService),
  getEligibleCast: castCrewService.getEligibleCast.bind(castCrewService),
  getEligibleCrew: castCrewService.getEligibleCrew.bind(castCrewService),
};

export default productionsService;
