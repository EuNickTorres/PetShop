// Datos del negocio: editar aquí es el único lugar necesario para
// actualizar teléfono, dirección, horarios y servicios en todo el sitio.

export const siteConfig = {
  name: "Dayana Peluquería",
  // Placeholder hasta que se elija el dominio definitivo (ver PROGRESS.md, pendencia de hosting/Vercel).
  // Actualizar antes de publicar: se usa en metadata (SEO), Open Graph y sitemap/robots.
  siteUrl: "https://www.dayanapeluqueria.es",
  tagline: "Peluquería canina y felina con mucho cariño",
  heroBadge: "Peluquería canina y felina",
  heroHeadingStart: "Tu mascota siempre",
  heroHeadingHighlight: "guapa y feliz",
  heroDescription:
    "Baño, corte y cuidado con productos suaves y mucha paciencia. Tu compañero peludo en las mejores manos.",
  stats: {
    rating: "4.9/5",
    ratingLabel: "Valoración",
    petsAttended: "+500",
    petsAttendedLabel: "Mascotas atendidas",
  },
  whatsappNumber: "34633321181", // formato: código de país + número, sin espacios ni "+"
  phoneDisplay: "+34 633 32 11 81",
  email: "",
  address: {
    // Endereço provisório: substituir pelo endereço real antes de publicar.
    street: "Carrer de la Unió, 12",
    city: "43001 Tarragona, España",
    mapsUrl:
      "https://www.google.com/maps/search/?api=1&query=Carrer%20de%20la%20Uni%C3%B3%2012%2C%2043001%20Tarragona%2C%20Espa%C3%B1a",
  },
  hours: [
    { days: "Lunes a Viernes", time: "9:30 - 13:30 y 16:00 - 20:00" },
    { days: "Sábado", time: "10:00 - 14:00" },
    { days: "Domingo", time: "Cerrado" },
  ],
  social: {
    instagram: "https://www.instagram.com/dayana_peluqueracanina/",
  },
  googleReviews: {
    rating: "5,0",
    countLabel: "Más de 220 reseñas públicas",
    mapsUrl: "https://maps.app.goo.gl/wqTzqJZDeGdFQWwSA?g_st=iw",
  },
};

export const services = [
  {
    icon: "🛁",
    title: "Baño e hidratación",
    description: "Baño completo con productos suaves, secado y cepillado.",
  },
  {
    icon: "✂️",
    title: "Corte y deslanado",
    description: "Corte de raza o a medida, deslanado según el tipo de pelo.",
  },
  {
    icon: "💅",
    title: "Uñas y limpieza de oídos",
    description: "Corte de uñas, limpieza de oídos y ojos.",
  },
  {
    icon: "🐾",
    title: "Spa para mascotas",
    description: "Tratamiento relajante con productos especiales para piel sensible.",
  },
];
