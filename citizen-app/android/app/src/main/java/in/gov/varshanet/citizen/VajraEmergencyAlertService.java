package in.gov.varshanet.citizen;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.media.AudioAttributes;
import android.media.AudioFormat;
import android.media.AudioManager;
import android.media.AudioTrack;
import android.media.Ringtone;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.util.Log;

import androidx.core.app.NotificationCompat;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.HashSet;
import java.util.Set;

/**
 * VajraEmergencyAlertService
 * 
 * 24x7 Native Android Foreground Service for the VAJRA Early Warning System.
 * Responsibilities:
 *  - Continuously monitors for Severe Convective Weather & Disaster alerts.
 *  - Runs in the background even when app is closed, phone is locked, or screen is off.
 *  - When a new HIGH/CRITICAL alert is published, immediately:
 *      1. Wakes up the phone screen (WakeLock).
 *      2. Plays a loud, piercing emergency warning siren (AudioTrack + Alarm stream).
 *      3. Triggers violent emergency haptic vibration.
 *      4. Displays a heads-up High-Priority Emergency Notification over lock screen.
 *      5. Provides a one-tap "Stop Siren" button in notification and in-app.
 */
public class VajraEmergencyAlertService extends Service {
    private static final String TAG = "VajraAlertService";

    public static final String ACTION_STOP_SIREN = "in.gov.varshanet.citizen.ACTION_STOP_SIREN";
    public static final String ACTION_START_MONITORING = "in.gov.varshanet.citizen.ACTION_START_MONITORING";
    public static final String ACTION_TEST_SIREN = "in.gov.varshanet.citizen.ACTION_TEST_SIREN";

    private static final String CHANNEL_MONITOR = "vajra_monitoring_channel";
    private static final String CHANNEL_EMERGENCY = "vajra_emergency_siren_channel";

    private static final int NOTIF_ID_MONITOR = 1001;
    private static final int NOTIF_ID_EMERGENCY = 9999;

    private static final String PREFS_NAME = "VajraPrefs";
    private static final String PREF_LAST_SEEN_ALERTS = "seen_alerts";
    private static final String PREF_BACKEND_URL = "backend_url";
    private static final String DEFAULT_BACKEND = "https://sih86.onrender.com";

    private static volatile boolean isSirenActive = false;
    private static AudioTrack sirenAudioTrack = null;
    private static Thread sirenAudioThread = null;
    private static Ringtone fallbackRingtone = null;
    private static Vibrator systemVibrator = null;
    private static PowerManager.WakeLock wakeLock = null;

    private Thread workerThread;
    private volatile boolean isRunning = false;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    @Override
    public void onCreate() {
        super.onCreate();
        Log.i(TAG, "VajraEmergencyAlertService onCreate()");
        createNotificationChannels();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null) {
            String action = intent.getAction();
            if (ACTION_STOP_SIREN.equals(action)) {
                stopSiren(this);
                return START_STICKY;
            } else if (ACTION_TEST_SIREN.equals(action)) {
                triggerEmergencyAlert(
                    this,
                    "TEST: Severe Storm & Convective Cloud Warning",
                    "Immediate shelter advised. High-speed wind gusts & hail detected nearby.",
                    "Nagpur Sector (Vidarbha)",
                    "TEST-" + System.currentTimeMillis()
                );
                return START_STICKY;
            }
        }

        // Start Foreground with low-profile ongoing monitor notification
        Notification monitorNotif = buildMonitorNotification();
        try {
            startForeground(NOTIF_ID_MONITOR, monitorNotif);
        } catch (Exception e) {
            Log.e(TAG, "startForeground error", e);
        }

        // Start polling background thread
        startPollingWorker();

        return START_STICKY;
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        isRunning = false;
        if (workerThread != null) {
            workerThread.interrupt();
        }
        stopSiren(this);
        super.onDestroy();
    }

    // ─── Notification Channels ───────────────────────────────────────────────
    private void createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm == null) return;

            // 1. Silent Background Monitoring Channel
            NotificationChannel monitorChan = new NotificationChannel(
                CHANNEL_MONITOR,
                "VAJRA 24/7 आपदा निगरानी (Disaster Monitor)",
                NotificationManager.IMPORTANCE_LOW
            );
            monitorChan.setDescription("VAJRA 24x7 background storm and flood monitoring status");
            monitorChan.setShowBadge(false);
            nm.createNotificationChannel(monitorChan);

            // 2. High-Priority Loud Emergency Siren Channel
            NotificationChannel emergChan = new NotificationChannel(
                CHANNEL_EMERGENCY,
                "🚨 VAJRA आपातकालीन सायरन (Emergency Siren Alert)",
                NotificationManager.IMPORTANCE_HIGH
            );
            emergChan.setDescription("Loud emergency siren warnings for severe weather and convective storms");
            emergChan.enableVibration(true);
            emergChan.setVibrationPattern(new long[]{0, 800, 200, 800, 200, 1200});
            emergChan.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            emergChan.setBypassDnd(true);

            Uri alarmSound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
            if (alarmSound == null) {
                alarmSound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
            }
            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .setUsage(AudioAttributes.USAGE_ALARM)
                .build();
            emergChan.setSound(alarmSound, audioAttributes);

            nm.createNotificationChannel(emergChan);
        }
    }

    private Notification buildMonitorNotification() {
        Intent openIntent = new Intent(this, MainActivity.class);
        openIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pOpen = PendingIntent.getActivity(
            this,
            0,
            openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
        );

        return new NotificationCompat.Builder(this, CHANNEL_MONITOR)
            .setContentTitle("🛡️ VAJRA आपदा सुरक्षा सक्रिय (Shield Active)")
            .setContentText("24x7 गंभीर मौसम एवं आपदा अलर्ट रीयल-टाइम मॉनिटरिंग चालू है")
            .setSmallIcon(android.R.drawable.ic_dialog_alert)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setContentIntent(pOpen)
            .build();
    }

    // ─── Background Polling Loop ─────────────────────────────────────────────
    private synchronized void startPollingWorker() {
        if (isRunning) return;
        isRunning = true;

        workerThread = new Thread(() -> {
            Log.i(TAG, "Background polling worker started. Checking backend every 8s...");
            while (isRunning) {
                try {
                    checkBackendForAlerts();
                } catch (Throwable t) {
                    Log.w(TAG, "Error checking alerts in background: " + t.getMessage());
                }

                try {
                    Thread.sleep(8000); // Poll every 8 seconds
                } catch (InterruptedException e) {
                    break;
                }
            }
            Log.i(TAG, "Background polling worker stopped.");
        });
        workerThread.setName("VajraAlertPoller");
        workerThread.start();
    }

    private void checkBackendForAlerts() {
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        String baseUrl = prefs.getString(PREF_BACKEND_URL, DEFAULT_BACKEND);
        if (baseUrl == null || baseUrl.trim().isEmpty()) {
            baseUrl = DEFAULT_BACKEND;
        }
        baseUrl = baseUrl.replaceAll("/+$", "");

        HttpURLConnection conn = null;
        try {
            URL url = new URL(baseUrl + "/api/citizen/alerts?include_expired=false");
            conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(6000);
            conn.setReadTimeout(6000);
            conn.setRequestProperty("Accept", "application/json");

            int responseCode = conn.getResponseCode();
            if (responseCode == 200) {
                BufferedReader in = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = in.readLine()) != null) {
                    sb.append(line);
                }
                in.close();

                processAlertsJson(sb.toString(), prefs);
            }
        } catch (Exception e) {
            // Network timeout / offline — normal in mobile background
        } finally {
            if (conn != null) {
                conn.disconnect();
            }
        }
    }

    private void processAlertsJson(String jsonStr, SharedPreferences prefs) {
        try {
            JSONArray arr = new JSONArray(jsonStr);
            Set<String> seenIds = prefs.getStringSet(PREF_LAST_SEEN_ALERTS, new HashSet<>());
            Set<String> updatedSeen = new HashSet<>(seenIds);

            // On very first run, record existing alerts so we only siren on genuinely NEW incoming alerts
            if (!prefs.contains("has_initialized_alerts")) {
                for (int i = 0; i < arr.length(); i++) {
                    JSONObject obj = arr.getJSONObject(i);
                    updatedSeen.add(obj.optString("id", ""));
                }
                prefs.edit()
                    .putBoolean("has_initialized_alerts", true)
                    .putStringSet(PREF_LAST_SEEN_ALERTS, updatedSeen)
                    .apply();
                Log.i(TAG, "Initialized baseline alerts count: " + updatedSeen.size());
                return;
            }

            for (int i = 0; i < arr.length(); i++) {
                JSONObject obj = arr.getJSONObject(i);
                String id = obj.optString("id", "");
                String sev = obj.optString("severity", "HIGH").toUpperCase();
                String status = obj.optString("status", "ACTIVE").toUpperCase();

                // Check for severe convective alerts
                boolean isSevere = "CRITICAL".equals(sev) || "HIGH".equals(sev) || "SEVERE".equals(sev);
                boolean isActive = !"RESOLVED".equals(status) && !"REJECTED".equals(status);

                if (isSevere && isActive && !id.isEmpty() && !seenIds.contains(id)) {
                    Log.w(TAG, "🚨 NEW SEVERE ALERT DETECTED IN BACKGROUND: " + id);
                    updatedSeen.add(id);
                    prefs.edit().putStringSet(PREF_LAST_SEEN_ALERTS, updatedSeen).apply();

                    String title = obj.optString("title", "आपातकालीन मौसम चेतावनी (EMERGENCY ALERT)");
                    String msg = obj.optString("message", "Take immediate safe shelter.");
                    String location = obj.optString("location", "Nagpur Sector");

                    mainHandler.post(() -> {
                        triggerEmergencyAlert(getApplicationContext(), title, msg, location, id);
                    });
                    break;
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "JSON parse error", e);
        }
    }

    // ─── Emergency Siren & Heads-up Trigger ──────────────────────────────────
    public static synchronized void triggerEmergencyAlert(
        Context context,
        String title,
        String message,
        String location,
        String alertId
    ) {
        Log.i(TAG, "triggerEmergencyAlert() triggered for: " + title);

        // 1. Wake up the phone screen
        try {
            PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
            if (pm != null) {
                if (wakeLock != null && wakeLock.isHeld()) {
                    wakeLock.release();
                }
                wakeLock = pm.newWakeLock(
                    PowerManager.SCREEN_BRIGHT_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP | PowerManager.ON_AFTER_RELEASE,
                    "VAJRA:EmergencyScreenWake"
                );
                wakeLock.acquire(45000); // 45 seconds screen wake
            }
        } catch (Exception e) {
            Log.w(TAG, "WakeLock error", e);
        }

        // 2. Start Violent Emergency Haptic Vibration
        try {
            systemVibrator = (Vibrator) context.getSystemService(Context.VIBRATOR_SERVICE);
            if (systemVibrator != null && systemVibrator.hasVibrator()) {
                long[] pattern = {0, 800, 200, 800, 200, 1200, 400};
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    systemVibrator.vibrate(VibrationEffect.createWaveform(pattern, 0)); // 0 = loop
                } else {
                    systemVibrator.vibrate(pattern, 0);
                }
            }
        } catch (Exception e) {
            Log.w(TAG, "Vibrator error", e);
        }

        // 3. Play Piercing Warning Siren Sound on Alarm Audio Channel
        startSirenAudio(context);

        // 4. Show High-Priority Heads-Up Emergency Notification
        NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm != null) {
            // Intent to Stop Siren
            Intent stopIntent = new Intent(context, SirenActionReceiver.class);
            stopIntent.setAction(ACTION_STOP_SIREN);
            PendingIntent pStop = PendingIntent.getBroadcast(
                context,
                1,
                stopIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
            );

            // Intent to Open App Activity
            Intent openIntent = new Intent(context, MainActivity.class);
            openIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
            openIntent.putExtra("EMERGENCY_ALERT_TRIGGERED", true);
            openIntent.putExtra("ALERT_ID", alertId);
            openIntent.putExtra("ALERT_TITLE", title);

            PendingIntent pOpen = PendingIntent.getActivity(
                context,
                2,
                openIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
            );

            NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_EMERGENCY)
                .setSmallIcon(android.R.drawable.ic_dialog_alert)
                .setContentTitle("🚨 " + title)
                .setContentText(message + " (क्षेत्र: " + location + ")")
                .setStyle(new NotificationCompat.BigTextStyle().bigText(
                    "📍 क्षेत्र: " + location + "\n\n" + message + "\n\n⚠️ तत्काल सुरक्षित स्थान पर शरण लें।"
                ))
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setAutoCancel(false)
                .setOngoing(true)
                .setContentIntent(pOpen)
                .setFullScreenIntent(pOpen, true)
                .addAction(android.R.drawable.ic_lock_power_off, "🔕 सायरन बंद करें (STOP SIREN)", pStop)
                .addAction(android.R.drawable.ic_menu_view, "📱 अलर्ट देखें (VIEW)", pOpen);

            nm.notify(NOTIF_ID_EMERGENCY, builder.build());
        }

        // Auto-stop siren after 60 seconds to prevent battery drain if user is away
        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            stopSiren(context);
        }, 60000);
    }

    // ─── Wailing Civil Defense Siren Audio Generator (PCM Synthesis) ─────────
    private static synchronized void startSirenAudio(Context context) {
        if (isSirenActive) return;
        isSirenActive = true;

        // Try playing system Alarm Ringtone in parallel for max device amplification
        try {
            Uri alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
            if (alarmUri == null) {
                alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
            }
            fallbackRingtone = RingtoneManager.getRingtone(context, alarmUri);
            if (fallbackRingtone != null) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                    fallbackRingtone.setLooping(true);
                }
                fallbackRingtone.play();
            }
        } catch (Exception e) {
            Log.w(TAG, "Ringtone fallback error", e);
        }

        // Dedicated AudioTrack Siren Oscillator: Sweeps 650Hz <-> 1350Hz continuously
        sirenAudioThread = new Thread(() -> {
            final int sampleRate = 44100;
            final int minBufferSize = AudioTrack.getMinBufferSize(
                sampleRate,
                AudioFormat.CHANNEL_OUT_MONO,
                AudioFormat.ENCODING_PCM_16BIT
            );

            AudioAttributes attrs = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_ALARM)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build();

            AudioFormat format = new AudioFormat.Builder()
                .setSampleRate(sampleRate)
                .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                .build();

            try {
                sirenAudioTrack = new AudioTrack(
                    attrs,
                    format,
                    Math.max(minBufferSize, sampleRate / 2),
                    AudioTrack.MODE_STREAM,
                    AudioManager.AUDIO_SESSION_ID_GENERATE
                );

                sirenAudioTrack.play();

                short[] buffer = new short[2048];
                double phase = 0;
                double sweepPhase = 0;

                while (isSirenActive) {
                    // Modulation: 0.8 Hz frequency cycle between 650 Hz and 1350 Hz
                    sweepPhase += (2.0 * Math.PI * 0.8) / sampleRate;
                    if (sweepPhase > 2.0 * Math.PI) sweepPhase -= 2.0 * Math.PI;

                    double currentFreq = 950.0 + 350.0 * Math.sin(sweepPhase);
                    double phaseInc = (2.0 * Math.PI * currentFreq) / sampleRate;

                    for (int i = 0; i < buffer.length; i++) {
                        phase += phaseInc;
                        if (phase > 2.0 * Math.PI) phase -= 2.0 * Math.PI;
                        // High amplitude square/sine composite wave for maximum penetration
                        double sample = Math.sin(phase) + 0.3 * Math.sin(phase * 3);
                        buffer[i] = (short) (sample * 28000);
                    }

                    sirenAudioTrack.write(buffer, 0, buffer.length);
                }

                sirenAudioTrack.stop();
                sirenAudioTrack.release();
                sirenAudioTrack = null;
            } catch (Exception e) {
                Log.w(TAG, "AudioTrack siren generator ended", e);
            }
        });

        sirenAudioThread.setName("VajraSirenOscillator");
        sirenAudioThread.setPriority(Thread.MAX_PRIORITY);
        sirenAudioThread.start();
    }

    // ─── Stop Siren Method ───────────────────────────────────────────────────
    public static synchronized void stopSiren(Context context) {
        Log.i(TAG, "stopSiren() called. Silencing siren & vibration.");
        isSirenActive = false;

        // Stop fallback ringtone
        if (fallbackRingtone != null) {
            try {
                fallbackRingtone.stop();
            } catch (Exception ignored) {}
            fallbackRingtone = null;
        }

        // Stop AudioTrack
        if (sirenAudioTrack != null) {
            try {
                sirenAudioTrack.pause();
                sirenAudioTrack.flush();
            } catch (Exception ignored) {}
        }

        // Stop Vibrator
        if (systemVibrator != null) {
            try {
                systemVibrator.cancel();
            } catch (Exception ignored) {}
        }

        // Release WakeLock
        if (wakeLock != null && wakeLock.isHeld()) {
            try {
                wakeLock.release();
            } catch (Exception ignored) {}
            wakeLock = null;
        }

        // Clear emergency heads-up notification
        if (context != null) {
            NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) {
                nm.cancel(NOTIF_ID_EMERGENCY);
            }
        }
    }
}
