import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UnitConversionService } from './unit-conversion.service';
import { CreateUnitConversionDto } from './dto/create-unit-conversion.dto';
import { UpdateUnitConversionDto } from './dto/update-unit-conversion.dto';

@Controller('unit-conversion')
export class UnitConversionController {
  constructor(private readonly unitConversionService: UnitConversionService) {}

  @Post()
  create(@Body() createUnitConversionDto: CreateUnitConversionDto) {
    return this.unitConversionService.create(createUnitConversionDto);
  }

  @Get()
  findAll() {
    return this.unitConversionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.unitConversionService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUnitConversionDto: UpdateUnitConversionDto) {
    return this.unitConversionService.update(+id, updateUnitConversionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.unitConversionService.remove(+id);
  }
}
