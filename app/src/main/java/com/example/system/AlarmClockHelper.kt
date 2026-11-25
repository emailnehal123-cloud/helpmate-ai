package com.example.system

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.provider.AlarmClock
import java.util.Calendar

object AlarmClockHelper {

    val availableSounds = listOf(
        "Starlight Chime",
        "Cosmic Bell",
        "Morning Dew",
        "Gentle Sunrise"
    )

    val weekDays = listOf("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun")

    fun launchSystemAlarmIntent(
        context: Context,
        hour: Int,
        minute: Int,
        label: String,
        repeatDaysCsv: String
    ): Boolean {
        val intent = Intent(AlarmClock.ACTION_SET_ALARM).apply {
            putExtra(AlarmClock.EXTRA_HOUR, hour.coerceIn(0, 23))
            putExtra(AlarmClock.EXTRA_MINUTES, minute.coerceIn(0, 59))
            putExtra(AlarmClock.EXTRA_MESSAGE, label.ifBlank { "HelpMate AI Alarm" })
            putExtra(AlarmClock.EXTRA_SKIP_UI, false)
            val days = parseCalendarDays(repeatDaysCsv)
            if (days.isNotEmpty()) {
                putExtra(AlarmClock.EXTRA_DAYS, ArrayList(days))
            }
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        return runCatching {
            if (intent.resolveActivity(context.packageManager) != null) {
                context.startActivity(intent)
                true
            } else {
                false
            }
        }.getOrDefault(false)
    }

    fun scheduleLocalReminder(
        context: Context,
        reminderId: Long,
        title: String,
        intervalHours: Int
    ) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return
        val intervalMs = (intervalHours.coerceAtLeast(1) * 60L * 60L * 1000L)
        val triggerAt = System.currentTimeMillis() + intervalMs
        val pendingIntent = buildReminderPendingIntent(context, reminderId, title, intervalHours)

        alarmManager.setInexactRepeating(
            AlarmManager.RTC_WAKEUP,
            triggerAt,
            intervalMs,
            pendingIntent
        )
    }

    fun cancelLocalReminder(context: Context, reminderId: Long) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return
        val pendingIntent = buildReminderPendingIntent(context, reminderId, "", 1)
        alarmManager.cancel(pendingIntent)
    }

    private fun buildReminderPendingIntent(
        context: Context,
        reminderId: Long,
        title: String,
        intervalHours: Int
    ): PendingIntent {
        val intent = Intent(context, ReminderBroadcastReceiver::class.java).apply {
            putExtra(ReminderBroadcastReceiver.EXTRA_REMINDER_ID, reminderId)
            putExtra(ReminderBroadcastReceiver.EXTRA_TITLE, title)
            putExtra(ReminderBroadcastReceiver.EXTRA_INTERVAL_HOURS, intervalHours)
        }
        val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        } else {
            PendingIntent.FLAG_UPDATE_CURRENT
        }
        return PendingIntent.getBroadcast(context, reminderId.toInt(), intent, flags)
    }

    fun formatTime12Hour(hour: Int, minute: Int): String {
        val h24 = hour.coerceIn(0, 23)
        val m = minute.coerceIn(0, 59)
        val period = if (h24 >= 12) "PM" else "AM"
        val h12 = when {
            h24 == 0 -> 12
            h24 > 12 -> h24 - 12
            else -> h24
        }
        return String.format("%02d:%02d %s", h12, m, period)
    }

    private fun parseCalendarDays(csv: String): List<Int> {
        if (csv.isBlank()) return emptyList()
        val lower = csv.lowercase()
        if (lower.contains("daily") || lower.contains("every day")) {
            return listOf(
                Calendar.MONDAY, Calendar.TUESDAY, Calendar.WEDNESDAY,
                Calendar.THURSDAY, Calendar.FRIDAY, Calendar.SATURDAY, Calendar.SUNDAY
            )
        }
        val mapped = mutableListOf<Int>()
        if (lower.contains("mon")) mapped.add(Calendar.MONDAY)
        if (lower.contains("tue")) mapped.add(Calendar.TUESDAY)
        if (lower.contains("wed")) mapped.add(Calendar.WEDNESDAY)
        if (lower.contains("thu")) mapped.add(Calendar.THURSDAY)
        if (lower.contains("fri")) mapped.add(Calendar.FRIDAY)
        if (lower.contains("sat")) mapped.add(Calendar.SATURDAY)
        if (lower.contains("sun")) mapped.add(Calendar.SUNDAY)
        return mapped
    }
}
