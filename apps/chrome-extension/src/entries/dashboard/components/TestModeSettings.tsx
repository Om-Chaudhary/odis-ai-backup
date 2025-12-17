import { testModeStorage, useStorage, IS_DEV } from '@odis-ai/extension-shared';
import { Input, Label } from '@odis-ai/ui/extension';
import { useState, useEffect } from 'react';

/**
 * Test mode settings component (only visible in development)
 * Allows configuring test email/phone and schedule times for safe testing
 */
export const TestModeSettings = () => {
  const testMode = useStorage(testModeStorage);
  const [localEmail, setLocalEmail] = useState(testMode.testEmail);
  const [localPhone, setLocalPhone] = useState(testMode.testPhone);
  const [localEmailMinutes, setLocalEmailMinutes] = useState(testMode.emailScheduleMinutes);
  const [localPhoneMinutes, setLocalPhoneMinutes] = useState(testMode.phoneScheduleMinutes);

  // Sync local state with storage when it changes
  useEffect(() => {
    setLocalEmail(testMode.testEmail);
    setLocalPhone(testMode.testPhone);
    setLocalEmailMinutes(testMode.emailScheduleMinutes);
    setLocalPhoneMinutes(testMode.phoneScheduleMinutes);
  }, [testMode]);

  // Only show in development mode
  if (!IS_DEV) {
    return null;
  }

  const handleToggle = async () => {
    await testModeStorage.set(prev => ({
      ...prev,
      enabled: !prev.enabled,
    }));
  };

  const handleEmailChange = async (value: string) => {
    setLocalEmail(value);
    await testModeStorage.set(prev => ({
      ...prev,
      testEmail: value,
    }));
  };

  const handlePhoneChange = async (value: string) => {
    setLocalPhone(value);
    await testModeStorage.set(prev => ({
      ...prev,
      testPhone: value,
    }));
  };

  const handleEmailMinutesChange = async (value: number) => {
    setLocalEmailMinutes(value);
    await testModeStorage.set(prev => ({
      ...prev,
      emailScheduleMinutes: Math.max(0, value),
    }));
  };

  const handlePhoneMinutesChange = async (value: number) => {
    setLocalPhoneMinutes(value);
    await testModeStorage.set(prev => ({
      ...prev,
      phoneScheduleMinutes: Math.max(0, value),
    }));
  };

  return (
    <div className="mb-6 rounded-lg border-2 border-yellow-400 bg-yellow-50 p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-yellow-900">Test Mode Settings</h3>
          <p className="text-sm text-yellow-700">Development only - Override discharge recipients for safe testing</p>
        </div>
        <label className="flex cursor-pointer items-center">
          <input
            type="checkbox"
            checked={testMode.enabled}
            onChange={handleToggle}
            className="h-5 w-5 cursor-pointer rounded border-gray-300 text-teal-600 focus:ring-teal-500"
          />
          <span className="ml-2 text-sm font-medium text-yellow-900">{testMode.enabled ? 'Enabled' : 'Disabled'}</span>
        </label>
      </div>

      {testMode.enabled && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="test-email" className="mb-1 block text-sm font-medium text-yellow-900">
              Test Email Address
            </Label>
            <Input
              id="test-email"
              type="email"
              value={localEmail}
              onChange={e => handleEmailChange(e.target.value)}
              placeholder="test@example.com"
              className="bg-white"
            />
          </div>

          <div>
            <Label htmlFor="test-phone" className="mb-1 block text-sm font-medium text-yellow-900">
              Test Phone Number
            </Label>
            <Input
              id="test-phone"
              type="tel"
              value={localPhone}
              onChange={e => handlePhoneChange(e.target.value)}
              placeholder="+1234567890"
              className="bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email-minutes" className="mb-1 block text-sm font-medium text-yellow-900">
                Email Schedule (minutes from now)
              </Label>
              <Input
                id="email-minutes"
                type="number"
                min="0"
                value={localEmailMinutes}
                onChange={e => handleEmailMinutesChange(Number.parseInt(e.target.value, 10) || 0)}
                className="bg-white"
              />
            </div>

            <div>
              <Label htmlFor="phone-minutes" className="mb-1 block text-sm font-medium text-yellow-900">
                Phone Schedule (minutes from now)
              </Label>
              <Input
                id="phone-minutes"
                type="number"
                min="0"
                value={localPhoneMinutes}
                onChange={e => handlePhoneMinutesChange(Number.parseInt(e.target.value, 10) || 0)}
                className="bg-white"
              />
            </div>
          </div>

          <div className="rounded-md bg-yellow-100 p-2 text-xs text-yellow-800">
            <strong>Warning:</strong> When test mode is enabled, all discharge emails and phone calls will be sent to
            the test contact above instead of real clients.
          </div>
        </div>
      )}
    </div>
  );
};
