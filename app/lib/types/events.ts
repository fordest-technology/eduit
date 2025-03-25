export interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location?: string;
  classId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventCreateInput {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location?: string;
  classId?: string;
}

export interface EventUpdateInput extends Partial<EventCreateInput> {}
