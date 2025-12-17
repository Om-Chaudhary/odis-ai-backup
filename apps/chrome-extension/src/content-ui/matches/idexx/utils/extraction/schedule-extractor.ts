import { logger, now } from '@odis-ai/extension-shared';

/**
 * Schedule appointment data structure
 */
interface ScheduleAppointment {
  id: string;
  consultationId?: string | null;
  startTime: Date | null;
  duration: number | null;
  patient: {
    name: string | null;
    id: string | null;
    species: string | null;
    breed: string | null;
  };
  client: {
    name: string | null;
    id: string | null;
    phone: string | null;
    email: string | null;
  };
  provider: {
    name: string | null;
    id: string | null;
  };
  type: string | null;
  status: string | null;
  notes: string | null;
  reason: string | null;
  extractedFrom: 'dom' | 'api';
  rawElement?: HTMLElement;
}

const odisLogger = logger.child('[ODIS]');

/**
 * Schedule extractor for IDEXX Neo
 */
export class ScheduleExtractor {
  private baseUrl: string;

  constructor() {
    this.baseUrl = window.location.origin;
  }

  /**
   * Extract all appointments from the current schedule view
   */
  async extractScheduleData(): Promise<ScheduleAppointment[]> {
    odisLogger.info('Extracting schedule data from IDEXX Neo...');

    try {
      // Wait for schedule to load
      await this.waitForScheduleLoad();

      // Extract appointments using multiple methods
      const appointments = this.extractAppointments();

      odisLogger.info(`✅ Extracted ${appointments.length} appointments`, { count: appointments.length });
      return appointments;
    } catch (error) {
      odisLogger.error('❌ Schedule extraction failed', { error });
      throw error;
    }
  }

  /**
   * Wait for schedule elements to load
   */
  private async waitForScheduleLoad(): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Schedule load timeout'));
      }, 10000);

      const check = setInterval(() => {
        // Look for appointment elements (adjust selectors based on actual IDEXX Neo DOM)
        const scheduleLoaded =
          document.querySelector('.schedule-grid') ||
          document.querySelector('[data-qa*="appointment"]') ||
          document.querySelector('.calendar-view') ||
          document.querySelector('.appointment-card') ||
          document.querySelector('.appointment-list');

        if (scheduleLoaded) {
          clearInterval(check);
          clearTimeout(timeout);
          resolve();
        }
      }, 500);
    });
  }

  /**
   * Extract appointment data from DOM
   */
  private extractAppointments(): ScheduleAppointment[] {
    const appointments: ScheduleAppointment[] = [];

    // Method 1: Try to find appointment cards/rows
    const appointmentElements = document.querySelectorAll(
      '.appointment-card, .appointment-row, .appointment-item, [data-qa*="appointment"], [class*="appointment"]',
    );

    odisLogger.debug(`Found ${appointmentElements.length} potential appointment elements`, {
      count: appointmentElements.length,
    });

    appointmentElements.forEach((element, index) => {
      try {
        const appointment = this.parseAppointmentElement(element as HTMLElement);
        if (appointment && appointment.id) {
          appointments.push(appointment);
        }
      } catch (error) {
        odisLogger.warn(`Failed to parse appointment ${index}`, { index, error });
      }
    });

    // Method 2: Try to extract from calendar/schedule grid
    if (appointments.length === 0) {
      odisLogger.debug('Trying calendar grid extraction...');
      const calendarAppointments = this.extractFromCalendarView();
      appointments.push(...calendarAppointments);
    }

    // Method 3: Try table-based extraction
    if (appointments.length === 0) {
      odisLogger.debug('Trying table extraction...');
      const tableAppointments = this.extractFromTable();
      appointments.push(...tableAppointments);
    }

    return appointments;
  }

  /**
   * Parse individual appointment element
   */
  private parseAppointmentElement(element: HTMLElement): ScheduleAppointment | null {
    // Extract ID from various possible locations
    const appointmentId =
      element.getAttribute('data-appointment-id') ||
      element.getAttribute('data-id') ||
      element.getAttribute('id') ||
      this.extractIdFromUrl(element.querySelector('a')?.href) ||
      `appointment-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Look for time information
    const timeElement = element.querySelector('.appointment-time, .time, [data-qa*="time"], [class*="time"]');
    const startTime = this.parseTimeString(timeElement?.textContent || '');

    // Look for patient information
    const patientElement = element.querySelector('.patient-name, [data-qa*="patient"], [class*="patient-name"]');
    const patientId = this.extractIdFromElement(patientElement);
    const patientName = patientElement?.textContent?.trim() || null;

    // Look for client/owner information
    const clientElement = element.querySelector(
      '.client-name, .owner-name, [data-qa*="client"], [data-qa*="owner"], [class*="client"], [class*="owner"]',
    );
    const clientName = clientElement?.textContent?.trim() || null;
    const clientId = this.extractIdFromElement(clientElement);

    // Look for provider/doctor information
    const providerElement = element.querySelector(
      '.doctor, .provider, .vet, [data-qa*="doctor"], [data-qa*="provider"], [class*="doctor"], [class*="provider"]',
    );
    const providerName = providerElement?.textContent?.trim() || null;
    const providerId = this.extractIdFromElement(providerElement);

    // Look for appointment type
    const typeElement = element.querySelector('.appointment-type, .type, [data-qa*="type"], [class*="appt-type"]');
    const type = typeElement?.textContent?.trim() || 'Appointment';

    // Look for status
    const statusElement = element.querySelector('.status, [data-qa*="status"], [class*="status"]');
    const status = statusElement?.textContent?.trim() || 'Scheduled';

    // Look for notes/reason
    const notesElement = element.querySelector('.notes, .reason, [data-qa*="notes"], [class*="notes"]');
    const notes = notesElement?.textContent?.trim() || null;

    const reasonElement = element.querySelector('.reason, [data-qa*="reason"], [class*="reason"]');
    const reason = reasonElement?.textContent?.trim() || notes;

    // Look for species/breed
    const speciesElement = element.querySelector('.species, [data-qa*="species"], [class*="species"]');
    const species = speciesElement?.textContent?.trim() || null;

    const breedElement = element.querySelector('.breed, [data-qa*="breed"], [class*="breed"]');
    const breed = breedElement?.textContent?.trim() || null;

    // Look for contact info
    const phoneElement = element.querySelector('.phone, [data-qa*="phone"], [class*="phone"]');
    const phone = phoneElement?.textContent?.trim() || null;

    const emailElement = element.querySelector('.email, [data-qa*="email"], [class*="email"]');
    const email = emailElement?.textContent?.trim() || null;

    // Extract duration
    const duration = this.extractDuration(element);

    return {
      id: appointmentId,
      startTime,
      duration,
      patient: {
        name: patientName,
        id: patientId,
        species,
        breed,
      },
      client: {
        name: clientName,
        id: clientId,
        phone,
        email,
      },
      provider: {
        name: providerName,
        id: providerId,
      },
      type,
      status,
      notes,
      reason,
      extractedFrom: 'dom',
      rawElement: element,
    };
  }

  /**
   * Extract from calendar view
   */
  private extractFromCalendarView(): ScheduleAppointment[] {
    const appointments: ScheduleAppointment[] = [];

    // Look for calendar cells with appointments
    const calendarCells = document.querySelectorAll(
      '.calendar-cell, .fc-event, [data-qa*="calendar-slot"], [class*="calendar"]',
    );

    calendarCells.forEach(cell => {
      try {
        const appointment = this.parseAppointmentElement(cell as HTMLElement);
        if (appointment && appointment.id) {
          appointments.push(appointment);
        }
      } catch (error) {
        odisLogger.warn('Failed to parse calendar cell', { error });
      }
    });

    return appointments;
  }

  /**
   * Extract from table view
   */
  private extractFromTable(): ScheduleAppointment[] {
    const appointments: ScheduleAppointment[] = [];

    // Look for schedule tables
    const tables = document.querySelectorAll('table[class*="schedule"], table[class*="appointment"]');

    tables.forEach(table => {
      const rows = table.querySelectorAll('tbody tr');

      rows.forEach(row => {
        try {
          const appointment = this.parseAppointmentElement(row as HTMLElement);
          if (appointment && appointment.id) {
            appointments.push(appointment);
          }
        } catch (error) {
          odisLogger.warn('Failed to parse table row', { error });
        }
      });
    });

    return appointments;
  }

  /**
   * Parse time string to Date object
   */
  private parseTimeString(timeStr: string | null | undefined): Date | null {
    if (!timeStr) return null;

    const cleanTime = timeStr.trim();

    // Try various time formats
    const timeFormats = [
      // 12-hour format
      /(\d{1,2}):(\d{2})\s*(AM|PM)/i,
      // 24-hour format
      /(\d{1,2}):(\d{2})/,
      // With date
      /(\d{4}-\d{2}-\d{2})\s+(\d{1,2}):(\d{2})/,
    ];

    for (const format of timeFormats) {
      const match = cleanTime.match(format);
      if (match) {
        try {
          const today = now();
          let hours = parseInt(match[1]);
          const minutes = parseInt(match[2]);

          // Handle AM/PM
          if (match[3]) {
            const period = match[3].toUpperCase();
            if (period === 'PM' && hours < 12) hours += 12;
            if (period === 'AM' && hours === 12) hours = 0;
          }

          today.setHours(hours, minutes, 0, 0);
          return today;
        } catch {
          continue;
        }
      }
    }

    return null;
  }

  /**
   * Extract duration from element
   */
  private extractDuration(element: HTMLElement): number | null {
    const durationElement = element.querySelector('.duration, [data-qa*="duration"], [class*="duration"]');

    if (durationElement) {
      const durationText = durationElement.textContent?.trim();
      const match = durationText?.match(/(\d+)\s*(min|mins|minutes|hour|hours|hr|hrs)?/i);

      if (match) {
        let duration = parseInt(match[1]);
        const unit = match[2]?.toLowerCase();

        // Convert to minutes
        if (unit && (unit.startsWith('hour') || unit.startsWith('hr'))) {
          duration *= 60;
        }

        return duration;
      }
    }

    // Try to infer from time range (e.g., "9:00 AM - 9:30 AM")
    const timeText = element.textContent;
    const timeRangeMatch = timeText?.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);

    if (timeRangeMatch) {
      const start = this.parseTimeString(timeRangeMatch[1]);
      const end = this.parseTimeString(timeRangeMatch[2]);

      if (start && end) {
        return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
      }
    }

    return null;
  }

  /**
   * Extract ID from element (data attributes or href)
   */
  private extractIdFromElement(element: Element | null | undefined): string | null {
    if (!element) return null;

    // Try data attributes
    const dataId =
      element.getAttribute('data-id') ||
      element.getAttribute('data-patient-id') ||
      element.getAttribute('data-client-id') ||
      element.getAttribute('data-provider-id');

    if (dataId) return dataId;

    // Try to extract from href
    const link = element.querySelector('a') || (element as HTMLAnchorElement);
    if (link?.href) {
      return this.extractIdFromUrl(link.href);
    }

    return null;
  }

  /**
   * Extract ID from URL
   */
  private extractIdFromUrl(url: string | null | undefined): string | null {
    if (!url) return null;

    // Try to extract numeric ID from URL
    const match = url.match(/\/(\d+)(?:\/|$|\?)/);
    return match ? match[1] : null;
  }
}

// Export singleton instance
export const scheduleExtractor = new ScheduleExtractor();

// Export interface at the end
export type { ScheduleAppointment };
