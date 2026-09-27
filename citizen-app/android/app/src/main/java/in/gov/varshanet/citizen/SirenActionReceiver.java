package in.gov.varshanet.citizen;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

/**
 * SirenActionReceiver
 * 
 * Handles broadcast intents from notification action buttons to immediately
 * silence the alarm siren and cancel vibration.
 */
public class SirenActionReceiver extends BroadcastReceiver {
    private static final String TAG = "SirenActionReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null) return;
        String action = intent.getAction();
        Log.i(TAG, "onReceive action: " + action);

        if (VajraEmergencyAlertService.ACTION_STOP_SIREN.equals(action)) {
            VajraEmergencyAlertService.stopSiren(context.getApplicationContext());
        }
    }
}
