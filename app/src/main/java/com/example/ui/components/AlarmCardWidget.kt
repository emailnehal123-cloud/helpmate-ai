package com.example.ui.components

import android.widget.Toast
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Alarm
import androidx.compose.material.icons.rounded.CheckCircle
import androidx.compose.material.icons.rounded.MusicNote
import androidx.compose.material.icons.rounded.NotificationsActive
import androidx.compose.material.icons.rounded.Repeat
import androidx.compose.material.icons.rounded.WaterDrop
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.data.local.AlarmReminderEntity
import com.example.i18n.UiStrings
import com.example.system.AlarmClockHelper
import com.example.ui.theme.HelpMatePillGradient
import com.example.ui.theme.LavenderBorder
import com.example.ui.theme.LavenderSoft
import com.example.ui.theme.MintSoft
import com.example.ui.theme.MintSuccess
import com.example.ui.theme.PurpleVibrant

@Composable
fun AlarmCardWidget(
    alarm: AlarmReminderEntity,
    strings: UiStrings,
    onSaveAlarm: (repeatDaysCsv: String, soundName: String, launchClock: Boolean) -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    var selectedDays by remember(alarm.id, alarm.repeatDaysCsv) {
        val initial = alarm.repeatDaysCsv.split(",")
            .map { it.trim() }
            .filter { it.isNotEmpty() && it != "Once" }
            .toSet()
        mutableStateOf(
            if (alarm.repeatDaysCsv.equals("Daily", ignoreCase = true)) {
                AlarmClockHelper.weekDays.toSet()
            } else {
                initial
            }
        )
    }
    var selectedSound by remember(alarm.id, alarm.soundName) {
        mutableStateOf(alarm.soundName.ifBlank { AlarmClockHelper.availableSounds.first() })
    }

    Card(
        modifier = modifier
            .fillMaxWidth()
            .testTag("alarm_card_${alarm.id}"),
        shape = RoundedCornerShape(22.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.2.dp, LavenderBorder),
        elevation = CardDefaults.cardElevation(defaultElevation = 3.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(40.dp)
                            .clip(CircleShape)
                            .background(HelpMatePillGradient),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = if (alarm.isReminder) Icons.Rounded.WaterDrop else Icons.Rounded.Alarm,
                            contentDescription = alarm.title,
                            tint = Color.White,
                            modifier = Modifier.size(22.dp)
                        )
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text(
                            text = if (alarm.isReminder) strings.reminderCardTitle else strings.alarmCardTitle,
                            style = MaterialTheme.typography.labelMedium,
                            color = PurpleVibrant
                        )
                        Text(
                            text = alarm.title,
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }

                if (alarm.isSavedToClock || alarm.isReminder) {
                    Surface(
                        color = MintSoft,
                        shape = RoundedCornerShape(50)
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                imageVector = Icons.Rounded.CheckCircle,
                                contentDescription = strings.savedBadge,
                                tint = MintSuccess,
                                modifier = Modifier.size(14.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = strings.savedBadge,
                                style = MaterialTheme.typography.labelSmall,
                                color = MintSuccess
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            Text(
                text = if (alarm.isReminder) {
                    String.format(strings.everyHoursTemplate, alarm.intervalHours.coerceAtLeast(1))
                } else {
                    AlarmClockHelper.formatTime12Hour(alarm.hour, alarm.minute)
                },
                style = MaterialTheme.typography.displayLarge,
                color = MaterialTheme.colorScheme.primary
            )

            Spacer(modifier = Modifier.height(12.dp))

            // Repeat selector row
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = Icons.Rounded.Repeat,
                    contentDescription = strings.repeatLabel,
                    tint = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.size(16.dp)
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = strings.repeatLabel,
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            Spacer(modifier = Modifier.height(6.dp))
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                AlarmClockHelper.weekDays.forEach { day ->
                    val isSelected = selectedDays.contains(day)
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = if (isSelected) PurpleVibrant else LavenderSoft,
                        modifier = Modifier
                            .clip(RoundedCornerShape(12.dp))
                            .clickable {
                                selectedDays = if (isSelected) selectedDays - day else selectedDays + day
                            }
                    ) {
                        Text(
                            text = day,
                            style = MaterialTheme.typography.labelMedium,
                            color = if (isSelected) Color.White else PurpleVibrant,
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Sound selector row
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = Icons.Rounded.MusicNote,
                    contentDescription = strings.soundLabel,
                    tint = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.size(16.dp)
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = strings.soundLabel,
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            Spacer(modifier = Modifier.height(6.dp))
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                AlarmClockHelper.availableSounds.forEach { sound ->
                    val isSelected = selectedSound == sound
                    Surface(
                        shape = RoundedCornerShape(50),
                        color = if (isSelected) MaterialTheme.colorScheme.secondary else LavenderSoft,
                        modifier = Modifier
                            .clip(RoundedCornerShape(50))
                            .clickable { selectedSound = sound }
                    ) {
                        Text(
                            text = sound,
                            style = MaterialTheme.typography.labelMedium,
                            color = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurface,
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            val repeatCsv = if (selectedDays.isEmpty()) "Once" else selectedDays.joinToString(",")
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Button(
                    onClick = {
                        onSaveAlarm(repeatCsv, selectedSound, !alarm.isReminder)
                        Toast.makeText(
                            context,
                            if (alarm.isReminder) "Reminder active!" else "Alarm saved!",
                            Toast.LENGTH_SHORT
                        ).show()
                    },
                    shape = RoundedCornerShape(50),
                    colors = ButtonDefaults.buttonColors(containerColor = PurpleVibrant),
                    modifier = Modifier
                        .weight(1f)
                        .height(48.dp)
                        .testTag("save_alarm_button_${alarm.id}")
                ) {
                    Icon(
                        imageVector = Icons.Rounded.NotificationsActive,
                        contentDescription = null,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(strings.saveAlarmButton)
                }

                if (!alarm.isReminder) {
                    OutlinedButton(
                        onClick = {
                            val launched = AlarmClockHelper.launchSystemAlarmIntent(
                                context = context,
                                hour = alarm.hour,
                                minute = alarm.minute,
                                label = alarm.title,
                                repeatDaysCsv = repeatCsv
                            )
                            if (!launched) {
                                Toast.makeText(
                                    context,
                                    "Saved locally (no Clock app on this device)",
                                    Toast.LENGTH_SHORT
                                ).show()
                            }
                        },
                        shape = RoundedCornerShape(50),
                        border = BorderStroke(1.dp, PurpleVibrant),
                        modifier = Modifier.height(48.dp)
                    ) {
                        Text(strings.openClockButton, color = PurpleVibrant)
                    }
                }
            }
        }
    }
}
