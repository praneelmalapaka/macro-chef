package com.macrochef.app

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.Typography
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

val Ink = Color(0xFF0A0A08)
val Paper = Color(0xFFF5F2EB)
val Cream = Color(0xFFEDE9DF)
val Warm = Color(0xFFE8E2D4)
val Gold = Color(0xFFB8922A)
val GoldLight = Color(0xFFD4A843)
val GoldDim = Color(0x1AB8922A)
val Rust = Color(0xFFC24B2A)
val Forest = Color(0xFF2D5A3D)
val Slate = Color(0xFF3D4A5C)
val TextMain = Color(0xFF1A1A16)
val TextMuted = Color(0xFF5A5A50)
val TextSoft = Color(0xFF9A9A8A)
val Border = Color(0xFFD8D2C4)
val BorderStrong = Color(0xFFC8C2B4)
val SurfaceMain = Color(0xFFFFFFFF)
val SurfaceAlt = Color(0xFFF9F6F0)

private val macroChefColors = lightColorScheme(
    primary = Ink,
    onPrimary = Paper,
    secondary = Gold,
    onSecondary = Ink,
    tertiary = Forest,
    background = Paper,
    onBackground = TextMain,
    surface = SurfaceMain,
    onSurface = TextMain,
    surfaceVariant = SurfaceAlt,
    outline = Border,
    outlineVariant = BorderStrong,
    error = Rust,
)

private val macroChefTypography = Typography(
    displayLarge = TextStyle(
        fontFamily = FontFamily.Serif,
        fontWeight = FontWeight.Light,
        fontSize = 44.sp,
        lineHeight = 48.sp,
        color = Ink,
    ),
    displayMedium = TextStyle(
        fontFamily = FontFamily.Serif,
        fontWeight = FontWeight.Normal,
        fontSize = 34.sp,
        lineHeight = 38.sp,
        color = Ink,
    ),
    titleLarge = TextStyle(
        fontFamily = FontFamily.Serif,
        fontWeight = FontWeight.SemiBold,
        fontSize = 26.sp,
        lineHeight = 30.sp,
        color = Ink,
    ),
    titleMedium = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.SemiBold,
        fontSize = 18.sp,
        lineHeight = 22.sp,
        color = TextMain,
    ),
    bodyLarge = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Normal,
        fontSize = 15.sp,
        lineHeight = 24.sp,
        color = TextMuted,
    ),
    bodyMedium = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Normal,
        fontSize = 14.sp,
        lineHeight = 22.sp,
        color = TextMuted,
    ),
    labelLarge = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.SemiBold,
        fontSize = 13.sp,
        letterSpacing = 0.2.sp,
    ),
    labelMedium = TextStyle(
        fontFamily = FontFamily.Monospace,
        fontWeight = FontWeight.Medium,
        fontSize = 11.sp,
        letterSpacing = 1.sp,
        color = TextSoft,
    ),
)

private val macroChefShapes = Shapes(
    extraSmall = androidx.compose.foundation.shape.RoundedCornerShape(6.dp),
    small = androidx.compose.foundation.shape.RoundedCornerShape(10.dp),
    medium = androidx.compose.foundation.shape.RoundedCornerShape(16.dp),
    large = androidx.compose.foundation.shape.RoundedCornerShape(24.dp),
)

@Composable
fun MacroChefTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = macroChefColors,
        typography = macroChefTypography,
        shapes = macroChefShapes,
        content = content,
    )
}
