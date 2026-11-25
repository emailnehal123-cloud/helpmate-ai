package com.example.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowForward
import androidx.compose.material.icons.rounded.AlarmAdd
import androidx.compose.material.icons.rounded.LocationOn
import androidx.compose.material.icons.rounded.Public
import androidx.compose.material.icons.rounded.Translate
import androidx.compose.material.icons.rounded.WaterDrop
import androidx.compose.material.icons.rounded.WbSunny
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.R
import com.example.i18n.UiStrings
import com.example.ui.theme.HelpMateHeroGradient
import com.example.ui.theme.IndigoElectric
import com.example.ui.theme.LavenderBorder
import com.example.ui.theme.LavenderSoft
import com.example.ui.theme.MintSuccess
import com.example.ui.theme.PurpleVibrant
import com.example.ui.theme.StarlightGold

private data class DiscoverPromptItem(
    val id: String,
    val title: String,
    val subtitle: String,
    val badge: String,
    val prompt: String,
    val icon: ImageVector,
    val accentColor: Color
)

@Composable
fun DiscoverScreen(
    strings: UiStrings,
    onRunPromptInChat: (String) -> Unit
) {
    val items = listOf(
        DiscoverPromptItem(
            id = "alarm_urdu",
            title = "Morning Alarm (Roman Urdu)",
            subtitle = "Kal subah 6 baje alarm laga do",
            badge = "Alarm Tool",
            prompt = "Kal subah 6 baje alarm laga do",
            icon = Icons.Rounded.AlarmAdd,
            accentColor = PurpleVibrant
        ),
        DiscoverPromptItem(
            id = "water_reminder",
            title = "Hydration Habit",
            subtitle = "Remind me to drink water every 2 hours",
            badge = "Reminder",
            prompt = "Remind me to drink water every 2 hours",
            icon = Icons.Rounded.WaterDrop,
            accentColor = Color(0xFF0EA5E9)
        ),
        DiscoverPromptItem(
            id = "maps_biryani",
            title = "Nearby Food on Maps",
            subtitle = "Find top rated biryani restaurants near me",
            badge = "Google Maps",
            prompt = "Find top rated biryani restaurants near me on Google Maps",
            icon = Icons.Rounded.LocationOn,
            accentColor = MintSuccess
        ),
        DiscoverPromptItem(
            id = "google_search",
            title = "Live Google Search",
            subtitle = "Latest technology & AI news today",
            badge = "Google Search",
            prompt = "Search Google for today's top technology and AI news",
            icon = Icons.Rounded.Public,
            accentColor = IndigoElectric
        ),
        DiscoverPromptItem(
            id = "urdu_switch",
            title = "Switch to Urdu Mode",
            subtitle = "Urdu me baat karo — instant UI switch",
            badge = "Language",
            prompt = "Urdu me baat karo",
            icon = Icons.Rounded.Translate,
            accentColor = Color(0xFFD97706)
        ),
        DiscoverPromptItem(
            id = "weather_check",
            title = "Weather & Outfit Tip",
            subtitle = "Aaj Karachi ka mausam kaisa hai?",
            badge = "Google Search",
            prompt = "Aaj Karachi ka mausam kaisa hai?",
            icon = Icons.Rounded.WbSunny,
            accentColor = Color(0xFFEC4899)
        )
    )

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(26.dp))
                    .background(HelpMateHeroGradient)
                    .padding(20.dp)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Surface(
                            color = Color.White.copy(alpha = 0.2f),
                            shape = RoundedCornerShape(50)
                        ) {
                            Text(
                                text = "✨ HelpMate Agent Tools",
                                style = MaterialTheme.typography.labelMedium,
                                color = StarlightGold,
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                            )
                        }
                        Spacer(modifier = Modifier.height(10.dp))
                        Text(
                            text = strings.discoverTitle,
                            style = MaterialTheme.typography.headlineLarge,
                            color = Color.White
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = strings.discoverSubtitle,
                            style = MaterialTheme.typography.bodyMedium,
                            color = Color.White.copy(alpha = 0.88f)
                        )
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Image(
                        painter = painterResource(id = R.drawable.img_helpmate_mascot),
                        contentDescription = "HelpMate Mascot",
                        contentScale = ContentScale.Crop,
                        modifier = Modifier
                            .size(72.dp)
                            .clip(CircleShape)
                    )
                }
            }
        }

        items(items, key = { it.id }) { item ->
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(22.dp))
                    .clickable { onRunPromptInChat(item.prompt) }
                    .testTag("discover_card_${item.id}"),
                shape = RoundedCornerShape(22.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                border = BorderStroke(1.dp, LavenderBorder),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(48.dp)
                            .clip(RoundedCornerShape(16.dp))
                            .background(item.accentColor.copy(alpha = 0.14f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = item.icon,
                            contentDescription = item.title,
                            tint = item.accentColor,
                            modifier = Modifier.size(26.dp)
                        )
                    }

                    Spacer(modifier = Modifier.width(14.dp))

                    Column(modifier = Modifier.weight(1f)) {
                        Surface(
                            color = LavenderSoft,
                            shape = RoundedCornerShape(50)
                        ) {
                            Text(
                                text = item.badge,
                                style = MaterialTheme.typography.labelSmall,
                                color = PurpleVibrant,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                            )
                        }
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = item.title,
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = item.subtitle,
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }

                    Icon(
                        imageVector = Icons.AutoMirrored.Rounded.ArrowForward,
                        contentDescription = "Try",
                        tint = PurpleVibrant,
                        modifier = Modifier.size(22.dp)
                    )
                }
            }
        }
    }
}
