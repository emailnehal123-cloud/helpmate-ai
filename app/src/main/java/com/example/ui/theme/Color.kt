package com.example.ui.theme

import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color

val IndigoDeep = Color(0xFF2E1065)
val PurpleVibrant = Color(0xFF6D28D9)
val PurpleBright = Color(0xFF8B5CF6)
val IndigoElectric = Color(0xFF4F46E5)
val LavenderSoft = Color(0xFFEDE9FE)
val LavenderMist = Color(0xFFF7F5FF)
val LavenderBorder = Color(0xFFDDD6FE)
val StarlightGold = Color(0xFFFBBF24)
val StarlightSoft = Color(0xFFFEF3C7)
val MintSuccess = Color(0xFF10B981)
val MintSoft = Color(0xFFD1FAE5)
val CoralError = Color(0xFFEF4444)

// Dark Theme Colors
val DarkNightBg = Color(0xFF130926)
val DarkSurfaceCard = Color(0xFF1E1138)
val DarkSurfaceVariant = Color(0xFF2B194D)
val LavenderLight = Color(0xFFC4B5FD)
val TextDarkPrimary = Color(0xFF1E103C)
val TextDarkSecondary = Color(0xFF5B4D7A)
val TextLightPrimary = Color(0xFFF5F3FF)
val TextLightSecondary = Color(0xFFC4B5FD)

val HelpMateHeroGradient = Brush.linearGradient(
    colors = listOf(IndigoDeep, PurpleVibrant, IndigoElectric)
)

val HelpMatePillGradient = Brush.horizontalGradient(
    colors = listOf(PurpleVibrant, IndigoElectric)
)

val HelpMateSoftGradient = Brush.verticalGradient(
    colors = listOf(LavenderSoft, Color.White)
)
