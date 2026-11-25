package com.example.data

import com.example.data.local.AlarmReminderDao
import com.example.data.local.AlarmReminderEntity
import com.example.data.local.ChatMessageDao
import com.example.data.local.ChatMessageEntity
import kotlinx.coroutines.flow.Flow

class HelpMateRepository(
    private val alarmDao: AlarmReminderDao,
    private val chatDao: ChatMessageDao
) {
    val alarmsAndReminders: Flow<List<AlarmReminderEntity>> = alarmDao.observeAll()
    val chatMessages: Flow<List<ChatMessageEntity>> = chatDao.observeMessages()

    suspend fun getAlarmById(id: Long): AlarmReminderEntity? = alarmDao.getById(id)

    suspend fun insertAlarmOrReminder(entity: AlarmReminderEntity): Long = alarmDao.insert(entity)

    suspend fun updateAlarmOrReminder(entity: AlarmReminderEntity) = alarmDao.update(entity)

    suspend fun deleteAlarmOrReminder(id: Long) = alarmDao.deleteById(id)

    suspend fun insertChatMessage(message: ChatMessageEntity): Long = chatDao.insert(message)

    suspend fun getChatHistorySnapshot(): List<ChatMessageEntity> = chatDao.getAllMessagesOnce()

    suspend fun clearChatHistory() = chatDao.clearAll()
}
