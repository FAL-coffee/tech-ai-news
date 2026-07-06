import postgres from "postgres";

export type Db = ReturnType<typeof createDb>;

export function createDb(url: string) {
  // prepare: false は Supabase の transaction pooler (port 6543) と互換性を保つため。
  return postgres(url, { prepare: false, max: 5 });
}

export * from "./queries";
