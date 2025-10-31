// Validation utilities for form data

export const VALIDATION_RULES = {
  MIN_PERSONS: 2,
  MAX_PERSONS: 15,
  MIN_GROUP_NAME_LENGTH: 1,
  MAX_GROUP_NAME_LENGTH: 35,
  MIN_PERSON_NAME_LENGTH: 1,
  MAX_PERSON_NAME_LENGTH: 30
}

export const VALIDATION_MESSAGES = {
  MIN_PERSONS: `Group should have at least ${VALIDATION_RULES.MIN_PERSONS} persons`,
  MAX_PERSONS: `Group cannot have more than ${VALIDATION_RULES.MAX_PERSONS} persons`,
  EMPTY_GROUP_NAME: 'Group name is required',
  GROUP_NAME_TOO_LONG: `Group name cannot exceed ${VALIDATION_RULES.MAX_GROUP_NAME_LENGTH} characters`,
  EMPTY_PERSON_NAME: 'Person name is required',
  PERSON_NAME_TOO_LONG: `Person name cannot exceed ${VALIDATION_RULES.MAX_PERSON_NAME_LENGTH} characters`,
  DUPLICATE_PERSON_NAME: 'Person names must be unique'
}

/**
 * Validates if the current person count meets the minimum requirement
 * @param {number} currentCount - Current number of persons
 * @returns {object} - { isValid: boolean, message: string }
 */
export const validatePersonCount = (currentCount) => {
  if (currentCount < VALIDATION_RULES.MIN_PERSONS) {
    return {
      isValid: false,
      message: VALIDATION_MESSAGES.MIN_PERSONS
    }
  }
  
  if (currentCount > VALIDATION_RULES.MAX_PERSONS) {
    return {
      isValid: false,
      message: VALIDATION_MESSAGES.MAX_PERSONS
    }
  }
  
  return { isValid: true, message: '' }
}

/**
 * Validates if person can be removed based on minimum requirement
 * @param {number} currentCount - Current number of persons
 * @returns {object} - { canRemove: boolean, message: string }
 */
export const validatePersonRemoval = (currentCount) => {
  if (currentCount <= VALIDATION_RULES.MIN_PERSONS) {
    return {
      canRemove: false,
      message: VALIDATION_MESSAGES.MIN_PERSONS
    }
  }
  
  return { canRemove: true, message: '' }
}

/**
 * Validates group name
 * @param {string} groupName - The group name to validate
 * @returns {object} - { isValid: boolean, message: string }
 */
export const validateGroupName = (groupName) => {
  if (!groupName || groupName.trim().length < VALIDATION_RULES.MIN_GROUP_NAME_LENGTH) {
    return {
      isValid: false,
      message: VALIDATION_MESSAGES.EMPTY_GROUP_NAME
    }
  }
  
  if (groupName.trim().length > VALIDATION_RULES.MAX_GROUP_NAME_LENGTH) {
    return {
      isValid: false,
      message: VALIDATION_MESSAGES.GROUP_NAME_TOO_LONG
    }
  }
  
  return { isValid: true, message: '' }
}

/**
 * Validates person names
 * @param {object} personNames - Object containing person names by index
 * @param {number} personCount - Total number of persons
 * @returns {object} - { isValid: boolean, message: string, errors: object }
 */
export const validatePersonNames = (personNames, personCount) => {
  const errors = {}
  const namesList = []
  
  // Check each person name
  for (let i = 1; i <= personCount; i++) {
    const name = personNames[i] || ''
    
    if (!name || name.trim().length < VALIDATION_RULES.MIN_PERSON_NAME_LENGTH) {
      errors[i] = VALIDATION_MESSAGES.EMPTY_PERSON_NAME
    } else if (name.trim().length > VALIDATION_RULES.MAX_PERSON_NAME_LENGTH) {
      errors[i] = VALIDATION_MESSAGES.PERSON_NAME_TOO_LONG
    } else {
      const trimmedName = name.trim().toLowerCase()
      if (namesList.includes(trimmedName)) {
        errors[i] = VALIDATION_MESSAGES.DUPLICATE_PERSON_NAME
      } else {
        namesList.push(trimmedName)
      }
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    message: Object.keys(errors).length > 0 ? 'Please fix the person name errors' : '',
    errors
  }
}

/**
 * Validates the entire form
 * @param {object} formData - { groupName, personNames, personCount }
 * @returns {object} - { isValid: boolean, message: string, errors: object }
 */
export const validateForm = (formData) => {
  const { groupName, personNames, personCount } = formData
  
  // Validate person count
  const countValidation = validatePersonCount(personCount)
  if (!countValidation.isValid) {
    return {
      isValid: false,
      message: countValidation.message,
      errors: {}
    }
  }
  
  // Validate group name
  const groupNameValidation = validateGroupName(groupName)
  if (!groupNameValidation.isValid) {
    return {
      isValid: false,
      message: groupNameValidation.message,
      errors: { groupName: groupNameValidation.message }
    }
  }
  
  // Validate person names
  const personNamesValidation = validatePersonNames(personNames, personCount)
  if (!personNamesValidation.isValid) {
    return {
      isValid: false,
      message: personNamesValidation.message,
      errors: { personNames: personNamesValidation.errors }
    }
  }
  
  return {
    isValid: true,
    message: 'Form is valid',
    errors: {}
  }
}