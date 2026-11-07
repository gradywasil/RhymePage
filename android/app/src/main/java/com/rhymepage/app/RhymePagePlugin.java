package com.rhymepage.app;

import android.app.Activity;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.CancellationSignal;
import android.provider.Settings;
import androidx.activity.OnBackPressedCallback;
import androidx.activity.result.ActivityResult;
import androidx.core.content.ContextCompat;
import androidx.credentials.ClearCredentialStateRequest;
import androidx.credentials.CredentialManager;
import androidx.credentials.CredentialManagerCallback;
import androidx.credentials.CustomCredential;
import androidx.credentials.GetCredentialRequest;
import androidx.credentials.GetCredentialResponse;
import androidx.credentials.exceptions.ClearCredentialException;
import androidx.credentials.exceptions.GetCredentialCancellationException;
import androidx.credentials.exceptions.GetCredentialException;
import androidx.credentials.exceptions.NoCredentialException;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption;
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

@CapacitorPlugin(name = "RhymePage")
public class RhymePagePlugin extends Plugin {
    private CancellationSignal googleRequest;
    private PluginCall exporting;

    private boolean recoveryKey(String key) {
        return key != null && (key.startsWith("rhymepage:draft:v1:") || key.startsWith("rhymepage:timing:v1:") || key.startsWith("rhymepage:last-route:"));
    }

    @PluginMethod
    public void loadRecovery(PluginCall call) {
        SharedPreferences storage = getContext().getSharedPreferences("writing-recovery", Activity.MODE_PRIVATE);
        if (!storage.contains("initialized")) {
            SharedPreferences.Editor editor = storage.edit().putBoolean("initialized", true);
            JSObject seed = call.getObject("seed", new JSObject());
            for (java.util.Iterator<String> keys = seed.keys(); keys.hasNext();) {
                String key = keys.next();
                if (recoveryKey(key)) editor.putString(key, seed.optString(key));
            }
            if (!editor.commit()) { call.reject("Could not initialize device recovery storage."); return; }
        }
        JSObject entries = new JSObject();
        storage.getAll().forEach((key, value) -> { if (recoveryKey(key) && value instanceof String) entries.put(key, value); });
        JSObject result = new JSObject();
        result.put("entries", entries);
        call.resolve(result);
    }

    @PluginMethod
    public void writeRecovery(PluginCall call) {
        String key = call.getString("key");
        if (!recoveryKey(key)) { call.reject("Invalid recovery key."); return; }
        SharedPreferences.Editor editor = getContext().getSharedPreferences("writing-recovery", Activity.MODE_PRIVATE).edit();
        String value = call.getString("value");
        if (value == null) editor.remove(key); else editor.putString(key, value);
        if (editor.commit()) call.resolve(); else call.reject("Could not commit the device recovery copy.");
    }

    @Override
    public void load() {
        getActivity().getOnBackPressedDispatcher().addCallback(getActivity(), new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() { notifyListeners("backButton", new JSObject()); }
        });
    }

    @PluginMethod
    public void getGoogleCredential(PluginCall call) {
        int resource = getContext().getResources().getIdentifier("default_web_client_id", "string", getContext().getPackageName());
        String clientId = resource == 0 ? BuildConfig.GOOGLE_WEB_CLIENT_ID : getContext().getString(resource);
        if (clientId.isBlank()) {
            call.reject("Google sign-in is not available in this build. Use email and password, or try the web app.", "auth/android-not-configured");
            return;
        }
        if (googleRequest != null) { call.reject("A Google sign-in request is already open.", "auth/request-pending"); return; }
        googleRequest = new CancellationSignal();
        GetSignInWithGoogleOption option = new GetSignInWithGoogleOption.Builder(clientId).setNonce(UUID.randomUUID().toString()).build();
        GetCredentialRequest request = new GetCredentialRequest.Builder().addCredentialOption(option).build();
        getActivity().runOnUiThread(() -> CredentialManager.create(getContext()).getCredentialAsync(
            getActivity(), request, googleRequest, ContextCompat.getMainExecutor(getContext()),
            new CredentialManagerCallback<GetCredentialResponse, GetCredentialException>() {
                @Override
                public void onResult(GetCredentialResponse result) {
                    googleRequest = null;
                    try {
                        if (!(result.getCredential() instanceof CustomCredential credential)) throw new IllegalArgumentException("Unexpected credential");
                        GoogleIdTokenCredential google = GoogleIdTokenCredential.createFrom(credential.getData());
                        JSObject response = new JSObject();
                        response.put("idToken", google.getIdToken());
                        call.resolve(response);
                    } catch (Exception exception) {
                        call.reject("Google could not confirm this account. Try again.", "auth/invalid-credential");
                    }
                }
                @Override
                public void onError(GetCredentialException exception) {
                    googleRequest = null;
                    if (exception instanceof NoCredentialException) {
                        call.reject("No Google account is available. Add one in Android Settings, or use email and password.", "auth/android-no-credential");
                        return;
                    }
                    call.reject(exception instanceof GetCredentialCancellationException ? "Google sign-in was cancelled." : "Google sign-in could not finish. Try again.",
                        exception instanceof GetCredentialCancellationException ? "auth/popup-closed-by-user" : "auth/android-sign-in-failed");
                }
            }
        ));
    }

    @PluginMethod
    public void clearGoogleSession(PluginCall call) {
        CredentialManager.create(getContext()).clearCredentialStateAsync(new ClearCredentialStateRequest(), new CancellationSignal(),
            ContextCompat.getMainExecutor(getContext()), new CredentialManagerCallback<Void, ClearCredentialException>() {
                @Override public void onResult(Void result) { call.resolve(); }
                @Override public void onError(ClearCredentialException error) { call.reject("Could not clear Google sign-in selection."); }
            });
    }

    @PluginMethod
    public void openSettings(PluginCall call) {
        getActivity().startActivity(new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + getContext().getPackageName())));
        call.resolve();
    }

    @PluginMethod
    public void background(PluginCall call) { getActivity().moveTaskToBack(true); call.resolve(); }

    @PluginMethod
    public void exportText(PluginCall call) {
        if (exporting != null) { call.reject("Finish the current export first."); return; }
        String filename = call.getString("filename", "song.txt");
        String content = call.getString("content");
        String mime = call.getString("mimeType", "text/plain");
        // DocumentsUI otherwise appends .txt to an LRC filename.
        if (filename.endsWith(".lrc")) mime = "application/octet-stream";
        if (content == null || content.length() > 10 * 1024 * 1024 || !filename.matches("[a-zA-Z0-9_-]+\\.(lrc|json|txt)")) {
            call.reject("This file could not be exported."); return;
        }
        exporting = call;
        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType(mime).putExtra(Intent.EXTRA_TITLE, filename);
        try { startActivityForResult(call, intent, "exportResult"); }
        catch (Exception error) { exporting = null; call.reject("No file-saving app is available."); }
    }

    @ActivityCallback
    private void exportResult(PluginCall call, ActivityResult result) {
        exporting = null;
        if (call == null) return;
        JSObject response = new JSObject();
        if (result.getResultCode() != Activity.RESULT_OK || result.getData() == null || result.getData().getData() == null) {
            response.put("saved", false); call.resolve(response); return;
        }
        Uri destination = result.getData().getData();
        getBridge().execute(() -> {
            try (OutputStream output = getContext().getContentResolver().openOutputStream(destination, "wt")) {
                if (output == null) throw new IllegalStateException("No destination");
                output.write(call.getString("content", "").getBytes(StandardCharsets.UTF_8));
                response.put("saved", true); call.resolve(response);
            } catch (Exception error) { call.reject("Could not save the file. Choose another location and try again."); }
        });
    }

    @Override
    protected void handleOnDestroy() { if (googleRequest != null) googleRequest.cancel(); }
}
