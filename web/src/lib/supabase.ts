import { createClient } from "@supabase/supabase-js"

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !key) {
  throw new Error(
    "Faltam VITE_SUPABASE_URL ou VITE_SUPABASE_PUBLISHABLE_KEY no arquivo web/.env (veja o .env.example).",
  )
}

export const supabase = createClient(url, key)