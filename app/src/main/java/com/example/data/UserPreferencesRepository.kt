package com.example.data

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.example.i18n.AppLanguage
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "helpmate_prefs")

data class UserPreferences(
    val language: AppLanguage = AppLanguage.ENGLISH,
    val hasCompletedOnboarding: Boolean = false,
    val userName: String = "Friend",
    val autoDetectLanguage: Boolean = true,
    val defaultAlarmSound: String = "Starlight Chime"
)

class UserPreferencesRepository(private val context: Context) {

    private object Keys {
        val LANGUAGE_CODE = stringPreferencesKey("language_code")
        val ONBOARDING_DONE = booleanPreferencesKey("onboarding_done")
        val USER_NAME = stringPreferencesKey("user_name")
        val AUTO_DETECT = booleanPreferencesKey("auto_detect_language")
        val DEFAULT_SOUND = stringPreferencesKey("default_alarm_sound")
    }

    val preferencesFlow: Flow<UserPreferences> = context.dataStore.data.map { prefs ->
        UserPreferences(
            language = AppLanguage.fromCode(prefs[Keys.LANGUAGE_CODE]),
            hasCompletedOnboarding = prefs[Keys.ONBOARDING_DONE] ?: false,
            userName = prefs[Keys.USER_NAME] ?: "Friend",
            autoDetectLanguage = prefs[Keys.AUTO_DETECT] ?: true,
            defaultAlarmSound = prefs[Keys.DEFAULT_SOUND] ?: "Starlight Chime"
        )
    }

    suspend fun setLanguage(language: AppLanguage) {
        context.dataStore.edit { prefs ->
            prefs[Keys.LANGUAGE_CODE] = language.code
        }
    }

    suspend fun completeOnboarding(language: AppLanguage) {
        context.dataStore.edit { prefs ->
            prefs[Keys.LANGUAGE_CODE] = language.code
            prefs[Keys.ONBOARDING_DONE] = true
        }
    }

    suspend fun setUserName(name: String) {
        context.dataStore.edit { prefs ->
            prefs[Keys.USER_NAME] = name.trim().ifEmpty { "Friend" }
        }
    }

    suspend fun setAutoDetectLanguage(enabled: Boolean) {
        context.dataStore.edit { prefs ->
            prefs[Keys.AUTO_DETECT] = enabled
        }
    }

    suspend fun setDefaultAlarmSound(sound: String) {
        context.dataStore.edit { prefs ->
            prefs[Keys.DEFAULT_SOUND] = sound
        }
    }
}
