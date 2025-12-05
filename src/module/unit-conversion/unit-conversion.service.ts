import { Injectable } from '@nestjs/common';
import { CreateUnitConversionDto } from './dto/create-unit-conversion.dto';
import { UpdateUnitConversionDto } from './dto/update-unit-conversion.dto';

@Injectable()
export class UnitConversionService {
  create(createUnitConversionDto: CreateUnitConversionDto) {
    return 'This action adds a new unitConversion';
  }

  findAll() {
    return `This action returns all unitConversion`;
  }

  findOne(id: number) {
    return `This action returns a #${id} unitConversion`;
  }

  update(id: number, updateUnitConversionDto: UpdateUnitConversionDto) {
    return `This action updates a #${id} unitConversion`;
  }

  remove(id: number) {
    return `This action removes a #${id} unitConversion`;
  }
}
