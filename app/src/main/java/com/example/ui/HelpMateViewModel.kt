package com.example.ui

import android.app.Application
import android.util.Log
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.ai.GroundingSource
import com.example.ai.HelpMateAgentService
import com.example.data.HelpMateRepository
import com.example.data.UserPreferences
import com.example.data.UserPreferencesRepository
import com.example.data.local.AlarmReminderEntity
import com.example.data.local.AppDatabase
import com.example.data.local.ChatMessageEntity
import com.example.i18n.AppLanguage
import com.example.system.AlarmClockHelper
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.TimeoutCancellationException
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

sealed interface AgentUiState {
    data object Idle : AgentUiState
    data class Thinking(val activeTool: String? = null) : AgentUiState
    data class Error(val message: String) : AgentUiState
}

class HelpMateViewModel(application: Application) : AndroidViewModel(application) {

    companion object {
        private const val TAG = "HelpMateViewModel"
    }

    private val prefsRepo = UserPreferencesRepository(application.applicationContext)
    private val db = AppDatabase.getInstance(application.applicationContext)
    private val repo = HelpMateRepository(db.alarmReminderDao(), db.chatMessageDao())
    private val agentService = HelpMateAgentService()

    val preferences: StateFlow<UserPreferences> = prefsRepo.preferencesFlow
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5_000),
            initialValue = UserPreferences()
        )

    val alarmsAndReminders: StateFlow<List<AlarmReminderEntity>> = repo.alarmsAndReminders
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5_000),
            initialValue = emptyList()
        )

    val chatMessages: StateFlow<List<ChatMessageEntity>> = repo.chatMessages
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5_000),
            initialValue = emptyList()
        )

    private val _agentState = MutableStateFlow<AgentUiState>(AgentUiState.Idle)
    val agentState: StateFlow<AgentUiState> = _agentState.asStateFlow()

    fun completeOnboarding(language: AppLanguage) {
        viewModelScope.launch {
            prefsRepo.completeOnboarding(language)
        }
    }

    fun setLanguage(language: AppLanguage) {
        viewModelScope.launch {
            prefsRepo.setLanguage(language)
        }
    }

    fun setUserName(name: String) {
        viewModelScope.launch {
            prefsRepo.setUserName(name)
        }
    }

    fun setAutoDetectLanguage(enabled: Boolean) {
        viewModelScope.launch {
            prefsRepo.setAutoDetectLanguage(enabled)
        }
    }

    fun setDefaultAlarmSound(sound: String) {
        viewModelScope.launch {
            prefsRepo.setDefaultAlarmSound(sound)
        }
    }

    fun dismissError() {
        if (_agentState.value is AgentUiState.Error) {
            _agentState.value = AgentUiState.Idle
        }
    }

    fun sendChatMessage(rawText: String) {
        val trimmed = rawText.trim()
        if (trimmed.isEmpty()) return
        if (_agentState.value is AgentUiState.Thinking) return

        viewModelScope.launch {
            val currentPrefs = preferences.value
            val instantSwitch = AppLanguage.detectRequestedSwitch(trimmed)
            if (instantSwitch != null && instantSwitch != currentPrefs.language) {
                prefsRepo.setLanguage(instantSwitch)
            }
            val effectiveLanguage = instantSwitch ?: currentPrefs.language

            repo.insertChatMessage(
                ChatMessageEntity(
                    isUser = true,
                    text = trimmed
                )
            )

            _agentState.value = AgentUiState.Thinking(null)

            try {
                val history = repo.getChatHistorySnapshot()
                val result = agentService.runAgentTurn(
                    userMessage = trimmed,
                    history = history.dropLast(1),
                    activeLanguage = effectiveLanguage,
                    autoDetect = currentPrefs.autoDetectLanguage,
                    defaultSound = currentPrefs.defaultAlarmSound,
                    onToolThinking = { toolName ->
                        _agentState.value = AgentUiState.Thinking(toolName)
                    }
                )

                result.switchedLanguage?.let { targetLang ->
                    prefsRepo.setLanguage(targetLang)
                }

                var linkedAlarmId: Long? = null
                result.alarmDraft?.let { draft ->
                    val entity = AlarmReminderEntity(
                        title = draft.title,
                        hour = draft.hour,
                        minute = draft.minute,
                        repeatDaysCsv = draft.repeatDaysCsv,
                        soundName = draft.soundName,
                        isReminder = draft.isReminder,
                        intervalHours = draft.intervalHours,
                        isEnabled = true,
                        isSavedToClock = false
                    )
                    linkedAlarmId = repo.insertAlarmOrReminder(entity)
                    if (draft.isReminder) {
                        AlarmClockHelper.scheduleLocalReminder(
                            context = getApplication(),
                            reminderId = linkedAlarmId!!,
                            title = draft.title,
                            intervalHours = draft.intervalHours
                        )
                    }
                }

                val encodedSources = encodeSources(result.groundingSources)
                repo.insertChatMessage(
                    ChatMessageEntity(
                        isUser = false,
                        text = result.replyText,
                        toolBadgesCsv = result.toolsUsed.joinToString(","),
                        groundingSourcesRaw = encodedSources,
                        mapQuery = result.mapQuery,
                        linkedAlarmId = linkedAlarmId
                    )
                )

                _agentState.value = AgentUiState.Idle
            } catch (e: TimeoutCancellationException) {
                Log.e(TAG, "Agent turn timed out", e)
                _agentState.value = AgentUiState.Error(
                    "HelpMate took a little too long to respond (60s timeout). Please try again."
                )
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                Log.e(TAG, "Agent turn failed", e)
                _agentState.value = AgentUiState.Error(
                    e.localizedMessage ?: "Failed to connect to HelpMate AI."
                )
            }
        }
    }

    fun updateAndSaveAlarm(
        alarm: AlarmReminderEntity,
        repeatDaysCsv: String,
        soundName: String,
        launchSystemClock: Boolean
    ) {
        viewModelScope.launch {
            val updated = alarm.copy(
                repeatDaysCsv = repeatDaysCsv,
                soundName = soundName,
                isEnabled = true,
                isSavedToClock = true
            )
            repo.updateAlarmOrReminder(updated)
            if (updated.isReminder) {
                AlarmClockHelper.scheduleLocalReminder(
                    context = getApplication(),
                    reminderId = updated.id,
                    title = updated.title,
                    intervalHours = updated.intervalHours.coerceAtLeast(1)
                )
            } else if (launchSystemClock) {
                AlarmClockHelper.launchSystemAlarmIntent(
                    context = getApplication(),
                    hour = updated.hour,
                    minute = updated.minute,
                    label = updated.title,
                    repeatDaysCsv = updated.repeatDaysCsv
                )
            }
        }
    }

    fun createManualAlarmOrReminder(
        title: String,
        hour: Int,
        minute: Int,
        repeatDaysCsv: String,
        soundName: String,
        isReminder: Boolean,
        intervalHours: Int,
        launchClockApp: Boolean
    ) {
        viewModelScope.launch {
            val entity = AlarmReminderEntity(
                title = title.ifBlank { if (isReminder) "Drink Water" else "HelpMate Alarm" },
                hour = hour,
                minute = minute,
                repeatDaysCsv = repeatDaysCsv.ifBlank { "Once" },
                soundName = soundName,
                isReminder = isReminder,
                intervalHours = if (isReminder) intervalHours.coerceIn(1, 24) else 0,
                isEnabled = true,
                isSavedToClock = !isReminder
            )
            val newId = repo.insertAlarmOrReminder(entity)
            if (isReminder) {
                AlarmClockHelper.scheduleLocalReminder(
                    context = getApplication(),
                    reminderId = newId,
                    title = entity.title,
                    intervalHours = entity.intervalHours
                )
            } else if (launchClockApp) {
                AlarmClockHelper.launchSystemAlarmIntent(
                    context = getApplication(),
                    hour = entity.hour,
                    minute = entity.minute,
                    label = entity.title,
                    repeatDaysCsv = entity.repeatDaysCsv
                )
            }
        }
    }

    fun toggleAlarmEnabled(alarm: AlarmReminderEntity, enabled: Boolean) {
        viewModelScope.launch {
            val updated = alarm.copy(isEnabled = enabled)
            repo.updateAlarmOrReminder(updated)
            if (updated.isReminder) {
                if (enabled) {
                    AlarmClockHelper.scheduleLocalReminder(
                        context = getApplication(),
                        reminderId = updated.id,
                        title = updated.title,
                        intervalHours = updated.intervalHours.coerceAtLeast(1)
                    )
                } else {
                    AlarmClockHelper.cancelLocalReminder(getApplication(), updated.id)
                }
            }
        }
    }

    fun deleteAlarm(alarm: AlarmReminderEntity) {
        viewModelScope.launch {
            if (alarm.isReminder) {
                AlarmClockHelper.cancelLocalReminder(getApplication(), alarm.id)
            }
            repo.deleteAlarmOrReminder(alarm.id)
        }
    }

    fun clearChat() {
        viewModelScope.launch {
            repo.clearChatHistory()
        }
    }

    private fun encodeSources(sources: List<GroundingSource>): String {
        return sources.joinToString("\n") { source ->
            "${source.title.replace("|", " ")}|${source.uri}"
        }
    }

    fun decodeSources(raw: String): List<GroundingSource> {
        if (raw.isBlank()) return emptyList()
        return raw.lines().mapNotNull { line ->
            val idx = line.lastIndexOf('|')
            if (idx > 0 && idx < line.length - 1) {
                GroundingSource(
                    title = line.substring(0, idx),
                    uri = line.substring(idx + 1)
                )
            } else {
                null
            }
        }
    }
}
