
taylorallen@Taylors-MacBook-Pro odis-ai % cd apps/pims-sync
taylorallen@Taylors-MacBook-Pro pims-sync % pnpm start

> pims-sync@2.0.0 start /Users/taylorallen/Development/odis-ai/apps/pims-sync
> dotenv -e ../../.env.local -- env PORT=5051 node ../../dist/apps/pims-sync/main.js

[2026-01-23T03:10:32.270Z] [INFO] [idexx-sync] pims-sync started at http://0.0.0.0:5051 (development)
[2026-01-23T03:10:32.609Z] [INFO] [scheduler:sync] Starting sync scheduler...
[2026-01-23T03:10:32.609Z] [INFO] [scheduler:config-loader] Loading clinic sync schedules...
[2026-01-23T03:10:32.966Z] [DEBUG] [scheduler:config-loader] No schedules configured for clinic {
  "clinicId": "33f3bbb8-6613-45bc-a1f2-d55e30c243ae"
}
[2026-01-23T03:10:32.966Z] [INFO] [scheduler:config-loader] Loaded clinic schedules {
  "totalClinics": 0,
  "totalSchedules": 0
}
[2026-01-23T03:10:32.966Z] [INFO] [scheduler:sync] Scheduled jobs created {
  "totalClinics": 0,
  "totalJobs": 0
}
[2026-01-23T03:10:32.966Z] [INFO] [scheduler:sync] Sync scheduler started {
  "totalJobs": 0,
  "pollIntervalMs": 300000
}
[2026-01-23T03:10:32.966Z] [INFO] [idexx-sync] Per-clinic scheduler enabled and started
[2026-01-23T03:15:14.916Z] [DEBUG] [idexx-sync] API key authenticated {
  "clinicId": "33f3bbb8-6613-45bc-a1f2-d55e30c243ae",
  "apiKeyId": "053f51b6-06a4-4494-8d14-8621972418af"
}
[2026-01-23T03:15:14.917Z] [INFO] [idexx-sync] Starting full sync {
  "clinicId": "33f3bbb8-6613-45bc-a1f2-d55e30c243ae"
}
[IdexxCredentialManager] company_id_encrypted data: {
  hasData: true,
  dataType: 'string',
  isUint8Array: false,
  isBuffer: false,
  stringPreview: '\\x888bf9db7ebd08ba7a'
}
[IdexxCredentialManager] Parsed buffer length: { length: 32 }
[IdexxCredentialManager] Decrypted company ID: { value: '9229', length: 4 }
[IdexxProvider] Initialized with baseUrl: https://us.idexxneo.com
[IdexxProvider] Authenticating...
[IdexxAuthClient] fillLoginForm called with: {
  username: 'alumrockanimalhospital@yahoo.com',
  hasPassword: true,
  companyId: '9229',
  companyIdLength: 4
}
[IdexxAuthClient] Company ID provided: "9229"
[IdexxAuthClient] Company ID field found, filling...
[IdexxAuthClient] Company ID filled successfully
[IdexxAuthClient] Filling username: alumrockanimalhospital@yahoo.com
[IdexxAuthClient] Filling password
[IdexxAuthClient] All credentials filled
[IdexxProvider] Authentication: SUCCESS
[2026-01-23T03:15:22.374Z] [INFO] [sync-orchestrator] Starting full sync {
  "clinicId": "33f3bbb8-6613-45bc-a1f2-d55e30c243ae",
  "provider": "IDEXX Neo",
  "options": {
    "inboundOptions": {
      "dateRange": {
        "start": "2026-01-22T08:00:00.000Z",
        "end": "2026-01-30T07:59:59.999Z"
      }
    },
    "reconciliationOptions": {
      "lookbackDays": 7
    }
  }
}
[2026-01-23T03:15:22.375Z] [INFO] [inbound-sync] Starting inbound sync {
  "syncId": "050acea2-c0f4-4ddc-b2c4-6e4b2615bf5e",
  "clinicId": "33f3bbb8-6613-45bc-a1f2-d55e30c243ae",
  "provider": "IDEXX Neo",
  "options": {
    "dateRange": {
      "start": "2026-01-22T08:00:00.000Z",
      "end": "2026-01-30T07:59:59.999Z"
    }
  }
}
[IdexxProvider] Fetching appointments: { start: '2026-01-22', end: '2026-01-30' }
[IdexxScheduleClient] Navigating to IDEXX domain for API access...
[IdexxScheduleClient] On IDEXX domain, ready to fetch appointments
[IdexxScheduleClient] Fetching appointments from: https://us.idexxneo.com/appointments/getCalendarEventData?start=2026-01-22%2000%3A00%3A00&end=2026-01-29%2023%3A59%3A59
[IdexxScheduleClient] Fetched 143 appointments
[IdexxProvider] Found 143 appointments
[2026-01-23T03:15:23.315Z] [INFO] [inbound-sync] Fetched appointments from PIMS {
  "syncId": "050acea2-c0f4-4ddc-b2c4-6e4b2615bf5e",
  "count": 143,
  "dateRange": {
    "start": "2026-01-22T08:00:00.000Z",
    "end": "2026-01-30T07:59:59.999Z"
  }
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '4b2245bb-cc4b-453d-931d-a3f93849dea8',
  patientName: 'PENNY',
  caseId: 'a892279e-9be5-48ee-867d-f724400710c1'
}
[2026-01-23T03:15:23.776Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "a892279e-9be5-48ee-867d-f724400710c1",
  "externalId": "pims-appt-idexx-neo-351412",
  "appointmentId": "351412",
  "patientName": "PENNY"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '7f744679-b781-4651-b16a-07750673f1b0',
  patientName: 'ROSIE',
  caseId: '5d7f90b2-2c7d-4d48-b6ea-de7912b95bdb'
}
[2026-01-23T03:15:24.197Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "5d7f90b2-2c7d-4d48-b6ea-de7912b95bdb",
  "externalId": "pims-appt-idexx-neo-351520",
  "appointmentId": "351520",
  "patientName": "ROSIE"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '95fac225-6119-46fe-bc9d-e2b14d5d22d3',
  patientName: 'MISSY',
  caseId: 'dd2a0689-810c-407f-875a-53b74919bdf9'
}
[2026-01-23T03:15:24.609Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "dd2a0689-810c-407f-875a-53b74919bdf9",
  "externalId": "pims-appt-idexx-neo-349591",
  "appointmentId": "349591",
  "patientName": "MISSY"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: 'd2317de0-e517-492e-ae5a-a64bc51589ae',
  patientName: 'SONNY',
  caseId: '39677413-b8c1-4306-8eec-e2b34c876332'
}
[2026-01-23T03:15:24.957Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "39677413-b8c1-4306-8eec-e2b34c876332",
  "externalId": "pims-appt-idexx-neo-351474",
  "appointmentId": "351474",
  "patientName": "SONNY"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '47e4d9df-12e2-4c92-b8c6-a1d294fdaa01',
  patientName: 'STRIPES',
  caseId: '0191c92a-0a19-410c-a173-9493b55853ec'
}
[2026-01-23T03:15:25.308Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "0191c92a-0a19-410c-a173-9493b55853ec",
  "externalId": "pims-appt-idexx-neo-351494",
  "appointmentId": "351494",
  "patientName": "STRIPES"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: 'ea86b3f2-b467-41c9-9f5f-44adb415f4d2',
  patientName: 'Gumshoe',
  caseId: 'fba55967-57b1-4d82-a7df-f5e01de2b18d'
}
[2026-01-23T03:15:25.644Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "fba55967-57b1-4d82-a7df-f5e01de2b18d",
  "externalId": "pims-appt-idexx-neo-351550",
  "appointmentId": "351550",
  "patientName": "Gumshoe"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '5d69e2a8-0ca9-44b1-be24-2a82a93b7eb2',
  patientName: 'Phoenix',
  caseId: 'd4d6ba65-781d-456a-b668-7f8809747191'
}
[2026-01-23T03:15:25.991Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "d4d6ba65-781d-456a-b668-7f8809747191",
  "externalId": "pims-appt-idexx-neo-351551",
  "appointmentId": "351551",
  "patientName": "Phoenix"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '8b440882-105d-4580-a4b8-69ad503026f7',
  patientName: 'LUCKY',
  caseId: '4dbd47cb-b407-4b42-8a73-0e0b7e0d29bb'
}
[2026-01-23T03:15:26.321Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "4dbd47cb-b407-4b42-8a73-0e0b7e0d29bb",
  "externalId": "pims-appt-idexx-neo-351516",
  "appointmentId": "351516",
  "patientName": "LUCKY"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: 'cf29130c-875b-4a6d-8c70-b459ab282ea0',
  patientName: 'MAX',
  caseId: '192d7b50-4188-4b36-b796-2f81c2b311c2'
}
[2026-01-23T03:15:26.659Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "192d7b50-4188-4b36-b796-2f81c2b311c2",
  "externalId": "pims-appt-idexx-neo-351552",
  "appointmentId": "351552",
  "patientName": "MAX"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '1082adc5-1562-4ca1-bc77-21e71c8e7cb7',
  patientName: 'DIAMOND DOG',
  caseId: '9620a9e2-65c5-4d10-b3be-8444dbbaa7af'
}
[2026-01-23T03:15:26.993Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "9620a9e2-65c5-4d10-b3be-8444dbbaa7af",
  "externalId": "pims-appt-idexx-neo-351553",
  "appointmentId": "351553",
  "patientName": "DIAMOND DOG"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '5e2ce4d4-5e76-4d87-a642-cb8a47e477ea',
  patientName: 'PEPPER',
  caseId: '1c412f9b-e186-4cb6-95a7-c6cf393724e9'
}
[2026-01-23T03:15:27.333Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "1c412f9b-e186-4cb6-95a7-c6cf393724e9",
  "externalId": "pims-appt-idexx-neo-351207",
  "appointmentId": "351207",
  "patientName": "PEPPER"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: 'aa4d098d-3c95-432e-a94e-20470b8c9953',
  patientName: 'FRIDA',
  caseId: '1e96d07b-397f-44de-ad4f-e2b66c4b9f0f'
}
[2026-01-23T03:15:27.659Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "1e96d07b-397f-44de-ad4f-e2b66c4b9f0f",
  "externalId": "pims-appt-idexx-neo-351555",
  "appointmentId": "351555",
  "patientName": "FRIDA"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: 'ba2a55ff-52c3-4683-8d8f-27c34241121b',
  patientName: 'CHANEL',
  caseId: '399677f5-a822-409b-8d5c-b085c122f67b'
}
[2026-01-23T03:15:28.001Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "399677f5-a822-409b-8d5c-b085c122f67b",
  "externalId": "pims-appt-idexx-neo-351528",
  "appointmentId": "351528",
  "patientName": "CHANEL"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '5dd8d636-c61e-4be4-bf08-674160504afd',
  patientName: 'SASHA',
  caseId: '0fd1a436-6c2c-4621-a328-97063f1d4e01'
}
[2026-01-23T03:15:28.331Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "0fd1a436-6c2c-4621-a328-97063f1d4e01",
  "externalId": "pims-appt-idexx-neo-351554",
  "appointmentId": "351554",
  "patientName": "SASHA"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: 'fbfbaa83-b8ca-403e-8fd7-732467b2f5ff',
  patientName: 'ROCKY',
  caseId: '0928979e-a016-481b-97e3-8ace19069910'
}
[2026-01-23T03:15:28.687Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "0928979e-a016-481b-97e3-8ace19069910",
  "externalId": "pims-appt-idexx-neo-351547",
  "appointmentId": "351547",
  "patientName": "ROCKY"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: 'd689b756-1d82-4b72-a613-7a9dcb08fdfd',
  patientName: 'MR. CAT',
  caseId: '2f8097e8-2f35-41d9-94dd-b1867090e80a'
}
[2026-01-23T03:15:29.017Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "2f8097e8-2f35-41d9-94dd-b1867090e80a",
  "externalId": "pims-appt-idexx-neo-351428",
  "appointmentId": "351428",
  "patientName": "MR. CAT"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: 'ae09d177-f21b-4ece-980a-827170943067',
  patientName: 'WALTER',
  caseId: 'd1e1cd74-db19-4dca-800c-f4db2a509120'
}
[2026-01-23T03:15:29.345Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "d1e1cd74-db19-4dca-800c-f4db2a509120",
  "externalId": "pims-appt-idexx-neo-351473",
  "appointmentId": "351473",
  "patientName": "WALTER"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '794105ac-5db2-4b4c-8b03-018112011f25',
  patientName: 'AUDREY',
  caseId: '3aaf52cd-44dd-4ec9-9da4-9a687dc6ca91'
}
[2026-01-23T03:15:29.696Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "3aaf52cd-44dd-4ec9-9da4-9a687dc6ca91",
  "externalId": "pims-appt-idexx-neo-351381",
  "appointmentId": "351381",
  "patientName": "AUDREY"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '01c93546-481f-4894-b718-229bf5883e1a',
  patientName: 'MUNCHI',
  caseId: 'e7b4d7a0-3aaf-4abb-b38d-d4ebd6619e1c'
}
[2026-01-23T03:15:30.037Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "e7b4d7a0-3aaf-4abb-b38d-d4ebd6619e1c",
  "externalId": "pims-appt-idexx-neo-351497",
  "appointmentId": "351497",
  "patientName": "MUNCHI"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '626e5555-bc49-4d05-a184-74cb88fe38a5',
  patientName: 'BLONCO',
  caseId: '967df09e-323f-4cad-8040-b02dc17a8418'
}
[2026-01-23T03:15:30.375Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "967df09e-323f-4cad-8040-b02dc17a8418",
  "externalId": "pims-appt-idexx-neo-351575",
  "appointmentId": "351575",
  "patientName": "BLONCO"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '523c986c-1fa6-4bea-b794-60daea369b70',
  patientName: 'LUNA',
  caseId: '112dd484-8228-43a9-9c90-7a328f03ffba'
}
[2026-01-23T03:15:30.698Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "112dd484-8228-43a9-9c90-7a328f03ffba",
  "externalId": "pims-appt-idexx-neo-351576",
  "appointmentId": "351576",
  "patientName": "LUNA"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: 'bba9fa50-ab49-4914-a0c1-f80a30b26d38',
  patientName: 'BRUNO',
  caseId: '403defad-593c-4382-8718-da16082b4f0c'
}
[2026-01-23T03:15:31.029Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "403defad-593c-4382-8718-da16082b4f0c",
  "externalId": "pims-appt-idexx-neo-351578",
  "appointmentId": "351578",
  "patientName": "BRUNO"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '0d6b3947-e560-4924-b8cf-0a5b179919df',
  patientName: 'Gumshoe',
  caseId: 'a7790e0b-dd06-44bf-ac8d-6df138762b3a'
}
[2026-01-23T03:15:31.365Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "a7790e0b-dd06-44bf-ac8d-6df138762b3a",
  "externalId": "pims-appt-idexx-neo-351543",
  "appointmentId": "351543",
  "patientName": "Gumshoe"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '3cbdb8db-df37-4c12-bb82-05319fd0a67c',
  patientName: 'DEXTER',
  caseId: 'e452d6a4-e1d1-47c3-8c61-d24fb9a70b00'
}
[2026-01-23T03:15:31.697Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "e452d6a4-e1d1-47c3-8c61-d24fb9a70b00",
  "externalId": "pims-appt-idexx-neo-351296",
  "appointmentId": "351296",
  "patientName": "DEXTER"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: 'd2e76b39-02da-423f-9517-e92d6c658c7e',
  patientName: 'ROSIE',
  caseId: '0fac17fb-c348-4399-a161-9a20aae2225c'
}
[2026-01-23T03:15:32.024Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "0fac17fb-c348-4399-a161-9a20aae2225c",
  "externalId": "pims-appt-idexx-neo-351371",
  "appointmentId": "351371",
  "patientName": "ROSIE"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: 'd19fc9a1-d774-4e0a-a60c-89dfe3479ae8',
  patientName: 'TITO',
  caseId: 'b833cc92-6b84-482f-b6d0-401ca8300360'
}
[2026-01-23T03:15:32.351Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "b833cc92-6b84-482f-b6d0-401ca8300360",
  "externalId": "pims-appt-idexx-neo-351592",
  "appointmentId": "351592",
  "patientName": "TITO"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '1be4a84d-2bc9-4759-9cc6-fdfe05feeda1',
  patientName: 'LUNA',
  caseId: 'ca7c950e-de60-465e-8bb0-e56865227de5'
}
[2026-01-23T03:15:32.678Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "ca7c950e-de60-465e-8bb0-e56865227de5",
  "externalId": "pims-appt-idexx-neo-351593",
  "appointmentId": "351593",
  "patientName": "LUNA"
}
[2026-01-23T03:15:32.969Z] [DEBUG] [scheduler:sync] Reloading clinic schedules...
[2026-01-23T03:15:32.969Z] [INFO] [scheduler:config-loader] Loading clinic sync schedules...
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '08c96c5e-812f-405c-9758-a7e1c1ab071d',
  patientName: 'LADY',
  caseId: '11f5fe5b-28e3-4ed1-8758-6a9dafe492f2'
}
[2026-01-23T03:15:33.003Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "11f5fe5b-28e3-4ed1-8758-6a9dafe492f2",
  "externalId": "pims-appt-idexx-neo-351599",
  "appointmentId": "351599",
  "patientName": "LADY"
}
[2026-01-23T03:15:33.231Z] [DEBUG] [scheduler:config-loader] No schedules configured for clinic {
  "clinicId": "33f3bbb8-6613-45bc-a1f2-d55e30c243ae"
}
[2026-01-23T03:15:33.231Z] [INFO] [scheduler:config-loader] Loaded clinic schedules {
  "totalClinics": 0,
  "totalSchedules": 0
}
[2026-01-23T03:15:33.231Z] [INFO] [scheduler:sync] Scheduled jobs created {
  "totalClinics": 0,
  "totalJobs": 0
}
[2026-01-23T03:15:33.231Z] [INFO] [scheduler:sync] Schedules reloaded {
  "totalJobs": 0
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '67326163-c99f-4e39-9c91-fe9f8c162d2c',
  patientName: 'LEELA',
  caseId: '3df30b09-8877-4a3c-80ae-e78efce3398a'
}
[2026-01-23T03:15:33.386Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "3df30b09-8877-4a3c-80ae-e78efce3398a",
  "externalId": "pims-appt-idexx-neo-351597",
  "appointmentId": "351597",
  "patientName": "LEELA"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: 'ee350c82-adac-49af-bebc-ab592d68c8e6',
  patientName: 'AMY',
  caseId: 'b2b762c4-4fee-429f-8a57-3c543cbb63d1'
}
[2026-01-23T03:15:33.719Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "b2b762c4-4fee-429f-8a57-3c543cbb63d1",
  "externalId": "pims-appt-idexx-neo-351605",
  "appointmentId": "351605",
  "patientName": "AMY"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '4e74b898-dce6-47eb-93d2-f2ce0428ffa8',
  patientName: 'GUERO',
  caseId: '7aeb3cfa-c16c-4903-a131-4ec430642b1d'
}
[2026-01-23T03:15:34.067Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "7aeb3cfa-c16c-4903-a131-4ec430642b1d",
  "externalId": "pims-appt-idexx-neo-351437",
  "appointmentId": "351437",
  "patientName": "GUERO"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: 'cfe59e4f-b40f-47fb-849b-0ed32fe5856e',
  patientName: 'PEANUT',
  caseId: '1ba8909f-09e4-4124-9b24-43526581e0e4'
}
[2026-01-23T03:15:34.404Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "1ba8909f-09e4-4124-9b24-43526581e0e4",
  "externalId": "pims-appt-idexx-neo-351608",
  "appointmentId": "351608",
  "patientName": "PEANUT"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '49a1838c-d437-4f63-8caa-967d5dbb46f9',
  patientName: 'BUTTERCUP',
  caseId: 'c2834506-b15d-44f4-8a1e-70a2a2fedb00'
}
[2026-01-23T03:15:34.733Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "c2834506-b15d-44f4-8a1e-70a2a2fedb00",
  "externalId": "pims-appt-idexx-neo-351545",
  "appointmentId": "351545",
  "patientName": "BUTTERCUP"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: 'a6adbf83-75fd-4fa4-bb94-3d06d63cb300',
  patientName: 'BUDDHA',
  caseId: 'bfde3af9-2461-4aaa-95f4-ca30188abc2c'
}
[2026-01-23T03:15:35.088Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "bfde3af9-2461-4aaa-95f4-ca30188abc2c",
  "externalId": "pims-appt-idexx-neo-351615",
  "appointmentId": "351615",
  "patientName": "BUDDHA"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '2eb0f266-25a4-499e-9600-63a0dfd39c49',
  patientName: 'zoey',
  caseId: '97a3b9b7-4968-48ff-9ecb-089bcf96ff16'
}
[2026-01-23T03:15:35.428Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "97a3b9b7-4968-48ff-9ecb-089bcf96ff16",
  "externalId": "pims-appt-idexx-neo-351510",
  "appointmentId": "351510",
  "patientName": "zoey"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: 'f301e2ef-bfdc-4b47-b65c-af79a6f7e085',
  patientName: 'BAILEY',
  caseId: 'a68b0ebf-fd6a-4fe5-85b5-4982a25ac414'
}
[2026-01-23T03:15:35.769Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "a68b0ebf-fd6a-4fe5-85b5-4982a25ac414",
  "externalId": "pims-appt-idexx-neo-351514",
  "appointmentId": "351514",
  "patientName": "BAILEY"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '4f085321-4c7a-489c-8f6e-29e8c7271a47',
  patientName: 'FRANKIE',
  caseId: '910af7fa-ae22-4606-b14f-11c81bff030a'
}
[2026-01-23T03:15:36.109Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "910af7fa-ae22-4606-b14f-11c81bff030a",
  "externalId": "pims-appt-idexx-neo-350729",
  "appointmentId": "350729",
  "patientName": "FRANKIE"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '5c6e3c47-a579-4ce9-aa97-bec9320b48ba',
  patientName: 'LUPITA',
  caseId: 'a77a2c26-2d87-45d6-a196-718dc5ae6b25'
}
[2026-01-23T03:15:36.443Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "a77a2c26-2d87-45d6-a196-718dc5ae6b25",
  "externalId": "pims-appt-idexx-neo-351607",
  "appointmentId": "351607",
  "patientName": "LUPITA"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '387d1fe1-e60b-4e61-bfdf-70b4bc70cae4',
  patientName: 'RICKY',
  caseId: '46737183-617a-4552-9bbc-95871eec025e'
}
[2026-01-23T03:15:36.785Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "46737183-617a-4552-9bbc-95871eec025e",
  "externalId": "pims-appt-idexx-neo-351419",
  "appointmentId": "351419",
  "patientName": "RICKY"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: 'ff615f40-0397-4e63-9b0c-66a0496dd987',
  patientName: 'RIO',
  caseId: '2aa3dd54-31de-49c0-b82f-88e60c57165d'
}
[2026-01-23T03:15:37.120Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "2aa3dd54-31de-49c0-b82f-88e60c57165d",
  "externalId": "pims-appt-idexx-neo-351507",
  "appointmentId": "351507",
  "patientName": "RIO"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '52ef1b82-770e-4a78-952e-e52c09c2381a',
  patientName: 'LUCKY',
  caseId: 'eb7418ca-9a21-4a1d-bc55-e1e23d589829'
}
[2026-01-23T03:15:37.462Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "eb7418ca-9a21-4a1d-bc55-e1e23d589829",
  "externalId": "pims-appt-idexx-neo-351559",
  "appointmentId": "351559",
  "patientName": "LUCKY"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: 'eaba9d09-78ff-420e-8ef8-ea8bb9eff42b',
  patientName: 'BAMBI',
  caseId: '183a4ea1-edd6-44fc-9c4d-30ccc85524d9'
}
[2026-01-23T03:15:37.787Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "183a4ea1-edd6-44fc-9c4d-30ccc85524d9",
  "externalId": "pims-appt-idexx-neo-351581",
  "appointmentId": "351581",
  "patientName": "BAMBI"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: 'a472cea8-d7eb-47b3-9460-2aa548322e8e',
  patientName: 'MAPLE',
  caseId: '00a5e03b-5d8c-4272-834c-2908721ef4d5'
}
[2026-01-23T03:15:38.113Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "00a5e03b-5d8c-4272-834c-2908721ef4d5",
  "externalId": "pims-appt-idexx-neo-351564",
  "appointmentId": "351564",
  "patientName": "MAPLE"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '54ecb72e-3bf7-44c6-bd9f-0ffbfd84a1b4',
  patientName: 'KIKO',
  caseId: 'ac2251ca-b28a-4c04-8c28-0a0a01c18dbb'
}
[2026-01-23T03:15:38.433Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "ac2251ca-b28a-4c04-8c28-0a0a01c18dbb",
  "externalId": "pims-appt-idexx-neo-351610",
  "appointmentId": "351610",
  "patientName": "KIKO"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: 'a982cf6c-7430-4c60-85cf-d66a2815c306',
  patientName: 'CANELA',
  caseId: '8bedc8ce-8603-48ff-a4a3-93982dda78f0'
}
[2026-01-23T03:15:38.778Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "8bedc8ce-8603-48ff-a4a3-93982dda78f0",
  "externalId": "pims-appt-idexx-neo-350294",
  "appointmentId": "350294",
  "patientName": "CANELA"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '97bf89b9-c746-4570-8273-d94d1d221aaf',
  patientName: 'KENNY',
  caseId: '4bfdb257-4709-41b4-bbb4-45fcfa841654'
}
[2026-01-23T03:15:39.115Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "4bfdb257-4709-41b4-bbb4-45fcfa841654",
  "externalId": "pims-appt-idexx-neo-351609",
  "appointmentId": "351609",
  "patientName": "KENNY"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: 'd60f8c33-40e2-4d5b-ad5b-074deef9647f',
  patientName: 'KOBE',
  caseId: '95c921d0-f901-473b-926b-8f3a892388b3'
}
[2026-01-23T03:15:39.450Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "95c921d0-f901-473b-926b-8f3a892388b3",
  "externalId": "pims-appt-idexx-neo-351612",
  "appointmentId": "351612",
  "patientName": "KOBE"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '431c1849-7ba4-48ff-8682-0e1df4870598',
  patientName: 'AHOY',
  caseId: 'fc8cf28d-41a6-45be-98ef-140a7ded0621'
}
[2026-01-23T03:15:39.795Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "fc8cf28d-41a6-45be-98ef-140a7ded0621",
  "externalId": "pims-appt-idexx-neo-351574",
  "appointmentId": "351574",
  "patientName": "AHOY"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '38239dd1-36cb-4575-a532-d6b5b8ef0fb6',
  patientName: 'Cookie',
  caseId: '492c07a2-ab38-4405-90e3-44e1f61ba600'
}
[2026-01-23T03:15:40.127Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "492c07a2-ab38-4405-90e3-44e1f61ba600",
  "externalId": "pims-appt-idexx-neo-351530",
  "appointmentId": "351530",
  "patientName": "Cookie"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '8905fb28-fe11-46e6-8a09-a6964ce14ed6',
  patientName: 'BELLA',
  caseId: '1e6fef61-3b05-47e1-b791-5e7c5a14ccfd'
}
[2026-01-23T03:15:40.461Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "1e6fef61-3b05-47e1-b791-5e7c5a14ccfd",
  "externalId": "pims-appt-idexx-neo-351562",
  "appointmentId": "351562",
  "patientName": "BELLA"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '8cbd1f9c-99c8-426c-a703-d29c21c952ba',
  patientName: 'CASPER',
  caseId: 'eb3733b8-bfea-4c80-9790-299557f10df0'
}
[2026-01-23T03:15:40.795Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "eb3733b8-bfea-4c80-9790-299557f10df0",
  "externalId": "pims-appt-idexx-neo-351558",
  "appointmentId": "351558",
  "patientName": "CASPER"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: 'a45749c0-dca0-4c3f-ae21-c07bfd33bd21',
  patientName: 'MILO',
  caseId: 'fa9ccc20-2813-4d42-8c05-5c04c9d70e4b'
}
[2026-01-23T03:15:41.127Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "fa9ccc20-2813-4d42-8c05-5c04c9d70e4b",
  "externalId": "pims-appt-idexx-neo-351577",
  "appointmentId": "351577",
  "patientName": "MILO"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '59367d22-106c-46d3-8acd-fc22dae61f63',
  patientName: 'KITTY',
  caseId: 'd6724b8d-8f4b-4749-9fbf-7d7a4a25219f'
}
[2026-01-23T03:15:41.461Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "d6724b8d-8f4b-4749-9fbf-7d7a4a25219f",
  "externalId": "pims-appt-idexx-neo-351582",
  "appointmentId": "351582",
  "patientName": "KITTY"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: 'b12464f7-cfd0-4aa8-88f2-be5e7764fb6a',
  patientName: 'MILAN',
  caseId: 'c192c703-6bb9-4713-99f8-81fbd51d68ab'
}
[2026-01-23T03:15:41.796Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "c192c703-6bb9-4713-99f8-81fbd51d68ab",
  "externalId": "pims-appt-idexx-neo-351604",
  "appointmentId": "351604",
  "patientName": "MILAN"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '58ea7efc-8210-44d2-9bc0-6e09ca3844a8',
  patientName: 'Sola',
  caseId: '61f21169-b1e9-403e-a566-6207c8c18b8a'
}
[2026-01-23T03:15:42.293Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "61f21169-b1e9-403e-a566-6207c8c18b8a",
  "externalId": "pims-appt-idexx-neo-351436",
  "appointmentId": "351436",
  "patientName": "Sola"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '6bb924d6-a70f-4d5e-8274-f5ce4ff5dfcd',
  patientName: 'AUDREY',
  caseId: 'c35c8320-5a03-418c-a51c-f15c2e19d551'
}
[2026-01-23T03:15:42.741Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "c35c8320-5a03-418c-a51c-f15c2e19d551",
  "externalId": "pims-appt-idexx-neo-351382",
  "appointmentId": "351382",
  "patientName": "AUDREY"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: 'aa442b16-d092-4d53-8d12-1927d2876ccb',
  patientName: 'EMMA',
  caseId: '1d39f687-9e68-46aa-8ec6-bf8963ca1e4a'
}
[2026-01-23T03:15:43.075Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "1d39f687-9e68-46aa-8ec6-bf8963ca1e4a",
  "externalId": "pims-appt-idexx-neo-350051",
  "appointmentId": "350051",
  "patientName": "EMMA"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '11fede76-bc78-401f-a324-7521b3497501',
  patientName: 'ADAM',
  caseId: 'e0a52ff1-4878-4134-b8a4-192fb9d77539'
}
[2026-01-23T03:15:43.407Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "e0a52ff1-4878-4134-b8a4-192fb9d77539",
  "externalId": "pims-appt-idexx-neo-351589",
  "appointmentId": "351589",
  "patientName": "ADAM"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '8a9d769a-1d63-4ba2-ac06-fd07e97b2eef',
  patientName: 'EVE',
  caseId: '66b3d577-caf1-45bc-8986-3a6a5d9e7d2b'
}
[2026-01-23T03:15:43.737Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "66b3d577-caf1-45bc-8986-3a6a5d9e7d2b",
  "externalId": "pims-appt-idexx-neo-351591",
  "appointmentId": "351591",
  "patientName": "EVE"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '3dd5d076-abc7-4b6c-b892-0e39f5bda59e',
  patientName: 'TUXEDO MASK',
  caseId: '3b0c9239-99d2-42a5-8345-eb9c3f82660c'
}
[2026-01-23T03:15:44.076Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "3b0c9239-99d2-42a5-8345-eb9c3f82660c",
  "externalId": "pims-appt-idexx-neo-351460",
  "appointmentId": "351460",
  "patientName": "TUXEDO MASK"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '8e04a81f-1dd7-4a7c-99a5-0441ad691958',
  patientName: 'SAMI',
  caseId: '0262b894-cbf1-4089-ad35-600e82b6091f'
}
[2026-01-23T03:15:44.414Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "0262b894-cbf1-4089-ad35-600e82b6091f",
  "externalId": "pims-appt-idexx-neo-351498",
  "appointmentId": "351498",
  "patientName": "SAMI"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '4d3753ab-821d-41e1-806a-36ce5350146f',
  patientName: 'LYKAN',
  caseId: '9b4d2b29-d9bf-498b-a6c5-89c4e8780ea4'
}
[2026-01-23T03:15:44.737Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "9b4d2b29-d9bf-498b-a6c5-89c4e8780ea4",
  "externalId": "pims-appt-idexx-neo-350313",
  "appointmentId": "350313",
  "patientName": "LYKAN"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: 'b57f1f70-b110-4644-9923-58037ed18a9f',
  patientName: 'DOG',
  caseId: 'a6061a36-a262-4323-ae0f-5e14f4f89b15'
}
[2026-01-23T03:15:45.082Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "a6061a36-a262-4323-ae0f-5e14f4f89b15",
  "externalId": "pims-appt-idexx-neo-351400",
  "appointmentId": "351400",
  "patientName": "DOG"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '2db4e454-8cc8-4a48-8507-ceae1f76147f',
  patientName: 'DOUGHVO',
  caseId: 'df1d205e-cdce-45b7-a1e1-cf52ab726ba0'
}
[2026-01-23T03:15:45.408Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "df1d205e-cdce-45b7-a1e1-cf52ab726ba0",
  "externalId": "pims-appt-idexx-neo-351595",
  "appointmentId": "351595",
  "patientName": "DOUGHVO"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '4d24f5c9-3816-469b-a85b-0f7e2b270e94',
  patientName: 'BRUNO',
  caseId: '628921aa-278d-42f5-84bc-196dc9795de8'
}
[2026-01-23T03:15:45.726Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "628921aa-278d-42f5-84bc-196dc9795de8",
  "externalId": "pims-appt-idexx-neo-351393",
  "appointmentId": "351393",
  "patientName": "BRUNO"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: 'e0d43acc-7b2d-430c-a408-9e3df99db989',
  patientName: 'GERTIE',
  caseId: '5e391e68-0156-4e98-ae30-6be6d20854d3'
}
[2026-01-23T03:15:46.067Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "5e391e68-0156-4e98-ae30-6be6d20854d3",
  "externalId": "pims-appt-idexx-neo-351503",
  "appointmentId": "351503",
  "patientName": "GERTIE"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '189fe38a-3dba-4e44-8b1c-e285391857a6',
  patientName: 'PAMELA',
  caseId: '2cc43dde-29d5-47a7-aab4-db09270a1832'
}
[2026-01-23T03:15:46.391Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "2cc43dde-29d5-47a7-aab4-db09270a1832",
  "externalId": "pims-appt-idexx-neo-350969",
  "appointmentId": "350969",
  "patientName": "PAMELA"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: 'c58d86f9-c65d-475c-bb11-eb982c6f5e7c',
  patientName: 'ODIN',
  caseId: '7efb8103-d653-43ce-ad2c-7bcb66da8441'
}
[2026-01-23T03:15:46.773Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "7efb8103-d653-43ce-ad2c-7bcb66da8441",
  "externalId": "pims-appt-idexx-neo-350979",
  "appointmentId": "350979",
  "patientName": "ODIN"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '37088f9a-1443-49de-b697-f73d7b18caf1',
  patientName: 'TARO',
  caseId: 'b8c14430-f45a-4e80-93f2-c88e90101290'
}
[2026-01-23T03:15:47.101Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "b8c14430-f45a-4e80-93f2-c88e90101290",
  "externalId": "pims-appt-idexx-neo-351525",
  "appointmentId": "351525",
  "patientName": "TARO"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: 'f86caeeb-3dba-4d28-bc8b-531b7e13204b',
  patientName: 'LUNA',
  caseId: 'c9171ece-065d-44ed-be7b-6d49c07007b4'
}
[2026-01-23T03:15:47.440Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "c9171ece-065d-44ed-be7b-6d49c07007b4",
  "externalId": "pims-appt-idexx-neo-350472",
  "appointmentId": "350472",
  "patientName": "LUNA"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '0cee569d-4fce-44c5-9a65-a514c65ea01f',
  patientName: 'FLACO',
  caseId: 'cc4778c3-ba20-4cf8-a70b-f4e82d59f8a3'
}
[2026-01-23T03:15:47.780Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "cc4778c3-ba20-4cf8-a70b-f4e82d59f8a3",
  "externalId": "pims-appt-idexx-neo-351429",
  "appointmentId": "351429",
  "patientName": "FLACO"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '30a55ca0-c1d8-4832-995f-baca92f9a3b8',
  patientName: 'YOKIE',
  caseId: '2c27cc7a-fbed-46d0-ae2a-601013c7a8e9'
}
[2026-01-23T03:15:48.220Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "2c27cc7a-fbed-46d0-ae2a-601013c7a8e9",
  "externalId": "pims-appt-idexx-neo-351482",
  "appointmentId": "351482",
  "patientName": "YOKIE"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '11da359d-6d7a-4e00-93e1-3618bc327af4',
  patientName: 'BEAR',
  caseId: '6100f517-586b-48da-a82d-28b08ad3e685'
}
[2026-01-23T03:15:48.652Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "6100f517-586b-48da-a82d-28b08ad3e685",
  "externalId": "pims-appt-idexx-neo-351596",
  "appointmentId": "351596",
  "patientName": "BEAR"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: 'b73240ab-94f3-4374-9cf3-cbdec27c755c',
  patientName: 'ARYA',
  caseId: '01cc2399-bfea-4ab8-af7f-41dedef31cb5'
}
[2026-01-23T03:15:48.980Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "01cc2399-bfea-4ab8-af7f-41dedef31cb5",
  "externalId": "pims-appt-idexx-neo-349223",
  "appointmentId": "349223",
  "patientName": "ARYA"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '8e36500d-18d0-4eef-a439-54d0b86c9552',
  patientName: 'ZEN',
  caseId: '328be852-0dda-4f61-af13-5c5bd7bb0584'
}
[2026-01-23T03:15:49.295Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "328be852-0dda-4f61-af13-5c5bd7bb0584",
  "externalId": "pims-appt-idexx-neo-351613",
  "appointmentId": "351613",
  "patientName": "ZEN"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: 'bce16bbe-c1cb-4e0a-b63c-5a3bc97ca31c',
  patientName: 'SANDY',
  caseId: '8fc82be2-841d-4cbd-979c-bcbf117ec6f1'
}
[2026-01-23T03:15:49.609Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "8fc82be2-841d-4cbd-979c-bcbf117ec6f1",
  "externalId": "pims-appt-idexx-neo-351124",
  "appointmentId": "351124",
  "patientName": "SANDY"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: 'ab28e89a-dfe8-459f-8b2e-51d6f5198dc9',
  patientName: 'LUNA',
  caseId: '59a42829-a956-4eff-90b2-a1fd2a7c2a08'
}
[2026-01-23T03:15:49.924Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "59a42829-a956-4eff-90b2-a1fd2a7c2a08",
  "externalId": "pims-appt-idexx-neo-348554",
  "appointmentId": "348554",
  "patientName": "LUNA"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: 'b0586427-a0b5-4c0f-8937-5ae558de0572',
  patientName: 'NALA',
  caseId: '781aefed-74f0-4d10-be94-8bfff310e19c'
}
[2026-01-23T03:15:50.241Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "781aefed-74f0-4d10-be94-8bfff310e19c",
  "externalId": "pims-appt-idexx-neo-349733",
  "appointmentId": "349733",
  "patientName": "NALA"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: 'f96dfe9b-e0e1-48ab-aef5-bbe9013d616d',
  patientName: 'NATARI',
  caseId: 'be9ddc7e-59ac-404a-9d49-a706e9412acc'
}
[2026-01-23T03:15:50.561Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "be9ddc7e-59ac-404a-9d49-a706e9412acc",
  "externalId": "pims-appt-idexx-neo-351571",
  "appointmentId": "351571",
  "patientName": "NATARI"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '9edca9b0-8c8e-4302-be1f-89382167398d',
  patientName: 'BRIZZLEY',
  caseId: 'c9c25624-89f7-45d2-9a9b-f16d4ff6f167'
}
[2026-01-23T03:15:50.891Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "c9c25624-89f7-45d2-9a9b-f16d4ff6f167",
  "externalId": "pims-appt-idexx-neo-351572",
  "appointmentId": "351572",
  "patientName": "BRIZZLEY"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '7ed44a4d-82b6-4942-b71e-df89d6f25d89',
  patientName: 'TYTUS',
  caseId: '47728b01-9e53-4a36-938f-ae9a95ad9166'
}
[2026-01-23T03:15:51.213Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "47728b01-9e53-4a36-938f-ae9a95ad9166",
  "externalId": "pims-appt-idexx-neo-351573",
  "appointmentId": "351573",
  "patientName": "TYTUS"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '6a3ac8e7-949a-4eba-ab6a-f6e6daa0c3b8',
  patientName: 'CHIKIS',
  caseId: '1a016a1e-aaf6-4e5d-92d6-8cd2e407fa35'
}
[2026-01-23T03:15:51.524Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "1a016a1e-aaf6-4e5d-92d6-8cd2e407fa35",
  "externalId": "pims-appt-idexx-neo-349734",
  "appointmentId": "349734",
  "patientName": "CHIKIS"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '3b61dc60-f968-4848-9524-468134712c27',
  patientName: 'TOMMY',
  caseId: '8a36af17-b8ba-43bd-ba74-9e9e4afbb025'
}
[2026-01-23T03:15:51.836Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "8a36af17-b8ba-43bd-ba74-9e9e4afbb025",
  "externalId": "pims-appt-idexx-neo-351594",
  "appointmentId": "351594",
  "patientName": "TOMMY"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '24c77c78-57ba-46f1-8f2e-7d4b040d0ba6',
  patientName: 'AMY',
  caseId: '84300925-0a91-470d-a528-f4ba93a436e9'
}
[2026-01-23T03:15:52.205Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "84300925-0a91-470d-a528-f4ba93a436e9",
  "externalId": "pims-appt-idexx-neo-351087",
  "appointmentId": "351087",
  "patientName": "AMY"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '7deb1dc0-abbb-40c5-9df2-e6a64fa98ea5',
  patientName: 'ROCKSIE',
  caseId: '87d4e0f9-b9c7-46c3-81cc-a467c35200b4'
}
[2026-01-23T03:15:52.516Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "87d4e0f9-b9c7-46c3-81cc-a467c35200b4",
  "externalId": "pims-appt-idexx-neo-348737",
  "appointmentId": "348737",
  "patientName": "ROCKSIE"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '923ced25-5310-4780-9b25-aa2e80c2efac',
  patientName: 'BRIGGS CUNNINGHAM',
  caseId: '392de838-ddd1-4022-b14a-8a7e9d6b2096'
}
[2026-01-23T03:15:52.843Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "392de838-ddd1-4022-b14a-8a7e9d6b2096",
  "externalId": "pims-appt-idexx-neo-351614",
  "appointmentId": "351614",
  "patientName": "BRIGGS CUNNINGHAM"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: 'd28859c6-07e2-440f-8cc0-4b66f2ff380d',
  patientName: 'CLYDE',
  caseId: '027b613a-c847-4599-9311-29c8c03fd304'
}
[2026-01-23T03:15:53.165Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "027b613a-c847-4599-9311-29c8c03fd304",
  "externalId": "pims-appt-idexx-neo-351606",
  "appointmentId": "351606",
  "patientName": "CLYDE"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '6e196c35-f036-410b-958c-146f390e13b6',
  patientName: 'LANI',
  caseId: 'cd5f1dc8-bafc-41e8-9448-c411bdfcf629'
}
[2026-01-23T03:15:53.475Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "cd5f1dc8-bafc-41e8-9448-c411bdfcf629",
  "externalId": "pims-appt-idexx-neo-351598",
  "appointmentId": "351598",
  "patientName": "LANI"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '6132f982-ee69-439f-bbf3-8c651c2abf17',
  patientName: 'AUDREY',
  caseId: 'd6726fb8-e455-4850-ac72-3a310f91f19d'
}
[2026-01-23T03:15:53.802Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "d6726fb8-e455-4850-ac72-3a310f91f19d",
  "externalId": "pims-appt-idexx-neo-351383",
  "appointmentId": "351383",
  "patientName": "AUDREY"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: 'ac7d7f4a-c6b3-497c-bba2-6ec7e63228c8',
  patientName: 'JAMES',
  caseId: 'a4d33bff-c12e-46af-93eb-23e5635ff2d1'
}
[2026-01-23T03:15:54.127Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "a4d33bff-c12e-46af-93eb-23e5635ff2d1",
  "externalId": "pims-appt-idexx-neo-350481",
  "appointmentId": "350481",
  "patientName": "JAMES"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '63c50ab5-221c-49d5-b932-8a17c209817e',
  patientName: 'PUDDING',
  caseId: '7d269049-4c6e-4d09-8e26-3d001a74680b'
}
[2026-01-23T03:15:54.446Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "7d269049-4c6e-4d09-8e26-3d001a74680b",
  "externalId": "pims-appt-idexx-neo-349765",
  "appointmentId": "349765",
  "patientName": "PUDDING"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '6aa1b84b-a16d-4027-abfe-4bbeab5ec3be',
  patientName: 'CHOCOLATE',
  caseId: '757c33a3-7ccf-4058-a141-0feee5a2abac'
}
[2026-01-23T03:15:54.783Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "757c33a3-7ccf-4058-a141-0feee5a2abac",
  "externalId": "pims-appt-idexx-neo-349768",
  "appointmentId": "349768",
  "patientName": "CHOCOLATE"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '35f8aa6f-9c96-4e6d-b054-f6197dff96f3',
  patientName: 'Keru',
  caseId: '0c0ce3dd-cd35-41a4-b810-ea31296719e4'
}
[2026-01-23T03:15:55.107Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "0c0ce3dd-cd35-41a4-b810-ea31296719e4",
  "externalId": "pims-appt-idexx-neo-350044",
  "appointmentId": "350044",
  "patientName": "Keru"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: 'db8c9476-e542-4ba1-8881-a11366a786f3',
  patientName: 'DAISY',
  caseId: 'a5420a61-a143-47fe-8318-e5b66613a4dd'
}
[2026-01-23T03:15:55.431Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "a5420a61-a143-47fe-8318-e5b66613a4dd",
  "externalId": "pims-appt-idexx-neo-351583",
  "appointmentId": "351583",
  "patientName": "DAISY"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '3458a94b-6bd3-4c1c-bb93-8603b0cff82d',
  patientName: '2 PUPPIES',
  caseId: 'c41d708f-8753-4ea9-98da-470d83f42f83'
}
[2026-01-23T03:15:55.828Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "c41d708f-8753-4ea9-98da-470d83f42f83",
  "externalId": "pims-appt-idexx-neo-351307",
  "appointmentId": "351307",
  "patientName": "2 PUPPIES"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '078ae612-0fce-4bdb-8601-895086f504d9',
  patientName: 'PRECIOUS',
  caseId: 'df957dd9-c54d-4ba8-93f0-fe9ae8793e1c'
}
[2026-01-23T03:15:56.150Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "df957dd9-c54d-4ba8-93f0-fe9ae8793e1c",
  "externalId": "pims-appt-idexx-neo-350518",
  "appointmentId": "350518",
  "patientName": "PRECIOUS"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '2b7a49ce-cddb-45bd-9ab5-5ac6dba6cc5f',
  patientName: 'HABIBI',
  caseId: '3ed0ef06-d627-4f99-99d0-915b343324d6'
}
[2026-01-23T03:15:56.477Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "3ed0ef06-d627-4f99-99d0-915b343324d6",
  "externalId": "pims-appt-idexx-neo-351312",
  "appointmentId": "351312",
  "patientName": "HABIBI"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '7785979f-eeaf-425c-afa8-25038d96812e',
  patientName: 'PATINA',
  caseId: 'f13172b1-4ab1-4689-bd7c-7b289d8b5db3'
}
[2026-01-23T03:15:56.793Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "f13172b1-4ab1-4689-bd7c-7b289d8b5db3",
  "externalId": "pims-appt-idexx-neo-351602",
  "appointmentId": "351602",
  "patientName": "PATINA"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '3f311075-6341-425f-8b17-b53654dff40c',
  patientName: 'LINA',
  caseId: '052f4c93-e332-42c9-9aaf-d9c18ac9c396'
}
[2026-01-23T03:15:57.116Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "052f4c93-e332-42c9-9aaf-d9c18ac9c396",
  "externalId": "pims-appt-idexx-neo-351587",
  "appointmentId": "351587",
  "patientName": "LINA"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '0d8eb045-83cd-4374-b663-1e79b309f162',
  patientName: 'PRESLEY',
  caseId: '550b7f6c-d07a-4735-9172-e865913546a5'
}
[2026-01-23T03:15:57.433Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "550b7f6c-d07a-4735-9172-e865913546a5",
  "externalId": "pims-appt-idexx-neo-349984",
  "appointmentId": "349984",
  "patientName": "PRESLEY"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: 'cbba0d28-59da-47a8-9d52-1043f015ba2a',
  patientName: 'OREO',
  caseId: '0bfb7e9b-980e-4e5a-88a0-2f37cb8dfb5e'
}
[2026-01-23T03:15:57.757Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "0bfb7e9b-980e-4e5a-88a0-2f37cb8dfb5e",
  "externalId": "pims-appt-idexx-neo-350557",
  "appointmentId": "350557",
  "patientName": "OREO"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '0d66c615-f132-4d83-b8b6-e2012e59b4e2',
  patientName: 'PRINCESS',
  caseId: '5f63fee1-b9ad-4422-a83a-dc9baf5b49ce'
}
[2026-01-23T03:15:58.072Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "5f63fee1-b9ad-4422-a83a-dc9baf5b49ce",
  "externalId": "pims-appt-idexx-neo-350544",
  "appointmentId": "350544",
  "patientName": "PRINCESS"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '7ce1c2b5-a619-4aeb-932c-ae45d8416766',
  patientName: 'DRACO',
  caseId: 'b520c2b0-a769-4503-bacc-eaad50652ef5'
}
[2026-01-23T03:15:58.412Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "b520c2b0-a769-4503-bacc-eaad50652ef5",
  "externalId": "pims-appt-idexx-neo-351458",
  "appointmentId": "351458",
  "patientName": "DRACO"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '7f53964d-509c-4725-b856-3f7ca9dcf802',
  patientName: 'MUSIC',
  caseId: '1f5187ec-454f-4aad-a670-9bd382102323'
}
[2026-01-23T03:15:58.754Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "1f5187ec-454f-4aad-a670-9bd382102323",
  "externalId": "pims-appt-idexx-neo-351603",
  "appointmentId": "351603",
  "patientName": "MUSIC"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '46505fd6-b30c-457b-b5fc-8e8067701b4a',
  patientName: 'BLOSSOM',
  caseId: '99f16d8a-e71d-4da1-bb9c-1913928ba53a'
}
[2026-01-23T03:15:59.071Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "99f16d8a-e71d-4da1-bb9c-1913928ba53a",
  "externalId": "pims-appt-idexx-neo-351501",
  "appointmentId": "351501",
  "patientName": "BLOSSOM"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: 'a231fdfd-7bf5-4f62-90f1-5a2608b4214f',
  patientName: 'ANNIE',
  caseId: '383e95fb-53e1-4d7a-afe9-f3cdd209ddc6'
}
[2026-01-23T03:15:59.386Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "383e95fb-53e1-4d7a-afe9-f3cdd209ddc6",
  "externalId": "pims-appt-idexx-neo-349949",
  "appointmentId": "349949",
  "patientName": "ANNIE"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: 'fd07dc22-fab5-4cde-a328-44aa7dda9b17',
  patientName: 'LUCAS',
  caseId: '6f667654-5d12-4a70-9574-b630d3281615'
}
[2026-01-23T03:15:59.729Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "6f667654-5d12-4a70-9574-b630d3281615",
  "externalId": "pims-appt-idexx-neo-351366",
  "appointmentId": "351366",
  "patientName": "LUCAS"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '3c5d4472-3bee-4da8-8e44-e14fda77f2c9',
  patientName: 'AUDREY',
  caseId: 'c2e61eb7-1aa3-46f8-8a03-79f3311dfa63'
}
[2026-01-23T03:16:00.064Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "c2e61eb7-1aa3-46f8-8a03-79f3311dfa63",
  "externalId": "pims-appt-idexx-neo-351384",
  "appointmentId": "351384",
  "patientName": "AUDREY"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '8c1b444a-4d7e-4a75-8a0d-988051c49390',
  patientName: 'BEYONCE',
  caseId: '159418ad-9463-4ad0-bcec-9c7eda101fa4'
}
[2026-01-23T03:16:00.381Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "159418ad-9463-4ad0-bcec-9c7eda101fa4",
  "externalId": "pims-appt-idexx-neo-351485",
  "appointmentId": "351485",
  "patientName": "BEYONCE"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '2631b8db-c58a-423f-892e-99dae46840a0',
  patientName: 'TIPSY',
  caseId: 'a420999c-f152-44c2-9e3c-e6bd379a8b5a'
}
[2026-01-23T03:16:00.698Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "a420999c-f152-44c2-9e3c-e6bd379a8b5a",
  "externalId": "pims-appt-idexx-neo-351220",
  "appointmentId": "351220",
  "patientName": "TIPSY"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '245761b5-7b72-467c-bbb4-af3b75d8aaf1',
  patientName: 'CANELA',
  caseId: 'bb82d598-43d8-4cd8-9e77-596ae9d68455'
}
[2026-01-23T03:16:01.013Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "bb82d598-43d8-4cd8-9e77-596ae9d68455",
  "externalId": "pims-appt-idexx-neo-350713",
  "appointmentId": "350713",
  "patientName": "CANELA"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '25ccd501-44f3-4bbe-bee2-8aaa2d432f1f',
  patientName: 'GENESIS',
  caseId: '416908a5-0dca-4c0a-8013-782549db5384'
}
[2026-01-23T03:16:01.340Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "416908a5-0dca-4c0a-8013-782549db5384",
  "externalId": "pims-appt-idexx-neo-350650",
  "appointmentId": "350650",
  "patientName": "GENESIS"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: 'd66e8ebc-40c8-4f02-be54-96fabd15c895',
  patientName: 'Tiger',
  caseId: '342b1be7-db70-499e-a813-f41c03e77177'
}
[2026-01-23T03:16:01.673Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "342b1be7-db70-499e-a813-f41c03e77177",
  "externalId": "pims-appt-idexx-neo-349904",
  "appointmentId": "349904",
  "patientName": "Tiger"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '52506664-5fd3-4d68-837f-291b22f7a524',
  patientName: 'BAGHEERA',
  caseId: '3074a53f-59b9-4472-8461-834512908b7b'
}
[2026-01-23T03:16:02.064Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "3074a53f-59b9-4472-8461-834512908b7b",
  "externalId": "pims-appt-idexx-neo-351008",
  "appointmentId": "351008",
  "patientName": "BAGHEERA"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '6dfb1965-3bf0-4c7e-a500-5e774541d731',
  patientName: 'AUDREY',
  caseId: 'b6192af8-12d3-4001-a9cd-1512aafe3e89'
}
[2026-01-23T03:16:02.374Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "b6192af8-12d3-4001-a9cd-1512aafe3e89",
  "externalId": "pims-appt-idexx-neo-351385",
  "appointmentId": "351385",
  "patientName": "AUDREY"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: 'c34a0f68-6dcd-4759-bee9-f68c9f850ab3',
  patientName: 'DAKOTA',
  caseId: '59eb3ff1-6c49-42fa-9fa4-d72f1b96f4a7'
}
[2026-01-23T03:16:02.688Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "59eb3ff1-6c49-42fa-9fa4-d72f1b96f4a7",
  "externalId": "pims-appt-idexx-neo-350926",
  "appointmentId": "350926",
  "patientName": "DAKOTA"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '902947d2-87b0-44f2-bd32-1a7b2caacd23',
  patientName: 'ALASKA',
  caseId: 'efce3655-0496-46c3-a0b4-04efe0fc634c'
}
[2026-01-23T03:16:03.000Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "efce3655-0496-46c3-a0b4-04efe0fc634c",
  "externalId": "pims-appt-idexx-neo-350927",
  "appointmentId": "350927",
  "patientName": "ALASKA"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: 'a2e0d9fe-3c10-47af-92fd-580991dbef4b',
  patientName: 'KIKI',
  caseId: 'f956729e-e5f2-428f-af52-b987b3920f2c'
}
[2026-01-23T03:16:03.310Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "f956729e-e5f2-428f-af52-b987b3920f2c",
  "externalId": "pims-appt-idexx-neo-351017",
  "appointmentId": "351017",
  "patientName": "KIKI"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '417dba95-0148-4787-ac67-e3b31101979a',
  patientName: 'RUYA',
  caseId: '11282fa1-acec-47a9-8938-359d245e1f79'
}
[2026-01-23T03:16:03.623Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "11282fa1-acec-47a9-8938-359d245e1f79",
  "externalId": "pims-appt-idexx-neo-350645",
  "appointmentId": "350645",
  "patientName": "RUYA"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '61ae20e3-5062-4ecf-8eea-4146679530a8',
  patientName: 'YOKIE',
  caseId: '7eaf3bdc-45e9-458f-a283-efb120bfb1de'
}
[2026-01-23T03:16:03.966Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "7eaf3bdc-45e9-458f-a283-efb120bfb1de",
  "externalId": "pims-appt-idexx-neo-351588",
  "appointmentId": "351588",
  "patientName": "YOKIE"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '9f26d798-2df9-4df0-9185-e52a5f6a96eb',
  patientName: 'TUTU',
  caseId: '8d7cbba8-1de3-4fbc-8185-12f20ab459c8'
}
[2026-01-23T03:16:04.286Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "8d7cbba8-1de3-4fbc-8185-12f20ab459c8",
  "externalId": "pims-appt-idexx-neo-351377",
  "appointmentId": "351377",
  "patientName": "TUTU"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '0b3e75f7-1b6a-4eb7-95a7-7b67781b51c1',
  patientName: 'DOZER',
  caseId: '5f2a3795-aaab-40b5-9e6c-36b924811daa'
}
[2026-01-23T03:16:04.599Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "5f2a3795-aaab-40b5-9e6c-36b924811daa",
  "externalId": "pims-appt-idexx-neo-351479",
  "appointmentId": "351479",
  "patientName": "DOZER"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: 'e61b472e-3f0e-49a8-9af2-c0f9353f88e1',
  patientName: 'PRINCE',
  caseId: '0f3cc42b-eee0-43e5-915b-881ef10aebad'
}
[2026-01-23T03:16:04.927Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "0f3cc42b-eee0-43e5-915b-881ef10aebad",
  "externalId": "pims-appt-idexx-neo-351341",
  "appointmentId": "351341",
  "patientName": "PRINCE"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: 'a84f4f98-529e-48ce-be31-abcc740fdf13',
  patientName: 'DORO',
  caseId: '9af79cfd-8ed6-4918-b248-f21753d3e9e6'
}
[2026-01-23T03:16:05.250Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "9af79cfd-8ed6-4918-b248-f21753d3e9e6",
  "externalId": "pims-appt-idexx-neo-350060",
  "appointmentId": "350060",
  "patientName": "DORO"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '18f4503d-dbe9-43e1-9faa-293795e37056',
  patientName: 'TIGER',
  caseId: '6bc6e931-0539-4454-b512-63c3f0115b4a'
}
[2026-01-23T03:16:05.561Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "6bc6e931-0539-4454-b512-63c3f0115b4a",
  "externalId": "pims-appt-idexx-neo-350097",
  "appointmentId": "350097",
  "patientName": "TIGER"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '5b1019ea-5209-4656-bae6-5ad6e4e1b244',
  patientName: 'NENO',
  caseId: 'd6d26918-a693-4f53-8cb1-1eedf97b9775'
}
[2026-01-23T03:16:05.880Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "d6d26918-a693-4f53-8cb1-1eedf97b9775",
  "externalId": "pims-appt-idexx-neo-350099",
  "appointmentId": "350099",
  "patientName": "NENO"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '0853e510-817c-4759-9910-f8fa5895fc6b',
  patientName: 'BISCONDE',
  caseId: '3297e537-1e99-4b4b-a343-36a8c2809539'
}
[2026-01-23T03:16:06.199Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "3297e537-1e99-4b4b-a343-36a8c2809539",
  "externalId": "pims-appt-idexx-neo-350101",
  "appointmentId": "350101",
  "patientName": "BISCONDE"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: 'a0dd8a45-76f9-48e2-98b7-e1006e2eee17',
  patientName: 'BENTLEY',
  caseId: 'cff8d6c0-2cea-437b-a878-fe29cbec9da5'
}
[2026-01-23T03:16:06.518Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "cff8d6c0-2cea-437b-a878-fe29cbec9da5",
  "externalId": "pims-appt-idexx-neo-350837",
  "appointmentId": "350837",
  "patientName": "BENTLEY"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: 'b3704b31-1f2b-4aad-b128-00c02fce91bf',
  patientName: 'PEACHES',
  caseId: '796ddf1b-8b96-4a5f-a255-c9136e2cf10b'
}
[2026-01-23T03:16:06.837Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "796ddf1b-8b96-4a5f-a255-c9136e2cf10b",
  "externalId": "pims-appt-idexx-neo-350786",
  "appointmentId": "350786",
  "patientName": "PEACHES"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '00d68270-8041-450e-b976-122463041477',
  patientName: 'WOODY',
  caseId: 'b7d729d4-0145-4cb4-89d6-0f4d2b330659'
}
[2026-01-23T03:16:07.152Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "b7d729d4-0145-4cb4-89d6-0f4d2b330659",
  "externalId": "pims-appt-idexx-neo-350835",
  "appointmentId": "350835",
  "patientName": "WOODY"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '7ee6ad2d-8491-4fda-976c-83da07166aaa',
  patientName: 'NORI',
  caseId: '7a58c120-2b29-4f37-91f0-8cc5e709aede'
}
[2026-01-23T03:16:07.629Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "7a58c120-2b29-4f37-91f0-8cc5e709aede",
  "externalId": "pims-appt-idexx-neo-350175",
  "appointmentId": "350175",
  "patientName": "NORI"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '706b7ea6-ba93-4b77-89fb-0b20e94cd28f',
  patientName: 'MISTY',
  caseId: '136ca05c-f25c-49d5-814a-cc689871ea8d'
}
[2026-01-23T03:16:07.942Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "136ca05c-f25c-49d5-814a-cc689871ea8d",
  "externalId": "pims-appt-idexx-neo-351499",
  "appointmentId": "351499",
  "patientName": "MISTY"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '2873cf76-0ad6-421d-b58f-066fce6428f5',
  patientName: 'Coco',
  caseId: '8c629739-0fd8-48d0-923e-cb4f75675207'
}
[2026-01-23T03:16:08.259Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "8c629739-0fd8-48d0-923e-cb4f75675207",
  "externalId": "pims-appt-idexx-neo-350833",
  "appointmentId": "350833",
  "patientName": "Coco"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: 'aab4c24e-ee17-4dc0-af28-64f3bfb72f0b',
  patientName: 'CEDAR',
  caseId: '4b269484-bb7a-44b1-80dc-aaebe833a646'
}
[2026-01-23T03:16:08.607Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "4b269484-bb7a-44b1-80dc-aaebe833a646",
  "externalId": "pims-appt-idexx-neo-350062",
  "appointmentId": "350062",
  "patientName": "CEDAR"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: 'dca01a2a-f2ee-4d45-9efc-acf7a40c3a23',
  patientName: 'zoey',
  caseId: '4145d6f4-3fa5-458b-a503-db0efc3a6fe9'
}
[2026-01-23T03:16:08.933Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "4145d6f4-3fa5-458b-a503-db0efc3a6fe9",
  "externalId": "pims-appt-idexx-neo-350805",
  "appointmentId": "350805",
  "patientName": "zoey"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: 'd20206df-5281-425f-98db-58b4df958d84',
  patientName: 'blaze',
  caseId: '4a0356e0-f6df-4d1c-9ed1-3bd29edb70c0'
}
[2026-01-23T03:16:09.249Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "4a0356e0-f6df-4d1c-9ed1-3bd29edb70c0",
  "externalId": "pims-appt-idexx-neo-350049",
  "appointmentId": "350049",
  "patientName": "blaze"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: 'e1f30c1a-1c1e-4045-8d81-a7776e0546e7',
  patientName: 'MANGO',
  caseId: '6853c3b7-d91a-4980-b687-52fca1d670ab'
}
[2026-01-23T03:16:09.595Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "6853c3b7-d91a-4980-b687-52fca1d670ab",
  "externalId": "pims-appt-idexx-neo-350273",
  "appointmentId": "350273",
  "patientName": "MANGO"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '20eb211c-bdad-430d-8995-85994ee1412d',
  patientName: 'PUMPKIN',
  caseId: '616e707e-5622-47fa-82a8-c8cfb80f1c2c'
}
[2026-01-23T03:16:09.968Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "616e707e-5622-47fa-82a8-c8cfb80f1c2c",
  "externalId": "pims-appt-idexx-neo-350949",
  "appointmentId": "350949",
  "patientName": "PUMPKIN"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '9b27078e-65f1-4801-9c03-a71fa8a5be76',
  patientName: 'SOFIA',
  caseId: 'f0ccdb80-3117-4380-97c6-a7f4e42328af'
}
[2026-01-23T03:16:10.338Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "f0ccdb80-3117-4380-97c6-a7f4e42328af",
  "externalId": "pims-appt-idexx-neo-350265",
  "appointmentId": "350265",
  "patientName": "SOFIA"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: '3d3ca7db-8a06-4851-b7c7-cbf21d97f3d3',
  patientName: 'Kamora',
  caseId: 'dc5114e1-7282-415e-b305-d9b928f49f10'
}
[2026-01-23T03:16:10.646Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "dc5114e1-7282-415e-b305-d9b928f49f10",
  "externalId": "pims-appt-idexx-neo-350966",
  "appointmentId": "350966",
  "patientName": "Kamora"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: 'f0661f19-1ec3-4b6a-a276-52133254e1a7',
  patientName: 'PUA',
  caseId: '3c254257-86a7-4239-ab85-56886eabbc94'
}
[2026-01-23T03:16:10.958Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "3c254257-86a7-4239-ab85-56886eabbc94",
  "externalId": "pims-appt-idexx-neo-350967",
  "appointmentId": "350967",
  "patientName": "PUA"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: 'e209960b-78c6-4686-854b-663332a4bbab',
  patientName: 'Piko',
  caseId: '8882e401-fa06-46c5-84c5-618c37dd9277'
}
[2026-01-23T03:16:11.270Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "8882e401-fa06-46c5-84c5-618c37dd9277",
  "externalId": "pims-appt-idexx-neo-350968",
  "appointmentId": "350968",
  "patientName": "Piko"
}
[CaseCRUD] Created patient from PIMS appointment {
  patientId: 'fbdb9a8c-3c7b-4858-ac60-3760ac97c53d',
  patientName: 'PO',
  caseId: 'e8ab96e6-62c3-4ee3-a636-32975725e7f0'
}
[2026-01-23T03:16:11.590Z] [DEBUG] [inbound-sync] Created new case with patient from appointment {
  "caseId": "e8ab96e6-62c3-4ee3-a636-32975725e7f0",
  "externalId": "pims-appt-idexx-neo-350951",
  "appointmentId": "350951",
  "patientName": "PO"
}
[2026-01-23T03:16:11.711Z] [INFO] [inbound-sync] Inbound sync completed {
  "syncId": "050acea2-c0f4-4ddc-b2c4-6e4b2615bf5e",
  "stats": {
    "total": 143,
    "created": 143,
    "updated": 0,
    "skipped": 0,
    "failed": 0
  },
  "durationMs": 49336,
  "hasErrors": false
}
[2026-01-23T03:16:11.713Z] [INFO] [case-sync] Starting case sync {
  "syncId": "6897ab99-cc32-42dd-8db6-7d873c22826b",
  "clinicId": "33f3bbb8-6613-45bc-a1f2-d55e30c243ae",
  "provider": "IDEXX Neo",
  "dateRange": {
    "start": "2026-01-22T08:00:00.000Z",
    "end": "2026-01-30T07:59:59.999Z"
  }
}
[2026-01-23T03:16:11.918Z] [INFO] [case-sync] Found cases needing enrichment {
  "syncId": "6897ab99-cc32-42dd-8db6-7d873c22826b",
  "count": 143
}
[2026-01-23T03:16:11.919Z] [INFO] [case-sync] Fetching consultations from PIMS {
  "syncId": "6897ab99-cc32-42dd-8db6-7d873c22826b",
  "count": 35
}
[IdexxProvider] Fetching consultation: 728004
[IdexxProvider] Fetching consultation: 727928
[IdexxProvider] Fetching consultation: 727930
[IdexxProvider] Fetching consultation: 727931
[IdexxProvider] Fetching consultation: 727933
Failed to fetch consultation 727928: page.evaluate: TypeError: Failed to fetch
    at eval (eval at evaluate (:290:30), <anonymous>:2:29)
    at UtilityScript.evaluate (<anonymous>:292:16)
    at UtilityScript.<anonymous> (<anonymous>:1:44)
    at IdexxConsultationClient.fetchConsultationFromApi (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4730:37)
    at IdexxConsultationClient.fetchConsultation (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4713:43)
    at async IdexxProvider.fetchConsultation (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4927:32)
    at async /Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5881:38
    at async CaseSyncService.fetchConsultationsBatched (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5878:32)
    at async CaseSyncService.sync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5752:33)
    at async SyncOrchestrator.runFullSync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:6249:28)
    at async handleFullSync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:7259:22)
Failed to fetch consultation 727930: page.evaluate: TypeError: Failed to fetch
    at eval (eval at evaluate (:290:30), <anonymous>:2:29)
    at UtilityScript.evaluate (<anonymous>:292:16)
    at UtilityScript.<anonymous> (<anonymous>:1:44)
    at IdexxConsultationClient.fetchConsultationFromApi (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4730:37)
    at IdexxConsultationClient.fetchConsultation (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4713:43)
    at async IdexxProvider.fetchConsultation (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4927:32)
    at async /Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5881:38
    at async CaseSyncService.fetchConsultationsBatched (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5878:32)
    at async CaseSyncService.sync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5752:33)
    at async SyncOrchestrator.runFullSync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:6249:28)
    at async handleFullSync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:7259:22)
Failed to fetch consultation 727933: page.evaluate: TypeError: Failed to fetch
    at eval (eval at evaluate (:290:30), <anonymous>:2:29)
    at UtilityScript.evaluate (<anonymous>:292:16)
    at UtilityScript.<anonymous> (<anonymous>:1:44)
    at IdexxConsultationClient.fetchConsultationFromApi (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4730:37)
    at IdexxConsultationClient.fetchConsultation (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4713:43)
    at async IdexxProvider.fetchConsultation (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4927:32)
    at async /Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5881:38
    at async CaseSyncService.fetchConsultationsBatched (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5878:32)
    at async CaseSyncService.sync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5752:33)
    at async SyncOrchestrator.runFullSync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:6249:28)
    at async handleFullSync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:7259:22)
Failed to fetch consultation 727931: page.evaluate: TypeError: Failed to fetch
    at eval (eval at evaluate (:290:30), <anonymous>:2:29)
    at UtilityScript.evaluate (<anonymous>:292:16)
    at UtilityScript.<anonymous> (<anonymous>:1:44)
    at IdexxConsultationClient.fetchConsultationFromApi (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4730:37)
    at IdexxConsultationClient.fetchConsultation (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4713:43)
    at async IdexxProvider.fetchConsultation (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4927:32)
    at async /Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5881:38
    at async CaseSyncService.fetchConsultationsBatched (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5878:32)
    at async CaseSyncService.sync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5752:33)
    at async SyncOrchestrator.runFullSync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:6249:28)
    at async handleFullSync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:7259:22)
Failed to fetch consultation 728004: page.evaluate: TypeError: Failed to fetch
    at eval (eval at evaluate (:290:30), <anonymous>:2:29)
    at UtilityScript.evaluate (<anonymous>:292:16)
    at UtilityScript.<anonymous> (<anonymous>:1:44)
    at IdexxConsultationClient.fetchConsultationFromApi (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4730:37)
    at IdexxConsultationClient.fetchConsultation (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4713:43)
    at async IdexxProvider.fetchConsultation (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4927:32)
    at async /Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5881:38
    at async CaseSyncService.fetchConsultationsBatched (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5878:32)
    at async CaseSyncService.sync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5752:33)
    at async SyncOrchestrator.runFullSync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:6249:28)
    at async handleFullSync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:7259:22)
[IdexxProvider] Consultation: NOT FOUND
[IdexxProvider] Consultation: NOT FOUND
[IdexxProvider] Consultation: NOT FOUND
[IdexxProvider] Consultation: NOT FOUND
[IdexxProvider] Consultation: NOT FOUND
[IdexxProvider] Fetching consultation: 727935
[IdexxProvider] Fetching consultation: 727943
[IdexxProvider] Fetching consultation: 727937
[IdexxProvider] Fetching consultation: 727947
[IdexxProvider] Fetching consultation: 727948
Failed to fetch consultation 727947: page.evaluate: TypeError: Failed to fetch
    at eval (eval at evaluate (:290:30), <anonymous>:2:29)
    at UtilityScript.evaluate (<anonymous>:292:16)
    at UtilityScript.<anonymous> (<anonymous>:1:44)
    at IdexxConsultationClient.fetchConsultationFromApi (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4730:37)
    at IdexxConsultationClient.fetchConsultation (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4713:43)
    at async IdexxProvider.fetchConsultation (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4927:32)
    at async /Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5881:38
    at async CaseSyncService.fetchConsultationsBatched (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5878:32)
    at async CaseSyncService.sync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5752:33)
    at async SyncOrchestrator.runFullSync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:6249:28)
    at async handleFullSync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:7259:22)
[IdexxProvider] Consultation: NOT FOUND
Failed to fetch consultation 727937: page.evaluate: TypeError: Failed to fetch
    at eval (eval at evaluate (:290:30), <anonymous>:2:29)
    at UtilityScript.evaluate (<anonymous>:292:16)
    at UtilityScript.<anonymous> (<anonymous>:1:44)
    at IdexxConsultationClient.fetchConsultationFromApi (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4730:37)
    at IdexxConsultationClient.fetchConsultation (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4713:43)
    at async IdexxProvider.fetchConsultation (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4927:32)
    at async /Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5881:38
    at async CaseSyncService.fetchConsultationsBatched (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5878:32)
    at async CaseSyncService.sync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5752:33)
    at async SyncOrchestrator.runFullSync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:6249:28)
    at async handleFullSync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:7259:22)
[IdexxProvider] Consultation: NOT FOUND
Failed to fetch consultation 727943: page.evaluate: TypeError: Failed to fetch
    at eval (eval at evaluate (:290:30), <anonymous>:2:29)
    at UtilityScript.evaluate (<anonymous>:292:16)
    at UtilityScript.<anonymous> (<anonymous>:1:44)
    at IdexxConsultationClient.fetchConsultationFromApi (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4730:37)
    at IdexxConsultationClient.fetchConsultation (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4713:43)
    at async IdexxProvider.fetchConsultation (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4927:32)
    at async /Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5881:38
    at async CaseSyncService.fetchConsultationsBatched (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5878:32)
    at async CaseSyncService.sync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5752:33)
    at async SyncOrchestrator.runFullSync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:6249:28)
    at async handleFullSync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:7259:22)
[IdexxProvider] Consultation: NOT FOUND
Failed to fetch consultation 727948: page.evaluate: TypeError: Failed to fetch
    at eval (eval at evaluate (:290:30), <anonymous>:2:29)
    at UtilityScript.evaluate (<anonymous>:292:16)
    at UtilityScript.<anonymous> (<anonymous>:1:44)
    at IdexxConsultationClient.fetchConsultationFromApi (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4730:37)
    at IdexxConsultationClient.fetchConsultation (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4713:43)
    at async IdexxProvider.fetchConsultation (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4927:32)
    at async /Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5881:38
    at async CaseSyncService.fetchConsultationsBatched (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5878:32)
    at async CaseSyncService.sync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5752:33)
    at async SyncOrchestrator.runFullSync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:6249:28)
    at async handleFullSync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:7259:22)
[IdexxProvider] Consultation: NOT FOUND
Failed to fetch consultation 727935: page.evaluate: TypeError: Failed to fetch
    at eval (eval at evaluate (:290:30), <anonymous>:2:29)
    at UtilityScript.evaluate (<anonymous>:292:16)
    at UtilityScript.<anonymous> (<anonymous>:1:44)
    at IdexxConsultationClient.fetchConsultationFromApi (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4730:37)
    at IdexxConsultationClient.fetchConsultation (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4713:43)
    at async IdexxProvider.fetchConsultation (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4927:32)
    at async /Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5881:38
    at async CaseSyncService.fetchConsultationsBatched (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5878:32)
    at async CaseSyncService.sync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5752:33)
    at async SyncOrchestrator.runFullSync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:6249:28)
    at async handleFullSync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:7259:22)
[IdexxProvider] Consultation: NOT FOUND
[IdexxProvider] Fetching consultation: 727938
[IdexxProvider] Fetching consultation: 727945
[IdexxProvider] Fetching consultation: 727955
[IdexxProvider] Fetching consultation: 727952
[IdexxProvider] Fetching consultation: 727953
Failed to fetch consultation 727955: page.evaluate: TypeError: Failed to fetch
    at eval (eval at evaluate (:290:30), <anonymous>:2:29)
    at UtilityScript.evaluate (<anonymous>:292:16)
    at UtilityScript.<anonymous> (<anonymous>:1:44)
    at IdexxConsultationClient.fetchConsultationFromApi (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4730:37)
    at IdexxConsultationClient.fetchConsultation (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4713:43)
    at async IdexxProvider.fetchConsultation (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4927:32)
    at async /Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5881:38
    at async CaseSyncService.fetchConsultationsBatched (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5878:32)
    at async CaseSyncService.sync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5752:33)
    at async SyncOrchestrator.runFullSync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:6249:28)
    at async handleFullSync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:7259:22)
[IdexxProvider] Consultation: NOT FOUND
Failed to fetch consultation 727938: page.evaluate: TypeError: Failed to fetch
    at eval (eval at evaluate (:290:30), <anonymous>:2:29)
    at UtilityScript.evaluate (<anonymous>:292:16)
    at UtilityScript.<anonymous> (<anonymous>:1:44)
    at IdexxConsultationClient.fetchConsultationFromApi (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4730:37)
    at IdexxConsultationClient.fetchConsultation (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4713:43)
    at async IdexxProvider.fetchConsultation (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4927:32)
    at async /Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5881:38
    at async CaseSyncService.fetchConsultationsBatched (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5878:32)
    at async CaseSyncService.sync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5752:33)
    at async SyncOrchestrator.runFullSync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:6249:28)
    at async handleFullSync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:7259:22)
[IdexxProvider] Consultation: NOT FOUND
Failed to fetch consultation 727953: page.evaluate: TypeError: Failed to fetch
    at eval (eval at evaluate (:290:30), <anonymous>:2:29)
    at UtilityScript.evaluate (<anonymous>:292:16)
    at UtilityScript.<anonymous> (<anonymous>:1:44)
    at IdexxConsultationClient.fetchConsultationFromApi (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4730:37)
    at IdexxConsultationClient.fetchConsultation (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4713:43)
    at async IdexxProvider.fetchConsultation (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4927:32)
    at async /Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5881:38
    at async CaseSyncService.fetchConsultationsBatched (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5878:32)
    at async CaseSyncService.sync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5752:33)
    at async SyncOrchestrator.runFullSync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:6249:28)
    at async handleFullSync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:7259:22)
[IdexxProvider] Consultation: NOT FOUND
Failed to fetch consultation 727945: page.evaluate: TypeError: Failed to fetch
    at eval (eval at evaluate (:290:30), <anonymous>:2:29)
    at UtilityScript.evaluate (<anonymous>:292:16)
    at UtilityScript.<anonymous> (<anonymous>:1:44)
    at IdexxConsultationClient.fetchConsultationFromApi (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4730:37)
    at IdexxConsultationClient.fetchConsultation (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4713:43)
    at async IdexxProvider.fetchConsultation (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4927:32)
    at async /Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5881:38
    at async CaseSyncService.fetchConsultationsBatched (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5878:32)
    at async CaseSyncService.sync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5752:33)
    at async SyncOrchestrator.runFullSync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:6249:28)
    at async handleFullSync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:7259:22)
[IdexxProvider] Consultation: NOT FOUND
Failed to fetch consultation 727952: page.evaluate: TypeError: Failed to fetch
    at eval (eval at evaluate (:290:30), <anonymous>:2:29)
    at UtilityScript.evaluate (<anonymous>:292:16)
    at UtilityScript.<anonymous> (<anonymous>:1:44)
    at IdexxConsultationClient.fetchConsultationFromApi (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4730:37)
    at IdexxConsultationClient.fetchConsultation (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4713:43)
    at async IdexxProvider.fetchConsultation (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4927:32)
    at async /Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5881:38
    at async CaseSyncService.fetchConsultationsBatched (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5878:32)
    at async CaseSyncService.sync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5752:33)
    at async SyncOrchestrator.runFullSync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:6249:28)
    at async handleFullSync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:7259:22)
[IdexxProvider] Consultation: NOT FOUND
[IdexxProvider] Fetching consultation: 727961
[IdexxProvider] Fetching consultation: 727971
[IdexxProvider] Fetching consultation: 727980
[IdexxProvider] Fetching consultation: 727982
[IdexxProvider] Fetching consultation: 727983
Failed to fetch consultation 727971: page.evaluate: TypeError: Failed to fetch
    at eval (eval at evaluate (:290:30), <anonymous>:2:29)
    at UtilityScript.evaluate (<anonymous>:292:16)
    at UtilityScript.<anonymous> (<anonymous>:1:44)
    at IdexxConsultationClient.fetchConsultationFromApi (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4730:37)
    at IdexxConsultationClient.fetchConsultation (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4713:43)
    at async IdexxProvider.fetchConsultation (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4927:32)
    at async /Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5881:38
    at async CaseSyncService.fetchConsultationsBatched (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5878:32)
    at async CaseSyncService.sync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5752:33)
    at async SyncOrchestrator.runFullSync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:6249:28)
    at async handleFullSync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:7259:22)
[IdexxProvider] Consultation: NOT FOUND
Failed to fetch consultation 727980: page.evaluate: TypeError: Failed to fetch
    at eval (eval at evaluate (:290:30), <anonymous>:2:29)
    at UtilityScript.evaluate (<anonymous>:292:16)
    at UtilityScript.<anonymous> (<anonymous>:1:44)
    at IdexxConsultationClient.fetchConsultationFromApi (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4730:37)
    at IdexxConsultationClient.fetchConsultation (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4713:43)
    at async IdexxProvider.fetchConsultation (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4927:32)
    at async /Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5881:38
    at async CaseSyncService.fetchConsultationsBatched (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5878:32)
    at async CaseSyncService.sync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5752:33)
    at async SyncOrchestrator.runFullSync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:6249:28)
    at async handleFullSync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:7259:22)
[IdexxProvider] Consultation: NOT FOUND
Failed to fetch consultation 727983: page.evaluate: TypeError: Failed to fetch
    at eval (eval at evaluate (:290:30), <anonymous>:2:29)
    at UtilityScript.evaluate (<anonymous>:292:16)
    at UtilityScript.<anonymous> (<anonymous>:1:44)
    at IdexxConsultationClient.fetchConsultationFromApi (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4730:37)
    at IdexxConsultationClient.fetchConsultation (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4713:43)
    at async IdexxProvider.fetchConsultation (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4927:32)
    at async /Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5881:38
    at async CaseSyncService.fetchConsultationsBatched (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5878:32)
    at async CaseSyncService.sync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5752:33)
    at async SyncOrchestrator.runFullSync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:6249:28)
    at async handleFullSync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:7259:22)
[IdexxProvider] Consultation: NOT FOUND
Failed to fetch consultation 727961: page.evaluate: TypeError: Failed to fetch
    at eval (eval at evaluate (:290:30), <anonymous>:2:29)
    at UtilityScript.evaluate (<anonymous>:292:16)
    at UtilityScript.<anonymous> (<anonymous>:1:44)
    at IdexxConsultationClient.fetchConsultationFromApi (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4730:37)
    at IdexxConsultationClient.fetchConsultation (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4713:43)
    at async IdexxProvider.fetchConsultation (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4927:32)
    at async /Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5881:38
    at async CaseSyncService.fetchConsultationsBatched (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5878:32)
    at async CaseSyncService.sync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5752:33)
    at async SyncOrchestrator.runFullSync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:6249:28)
    at async handleFullSync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:7259:22)
[IdexxProvider] Consultation: NOT FOUND
Failed to fetch consultation 727982: page.evaluate: TypeError: Failed to fetch
    at eval (eval at evaluate (:290:30), <anonymous>:2:29)
    at UtilityScript.evaluate (<anonymous>:292:16)
    at UtilityScript.<anonymous> (<anonymous>:1:44)
    at IdexxConsultationClient.fetchConsultationFromApi (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4730:37)
    at IdexxConsultationClient.fetchConsultation (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4713:43)
    at async IdexxProvider.fetchConsultation (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4927:32)
    at async /Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5881:38
    at async CaseSyncService.fetchConsultationsBatched (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5878:32)
    at async CaseSyncService.sync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5752:33)
    at async SyncOrchestrator.runFullSync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:6249:28)
    at async handleFullSync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:7259:22)
[IdexxProvider] Consultation: NOT FOUND
[IdexxProvider] Fetching consultation: 727987
[IdexxProvider] Fetching consultation: 727988
[IdexxProvider] Fetching consultation: 727985
[IdexxProvider] Fetching consultation: 727997
[IdexxProvider] Fetching consultation: 727998
Failed to fetch consultation 727987: page.evaluate: TypeError: Failed to fetch
    at eval (eval at evaluate (:290:30), <anonymous>:2:29)
    at UtilityScript.evaluate (<anonymous>:292:16)
    at UtilityScript.<anonymous> (<anonymous>:1:44)
    at IdexxConsultationClient.fetchConsultationFromApi (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4730:37)
    at IdexxConsultationClient.fetchConsultation (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4713:43)
    at async IdexxProvider.fetchConsultation (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4927:32)
    at async /Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5881:38
    at async CaseSyncService.fetchConsultationsBatched (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5878:32)
    at async CaseSyncService.sync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5752:33)
    at async SyncOrchestrator.runFullSync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:6249:28)
    at async handleFullSync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:7259:22)
[IdexxProvider] Consultation: NOT FOUND
Failed to fetch consultation 727988: page.evaluate: TypeError: Failed to fetch
    at eval (eval at evaluate (:290:30), <anonymous>:2:29)
    at UtilityScript.evaluate (<anonymous>:292:16)
    at UtilityScript.<anonymous> (<anonymous>:1:44)
    at IdexxConsultationClient.fetchConsultationFromApi (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4730:37)
    at IdexxConsultationClient.fetchConsultation (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4713:43)
    at async IdexxProvider.fetchConsultation (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4927:32)
    at async /Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5881:38
    at async CaseSyncService.fetchConsultationsBatched (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5878:32)
    at async CaseSyncService.sync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5752:33)
    at async SyncOrchestrator.runFullSync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:6249:28)
    at async handleFullSync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:7259:22)
[IdexxProvider] Consultation: NOT FOUND
Failed to fetch consultation 727997: page.evaluate: TypeError: Failed to fetch
    at eval (eval at evaluate (:290:30), <anonymous>:2:29)
    at UtilityScript.evaluate (<anonymous>:292:16)
    at UtilityScript.<anonymous> (<anonymous>:1:44)
    at IdexxConsultationClient.fetchConsultationFromApi (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4730:37)
    at IdexxConsultationClient.fetchConsultation (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4713:43)
    at async IdexxProvider.fetchConsultation (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4927:32)
    at async /Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5881:38
    at async CaseSyncService.fetchConsultationsBatched (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5878:32)
    at async CaseSyncService.sync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5752:33)
    at async SyncOrchestrator.runFullSync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:6249:28)
    at async handleFullSync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:7259:22)
[IdexxProvider] Consultation: NOT FOUND
Failed to fetch consultation 727998: page.evaluate: TypeError: Failed to fetch
    at eval (eval at evaluate (:290:30), <anonymous>:2:29)
    at UtilityScript.evaluate (<anonymous>:292:16)
    at UtilityScript.<anonymous> (<anonymous>:1:44)
    at IdexxConsultationClient.fetchConsultationFromApi (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4730:37)
    at IdexxConsultationClient.fetchConsultation (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4713:43)
    at async IdexxProvider.fetchConsultation (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4927:32)
    at async /Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5881:38
    at async CaseSyncService.fetchConsultationsBatched (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5878:32)
    at async CaseSyncService.sync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5752:33)
    at async SyncOrchestrator.runFullSync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:6249:28)
    at async handleFullSync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:7259:22)
[IdexxProvider] Consultation: NOT FOUND
Failed to fetch consultation 727985: page.evaluate: TypeError: Failed to fetch
    at eval (eval at evaluate (:290:30), <anonymous>:2:29)
    at UtilityScript.evaluate (<anonymous>:292:16)
    at UtilityScript.<anonymous> (<anonymous>:1:44)
    at IdexxConsultationClient.fetchConsultationFromApi (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4730:37)
    at IdexxConsultationClient.fetchConsultation (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4713:43)
    at async IdexxProvider.fetchConsultation (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4927:32)
    at async /Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5881:38
    at async CaseSyncService.fetchConsultationsBatched (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5878:32)
    at async CaseSyncService.sync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5752:33)
    at async SyncOrchestrator.runFullSync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:6249:28)
    at async handleFullSync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:7259:22)
[IdexxProvider] Consultation: NOT FOUND
[IdexxProvider] Fetching consultation: 728006
[IdexxProvider] Fetching consultation: 728009
[IdexxProvider] Fetching consultation: 728014
[IdexxProvider] Fetching consultation: 728018
[IdexxProvider] Fetching consultation: 728021
Failed to fetch consultation 728018: page.evaluate: TypeError: Failed to fetch
    at eval (eval at evaluate (:290:30), <anonymous>:2:29)
    at UtilityScript.evaluate (<anonymous>:292:16)
    at UtilityScript.<anonymous> (<anonymous>:1:44)
    at IdexxConsultationClient.fetchConsultationFromApi (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4730:37)
    at IdexxConsultationClient.fetchConsultation (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4713:43)
    at async IdexxProvider.fetchConsultation (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4927:32)
    at async /Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5881:38
    at async CaseSyncService.fetchConsultationsBatched (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5878:32)
    at async CaseSyncService.sync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5752:33)
    at async SyncOrchestrator.runFullSync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:6249:28)
    at async handleFullSync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:7259:22)
[IdexxProvider] Consultation: NOT FOUND
Failed to fetch consultation 728014: page.evaluate: TypeError: Failed to fetch
    at eval (eval at evaluate (:290:30), <anonymous>:2:29)
    at UtilityScript.evaluate (<anonymous>:292:16)
    at UtilityScript.<anonymous> (<anonymous>:1:44)
    at IdexxConsultationClient.fetchConsultationFromApi (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4730:37)
    at IdexxConsultationClient.fetchConsultation (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4713:43)
    at async IdexxProvider.fetchConsultation (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4927:32)
    at async /Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5881:38
    at async CaseSyncService.fetchConsultationsBatched (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5878:32)
    at async CaseSyncService.sync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5752:33)
    at async SyncOrchestrator.runFullSync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:6249:28)
    at async handleFullSync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:7259:22)
[IdexxProvider] Consultation: NOT FOUND
Failed to fetch consultation 728021: page.evaluate: TypeError: Failed to fetch
    at eval (eval at evaluate (:290:30), <anonymous>:2:29)
    at UtilityScript.evaluate (<anonymous>:292:16)
    at UtilityScript.<anonymous> (<anonymous>:1:44)
    at IdexxConsultationClient.fetchConsultationFromApi (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4730:37)
    at IdexxConsultationClient.fetchConsultation (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4713:43)
    at async IdexxProvider.fetchConsultation (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4927:32)
    at async /Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5881:38
    at async CaseSyncService.fetchConsultationsBatched (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5878:32)
    at async CaseSyncService.sync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5752:33)
    at async SyncOrchestrator.runFullSync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:6249:28)
    at async handleFullSync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:7259:22)
[IdexxProvider] Consultation: NOT FOUND
Failed to fetch consultation 728006: page.evaluate: TypeError: Failed to fetch
    at eval (eval at evaluate (:290:30), <anonymous>:2:29)
    at UtilityScript.evaluate (<anonymous>:292:16)
    at UtilityScript.<anonymous> (<anonymous>:1:44)
    at IdexxConsultationClient.fetchConsultationFromApi (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4730:37)
    at IdexxConsultationClient.fetchConsultation (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4713:43)
    at async IdexxProvider.fetchConsultation (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4927:32)
    at async /Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5881:38
    at async CaseSyncService.fetchConsultationsBatched (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5878:32)
    at async CaseSyncService.sync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5752:33)
    at async SyncOrchestrator.runFullSync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:6249:28)
    at async handleFullSync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:7259:22)
[IdexxProvider] Consultation: NOT FOUND
Failed to fetch consultation 728009: page.evaluate: TypeError: Failed to fetch
    at eval (eval at evaluate (:290:30), <anonymous>:2:29)
    at UtilityScript.evaluate (<anonymous>:292:16)
    at UtilityScript.<anonymous> (<anonymous>:1:44)
    at IdexxConsultationClient.fetchConsultationFromApi (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4730:37)
    at IdexxConsultationClient.fetchConsultation (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4713:43)
    at async IdexxProvider.fetchConsultation (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4927:32)
    at async /Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5881:38
    at async CaseSyncService.fetchConsultationsBatched (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5878:32)
    at async CaseSyncService.sync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5752:33)
    at async SyncOrchestrator.runFullSync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:6249:28)
    at async handleFullSync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:7259:22)
[IdexxProvider] Consultation: NOT FOUND
[IdexxProvider] Fetching consultation: 728023
[IdexxProvider] Fetching consultation: 728026
[IdexxProvider] Fetching consultation: 728027
[IdexxProvider] Fetching consultation: 728029
[IdexxProvider] Fetching consultation: 728035
Failed to fetch consultation 728035: page.evaluate: TypeError: Failed to fetch
    at eval (eval at evaluate (:290:30), <anonymous>:2:29)
    at UtilityScript.evaluate (<anonymous>:292:16)
    at UtilityScript.<anonymous> (<anonymous>:1:44)
    at IdexxConsultationClient.fetchConsultationFromApi (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4730:37)
    at IdexxConsultationClient.fetchConsultation (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4713:43)
    at async IdexxProvider.fetchConsultation (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4927:32)
    at async /Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5881:38
    at async CaseSyncService.fetchConsultationsBatched (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5878:32)
    at async CaseSyncService.sync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5752:33)
    at async SyncOrchestrator.runFullSync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:6249:28)
    at async handleFullSync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:7259:22)
[IdexxProvider] Consultation: NOT FOUND
Failed to fetch consultation 728027: page.evaluate: TypeError: Failed to fetch
    at eval (eval at evaluate (:290:30), <anonymous>:2:29)
    at UtilityScript.evaluate (<anonymous>:292:16)
    at UtilityScript.<anonymous> (<anonymous>:1:44)
    at IdexxConsultationClient.fetchConsultationFromApi (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4730:37)
    at IdexxConsultationClient.fetchConsultation (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4713:43)
    at async IdexxProvider.fetchConsultation (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4927:32)
    at async /Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5881:38
    at async CaseSyncService.fetchConsultationsBatched (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5878:32)
    at async CaseSyncService.sync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5752:33)
    at async SyncOrchestrator.runFullSync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:6249:28)
    at async handleFullSync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:7259:22)
[IdexxProvider] Consultation: NOT FOUND
Failed to fetch consultation 728026: page.evaluate: TypeError: Failed to fetch
    at eval (eval at evaluate (:290:30), <anonymous>:2:29)
    at UtilityScript.evaluate (<anonymous>:292:16)
    at UtilityScript.<anonymous> (<anonymous>:1:44)
    at IdexxConsultationClient.fetchConsultationFromApi (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4730:37)
    at IdexxConsultationClient.fetchConsultation (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4713:43)
    at async IdexxProvider.fetchConsultation (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4927:32)
    at async /Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5881:38
    at async CaseSyncService.fetchConsultationsBatched (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5878:32)
    at async CaseSyncService.sync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5752:33)
    at async SyncOrchestrator.runFullSync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:6249:28)
    at async handleFullSync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:7259:22)
[IdexxProvider] Consultation: NOT FOUND
Failed to fetch consultation 728023: page.evaluate: TypeError: Failed to fetch
    at eval (eval at evaluate (:290:30), <anonymous>:2:29)
    at UtilityScript.evaluate (<anonymous>:292:16)
    at UtilityScript.<anonymous> (<anonymous>:1:44)
    at IdexxConsultationClient.fetchConsultationFromApi (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4730:37)
    at IdexxConsultationClient.fetchConsultation (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4713:43)
    at async IdexxProvider.fetchConsultation (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4927:32)
    at async /Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5881:38
    at async CaseSyncService.fetchConsultationsBatched (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5878:32)
    at async CaseSyncService.sync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5752:33)
    at async SyncOrchestrator.runFullSync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:6249:28)
    at async handleFullSync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:7259:22)
[IdexxProvider] Consultation: NOT FOUND
Failed to fetch consultation 728029: page.evaluate: TypeError: Failed to fetch
    at eval (eval at evaluate (:290:30), <anonymous>:2:29)
    at UtilityScript.evaluate (<anonymous>:292:16)
    at UtilityScript.<anonymous> (<anonymous>:1:44)
    at IdexxConsultationClient.fetchConsultationFromApi (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4730:37)
    at IdexxConsultationClient.fetchConsultation (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4713:43)
    at async IdexxProvider.fetchConsultation (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:4927:32)
    at async /Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5881:38
    at async CaseSyncService.fetchConsultationsBatched (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5878:32)
    at async CaseSyncService.sync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:5752:33)
    at async SyncOrchestrator.runFullSync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:6249:28)
    at async handleFullSync (/Users/taylorallen/Development/odis-ai/dist/apps/pims-sync/main.js:7259:22)
[IdexxProvider] Consultation: NOT FOUND
[2026-01-23T03:16:14.416Z] [INFO] [case-sync] Fetched consultations {
  "syncId": "6897ab99-cc32-42dd-8db6-7d873c22826b",
  "requested": 35,
  "received": 0
}
[2026-01-23T03:16:14.416Z] [DEBUG] [case-sync] Consultation not found for case {
  "caseId": "a892279e-9be5-48ee-867d-f724400710c1",
  "consultationId": "728004"
}
[2026-01-23T03:16:14.417Z] [DEBUG] [case-sync] Consultation not found for case {
  "caseId": "5d7f90b2-2c7d-4d48-b6ea-de7912b95bdb",
  "consultationId": "727928"
}
[2026-01-23T03:16:14.417Z] [DEBUG] [case-sync] Consultation not found for case {
  "caseId": "dd2a0689-810c-407f-875a-53b74919bdf9",
  "consultationId": "727930"
}
[2026-01-23T03:16:14.417Z] [DEBUG] [case-sync] Consultation not found for case {
  "caseId": "39677413-b8c1-4306-8eec-e2b34c876332",
  "consultationId": "727931"
}
[2026-01-23T03:16:14.417Z] [DEBUG] [case-sync] Consultation not found for case {
  "caseId": "0191c92a-0a19-410c-a173-9493b55853ec",
  "consultationId": "727933"
}
[2026-01-23T03:16:14.417Z] [DEBUG] [case-sync] Consultation not found for case {
  "caseId": "fba55967-57b1-4d82-a7df-f5e01de2b18d",
  "consultationId": "727935"
}
[2026-01-23T03:16:14.417Z] [DEBUG] [case-sync] Consultation not found for case {
  "caseId": "d4d6ba65-781d-456a-b668-7f8809747191",
  "consultationId": "727943"
}
[2026-01-23T03:16:14.417Z] [DEBUG] [case-sync] Consultation not found for case {
  "caseId": "4dbd47cb-b407-4b42-8a73-0e0b7e0d29bb",
  "consultationId": "727937"
}
[2026-01-23T03:16:14.417Z] [DEBUG] [case-sync] Consultation not found for case {
  "caseId": "192d7b50-4188-4b36-b796-2f81c2b311c2",
  "consultationId": "727947"
}
[2026-01-23T03:16:14.417Z] [DEBUG] [case-sync] Consultation not found for case {
  "caseId": "9620a9e2-65c5-4d10-b3be-8444dbbaa7af",
  "consultationId": "727948"
}
[2026-01-23T03:16:14.417Z] [DEBUG] [case-sync] Consultation not found for case {
  "caseId": "1c412f9b-e186-4cb6-95a7-c6cf393724e9",
  "consultationId": "727938"
}
[2026-01-23T03:16:14.417Z] [DEBUG] [case-sync] Consultation not found for case {
  "caseId": "399677f5-a822-409b-8d5c-b085c122f67b",
  "consultationId": "727945"
}
[2026-01-23T03:16:14.417Z] [DEBUG] [case-sync] Consultation not found for case {
  "caseId": "1e96d07b-397f-44de-ad4f-e2b66c4b9f0f",
  "consultationId": "727955"
}
[2026-01-23T03:16:14.417Z] [DEBUG] [case-sync] Consultation not found for case {
  "caseId": "0fd1a436-6c2c-4621-a328-97063f1d4e01",
  "consultationId": "727952"
}
[2026-01-23T03:16:14.417Z] [DEBUG] [case-sync] Consultation not found for case {
  "caseId": "0928979e-a016-481b-97e3-8ace19069910",
  "consultationId": "727953"
}
[2026-01-23T03:16:14.417Z] [DEBUG] [case-sync] Consultation not found for case {
  "caseId": "2f8097e8-2f35-41d9-94dd-b1867090e80a",
  "consultationId": "727961"
}
[2026-01-23T03:16:14.417Z] [DEBUG] [case-sync] Consultation not found for case {
  "caseId": "d1e1cd74-db19-4dca-800c-f4db2a509120",
  "consultationId": "727971"
}
[2026-01-23T03:16:14.417Z] [DEBUG] [case-sync] Consultation not found for case {
  "caseId": "3aaf52cd-44dd-4ec9-9da4-9a687dc6ca91",
  "consultationId": "727980"
}
[2026-01-23T03:16:14.417Z] [DEBUG] [case-sync] Consultation not found for case {
  "caseId": "e7b4d7a0-3aaf-4abb-b38d-d4ebd6619e1c",
  "consultationId": "727982"
}
[2026-01-23T03:16:14.417Z] [DEBUG] [case-sync] Consultation not found for case {
  "caseId": "112dd484-8228-43a9-9c90-7a328f03ffba",
  "consultationId": "727983"
}
[2026-01-23T03:16:14.417Z] [DEBUG] [case-sync] Consultation not found for case {
  "caseId": "967df09e-323f-4cad-8040-b02dc17a8418",
  "consultationId": "727987"
}
[2026-01-23T03:16:14.417Z] [DEBUG] [case-sync] Consultation not found for case {
  "caseId": "403defad-593c-4382-8718-da16082b4f0c",
  "consultationId": "727988"
}
[2026-01-23T03:16:14.417Z] [DEBUG] [case-sync] Consultation not found for case {
  "caseId": "a7790e0b-dd06-44bf-ac8d-6df138762b3a",
  "consultationId": "727985"
}
[2026-01-23T03:16:14.417Z] [DEBUG] [case-sync] Consultation not found for case {
  "caseId": "e452d6a4-e1d1-47c3-8c61-d24fb9a70b00",
  "consultationId": "727997"
}
[2026-01-23T03:16:14.417Z] [DEBUG] [case-sync] Consultation not found for case {
  "caseId": "0fac17fb-c348-4399-a161-9a20aae2225c",
  "consultationId": "727998"
}
[2026-01-23T03:16:14.417Z] [DEBUG] [case-sync] Consultation not found for case {
  "caseId": "b833cc92-6b84-482f-b6d0-401ca8300360",
  "consultationId": "728006"
}
[2026-01-23T03:16:14.417Z] [DEBUG] [case-sync] Consultation not found for case {
  "caseId": "ca7c950e-de60-465e-8bb0-e56865227de5",
  "consultationId": "728009"
}
[2026-01-23T03:16:14.417Z] [DEBUG] [case-sync] Consultation not found for case {
  "caseId": "11f5fe5b-28e3-4ed1-8758-6a9dafe492f2",
  "consultationId": "728014"
}
[2026-01-23T03:16:14.417Z] [DEBUG] [case-sync] Consultation not found for case {
  "caseId": "3df30b09-8877-4a3c-80ae-e78efce3398a",
  "consultationId": "728018"
}
[2026-01-23T03:16:14.417Z] [DEBUG] [case-sync] Consultation not found for case {
  "caseId": "b2b762c4-4fee-429f-8a57-3c543cbb63d1",
  "consultationId": "728021"
}
[2026-01-23T03:16:14.417Z] [DEBUG] [case-sync] Consultation not found for case {
  "caseId": "7aeb3cfa-c16c-4903-a131-4ec430642b1d",
  "consultationId": "728023"
}
[2026-01-23T03:16:14.417Z] [DEBUG] [case-sync] Consultation not found for case {
  "caseId": "1ba8909f-09e4-4124-9b24-43526581e0e4",
  "consultationId": "728026"
}
[2026-01-23T03:16:14.417Z] [DEBUG] [case-sync] Consultation not found for case {
  "caseId": "c2834506-b15d-44f4-8a1e-70a2a2fedb00",
  "consultationId": "728027"
}
[2026-01-23T03:16:14.417Z] [DEBUG] [case-sync] Consultation not found for case {
  "caseId": "bfde3af9-2461-4aaa-95f4-ca30188abc2c",
  "consultationId": "728029"
}
[2026-01-23T03:16:14.417Z] [DEBUG] [case-sync] Consultation not found for case {
  "caseId": "97a3b9b7-4968-48ff-9ecb-089bcf96ff16",
  "consultationId": "728035"
}
[2026-01-23T03:16:14.519Z] [INFO] [case-sync] Case sync completed {
  "syncId": "6897ab99-cc32-42dd-8db6-7d873c22826b",
  "stats": {
    "total": 143,
    "created": 0,
    "updated": 0,
    "skipped": 35,
    "failed": 0
  },
  "durationMs": 2806,
  "hasErrors": false
}
[2026-01-23T03:16:14.519Z] [INFO] [case-reconciler] Starting case reconciliation {
  "syncId": "c7f093e2-0bea-4f6a-ad4d-7761598cd415",
  "clinicId": "33f3bbb8-6613-45bc-a1f2-d55e30c243ae",
  "provider": "IDEXX Neo",
  "lookbackDays": 7
}
[IdexxProvider] Fetching appointments: { start: '2026-01-15', end: '2026-01-23' }
[IdexxScheduleClient] Navigating to IDEXX domain for API access...
[IdexxScheduleClient] On IDEXX domain, ready to fetch appointments
[IdexxScheduleClient] Fetching appointments from: https://us.idexxneo.com/appointments/getCalendarEventData?start=2026-01-15%2000%3A00%3A00&end=2026-01-22%2023%3A59%3A59
[IdexxScheduleClient] Fetched 341 appointments
[IdexxProvider] Found 341 appointments
[2026-01-23T03:16:15.871Z] [INFO] [case-reconciler] Fetched PIMS appointments for reconciliation {
  "syncId": "c7f093e2-0bea-4f6a-ad4d-7761598cd415",
  "count": 341,
  "dateRange": {
    "start": "2026-01-15T08:00:00.000Z",
    "end": "2026-01-23T07:59:59.999Z"
  }
}
[2026-01-23T03:16:15.984Z] [INFO] [case-reconciler] Found local cases for reconciliation {
  "syncId": "c7f093e2-0bea-4f6a-ad4d-7761598cd415",
  "localCases": 35,
  "pimsAppointments": 341
}
[2026-01-23T03:16:16.091Z] [INFO] [case-reconciler] Case reconciliation completed {
  "syncId": "c7f093e2-0bea-4f6a-ad4d-7761598cd415",
  "stats": {
    "total": 35,
    "created": 0,
    "updated": 0,
    "skipped": 35,
    "failed": 0,
    "deleted": 0,
    "reconciled": 35
  },
  "durationMs": 1572,
  "deletedCases": 0,
  "hasErrors": false
}
[2026-01-23T03:16:16.092Z] [INFO] [sync-orchestrator] Full sync completed {
  "clinicId": "33f3bbb8-6613-45bc-a1f2-d55e30c243ae",
  "totalDurationMs": 53717,
  "success": true,
  "stats": {
    "inbound": {
      "total": 143,
      "created": 143,
      "updated": 0,
      "skipped": 0,
      "failed": 0
    },
    "cases": {
      "total": 143,
      "created": 0,
      "updated": 0,
      "skipped": 35,
      "failed": 0
    },
    "reconciliation": {
      "total": 35,
      "created": 0,
      "updated": 0,
      "skipped": 35,
      "failed": 0,
      "deleted": 0,
      "reconciled": 35
    }
  }
}
[2026-01-23T03:16:16.092Z] [INFO] [idexx-sync] Full sync completed {
  "clinicId": "33f3bbb8-6613-45bc-a1f2-d55e30c243ae",
  "phases": {
    "inbound": true,
    "cases": true,
    "reconciliation": true
  },
  "durationMs": 53717
}
[IdexxProvider] Closing...
[2026-01-23T03:16:16.098Z] [DEBUG] [idexx-sync] POST /full - 200 (61395ms)
[IdexxProvider] Closed successfully
[2026-01-23T03:20:32.971Z] [DEBUG] [scheduler:sync] Reloading clinic schedules...
[2026-01-23T03:20:32.976Z] [INFO] [scheduler:config-loader] Loading clinic sync schedules...
[2026-01-23T03:20:33.206Z] [DEBUG] [scheduler:config-loader] No schedules configured for clinic {
  "clinicId": "33f3bbb8-6613-45bc-a1f2-d55e30c243ae"
}
[2026-01-23T03:20:33.206Z] [INFO] [scheduler:config-loader] Loaded clinic schedules {
  "totalClinics": 0,
  "totalSchedules": 0
}
[2026-01-23T03:20:33.206Z] [INFO] [scheduler:sync] Scheduled jobs created {
  "totalClinics": 0,
  "totalJobs": 0
}
[2026-01-23T03:20:33.206Z] [INFO] [scheduler:sync] Schedules reloaded {
  "totalJobs": 0
}