/**
 * ApplicantStep
 *
 * Form step for pet adoption applications with validation rules from the README:
 * - Name: minimum 2 characters
 * - Email: valid email format
 * - Phone: E.164-style regex
 * - Reason: minimum 50 characters
 *
 * Validation errors show on blur, not on every keystroke.
 * Fields are prefilled from useCurrentUser and remain editable.
 */

import { useState, useEffect } from 'react';
import { z } from 'zod';
import { adoptionFormSchema } from '../schemas/adoptionSchemas';

// Simple useCurrentUser hook - reads from auth context or localStorage
function useCurrentUser() {
  const token =
    localStorage.getItem('auth_token') ?? sessionStorage.getItem('auth_token');

  // If token exists, we consider the user authenticated
  // In a real app, this would decode the token to get user details
  const [user, setUser] = useState({
    fullName: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    // If we have a token, we can prefill with mock user data
    // or fetch user data from the API
    if (token) {
      // Simulate fetching user data
      setUser({
        fullName: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
      });
    }
  }, [token]);

  return user;
}

/**
 * Handle blur-based validation for a field
 * Shows error message only when user blurs the field
 */
function useBlurValidation(
  schema: z.ZodObject<z.ZodRawShape>,
  fieldName: keyof z.infer<typeof adoptionFormSchema>,
  initialValue: string
) {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = e.target.value as string;
    setValue(value);
    // Clear error when user starts typing again after blur
    if (error) {
      setError(null);
    }
  };

  const onBlur = () => {
    setTouched(true);
    try {
      schema.parse({
        [fieldName]: value,
      });
      setError(null);
    } catch (err: any) {
      setError(err.errors?.[0]?.message || 'Invalid input');
    }
  };

  return {
    value,
    onChange,
    onBlur,
    error,
    touched,
  };
}

export interface AdoptionFormValues {
  fullName: string;
  email: string;
  phone: string;
  reason: string;
}

export function ApplicantStep() {
  const currentUser = useCurrentUser();

  // Initialize form values from current user (prefill)
  const [form, setForm] = useState<AdoptionFormValues>({
    fullName: currentUser.fullName,
    email: currentUser.email,
    phone: currentUser.phone,
    reason: '',
  });

  // Validation hooks for each field - destructure error from hook return
  const { value: name, onChange: nameOnChange, onBlur: nameOnBlur, error: nameError } =
    useBlurValidation(adoptionFormSchema, 'fullName', form.fullName);

  const { value: email, onChange: emailOnChange, onBlur: emailOnBlur, error: emailError } =
    useBlurValidation(adoptionFormSchema, 'email', form.email);

  const { value: phone, onChange: phoneOnChange, onBlur: phoneOnBlur, error: phoneError } =
    useBlurValidation(adoptionFormSchema, 'phone', form.phone);

  const { value: reason, onChange: reasonOnChange, onBlur: reasonOnBlur, error: reasonError } =
    useBlurValidation(adoptionFormSchema, 'reason', form.reason);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields on submit
    try {
      adoptionFormSchema.parse({
        fullName: name,
        email: email,
        phone: phone,
        reason: reason,
      });
      // Form is valid - submit or proceed to next step
      alert('Application submitted successfully!');
    } catch (err: any) {
      // Show first validation error
      const firstError = err.errors?.[0]?.message || 'Validation failed';
      alert(firstError);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h2 className="text-xl font-semibold mb-6 text-center">
        Adoption Application
      </h2>

      <form onSubmit={onSubmit} className="space-y-4">
        {/* Full Name field - prefilled from current user */}
        <div>
          <label className="block text-sm font-medium mb-2">Full Name</label>
          <input
            type="text"
            name="fullName"
            value={name}
            onChange={nameOnChange}
            onBlur={nameOnBlur}
            className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="Your full name (editable)"
            disabled={false}
          />
          {nameError && (
            <p className="mt-1 text-sm text-red-600">{nameError}</p>
          )}
        </div>

        {/* Email field - prefilled from current user */}
        <div>
          <label className="block text-sm font-medium mb-2">Email</label>
          <input
            type="email"
            name="email"
            value={email}
            onChange={emailOnChange}
            onBlur={emailOnBlur}
            className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="your.email@example.com (editable)"
            disabled={false}
          />
          {emailError && (
            <p className="mt-1 text-sm text-red-600">{emailError}</p>
          )}
        </div>

        {/* Phone field - prefilled from current user, E.164 format */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Phone (E.164)
          </label>
          <input
            type="tel"
            name="phone"
            value={phone}
            onChange={phoneOnChange}
            onBlur={phoneOnBlur}
            className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="+1234567890 (editable)"
            disabled={false}
          />
          {phoneError && (
            <p className="mt-1 text-sm text-red-600">{phoneError}</p>
          )}
        </div>

        {/* Reason field */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Reason for adoption
          </label>
          <textarea
            name="reason"
            rows={3}
            value={reason}
            onChange={reasonOnChange}
            onBlur={reasonOnBlur}
            className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Please provide more details (at least 50 characters)... (editable)"
          ></textarea>
          {reasonError && (
            <p className="mt-1 text-sm text-red-600">{reasonError}</p>
          )}
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="submit"
            className="rounded bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 transition-colors"
            disabled={!(name && email && phone && reason)}
          >
            Submit Application
          </button>
          <button
            type="button"
            className="rounded border border-gray-300 px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 transition-colors"
            onClick={() => setForm({
              fullName: currentUser.fullName,
              email: currentUser.email,
              phone: currentUser.phone,
              reason: '',
            })}
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  );
}