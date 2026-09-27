package in.gov.varshanet.citizen;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

/**
 * BootReceiver
 * 
 * Automatically restarts VajraEmergencyAlertService when device reboots or app is updated.
 * Guarantees 24x7 disaster monitoring without requiring user to open the app manually.
 */
public class BootReceiver extends BroadcastReceiver {
    private static final String TAG = "BootReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null) return;
        Log.i(TAG, "Device booted or package updated. Starting VajraEmergencyAlertService...");

        Intent serviceIntent = new Intent(context, VajraEmergencyAlertService.class);
        serviceIntent.setAction(VajraEmergencyAlertService.ACTION_START_MONITORING);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(serviceIntent);
        } else {
            context.startService(serviceIntent);
        }
    }
}
