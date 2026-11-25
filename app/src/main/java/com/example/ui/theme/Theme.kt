package com.example.ui.theme

import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp

private val HelpMateDarkColorScheme = darkColorScheme(
    primary = PurpleBright,
    onPrimary = Color.White,
    primaryContainer = DarkSurfaceVariant,
    onPrimaryContainer = LavenderLight,
    secondary = IndigoElectric,
    onSecondary = Color.White,
    secondaryContainer = DarkSurfaceVariant,
    onSecondaryContainer = LavenderSoft,
    tertiary = StarlightGold,
    onTertiary = IndigoDeep,
    background = DarkNightBg,
    onBackground = TextLightPrimary,
    surface = DarkSurfaceCard,
    onSurface = TextLightPrimary,
    surfaceVariant = DarkSurfaceVariant,
    onSurfaceVariant = TextLightSecondary,
    outline = Color(0xFF4C3575)
)

private val HelpMateLightColorScheme = lightColorScheme(
    primary = PurpleVibrant,
    onPrimary = Color.White,
    primaryContainer = LavenderSoft,
    onPrimaryContainer = IndigoDeep,
    secondary = IndigoElectric,
    onSecondary = Color.White,
    secondaryContainer = Color(0xFFE0E7FF),
    onSecondaryContainer = Color(0xFF1E1B4B),
    tertiary = StarlightGold,
    onTertiary = IndigoDeep,
    background = LavenderMist,
    onBackground = TextDarkPrimary,
    surface = Color.White,
    onSurface = TextDarkPrimary,
    surfaceVariant = LavenderSoft,
    onSurfaceVariant = TextDarkSecondary,
    outline = LavenderBorder
)

val HelpMateShapes = Shapes(
    extraSmall = RoundedCornerShape(10.dp),
    small = RoundedCornerShape(14.dp),
    medium = RoundedCornerShape(20.dp),
    large = RoundedCornerShape(26.dp),
    extraLarge = RoundedCornerShape(32.dp)
)

@Composable
fun HelpMateTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = false,
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }
        darkTheme -> HelpMateDarkColorScheme
        else -> HelpMateLightColorScheme
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = HelpMateTypography,
        shapes = HelpMateShapes,
        content = content
    )
}
