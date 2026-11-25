package com.example.ai

import android.util.Log
import com.example.data.local.ChatMessageEntity
import com.example.i18n.AppLanguage
import com.google.firebase.Firebase
import com.google.firebase.ai.ai
import com.google.firebase.ai.type.Content
import com.google.firebase.ai.type.FunctionDeclaration
import com.google.firebase.ai.type.FunctionResponsePart
import com.google.firebase.ai.type.Schema
import com.google.firebase.ai.type.Tool
import com.google.firebase.ai.type.content
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.TimeoutCancellationException
import kotlinx.coroutines.withTimeout
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.intOrNull
import kotlinx.serialization.json.jsonPrimitive

data class GroundingSource(
    val title: String,
    val uri: String
)

data class PendingAlarmDraft(
    val title: String,
    val hour: Int,
    val minute: Int,
    val repeatDaysCsv: String,
    val soundName: String,
    val isReminder: Boolean,
    val intervalHours: Int
)

data class AgentResult(
    val replyText: String,
    val toolsUsed: List<String>,
    val groundingSources: List<GroundingSource>,
    val mapQuery: String?,
    val alarmDraft: PendingAlarmDraft?,
    val switchedLanguage: AppLanguage?
)

class HelpMateAgentService {

    companion object {
        private const val TAG = "HelpMateAgent"
        private const val MODEL_NAME = "gemini-3.5-flash-lite"
    }

    private val setAlarmDeclaration = FunctionDeclaration(
        name = "set_alarm",
        description = "Create a local alarm card and prepare a device alarm when the user asks to set an alarm for a specific time (e.g., 'Kal subah 6 baje alarm laga do', 'Set alarm for 7 AM').",
        parameters = mapOf(
            "hour" to Schema.integer("Hour in 24-hour format (0 to 23)"),
            "minute" to Schema.integer("Minute (0 to 59)"),
            "label" to Schema.string("Short friendly label for the alarm"),
            "repeat_days" to Schema.string("Comma-separated repeat days like 'Mon,Tue,Wed' or 'Once' or 'Daily'"),
            "sound" to Schema.string("Preferred alarm tone name such as 'Starlight Chime', 'Cosmic Bell', 'Morning Dew', or 'Gentle Sunrise'")
        )
    )

    private val setReminderDeclaration = FunctionDeclaration(
        name = "set_recurring_reminder",
        description = "Create a recurring local reminder (for example: 'Remind me to drink water every 2 hours').",
        parameters = mapOf(
            "title" to Schema.string("Short reminder title such as 'Drink Water'"),
            "interval_hours" to Schema.integer("Repeat interval in hours (e.g., 2 for every 2 hours)")
        )
    )

    private val searchGoogleDeclaration = FunctionDeclaration(
        name = "search_google",
        description = "Search Google in real time for current facts, news, weather, prices, sports scores, or live information.",
        parameters = mapOf(
            "query" to Schema.string("Concise search query")
        )
    )

    private val searchMapsDeclaration = FunctionDeclaration(
        name = "search_google_maps",
        description = "Find places, restaurants, pharmacies, cafes, landmarks, or directions for Google Maps.",
        parameters = mapOf(
            "place_query" to Schema.string("Place or category plus city/area if mentioned, e.g., 'best biryani near Gulberg Lahore' or 'nearest pharmacy'")
        )
    )

    private val switchLanguageDeclaration = FunctionDeclaration(
        name = "switch_app_language",
        description = "Switch the entire HelpMate AI app language when the user asks to speak in a specific language (e.g., 'Urdu me baat karo', 'Speak in Arabic', 'Switch to French').",
        parameters = mapOf(
            "language_code" to Schema.enumeration(
                values = listOf("en", "ur", "hi", "ar", "fr", "es", "tr"),
                description = "ISO code of the target language: en, ur, hi, ar, fr, es, or tr"
            )
        )
    )

    private val searchGroundedModel by lazy {
        Firebase.ai.generativeModel(
            modelName = MODEL_NAME,
            tools = listOf(Tool.googleSearch())
        )
    }

    private fun buildAgentModel(activeLanguage: AppLanguage, autoDetect: Boolean) =
        Firebase.ai.generativeModel(
            modelName = MODEL_NAME,
            tools = listOf(
                Tool.functionDeclarations(
                    listOf(
                        setAlarmDeclaration,
                        setReminderDeclaration,
                        searchGoogleDeclaration,
                        searchMapsDeclaration,
                        switchLanguageDeclaration
                    )
                )
            ),
            systemInstruction = content {
                text(
                    """
                    You are HelpMate AI — a cute, warm, cheerful, super helpful AI companion with sparkling stars!
                    Current UI language: ${activeLanguage.englishName} (${activeLanguage.nativeName}, code=${activeLanguage.code}).
                    Auto-detect mode: $autoDetect.

                    CORE RULES:
                    1. LANGUAGE MATCHING:
                       - If Auto-detect mode is true, ALWAYS detect the language and script of the user's latest message and reply in the EXACT SAME language and script!
                       - If the user writes in Roman Urdu/Hinglish (e.g. "Kal subah 6 baje alarm laga do", "Aaj mausam kaisa hai?"), reply naturally in warm, friendly Roman Urdu/Hinglish!
                       - If the user writes in Urdu script, Hindi script, Arabic, French, Spanish, Turkish, or English, reply in that exact language.
                       - If the user explicitly asks to switch the app's language (e.g. "Urdu me baat karo", "Hindi mein bolo", "Speak in Turkish"), you MUST call `switch_app_language` with the right code (`en`, `ur`, `hi`, `ar`, `fr`, `es`, `tr`), AND reply in that requested language!
                    2. AGENTIC TOOLS:
                       - For alarms ("Set alarm for 7 AM", "Kal subah 6 baje alarm laga do"), ALWAYS call `set_alarm`.
                       - For recurring interval reminders ("Remind me to drink water every 2 hours"), ALWAYS call `set_recurring_reminder`.
                       - For live facts, weather, news, scores, or web info, ALWAYS call `search_google`.
                       - For places, restaurants, directions, or anything involving locations/maps, ALWAYS call `search_google_maps`.
                    3. STYLE:
                       - Be concise, joyful, caring, and practical. Use a touch of star/purple companion warmth without clutter.
                    """.trimIndent()
                )
            }
        )

    suspend fun runAgentTurn(
        userMessage: String,
        history: List<ChatMessageEntity>,
        activeLanguage: AppLanguage,
        autoDetect: Boolean,
        defaultSound: String,
        onToolThinking: (String) -> Unit
    ): AgentResult {
        return withTimeout(60_000L) {
            val model = buildAgentModel(activeLanguage, autoDetect)
            val chatHistory: List<Content> = history.takeLast(12).map { msg ->
                content(role = if (msg.isUser) "user" else "model") {
                    text(msg.text)
                }
            }
            val chat = model.startChat(history = chatHistory)

            var response = chat.sendMessage(userMessage)
            val toolsUsed = mutableListOf<String>()
            val groundingSources = mutableListOf<GroundingSource>()
            var mapQuery: String? = null
            var alarmDraft: PendingAlarmDraft? = null
            var switchedLanguage: AppLanguage? = null

            var iterations = 0
            while (response.functionCalls.isNotEmpty() && iterations < 4) {
                iterations++
                val responseParts = mutableListOf<FunctionResponsePart>()

                for (call in response.functionCalls) {
                    Log.d(TAG, "Executing tool: ${call.name} args=${call.args}")
                    when (call.name) {
                        "set_alarm" -> {
                            toolsUsed.add("Alarm")
                            onToolThinking("Alarm")
                            val hour = call.args["hour"]?.jsonPrimitive?.intOrNull ?: 7
                            val minute = call.args["minute"]?.jsonPrimitive?.intOrNull ?: 0
                            val label = call.args["label"]?.jsonPrimitive?.contentOrNull
                                ?: "HelpMate Alarm"
                            val repeatDays = call.args["repeat_days"]?.jsonPrimitive?.contentOrNull
                                ?: "Once"
                            val sound = call.args["sound"]?.jsonPrimitive?.contentOrNull
                                ?: defaultSound

                            alarmDraft = PendingAlarmDraft(
                                title = label,
                                hour = hour.coerceIn(0, 23),
                                minute = minute.coerceIn(0, 59),
                                repeatDaysCsv = repeatDays,
                                soundName = sound,
                                isReminder = false,
                                intervalHours = 0
                            )

                            responseParts.add(
                                FunctionResponsePart(
                                    name = call.name,
                                    response = JsonObject(
                                        mapOf(
                                            "status" to JsonPrimitive("alarm_card_ready"),
                                            "hour" to JsonPrimitive(alarmDraft.hour),
                                            "minute" to JsonPrimitive(alarmDraft.minute),
                                            "label" to JsonPrimitive(alarmDraft.title),
                                            "repeat_days" to JsonPrimitive(alarmDraft.repeatDaysCsv),
                                            "sound" to JsonPrimitive(alarmDraft.soundName)
                                        )
                                    )
                                )
                            )
                        }

                        "set_recurring_reminder" -> {
                            toolsUsed.add("Reminder")
                            onToolThinking("Reminder")
                            val title = call.args["title"]?.jsonPrimitive?.contentOrNull
                                ?: "Drink Water"
                            val intervalHours = (call.args["interval_hours"]?.jsonPrimitive?.intOrNull ?: 2)
                                .coerceIn(1, 24)

                            alarmDraft = PendingAlarmDraft(
                                title = title,
                                hour = 9,
                                minute = 0,
                                repeatDaysCsv = "Daily",
                                soundName = defaultSound,
                                isReminder = true,
                                intervalHours = intervalHours
                            )

                            responseParts.add(
                                FunctionResponsePart(
                                    name = call.name,
                                    response = JsonObject(
                                        mapOf(
                                            "status" to JsonPrimitive("reminder_card_ready"),
                                            "title" to JsonPrimitive(title),
                                            "interval_hours" to JsonPrimitive(intervalHours)
                                        )
                                    )
                                )
                            )
                        }

                        "search_google" -> {
                            toolsUsed.add("Google Search")
                            onToolThinking("Google Search")
                            val query = call.args["query"]?.jsonPrimitive?.contentOrNull ?: userMessage
                            val searchResult = executeGroundedSearch(query)
                            groundingSources.addAll(searchResult.second)
                            responseParts.add(
                                FunctionResponsePart(
                                    name = call.name,
                                    response = JsonObject(
                                        mapOf(
                                            "query" to JsonPrimitive(query),
                                            "summary" to JsonPrimitive(searchResult.first),
                                            "sources_count" to JsonPrimitive(searchResult.second.size)
                                        )
                                    )
                                )
                            )
                        }

                        "search_google_maps" -> {
                            toolsUsed.add("Google Maps")
                            onToolThinking("Google Maps")
                            val placeQuery = call.args["place_query"]?.jsonPrimitive?.contentOrNull
                                ?: userMessage
                            mapQuery = placeQuery
                            val searchResult = executeGroundedSearch(
                                "Find top places, address highlights, and helpful tips for: $placeQuery"
                            )
                            groundingSources.addAll(searchResult.second)
                            responseParts.add(
                                FunctionResponsePart(
                                    name = call.name,
                                    response = JsonObject(
                                        mapOf(
                                            "place_query" to JsonPrimitive(placeQuery),
                                            "maps_card_attached" to JsonPrimitive(true),
                                            "place_info" to JsonPrimitive(searchResult.first)
                                        )
                                    )
                                )
                            )
                        }

                        "switch_app_language" -> {
                            toolsUsed.add("Language")
                            onToolThinking("Language")
                            val code = call.args["language_code"]?.jsonPrimitive?.contentOrNull ?: "en"
                            val target = AppLanguage.fromCode(code)
                            switchedLanguage = target
                            responseParts.add(
                                FunctionResponsePart(
                                    name = call.name,
                                    response = JsonObject(
                                        mapOf(
                                            "status" to JsonPrimitive("language_switched"),
                                            "new_language" to JsonPrimitive(target.englishName),
                                            "code" to JsonPrimitive(target.code)
                                        )
                                    )
                                )
                            )
                        }
                    }
                }

                response = chat.sendMessage(
                    content(role = "function") {
                        responseParts.forEach { part(it) }
                    }
                )
            }

            val finalText = response.text?.trim().orEmpty().ifEmpty {
                "✨ Done!"
            }

            AgentResult(
                replyText = finalText,
                toolsUsed = toolsUsed.distinct(),
                groundingSources = groundingSources.distinctBy { it.uri }.take(4),
                mapQuery = mapQuery,
                alarmDraft = alarmDraft,
                switchedLanguage = switchedLanguage
            )
        }
    }

    private suspend fun executeGroundedSearch(query: String): Pair<String, List<GroundingSource>> {
        return try {
            val response = searchGroundedModel.generateContent(query)
            val text = response.text.orEmpty().ifBlank { "No live summary returned." }
            val sources = mutableListOf<GroundingSource>()
            val metadata = response.candidates.firstOrNull()?.groundingMetadata
            metadata?.groundingChunks?.forEach { chunk ->
                val web = chunk.web
                val uri = web?.uri
                val title = web?.title ?: uri
                if (!uri.isNullOrBlank() && !title.isNullOrBlank()) {
                    sources.add(GroundingSource(title = title, uri = uri))
                }
            }
            text to sources
        } catch (e: CancellationException) {
            throw e
        } catch (e: TimeoutCancellationException) {
            throw e
        } catch (e: Exception) {
            Log.e(TAG, "Google Search grounding error", e)
            "Search encountered an issue: ${e.localizedMessage ?: "unknown error"}" to emptyList()
        }
    }
}
