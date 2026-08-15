import { SetMetadata } from '@nestjs/common';

export const CHECK_PRODUCTION_KEY = 'check_production';
export const CheckProduction = () => SetMetadata(CHECK_PRODUCTION_KEY, true);
