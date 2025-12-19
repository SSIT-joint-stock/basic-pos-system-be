import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'isUniqueUnitNames', async: false })
export class IsUniqueUnitNamesConstraint
  implements ValidatorConstraintInterface
{
  validate(conversions: any[], args: ValidationArguments) {
    console.log(args);
    if (!conversions || !Array.isArray(conversions)) {
      return true;
    }

    // Lọc ra những item có name
    const names = conversions
      .map((c) => c.name)
      .filter((name) => name && name.trim());

    // Kiểm tra xem có trùng tên không
    const uniqueNames = new Set(names);
    return uniqueNames.size === names.length;
  }

  defaultMessage(args: ValidationArguments) {
    console.log(args);
    return 'Tên đơn vị chuyển đổi bị trùng. Vui lòng thử lại!';
  }
}
