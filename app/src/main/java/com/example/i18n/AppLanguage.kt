package com.example.i18n

import java.util.Locale

enum class AppLanguage(
    val code: String,
    val englishName: String,
    val nativeName: String,
    val flagEmoji: String,
    val isRtl: Boolean,
    val speechLocaleTag: String
) {
    ENGLISH("en", "English", "English", "🇬🇧", false, "en-US"),
    URDU("ur", "Urdu", "اردو", "🇵🇰", true, "ur-PK"),
    HINDI("hi", "Hindi", "हिन्दी", "🇮🇳", false, "hi-IN"),
    ARABIC("ar", "Arabic", "العربية", "🇸🇦", true, "ar-SA"),
    FRENCH("fr", "French", "Français", "🇫🇷", false, "fr-FR"),
    SPANISH("es", "Spanish", "Español", "🇪🇸", false, "es-ES"),
    TURKISH("tr", "Turkish", "Türkçe", "🇹🇷", false, "tr-TR");

    companion object {
        fun fromCode(code: String?): AppLanguage {
            val normalized = code?.trim()?.lowercase(Locale.ROOT) ?: return ENGLISH
            return entries.firstOrNull {
                it.code == normalized ||
                    it.englishName.lowercase(Locale.ROOT) == normalized
            } ?: ENGLISH
        }

        /**
         * Detects explicit switch-language commands or script cues locally for instant responsiveness.
         */
        fun detectRequestedSwitch(text: String): AppLanguage? {
            val lower = text.lowercase(Locale.ROOT)
            val switchKeywords = listOf(
                "baat karo", "bolo", "speak in", "switch to", "change language",
                "talk in", "reply in", "use ", "parle", "habla", "konuş", "بات کرو",
                "बोलो", "تحدث", "بالعربية", "اردو میں"
            )
            val hasSwitchIntent = switchKeywords.any { lower.contains(it) }
            if (!hasSwitchIntent) return null

            return when {
                lower.contains("urdu") || lower.contains("اردو") -> URDU
                lower.contains("hindi") || lower.contains("हिन्दी") || lower.contains("हिंदी") -> HINDI
                lower.contains("arabic") || lower.contains("arabi") || lower.contains("عربي") || lower.contains("العربية") -> ARABIC
                lower.contains("french") || lower.contains("français") || lower.contains("francais") -> FRENCH
                lower.contains("spanish") || lower.contains("español") || lower.contains("espanol") -> SPANISH
                lower.contains("turkish") || lower.contains("türkçe") || lower.contains("turkce") -> TURKISH
                lower.contains("english") || lower.contains("angrezi") -> ENGLISH
                else -> null
            }
        }
    }
}
