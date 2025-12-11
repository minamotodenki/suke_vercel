export interface Event {
  id: string;
  title: string;
  description?: string;
  created_at: string;
  expires_at?: string;
}

export interface DateOption {
  id: string;
  event_id: string;
  date: string;
  time_start?: string;
  time_end?: string;
}

export interface Response {
  id: string;
  event_id: string;
  date_option_id: string;
  name: string;
  status: 'ok' | 'maybe' | 'ng';
  comment?: string;
  created_at: string;
}

export interface EventWithOptions extends Event {
  date_options: DateOption[];
}

export interface EventWithResponses extends EventWithOptions {
  responses: Response[];
}






