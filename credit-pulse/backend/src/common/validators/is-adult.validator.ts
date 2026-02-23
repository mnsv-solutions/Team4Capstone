import {
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  registerDecorator,
} from 'class-validator';

/**
 * Custom validation constraint to check whether
 * a given date of birth belongs to an adult (18+).
 */
@ValidatorConstraint({ name: 'isAdult', async: false })
export class IsAdultConstraint implements ValidatorConstraintInterface {
  /**
   * Validates whether the given date of birth corresponds to an applicant being at least 18 years old.
   * Returns false if the date of birth is invalid or if the applicant is less than 18 years old.
   * Returns true if the applicant is at least 18 years old.
   * @param dob - The date of birth of the applicant in the format "YYYY-MM-DD".
   * @param args - The validation arguments.
   */
  validate(dob: string, args: ValidationArguments): boolean {
    // Check if the date of birth is provided
    if (!dob) return false;

    // Create date objects for today and the date of birth
    const today = new Date();
    const dobDate = new Date(dob);

    // Calculate the age of the applicant
    let age = today.getFullYear() - dobDate.getFullYear();

    // Adjust the age if the applicant's birthday has not occurred this year
    if (
      today.getMonth() < dobDate.getMonth() ||
      (today.getMonth() === dobDate.getMonth() && today.getDate() < dobDate.getDate())
    ) {
      age--;
    }

    // Return true if the applicant is at least 18 years old, false otherwise
    return age >= 18;
  }

  /**
   * Returns the default error message when the validation fails.
   * The default error message is "Applicant must be at least 18 years old".
   * @param args - The validation arguments.
   */
  defaultMessage(args: ValidationArguments) {
    return 'Applicant must be at least 18 years old';
  }
}

/**
 * Registers a decorator for validating whether an applicant is at least 18 years old.
 * The decorator can be used on a property of an object to validate whether the date of birth
 * corresponds to an applicant being at least 18 years old.
 * If the date of birth is invalid or if the applicant is less than 18 years old, the validation fails.
 * @param validationOptions - The options for the validation.
 */
export function IsAdult(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    /**
     * Registers the decorator on the given object and property.
     * The decorator will validate whether the date of birth corresponds to an applicant being at least 18 years old.
     */
    registerDecorator({
      // The target object to register the decorator on
      target: object.constructor, // Class where decorator is applied

      // The name of the property to register the decorator on
      propertyName: propertyName, // Property being validated

      // The options for the validation
      options: validationOptions, // Optional validation settings

      // An empty array of constraints (not used in this case)
      constraints: [], // No additional constraints required

      // The validator to use for the validation
      validator: IsAdultConstraint, // Link to the validation logic class
    });
  };
}
