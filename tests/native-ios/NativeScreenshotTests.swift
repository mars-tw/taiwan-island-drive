import XCTest
import UIKit

final class NativeScreenshotTests: XCTestCase {
    let app = XCUIApplication(bundleIdentifier: "tw.mars.islandtransport")
    var captures: [[String: Any]] = []
    var output: URL {
        FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("NativeScreens", isDirectory: true)
    }

    override func setUpWithError() throws {
        continueAfterFailure = false
        XCUIDevice.shared.orientation = .portrait
        try FileManager.default.createDirectory(at: output, withIntermediateDirectories: true)
        app.launchArguments = ["-AppleLanguages", "(zh-Hant)", "-AppleLocale", "zh_TW"]
        app.launch()
        XCTAssertTrue(app.webViews.firstMatch.waitForExistence(timeout: 45), "Actual WKWebView must be present")
        XCTAssertTrue(element("今天，想開").waitForExistence(timeout: 45), "Lobby must load")
    }

    // Labels come from the production HTML / DOM. No JavaScript injection or altered app UI.
    func element(_ label: String, exact: Bool = false) -> XCUIElement {
        let predicate = NSPredicate(format: exact ? "label == %@" : "label CONTAINS %@", label)
        for query in [app.buttons, app.links, app.staticTexts] {
            let hit = query.matching(predicate).firstMatch
            if hit.exists { return hit }
        }
        return app.descendants(matching: .any).matching(predicate).firstMatch
    }

    func tap(_ label: String, exact: Bool = false, control: XCUIElement? = nil) {
        var target = control ?? element(label, exact: exact)
        XCTAssertTrue(target.waitForExistence(timeout: 45), "Missing accessibility label: \(label)")
        for attempt in 0..<4 {
            if target.isHittable { break }
            let viewport = app.webViews.firstMatch
            // A header above the viewport needs a downward gesture. Repeated upward
            // gestures would move it farther away after a dialog restores scroll/focus.
            if target.frame.minY < viewport.frame.minY ||
                (target.frame.maxY <= viewport.frame.maxY && attempt % 2 == 0) {
                viewport.swipeDown()
            } else {
                viewport.swipeUp()
            }
            target = control ?? element(label, exact: exact)
        }
        if !target.isHittable {
            let screen = XCUIScreen.main.screenshot()
            let shot = XCTAttachment(screenshot: screen)
            shot.name = "failure-untappable-original"
            shot.lifetime = .keepAlways
            add(shot)
            try? screen.pngRepresentation.write(to: output.appendingPathComponent("failure-untappable-original.png"), options: .atomic)
            let description = "Requested label: \(label)\nTarget frame: \(target.frame)\nWebView frame: \(app.webViews.firstMatch.frame)\n" + app.debugDescription
            let hierarchy = XCTAttachment(string: description)
            hierarchy.name = "failure-untappable-accessibility"
            hierarchy.lifetime = .keepAlways
            add(hierarchy)
            try? Data(description.utf8).write(to: output.appendingPathComponent("failure-untappable-accessibility.txt"), options: .atomic)
        }
        XCTAssertTrue(target.isHittable, "Label must be tappable: \(label)")
        target.tap()
    }

    func settle(_ seconds: Double = 3) {
        let done = expectation(description: "Let native rendering finish")
        DispatchQueue.main.asyncAfter(deadline: .now() + seconds) { done.fulfill() }
        wait(for: [done], timeout: seconds + 5)
    }

    func tapFlightStart() {
        // Lesson descriptions also contain "出發". Select the actual start button by prefix.
        let start = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "出發")).firstMatch
        XCTAssertTrue(start.waitForExistence(timeout: 45))
        for _ in 0..<4 { if start.isHittable { break }; app.webViews.firstMatch.swipeUp() }
        XCTAssertTrue(start.isHittable && start.isEnabled)
        start.tap()
    }

    func capture(_ name: String) throws {
        settle()
        let shot = XCUIScreen.main.screenshot()
        let attachment = XCTAttachment(screenshot: shot)
        attachment.name = "native-original-" + name
        attachment.lifetime = .keepAlways
        add(attachment)
        try shot.pngRepresentation.write(to: output.appendingPathComponent(name + "-original.png"), options: .atomic)
        guard let cg = shot.image.cgImage else { XCTFail("Screenshot has no pixels"); return }
        // Exact pixel dimensions; only flatten the opaque screen to remove the alpha channel.
        let size = CGSize(width: CGFloat(cg.width), height: CGFloat(cg.height))
        let format = UIGraphicsImageRendererFormat()
        format.scale = 1
        format.opaque = true
        format.preferredRange = .standard
        let image = UIGraphicsImageRenderer(size: size, format: format).image { _ in
            UIColor.white.setFill()
            UIRectFill(CGRect(origin: .zero, size: size))
            UIImage(cgImage: cg).draw(in: CGRect(origin: .zero, size: size))
        }
        guard let data = image.pngData() else { XCTFail("PNG conversion failed"); return }
        try data.write(to: output.appendingPathComponent(name + ".png"), options: .atomic)
        captures.append(["name": name, "original": name + "-original.png", "publication": name + ".png",
                         "width": cg.width, "height": cg.height,
                         "source": "XCUIScreen.main.screenshot", "capturedAt": ISO8601DateFormatter().string(from: Date())])
        try JSONSerialization.data(withJSONObject: captures, options: [.prettyPrinted, .sortedKeys])
            .write(to: output.appendingPathComponent("capture-records.json"), options: .atomic)
    }

    func home() {
        tap("回到交通學院", exact: true)
        let arrived = element("今天，想開").waitForExistence(timeout: 30)
        if !arrived {
            // Diagnostic originals only: do not append to successful capture records.
            let screen = XCUIScreen.main.screenshot()
            let shot = XCTAttachment(screenshot: screen)
            shot.name = "failure-after-home-original"
            shot.lifetime = .keepAlways
            add(shot)
            try? screen.pngRepresentation.write(to: output.appendingPathComponent("failure-after-home-original.png"), options: .atomic)
            let description = app.debugDescription
            let hierarchy = XCTAttachment(string: description)
            hierarchy.name = "failure-after-home-accessibility"
            hierarchy.lifetime = .keepAlways
            add(hierarchy)
            try? Data(description.utf8).write(to: output.appendingPathComponent("failure-after-home-accessibility.txt"), options: .atomic)
        }
        XCTAssertTrue(arrived)
        app.webViews.firstMatch.swipeDown()
    }

    func testCaptureNavigation() throws {
        try capture("01-lobby")
        tap("開汽車", exact: true)
        // Lobby has a StaticText with the same wording. Only the car's real button is valid.
        let start = app.buttons.matching(NSPredicate(format: "label == %@", "出發上路")).firstMatch
        XCTAssertTrue(start.waitForExistence(timeout: 90), "Bundled car scene must become ready")
        let ready = NSPredicate { _, _ in start.exists && start.isEnabled }
        XCTAssertEqual(XCTWaiter.wait(for: [XCTNSPredicateExpectation(predicate: ready, object: start)], timeout: 90), .completed)
        tap("出發上路", exact: true, control: start)
        let playing = element("暫停遊戲", exact: true).waitForExistence(timeout: 30)
        if !playing {
            let screen = XCUIScreen.main.screenshot()
            let shot = XCTAttachment(screenshot: screen)
            shot.name = "failure-after-car-start-original"
            shot.lifetime = .keepAlways
            add(shot)
            try? screen.pngRepresentation.write(to: output.appendingPathComponent("failure-after-car-start-original.png"), options: .atomic)
            let description = app.debugDescription
            let hierarchy = XCTAttachment(string: description)
            hierarchy.name = "failure-after-car-start-accessibility"
            hierarchy.lifetime = .keepAlways
            add(hierarchy)
            try? Data(description.utf8).write(to: output.appendingPathComponent("failure-after-car-start-accessibility.txt"), options: .atomic)
        }
        XCTAssertTrue(playing)
        try capture("02-car")
        home()

        tap("開火車", exact: true)
        let trainControl = app.buttons.matching(NSPredicate(format: "label == %@", "暫停課程")).firstMatch
        XCTAssertTrue(trainControl.waitForExistence(timeout: 45), "Train-owned controls must be ready")
        XCTAssertTrue(element("準備出發").waitForExistence(timeout: 45))
        let assetsReady = NSPredicate { _, _ in !self.element("正在準備駕駛艙", exact: true).exists }
        XCTAssertEqual(XCTWaiter.wait(for: [XCTNSPredicateExpectation(predicate: assetsReady, object: app)], timeout: 90), .completed)
        XCTAssertFalse(element("模型載入未完成").exists, "Train assets must not show an error")
        XCTAssertFalse(element("這台瀏覽器無法啟動 3D 畫面").exists, "Native WebGL must start")
        tap("準備出發")
        tap("開始前進")
        try capture("03-train")
        home()

        tap("開飛機", exact: true)
        XCTAssertTrue(element("飛機已準備好", exact: true).waitForExistence(timeout: 90))
        tapFlightStart()
        XCTAssertTrue(element("向左轉", exact: true).waitForExistence(timeout: 30))
        try capture("04-flight")
    }

    func testParentGateDenied() throws {
        tap("家長設定")
        XCTAssertTrue(element("家長確認", exact: true).waitForExistence(timeout: 15))
        try capture("parent-gate-request")
        tap("取消", exact: true)
        XCTAssertFalse(element("設定好了", exact: true).exists, "Cancelled gate must not open settings")
        XCTAssertFalse(element("家長確認", exact: true).exists)
        tap("家長設定")
        XCTAssertTrue(element("家長確認", exact: true).waitForExistence(timeout: 15), "Cancelled gate must not grant access")
        tap("取消", exact: true)
        try JSONSerialization.data(withJSONObject: ["cancelDenied": true, "settingsStayedClosed": true,
                                                  "secondRequestStillRequiresGate": true, "hardwareTest": false], options: .prettyPrinted)
            .write(to: output.appendingPathComponent("parent-gate-result.json"), options: .atomic)
    }
}
