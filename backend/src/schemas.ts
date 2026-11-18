import { z } from 'zod'

const TONE_MESSAGE =
  'tone は gentle / energetic / polite のいずれかを指定してください'
const TASK_TITLE_MESSAGE = 'taskTitle は 1~100 文字で入力してください'
const PARENT_TITLE_MESSAGE = 'parentTitle は 1~100 文字で入力してください'
const PRAISE_MESSAGE = 'message は 1~200 文字で入力してください'

const SUBTASK_MESSAGE = 'subtasks は 2~5 件で作成してください'
const SUBTASK_TITLE_MESSAGE = 'subtasks[].title が 1~100 文字ではありません'
const SUBTASK_DESC_MESSAGE =
  'subtasks[].description は 0~500 文字ではありません'

// 誉めのスキーマ定義

// 口調のルール（gentle / energetic / polite の3種類しか許さない）
export const toneSchema = z.enum(['gentle', 'energetic', 'polite'], {
  message: TONE_MESSAGE,
})

// 入力値のルール
export const praiseInputSchema = z.object({
  taskTitle: z
    .string(TASK_TITLE_MESSAGE)
    .trim()
    .min(1, TASK_TITLE_MESSAGE)
    .max(100, TASK_TITLE_MESSAGE),

  parentTitle: z
    .string(PARENT_TITLE_MESSAGE)
    .trim()
    .min(1, PARENT_TITLE_MESSAGE)
    .max(100, PARENT_TITLE_MESSAGE)
    .optional(),

  // デフォルトで gentle にする
  tone: toneSchema.default('gentle'),
})

// 返却値のルール
export const praiseOutputSchema = z.object({
  message: z
    .string(PRAISE_MESSAGE)
    .trim()
    .min(1, PRAISE_MESSAGE)
    .max(200, PRAISE_MESSAGE),
})

// タスク分割のスキーマ定義

// TODO: splitInputSchema1

// サブタスク1件分
export const subtaskSchema = z.object({
  title: z
    .string(SUBTASK_TITLE_MESSAGE)
    .trim()
    .min(1, SUBTASK_TITLE_MESSAGE)
    .max(100, SUBTASK_TITLE_MESSAGE),

  description: z
    .string(SUBTASK_DESC_MESSAGE)
    .trim()
    .max(500, SUBTASK_DESC_MESSAGE),
})

export const splitOutputSchema = z.object({
  subtasks: z
    .array(subtaskSchema, SUBTASK_MESSAGE)
    .min(2, SUBTASK_MESSAGE)
    .max(5, SUBTASK_MESSAGE),
})

export type Tone = z.infer<typeof toneSchema>
export type PraiseInput = z.infer<typeof praiseInputSchema>
export type PraiseOutput = z.infer<typeof praiseOutputSchema>

export type Subtask = z.infer<typeof subtaskSchema>
export type SplitOutput = z.infer<typeof splitOutputSchema>
