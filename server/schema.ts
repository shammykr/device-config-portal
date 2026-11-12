export const typeDefs = /* GraphQL */ `
  enum DeviceStatus { ONLINE OFFLINE UPDATING ERROR }
  enum LogLevel { DEBUG INFO WARN ERROR }
  enum Channel { STABLE BETA }
  enum OtaStatus { SCHEDULED IN_PROGRESS PAUSED COMPLETED CANCELLED }

  type Location { id: ID! name: String! region: String! }

  type DeviceSettings {
    telemetryIntervalSec: Int!
    logLevel: LogLevel!
    autoUpdate: Boolean!
  }

  type Device {
    id: ID!
    name: String!
    serial: String!
    model: String!
    location: Location!
    firmwareVersion: String!
    status: DeviceStatus!
    lastSeen: String!
    settings: DeviceSettings!
  }

  type FirmwareRelease { version: String! model: String! channel: Channel! releasedAt: String! }

  type FirmwarePolicy {
    id: ID!
    name: String!
    model: String!
    targetVersion: String!
    channel: Channel!
    autoApprove: Boolean!
    maintenanceWindowStart: String!
    maintenanceWindowEnd: String!
    maxConcurrentPercent: Int!
    locations: [Location!]!
    updatedAt: String!
  }

  type OtaUpdate {
    id: ID!
    model: String!
    firmwareVersion: String!
    locations: [Location!]!
    status: OtaStatus!
    scheduledAt: String!
    targetCount: Int!
    completedCount: Int!
    failedCount: Int!
    createdAt: String!
  }

  type DeviceStatusEvent {
    id: ID!
    status: DeviceStatus!
    firmwareVersion: String!
    lastSeen: String!
  }

  input DeviceSettingsInput {
    telemetryIntervalSec: Int
    logLevel: LogLevel
    autoUpdate: Boolean
  }

  input FirmwarePolicyInput {
    id: ID
    name: String!
    model: String!
    targetVersion: String!
    channel: Channel!
    autoApprove: Boolean!
    maintenanceWindowStart: String!
    maintenanceWindowEnd: String!
    maxConcurrentPercent: Int!
    locationIds: [ID!]!
  }

  input OtaUpdateInput {
    model: String!
    firmwareVersion: String!
    locationIds: [ID!]!
    scheduledAt: String!
  }

  type Query {
    devices: [Device!]!
    locations: [Location!]!
    firmwareReleases(model: String): [FirmwareRelease!]!
    firmwarePolicies: [FirmwarePolicy!]!
    otaUpdates: [OtaUpdate!]!
  }

  type Mutation {
    updateDeviceSettings(ids: [ID!]!, input: DeviceSettingsInput!): [Device!]!
    rebootDevices(ids: [ID!]!): [Device!]!
    saveFirmwarePolicy(input: FirmwarePolicyInput!): FirmwarePolicy!
    deleteFirmwarePolicy(id: ID!): ID!
    createOtaUpdate(input: OtaUpdateInput!): OtaUpdate!
    setOtaUpdateStatus(id: ID!, status: OtaStatus!): OtaUpdate!
  }

  type Subscription {
    "Batches of device status changes, pushed every couple of seconds."
    deviceStatusChanged: [DeviceStatusEvent!]!
  }
`;
