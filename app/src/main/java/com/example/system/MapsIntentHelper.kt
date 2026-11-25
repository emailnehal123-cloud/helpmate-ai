package com.example.system

import android.content.Context
import android.content.Intent
import android.net.Uri

object MapsIntentHelper {
    fun openGoogleMaps(context: Context, query: String): Boolean {
        val encoded = Uri.encode(query)
        val geoIntent = Intent(Intent.ACTION_VIEW, Uri.parse("geo:0,0?q=$encoded")).apply {
            setPackage("com.google.android.apps.maps")
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        return runCatching {
            if (geoIntent.resolveActivity(context.packageManager) != null) {
                context.startActivity(geoIntent)
                true
            } else {
                val webIntent = Intent(
                    Intent.ACTION_VIEW,
                    Uri.parse("https://www.google.com/maps/search/?api=1&query=$encoded")
                ).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                context.startActivity(webIntent)
                true
            }
        }.getOrDefault(false)
    }
}
