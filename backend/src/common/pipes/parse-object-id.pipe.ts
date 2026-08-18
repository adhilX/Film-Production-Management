import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';

@Injectable()
export class ParseObjectIdPipe implements PipeTransform<any, any> {
  constructor(private readonly errorMessage?: string) {}

  transform(value: any): any {
    if (value === undefined || value === null || value === '') {
      return value;
    }
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException(this.errorMessage || 'Invalid ID format');
    }
    return value;
  }
}
