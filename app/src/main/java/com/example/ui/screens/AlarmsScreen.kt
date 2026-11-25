package com.example.ui.screens

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Add
import androidx.compose.material.icons.rounded.Alarm
import androidx.compose.material.icons.rounded.DeleteOutline
import androidx.compose.material.icons.rounded.OpenInNew
import androidx.compose.material.icons.rounded.WaterDrop
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TimePicker
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.material3.rememberTimePickerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
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
import androidx.core.content.ContextCompat
import com.example.data.local.AlarmReminderEntity
import com.example.i18n.UiStrings
import com.example.system.AlarmClockHelper
import com.example.ui.theme.CoralError
import com.example.ui.theme.HelpMateHeroGradient
import com.example.ui.theme.HelpMatePillGradient
import com.example.ui.theme.LavenderBorder
import com.example.ui.theme.LavenderSoft
import com.example.ui.theme.PurpleVibrant

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AlarmsScreen(
    alarms: List<AlarmReminderEntity>,
    defaultSound: String,
    strings: UiStrings,
    onCreateAlarm: (
        title: String,
        hour: Int,
        minute: Int,
        repeatDaysCsv: String,
        soundName: String,
        isReminder: Boolean,
        intervalHours: Int,
        launchClockApp: Boolean
    ) -> Unit,
    onToggleAlarm: (AlarmReminderEntity, Boolean) -> Unit,
    onDeleteAlarm: (AlarmReminderEntity) -> Unit
) {
    val context = LocalContext.current
    var showCreateSheet by remember { mutableStateOf(false) }

    val notificationPermissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { granted ->
        if (!granted) {
            Toast.makeText(
                context,
                "Reminder saved! Enable notifications in settings to see alerts.",
                Toast.LENGTH_SHORT
            ).show()
        }
    }

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showCreateSheet = true },
                containerColor = PurpleVibrant,
                contentColor = Color.White,
                shape = CircleShape,
                modifier = Modifier.testTag("add_alarm_fab")
            ) {
                Icon(imageVector = Icons.Rounded.Add, contentDescription = strings.addAlarmButton)
            }
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
                .padding(innerPadding)
        ) {
            // Gradient Header
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(HelpMateHeroGradient)
                    .padding(horizontal = 20.dp, vertical = 18.dp)
            ) {
                Column {
                    Text(
                        text = strings.alarmsScreenTitle,
                        style = MaterialTheme.typography.headlineLarge,
                        color = Color.White
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = strings.alarmsScreenSubtitle,
                        style = MaterialTheme.typography.bodyMedium,
                        color = Color.White.copy(alpha = 0.86f)
                    )
                }
            }

            if (alarms.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(32.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Box(
                            modifier = Modifier
                                .size(82.dp)
                                .clip(CircleShape)
                                .background(LavenderSoft),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Rounded.Alarm,
                                contentDescription = null,
                                tint = PurpleVibrant,
                                modifier = Modifier.size(42.dp)
                            )
                        }
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = strings.noAlarmsTitle,
                            style = MaterialTheme.typography.titleLarge
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = strings.noAlarmsSubtitle,
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(alarms, key = { it.id }) { item ->
                        SavedAlarmRowCard(
                            item = item,
                            strings = strings,
                            onToggle = { enabled -> onToggleAlarm(item, enabled) },
                            onOpenClock = {
                                val launched = AlarmClockHelper.launchSystemAlarmIntent(
                                    context = context,
                                    hour = item.hour,
                                    minute = item.minute,
                                    label = item.title,
                                    repeatDaysCsv = item.repeatDaysCsv
                                )
                                if (!launched) {
                                    Toast.makeText(
                                        context,
                                        "No system Clock app found on this device",
                                        Toast.LENGTH_SHORT
                                    ).show()
                                }
                            },
                            onDelete = { onDeleteAlarm(item) }
                        )
                    }
                }
            }
        }

        if (showCreateSheet) {
            val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
            val timeState = rememberTimePickerState(initialHour = 7, initialMinute = 0, is24Hour = false)
            var title by remember { mutableStateOf("") }
            var isReminder by remember { mutableStateOf(false) }
            var intervalHours by remember { mutableIntStateOf(2) }
            var selectedDays by remember { mutableStateOf(setOf<String>()) }
            var selectedSound by remember { mutableStateOf(defaultSound) }

            ModalBottomSheet(
                onDismissRequest = { showCreateSheet = false },
                sheetState = sheetState,
                containerColor = MaterialTheme.colorScheme.surface
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .verticalScroll(rememberScrollState())
                        .padding(horizontal = 20.dp, vertical = 12.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = strings.addAlarmButton,
                        style = MaterialTheme.typography.headlineMedium
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    // Toggle Alarm vs Recurring Reminder
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Surface(
                            color = if (!isReminder) PurpleVibrant else LavenderSoft,
                            shape = RoundedCornerShape(50),
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(50))
                                .clickable { isReminder = false }
                        ) {
                            Text(
                                text = "⏰ Alarm",
                                color = if (!isReminder) Color.White else PurpleVibrant,
                                style = MaterialTheme.typography.labelLarge,
                                modifier = Modifier.padding(vertical = 10.dp, horizontal = 16.dp)
                            )
                        }
                        Surface(
                            color = if (isReminder) PurpleVibrant else LavenderSoft,
                            shape = RoundedCornerShape(50),
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(50))
                                .clickable { isReminder = true }
                        ) {
                            Text(
                                text = "💧 Reminder",
                                color = if (isReminder) Color.White else PurpleVibrant,
                                style = MaterialTheme.typography.labelLarge,
                                modifier = Modifier.padding(vertical = 10.dp, horizontal = 16.dp)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    OutlinedTextField(
                        value = title,
                        onValueChange = { title = it },
                        label = { Text(if (isReminder) "Reminder (e.g. Drink Water)" else "Alarm Label") },
                        singleLine = true,
                        shape = RoundedCornerShape(18.dp),
                        modifier = Modifier.fillMaxWidth()
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    if (isReminder) {
                        Text(
                            text = String.format(strings.everyHoursTemplate, intervalHours),
                            style = MaterialTheme.typography.titleMedium,
                            color = PurpleVibrant
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            listOf(1, 2, 3, 4, 6).forEach { hrs ->
                                Surface(
                                    shape = RoundedCornerShape(50),
                                    color = if (intervalHours == hrs) PurpleVibrant else LavenderSoft,
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(50))
                                        .clickable { intervalHours = hrs }
                                ) {
                                    Text(
                                        text = "${hrs}h",
                                        color = if (intervalHours == hrs) Color.White else PurpleVibrant,
                                        style = MaterialTheme.typography.labelLarge,
                                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                                    )
                                }
                            }
                        }
                    } else {
                        TimePicker(state = timeState)
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        AlarmClockHelper.weekDays.forEach { day ->
                            val active = selectedDays.contains(day)
                            Surface(
                                shape = RoundedCornerShape(12.dp),
                                color = if (active) PurpleVibrant else LavenderSoft,
                                modifier = Modifier
                                    .clip(RoundedCornerShape(12.dp))
                                    .clickable {
                                        selectedDays = if (active) selectedDays - day else selectedDays + day
                                    }
                            ) {
                                Text(
                                    text = day,
                                    color = if (active) Color.White else PurpleVibrant,
                                    style = MaterialTheme.typography.labelMedium,
                                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        AlarmClockHelper.availableSounds.forEach { sound ->
                            val active = selectedSound == sound
                            Surface(
                                shape = RoundedCornerShape(50),
                                color = if (active) MaterialTheme.colorScheme.secondary else LavenderSoft,
                                modifier = Modifier
                                    .clip(RoundedCornerShape(50))
                                    .clickable { selectedSound = sound }
                            ) {
                                Text(
                                    text = sound,
                                    color = if (active) Color.White else MaterialTheme.colorScheme.onSurface,
                                    style = MaterialTheme.typography.labelMedium,
                                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(20.dp))

                    Button(
                        onClick = {
                            if (isReminder && Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                                val hasNotif = ContextCompat.checkSelfPermission(
                                    context,
                                    Manifest.permission.POST_NOTIFICATIONS
                                ) == PackageManager.PERMISSION_GRANTED
                                if (!hasNotif) {
                                    notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
                                }
                            }
                            val repeatCsv = if (selectedDays.isEmpty()) "Once" else selectedDays.joinToString(",")
                            onCreateAlarm(
                                title,
                                timeState.hour,
                                timeState.minute,
                                repeatCsv,
                                selectedSound,
                                isReminder,
                                intervalHours,
                                !isReminder
                            )
                            showCreateSheet = false
                        },
                        shape = RoundedCornerShape(50),
                        colors = ButtonDefaults.buttonColors(containerColor = PurpleVibrant),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(52.dp)
                            .testTag("confirm_create_alarm_button")
                    ) {
                        Text(strings.saveAlarmButton, color = Color.White)
                    }
                    Spacer(modifier = Modifier.height(20.dp))
                }
            }
        }
    }
}

@Composable
private fun SavedAlarmRowCard(
    item: AlarmReminderEntity,
    strings: UiStrings,
    onToggle: (Boolean) -> Unit,
    onOpenClock: () -> Unit,
    onDelete: () -> Unit
) {
    Card(
        shape = RoundedCornerShape(22.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, LavenderBorder),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(46.dp)
                    .clip(CircleShape)
                    .background(HelpMatePillGradient),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = if (item.isReminder) Icons.Rounded.WaterDrop else Icons.Rounded.Alarm,
                    contentDescription = item.title,
                    tint = Color.White
                )
            }

            Spacer(modifier = Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = if (item.isReminder) {
                        String.format(strings.everyHoursTemplate, item.intervalHours.coerceAtLeast(1))
                    } else {
                        AlarmClockHelper.formatTime12Hour(item.hour, item.minute)
                    },
                    style = MaterialTheme.typography.headlineMedium,
                    color = MaterialTheme.colorScheme.primary
                )
                Text(
                    text = item.title,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold
                )
                Text(
                    text = "${item.repeatDaysCsv} • ${item.soundName}",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            Column(horizontalAlignment = Alignment.End) {
                Switch(
                    checked = item.isEnabled,
                    onCheckedChange = onToggle
                )
                Row {
                    if (!item.isReminder) {
                        IconButton(onClick = onOpenClock) {
                            Icon(
                                imageVector = Icons.Rounded.OpenInNew,
                                contentDescription = strings.openClockButton,
                                tint = PurpleVibrant
                            )
                        }
                    }
                    IconButton(onClick = onDelete) {
                        Icon(
                            imageVector = Icons.Rounded.DeleteOutline,
                            contentDescription = "Delete",
                            tint = CoralError
                        )
                    }
                }
            }
        }
    }
}
