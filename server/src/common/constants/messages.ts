export const messages = {
    DATA_FETCHED_SUCCESS: 'Data fetched successfully',
    RECORD_UPDATED_SUCCESS: 'Record has been updated successfully',
    RECORD_CREATED_SUCCESS: 'Record has been created successfully',
    RECORD_DELETED_SUCCESS: 'Record has been deleted successfully',
    USER: {
        NOT_FOUND: 'User not found',
        UPDATE: 'User has been updated successfully',
        ALREADY_EXISTS: 'A user with this email already exists',
        CREATED_SUCCESS: 'User registered successfully',
    },
    AUTH: {
        INVALID_CREDENTIALS: 'Invalid email or password',
        INVALID_API_KEY: 'Invalid API key',
        UNAUTHORIZED: 'Unauthorized',
        LOGIN_SUCCESS: 'Login successful',
    },
    PROVIDER: {
        NOT_FOUND: 'Provider not found',
    },
    BOOKING: {
        NOT_FOUND: 'Booking not found',
        SLOT_UNAVAILABLE: 'The selected time slot is no longer available',
        CREATED_SUCCESS: 'Booking confirmed successfully',
        CANCELLED_SUCCESS: 'Booking cancelled successfully',
        STATUS_UPDATED: 'Booking status updated',
        NOT_CANCELLABLE: 'This booking can no longer be cancelled',
        SCHEDULE_REQUIRED:
            'A scheduled time is required to book — none in the request and none provided',
        INVALID_SCHEDULE: 'The provided scheduled time is not a valid ISO timestamp',
    },
    REQUEST: {
        NOT_FOUND: 'Service request not found',
        NEEDS_CLARIFICATION: 'Additional information needed',
        READY: 'Service request ready',
        CLARIFY_NOT_ALLOWED: 'This request is not awaiting clarification',
        NOT_READY_FOR_REASONING: 'Reasoning is only available once the request has been ranked',
        NOT_READY_FOR_BOOKING: 'A booking can only be created from a request that has been ranked',
        NO_PRICING_QUOTE: 'This request does not have a pricing quote yet',
        CANDIDATE_NOT_IN_POOL: 'That provider was not in this request’s candidate pool',
    },
    GEMINI: {
        UPSTREAM_FAILURE: 'AI service is temporarily unavailable',
        INVALID_JSON: 'AI returned a malformed response',
        EMPTY_RESPONSE: 'AI returned an empty response',
        TIMEOUT: 'AI request timed out',
    },
    NOTIFICATION: {
        NOT_FOUND: 'Notification not found',
        MARKED_READ: 'Notification marked as read',
    },
};
