import { fundsService as newFundsService } from '@/features/funds/services/funds.service';

export const fundsService = {
  getBudget: newFundsService.getBudget.bind(newFundsService),
  updateBudget: newFundsService.updateBudget.bind(newFundsService),
  getFundRequests: newFundsService.getFundRequests.bind(newFundsService),
  getFundRequest: newFundsService.getFundRequest.bind(newFundsService),
  createFundRequest: newFundsService.createFundRequest.bind(newFundsService),
  updateFundRequest: newFundsService.updateFundRequest.bind(newFundsService),
  approveFundRequest: newFundsService.approveFundRequest.bind(newFundsService),
  rejectFundRequest: newFundsService.rejectFundRequest.bind(newFundsService),
  cancelFundRequest: newFundsService.cancelFundRequest.bind(newFundsService),
};

export default fundsService;
