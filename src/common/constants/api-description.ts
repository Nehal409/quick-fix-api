export const descriptions = {
    AUTH: {
        REGISTER: 'Register a new account. Role must be customer or provider.',
        LOGIN: 'Login with email and password. Returns a JWT token.',
        ME: 'Get the currently authenticated user profile.',
    },
    USER: {
        GET_USER_DETAILS: 'Retrieve the authenticated user profile.',
        UPDATE_USER: 'Update user profile fields.',
    },
    REQUEST: {
        CREATE: 'Submit a free-form service request (English / Urdu / Roman Urdu). Runs the Intent Agent and returns either the structured intent or a clarification ask.',
        CLARIFY:
            'Provide answers to clarification questions raised by a previous request. Re-runs the Intent Agent with the answers folded in.',
        REASONING:
            'Return the per-factor breakdown, narrative, and runner-up comparison for one ranked candidate. Used by the "How I decided" panel.',
    },
    BOOKING: {
        CREATE: 'Confirm a booking for one ranked candidate from a READY request. Returns the booking row plus a simulated WhatsApp confirmation payload.',
        LIST: 'List bookings for the current user. Customers see their own; providers see jobs assigned to them.',
        DETAIL: 'Single booking with status timeline, pricing breakdown, and map data (origin/destination/eta).',
        UPDATE_STATUS:
            'Provider transitions the booking through en_route → in_progress → completed.',
        CANCEL: 'Cancel a booking. When the Reschedule Agent is wired, provider-side cancellations will also trigger auto-reschedule.',
    },
};
