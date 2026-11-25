package com.example

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.ai.configureAppCheck
import com.example.ui.HelpMateApp
import com.example.ui.HelpMateViewModel
import com.example.ui.theme.HelpMateTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Configure Firebase App Check with launch intent before any UI or ViewModels
        configureAppCheck(this, intent)

        enableEdgeToEdge()
        setContent {
            HelpMateTheme {
                val helpMateViewModel: HelpMateViewModel = viewModel()
                HelpMateApp(viewModel = helpMateViewModel)
            }
        }
    }
}
