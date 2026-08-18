import { SetMetadata } from '@nestjs/common';

export const CHECK_PRODUCTION_KEY = 'check_production';
export const CheckProduction = (check = true) => SetMetadata(CHECK_PRODUCTION_KEY, check);
