import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// El Panel Admin no tiene sentido sin Supabase configurado (ej. build local
// sin .env), así que degradamos a `null` en vez de tumbar toda la app.
export const supabase = url && key ? createClient(url, key) : null;
