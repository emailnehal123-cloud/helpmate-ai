package com.example.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "alarms_reminders")
data class AlarmReminderEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val title: String,
    val hour: Int,
    val minute: Int,
    val repeatDaysCsv: String,
    val soundName: String,
    val isReminder: Boolean = false,
    val intervalHours: Int = 0,
    val isEnabled: Boolean = true,
    val isSavedToClock: Boolean = false,
    val createdAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "chat_messages")
data class ChatMessageEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val isUser: Boolean,
    val text: String,
    val timestamp: Long = System.currentTimeMillis(),
    val toolBadgesCsv: String = "",
    val groundingSourcesRaw: String = "",
    val mapQuery: String? = null,
    val linkedAlarmId: Long? = null
)
