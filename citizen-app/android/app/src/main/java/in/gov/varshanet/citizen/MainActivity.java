package in.gov.varshanet.citizen;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.view.WindowManager;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "MainActivity";
    private static final int REQ_NOTIF_PERMISSION = 101;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Log.i(TAG, "MainActivity onCreate");

        // Allow activity to display over lock screen when emergency alert occurs
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
        } else {
            getWindow().addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON |
                WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
            );
        }

        // Request POST_NOTIFICATIONS on Android 13+ (API 33+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                    != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(
                    this,
                    new String[]{Manifest.permission.POST_NOTIFICATIONS},
                    REQ_NOTIF_PERMISSION
                );
            }
        }

        // Automatically start the 24x7 Emergency Alert Foreground Service
        startAlertService();

        // Inject Native Bridge into WebView for in-app siren control
        setupNativeJavascriptBridge();
    }

    private void startAlertService() {
        try {
            Intent serviceIntent = new Intent(this, VajraEmergencyAlertService.class);
            serviceIntent.setAction(VajraEmergencyAlertService.ACTION_START_MONITORING);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(serviceIntent);
            } else {
                startService(serviceIntent);
            }
            Log.i(TAG, "VajraEmergencyAlertService launched successfully.");
        } catch (Exception e) {
            Log.e(TAG, "Failed to start VajraEmergencyAlertService", e);
        }
    }

    private void setupNativeJavascriptBridge() {
        runOnUiThread(() -> {
            try {
                if (getBridge() != null && getBridge().getWebView() != null) {
                    WebView webView = getBridge().getWebView();
                    webView.addJavascriptInterface(new Object() {
                        @JavascriptInterface
                        public void stopSiren() {
                            Log.i(TAG, "Native JS bridge: stopSiren called from web app");
                            VajraEmergencyAlertService.stopSiren(MainActivity.this);
                        }

                        @JavascriptInterface
                        public void testSiren() {
                            Log.i(TAG, "Native JS bridge: testSiren called from web app");
                            VajraEmergencyAlertService.triggerEmergencyAlert(
                                MainActivity.this,
                                "TEST: Severe Convective Storm Warning",
                                "Immediate shelter advised. High winds & intense hail approaching.",
                                "Nagpur Sector (Vidarbha)",
                                "TEST-" + System.currentTimeMillis()
                            );
                        }

                        @JavascriptInterface
                        public void setBackendUrl(String url) {
                            if (url != null && !url.trim().isEmpty()) {
                                SharedPreferences prefs = getSharedPreferences("VajraPrefs", Context.MODE_PRIVATE);
                                prefs.edit().putString("backend_url", url.trim()).apply();
                                Log.i(TAG, "Native JS bridge: backend_url set to " + url);
                            }
                        }
                    }, "VajraNative");
                    Log.i(TAG, "VajraNative JavascriptInterface registered into WebView.");
                }
            } catch (Exception e) {
                Log.e(TAG, "Error adding JavascriptInterface", e);
            }
        });
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        if (intent != null && intent.getBooleanExtra("EMERGENCY_ALERT_TRIGGERED", false)) {
            Log.i(TAG, "MainActivity opened from Emergency Alert Intent!");
        }
    }
}
