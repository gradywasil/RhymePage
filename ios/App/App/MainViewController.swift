import Capacitor

/// Capacitor only auto-registers npm plugins; the app's own plugin is added here.
class MainViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(RhymePagePlugin())
    }
}
