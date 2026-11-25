package com.example.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import kotlinx.coroutines.flow.Flow

@Dao
interface AlarmReminderDao {
    @Query("SELECT * FROM alarms_reminders ORDER BY createdAt DESC")
    fun observeAll(): Flow<List<AlarmReminderEntity>>

    @Query("SELECT * FROM alarms_reminders WHERE id = :id")
    suspend fun getById(id: Long): AlarmReminderEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(item: AlarmReminderEntity): Long

    @Update
    suspend fun update(item: AlarmReminderEntity)

    @Query("DELETE FROM alarms_reminders WHERE id = :id")
    suspend fun deleteById(id: Long)
}

@Dao
interface ChatMessageDao {
    @Query("SELECT * FROM chat_messages ORDER BY timestamp ASC, id ASC")
    fun observeMessages(): Flow<List<ChatMessageEntity>>

    @Query("SELECT * FROM chat_messages ORDER BY timestamp ASC, id ASC")
    suspend fun getAllMessagesOnce(): List<ChatMessageEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(message: ChatMessageEntity): Long

    @Query("DELETE FROM chat_messages")
    suspend fun clearAll()
}
