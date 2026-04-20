import { Config } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

export default async function handler() {
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!
  );

  const { error } = await supabase.from("games").select("id").limit(1);

  if (error) {
    console.error("Supabase keep-alive failed:", error.message);
    return new Response("error: " + error.message, { status: 500 });
  }

  console.log("Supabase keep-alive ping successful");
  return new Response("ok", { status: 200 });
}

export const config: Config = {
  schedule: "0 9 * * 1,4",
};
