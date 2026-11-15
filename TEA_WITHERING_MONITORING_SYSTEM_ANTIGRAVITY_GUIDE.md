
# TEA WITHERING MONITORING SYSTEM
## Complete Development Guide for Google Antigravity

**Project:** Tea Withering Monitoring System  
**Purpose:** Web-based monitoring, data management, alert management and reporting system for tea factories.

**Development environment:** Google Antigravity

---

# 1. PROJECT OVERVIEW

Develop a professional, secure and scalable web application for monitoring tea withering troughs and dryer machines across multiple tea factories.

The system collects temperature readings from IoT devices installed in factories. Raspberry Pi gateways receive data from ESP32-based sensor modules through LoRa communication and upload the data to a cloud database.

A separate web application retrieves this information from the database and presents it to authorized users through dashboards, graphs, alerts and reports.

Authorized users can also update monitoring configurations through the website.

## 1.1 Initial hardware setup

The initial factory contains:

- 1 Raspberry Pi gateway.
- 4 withering troughs.
- 1 dryer machine.

### Withering trough

Each withering trough has:

- One dry-bulb temperature sensor.
- One wet-bulb temperature sensor.
- Dry temperature reading.
- Wet temperature reading.
- Wet-bulb depression calculation.

Formula:

`Wet-bulb Depression = Dry Temperature - Wet Temperature`

### Dryer machine

Each dryer has:

- One temperature sensor.
- One temperature reading.
- No wet-bulb temperature.
- No wet-bulb depression calculation.

**Important:** A dryer must never display a wet-bulb temperature or wet-bulb depression.

## 1.2 Scalability

Although the initial factory has four troughs and one dryer, the application must support:

- Multiple organizations.
- Multiple factories under each organization.
- Multiple Raspberry Pi gateways.
- Different numbers of withering troughs in each factory.
- Different numbers of dryer machines in each factory.
- Different monitoring configurations for each factory or device.

Do not hardcode four troughs and one dryer into the application.

The system must allow administrators to register additional factories, gateways and devices without changing the application code.

## 1.3 Factory structure

Use this hierarchy:

Organization → Factory → Gateway and Devices

Do not introduce floors into the database or application.

---

# 2. IMPORTANT SYSTEM REQUIREMENTS

This system is a monitoring and decision-support application.

It is NOT an automatic machinery control system.

The application must:

- Collect temperature readings.
- Store historical readings.
- Display current temperature values.
- Calculate wet-bulb depression for troughs.
- Monitor device connectivity.
- Detect and display sensor faults.
- Manage alerts and notifications.
- Maintain configuration settings.
- Generate reports.
- Provide authorized users with relevant information.

The application must NOT:

- Automatically start or stop fans.
- Automatically control heaters.
- Automatically operate factory machinery.
- Introduce automatic production-control features.

All factory operational decisions remain with authorized human personnel.

---

# 3. TECHNOLOGY STACK

Use the following technologies.

| Layer | Technology | Purpose |
|---|---|---|
| Frontend framework | Next.js | Web application |
| Programming language | TypeScript | Application development |
| UI library | React | Reusable components |
| Styling | Tailwind CSS | UI styling |
| Component library | shadcn/ui | UI components |
| Icons | Lucide React | Interface icons |
| Database | PostgreSQL | Relational database |
| Backend platform | Supabase | Database and backend services |
| Authentication | Supabase Auth | User login |
| Authorization | Supabase Row Level Security | Secure data access |
| API | Supabase Edge Functions / Next.js server APIs | Secure backend operations |
| Charts | Recharts | Temperature graphs |
| Form handling | React Hook Form | Form management |
| Validation | Zod | Input validation |
| Date handling | date-fns | Date formatting |
| Notifications | Sonner | UI toast messages |
| Version control | Git and GitHub | Source control |
| Hosting | Vercel | Web application deployment |
| Development environment | Google Antigravity | AI-assisted development |

## 3.1 Architecture

Use Supabase as the initial backend platform.

The application should not require a separate Express.js backend unless a clear technical requirement is identified later.

The architecture:

1. ESP32 sensor modules collect readings.
2. ESP32 modules send readings through LoRa.
3. Raspberry Pi receives LoRa packets.
4. Raspberry Pi uploads readings and events to a secure cloud API.
5. Supabase PostgreSQL stores the information.
6. Next.js retrieves information from Supabase.
7. Authorized users access the web application.
8. Authorized users update permitted configurations.
9. Raspberry Pi retrieves pending configurations and commands.
10. Raspberry Pi forwards applicable configuration updates to the devices through LoRa.

The Raspberry Pi and website are separate services.

The browser must never communicate directly with the Raspberry Pi as a requirement for viewing dashboard information.

---

# 4. USER ROLES AND PERMISSIONS

There must be exactly THREE user roles.

1. Admin
2. Manager
3. Viewer

Do not create an Operator role.

The operational responsibilities previously assigned to the Operator role are assigned to the Manager.

## 4.1 Admin

The Admin has administrative permissions.

Admin can:

- View all authorized organizations.
- View all factories.
- Create and edit factories.
- Register and manage gateways.
- Register and manage devices.
- Create users.
- Edit user information.
- Activate and deactivate users.
- Assign roles.
- Assign managers and viewers to factories.
- Configure monitoring parameters.
- View all readings and historical graphs.
- View alerts and notifications.
- View reports.
- View audit logs.
- Manage supported system settings.

## 4.2 Manager

The Manager is responsible for the assigned factory or factories.

Manager can:

- View assigned factories.
- View all troughs in assigned factories.
- View all dryers in assigned factories.
- View current readings.
- View historical graphs.
- View device connectivity.
- View sensor faults.
- View alerts.
- Acknowledge alerts.
- Snooze alerts.
- Resolve alerts where permitted.
- View reports.
- Export permitted reports.
- Update monitoring configurations where permission is granted.
- Handle permitted operational records.

Manager cannot:

- Manage system-wide users.
- Create organizations.
- Access unassigned factories.
- Change global security settings.
- Access another factory's information.

## 4.3 Viewer

Viewer has read-only permissions.

Viewer can:

- View assigned factories.
- View dashboards.
- View trough readings.
- View dryer readings.
- View historical graphs.
- View device status.
- View alerts.
- View reports.

Viewer cannot:

- Edit configurations.
- Manage users.
- Create or edit factories.
- Acknowledge alerts.
- Snooze alerts.
- Resolve alerts.
- Modify records.

## 4.4 Security

Permissions must be enforced through:

- Supabase Row Level Security.
- Server-side authorization.
- Frontend UI restrictions.

Do not rely only on hiding buttons in the frontend.

A user must not be able to access unauthorized factory data by changing a URL or sending a direct API request.

---

# 5. UI DESIGN REFERENCES

The UI screens have already been designed using Google Stitch.

The supplied screenshots are the primary visual reference for the implementation.

## 5.1 Reference folder

Create a folder in the project root:

```text
references/
```

Place the exported UI screenshots inside it.

Suggested filenames:

```text
references/
├── login.png
├── dashboard.png
├── trough-details.png
├── dryer-details.png
├── alerts.png
├── user-management.png
└── parameters.png
```

Use the actual screenshots available. If additional screens are provided, inspect them too.

## 5.2 Logo

Place the official Hayleys logo inside:

```text
public/assets/hayleys-logo.png
```

If the logo is available in SVG format, preserve and use the SVG.

Do not recreate, distort, recolour or approximate the official logo.

## 5.3 UI design requirements

Follow the supplied screenshots closely.

Design principles:

- Professional industrial monitoring dashboard.
- Clean and minimal interface.
- Light theme.
- Consistent typography.
- Consistent spacing.
- Consistent sidebar and navigation.
- Clear temperature values.
- Easy-to-read graphs.
- Simple tables.
- Responsive design.
- Consistent buttons, cards and form styles.

Do not introduce unnecessary features.

Do not add:

- AI recommendations.
- Automatic machinery controls.
- Unrequested airflow metrics.
- Unrequested moisture measurements.
- Unnecessary dashboard widgets.
- Complicated analytics that are not in the supplied designs.

If a screenshot does not clearly show a required function, ask for clarification instead of inventing a complicated design.

## 5.4 Do I need Figma HTML or generated code?

No.

The PNG screenshots exported from Google Stitch are sufficient as visual references.

Recommended materials:

1. High-quality PNG screenshots of every UI screen.
2. Official Hayleys logo as SVG or transparent PNG.
3. Optional Stitch-generated HTML/CSS if available.

Do not blindly copy generated HTML into the Next.js application.

Recreate the UI using Next.js, React, TypeScript, Tailwind CSS and shadcn/ui.

---

# 6. REQUIRED APPLICATION PAGES

Implement these pages according to the supplied reference screenshots.

## 6.1 Login Page

Features:

- Email input.
- Password input.
- Show/hide password.
- Login button.
- Validation messages.
- Loading state.
- Forgot password if included in the approved design.
- Official Hayleys logo.

Use Supabase Auth.

There must not be public user registration.

Users must be created or invited by an authorized administrator.

## 6.2 Main Dashboard

The dashboard should display the selected factory.

Show the factory's registered withering troughs and dryer machines.

### Trough cards

Each trough card should display:

- Trough name/code.
- Dry temperature.
- Wet temperature.
- Wet-bulb depression.
- Current status.
- Last update time.

### Dryer cards

Each dryer card should display:

- Dryer name/code.
- Temperature.
- Current status.
- Last update time.

Do not display wet-bulb temperature or depression for dryers.

### Status indicators

Use clear status indicators:

- Normal.
- Warning.
- Critical.
- Offline.
- Sensor Fault.

The actual thresholds must come from the configured monitoring parameters.

## 6.3 Trough Details Page

Display:

- Trough identification.
- Current dry temperature.
- Current wet temperature.
- Current wet-bulb depression.
- Device status.
- Last update time.
- Historical temperature graphs.

Graphs should support suitable time filters, for example:

- 1 hour.
- 6 hours.
- 24 hours.
- 7 days.

Show dry and wet temperature trends.

Show wet-bulb depression trends.

Handle missing and stale readings clearly.

## 6.4 Dryer Details Page

Display:

- Dryer identification.
- Current temperature.
- Device status.
- Last update time.
- Historical temperature graph.
- Applicable alarm status.

Do not display:

- Wet-bulb temperature.
- Wet-bulb depression.

## 6.5 Alerts and Notifications Page

Keep the page simple and easy to understand.

Display:

- Total alerts.
- Active alerts.
- Resolved alerts.

Provide filters:

- All.
- Active.
- Resolved.

Suggested table columns:

- Factory.
- Device.
- Alert message.
- Date and time.
- Severity.
- Status.
- Action.

Authorized users can perform permitted alert actions.

Snoozing an alert must not mean that the alert is resolved.

Maintain the event history.

## 6.6 User Management Page

Admin only.

Features:

- User list.
- Add user.
- Edit user.
- Assign role.
- Assign factory.
- Activate user.
- Deactivate user.

Only these roles are allowed:

- Admin.
- Manager.
- Viewer.

Do not include Operator.

Never store passwords in the profiles table.

Use Supabase Auth for account management.

## 6.7 Parameters and Configuration Page

Allow authorized users to view and update permitted monitoring parameters.

Possible parameters:

- Reading interval.
- Dry temperature limits.
- Wet temperature limits.
- Wet-bulb depression limits.
- Dryer temperature limits.
- Alarm duration.
- Alarm hysteresis.

The exact parameters and permissions must follow the approved system requirements.

Configuration changes must have a clear delivery status:

- Saved.
- Pending.
- Applied.
- Failed.

Saving a setting in the cloud does not mean the hardware has already applied it.

Do not implement fan or heater control.

## 6.8 Reports Page

Provide useful management reports.

Initial reporting requirements may include:

- Temperature history by factory.
- Temperature history by trough.
- Temperature history by dryer.
- Daily temperature trends.
- Alarm history.
- Device offline history.

Use date and factory filters.

Production batch reports can be added after the batch-management requirements are agreed.

---

# 7. DATABASE REQUIREMENTS

The final database schema must be agreed with the database developer before production integration.

Use PostgreSQL through Supabase.

The following tables describe the expected logical database structure.

Do not silently change an agreed schema.

## 7.1 organizations

Stores organizations.

Attributes:

- id — UUID primary key.
- name — organization name.
- created_at.
- updated_at.

Relationship:

One organization can have multiple factories.

## 7.2 factories

Stores factory information.

Attributes:

- id — UUID primary key.
- organization_id — foreign key to organizations.
- name.
- location.
- timezone.
- status.
- created_at.
- updated_at.

Relationship:

One factory belongs to one organization.

One factory can have multiple gateways and devices.

Use `Asia/Colombo` for Sri Lankan factory timezones where applicable.

## 7.3 profiles

Stores application user profile information.

Attributes:

- id — UUID linked to Supabase Auth user ID.
- full_name.
- email.
- status.
- created_at.
- updated_at.

Never store plaintext passwords.

## 7.4 memberships

Connects users to organizations and factories.

Attributes:

- id.
- user_id — foreign key to profiles.
- organization_id — foreign key to organizations.
- factory_id — foreign key to factories, nullable only if the approved access model requires organization-wide scope.
- role — admin, manager or viewer.
- created_at.

Only these role values are allowed:

```sql
CHECK (role IN ('admin', 'manager', 'viewer'))
```

A user may have access to multiple factories if authorized.

## 7.5 gateways

Stores Raspberry Pi gateway information.

Attributes:

- id.
- factory_id.
- serial_number.
- firmware_version.
- last_seen_at.
- status.
- created_at.
- updated_at.

Each gateway belongs to one factory.

A factory may have multiple gateways.

Do not store a plain reusable gateway secret in a table that ordinary users can read.

Use secure, individually managed gateway credentials.

## 7.6 devices

Stores registered troughs and dryers.

Attributes:

- id.
- factory_id.
- gateway_id.
- device_code.
- name.
- type — TROUGH or DRYER.
- lora_address.
- hardware_serial.
- firmware_version.
- active.
- installed_at.
- created_at.
- updated_at.

Example:

| Device Code | Name | Type |
|---|---|---|
| TR-001 | Trough 1 | TROUGH |
| TR-002 | Trough 2 | TROUGH |
| TR-003 | Trough 3 | TROUGH |
| TR-004 | Trough 4 | TROUGH |
| DR-001 | Dryer 1 | DRYER |

Do not hardcode these devices in the application.

They are initial database records only.

Keep logical device identity separate from replaceable physical hardware where possible, so replacing an ESP32 board does not erase the equipment's history.

## 7.7 readings

Stores temperature readings received from Raspberry Pi gateways.

Attributes:

- id.
- device_id.
- gateway_id.
- captured_at.
- received_at.
- temp_dry.
- temp_wet — nullable.
- delta — nullable.
- temperature — nullable if a dedicated dryer temperature field is chosen.
- sequence_no.
- boot_id.
- sensor_fault_code.
- rssi — optional.
- snr — optional.
- created_at.

Important rules:

For a trough:

- temp_dry must be present.
- temp_wet must be present.
- delta = temp_dry - temp_wet.

For a dryer:

- Only one temperature is required.
- temp_wet must be NULL.
- delta must be NULL.

Do not store a fake zero difference for a dryer.

Before implementing the final database, agree whether the dryer reading should be stored in `temp_dry` or in a dedicated `temperature` column.

Use a consistent structure across the API, database and UI.

Recommended index:

`(device_id, captured_at)`

Use a unique idempotency key based on:

`device_id + boot_id + sequence_no`

This prevents duplicate records when the Raspberry Pi retries an upload.

## 7.8 alarm_rules

Stores monitoring thresholds.

Attributes:

- id.
- factory_id.
- device_id — nullable if the rule applies to a whole factory or device type.
- device_type.
- metric.
- min_value.
- max_value.
- duration_seconds.
- hysteresis.
- severity.
- enabled.
- version.
- created_at.
- updated_at.

Support factory-level and device-specific configuration where required.

## 7.9 alarms

Stores the current state of alarms.

Attributes:

- id.
- device_id.
- rule_id.
- state.
- triggered_at.
- trigger_value.
- acknowledged_at.
- snoozed_until.
- cleared_at.
- created_at.

Possible states should be finalized with the alarm workflow.

Do not treat snoozed as resolved.

## 7.10 alarm_events

Stores the history of alarm actions.

Attributes:

- id.
- alarm_id.
- event_type.
- event_at.
- actor_user_id — nullable for device/system events.
- source.
- details.

Possible event types:

- TRIGGERED.
- ACKNOWLEDGED.
- SNOOZED.
- UNSNOOZED.
- CLEARED.

Keep this as an event history rather than overwriting previous actions.

## 7.11 device_status

Stores the latest known device connectivity state.

Attributes:

- device_id.
- gateway_id.
- last_seen_at.
- status.
- last_sequence_no.
- updated_at.

## 7.12 status_events

Stores connectivity and device state changes.

Attributes:

- id.
- device_id — nullable when the event refers only to a gateway.
- gateway_id.
- event_type.
- event_at.
- detected_by.
- details.

Possible events:

- ONLINE.
- OFFLINE.
- BOOT.
- SENSOR_FAULT.
- SENSOR_RECOVERED.

## 7.13 calibrations

Stores sensor calibration history.

Attributes:

- id.
- device_id.
- sensor_role.
- calibration parameters.
- valid_from.
- created_by.
- created_at.

Possible sensor roles:

- DRY.
- WET.
- TEMPERATURE.

Do not overwrite calibration history when a sensor is recalibrated.

## 7.14 device_configurations

Stores versioned device configuration.

Attributes:

- id.
- device_id.
- configuration_version.
- reading_interval_seconds.
- configuration_json.
- status.
- created_at.
- applied_at.

The exact configuration fields should be finalized with the hardware developer.

## 7.15 remote_commands

Stores commands or configuration deliveries to gateways.

Attributes:

- id.
- gateway_id.
- device_id — nullable where the command applies to the entire gateway.
- command_type.
- payload.
- status.
- created_by.
- created_at.
- acknowledged_at.
- result_message.

Possible statuses:

- PENDING.
- SENT.
- ACKNOWLEDGED.
- FAILED.
- EXPIRED.

Do not add automatic machinery-control commands.

## 7.16 notification_recipients

Stores notification recipients.

Attributes:

- id.
- factory_id.
- name.
- phone.
- email.
- enabled.
- severity_preferences.
- created_at.

## 7.17 notification_log

Stores notification delivery history.

Attributes:

- id.
- alarm_event_id.
- channel.
- recipient.
- status.
- sent_at.
- response_details.

## 7.18 audit_logs

Stores important user actions.

Attributes:

- id.
- user_id.
- factory_id — nullable for organization-level actions.
- action.
- entity_type.
- entity_id.
- before_data.
- after_data.
- created_at.

## 7.19 batches (optional future feature)

Stores production batch information if management requires batch-based reports.

Attributes:

- id.
- factory_id.
- device_id.
- batch_code.
- start_at.
- end_at.
- leaf_weight.
- cultivar.
- target.
- notes.
- created_by.
- created_at.

Do not implement this until batch requirements are confirmed.

---

# 8. DATABASE RELATIONSHIPS

The main relationships are:

```text
ORGANIZATIONS
    |
    | 1-to-many
    |
FACTORIES
    |
    |----------------------|
    |                      |
    |                      |
GATEWAYS                DEVICES
    |                      |
    |                      | 1-to-many
    |                      |
    |                   READINGS
    |                      |
    |                   ALARMS
    |                      |
    |                 ALARM_EVENTS
    |
REMOTE_COMMANDS


PROFILES
    |
    | many-to-many through memberships
    |
FACTORIES


DEVICES
    |
    |--------------------|
    |                    |
CALIBRATIONS        STATUS_EVENTS


FACTORIES
    |
    |----------------------|
    |                      |
ALARM_RULES          NOTIFICATION_RECIPIENTS
```

Important:

- One organization can contain multiple factories.
- One factory can contain multiple gateways.
- One factory can contain multiple devices.
- One gateway can communicate with multiple devices.
- One device can have many readings.
- One device can have many alarms.
- One alarm can have many alarm events.
- One device can have multiple calibration records.
- Users can be assigned to multiple factories through memberships.

Use foreign keys and appropriate indexes.

---

# 9. HARDWARE AND DATABASE COMMUNICATION REQUIREMENTS

The Raspberry Pi is responsible for receiving LoRa packets and uploading data.

The database must support the following requirements.

## 9.1 Reading interval

Initial reading/upload interval:

5 minutes.

The interval must be configurable later.

The system should not assume the interval will always be five minutes.

## 9.2 LoRa packet information

The hardware team should agree on a compact packet structure containing:

- Device identifier or LoRa address.
- Sequence number.
- Boot/session identifier.
- Dry temperature.
- Wet temperature or a not-present marker.
- Sensor fault flags.
- Alarm state if evaluated locally.
- Configuration version.
- Device uptime.

The final packet format must define:

- Temperature units.
- Numeric precision.
- Data types.
- Byte order.
- Fault-code meanings.
- Missing-value representation.

LoRa payload size is limited, so the packet should remain compact.

## 9.3 Timestamps

ESP32 slave devices may not have reliable clocks.

Therefore:

- Raspberry Pi records the time it receives a packet.
- Raspberry Pi timestamps should be in UTC.
- Database stores timestamps in UTC.
- The cloud records the time it receives the upload.
- The website converts timestamps to the factory timezone.

Use:

- `captured_at` for Pi packet-reception time.
- `received_at` for cloud-reception time.

If the Pi buffers readings during an internet outage, preserve the original `captured_at` timestamp when uploading later.

## 9.4 Idempotent uploads

The Pi may resend readings after network failures.

The database must not create duplicate readings.

Use a unique key based on:

- Device ID.
- Boot/session ID.
- Sequence number.

The same packet uploaded multiple times must result in only one stored reading.

## 9.5 Immediate event uploads

Normal readings can follow the configured upload interval.

Important events must be uploaded as soon as possible.

Examples:

- Alarm triggered.
- Alarm acknowledged.
- Alarm snoozed.
- Alarm cleared.
- Device offline.
- Device online.
- Sensor fault.
- Sensor recovered.
- Gateway boot or restart.

Do not wait for the next five-minute reading upload to report important events.

## 9.6 Offline detection

The Raspberry Pi should detect an ESP32 device as offline after a configurable number of missed intervals.

The Pi should report offline and online transitions to the cloud.

The cloud should also monitor gateway activity.

If the Raspberry Pi stops communicating with the cloud, a cloud-side process should detect the stale gateway.

A sensor fault and an offline device are different conditions and must be represented separately.

## 9.7 Configuration flow

The expected configuration flow:

1. Authorized user changes a monitoring setting on the website.
2. Website stores the new configuration in Supabase.
3. A new configuration version is created.
4. Raspberry Pi polls the cloud for pending configurations.
5. Raspberry Pi retrieves the configuration.
6. Raspberry Pi sends applicable configuration to the ESP32 through LoRa.
7. ESP32 acknowledges or rejects it.
8. Raspberry Pi reports the result to the cloud.
9. Website displays whether the configuration is pending, applied or failed.

Polling is acceptable for the initial implementation. Realtime can be considered later if it provides a clear benefit.

---

# 10. SECURITY REQUIREMENTS

Security must be implemented from the beginning.

1. Use Supabase Auth for user authentication.
2. Use only admin, manager and viewer roles.
3. Enable Row Level Security for protected tables.
4. Managers can access assigned factories only.
5. Viewers have read-only access.
6. Admin permissions must follow the approved organization model.
7. Never expose the Supabase service-role key in frontend code.
8. Never place the service-role key in ESP32 firmware.
9. Never place the service-role key on the Raspberry Pi.
10. Give each gateway its own credentials.
11. Validate that each gateway can upload only data for its registered factory and devices.
12. Validate all API inputs on the server.
13. Use HTTPS.
14. Keep credentials in environment variables or a secure secret manager.
15. Do not commit `.env.local` or other secret files to GitHub.
16. Maintain audit logs for important administrative actions.
17. Prevent users from changing their role or factory permissions through frontend requests.

For hardware uploads, use a secure Edge Function or authenticated API endpoint.

Do not allow unauthenticated public inserts into readings, alarms or device tables.

---

# 11. SUGGESTED PROJECT STRUCTURE

Use a clean and maintainable project structure.

```text
tea-withering-monitor/
│
├── public/
│   └── assets/
│       └── hayleys-logo.png
│
├── references/
│   ├── login.png
│   ├── dashboard.png
│   ├── trough-details.png
│   ├── dryer-details.png
│   ├── alerts.png
│   ├── user-management.png
│   └── parameters.png
│
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/
│   │   │
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/
│   │   │   ├── factories/
│   │   │   ├── troughs/
│   │   │   ├── dryers/
│   │   │   ├── alerts/
│   │   │   ├── reports/
│   │   │   ├── users/
│   │   │   └── settings/
│   │   │
│   │   ├── api/
│   │   └── layout.tsx
│   │
│   ├── components/
│   │   ├── layout/
│   │   ├── dashboard/
│   │   ├── devices/
│   │   ├── charts/
│   │   ├── alerts/
│   │   ├── forms/
│   │   └── ui/
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   ├── auth/
│   │   ├── permissions/
│   │   ├── validation/
│   │   └── utils/
│   │
│   ├── services/
│   ├── types/
│   └── config/
│
├── supabase/
│   ├── migrations/
│   └── functions/
│
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

This is a suggested structure. Antigravity may adjust it to match the existing project and current Next.js conventions.

Do not create every folder unnecessarily at the beginning.

---

# 12. STEP-BY-STEP DEVELOPMENT PLAN

Follow these phases in order.

Do not try to implement the whole application in one step.

## PHASE 0 — PROJECT INSPECTION

Before modifying anything:

1. Inspect the complete existing project workspace.
2. Check whether a Next.js project already exists.
3. Inspect the current package.json.
4. Identify the package manager.
5. Inspect all reference images.
6. Inspect the Hayleys logo.
7. Understand the design system from the screenshots.
8. Identify existing code and reusable components.
9. Check whether a Supabase project already exists.
10. Identify missing requirements and technical conflicts.

Do not modify, delete or overwrite files in this phase.

### Deliverable

Provide:

- Project inspection report.
- UI design summary.
- Existing project summary.
- Missing information.
- Proposed Phase 1 plan.
- Files expected to be created or modified.

Wait for my approval.

## PHASE 1 — PROJECT FOUNDATION

After approval:

1. Set up Next.js using App Router.
2. Configure TypeScript.
3. Configure Tailwind CSS.
4. Install and configure shadcn/ui.
5. Configure Lucide React.
6. Create shared design tokens based on screenshots.
7. Add the official logo.
8. Create the root layout.
9. Create the shared dashboard layout.
10. Implement the sidebar.
11. Implement the header.
12. Create placeholder routes for the required pages.
13. Ensure the application starts successfully.
14. Run the build and fix errors.

Do not connect the real database yet.

### Deliverable

A running Next.js application with shared layout and placeholder pages.

Wait for approval.

## PHASE 2 — UI IMPLEMENTATION

Implement the UI using mock data.

Follow the screenshots in this order:

1. Login page.
2. Main dashboard.
3. Trough details.
4. Dryer details.
5. Alerts.
6. User management.
7. Parameters.
8. Reports, once the design and requirements are agreed.

Requirements:

- Match screenshots closely.
- Use reusable components.
- Maintain consistent spacing and styling.
- Support responsive layouts.
- Support variable device counts.
- Show only the three approved roles.
- Keep trough and dryer information separate.
- Use mock data only.

Do not connect real hardware.

### Deliverable

Complete navigable UI using mock data.

Wait for approval.

## PHASE 3 — SUPABASE DATABASE

Before implementing database migrations:

1. Review the final schema agreed with the database collaborator.
2. Confirm table names.
3. Confirm column names and data types.
4. Confirm relationships.
5. Confirm foreign keys.
6. Confirm indexes.
7. Confirm constraints.
8. Confirm gateway authentication.
9. Confirm the Raspberry Pi upload payload.
10. Identify any differences between the approved schema and this guide.

Do not silently make schema decisions.

After agreement:

1. Connect the Supabase project.
2. Create SQL migrations.
3. Create core tables.
4. Add foreign keys.
5. Add indexes.
6. Add unique constraints.
7. Configure Supabase Auth.
8. Implement RLS policies.
9. Add initial development data.
10. Test database access.

Initial development data should include:

- One sample organization.
- One sample factory.
- One Raspberry Pi gateway.
- Four trough devices.
- One dryer device.

### Deliverable

Supabase database with tested relationships, access controls and sample data.

Wait for approval.

## PHASE 4 — AUTHENTICATION AND AUTHORIZATION

Implement:

1. Supabase login.
2. Logout.
3. Session management.
4. User profile loading.
5. Membership loading.
6. Admin permissions.
7. Manager permissions.
8. Viewer permissions.
9. Factory assignment checks.
10. Protected routes.
11. Server-side authorization.
12. RLS testing.

Test that:

- Admin can access authorized administrative features.
- Manager can access assigned factories only.
- Viewer can read assigned factory data only.
- Viewer cannot write records.
- Users cannot access another factory by changing the URL.
- No Operator role exists.

### Deliverable

Secure login and role-based access.

Wait for approval.

## PHASE 5 — CONNECT THE DATABASE TO THE UI

Replace mock data with real Supabase data.

Implement:

1. Factory loading.
2. Device loading.
3. Latest reading retrieval.
4. Trough readings.
5. Dryer readings.
6. Historical reading retrieval.
7. Temperature graphs.
8. Alert retrieval.
9. Device status retrieval.
10. Configuration retrieval.

Add:

- Loading states.
- Empty states.
- Error states.
- Stale-data indicators.
- Offline indicators.
- Sensor-fault indicators.

Use factory timezone for displayed timestamps.

### Deliverable

Dashboard and pages displaying real database information.

Wait for approval.

## PHASE 6 — ALARMS AND CONFIGURATION

Implement:

1. Alarm list.
2. Alarm filtering.
3. Alarm details.
4. Alarm acknowledgement.
5. Alarm snoozing.
6. Alarm resolution.
7. Alarm event history.
8. Configuration management.
9. Configuration versioning.
10. Pending/applied/failed states.
11. Audit logging.

Only allow actions permitted by the user's role.

Do not implement automatic fan, heater or machinery control.

### Deliverable

Working web-side alarm and configuration management.

Wait for approval.

## PHASE 7 — RASPBERRY PI INTEGRATION

Coordinate with the hardware developer.

Confirm:

1. Gateway authentication.
2. API endpoint.
3. Reading payload.
4. Event payload.
5. Timestamp handling.
6. Idempotency rules.
7. Retry strategy.
8. Offline reporting.
9. Configuration polling.
10. Acknowledgement format.

Then implement:

- Secure ingestion endpoint.
- Gateway validation.
- Device validation.
- Reading validation.
- Reading insertion.
- Event insertion.
- Duplicate handling.
- Configuration retrieval.
- Command acknowledgement handling.

Test:

- Normal uploads.
- Duplicate uploads.
- Internet outages.
- Gateway restarts.
- Missing packets.
- Offline devices.
- Sensor faults.
- Configuration updates.

### Deliverable

Real hardware readings and events appearing in the cloud database and website.

Wait for approval.

## PHASE 8 — TESTING AND DEPLOYMENT

Test the entire system.

### Functional testing

- Login.
- Logout.
- User permissions.
- Factory selection.
- Trough display.
- Dryer display.
- Historical graphs.
- Alerts.
- Configuration changes.
- Reports.

### Hardware integration testing

- LoRa packet reception.
- Reading uploads.
- Event uploads.
- Duplicate packet handling.
- Offline buffering.
- Retry after network restoration.
- Gateway offline detection.
- Device offline detection.
- Configuration acknowledgement.

### Security testing

- RLS policies.
- Factory isolation.
- Viewer read-only permissions.
- Unauthorized API requests.
- Gateway authentication.
- Secret protection.

### Deployment

- Configure production environment variables.
- Deploy Next.js application to Vercel.
- Configure production Supabase.
- Run database migrations.
- Test production login.
- Test production data access.
- Document deployment.

### Deliverable

A tested and deployable first release.

---

# 13. ENVIRONMENT VARIABLES

Use `.env.local` for local secrets.

Create `.env.example` with placeholder names only.

Example:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Important:

- `NEXT_PUBLIC_` variables are exposed to the browser.
- Never expose the service-role key to browser code.
- Never place the service-role key in ESP32 firmware.
- Never place the service-role key on the Raspberry Pi.
- Use individually authenticated gateway credentials.
- Never commit `.env.local` to GitHub.

Use the current Supabase key naming conventions supported by the selected project.

## 13.1 Git requirements

- Use Git for version control.
- Create meaningful commits.
- Do not commit secrets.
- Do not overwrite existing team members' work.
- Check Git status before major changes.
- Keep `.gitignore` updated.

---

# 14. SAMPLE DEVELOPMENT DATA

Use mock data for UI development before connecting Supabase.

Example trough:

```json
{
  "device_code": "TR-001",
  "device_type": "TROUGH",
  "temp_dry": 32.5,
  "temp_wet": 28.0,
  "delta": 4.5,
  "temperature_unit": "C"
}
```

Example dryer:

```json
{
  "device_code": "DR-001",
  "device_type": "DRYER",
  "temperature": 45.0,
  "temp_wet": null,
  "delta": null,
  "temperature_unit": "C"
}
```

These are illustrative UI examples only.

Do not treat them as the final Raspberry Pi API contract.

The final payload must match the hardware team's agreed specification.

---

# 15. IMPORTANT RULES FOR GOOGLE ANTIGRAVITY

Follow these rules throughout the project.

1. Inspect before modifying.
2. Do not delete existing files without approval.
3. Work phase by phase.
4. Complete only the currently approved phase.
5. Explain major changes before implementing them.
6. Preserve working code.
7. Follow supplied UI screenshots.
8. Do not invent requirements.
9. Ask questions when information is unclear.
10. Use TypeScript properly.
11. Use reusable components.
12. Separate UI, data services, types and validation.
13. Keep security logic on the server and database.
14. Do not expose secrets.
15. Use only admin, manager and viewer roles.
16. Do not introduce floors.
17. Do not introduce automatic machinery control.
18. Do not show wet-bulb values for dryers.
19. Do not hardcode the number of devices.
20. Handle offline, stale and faulty readings.
21. Use database migrations.
22. Run tests and builds after changes.
23. Report errors honestly.
24. Do not claim something is complete unless it has been tested.

At the end of every phase, provide:

- Completed work.
- Files created.
- Files modified.
- Dependencies installed.
- Commands executed.
- Test results.
- Build results.
- Remaining issues.
- Next phase requirements.

Then STOP and wait for my approval.

---

# 16. FIRST PROMPT TO GIVE ANTIGRAVITY

After placing this Markdown file and the reference screenshots in the project workspace, give Antigravity the following prompt.

```text
Read the complete project specification:

TEA_WITHERING_MONITORING_SYSTEM_ANTIGRAVITY_GUIDE.md

Read it carefully before making any changes.

This is a Tea Withering Monitoring System for multiple tea factories.

The initial factory has:
- Four withering troughs.
- One dryer machine.
- One Raspberry Pi gateway.

The system must support multiple factories and variable numbers of troughs and dryers.

IMPORTANT RULES:

1. Use only three roles: admin, manager and viewer.
2. Do not create an operator role.
3. Do not introduce floors.
4. Do not implement automatic fan, heater or machinery control.
5. Troughs have dry and wet temperature sensors.
6. Trough depression = dry temperature - wet temperature.
7. Dryers have only one temperature sensor.
8. Do not display wet temperature or depression for dryers.
9. Follow the supplied Google Stitch UI screenshots.
10. Use Next.js, TypeScript, Tailwind CSS, shadcn/ui and Supabase.
11. Never expose privileged Supabase credentials.
12. Do not hardcode the initial factory's device count.
13. Preserve existing project files and work.

FIRST TASK: INSPECTION ONLY.

1. Inspect the complete current project workspace.
2. Inspect all reference images.
3. Inspect the official logo.
4. Identify existing code and project configuration.
5. Identify installed dependencies.
6. Summarize the UI design system.
7. Identify missing information and technical conflicts.
8. Propose the exact Phase 1 implementation plan.
9. List files you expect to create or modify.

Do not create, modify, delete or overwrite any files yet.

Do not start Phase 2 or later.

Present your inspection report and Phase 1 plan, then wait for my approval.
```

---

# 17. FINAL PROJECT CHECKLIST

## Preparation

- [ ] Create the project folder.
- [ ] Save this Markdown guide in the project root.
- [ ] Export Google Stitch screenshots.
- [ ] Place screenshots in `references/`.
- [ ] Collect the official Hayleys logo.
- [ ] Place the logo in `public/assets/`.
- [ ] Confirm the database schema with the database collaborator.
- [ ] Confirm the Raspberry Pi payload requirements.
- [ ] Initialize or inspect the GitHub repository.

## Development

- [ ] Phase 0 — Inspection.
- [ ] Phase 1 — Project foundation.
- [ ] Phase 2 — UI implementation.
- [ ] Phase 3 — Supabase database.
- [ ] Phase 4 — Authentication and authorization.
- [ ] Phase 5 — Database integration.
- [ ] Phase 6 — Alarms and configuration.
- [ ] Phase 7 — Raspberry Pi integration.
- [ ] Phase 8 — Testing and deployment.

---

# FINAL PROJECT INSTRUCTION

Build a secure, scalable and maintainable Tea Withering Monitoring System.

Prioritize:

- Correct database relationships.
- Multi-factory scalability.
- Secure role-based access.
- Accurate temperature monitoring.
- Reliable hardware data ingestion.
- Clear alert management.
- Historical reporting.
- Consistent implementation of the supplied UI designs.

Work incrementally.

Do not build everything at once.

Complete each phase, report the results and wait for approval before moving to the next phase.
