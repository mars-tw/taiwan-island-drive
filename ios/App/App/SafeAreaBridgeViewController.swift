import UIKit
import WebKit
import Capacitor

final class SafeAreaBridgeViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        super.capacitorDidLoad()
        guard let webView = webView else { return }

        // Resize the actual web viewport, including fixed controls and policy pages.
        // Scroll content insets alone leave those elements under the status bar.
        let container = UIView()
        container.backgroundColor = webView.backgroundColor ?? .systemBackground
        webView.removeFromSuperview()
        view = container
        container.addSubview(webView)

        webView.translatesAutoresizingMaskIntoConstraints = false
        webView.clipsToBounds = true
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.scrollView.contentInset = .zero

        // UIKit updates this guide for cutouts, home indicators and rotation.
        let safeArea = container.safeAreaLayoutGuide
        NSLayoutConstraint.activate([
            webView.topAnchor.constraint(equalTo: safeArea.topAnchor),
            webView.bottomAnchor.constraint(equalTo: safeArea.bottomAnchor),
            webView.leadingAnchor.constraint(equalTo: safeArea.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: safeArea.trailingAnchor)
        ])
    }
}
