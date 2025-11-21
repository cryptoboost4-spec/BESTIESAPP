import { useState, useEffect } from 'react';

/**
 * Real-time form validation hook
 * Shows errors as user types with cute messages
 */
const useFormValidation = (initialValues, validationRules) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Validate a single field
  const validateField = (fieldName, value) => {
    const rules = validationRules[fieldName];
    if (!rules) return '';

    // Required check
    if (rules.required && !value) {
      return rules.requiredMessage || `${fieldName} is required 💜`;
    }

    // Min length
    if (rules.minLength && value.length < rules.minLength) {
      return rules.minLengthMessage || `Must be at least ${rules.minLength} characters 📏`;
    }

    // Max length
    if (rules.maxLength && value.length > rules.maxLength) {
      return rules.maxLengthMessage || `Must be less than ${rules.maxLength} characters ✂️`;
    }

    // Email validation
    if (rules.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return rules.emailMessage || 'Please enter a valid email 📧';
      }
    }

    // Phone validation
    if (rules.phone) {
      const phoneRegex = /^[\d\s\+\-\(\)]+$/;
      if (!phoneRegex.test(value)) {
        return rules.phoneMessage || 'Please enter a valid phone number 📱';
      }
    }

    // URL validation
    if (rules.url) {
      try {
        new URL(value);
      } catch {
        return rules.urlMessage || 'Please enter a valid URL 🔗';
      }
    }

    // Custom validation
    if (rules.custom && !rules.custom(value)) {
      return rules.customMessage || 'Invalid value';
    }

    // Pattern matching
    if (rules.pattern && !rules.pattern.test(value)) {
      return rules.patternMessage || 'Invalid format';
    }

    return '';
  };

  // Validate all fields
  const validateAll = () => {
    const newErrors = {};
    Object.keys(validationRules).forEach(fieldName => {
      const error = validateField(fieldName, values[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle field change
  const handleChange = (fieldName, value) => {
    setValues(prev => ({ ...prev, [fieldName]: value }));

    // Validate on change if field has been touched
    if (touched[fieldName]) {
      const error = validateField(fieldName, value);
      setErrors(prev => ({
        ...prev,
        [fieldName]: error
      }));
    }
  };

  // Handle field blur
  const handleBlur = (fieldName) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
    const error = validateField(fieldName, values[fieldName]);
    setErrors(prev => ({
      ...prev,
      [fieldName]: error
    }));
  };

  // Reset form
  const reset = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  };

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
    reset,
    isValid: Object.keys(errors).length === 0
  };
};

export default useFormValidation;
