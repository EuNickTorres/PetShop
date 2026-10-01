"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { logoutAgenda } from "@/app/agenda/actions";
import type {
  Appointment,
  AppointmentDraft,
  AppointmentStatus,
  Expense,
  ExpenseDraft,
  ExpenseStatus,
  Payment,
  PaymentMethod,
} from "@/lib/agenda-types";
import {
  loadAgendaData,
  persistAppointment,
  persistAppointmentStatus,
  persistExpense,
  persistExpenseStatus,
  persistPayment,
  removeAppointment,
  removeExpense,
  removePayment,
} from "@/lib/agenda-repository";
import { isSupabaseConfigured } from "@/lib/supabase/config";
type View = "home" | "agenda" | "clients" | "finance" | "reports";
type AgendaTheme = "light" | "dark";
type DashboardRange = "month" | "30days" | "all";
type DashboardStatus = "all" | AppointmentStatus;

type ClientSummary = {
  id: string;
  clientName: string;
  phone: string;
  lastAppointment: Appointment;
  visits: Appointment[];
  pets: Map<string, Appointment>;
};

const STORAGE_KEY = "dayana-agenda-appointments-v1";
const EXPENSES_STORAGE_KEY = "dayana-agenda-expenses-v1";
const THEME_STORAGE_KEY = "dayana-agenda-theme-v1";
const DAY_IN_MS = 86_400_000;

const statusLabels: Record<AppointmentStatus, string> = {
  pending: "Por confirmar",
  confirmed: "Confirmada",
  arrived: "En la tienda",
  in_progress: "En atención",
  ready: "Lista para recoger",
  completed: "Finalizada",
  cancelled: "Cancelada",
  no_show: "No se presentó",
};

const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transferencia",
  other: "Otro",
};

const statusFlow: AppointmentStatus[] = [
  "pending",
  "confirmed",
  "arrived",
  "in_progress",
  "ready",
  "completed",
];

const emptyDraft: AppointmentDraft = {
  date: "",
  time: "09:30",
  duration: 90,
  clientName: "",
  phone: "",
  petName: "",
  species: "Perro",
  breed: "",
  size: "Mediano",
  service: "Baño e hidratación",
  price: "",
  status: "confirmed",
  notes: "",
};

const emptyExpenseDraft: ExpenseDraft = {
  date: "",
  description: "",
  category: "Productos",
  amount: 0,
  status: "paid",
};

function dateToKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function keyToDate(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function startOfWeek(date: Date) {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const weekday = copy.getDay() || 7;
  copy.setDate(copy.getDate() - weekday + 1);
  return copy;
}

function addDays(date: Date, amount: number) {
  return new Date(date.getTime() + amount * DAY_IN_MS);
}

function formatLongDate(key: string) {
  const formatted = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(keyToDate(key));
  return `${formatted.charAt(0).toUpperCase()}${formatted.slice(1)}`;
}

function createId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function minutesToLabel(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} min`;
  if (!rest) return `${hours} h`;
  return `${hours} h ${rest} min`;
}

function calculateEndTime(startTime: string, duration: number) {
  const [hours, minutes] = startTime.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return startTime;

  const endMinutes = (hours * 60 + minutes + duration) % (24 * 60);
  const endHours = String(Math.floor(endMinutes / 60)).padStart(2, "0");
  const remainingMinutes = String(endMinutes % 60).padStart(2, "0");
  return `${endHours}:${remainingMinutes}`;
}

function parsePrice(price: string) {
  const clean = price.trim().replace(/\s|€/g, "");
  if (!clean) return 0;
  const normalized = clean.includes(",")
    ? clean.replace(/\./g, "").replace(",", ".")
    : clean;
  return Number(normalized) || 0;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

function formatShortDate(key: string) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(keyToDate(key));
}

function paidTotal(appointment: Appointment) {
  return appointment.payments.reduce((total, payment) => total + payment.amount, 0);
}

function remainingTotal(appointment: Appointment) {
  return Math.max(0, parsePrice(appointment.price) - paidTotal(appointment));
}

function paymentState(appointment: Appointment) {
  const price = parsePrice(appointment.price);
  const paid = paidTotal(appointment);
  if (!price || !paid) return "pending" as const;
  if (paid + 0.005 >= price) return "paid" as const;
  return "partial" as const;
}

function paymentStateLabel(appointment: Appointment) {
  const state = paymentState(appointment);
  if (state === "paid") return "Pagado";
  if (state === "partial") return "Pago parcial";
  return "Pendiente";
}

function isInactiveStatus(status: AppointmentStatus) {
  return status === "cancelled" || status === "no_show";
}

function appointmentInterval(appointment: Pick<Appointment, "time" | "duration">) {
  const [hours, minutes] = appointment.time.split(":").map(Number);
  const start = hours * 60 + minutes;
  return { start, end: start + appointment.duration };
}

function clientIdentityKey(appointment: Pick<Appointment, "id" | "clientName" | "phone">) {
  const name = appointment.clientName.trim().toLocaleLowerCase("es-ES");
  const phone = appointment.phone.replace(/\D/g, "");

  if (name && phone) return `${name}|${phone}`;
  return name || phone || appointment.id;
}

function nextStatus(status: AppointmentStatus) {
  const index = statusFlow.indexOf(status);
  return index >= 0 && index < statusFlow.length - 1 ? statusFlow[index + 1] : null;
}

function nextStatusAction(status: AppointmentStatus) {
  const actions: Partial<Record<AppointmentStatus, string>> = {
    pending: "Confirmar cita",
    confirmed: "Registrar llegada",
    arrived: "Iniciar atención",
    in_progress: "Marcar como lista",
    ready: "Finalizar atención",
  };
  return actions[status] ?? null;
}

function normalizeAppointment(value: Partial<Appointment>): Appointment {
  const validStatuses = Object.keys(statusLabels) as AppointmentStatus[];
  return {
    id: value.id || createId(),
    date: value.date || dateToKey(new Date()),
    time: value.time || "09:30",
    duration: Number(value.duration) || 90,
    clientName: value.clientName || "",
    phone: value.phone || "",
    petName: value.petName || "",
    species: value.species === "Gato" ? "Gato" : "Perro",
    breed: value.breed || "",
    size: value.size === "Pequeño" || value.size === "Grande" ? value.size : "Mediano",
    service: value.service || "Baño e hidratación",
    price: value.price || "",
    status: value.status && validStatuses.includes(value.status) ? value.status : "confirmed",
    notes: value.notes || "",
    payments: Array.isArray(value.payments)
      ? value.payments.filter((payment) => Number(payment.amount) > 0).map((payment) => ({
        id: payment.id || createId(),
        amount: Number(payment.amount),
        method: payment.method && paymentMethodLabels[payment.method] ? payment.method : "other",
        date: payment.date || dateToKey(new Date()),
      }))
      : [],
  };
}

function isDateInRange(key: string, range: DashboardRange, today: string) {
  if (range === "all") return true;
  const date = keyToDate(key);
  const currentDate = keyToDate(today);
  if (range === "month") {
    return date.getMonth() === currentDate.getMonth() && date.getFullYear() === currentDate.getFullYear();
  }
  return date >= addDays(currentDate, -29) && date <= currentDate;
}

function AppointmentDetailsDialog({
  appointment,
  onClose,
  onEdit,
  onPayment,
  onAdvance,
  onDeletePayment,
}: {
  appointment: Appointment;
  onClose: () => void;
  onEdit: () => void;
  onPayment: () => void;
  onAdvance: () => void;
  onDeletePayment: (paymentId: string) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
  }, []);

  const price = parsePrice(appointment.price);
  const paid = paidTotal(appointment);
  const remaining = remainingTotal(appointment);
  const followingStatus = nextStatus(appointment.status);
  const whatsappDigits = appointment.phone.replace(/\D/g, "");
  const whatsappText = appointment.status === "ready"
    ? `Hola ${appointment.clientName}, ${appointment.petName} ya está listo/a para recoger. ¡Te esperamos!`
    : `Hola ${appointment.clientName}, confirmamos la cita de ${appointment.petName} el ${formatShortDate(appointment.date)} a las ${appointment.time}.`;

  return (
    <dialog
      ref={dialogRef}
      className="agenda-dialog agenda-details-dialog"
      aria-labelledby="appointment-details-title"
      onCancel={onClose}
    >
      <article className="agenda-details-sheet">
        <header>
          <div>
            <p>Detalles de la cita</p>
            <h2 id="appointment-details-title">{appointment.petName}</h2>
            <span className={`agenda-status-label status-label-${appointment.status}`}>
              {statusLabels[appointment.status]}
            </span>
          </div>
          <button type="button" className="agenda-icon-button" onClick={onClose} aria-label="Cerrar detalles">
            Cerrar
          </button>
        </header>

        <div className="agenda-details-highlight">
          <div>
            <span>Fecha</span>
            <strong>{formatLongDate(appointment.date)}</strong>
          </div>
          <div>
            <span>Horario</span>
            <strong>{appointment.time} – {calculateEndTime(appointment.time, appointment.duration)}</strong>
          </div>
          <div>
            <span>Duración</span>
            <strong>{minutesToLabel(appointment.duration)}</strong>
          </div>
        </div>

        <dl className="agenda-details-grid">
          <div>
            <dt>Cliente</dt>
            <dd>{appointment.clientName}</dd>
          </div>
          <div>
            <dt>Teléfono</dt>
            <dd><a href={`tel:${appointment.phone.replace(/\s/g, "")}`}>{appointment.phone}</a></dd>
          </div>
          <div>
            <dt>Mascota</dt>
            <dd>{appointment.species} · {appointment.breed || "Raza no indicada"} · {appointment.size}</dd>
          </div>
          <div>
            <dt>Servicio</dt>
            <dd>{appointment.service}</dd>
          </div>
          <div>
            <dt>Precio</dt>
            <dd>{price ? formatCurrency(price) : "No indicado"}</dd>
          </div>
          <div>
            <dt>Pago</dt>
            <dd>
              {paymentStateLabel(appointment)}
              {price ? ` · ${formatCurrency(paid)} de ${formatCurrency(price)}` : ""}
            </dd>
          </div>
          <div className="agenda-details-notes">
            <dt>Observaciones</dt>
            <dd>{appointment.notes || "Sin observaciones"}</dd>
          </div>
        </dl>

        {appointment.payments.length ? (
          <section className="agenda-payment-history" aria-labelledby="payment-history-title">
            <h3 id="payment-history-title">Pagos registrados</h3>
            {appointment.payments.map((payment) => (
              <div key={payment.id}>
                <span>{formatShortDate(payment.date)} · {paymentMethodLabels[payment.method]}</span>
                <span className="agenda-payment-history-amount">
                  <strong>{formatCurrency(payment.amount)}</strong>
                  <button type="button" onClick={() => onDeletePayment(payment.id)} aria-label={`Eliminar pago de ${formatCurrency(payment.amount)}`}>Eliminar</button>
                </span>
              </div>
            ))}
          </section>
        ) : null}

        <footer>
          <div className="agenda-detail-contact-actions">
            {whatsappDigits ? (
              <a
                className="agenda-secondary-button"
                href={`https://wa.me/${whatsappDigits}?text=${encodeURIComponent(whatsappText)}`}
                target="_blank"
                rel="noreferrer"
              >
                WhatsApp
              </a>
            ) : null}
            <button type="button" className="agenda-secondary-button" onClick={onEdit}>Editar</button>
          </div>
          <div>
            {price && remaining > 0 ? (
              <button type="button" className="agenda-secondary-button" onClick={onPayment}>Registrar pago</button>
            ) : null}
            {followingStatus ? (
              <button type="button" className="agenda-primary-button" onClick={onAdvance}>
                {nextStatusAction(appointment.status)}
              </button>
            ) : (
              <button type="button" className="agenda-primary-button" onClick={onClose}>Cerrar</button>
            )}
          </div>
        </footer>
      </article>
    </dialog>
  );
}

function ClientProfileDialog({
  client,
  onClose,
  onRepeat,
  onOpenAppointment,
}: {
  client: ClientSummary;
  onClose: () => void;
  onRepeat: (appointment: Appointment) => void;
  onOpenAppointment: (appointment: Appointment) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
  }, []);

  const pets = [...client.pets.values()];
  const invoiced = client.visits
    .filter((appointment) => !isInactiveStatus(appointment.status))
    .reduce((total, appointment) => total + parsePrice(appointment.price), 0);
  const collected = client.visits.reduce((total, appointment) => total + paidTotal(appointment), 0);

  return (
    <dialog
      ref={dialogRef}
      className="agenda-dialog agenda-client-dialog"
      aria-labelledby="client-profile-title"
      onCancel={onClose}
    >
      <article className="agenda-details-sheet agenda-client-sheet">
        <header>
          <div>
            <p>Ficha del cliente</p>
            <h2 id="client-profile-title">{client.clientName}</h2>
            {client.phone ? (
              <a className="agenda-client-phone" href={`tel:${client.phone.replace(/\s/g, "")}`}>
                {client.phone}
              </a>
            ) : null}
          </div>
          <button type="button" className="agenda-icon-button" onClick={onClose} aria-label="Cerrar ficha del cliente">
            Cerrar
          </button>
        </header>

        <dl className="agenda-client-overview">
          <div>
            <dt>Última cita</dt>
            <dd>{formatShortDate(client.lastAppointment.date)}</dd>
          </div>
          <div>
            <dt>Visitas</dt>
            <dd>{client.visits.length}</dd>
          </div>
          <div>
            <dt>Mascotas</dt>
            <dd>{pets.length}</dd>
          </div>
          <div>
            <dt>Cobrado</dt>
            <dd>{formatCurrency(collected)}</dd>
            {invoiced > collected ? <small>{formatCurrency(invoiced - collected)} pendiente</small> : null}
          </div>
        </dl>

        <section className="agenda-client-pet-records" aria-labelledby="client-pets-title">
          <div className="agenda-client-section-heading">
            <h3 id="client-pets-title">Mascotas</h3>
            <span>{pets.length} registrada{pets.length === 1 ? "" : "s"}</span>
          </div>
          <div>
            {pets.map((pet) => (
              <article key={pet.petName.toLocaleLowerCase("es-ES")}>
                <strong>{pet.petName}</strong>
                <span>{pet.species}</span>
                <small>{pet.breed || "Raza no indicada"} · {pet.size}</small>
              </article>
            ))}
          </div>
        </section>

        <section className="agenda-client-history" aria-labelledby="client-history-title">
          <div className="agenda-client-section-heading">
            <h3 id="client-history-title">Historial</h3>
            <span>La cita más reciente aparece primero</span>
          </div>

          <div className="agenda-client-history-list">
            {client.visits.map((appointment, index) => {
              const price = parsePrice(appointment.price);
              const paid = paidTotal(appointment);

              return (
                <details key={appointment.id} open={index === 0 ? true : undefined}>
                  <summary>
                    <time dateTime={`${appointment.date}T${appointment.time}`}>
                      <strong>{formatShortDate(appointment.date)}</strong>
                      <span>{appointment.time} - {calculateEndTime(appointment.time, appointment.duration)}</span>
                    </time>
                    <span className="agenda-client-history-service">
                      <strong>{appointment.petName}</strong>
                      <small>{appointment.service}</small>
                    </span>
                    <span className="agenda-client-history-price">
                      <strong>{price ? formatCurrency(price) : "Sin precio"}</strong>
                      <small>{paymentStateLabel(appointment)}</small>
                    </span>
                    <span className={`agenda-status-label status-label-${appointment.status}`}>
                      {statusLabels[appointment.status]}
                    </span>
                  </summary>

                  <div className="agenda-client-history-details">
                    <dl>
                      <div>
                        <dt>Tratamiento</dt>
                        <dd>{appointment.service}</dd>
                      </div>
                      <div>
                        <dt>Duración</dt>
                        <dd>{minutesToLabel(appointment.duration)}</dd>
                      </div>
                      <div>
                        <dt>Precio</dt>
                        <dd>{price ? formatCurrency(price) : "No indicado"}</dd>
                      </div>
                      <div>
                        <dt>Cobrado</dt>
                        <dd>{formatCurrency(paid)}</dd>
                      </div>
                      <div className="agenda-client-history-notes">
                        <dt>Observaciones</dt>
                        <dd>{appointment.notes || "Sin observaciones registradas"}</dd>
                      </div>
                    </dl>
                    <button type="button" className="agenda-text-button" onClick={() => onOpenAppointment(appointment)}>
                      Ver cita completa
                    </button>
                  </div>
                </details>
              );
            })}
          </div>
        </section>

        <footer>
          <div>
            <button type="button" className="agenda-secondary-button" onClick={onClose}>Cerrar</button>
          </div>
          <div>
            <button type="button" className="agenda-primary-button" onClick={() => onRepeat(client.lastAppointment)}>
              Agendar de nuevo
            </button>
          </div>
        </footer>
      </article>
    </dialog>
  );
}

function AppointmentDialog({
  initial,
  onClose,
  onSave,
  onDelete,
}: {
  initial: Appointment | AppointmentDraft;
  onClose: () => void;
  onSave: (appointment: AppointmentDraft) => void;
  onDelete?: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState<AppointmentDraft>(() => {
    const { ...value } = initial;
    if ("id" in value) {
      const appointment = { ...value } as Partial<Appointment>;
      delete appointment.id;
      delete appointment.payments;
      return appointment as AppointmentDraft;
    }
    return value;
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
  }, []);

  function update<Key extends keyof AppointmentDraft>(key: Key, value: AppointmentDraft[Key]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  return (
    <dialog ref={dialogRef} className="agenda-dialog" onCancel={onClose}>
      <form
        className="agenda-appointment-form"
        onSubmit={(event) => {
          event.preventDefault();
          onSave(draft);
        }}
      >
        <header>
          <div>
            <p>{onDelete ? "Editar cita" : "Nueva cita"}</p>
            <h2>{draft.petName || "Datos de la cita"}</h2>
          </div>
          <button type="button" className="agenda-icon-button" onClick={onClose} aria-label="Cerrar formulario">
            Cerrar
          </button>
        </header>

        <div className="agenda-form-grid">
          <div className="agenda-field">
            <label htmlFor="appointment-date">Fecha</label>
            <input id="appointment-date" type="date" value={draft.date} onChange={(event) => update("date", event.target.value)} required />
          </div>
          <div className="agenda-field">
            <label htmlFor="appointment-time">Hora de entrada</label>
            <input id="appointment-time" type="time" value={draft.time} onChange={(event) => update("time", event.target.value)} required />
          </div>
          <div className="agenda-field">
            <label htmlFor="appointment-duration">Duración prevista (minutos)</label>
            <input
              id="appointment-duration"
              type="number"
              min="15"
              max="480"
              step="5"
              value={draft.duration}
              onChange={(event) => update("duration", Number(event.target.value))}
              required
            />
            <small className="agenda-field-hint">{minutesToLabel(draft.duration || 0)}</small>
          </div>
          <div className="agenda-field">
            <label htmlFor="appointment-status">Estado</label>
            <select id="appointment-status" value={draft.status} onChange={(event) => update("status", event.target.value as AppointmentStatus)}>
              {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
        </div>

        <fieldset>
          <legend>Cliente</legend>
          <div className="agenda-form-grid">
            <div className="agenda-field">
              <label htmlFor="client-name">Nombre</label>
              <input id="client-name" value={draft.clientName} onChange={(event) => update("clientName", event.target.value)} required />
            </div>
            <div className="agenda-field">
              <label htmlFor="client-phone">Teléfono</label>
              <input id="client-phone" type="tel" value={draft.phone} onChange={(event) => update("phone", event.target.value)} required />
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>Mascota</legend>
          <div className="agenda-form-grid">
            <div className="agenda-field">
              <label htmlFor="pet-name">Nombre</label>
              <input id="pet-name" value={draft.petName} onChange={(event) => update("petName", event.target.value)} required />
            </div>
            <div className="agenda-field">
              <label htmlFor="pet-species">Animal</label>
              <select id="pet-species" value={draft.species} onChange={(event) => update("species", event.target.value as AppointmentDraft["species"])}>
                <option>Perro</option>
                <option>Gato</option>
              </select>
            </div>
            <div className="agenda-field">
              <label htmlFor="pet-breed">Raza</label>
              <input id="pet-breed" value={draft.breed} onChange={(event) => update("breed", event.target.value)} />
            </div>
            <div className="agenda-field">
              <label htmlFor="pet-size">Tamaño</label>
              <select id="pet-size" value={draft.size} onChange={(event) => update("size", event.target.value as AppointmentDraft["size"])}>
                <option>Pequeño</option>
                <option>Mediano</option>
                <option>Grande</option>
              </select>
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>Servicio</legend>
          <div className="agenda-form-grid">
            <div className="agenda-field">
              <label htmlFor="appointment-service">Tratamiento</label>
              <select id="appointment-service" value={draft.service} onChange={(event) => update("service", event.target.value)}>
                <option>Baño e hidratación</option>
                <option>Corte y deslanado</option>
                <option>Uñas y limpieza de oídos</option>
                <option>Spa para mascotas</option>
                <option>Servicio completo</option>
                <option>Otro</option>
              </select>
            </div>
            <div className="agenda-field">
              <label htmlFor="appointment-price">Precio</label>
              <input id="appointment-price" inputMode="decimal" value={draft.price} onChange={(event) => update("price", event.target.value)} placeholder="Ej. 45" />
            </div>
          </div>
          <div className="agenda-field">
            <label htmlFor="appointment-notes">Observaciones</label>
            <textarea id="appointment-notes" rows={3} value={draft.notes} onChange={(event) => update("notes", event.target.value)} placeholder="Piel sensible, comportamiento, detalles del corte..." />
          </div>
        </fieldset>

        <footer>
          {onDelete ? <button type="button" className="agenda-danger-button" onClick={onDelete}>Eliminar cita</button> : <span />}
          <div>
            <button type="button" className="agenda-secondary-button" onClick={onClose}>Cancelar</button>
            <button type="submit" className="agenda-primary-button">Guardar cita</button>
          </div>
        </footer>
      </form>
    </dialog>
  );
}

function PaymentDialog({
  appointment,
  today,
  onClose,
  onSave,
}: {
  appointment: Appointment;
  today: string;
  onClose: () => void;
  onSave: (payment: Omit<Payment, "id">) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [amount, setAmount] = useState(() => remainingTotal(appointment).toFixed(2));
  const [method, setMethod] = useState<PaymentMethod>("card");
  const [date, setDate] = useState(today);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog ref={dialogRef} className="agenda-dialog agenda-small-dialog" onCancel={onClose}>
      <form
        className="agenda-appointment-form"
        onSubmit={(event) => {
          event.preventDefault();
          const parsedAmount = parsePrice(amount);
          if (!parsedAmount) return;
          onSave({ amount: Math.min(parsedAmount, remainingTotal(appointment)), method, date });
        }}
      >
        <header>
          <div>
            <p>Movimiento de caja</p>
            <h2>Registrar pago</h2>
          </div>
          <button type="button" className="agenda-icon-button" onClick={onClose}>Cerrar</button>
        </header>
        <div className="agenda-payment-context">
          <div><span>Mascota</span><strong>{appointment.petName}</strong></div>
          <div><span>Pendiente</span><strong>{formatCurrency(remainingTotal(appointment))}</strong></div>
        </div>
        <div className="agenda-form-grid">
          <div className="agenda-field">
            <label htmlFor="payment-amount">Importe</label>
            <input id="payment-amount" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} required autoFocus />
            <small className="agenda-field-hint">Máximo: {formatCurrency(remainingTotal(appointment))}</small>
          </div>
          <div className="agenda-field">
            <label htmlFor="payment-method">Forma de pago</label>
            <select id="payment-method" value={method} onChange={(event) => setMethod(event.target.value as PaymentMethod)}>
              {Object.entries(paymentMethodLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
          <div className="agenda-field">
            <label htmlFor="payment-date">Fecha</label>
            <input id="payment-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
          </div>
        </div>
        <footer>
          <span />
          <div>
            <button type="button" className="agenda-secondary-button" onClick={onClose}>Cancelar</button>
            <button type="submit" className="agenda-primary-button">Guardar pago</button>
          </div>
        </footer>
      </form>
    </dialog>
  );
}

function ExpenseDialog({
  today,
  onClose,
  onSave,
}: {
  today: string;
  onClose: () => void;
  onSave: (expense: ExpenseDraft) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState<ExpenseDraft>({ ...emptyExpenseDraft, date: today });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog ref={dialogRef} className="agenda-dialog agenda-small-dialog" onCancel={onClose}>
      <form
        className="agenda-appointment-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (!draft.amount) return;
          onSave(draft);
        }}
      >
        <header>
          <div>
            <p>Control financiero</p>
            <h2>Nueva salida</h2>
          </div>
          <button type="button" className="agenda-icon-button" onClick={onClose}>Cerrar</button>
        </header>
        <div className="agenda-form-grid">
          <div className="agenda-field">
            <label htmlFor="expense-description">Descripción</label>
            <input
              id="expense-description"
              value={draft.description}
              onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
              placeholder="Ej. Champú y acondicionador"
              required
              autoFocus
            />
          </div>
          <div className="agenda-field">
            <label htmlFor="expense-category">Categoría</label>
            <select
              id="expense-category"
              value={draft.category}
              onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value as Expense["category"] }))}
            >
              {(["Productos", "Alquiler", "Suministros", "Equipamiento", "Otros"] as Expense["category"][]).map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </div>
          <div className="agenda-field">
            <label htmlFor="expense-amount">Importe</label>
            <input
              id="expense-amount"
              type="number"
              min="0.01"
              step="0.01"
              value={draft.amount || ""}
              onChange={(event) => setDraft((current) => ({ ...current, amount: Number(event.target.value) }))}
              required
            />
          </div>
          <div className="agenda-field">
            <label htmlFor="expense-date">Fecha</label>
            <input id="expense-date" type="date" value={draft.date} onChange={(event) => setDraft((current) => ({ ...current, date: event.target.value }))} required />
          </div>
          <div className="agenda-field">
            <label htmlFor="expense-status">Estado</label>
            <select id="expense-status" value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value as ExpenseStatus }))}>
              <option value="paid">Pagada</option>
              <option value="planned">Prevista</option>
            </select>
          </div>
        </div>
        <footer>
          <span />
          <div>
            <button type="button" className="agenda-secondary-button" onClick={onClose}>Cancelar</button>
            <button type="submit" className="agenda-primary-button">Guardar salida</button>
          </div>
        </footer>
      </form>
    </dialog>
  );
}

export default function AgendaApp() {
  const usesSupabase = isSupabaseConfigured();
  const today = useMemo(() => dateToKey(new Date()), []);
  const [selectedDate, setSelectedDate] = useState(today);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [theme, setTheme] = useState<AgendaTheme>("dark");
  const [isThemeReady, setIsThemeReady] = useState(false);
  const [view, setView] = useState<View>("home");
  const [dialogState, setDialogState] = useState<Appointment | AppointmentDraft | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [paymentAppointment, setPaymentAppointment] = useState<Appointment | null>(null);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [dashboardRange, setDashboardRange] = useState<DashboardRange>("month");
  const [dashboardStatus, setDashboardStatus] = useState<DashboardStatus>("all");
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    queueMicrotask(async () => {
      if (isCancelled) return;
      try {
        if (usesSupabase) {
          const data = await loadAgendaData();
          if (isCancelled) return;
          setAppointments(data.appointments.map(normalizeAppointment));
          setExpenses(data.expenses);
        } else {
          const saved = window.localStorage.getItem(STORAGE_KEY);
          const parsed = saved ? JSON.parse(saved) as Partial<Appointment>[] : [];
          setAppointments(Array.isArray(parsed) ? parsed.map(normalizeAppointment) : []);
          const savedExpenses = window.localStorage.getItem(EXPENSES_STORAGE_KEY);
          const parsedExpenses = savedExpenses ? JSON.parse(savedExpenses) as Expense[] : [];
          setExpenses(Array.isArray(parsedExpenses) ? parsedExpenses : []);
        }
      } catch (error) {
        setAppointments([]);
        setExpenses([]);
        setDataError(error instanceof Error ? error.message : "No se pudieron cargar los datos.");
      } finally {
        if (!isCancelled) setIsReady(true);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [usesSupabase]);

  useEffect(() => {
    if (!isReady || usesSupabase) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));
  }, [appointments, isReady, usesSupabase]);

  useEffect(() => {
    if (!isReady || usesSupabase) return;
    window.localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(expenses));
  }, [expenses, isReady, usesSupabase]);

  useEffect(() => {
    let isCancelled = false;

    queueMicrotask(() => {
      if (isCancelled) return;
      const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme === "light" || savedTheme === "dark") setTheme(savedTheme);
      setIsThemeReady(true);
    });

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isThemeReady) return;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [isThemeReady, theme]);

  const weekStart = startOfWeek(keyToDate(selectedDate));
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const dayAppointments = appointments
    .filter((appointment) => appointment.date === selectedDate)
    .sort((left, right) => left.time.localeCompare(right.time));
  const activeDayAppointments = dayAppointments.filter((appointment) => !isInactiveStatus(appointment.status));
  const totalMinutes = activeDayAppointments.reduce((total, appointment) => total + appointment.duration, 0);
  const totalRevenue = activeDayAppointments.reduce((total, appointment) => total + (Number(appointment.price.replace(",", ".")) || 0), 0);

  const clients = useMemo(() => {
    const byClient = new Map<string, ClientSummary>();
    [...appointments]
      .sort((left, right) => `${right.date}${right.time}`.localeCompare(`${left.date}${left.time}`))
      .forEach((appointment) => {
        const key = clientIdentityKey(appointment);
        const current = byClient.get(key);
        if (!current) {
          byClient.set(key, {
            id: key,
            clientName: appointment.clientName,
            phone: appointment.phone,
            lastAppointment: appointment,
            visits: [appointment],
            pets: new Map([[appointment.petName.toLowerCase(), appointment]]),
          });
        } else {
          current.visits.push(appointment);
          if (!current.pets.has(appointment.petName.toLowerCase())) current.pets.set(appointment.petName.toLowerCase(), appointment);
        }
      });
    return [...byClient.values()];
  }, [appointments]);

  const selectedClient = selectedClientId
    ? clients.find((client) => client.id === selectedClientId) ?? null
    : null;

  const filteredClients = useMemo(() => {
    const query = clientSearch.trim().toLowerCase();
    if (!query) return clients;
    return clients.filter((client) => (
      client.clientName.toLowerCase().includes(query)
      || client.phone.toLowerCase().includes(query)
      || [...client.pets.values()].some((pet) => pet.petName.toLowerCase().includes(query))
    ));
  }, [clientSearch, clients]);

  const dashboardAppointments = useMemo(() => {
    return [...appointments]
      .filter((appointment) => {
        const matchesRange = isDateInRange(appointment.date, dashboardRange, today);
        const matchesStatus = dashboardStatus === "all" || appointment.status === dashboardStatus;
        return matchesRange && matchesStatus;
      })
      .sort((left, right) => `${right.date}${right.time}`.localeCompare(`${left.date}${left.time}`));
  }, [appointments, dashboardRange, dashboardStatus, today]);

  const dashboardSummary = useMemo(() => {
    const active = dashboardAppointments.filter((appointment) => !isInactiveStatus(appointment.status));
    const priced = active.filter((appointment) => parsePrice(appointment.price) > 0);
    const completed = dashboardAppointments.filter((appointment) => appointment.status === "completed");
    const revenueSource = appointments.filter((appointment) => dashboardStatus === "all" || appointment.status === dashboardStatus);
    const revenue = revenueSource.reduce((total, appointment) => (
      total + appointment.payments
        .filter((payment) => isDateInRange(payment.date, dashboardRange, today))
        .reduce((paymentTotal, payment) => paymentTotal + payment.amount, 0)
    ), 0);
    const minutes = active.reduce((total, appointment) => total + appointment.duration, 0);
    const statusCounts = (Object.keys(statusLabels) as AppointmentStatus[]).map((status) => ({
      status,
      count: dashboardAppointments.filter((appointment) => appointment.status === status).length,
    }));
    const serviceMap = new Map<string, { count: number; revenue: number }>();
    active.forEach((appointment) => {
      const current = serviceMap.get(appointment.service) ?? { count: 0, revenue: 0 };
      serviceMap.set(appointment.service, {
        count: current.count + 1,
        revenue: current.revenue + parsePrice(appointment.price),
      });
    });

    return {
      activeCount: active.length,
      completedCount: completed.length,
      cancelledCount: dashboardAppointments.filter((appointment) => isInactiveStatus(appointment.status)).length,
      minutes,
      revenue,
      averageTicket: completed.length ? revenue / completed.length : (priced.length ? revenue / priced.length : 0),
      revenuePerHour: minutes ? revenue / (minutes / 60) : 0,
      statusCounts,
      services: [...serviceMap.entries()]
        .map(([service, values]) => ({ service, ...values }))
        .sort((left, right) => right.count - left.count),
    };
  }, [appointments, dashboardAppointments, dashboardRange, dashboardStatus, today]);

  const todayAppointments = useMemo(() => appointments
    .filter((appointment) => appointment.date === today)
    .sort((left, right) => left.time.localeCompare(right.time)), [appointments, today]);

  const todayActiveAppointments = todayAppointments.filter((appointment) => !isInactiveStatus(appointment.status));
  const todayPayments = appointments.flatMap((appointment) => appointment.payments).filter((payment) => payment.date === today);
  const receivedToday = todayPayments.reduce((total, payment) => total + payment.amount, 0);
  const pendingToday = todayActiveAppointments.reduce((total, appointment) => total + remainingTotal(appointment), 0);
  const todayMinutes = todayActiveAppointments.reduce((total, appointment) => total + appointment.duration, 0);
  const nextAppointment = todayActiveAppointments.find((appointment) => (
    appointment.status !== "completed" && appointment.status !== "ready"
  )) ?? todayActiveAppointments[0];
  const pendingConfirmations = appointments.filter((appointment) => appointment.date >= today && appointment.status === "pending");
  const unpaidAppointments = appointments.filter((appointment) => (
    (appointment.status === "completed" || appointment.status === "ready")
    && remainingTotal(appointment) > 0
    && parsePrice(appointment.price) > 0
  ));

  const financeAppointments = useMemo(() => appointments.filter((appointment) => (
    isDateInRange(appointment.date, dashboardRange, today)
  )), [appointments, dashboardRange, today]);

  const financeExpenses = useMemo(() => expenses
    .filter((expense) => isDateInRange(expense.date, dashboardRange, today))
    .sort((left, right) => right.date.localeCompare(left.date)), [dashboardRange, expenses, today]);

  const financeSummary = useMemo(() => {
    const payments = appointments.flatMap((appointment) => appointment.payments)
      .filter((payment) => isDateInRange(payment.date, dashboardRange, today));
    const received = payments.reduce((total, payment) => total + payment.amount, 0);
    const planned = financeAppointments
      .filter((appointment) => !isInactiveStatus(appointment.status))
      .reduce((total, appointment) => total + parsePrice(appointment.price), 0);
    const outstanding = financeAppointments
      .filter((appointment) => !isInactiveStatus(appointment.status))
      .reduce((total, appointment) => total + remainingTotal(appointment), 0);
    const paidExpenses = financeExpenses
      .filter((expense) => expense.status === "paid")
      .reduce((total, expense) => total + expense.amount, 0);
    const plannedExpenses = financeExpenses
      .filter((expense) => expense.status === "planned")
      .reduce((total, expense) => total + expense.amount, 0);
    return { received, planned, outstanding, paidExpenses, plannedExpenses, balance: received - paidExpenses };
  }, [appointments, dashboardRange, financeAppointments, financeExpenses, today]);

  function openNewAppointment(date = selectedDate) {
    setDialogState({ ...emptyDraft, date });
  }

  function navigateTo(nextView: View) {
    setView(nextView);
    const root = document.documentElement;
    const previousBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
    window.requestAnimationFrame(() => {
      root.style.scrollBehavior = previousBehavior;
    });
  }

  async function saveAppointment(draft: AppointmentDraft) {
    const draftInterval = appointmentInterval(draft);
    const editingId = dialogState && "id" in dialogState ? dialogState.id : null;
    const conflict = appointments.find((appointment) => {
      if (appointment.id === editingId || appointment.date !== draft.date || isInactiveStatus(appointment.status)) return false;
      const interval = appointmentInterval(appointment);
      return draftInterval.start < interval.end && draftInterval.end > interval.start;
    });
    if (conflict && !window.confirm(`Este horario se cruza con la cita de ${conflict.petName} (${conflict.time}–${calculateEndTime(conflict.time, conflict.duration)}). ¿Guardar igualmente?`)) return;

    try {
      setDataError(null);
      if (dialogState && "id" in dialogState) {
        const appointmentId = dialogState.id;
        if (usesSupabase) await persistAppointment(draft, appointmentId);
        setAppointments((current) => current.map((appointment) => appointment.id === appointmentId
          ? { ...draft, id: appointmentId, payments: appointment.payments }
          : appointment));
      } else {
        const appointmentId = usesSupabase ? await persistAppointment(draft) : createId();
        setAppointments((current) => [...current, { ...draft, id: appointmentId, payments: [] }]);
      }
      setSelectedDate(draft.date);
      setDialogState(null);
    } catch (error) {
      setDataError(error instanceof Error ? error.message : "No se pudo guardar la cita.");
    }
  }

  async function advanceAppointment(appointment: Appointment) {
    const followingStatus = nextStatus(appointment.status);
    if (!followingStatus) return;
    try {
      setDataError(null);
      if (usesSupabase) await persistAppointmentStatus(appointment.id, followingStatus);
      const updated = { ...appointment, status: followingStatus };
      setAppointments((current) => current.map((item) => item.id === appointment.id ? updated : item));
      if (selectedAppointment?.id === appointment.id) setSelectedAppointment(updated);
    } catch (error) {
      setDataError(error instanceof Error ? error.message : "No se pudo actualizar la cita.");
    }
  }

  async function savePayment(payment: Omit<Payment, "id">) {
    if (!paymentAppointment) return;
    try {
      setDataError(null);
      const paymentId = usesSupabase
        ? await persistPayment(paymentAppointment.id, payment)
        : createId();
      const nextPayment = { ...payment, id: paymentId };
      const updated = { ...paymentAppointment, payments: [...paymentAppointment.payments, nextPayment] };
      setAppointments((current) => current.map((appointment) => appointment.id === paymentAppointment.id ? updated : appointment));
      if (selectedAppointment?.id === paymentAppointment.id) setSelectedAppointment(updated);
      setPaymentAppointment(null);
    } catch (error) {
      setDataError(error instanceof Error ? error.message : "No se pudo guardar el pago.");
    }
  }

  async function saveExpense(expense: ExpenseDraft) {
    try {
      setDataError(null);
      const expenseId = usesSupabase ? await persistExpense(expense) : createId();
      setExpenses((current) => [{ ...expense, id: expenseId }, ...current]);
      setIsExpenseDialogOpen(false);
    } catch (error) {
      setDataError(error instanceof Error ? error.message : "No se pudo guardar la salida.");
    }
  }

  async function toggleExpenseStatus(expense: Expense) {
    const status = expense.status === "paid" ? "planned" : "paid";
    try {
      setDataError(null);
      if (usesSupabase) await persistExpenseStatus(expense.id, status);
      setExpenses((current) => current.map((item) => item.id === expense.id ? { ...item, status } : item));
    } catch (error) {
      setDataError(error instanceof Error ? error.message : "No se pudo actualizar la salida.");
    }
  }

  async function deleteExpense(expense: Expense) {
    if (!window.confirm(`¿Eliminar la salida “${expense.description}”?`)) return;
    try {
      setDataError(null);
      if (usesSupabase) await removeExpense(expense.id);
      setExpenses((current) => current.filter((item) => item.id !== expense.id));
    } catch (error) {
      setDataError(error instanceof Error ? error.message : "No se pudo eliminar la salida.");
    }
  }

  async function deletePayment(appointment: Appointment, paymentId: string) {
    if (!window.confirm("¿Eliminar este pago? El saldo pendiente se actualizará automáticamente.")) return;
    try {
      setDataError(null);
      if (usesSupabase) await removePayment(paymentId);
      const updated = { ...appointment, payments: appointment.payments.filter((payment) => payment.id !== paymentId) };
      setAppointments((current) => current.map((item) => item.id === appointment.id ? updated : item));
      setSelectedAppointment(updated);
    } catch (error) {
      setDataError(error instanceof Error ? error.message : "No se pudo eliminar el pago.");
    }
  }

  function repeatAppointment(appointment: Appointment) {
    const { id: _id, payments: _payments, ...draft } = appointment;
    void _id;
    void _payments;
    setSelectedDate(today);
    setView("agenda");
    setDialogState({ ...draft, date: today, status: "confirmed" });
  }

  async function deleteAppointment() {
    if (!dialogState || !("id" in dialogState)) return;
    if (!window.confirm("¿Eliminar esta cita? Esta acción no se puede deshacer.")) return;
    try {
      setDataError(null);
      if (usesSupabase) await removeAppointment(dialogState.id);
      setAppointments((current) => current.filter((appointment) => appointment.id !== dialogState.id));
      setDialogState(null);
    } catch (error) {
      setDataError(error instanceof Error ? error.message : "No se pudo eliminar la cita.");
    }
  }

  return (
    <main id="main-content" className="agenda-page" data-theme={theme}>
      <header className="agenda-topbar">
        <div className="agenda-topbar-inner">
          <Link href="/" className="agenda-wordmark" aria-label="Ir al sitio de Dayana Peluquería">
            <span>Dayana</span>
            <small>Gestión privada</small>
          </Link>
          <nav className="agenda-tabs" data-active={view} aria-label="Secciones de la agenda">
            <button aria-current={view === "home" ? "page" : undefined} className={view === "home" ? "is-active" : ""} onClick={() => navigateTo("home")}>Inicio</button>
            <button aria-current={view === "agenda" ? "page" : undefined} className={view === "agenda" ? "is-active" : ""} onClick={() => navigateTo("agenda")}>Agenda</button>
            <button aria-current={view === "clients" ? "page" : undefined} className={view === "clients" ? "is-active" : ""} onClick={() => navigateTo("clients")}>Clientes</button>
            <button aria-current={view === "finance" ? "page" : undefined} className={view === "finance" ? "is-active" : ""} onClick={() => navigateTo("finance")}>Finanzas</button>
            <button aria-current={view === "reports" ? "page" : undefined} className={view === "reports" ? "is-active" : ""} onClick={() => navigateTo("reports")}>Informes</button>
          </nav>
          <div className="agenda-topbar-actions">
            <button
              type="button"
              className="agenda-theme-toggle"
              aria-label={`Cambiar al modo ${theme === "dark" ? "claro" : "oscuro"}`}
              aria-pressed={theme === "dark"}
              title={`Cambiar al modo ${theme === "dark" ? "claro" : "oscuro"}`}
              onClick={() => setTheme((current) => current === "dark" ? "light" : "dark")}
            >
              <span className="agenda-theme-track" aria-hidden="true"><span /></span>
              <span>{theme === "dark" ? "Claro" : "Oscuro"}</span>
            </button>
            <form action={logoutAgenda}>
              <button type="submit" className="agenda-logout">Salir</button>
            </form>
          </div>
        </div>
      </header>

      <div className="agenda-container">
        {dataError ? (
          <div className="agenda-data-error" role="alert">
            <span>{dataError}</span>
            <button type="button" onClick={() => setDataError(null)} aria-label="Cerrar aviso">Cerrar</button>
          </div>
        ) : null}
        {view === "home" ? (
          <section className="agenda-home">
            <div className="agenda-heading agenda-home-heading">
              <div>
                <p>Tu jornada de un vistazo</p>
                <h1>Hola, Dayana</h1>
                <span>{formatLongDate(today)}</span>
              </div>
              <div className="agenda-heading-actions">
                <button className="agenda-secondary-button" onClick={() => { setView("finance"); setIsExpenseDialogOpen(true); }}>Nueva salida</button>
                <button className="agenda-primary-button" onClick={() => openNewAppointment(today)}>Nueva cita</button>
              </div>
            </div>

            <div className="agenda-metric-grid agenda-home-metrics" role="region" aria-label="Resumen de hoy">
              <article>
                <span>Citas de hoy</span>
                <strong>{todayActiveAppointments.length}</strong>
                <small>{todayActiveAppointments.length ? `${minutesToLabel(todayMinutes)} reservados` : "Día disponible"}</small>
              </article>
              <article>
                <span>Recibido hoy</span>
                <strong>{formatCurrency(receivedToday)}</strong>
                <small>{todayPayments.length} movimiento{todayPayments.length === 1 ? "" : "s"}</small>
              </article>
              <article>
                <span>Pendiente de cobro</span>
                <strong>{formatCurrency(pendingToday)}</strong>
                <small>De las citas de hoy</small>
              </article>
              <article className="agenda-next-metric">
                <span>Próxima atención</span>
                <strong>{nextAppointment ? nextAppointment.time : "—"}</strong>
                <small>{nextAppointment ? `${nextAppointment.petName} · ${nextAppointment.service}` : "Sin citas pendientes"}</small>
              </article>
            </div>

            <div className="agenda-home-grid">
              <section className="agenda-dashboard-panel agenda-home-schedule" aria-labelledby="home-schedule-title">
                <header>
                  <div>
                    <p>Agenda de hoy</p>
                    <h2 id="home-schedule-title">El día, en orden</h2>
                  </div>
                  <button className="agenda-text-button" onClick={() => { setSelectedDate(today); setView("agenda"); }}>Ver agenda</button>
                </header>
                {todayAppointments.length ? (
                  <div className="agenda-home-list">
                    {todayAppointments.map((appointment) => {
                      const action = nextStatusAction(appointment.status);
                      return (
                        <article key={appointment.id} className={`agenda-home-appointment status-${appointment.status}`}>
                          <button type="button" onClick={() => setSelectedAppointment(appointment)}>
                            <time>{appointment.time}</time>
                            <span>
                              <strong>{appointment.petName}</strong>
                              <small>{appointment.clientName} · {appointment.service}</small>
                            </span>
                            <span className="agenda-status-label">{statusLabels[appointment.status]}</span>
                          </button>
                          {action ? (
                            <button type="button" className="agenda-row-action" onClick={() => advanceAppointment(appointment)}>{action}</button>
                          ) : null}
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="agenda-dashboard-empty agenda-dashboard-empty-large">
                    <strong>No hay citas para hoy.</strong>
                    <span>Puedes reservar un horario desde aquí cuando llegue un mensaje por WhatsApp.</span>
                    <button className="agenda-secondary-button" onClick={() => openNewAppointment(today)}>Crear una cita</button>
                  </div>
                )}
              </section>

              <aside className="agenda-dashboard-panel agenda-attention-panel" aria-labelledby="attention-title">
                <header>
                  <div>
                    <p>Pendientes</p>
                    <h2 id="attention-title">Necesitan tu atención</h2>
                  </div>
                  <strong>{pendingConfirmations.length + unpaidAppointments.length}</strong>
                </header>
                <div className="agenda-attention-list">
                  {pendingConfirmations.slice(0, 3).map((appointment) => (
                    <button key={appointment.id} type="button" onClick={() => setSelectedAppointment(appointment)}>
                      <span>Confirmar cita</span>
                      <strong>{appointment.petName}</strong>
                      <small>{formatShortDate(appointment.date)} · {appointment.time}</small>
                    </button>
                  ))}
                  {unpaidAppointments.slice(0, 3).map((appointment) => (
                    <button key={appointment.id} type="button" onClick={() => setPaymentAppointment(appointment)}>
                      <span>Cobro pendiente</span>
                      <strong>{appointment.petName}</strong>
                      <small>{formatCurrency(remainingTotal(appointment))} por cobrar</small>
                    </button>
                  ))}
                  {!pendingConfirmations.length && !unpaidAppointments.length ? (
                    <div className="agenda-attention-clear">
                      <strong>Todo al día</strong>
                      <span>No hay confirmaciones ni cobros pendientes.</span>
                    </div>
                  ) : null}
                </div>
              </aside>
            </div>
          </section>
        ) : view === "agenda" ? (
          <>
            <section className="agenda-heading">
              <div>
                <p>Organización diaria</p>
                <h1>Agenda</h1>
                <span>{formatLongDate(selectedDate)}</span>
              </div>
              <button className="agenda-primary-button" onClick={() => openNewAppointment()}>Nueva cita</button>
            </section>

            <section className="agenda-week" aria-label="Semana seleccionada">
              <div className="agenda-week-controls">
                <button aria-label="Semana anterior" onClick={() => setSelectedDate(dateToKey(addDays(weekStart, -7)))}>Anterior</button>
                <button onClick={() => setSelectedDate(today)}>Hoy</button>
                <button aria-label="Semana siguiente" onClick={() => setSelectedDate(dateToKey(addDays(weekStart, 7)))}>Siguiente</button>
              </div>
              <div className="agenda-week-days">
                {weekDays.map((date) => {
                  const key = dateToKey(date);
                  const count = appointments.filter((appointment) => appointment.date === key && !isInactiveStatus(appointment.status)).length;
                  return (
                    <button key={key} className={key === selectedDate ? "is-active" : ""} onClick={() => setSelectedDate(key)} aria-pressed={key === selectedDate}>
                      <span>{new Intl.DateTimeFormat("es-ES", { weekday: "short" }).format(date)}</span>
                      <strong>{date.getDate()}</strong>
                      <small>{count ? `${count} cita${count > 1 ? "s" : ""}` : "Libre"}</small>
                    </button>
                  );
                })}
              </div>
            </section>

            <div className="agenda-content-grid">
              <section className="agenda-day-panel" aria-labelledby="day-title">
                <header>
                  <div>
                    <h2 id="day-title">{formatLongDate(selectedDate)}</h2>
                    <p>{dayAppointments.length ? `${dayAppointments.length} cita${dayAppointments.length > 1 ? "s" : ""}` : "Día disponible"}</p>
                  </div>
                </header>

                {!isReady ? (
                  <div className="agenda-loading" aria-label="Cargando agenda"><span /><span /><span /></div>
                ) : dayAppointments.length ? (
                  <div className="agenda-appointment-list">
                    {dayAppointments.map((appointment) => (
                      <article key={appointment.id} className={`agenda-appointment status-${appointment.status}`}>
                        <button
                          type="button"
                          className="agenda-appointment-view"
                          onClick={() => setSelectedAppointment(appointment)}
                          aria-label={`Ver detalles de la cita de ${appointment.petName}`}
                        >
                          <div
                            className="agenda-appointment-time"
                            aria-label={`De ${appointment.time} a ${calculateEndTime(appointment.time, appointment.duration)}`}
                          >
                            <time dateTime={`${appointment.date}T${appointment.time}`}>{appointment.time}</time>
                            <span aria-hidden="true">-</span>
                            <time>{calculateEndTime(appointment.time, appointment.duration)}</time>
                          </div>
                          <div className="agenda-appointment-main">
                            <div>
                              <h3>{appointment.petName}</h3>
                              <span>{appointment.clientName}</span>
                            </div>
                            <p>{appointment.service}</p>
                            <small>{appointment.breed || appointment.species} | {appointment.size} | {minutesToLabel(appointment.duration)}</small>
                          </div>
                        </button>
                        <div className="agenda-appointment-actions">
                          <span className="agenda-status-label">{statusLabels[appointment.status]}</span>
                          <span className={`agenda-payment-label is-${paymentState(appointment)}`}>{paymentStateLabel(appointment)}</span>
                          <button type="button" className="agenda-edit-button" onClick={() => setDialogState(appointment)}>
                            Editar
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="agenda-empty-state">
                    <p>Este día todavía está libre.</p>
                    <span>Añade una cita cuando confirmes el horario por WhatsApp.</span>
                    <button className="agenda-secondary-button" onClick={() => openNewAppointment()}>Añadir la primera cita</button>
                  </div>
                )}
              </section>

              <aside className="agenda-summary" aria-label="Resumen del día">
                <h2>Resumen del día</h2>
                <dl>
                  <div><dt>Citas activas</dt><dd>{activeDayAppointments.length}</dd></div>
                  <div><dt>Tiempo previsto</dt><dd>{minutesToLabel(totalMinutes)}</dd></div>
                  <div><dt>Ingresos previstos</dt><dd>{totalRevenue ? `${totalRevenue.toFixed(2).replace(".", ",")} €` : "Sin indicar"}</dd></div>
                </dl>
                <p>La duración siempre la decides tú según el tamaño, el pelo y las necesidades de cada mascota.</p>
              </aside>
            </div>
          </>
        ) : view === "finance" ? (
          <section className="agenda-finance">
            <div className="agenda-heading agenda-dashboard-heading">
              <div>
                <p>Control de caja</p>
                <h1>Finanzas</h1>
                <span>Distingue lo previsto, lo cobrado y lo que queda por pagar.</span>
              </div>
              <div className="agenda-heading-actions agenda-finance-actions">
                <label className="agenda-inline-filter">
                  <span>Período</span>
                  <select value={dashboardRange} onChange={(event) => setDashboardRange(event.target.value as DashboardRange)}>
                    <option value="month">Este mes</option>
                    <option value="30days">Últimos 30 días</option>
                    <option value="all">Todo el historial</option>
                  </select>
                </label>
                <button className="agenda-primary-button" onClick={() => setIsExpenseDialogOpen(true)}>Nueva salida</button>
              </div>
            </div>

            <div className="agenda-metric-grid agenda-finance-metrics" role="region" aria-label="Indicadores financieros">
              <article>
                <span>Ingresos recibidos</span>
                <strong>{formatCurrency(financeSummary.received)}</strong>
                <small>Pagos registrados en el período</small>
              </article>
              <article>
                <span>Por cobrar</span>
                <strong>{formatCurrency(financeSummary.outstanding)}</strong>
                <small>Saldo de servicios activos</small>
              </article>
              <article>
                <span>Salidas pagadas</span>
                <strong>{formatCurrency(financeSummary.paidExpenses)}</strong>
                <small>{financeSummary.plannedExpenses ? `${formatCurrency(financeSummary.plannedExpenses)} previstas` : "Sin salidas previstas"}</small>
              </article>
              <article className={financeSummary.balance < 0 ? "is-negative" : "is-positive"}>
                <span>Saldo de caja</span>
                <strong>{formatCurrency(financeSummary.balance)}</strong>
                <small>Ingresos recibidos menos salidas pagadas</small>
              </article>
            </div>

            <div className="agenda-finance-grid">
              <section className="agenda-dashboard-panel" aria-labelledby="outstanding-title">
                <header>
                  <div>
                    <p>Seguimiento</p>
                    <h2 id="outstanding-title">Cobros pendientes</h2>
                  </div>
                  <strong>{financeAppointments.filter((appointment) => remainingTotal(appointment) > 0 && parsePrice(appointment.price) > 0 && !isInactiveStatus(appointment.status)).length}</strong>
                </header>
                <div className="agenda-finance-list">
                  {financeAppointments
                    .filter((appointment) => remainingTotal(appointment) > 0 && parsePrice(appointment.price) > 0 && !isInactiveStatus(appointment.status))
                    .sort((left, right) => right.date.localeCompare(left.date))
                    .map((appointment) => (
                      <article key={appointment.id}>
                        <button type="button" onClick={() => setSelectedAppointment(appointment)}>
                          <span><strong>{appointment.petName}</strong><small>{appointment.clientName} · {formatShortDate(appointment.date)}</small></span>
                          <span className="agenda-finance-amount"><strong>{formatCurrency(remainingTotal(appointment))}</strong><small>{paymentStateLabel(appointment)}</small></span>
                        </button>
                        <button type="button" className="agenda-row-action" onClick={() => setPaymentAppointment(appointment)}>Registrar pago</button>
                      </article>
                    ))}
                  {!financeAppointments.some((appointment) => remainingTotal(appointment) > 0 && parsePrice(appointment.price) > 0 && !isInactiveStatus(appointment.status)) ? (
                    <p className="agenda-dashboard-empty">No hay cobros pendientes en este período.</p>
                  ) : null}
                </div>
              </section>

              <section className="agenda-dashboard-panel" aria-labelledby="expenses-title">
                <header>
                  <div>
                    <p>Gastos del negocio</p>
                    <h2 id="expenses-title">Salidas</h2>
                  </div>
                  <strong>{financeExpenses.length}</strong>
                </header>
                <div className="agenda-expense-list">
                  {financeExpenses.map((expense) => (
                    <article key={expense.id}>
                      <span><strong>{expense.description}</strong><small>{expense.category} · {formatShortDate(expense.date)}</small></span>
                      <span className="agenda-finance-amount"><strong>{formatCurrency(expense.amount)}</strong><small>{expense.status === "paid" ? "Pagada" : "Prevista"}</small></span>
                      <span className="agenda-expense-actions">
                        <button type="button" className="agenda-edit-button" onClick={() => toggleExpenseStatus(expense)}>
                          {expense.status === "paid" ? "Marcar prevista" : "Marcar pagada"}
                        </button>
                        <button type="button" className="agenda-link-danger" onClick={() => deleteExpense(expense)}>Eliminar</button>
                      </span>
                    </article>
                  ))}
                  {!financeExpenses.length ? <p className="agenda-dashboard-empty">Todavía no hay salidas registradas.</p> : null}
                </div>
              </section>
            </div>

            <section className="agenda-dashboard-panel agenda-cash-explanation" aria-label="Cómo se calculan las finanzas">
              <div>
                <span>Servicios previstos</span>
                <strong>{formatCurrency(financeSummary.planned)}</strong>
              </div>
              <p>El saldo de caja solo utiliza pagos realmente registrados. Los precios de las citas aparecen como previstos hasta que añadas el pago.</p>
            </section>
          </section>
        ) : view === "reports" ? (
          <section className="agenda-dashboard">
            <div className="agenda-heading agenda-dashboard-heading">
              <div>
                <p>Rendimiento del negocio</p>
                <h1>Informes</h1>
                <span>Entiende qué servicios funcionan mejor y cómo evoluciona tu trabajo.</span>
              </div>
              <div className="agenda-dashboard-filters" role="group" aria-label="Filtros del resumen">
                <label>
                  <span>Período</span>
                  <select value={dashboardRange} onChange={(event) => setDashboardRange(event.target.value as DashboardRange)}>
                    <option value="month">Este mes</option>
                    <option value="30days">Últimos 30 días</option>
                    <option value="all">Todo el historial</option>
                  </select>
                </label>
                <label>
                  <span>Estado</span>
                  <select value={dashboardStatus} onChange={(event) => setDashboardStatus(event.target.value as DashboardStatus)}>
                    <option value="all">Todos los estados</option>
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div className="agenda-metric-grid" role="region" aria-label="Indicadores generales">
              <article>
                <span>Atenciones finalizadas</span>
                <strong>{dashboardSummary.completedCount}</strong>
                <small>{dashboardSummary.cancelledCount} cancelada{dashboardSummary.cancelledCount === 1 ? "" : "s"} o ausente{dashboardSummary.cancelledCount === 1 ? "" : "s"}</small>
              </article>
              <article>
                <span>Tiempo reservado</span>
                <strong>{minutesToLabel(dashboardSummary.minutes)}</strong>
                <small>Carga prevista del período</small>
              </article>
              <article>
                <span>Ingresos recibidos</span>
                <strong>{formatCurrency(dashboardSummary.revenue)}</strong>
                <small>Pagos registrados en el período</small>
              </article>
              <article>
                <span>Ingreso por hora</span>
                <strong>{formatCurrency(dashboardSummary.revenuePerHour)}</strong>
                <small>Ingresos frente al tiempo reservado</small>
              </article>
            </div>

            <div className="agenda-dashboard-grid">
              <section className="agenda-dashboard-panel" aria-labelledby="status-summary-title">
                <header>
                  <div>
                    <p>Distribución</p>
                    <h2 id="status-summary-title">Atenciones por estado</h2>
                  </div>
                  <strong>{dashboardAppointments.length}</strong>
                </header>
                <div className="agenda-status-summary">
                  {dashboardSummary.statusCounts.map(({ status, count }) => (
                    <div key={status}>
                      <div>
                        <span>{statusLabels[status]}</span>
                        <strong>{count}</strong>
                      </div>
                      <progress value={count} max={Math.max(dashboardAppointments.length, 1)} aria-label={`${statusLabels[status]}: ${count}`} />
                    </div>
                  ))}
                </div>
              </section>

              <section className="agenda-dashboard-panel" aria-labelledby="services-summary-title">
                <header>
                  <div>
                    <p>Demanda</p>
                    <h2 id="services-summary-title">Servicios</h2>
                  </div>
                </header>
                {dashboardSummary.services.length ? (
                  <div className="agenda-service-summary">
                    {dashboardSummary.services.map((service) => (
                      <div key={service.service}>
                        <div>
                          <strong>{service.service}</strong>
                          <span>{service.count} cita{service.count === 1 ? "" : "s"}</span>
                        </div>
                        <strong>{formatCurrency(service.revenue)}</strong>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="agenda-dashboard-empty">No hay servicios en este período.</p>
                )}
              </section>
            </div>

            <section className="agenda-dashboard-panel agenda-dashboard-history" aria-labelledby="dashboard-history-title">
              <header>
                <div>
                  <p>Historial filtrado</p>
                  <h2 id="dashboard-history-title">Citas del período</h2>
                </div>
                <span>{dashboardAppointments.length} resultado{dashboardAppointments.length === 1 ? "" : "s"}</span>
              </header>
              {dashboardAppointments.length ? (
                <div className="agenda-dashboard-list">
                  {dashboardAppointments.map((appointment) => (
                    <button
                      type="button"
                      key={appointment.id}
                      className="agenda-dashboard-row"
                      onClick={() => setSelectedAppointment(appointment)}
                      aria-label={`Ver detalles de la cita de ${appointment.petName}`}
                    >
                      <time dateTime={`${appointment.date}T${appointment.time}`}>
                        <strong>{formatShortDate(appointment.date)}</strong>
                        <span>{appointment.time} – {calculateEndTime(appointment.time, appointment.duration)}</span>
                      </time>
                      <span>
                        <strong>{appointment.petName}</strong>
                        <small>{appointment.clientName}</small>
                      </span>
                      <span>
                        <strong>{appointment.service}</strong>
                        <small>{appointment.breed || appointment.species} · {appointment.size}</small>
                      </span>
                      <span className="agenda-dashboard-row-end">
                        <strong>{parsePrice(appointment.price) ? formatCurrency(parsePrice(appointment.price)) : "—"}</strong>
                        <small>{statusLabels[appointment.status]}</small>
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="agenda-dashboard-empty agenda-dashboard-empty-large">
                  <strong>No hay citas con estos filtros.</strong>
                  <span>Prueba otro período o estado para ver más resultados.</span>
                </div>
              )}
            </section>
          </section>
        ) : (
          <section className="agenda-clients">
            <div className="agenda-heading">
              <div>
                <p>Clientes y mascotas</p>
                <h1>Clientes</h1>
                <span>{clients.length} cliente{clients.length === 1 ? "" : "s"} · {clients.reduce((total, client) => total + client.pets.size, 0)} mascota{clients.reduce((total, client) => total + client.pets.size, 0) === 1 ? "" : "s"}</span>
              </div>
              <button className="agenda-primary-button" onClick={() => { setView("agenda"); openNewAppointment(); }}>Nueva cita</button>
            </div>

            <div className="agenda-client-toolbar">
              <label htmlFor="client-search">Buscar cliente, mascota o teléfono</label>
              <input
                id="client-search"
                type="search"
                value={clientSearch}
                onChange={(event) => setClientSearch(event.target.value)}
                placeholder="Ej. Luna, María o +34..."
              />
            </div>

            {filteredClients.length ? (
              <div className="agenda-client-list">
                {filteredClients.map((client) => (
                    <article key={client.id} className="agenda-client-row agenda-client-profile">
                      <button
                        type="button"
                        className="agenda-client-card-target"
                        onClick={() => setSelectedClientId(client.id)}
                        aria-label={`Abrir ficha de ${client.clientName}`}
                      />
                      <div>
                        <h2>{client.clientName}</h2>
                        {client.phone ? <a href={`tel:${client.phone.replace(/\s/g, "")}`}>{client.phone}</a> : <span>Sin teléfono</span>}
                      </div>
                      <div className="agenda-client-pets">
                        {[...client.pets.values()].map((pet) => (
                          <span key={pet.petName.toLowerCase()}>
                            <strong>{pet.petName}</strong>
                            <small>{pet.breed || pet.species} · {pet.size}</small>
                          </span>
                        ))}
                      </div>
                      <div>
                        <span>Última cita</span>
                        <strong>{formatShortDate(client.lastAppointment.date)}</strong>
                      </div>
                      <div>
                        <span>Visitas</span>
                        <strong>{client.visits.length}</strong>
                      </div>
                      <button type="button" className="agenda-edit-button" onClick={() => repeatAppointment(client.lastAppointment)}>Agendar de nuevo</button>
                    </article>
                  ))}
              </div>
            ) : (
              <div className="agenda-empty-state agenda-empty-clients">
                <p>{clients.length ? "No encontramos resultados." : "Los clientes aparecerán aquí."}</p>
                <span>{clients.length ? "Prueba con otro nombre, mascota o teléfono." : "Se crea su historial automáticamente al guardar la primera cita."}</span>
                <button className="agenda-secondary-button" onClick={() => { setView("agenda"); openNewAppointment(); }}>Crear una cita</button>
              </div>
            )}
          </section>
        )}
      </div>

      {view === "agenda" ? <button className="agenda-mobile-new" onClick={() => openNewAppointment()}>Nueva cita</button> : null}

      {selectedClient ? (
        <ClientProfileDialog
          client={selectedClient}
          onClose={() => setSelectedClientId(null)}
          onRepeat={(appointment) => {
            setSelectedClientId(null);
            repeatAppointment(appointment);
          }}
          onOpenAppointment={(appointment) => {
            setSelectedClientId(null);
            setSelectedAppointment(appointment);
          }}
        />
      ) : null}

      {selectedAppointment ? (
        <AppointmentDetailsDialog
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          onEdit={() => {
            setDialogState(selectedAppointment);
            setSelectedAppointment(null);
          }}
          onPayment={() => {
            setPaymentAppointment(selectedAppointment);
            setSelectedAppointment(null);
          }}
          onAdvance={() => advanceAppointment(selectedAppointment)}
          onDeletePayment={(paymentId) => deletePayment(selectedAppointment, paymentId)}
        />
      ) : null}

      {dialogState ? (
        <AppointmentDialog
          initial={dialogState}
          onClose={() => setDialogState(null)}
          onSave={saveAppointment}
          onDelete={"id" in dialogState ? deleteAppointment : undefined}
        />
      ) : null}

      {paymentAppointment ? (
        <PaymentDialog
          appointment={paymentAppointment}
          today={today}
          onClose={() => setPaymentAppointment(null)}
          onSave={savePayment}
        />
      ) : null}

      {isExpenseDialogOpen ? (
        <ExpenseDialog
          today={today}
          onClose={() => setIsExpenseDialogOpen(false)}
          onSave={saveExpense}
        />
      ) : null}
    </main>
  );
}
