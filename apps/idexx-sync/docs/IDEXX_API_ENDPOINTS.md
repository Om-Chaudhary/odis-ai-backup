# IDEXX Neo Internal API Endpoints

> Documentation of internal API endpoints discovered through browser network inspection.
> These endpoints are used by the IDEXX Neo web application and require authenticated session cookies.

## Authentication

All endpoints require authentication via session cookies obtained after login at `https://us.idexxneo.com/login`.

---

## Schedule / Appointments APIs

### `GET /appointments/getCalendarEventData`

Fetches calendar appointment data for a date range.

**Query Parameters:**
| Parameter | Type | Example | Description |
|-----------|------|---------|-------------|
| `start` | string | `2025-12-27 00:00:00` | Start datetime (URL encoded) |
| `end` | string | `2025-12-28 00:00:00` | End datetime (URL encoded) |

**Example Request:**

```
GET /appointments/getCalendarEventData?start=2025-12-27%2000:00:00&end=2025-12-28%2000:00:00
```

**Response:** Array of appointment objects

```json
[
  {
    "id": "12345",
    "title": "BELLA; ALDANA, DAVID",
    "start": "2025-12-27T16:15:00",
    "end": "2025-12-27T16:30:00",
    "resourceId": "room-1",
    "className": "finalized",
    "patientName": "BELLA",
    "clientName": "DAVID ALDANA",
    "clientPhone": "408-509-5710",
    "providerName": "DR.G.BATH",
    "appointmentType": "Exam",
    "status": "Finalized"
  }
]
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique appointment ID in IDEXX Neo |
| `title` | string | Combined patient/client display name |
| `start` | string | ISO datetime of appointment start |
| `end` | string | ISO datetime of appointment end |
| `resourceId` | string | Room or resource ID |
| `className` | string | CSS class indicating status |
| `patientName` | string | Patient (pet) name |
| `clientName` | string | Client (owner) name |
| `clientPhone` | string | Client phone number |
| `providerName` | string | Veterinarian/provider name |
| `appointmentType` | string | Type of appointment (Exam, Follow-up, etc.) |
| `status` | string | Status: Finalized, In Progress, No Show, Ready to Pay, etc. |

---

### `GET /schedule/getScheduleConfigs`

Fetches schedule configuration including business hours and slot settings.

**Example Request:**

```
GET /schedule/getScheduleConfigs
```

**Response:** Schedule configuration object

```json
{
  "businessHours": {
    "start": "08:00",
    "end": "18:00",
    "daysOfWeek": [1, 2, 3, 4, 5, 6]
  },
  "slotDuration": 15,
  "minTime": "07:00",
  "maxTime": "20:00",
  "providers": [
    {
      "id": 1,
      "name": "DR.G.BATH",
      "color": "#4CAF50"
    }
  ],
  "rooms": [
    {
      "id": "room-1",
      "name": "ROOM 1"
    }
  ]
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `businessHours.start` | string | Business hours start time (HH:mm) |
| `businessHours.end` | string | Business hours end time (HH:mm) |
| `businessHours.daysOfWeek` | number[] | Days clinic is open (0=Sun, 6=Sat) |
| `slotDuration` | number | Default appointment slot duration in minutes |
| `providers` | array | List of providers/veterinarians |
| `rooms` | array | List of exam rooms |

---

### `GET /schedule/getCalendarConfigs`

Fetches calendar display configuration.

**Example Request:**

```
GET /schedule/getCalendarConfigs
```

---

## Dashboard APIs

### `GET /dashboard/getAppointments`

Fetches today's appointment summary for dashboard display.

**Example Request:**

```
GET /dashboard/getAppointments
```

**Response:** Dashboard appointment summary

```json
{
  "upcoming": 0,
  "late": 0,
  "noShow": 1,
  "waitingToPay": 1
}
```

---

### `GET /dashboard/getArrivals`

Fetches today's arrivals list with patient details.

**Example Request:**

```
GET /dashboard/getArrivals
```

**Response:** Array of arrival objects with patient/client info

```json
[
  {
    "id": "47016",
    "patientName": "BELLA",
    "clientName": "DAVID ALDANA",
    "clientPhone": "408-509-5710",
    "breed": "French Bull Dog",
    "species": "Canine",
    "vet": "DR.G.BATH",
    "reason": "Exam",
    "notes": "EXAM IS HAVING TROUBLE WALKING - 26.5LBS",
    "time": "4:15 PM",
    "status": "Finalized"
  }
]
```

---

### `GET /dashboard/getNotes`

Fetches user's personal notepad content.

---

### `GET /dashboard/getSnapshotData`

Fetches business snapshot metrics.

---

## Consultation APIs

### `GET /consultations/search`

Searches for consultations within a date range.

**Query Parameters:**
| Parameter | Type | Example | Description |
|-----------|------|---------|-------------|
| `page` | number | `1` | Page number for pagination |
| `date_start` | string | `21.12.2025 00:00:00` | Start date (DD.MM.YYYY HH:mm:ss) |
| `date_end` | string | `27.12.2025 23:59:59` | End date (DD.MM.YYYY HH:mm:ss) |
| `order[]` | string | `consultedAt:desc` | Sort order |
| `provider` | number | `2` | Optional provider ID filter |

**Example Request:**

```
GET /consultations/search?page=1&date_start=27.12.2025%2000:00:00&date_end=27.12.2025%2023:59:59&order[]=consultedAt:desc
```

**Response:** Paginated consultation results

```json
{
  "data": [
    {
      "id": "56789",
      "appointmentId": "12345",
      "patientName": "BELLA",
      "clientName": "DAVID ALDANA",
      "providerId": 1,
      "providerName": "DR.G.BATH",
      "consultedAt": "2025-12-27T16:15:00",
      "status": "completed",
      "clinicalNotes": "S: Patient presenting with difficulty walking...",
      "vitals": {
        "temperature": 101.5,
        "temperatureUnit": "F",
        "pulse": 120,
        "respiration": 20,
        "weight": 26.5,
        "weightUnit": "lb"
      },
      "diagnoses": ["Mobility Issue", "Arthritis"]
    }
  ],
  "total": 25,
  "page": 1,
  "perPage": 20
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique consultation ID |
| `appointmentId` | string | Related appointment ID |
| `patientName` | string | Patient (pet) name |
| `clientName` | string | Client (owner) name |
| `providerId` | number | Provider ID |
| `providerName` | string | Provider/vet name |
| `consultedAt` | string | ISO datetime of consultation |
| `status` | string | Status: in_progress, completed, cancelled |
| `clinicalNotes` | string | SOAP notes or clinical notes |
| `vitals` | object | Vital signs measurements |
| `diagnoses` | string[] | List of diagnoses |

---

### `GET /consultations/view/{id}`

Fetches detailed consultation data by ID.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Consultation ID |

**Example Request:**

```
GET /consultations/view/56789
```

**Response:** Full consultation detail object (same structure as search results but with complete data)

---

## User / Provider APIs

### `GET /users`

Fetches current user information.

---

### `GET /users/providers`

Fetches list of providers/veterinarians.

**Query Parameters:**
| Parameter | Type | Example | Description |
|-----------|------|---------|-------------|
| `includeInactive` | boolean | `true` | Include inactive providers |

**Example Request:**

```
GET /users/providers?includeInactive=true
```

**Response:** Array of provider objects

```json
[
  {
    "id": 1,
    "name": "DR.G.BATH",
    "email": "dr.bath@example.com",
    "active": true
  },
  {
    "id": 2,
    "name": "DR. NIMIR BATH",
    "email": "nimir@example.com",
    "active": true
  }
]
```

---

## Task APIs

### `GET /api/tasks`

Fetches tasks (callbacks, results to review).

**Query Parameters:**
| Parameter | Type | Example | Description |
|-----------|------|---------|-------------|
| `page` | number | `0` | Page number |
| `limit` | number | `25` | Results per page |
| `orderDirection` | string | `asc` | Sort direction |
| `type` | string | `result` or `callback` | Task type |
| `status` | string | `open` | Task status |
| `userId` | number | `2` | User ID filter |

**Example Request:**

```
GET /api/tasks?page=0&limit=25&orderDirection=asc&type=callback&status=open&userId=2
```

---

## Configuration APIs

### `GET /shared/configuration`

Fetches shared application configuration.

---

## Usage in idexx-sync

The `idexx-sync` service uses these APIs as follows:

1. **Authentication**: Uses Playwright to login via the web UI and capture session cookies
2. **Schedule Scraping**: Calls `/appointments/getCalendarEventData` for appointment data
3. **Schedule Config**: Calls `/schedule/getScheduleConfigs` for business hours
4. **Consultation Scraping**: Calls `/consultations/search` then `/consultations/view/{id}` for detailed notes
5. **Free Slots**: Calculated from business hours config minus booked appointments

### Example Flow

```typescript
// After login, page context has authenticated cookies
const response = await page.request.get(
  `${baseUrl}/appointments/getCalendarEventData?start=${start}&end=${end}`,
);
const appointments = await response.json();
```

---

## Notes

- All datetime formats vary by endpoint (ISO, DD.MM.YYYY, etc.)
- The API is internal and undocumented; responses may change
- Some fields may be optional or vary by appointment/consultation type
- Phone numbers may be in various formats (need normalization)
