import { z } from 'zod'

// 口調のルール（gentle / energetic / polite の3種類しか許さない）
export const toneSchema = z.enum(['gentle', 'energetic', 'polite'], {
  message: 'tone は gentle / energetic / polite のいずれかを指定してください',
})

// 入力値のルール
export const praiseInputSchema = z.object({
  taskTitle: z
    .string()
    .trim()
    .min(1, 'taskTitle は 1~100 文字で入力してください')
    .max(100, 'taskTitle は 1~100 文字で入力してください'),

  parentTitile: z
    .string()
    .trim()
    .min(1, 'parentTitile は 1~100 文字で入力してください')
    .max(100, 'parentTitile は 1~100 文字で入力してください')
    .optional(),

  // デフォルトで gentle にする
  tone: toneSchema.default('gentle'),
})

// 返却値のルール
export const praiseOutputSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, 'message は 1~200 文字で入力してください')
    .max(200, 'message は 1~200 文字で入力してください'),
})

export type Tone = z.infer<typeof toneSchema>
export type PriseInput = z.infer<typeof praiseInputSchema>
export type PriseOutput = z.infer<typeof praiseOutputSchema>
