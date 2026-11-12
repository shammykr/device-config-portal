// GraphQL documents. Fragments keep the shape of cached entities consistent.

const LOCATION = `id name region`;

export const DEVICE_FIELDS = `
  id name serial model firmwareVersion status lastSeen
  location { ${LOCATION} }
  settings { telemetryIntervalSec logLevel autoUpdate }
`;

const POLICY_FIELDS = `
  id name model targetVersion channel autoApprove
  maintenanceWindowStart maintenanceWindowEnd maxConcurrentPercent updatedAt
  locations { ${LOCATION} }
`;

const OTA_FIELDS = `
  id model firmwareVersion status scheduledAt targetCount completedCount failedCount createdAt
  locations { ${LOCATION} }
`;

export const DEVICES_QUERY = `query Devices { devices { ${DEVICE_FIELDS} } }`;
export const LOCATIONS_QUERY = `query Locations { locations { ${LOCATION} } }`;
export const RELEASES_QUERY = `query Releases { firmwareReleases { version model channel releasedAt } }`;
export const POLICIES_QUERY = `query Policies { firmwarePolicies { ${POLICY_FIELDS} } }`;
export const OTA_UPDATES_QUERY = `query OtaUpdates { otaUpdates { ${OTA_FIELDS} } }`;

export const UPDATE_DEVICE_SETTINGS = `
  mutation UpdateDeviceSettings($ids: [ID!]!, $input: DeviceSettingsInput!) {
    updateDeviceSettings(ids: $ids, input: $input) { ${DEVICE_FIELDS} }
  }`;

export const REBOOT_DEVICES = `
  mutation RebootDevices($ids: [ID!]!) {
    rebootDevices(ids: $ids) { id status lastSeen }
  }`;

export const SAVE_POLICY = `
  mutation SavePolicy($input: FirmwarePolicyInput!) {
    saveFirmwarePolicy(input: $input) { ${POLICY_FIELDS} }
  }`;

export const DELETE_POLICY = `mutation DeletePolicy($id: ID!) { deleteFirmwarePolicy(id: $id) }`;

export const CREATE_OTA_UPDATE = `
  mutation CreateOta($input: OtaUpdateInput!) {
    createOtaUpdate(input: $input) { ${OTA_FIELDS} }
  }`;

export const SET_OTA_STATUS = `
  mutation SetOtaStatus($id: ID!, $status: OtaStatus!) {
    setOtaUpdateStatus(id: $id, status: $status) { ${OTA_FIELDS} }
  }`;

export const DEVICE_STATUS_SUBSCRIPTION = `
  subscription DeviceStatus { deviceStatusChanged { id status firmwareVersion lastSeen } }`;
