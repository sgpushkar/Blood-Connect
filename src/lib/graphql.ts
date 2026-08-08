/**
 * Lightweight GraphQL client for the Blood Connect frontend.
 * Uses fetch — no heavy client library needed for this level of integration.
 *
 * Falls back gracefully to mock data if the server is unreachable.
 */

const API_URL = import.meta.env.VITE_GRAPHQL_URL ?? "http://localhost:4000/graphql";

interface GqlResponse<T = unknown> {
  data?: T;
  errors?: Array<{ message: string }>;
}

let _token: string | null = null;

/**
 * Set the auth token for subsequent requests.
 */
export function setAuthToken(token: string | null) {
  _token = token;
}

/**
 * Get the current auth token.
 */
export function getAuthToken(): string | null {
  return _token;
}

/**
 * Execute a GraphQL query or mutation.
 */
export async function gql<T = unknown>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (_token) {
    headers["Authorization"] = `Bearer ${_token}`;
  }

  const res = await fetch(API_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
  });

  const json: GqlResponse<T> = await res.json();

  if (json.errors?.length) {
    throw new Error(json.errors[0].message);
  }

  return json.data as T;
}

// ─── Pre-built queries ───────────────────────────────

export const NETWORK_STATS_QUERY = `
  query NetworkStats {
    networkStats {
      totalDonors
      availableDonors
      registeredHospitals
      registeredBloodBanks
      totalDonations
      activeBloodRequests
      fulfilledRequests
      livesSupported
    }
  }
`;

export const LOGIN_MUTATION = `
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        id
        name
        email
        phone
        role
        donor {
          id
          name
          age
          gender
          bloodGroup
          city
          lastDonation
          available
          totalDonations
          badge
          verified
          avatarSeed
        }
      }
    }
  }
`;

export const REGISTER_MUTATION = `
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      token
      user {
        id
        name
        email
        role
      }
    }
  }
`;

export const DONORS_QUERY = `
  query Donors($filter: DonorFilterInput, $pagination: PaginationInput) {
    donors(filter: $filter, pagination: $pagination) {
      edges {
        node {
          id
          name
          age
          gender
          bloodGroup
          city
          available
          verified
          totalDonations
          badge
          avatarSeed
          eligible
          daysUntilEligible
          lastDonation
          distanceKm
        }
        cursor
      }
      pageInfo {
        hasNextPage
        endCursor
      }
      totalCount
    }
  }
`;

export const BLOOD_REQUESTS_QUERY = `
  query BloodRequests($filter: RequestFilterInput, $pagination: PaginationInput) {
    bloodRequests(filter: $filter, pagination: $pagination) {
      edges {
        node {
          id
          patientName
          bloodGroup
          unitsRequired
          urgency
          status
          createdAt
          requiredDate
          hospitalAddress
          matchedCount
          hospital {
            id
            name
            city
          }
          acceptedDonors {
            id
            name
            bloodGroup
          }
        }
        cursor
      }
      pageInfo {
        hasNextPage
        endCursor
      }
      totalCount
    }
  }
`;

export const CREATE_BLOOD_REQUEST_MUTATION = `
  mutation CreateBloodRequest($input: CreateBloodRequestInput!) {
    createBloodRequest(input: $input) {
      id
      patientName
      bloodGroup
      unitsRequired
      urgency
      status
      hospital {
        name
      }
    }
  }
`;

export const TOGGLE_AVAILABILITY_MUTATION = `
  mutation ToggleAvailability {
    toggleAvailability {
      id
      available
    }
  }
`;

export const ACCEPT_REQUEST_MUTATION = `
  mutation AcceptBloodRequest($requestId: ID!) {
    acceptBloodRequest(requestId: $requestId) {
      id
      status
      matchedCount
    }
  }
`;

export const CANCEL_REQUEST_MUTATION = `
  mutation CancelBloodRequest($id: ID!) {
    cancelBloodRequest(id: $id) {
      id
      status
    }
  }
`;

export const NOTIFICATIONS_QUERY = `
  query Notifications($unreadOnly: Boolean) {
    notifications(unreadOnly: $unreadOnly) {
      id
      title
      body
      type
      read
      createdAt
    }
  }
`;

export const MARK_NOTIFICATION_READ_MUTATION = `
  mutation MarkNotificationRead($id: ID!) {
    markNotificationRead(id: $id) {
      id
      read
    }
  }
`;

export const MY_DONOR_PROFILE_QUERY = `
  query MyDonorProfile {
    myDonorProfile {
      id
      name
      age
      gender
      bloodGroup
      weightKg
      phone
      email
      city
      address
      lat
      lng
      lastDonation
      available
      totalDonations
      badge
      verified
      avatarSeed
    }
  }
`;

export const ME_HOSPITAL_QUERY = `
  query MeHospital {
    me {
      id
      name
      hospital {
        id
        name
        city
        address
        verified
        activeRequests
        bedsForTransfusion
        lat
        lng
      }
    }
  }
`;

export const MY_DONATIONS_QUERY = `
  query MyDonations {
    myDonations {
      id
      date
      units
      certificateId
      hospital {
        name
      }
    }
  }
`;

export const ME_BLOOD_BANK_QUERY = `
  query MeBloodBank {
    me {
      id
      name
      bloodBank {
        id
        name
        city
        address
        stock {
          bloodGroup
          units
        }
      }
    }
  }
`;

export const HOSPITALS_QUERY = `
  query Hospitals {
    hospitals {
      id
      name
      city
      address
      verified
    }
  }
`;

export const BLOOD_BANKS_QUERY = `
  query BloodBanks {
    bloodBanks {
      id
      name
      city
    }
  }
`;

export const MY_REQUESTS_QUERY = `
  query MyRequests {
    myRequests {
      id
      patientName
      bloodGroup
      unitsRequired
      urgency
      status
      createdAt
      requiredDate
      hospitalAddress
      matchedCount
      hospital {
        id
        name
        city
      }
      acceptedDonors {
        id
        name
        bloodGroup
      }
    }
  }
`;

export const VERIFY_DONOR_MUTATION = `
  mutation VerifyDonor($donorId: ID!) {
    verifyDonor(donorId: $donorId) {
      id
      verified
    }
  }
`;

export const VERIFY_HOSPITAL_MUTATION = `
  mutation VerifyHospital($hospitalId: ID!) {
    verifyHospital(hospitalId: $hospitalId) {
      id
      verified
    }
  }
`;

export interface NetworkStatsData {
  networkStats: {
    totalDonors: number;
    availableDonors: number;
    registeredHospitals: number;
    registeredBloodBanks: number;
    totalDonations: number;
    activeBloodRequests: number;
    fulfilledRequests: number;
    livesSupported: number;
  };
}
