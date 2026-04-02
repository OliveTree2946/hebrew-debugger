/**
 * supabase.ts
 * Supabase 클라이언트 초기화
 * 서버/클라이언트 양쪽에서 사용 가능 (NEXT_PUBLIC_ 키 사용)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl: string = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey: string = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey)
