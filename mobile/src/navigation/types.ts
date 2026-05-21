export type RootStackParams = {
  Login: undefined;
  Register: undefined;
  UserTabs: undefined;
  ActiveBooking: { bookingId: string };
  BookingSuccess: { booking: any };
  AutoReschedule: { bookingId: string };
  Feedback: { bookingId: string; providerId: string };
  Dispute: { bookingId: string };
  Providers: {
    requestId: string;
    candidates: import('../types').Candidate[];
    intent: import('../types').IntentData;
  };
};

export type UserTabParams = {
  Chat: undefined;
  Bookings: undefined;
  Notifications: undefined;
  Profile: undefined;
};

export type ProviderTabParams = {
  Home: undefined;
  Jobs: undefined;
  Inbox: undefined;
  Profile: undefined;
};
