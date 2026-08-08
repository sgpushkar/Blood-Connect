/**
 * Blood Connect GraphQL Schema Definition (SDL).
 * Complete schema with types, enums, inputs, queries, mutations, and subscriptions.
 */

export const typeDefs = /* GraphQL */ `
  scalar DateTime

  # ─── Enums ───────────────────────────────────────────

  enum BloodGroup {
    A_POS
    A_NEG
    B_POS
    B_NEG
    AB_POS
    AB_NEG
    O_POS
    O_NEG
  }

  enum UserRole {
    DONOR
    PATIENT
    HOSPITAL
    BLOOD_BANK
    ADMIN
  }

  enum RequestStatus {
    OPEN
    MATCHED
    FULFILLED
    CANCELLED
  }

  enum UrgencyLevel {
    CRITICAL
    URGENT
    STANDARD
  }

  enum NotificationType {
    EMERGENCY
    INFO
    SUCCESS
    REMINDER
  }

  enum Gender {
    MALE
    FEMALE
    OTHER
  }

  # ─── Core Types ──────────────────────────────────────

  type User {
    id: ID!
    email: String!
    name: String!
    phone: String
    role: UserRole!
    emailVerified: Boolean!
    blocked: Boolean!
    createdAt: DateTime!
    donor: PublicDonor
    hospital: Hospital
    bloodBank: BloodBank
  }

  """
  Public donor view — sensitive fields (address, exact coordinates, phone, email) are stripped.
  """
  type PublicDonor {
    id: ID!
    name: String!
    age: Int!
    gender: Gender!
    bloodGroup: BloodGroup!
    city: String!
    available: Boolean!
    verified: Boolean!
    totalDonations: Int!
    badge: String!
    avatarSeed: String
    eligible: Boolean!
    daysUntilEligible: Int!
    lastDonation: DateTime
    distanceKm: Float
    createdAt: DateTime!
  }

  """
  Private donor view — includes sensitive fields. Only visible to the donor themselves or ADMIN.
  """
  type PrivateDonor {
    id: ID!
    name: String!
    age: Int!
    gender: Gender!
    bloodGroup: BloodGroup!
    weightKg: Int!
    phone: String!
    email: String!
    city: String!
    address: String!
    available: Boolean!
    verified: Boolean!
    totalDonations: Int!
    badge: String!
    avatarSeed: String
    eligible: Boolean!
    daysUntilEligible: Int!
    lastDonation: DateTime
    createdAt: DateTime!
  }

  type Hospital {
    id: ID!
    name: String!
    city: String!
    address: String!
    verified: Boolean!
    activeRequests: Int!
    bedsForTransfusion: Int!
    lat: Float!
    lng: Float!
    createdAt: DateTime!
    bloodRequests: [BloodRequest!]
  }

  type BloodBank {
    id: ID!
    name: String!
    city: String!
    address: String!
    lat: Float!
    lng: Float!
    createdAt: DateTime!
    stock: [BloodStock!]!
  }

  type BloodStock {
    bloodGroup: BloodGroup!
    units: Int!
  }

  type BloodRequest {
    id: ID!
    patientName: String!
    bloodGroup: BloodGroup!
    unitsRequired: Int!
    urgency: UrgencyLevel!
    hospital: Hospital!
    hospitalAddress: String!
    requiredDate: DateTime!
    doctorContact: String
    status: RequestStatus!
    createdAt: DateTime!
    acceptedDonors: [PublicDonor!]!
    matchedCount: Int!
  }

  type Donation {
    id: ID!
    donor: PublicDonor!
    hospital: Hospital!
    date: DateTime!
    units: Int!
    certificateId: String!
    createdAt: DateTime!
  }

  type Notification {
    id: ID!
    title: String!
    body: String!
    type: NotificationType!
    read: Boolean!
    createdAt: DateTime!
  }

  type NetworkStats {
    totalDonors: Int!
    availableDonors: Int!
    registeredHospitals: Int!
    registeredBloodBanks: Int!
    totalDonations: Int!
    activeBloodRequests: Int!
    fulfilledRequests: Int!
    livesSupported: Int!
  }

  # ─── Pagination ──────────────────────────────────────

  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
  }

  type DonorEdge {
    node: PublicDonor!
    cursor: String!
  }

  type DonorConnection {
    edges: [DonorEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type BloodRequestEdge {
    node: BloodRequest!
    cursor: String!
  }

  type BloodRequestConnection {
    edges: [BloodRequestEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  # ─── Auth ────────────────────────────────────────────

  type AuthPayload {
    token: String!
    user: User!
  }

  # ─── Inputs ─────────────────────────────────────────

  input PaginationInput {
    first: Int
    after: String
  }

  input RegisterInput {
    email: String!
    password: String!
    name: String!
    phone: String
    role: UserRole!
    # Donor-specific optional fields
    bloodGroup: BloodGroup
    age: Int
    gender: Gender
    city: String
    weightKg: Int
  }

  input DonorFilterInput {
    bloodGroup: BloodGroup
    latitude: Float
    longitude: Float
    radiusKm: Float
    availableOnly: Boolean
    eligibleOnly: Boolean
    city: String
    maxAge: Int
    verifiedOnly: Boolean
  }

  input RequestFilterInput {
    bloodGroup: BloodGroup
    status: RequestStatus
    urgency: UrgencyLevel
    hospitalId: String
    city: String
  }

  input HospitalFilterInput {
    city: String
    verifiedOnly: Boolean
  }

  input CreateBloodRequestInput {
    patientName: String!
    bloodGroup: BloodGroup!
    unitsRequired: Int!
    urgency: UrgencyLevel!
    hospitalId: String!
    requiredDate: DateTime!
    doctorContact: String
  }

  input UpdateBloodRequestInput {
    unitsRequired: Int
    urgency: UrgencyLevel
    requiredDate: DateTime
    doctorContact: String
  }

  input UpdateDonorInput {
    name: String
    phone: String
    city: String
    age: Int
    weightKg: Int
    available: Boolean
  }

  input RecordDonationInput {
    donorId: String!
    hospitalId: String!
    date: DateTime!
    units: Int!
  }

  # ─── Queries ─────────────────────────────────────────

  type Query {
    """Public: no auth required"""
    networkStats: NetworkStats!

    """Requires auth"""
    me: User!
    myDonorProfile: PrivateDonor

    donors(filter: DonorFilterInput, pagination: PaginationInput): DonorConnection!
    donor(id: ID!): PublicDonor

    hospitals(filter: HospitalFilterInput): [Hospital!]!
    hospital(id: ID!): Hospital

    bloodBanks(city: String): [BloodBank!]!
    bloodBank(id: ID!): BloodBank

    bloodRequests(filter: RequestFilterInput, pagination: PaginationInput): BloodRequestConnection!
    bloodRequest(id: ID!): BloodRequest

    myRequests: [BloodRequest!]!
    myDonations: [Donation!]!
    notifications(unreadOnly: Boolean): [Notification!]!

    """Matching: find compatible donors for a blood group near a location"""
    matchDonors(
      bloodGroup: BloodGroup!
      latitude: Float!
      longitude: Float!
      radiusKm: Float
      urgency: UrgencyLevel
    ): [PublicDonor!]!
  }

  # ─── Mutations ───────────────────────────────────────

  type Mutation {
    # Auth
    register(input: RegisterInput!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!

    # Blood Requests (Patient / Hospital)
    createBloodRequest(input: CreateBloodRequestInput!): BloodRequest!
    updateBloodRequest(id: ID!, input: UpdateBloodRequestInput!): BloodRequest!
    cancelBloodRequest(id: ID!): BloodRequest!
    completeBloodRequest(id: ID!): BloodRequest!

    # Donor actions
    acceptBloodRequest(requestId: ID!): BloodRequest!
    rejectBloodRequest(requestId: ID!): BloodRequest!
    toggleAvailability: PublicDonor!
    updateDonorProfile(input: UpdateDonorInput!): PrivateDonor!

    # Donations (Hospital / Blood Bank / Admin)
    recordDonation(input: RecordDonationInput!): Donation!

    # Notifications
    markNotificationRead(id: ID!): Notification!
    markAllNotificationsRead: Boolean!

    # Admin
    verifyDonor(donorId: ID!): PublicDonor!
    verifyHospital(hospitalId: ID!): Hospital!
    blockUser(userId: ID!): User!

    # Emergency
    broadcastEmergency(message: String!, bloodGroup: BloodGroup!): Boolean!
  }

  # ─── Subscriptions ──────────────────────────────────

  type Subscription {
    bloodRequestCreated: BloodRequest!
    bloodRequestUpdated(id: ID): BloodRequest!
    donorAvailabilityChanged: PublicDonor!
    notificationCreated(userId: ID!): Notification!
    donationCompleted: Donation!
  }
`;
