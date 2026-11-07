package com.rhymepage.app;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;
import android.webkit.WebView;
import androidx.activity.EdgeToEdge;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.WebViewListener;
import java.util.Locale;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(RhymePagePlugin.class);
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        // Own inset handling across WebView versions: backgrounds reach the edges,
        // CSS protects controls, and native padding reserves only the open keyboard.
        ViewCompat.setOnApplyWindowInsetsListener(getWindow().getDecorView(), (view, insets) -> {
            int barsType = WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout();
            Insets bars = insets.getInsets(barsType);
            boolean keyboard = insets.isVisible(WindowInsetsCompat.Type.ime());
            view.setPadding(0, 0, 0, keyboard ? insets.getInsets(WindowInsetsCompat.Type.ime()).bottom : 0);
            float density = getResources().getDisplayMetrics().density;
            bridge.getWebView().evaluateJavascript(String.format(Locale.US,
                "document.documentElement.style.cssText += '--safe-area-inset-top:%.2fpx;--safe-area-inset-right:%.2fpx;--safe-area-inset-bottom:%.2fpx;--safe-area-inset-left:%.2fpx;'",
                bars.top / density, bars.right / density, keyboard ? 0f : bars.bottom / density, bars.left / density), null);
            return new WindowInsetsCompat.Builder(insets).setInsets(barsType, Insets.NONE).build();
        });
        bridge.addWebViewListener(new WebViewListener() {
            @Override
            public void onPageCommitVisible(WebView view, String url) {
                ViewCompat.requestApplyInsets(getWindow().getDecorView());
            }
        });
        ViewCompat.requestApplyInsets(getWindow().getDecorView());
    }
}
