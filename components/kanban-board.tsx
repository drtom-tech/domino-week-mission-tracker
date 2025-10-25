"use client"

import type React from "react"
import type { Task } from "@/lib/db-types"
import { KanbanColumn } from "./kanban-column"
import { AddTaskDialog } from "./add-task-dialog"
import { WeekNavigator } from "./week-navigator"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { createPortal } from "react-dom"
import { formatWeekRange, extractDate } from "@/lib/utils"
import {
  DndContext,
  type DragEndEvent,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
  PointerSensor,
} from "@dnd-kit/core"
import { moveTask, copyTaskFromHotList } from "@/app/actions/tasks"

interface KanbanBoardProps {
  tasks: Task[]
  currentWeekStart: string
  weekOffset: number
  onWeekOffsetChange: (offset: number) => void
  onTasksChange?: () => void
}

export function KanbanBoard({
  tasks,
  currentWeekStart,
  weekOffset,
  onWeekOffsetChange,
  onTasksChange,
}: KanbanBoardProps) {
  const [mobileColumn, setMobileColumn] = useState("hot_list")
  const [previousColumn, setPreviousColumn] = useState<string | null>(null)
  const [selectedDay, setSelectedDay] = useState("mon")
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null)
  const touchStartX = useRef<number>(0)
  const touchEndX = useRef<number>(0)
  const [slideDirection, setSlideDirection] = useState<"left" | "right" | null>(null)
  const [isSliding, setIsSliding] = useState(false)
  const [animationStarted, setAnimationStarted] = useState(false)
  const shouldIgnoreSwipe = useRef<boolean>(false)

  useEffect(() => {
    setPortalContainer(document.getElementById("week-nav-container"))
  }, [])

  useEffect(() => {
    if (mobileColumn.startsWith("hit_list_")) {
      setMobileColumn(`hit_list_${selectedDay}`)
    }
  }, [selectedDay, mobileColumn])

  const currentWeek = new Date(currentWeekStart)
  const weekLabel = formatWeekRange(currentWeek)
  const weekStartDate = currentWeekStart

  const subtaskMap = useMemo(() => {
    const map = new Map<number, Task[]>()
    const parentTasks = new Set<number>()

    tasks.forEach((task) => {
      if (task.parent_id) {
        parentTasks.add(task.parent_id)
      }
    })

    parentTasks.forEach((parentId) => {
      map.set(
        parentId,
        tasks.filter((task) => task.parent_id === parentId),
      )
    })
    return map
  }, [tasks])

  const tasksByColumn = useMemo(() => {
    const getTasksForColumn = (columnId: string) => {
      if (columnId.startsWith("hit_list_")) {
        const taskWeekDate = (t: Task) => extractDate(t.week_start_date)
        return tasks.filter((t) => {
          const matchesWeek = taskWeekDate(t) === weekStartDate
          const isInHitList = t.column_name === columnId
          return matchesWeek && isInHitList
        })
      }

      if (columnId === "done") {
        const taskWeekDate = (t: Task) => extractDate(t.week_start_date)
        return tasks.filter((t) => {
          const isDoorSubtask = t.column_name === "the_door" && t.parent_id && t.label === "Door"
          const matchesWeek = taskWeekDate(t) === weekStartDate
          return t.completed && !isDoorSubtask && matchesWeek
        })
      }

      if (columnId === "hot_list") {
        return tasks.filter((t) => {
          return t.column_name === columnId && !t.week_start_date
        })
      }

      if (columnId === "the_door") {
        const taskWeekDate = (t: Task) => extractDate(t.week_start_date)
        console.log("[v0] Door column filter - weekStartDate:", weekStartDate)
        console.log(
          "[v0] All tasks in the_door column:",
          tasks
            .filter((t) => t.column_name === "the_door")
            .map((t) => ({
              id: t.id,
              title: t.title,
              week_start_date: t.week_start_date,
              extracted: taskWeekDate(t),
              parent_id: t.parent_id,
              matchesWeek: taskWeekDate(t) === weekStartDate,
              isParent: !t.parent_id,
            })),
        )
        const doorTasks = tasks.filter((t) => {
          const isInDoor = t.column_name === columnId && taskWeekDate(t) === weekStartDate
          return isInDoor && !t.parent_id
        })
        console.log(
          "[v0] Filtered Door tasks:",
          doorTasks.map((t) => ({ id: t.id, title: t.title })),
        )
        return doorTasks
      }

      return tasks.filter((t) => t.column_name === columnId && !t.week_start_date)
    }

    return {
      hot_list: getTasksForColumn("hot_list"),
      the_door: getTasksForColumn("the_door"),
      hit_list_mon: getTasksForColumn("hit_list_mon"),
      hit_list_tue: getTasksForColumn("hit_list_tue"),
      hit_list_wed: getTasksForColumn("hit_list_wed"),
      hit_list_thu: getTasksForColumn("hit_list_thu"),
      hit_list_fri: getTasksForColumn("hit_list_fri"),
      done: getTasksForColumn("done"),
    }
  }, [tasks, weekStartDate])

  const hotListTasks = tasksByColumn.hot_list
  const doorTasks = tasksByColumn.the_door
  const hitListColumnId = `hit_list_${selectedDay}`
  const hitListTasks = tasksByColumn[hitListColumnId as keyof typeof tasksByColumn] || []
  const doneTasks = tasksByColumn.done

  const mobileColumns = [
    { id: "hot_list", label: "Hot List" },
    { id: "the_door", label: "The Door" },
    { id: hitListColumnId, label: "Hit List" },
    { id: "done", label: "Done" },
  ]

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
  )

  useEffect(() => {
    return () => {
      shouldIgnoreSwipe.current = false
      touchStartX.current = 0
      touchEndX.current = 0
    }
  }, [])

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    try {
      if (active.node?.current) {
        const element = active.node.current as HTMLElement
        if (element.releasePointerCapture) {
          try {
            element.releasePointerCapture(1)
          } catch (e) {}
          try {
            element.releasePointerCapture(0)
          } catch (e) {}
        }
      }
    } catch (e) {}

    if (!over) {
      shouldIgnoreSwipe.current = false
      return
    }

    const activeTask = active.data.current?.task as Task
    const sourceColumn = active.data.current?.columnId as string
    const targetColumn = typeof over.id === "number" ? (over.data.current?.columnId as string) : (over.id as string)

    if (!activeTask || !targetColumn) return

    if (sourceColumn === targetColumn) {
      return
    }

    if (sourceColumn === "hot_list" && (targetColumn === "the_door" || targetColumn.startsWith("hit_list_"))) {
      if (targetColumn === "the_door") {
        const doorTasksThisWeek = tasks.filter((t) => {
          const taskWeekDate = extractDate(t.week_start_date)
          return t.column_name === "the_door" && taskWeekDate === weekStartDate && !t.parent_id
        })

        if (doorTasksThisWeek.length >= 1) {
          alert("The Door already has a task this week")
          return
        }
      }

      if (targetColumn.startsWith("hit_list_")) {
        const hitListTasksThisDay = tasks.filter((t) => {
          const taskWeekDate = extractDate(t.week_start_date)
          return t.column_name === targetColumn && taskWeekDate === weekStartDate
        })

        if (hitListTasksThisDay.length >= 4) {
          const day = targetColumn.split("_")[2].toUpperCase()
          alert(`${day} already has 4 tasks`)
          return
        }
      }

      await copyTaskFromHotList(activeTask.id, targetColumn, 0, weekStartDate)
      onTasksChange?.()
      return
    }

    await moveTask(activeTask.id, targetColumn, 0, weekStartDate)
    onTasksChange?.()
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement

    const isInteractive =
      target.closest("button") ||
      target.closest("input") ||
      target.closest("textarea") ||
      target.closest("select") ||
      target.closest("a") ||
      target.closest('[role="button"]') ||
      target.closest('[role="dialog"]')

    if (isInteractive) {
      shouldIgnoreSwipe.current = true
      return
    }

    shouldIgnoreSwipe.current = false
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (shouldIgnoreSwipe.current) return
    touchEndX.current = e.touches[0].clientX
  }

  const handleTouchEnd = () => {
    if (shouldIgnoreSwipe.current || isSliding) {
      shouldIgnoreSwipe.current = false
      return
    }

    const swipeDistance = touchStartX.current - touchEndX.current
    const minSwipeDistance = 80

    if (Math.abs(swipeDistance) < minSwipeDistance) return

    const currentIndex = mobileColumns.findIndex((col) => col.id === mobileColumn)

    if (swipeDistance > 0) {
      if (currentIndex < mobileColumns.length - 1) {
        setPreviousColumn(mobileColumn)
        setSlideDirection("left")
        setMobileColumn(mobileColumns[currentIndex + 1].id)
        setIsSliding(true)
        setAnimationStarted(false)
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setAnimationStarted(true)
          })
        })
        setTimeout(() => {
          setIsSliding(false)
          setSlideDirection(null)
          setPreviousColumn(null)
          setAnimationStarted(false)
        }, 400)
      }
    } else {
      if (currentIndex > 0) {
        setPreviousColumn(mobileColumn)
        setSlideDirection("right")
        setMobileColumn(mobileColumns[currentIndex - 1].id)
        setIsSliding(true)
        setAnimationStarted(false)
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setAnimationStarted(true)
          })
        })
        setTimeout(() => {
          setIsSliding(false)
          setSlideDirection(null)
          setPreviousColumn(null)
          setAnimationStarted(false)
        }, 400)
      }
    }

    touchStartX.current = 0
    touchEndX.current = 0
    shouldIgnoreSwipe.current = false
  }

  const renderMobileView = () => {
    const selectedCol = mobileColumns.find((col) => col.id === mobileColumn)
    if (!selectedCol) return null

    const isHitList = selectedCol.id.startsWith("hit_list_")

    const renderColumn = (columnId: string, isExiting: boolean) => {
      const col = mobileColumns.find((c) => c.id === columnId)
      if (!col) return null

      const isHitListCol = col.id.startsWith("hit_list_")

      const columnTasks = tasksByColumn[columnId as keyof typeof tasksByColumn] || []

      let transform = "translateX(0)"
      if (isSliding && slideDirection) {
        if (isExiting) {
          transform = animationStarted
            ? slideDirection === "left"
              ? "translateX(-100%)"
              : "translateX(100%)"
            : "translateX(0)"
        } else {
          if (animationStarted) {
            transform = "translateX(0)"
          } else {
            transform = slideDirection === "left" ? "translateX(100%)" : "translateX(-100%)"
          }
        }
      }

      return (
        <div
          key={columnId}
          className="absolute inset-0 transition-transform duration-400 ease-out"
          style={{
            transform,
          }}
        >
          <div className="h-full overflow-y-auto px-4">
            <KanbanColumn
              title={col.label}
              columnId={col.id}
              tasks={columnTasks}
              subtaskMap={subtaskMap}
              showAddButton={col.id === "hot_list"}
              maxTasks={col.id === "the_door" ? 1 : col.id.startsWith("hit_list_") ? 4 : undefined}
              weekStartDate={weekStartDate}
              showDaySelector={isHitListCol}
              selectedDay={isHitListCol ? selectedDay : undefined}
              onDayChange={isHitListCol ? setSelectedDay : undefined}
              onTasksChange={onTasksChange}
              onColumnChange={setMobileColumn}
              isMobile={true}
              getHitListCount={getHitListCount}
              getDoorCount={getDoorCount}
              allTasks={tasks}
            />
          </div>
        </div>
      )
    }

    return (
      <div
        className="md:hidden overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="p-4 pb-2">
          <div className="mb-4 text-center">
            <h2 className="text-lg font-semibold text-foreground">{selectedCol.label}</h2>
            <div className="flex justify-center gap-2 mt-2">
              {mobileColumns.map((col, index) => (
                <div
                  key={col.id}
                  className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${
                    col.id === mobileColumn ? "bg-primary w-6" : "bg-muted"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="relative h-[calc(100vh-180px)]">
          {previousColumn && renderColumn(previousColumn, true)}
          {renderColumn(mobileColumn, false)}
        </div>
      </div>
    )
  }

  const getTodayDay = () => {
    const today = new Date()
    const dayOfWeek = today.getDay()

    const dayMap: { [key: number]: string } = {
      0: "fri",
      1: "mon",
      2: "tue",
      3: "wed",
      4: "thu",
      5: "fri",
      6: "fri",
    }

    return dayMap[dayOfWeek]
  }

  const handleTodayClick = () => {
    onWeekOffsetChange(0)
    const todayDay = getTodayDay()
    setSelectedDay(todayDay)

    if (mobileColumn.startsWith("hit_list_")) {
      setMobileColumn(`hit_list_${todayDay}`)
    }
  }

  const getHitListCount = useCallback(
    (day: string) => {
      const hitListColumnId = `hit_list_${day}`
      return tasks.filter((t) => {
        const taskWeekDate = extractDate(t.week_start_date)
        const matchesWeek = taskWeekDate === weekStartDate
        const isInHitList = t.column_name === hitListColumnId
        return matchesWeek && isInHitList
      }).length
    },
    [tasks, weekStartDate],
  )

  const getDoorCount = useCallback(() => {
    return tasks.filter((t) => {
      const taskWeekDate = extractDate(t.week_start_date)
      const matchesWeek = taskWeekDate === weekStartDate
      const isInDoor = t.column_name === "the_door"
      const isParent = !t.parent_id
      return matchesWeek && isInDoor && isParent
    }).length
  }, [tasks, weekStartDate])

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      {portalContainer &&
        createPortal(
          <WeekNavigator
            weekLabel={weekLabel}
            onPreviousWeek={() => {
              onWeekOffsetChange(weekOffset - 1)
            }}
            onNextWeek={() => {
              onWeekOffsetChange(weekOffset + 1)
            }}
            onCurrentWeek={handleTodayClick}
          />,
          portalContainer,
        )}

      {renderMobileView()}

      <div className="hidden md:grid md:grid-cols-4 gap-6 p-6 items-start">
        <KanbanColumn
          title="Hot List"
          columnId="hot_list"
          tasks={hotListTasks}
          subtaskMap={subtaskMap}
          showAddButton
          className="md:col-span-1"
          onTasksChange={onTasksChange}
          onColumnChange={setMobileColumn}
          isMobile={false}
          weekStartDate={weekStartDate}
          getHitListCount={getHitListCount}
          getDoorCount={getDoorCount}
          allTasks={tasks}
        />

        <KanbanColumn
          title="The Door"
          columnId="the_door"
          tasks={doorTasks}
          subtaskMap={subtaskMap}
          maxTasks={1}
          className="md:col-span-1"
          onTasksChange={onTasksChange}
          onColumnChange={setMobileColumn}
          isMobile={false}
          weekStartDate={weekStartDate}
          getHitListCount={getHitListCount}
          getDoorCount={getDoorCount}
          allTasks={tasks}
        />

        <KanbanColumn
          title="Hit List"
          columnId={hitListColumnId}
          tasks={hitListTasks}
          subtaskMap={subtaskMap}
          maxTasks={4}
          showAddButton={false}
          weekStartDate={weekStartDate}
          className="md:col-span-1"
          showDaySelector
          selectedDay={selectedDay}
          onDayChange={setSelectedDay}
          onTasksChange={onTasksChange}
          onColumnChange={setMobileColumn}
          isMobile={false}
          getHitListCount={getHitListCount}
          getDoorCount={getDoorCount}
          allTasks={tasks}
        />

        <KanbanColumn
          title="Done"
          columnId="done"
          tasks={doneTasks}
          subtaskMap={subtaskMap}
          className="md:col-span-1"
          onTasksChange={onTasksChange}
          onColumnChange={setMobileColumn}
          isMobile={false}
          weekStartDate={weekStartDate}
          getHitListCount={getHitListCount}
          getDoorCount={getDoorCount}
          allTasks={tasks}
        />
      </div>

      <div className="fixed bottom-6 right-6">
        <AddTaskDialog
          columnName="hot_list"
          showLabelSelector
          onSuccess={onTasksChange}
          trigger={
            <Button size="lg" className="rounded-full h-14 w-14 shadow-lg">
              <Plus className="h-6 w-6" />
            </Button>
          }
        />
      </div>
    </DndContext>
  )
}
