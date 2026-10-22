package expo.modules.timerpip

import android.app.PictureInPictureParams
import android.content.pm.PackageManager
import android.os.Build
import android.util.Rational
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

// Janelinha flutuante (picture-in-picture) do treino no Android.
// Com ela ligada, o app vira uma janela pequena por cima dos outros apps quando você sai dele.
class TimerPipModule : Module() {
  private var enabled = false

  private fun supported(): Boolean {
    val activity = appContext.currentActivity ?: return false
    return Build.VERSION.SDK_INT >= Build.VERSION_CODES.O &&
      activity.packageManager.hasSystemFeature(PackageManager.FEATURE_PICTURE_IN_PICTURE)
  }

  private fun params(): PictureInPictureParams? {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return null
    val builder = PictureInPictureParams.Builder().setAspectRatio(Rational(16, 9))
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      builder.setAutoEnterEnabled(enabled).setSeamlessResizeEnabled(false)
    }
    return builder.build()
  }

  private fun enter(): Boolean {
    val activity = appContext.currentActivity ?: return false
    if (!supported()) return false
    val p = params() ?: return false
    return try { activity.enterPictureInPictureMode(p) } catch (e: Exception) { false }
  }

  override fun definition() = ModuleDefinition {
    Name("TimerPip")

    Function<Boolean>("isSupported") { supported() }

    AsyncFunction("setEnabled") { on: Boolean ->
      enabled = on
      val activity = appContext.currentActivity
      if (activity != null && supported()) {
        params()?.let { try { activity.setPictureInPictureParams(it) } catch (e: Exception) {} }
      }
    }.runOnQueue(Queues.MAIN)

    AsyncFunction<Boolean>("enter") { enter() }.runOnQueue(Queues.MAIN)

    // Android 8 a 11 não entram sozinhos: abre a janelinha quando você aperta o Home.
    OnUserLeavesActivity {
      if (enabled && Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
        appContext.currentActivity?.runOnUiThread { enter() }
      }
    }
  }
}
