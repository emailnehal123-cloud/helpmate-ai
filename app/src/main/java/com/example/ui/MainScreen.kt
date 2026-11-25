package com.example.ui

import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Alarm
import androidx.compose.material.icons.outlined.ChatBubbleOutline
import androidx.compose.material.icons.outlined.Explore
import androidx.compose.material.icons.outlined.PersonOutline
import androidx.compose.material.icons.rounded.Alarm
import androidx.compose.material.icons.rounded.ChatBubble
import androidx.compose.material.icons.rounded.Explore
import androidx.compose.material.icons.rounded.Person
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.NavigationRail
import androidx.compose.material3.NavigationRailItem
import androidx.compose.material3.NavigationRailItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.example.i18n.LocalizedStrings
import com.example.ui.screens.AlarmsScreen
import com.example.ui.screens.ChatScreen
import com.example.ui.screens.DiscoverScreen
import com.example.ui.screens.OnboardingScreen
import com.example.ui.screens.ProfileScreen
import com.example.ui.theme.LavenderSoft
import com.example.ui.theme.PurpleVibrant

private sealed class NavTab(
    val route: String,
    val selectedIcon: ImageVector,
    val unselectedIcon: ImageVector
) {
    data object Chat : NavTab("chat", Icons.Rounded.ChatBubble, Icons.Outlined.ChatBubbleOutline)
    data object Alarms : NavTab("alarms", Icons.Rounded.Alarm, Icons.Outlined.Alarm)
    data object Discover : NavTab("discover", Icons.Rounded.Explore, Icons.Outlined.Explore)
    data object Profile : NavTab("profile", Icons.Rounded.Person, Icons.Outlined.PersonOutline)
}

@Composable
fun HelpMateApp(viewModel: HelpMateViewModel) {
    val prefs by viewModel.preferences.collectAsStateWithLifecycle()
    val alarms by viewModel.alarmsAndReminders.collectAsStateWithLifecycle()
    val messages by viewModel.chatMessages.collectAsStateWithLifecycle()
    val agentState by viewModel.agentState.collectAsStateWithLifecycle()

    val strings = LocalizedStrings.get(prefs.language)
    val layoutDirection = if (prefs.language.isRtl) LayoutDirection.Rtl else LayoutDirection.Ltr

    CompositionLocalProvider(LocalLayoutDirection provides layoutDirection) {
        if (!prefs.hasCompletedOnboarding) {
            OnboardingScreen(
                selectedLanguage = prefs.language,
                onSelectLanguage = { viewModel.setLanguage(it) },
                onCompleteOnboarding = { viewModel.completeOnboarding(it) }
            )
        } else {
            val navController = rememberNavController()
            val navBackStackEntry by navController.currentBackStackEntryAsState()
            val currentRoute = navBackStackEntry?.destination?.route ?: NavTab.Chat.route
            val tabs = listOf(NavTab.Chat, NavTab.Alarms, NavTab.Discover, NavTab.Profile)

            fun labelFor(tab: NavTab): String = when (tab) {
                NavTab.Chat -> strings.navChat
                NavTab.Alarms -> strings.navAlarms
                NavTab.Discover -> strings.navDiscover
                NavTab.Profile -> strings.navProfile
            }

            fun navigateToTab(route: String) {
                navController.navigate(route) {
                    popUpTo(navController.graph.findStartDestination().id) {
                        saveState = true
                    }
                    launchSingleTop = true
                    restoreState = true
                }
            }

            BoxWithConstraints(modifier = Modifier.fillMaxSize()) {
                val useNavigationRail = maxWidth >= 600.dp

                Scaffold(
                    contentWindowInsets = WindowInsets(0, 0, 0, 0),
                    bottomBar = {
                        if (!useNavigationRail) {
                            Surface(
                                shadowElevation = 12.dp,
                                shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp),
                                color = MaterialTheme.colorScheme.surface
                            ) {
                                NavigationBar(
                                    containerColor = Color.Transparent,
                                    tonalElevation = 0.dp
                                ) {
                                    tabs.forEach { tab ->
                                        val selected = currentRoute == tab.route
                                        val label = labelFor(tab)
                                        NavigationBarItem(
                                            selected = selected,
                                            onClick = { navigateToTab(tab.route) },
                                            icon = {
                                                Icon(
                                                    imageVector = if (selected) tab.selectedIcon else tab.unselectedIcon,
                                                    contentDescription = label
                                                )
                                            },
                                            label = { Text(label) },
                                            colors = NavigationBarItemDefaults.colors(
                                                selectedIconColor = PurpleVibrant,
                                                selectedTextColor = PurpleVibrant,
                                                indicatorColor = LavenderSoft
                                            ),
                                            modifier = Modifier.testTag("nav_tab_${tab.route}")
                                        )
                                    }
                                }
                            }
                        }
                    }
                ) { innerPadding ->
                    Row(
                        modifier = Modifier
                            .fillMaxSize()
                            .windowInsetsPadding(WindowInsets.statusBars)
                            .padding(innerPadding)
                    ) {
                        if (useNavigationRail) {
                            NavigationRail(
                                containerColor = MaterialTheme.colorScheme.surface
                            ) {
                                tabs.forEach { tab ->
                                    val selected = currentRoute == tab.route
                                    val label = labelFor(tab)
                                    NavigationRailItem(
                                        selected = selected,
                                        onClick = { navigateToTab(tab.route) },
                                        icon = {
                                            Icon(
                                                imageVector = if (selected) tab.selectedIcon else tab.unselectedIcon,
                                                contentDescription = label
                                            )
                                        },
                                        label = { Text(label) },
                                        colors = NavigationRailItemDefaults.colors(
                                            selectedIconColor = PurpleVibrant,
                                            selectedTextColor = PurpleVibrant,
                                            indicatorColor = LavenderSoft
                                        )
                                    )
                                }
                            }
                        }

                        NavHost(
                            navController = navController,
                            startDestination = NavTab.Chat.route,
                            modifier = Modifier.weight(1f)
                        ) {
                            composable(NavTab.Chat.route) {
                                ChatScreen(
                                    messages = messages,
                                    alarms = alarms,
                                    agentState = agentState,
                                    activeLanguage = prefs.language,
                                    strings = strings,
                                    decodeSources = viewModel::decodeSources,
                                    onSendMessage = viewModel::sendChatMessage,
                                    onSaveAlarm = viewModel::updateAndSaveAlarm,
                                    onClearChat = viewModel::clearChat,
                                    onDismissError = viewModel::dismissError,
                                    onQuickSwitchLanguage = { navigateToTab(NavTab.Profile.route) }
                                )
                            }
                            composable(NavTab.Alarms.route) {
                                AlarmsScreen(
                                    alarms = alarms,
                                    defaultSound = prefs.defaultAlarmSound,
                                    strings = strings,
                                    onCreateAlarm = viewModel::createManualAlarmOrReminder,
                                    onToggleAlarm = viewModel::toggleAlarmEnabled,
                                    onDeleteAlarm = viewModel::deleteAlarm
                                )
                            }
                            composable(NavTab.Discover.route) {
                                DiscoverScreen(
                                    strings = strings,
                                    onRunPromptInChat = { prompt ->
                                        navigateToTab(NavTab.Chat.route)
                                        viewModel.sendChatMessage(prompt)
                                    }
                                )
                            }
                            composable(NavTab.Profile.route) {
                                ProfileScreen(
                                    preferences = prefs,
                                    strings = strings,
                                    onSelectLanguage = viewModel::setLanguage,
                                    onSaveUserName = viewModel::setUserName,
                                    onToggleAutoDetect = viewModel::setAutoDetectLanguage,
                                    onSelectDefaultSound = viewModel::setDefaultAlarmSound,
                                    onClearChat = viewModel::clearChat
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
