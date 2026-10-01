import type {
  Appointment,
  AppointmentDraft,
  AppointmentStatus,
  Expense,
  ExpenseDraft,
  Payment,
  PaymentMethod,
} from "./agenda-types";
import { createClient } from "./supabase/client";

type RelatedClient = { name: string; phone: string };
type RelatedPet = {
  name: string;
  species: "Perro" | "Gato";
  breed: string;
  size: "Pequeño" | "Mediano" | "Grande";
};

type AppointmentRow = {
  id: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  service: string;
  price_cents: number;
  status: AppointmentStatus;
  notes: string;
  clients: RelatedClient | RelatedClient[];
  pets: RelatedPet | RelatedPet[];
  payments: Array<{
    id: string;
    amount_cents: number;
    method: PaymentMethod;
    paid_on: string;
  }>;
};

type ExpenseRow = {
  id: string;
  expense_date: string;
  description: string;
  category: Expense["category"];
  amount_cents: number;
  status: Expense["status"];
};

function firstRelated<Value>(value: Value | Value[]) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function clientIdentityKey(name: string, phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits ? `phone:${digits}` : `name:${normalizeKey(name)}`;
}

function eurosToCents(value: string) {
  const amount = Number(value.replace(",", "."));
  return Number.isFinite(amount) ? Math.max(0, Math.round(amount * 100)) : 0;
}

function centsToEuros(value: number) {
  return (value / 100).toFixed(2);
}

async function getOwnerId() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("La sesión ha caducado. Vuelve a iniciar sesión.");
  return { supabase, ownerId: data.user.id };
}

export async function loadAgendaData() {
  const { supabase } = await getOwnerId();
  const [appointmentsResult, expensesResult] = await Promise.all([
    supabase
      .from("appointments")
      .select(`
        id,
        appointment_date,
        appointment_time,
        duration_minutes,
        service,
        price_cents,
        status,
        notes,
        clients (name, phone),
        pets (name, species, breed, size),
        payments (id, amount_cents, method, paid_on)
      `)
      .order("appointment_date", { ascending: true })
      .order("appointment_time", { ascending: true }),
    supabase
      .from("expenses")
      .select("id, expense_date, description, category, amount_cents, status")
      .order("expense_date", { ascending: false }),
  ]);

  if (appointmentsResult.error) throw appointmentsResult.error;
  if (expensesResult.error) throw expensesResult.error;

  const appointments = (appointmentsResult.data as AppointmentRow[]).map((row): Appointment => {
    const client = firstRelated(row.clients);
    const pet = firstRelated(row.pets);
    return {
      id: row.id,
      date: row.appointment_date,
      time: row.appointment_time.slice(0, 5),
      duration: row.duration_minutes,
      clientName: client.name,
      phone: client.phone,
      petName: pet.name,
      species: pet.species,
      breed: pet.breed,
      size: pet.size,
      service: row.service,
      price: centsToEuros(row.price_cents),
      status: row.status,
      notes: row.notes,
      payments: row.payments
        .map((payment): Payment => ({
          id: payment.id,
          amount: payment.amount_cents / 100,
          method: payment.method,
          date: payment.paid_on,
        }))
        .sort((left, right) => right.date.localeCompare(left.date)),
    };
  });

  const expenses = (expensesResult.data as ExpenseRow[]).map((row): Expense => ({
    id: row.id,
    date: row.expense_date,
    description: row.description,
    category: row.category,
    amount: row.amount_cents / 100,
    status: row.status,
  }));

  return { appointments, expenses };
}

async function upsertClientAndPet(draft: AppointmentDraft) {
  const { supabase, ownerId } = await getOwnerId();
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .upsert({
      owner_id: ownerId,
      name: draft.clientName.trim(),
      phone: draft.phone.trim(),
      identity_key: clientIdentityKey(draft.clientName, draft.phone),
    }, { onConflict: "owner_id,identity_key" })
    .select("id")
    .single();

  if (clientError) throw clientError;

  const { data: pet, error: petError } = await supabase
    .from("pets")
    .upsert({
      owner_id: ownerId,
      client_id: client.id,
      name: draft.petName.trim(),
      name_key: normalizeKey(draft.petName),
      species: draft.species,
      breed: draft.breed.trim(),
      size: draft.size,
    }, { onConflict: "owner_id,client_id,name_key" })
    .select("id")
    .single();

  if (petError) throw petError;
  return { supabase, ownerId, clientId: client.id, petId: pet.id };
}

export async function persistAppointment(draft: AppointmentDraft, appointmentId?: string) {
  const { supabase, ownerId, clientId, petId } = await upsertClientAndPet(draft);
  const values = {
    owner_id: ownerId,
    client_id: clientId,
    pet_id: petId,
    appointment_date: draft.date,
    appointment_time: draft.time,
    duration_minutes: draft.duration,
    service: draft.service.trim(),
    price_cents: eurosToCents(draft.price),
    status: draft.status,
    notes: draft.notes.trim(),
  };

  const query = appointmentId
    ? supabase.from("appointments").update(values).eq("id", appointmentId).select("id").single()
    : supabase.from("appointments").insert(values).select("id").single();
  const { data, error } = await query;
  if (error) throw error;
  return data.id as string;
}

export async function persistAppointmentStatus(appointmentId: string, status: AppointmentStatus) {
  const { supabase } = await getOwnerId();
  const { error } = await supabase.from("appointments").update({ status }).eq("id", appointmentId);
  if (error) throw error;
}

export async function removeAppointment(appointmentId: string) {
  const { supabase } = await getOwnerId();
  const { error } = await supabase.from("appointments").delete().eq("id", appointmentId);
  if (error) throw error;
}

export async function persistPayment(appointmentId: string, payment: Omit<Payment, "id">) {
  const { supabase, ownerId } = await getOwnerId();
  const { data, error } = await supabase
    .from("payments")
    .insert({
      owner_id: ownerId,
      appointment_id: appointmentId,
      amount_cents: Math.max(1, Math.round(payment.amount * 100)),
      method: payment.method,
      paid_on: payment.date,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function removePayment(paymentId: string) {
  const { supabase } = await getOwnerId();
  const { error } = await supabase.from("payments").delete().eq("id", paymentId);
  if (error) throw error;
}

export async function persistExpense(expense: ExpenseDraft) {
  const { supabase, ownerId } = await getOwnerId();
  const { data, error } = await supabase
    .from("expenses")
    .insert({
      owner_id: ownerId,
      expense_date: expense.date,
      description: expense.description.trim(),
      category: expense.category,
      amount_cents: Math.max(1, Math.round(expense.amount * 100)),
      status: expense.status,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function persistExpenseStatus(expenseId: string, status: Expense["status"]) {
  const { supabase } = await getOwnerId();
  const { error } = await supabase.from("expenses").update({ status }).eq("id", expenseId);
  if (error) throw error;
}

export async function removeExpense(expenseId: string) {
  const { supabase } = await getOwnerId();
  const { error } = await supabase.from("expenses").delete().eq("id", expenseId);
  if (error) throw error;
}
