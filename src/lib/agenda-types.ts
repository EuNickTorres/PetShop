export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "arrived"
  | "in_progress"
  | "ready"
  | "completed"
  | "cancelled"
  | "no_show";

export type PaymentMethod = "cash" | "card" | "transfer" | "other";

export type Payment = {
  id: string;
  amount: number;
  method: PaymentMethod;
  date: string;
};

export type Appointment = {
  id: string;
  date: string;
  time: string;
  duration: number;
  clientName: string;
  phone: string;
  petName: string;
  species: "Perro" | "Gato";
  breed: string;
  size: "Pequeño" | "Mediano" | "Grande";
  service: string;
  price: string;
  status: AppointmentStatus;
  notes: string;
  payments: Payment[];
};

export type AppointmentDraft = Omit<Appointment, "id" | "payments">;

export type ExpenseStatus = "planned" | "paid";

export type Expense = {
  id: string;
  date: string;
  description: string;
  category: "Productos" | "Alquiler" | "Suministros" | "Equipamiento" | "Otros";
  amount: number;
  status: ExpenseStatus;
};

export type ExpenseDraft = Omit<Expense, "id">;
