/**
 * app/drill/page.tsx
 * 빈야님 드릴 페이지 — async Server Component
 * drill_questions 테이블 전체를 fetch해 DrillClient에 전달한다.
 */

import { supabase } from '@/lib/supabase'
import type { DrillQuestion } from '@/types/index'
import DrillClient from './_components/DrillClient'

export default async function DrillPage() {
  const { data, error } = await supabase
    .from('drill_questions')
    .select('id, category, verb, root, meaning, correct_answer, options, hint, reference, difficulty')
    .order('category')
    .order('difficulty')
    .order('id')

  const questions: DrillQuestion[] = error || !data ? [] : (data as DrillQuestion[])

  return <DrillClient questions={questions} />
}
