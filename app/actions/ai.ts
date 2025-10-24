"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

interface Subtask {
  title: string
  description: string
}

export async function generateSubtaskSuggestions(
  taskTitle: string,
  taskDescription: string | null,
  existingKeys?: Subtask[],
  feedback?: string,
) {
  try {
    console.log("[v0] Generating subtasks for:", taskTitle)

    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY environment variable is not set")
    }

    let userPrompt = `Break down this task into 4 actionable subtasks:\n\nTitle: ${taskTitle}\n${taskDescription ? `Description: ${taskDescription}` : ""}`

    if (existingKeys && existingKeys.length > 0) {
      userPrompt += `\n\nPrevious subtasks:\n${existingKeys.map((key, i) => `${i + 1}. ${key.title}: ${key.description}`).join("\n")}`
    }

    if (feedback) {
      userPrompt += `\n\nUser feedback: ${feedback}\n\nPlease regenerate the subtasks taking this feedback into account.`
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that breaks down tasks into actionable subtasks. Generate exactly 4 specific, actionable subtasks that would help achieve the main task. For each subtask, provide a short, concise title (3-8 words) and a detailed description explaining what needs to be done. Return a JSON object with a 'subtasks' key containing an array of 4 objects, each with 'title' and 'description' fields.",
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
        temperature: 0.7,
        response_format: { type: "json_object" },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] OpenAI API error:", response.status, errorText)
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const data = await response.json()
    console.log("[v0] OpenAI response:", JSON.stringify(data, null, 2))

    const content = data.choices[0].message.content
    console.log("[v0] Content:", content)

    let subtasks: Subtask[]
    try {
      const parsed = JSON.parse(content)
      console.log("[v0] Parsed content:", parsed)

      // Handle different possible response formats
      if (Array.isArray(parsed.subtasks)) {
        subtasks = parsed.subtasks
      } else if (Array.isArray(parsed.tasks)) {
        subtasks = parsed.tasks
      } else if (Array.isArray(parsed)) {
        subtasks = parsed
      } else {
        // Try to extract any array from the object
        const values = Object.values(parsed)
        const arrayValue = values.find((v) => Array.isArray(v))
        if (arrayValue && Array.isArray(arrayValue)) {
          subtasks = arrayValue as Subtask[]
        } else {
          throw new Error("Could not find subtasks array in response")
        }
      }
    } catch (parseError) {
      console.error("[v0] Parse error:", parseError)
      throw new Error("Failed to parse AI response")
    }

    console.log("[v0] Extracted subtasks:", subtasks)

    // Ensure we have valid subtasks with title and description
    if (!Array.isArray(subtasks) || subtasks.length === 0) {
      throw new Error("No valid subtasks generated")
    }

    const finalSubtasks = subtasks
      .slice(0, 4)
      .filter((s) => s && typeof s === "object" && typeof s.title === "string" && typeof s.description === "string")
      .map((s) => ({
        title: s.title.trim(),
        description: s.description.trim(),
      }))

    console.log("[v0] Final subtasks:", finalSubtasks)

    if (finalSubtasks.length === 0) {
      throw new Error("No valid subtasks with title and description generated")
    }

    return { success: true, subtasks: finalSubtasks }
  } catch (error) {
    console.error("[v0] Error generating subtasks:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to generate subtasks" }
  }
}

export async function createSubtasks(taskId: number, subtasks: Subtask[]) {
  try {
    const supabase = await createClient()

    // Get the parent task to inherit its properties
    const { data: parentTask, error: fetchError } = await supabase
      .from("tasks")
      .select("column_name, week_start_date")
      .eq("id", taskId)
      .single()

    if (fetchError || !parentTask) {
      throw new Error("Parent task not found")
    }

    // Create subtasks in the database as separate cards
    const createdSubtasks = []
    for (let i = 0; i < subtasks.length; i++) {
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          title: subtasks[i].title,
          description: subtasks[i].description,
          label: "Door",
          column_name: parentTask.column_name,
          position: i + 1000,
          parent_id: taskId,
          week_start_date: parentTask.week_start_date,
        })
        .select()
        .single()

      if (error) throw error
      createdSubtasks.push(data)
    }

    revalidatePath("/")
    return { success: true, subtasks: createdSubtasks }
  } catch (error) {
    console.error("Error creating subtasks:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to create subtasks" }
  }
}

export async function deleteSubtask(subtaskId: number) {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from("tasks").delete().eq("id", subtaskId)

    if (error) throw error

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error deleting subtask:", error)
    return { success: false, error: "Failed to delete subtask" }
  }
}
