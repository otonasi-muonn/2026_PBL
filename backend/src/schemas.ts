import { z } from 'zod'

// 誉め
const TASK_TITLE_MESSAGE = 'taskTitle は 1~100 文字で入力してください'
const PARENT_TITLE_MESSAGE = 'parentTitle は 1~100 文字で入力してください'
const PRAISE_MESSAGE = 'message は 1~200 文字で入力してください'

// タスク分割
const SPLIT_TASK_TITLE_MESSAGE = 'title は 1~100 文字で入力してください'
const SUBTASK_MESSAGE = 'subtasks は 2~5 件で作成してください'
const SUBTASK_TITLE_MESSAGE = 'subtasks[].title が 1~100 文字ではありません'

// 誉めのスキーマ定義

// 口調のルール（gentle / energetic / polite の3種類しか許さない）
export const toneSchema = z.enum(['gentle', 'energetic', 'polite'], {
  message: 'tone は gentle / energetic / polite のいずれかを指定してください',
})

// 入力値のルール
export const praiseInputSchema = z.object({
  taskTitle: z
    .string('taskTitle は文字列で入力してください')
    .trim()
    .min(1, TASK_TITLE_MESSAGE)
    .max(100, TASK_TITLE_MESSAGE),

  parentTitle: z
    .string('parentTitle は文字列で入力してください')
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
    .string('message は文字列で入力してください')
    .trim()
    .min(1, PRAISE_MESSAGE)
    .max(200, PRAISE_MESSAGE),
})

// タスク分割のスキーマ定義

export const splitInputSchema = z.object({
  title: z
    .string('title は文字列で入力してください')
    .trim() // 空白だけのタイトルを弾くため
    .min(1, SPLIT_TASK_TITLE_MESSAGE)
    .max(100, SPLIT_TASK_TITLE_MESSAGE),

  description: z
    .string('description は文字列で入力してください')
    .max(500, 'description は 500 文字以内で入力してください')
    .optional(),
})

// サブタスク1件分
export const subtaskSchema = z.object({
  title: z
    .string('subtasks[].title が文字列ではありません')
    .trim()
    .min(1, SUBTASK_TITLE_MESSAGE)
    .max(100, SUBTASK_TITLE_MESSAGE),

  description: z
    .string('subtasks[].description が文字列ではありません')
    .trim()
    .max(500, 'subtasks[].description は 0~500 文字ではありません'),
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
export type SplitInput = z.infer<typeof splitInputSchema>
export type SplitOutput = z.infer<typeof splitOutputSchema>
