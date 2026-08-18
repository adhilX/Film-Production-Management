import { costumeService } from '@/features/costumes/services/costume.service';

export const costumesService = {
  getCostumes: costumeService.getCostumes.bind(costumeService),
  getCostume: costumeService.getCostume.bind(costumeService),
  createCostume: costumeService.createCostume.bind(costumeService),
  updateCostume: costumeService.updateCostume.bind(costumeService),
  deleteCostume: costumeService.deleteCostume.bind(costumeService),
  getAssignments: costumeService.getAssignments.bind(costumeService),
  assignCostume: costumeService.assignCostume.bind(costumeService),
  returnCostume: costumeService.returnCostume.bind(costumeService),
};

export default costumesService;
