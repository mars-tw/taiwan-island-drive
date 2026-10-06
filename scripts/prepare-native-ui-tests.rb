# Only operates on a temporary copy supplied by capture-native-ios.sh.
gem 'xcodeproj', '= 1.27.0'
require 'xcodeproj'
require 'fileutils'
require 'pathname'
workspace, source_root = ARGV
abort 'Expected temporary workspace and source root' unless workspace && source_root
workspace = File.realpath(workspace)
source_root = File.realpath(source_root)
abort 'Do not modify the production checkout' if workspace == source_root || workspace.start_with?(source_root + '/')
path = File.join(workspace, 'ios/App/App.xcodeproj')
project = Xcodeproj::Project.open(path)
app = project.targets.find { |t| t.name == 'App' && t.product_type == 'com.apple.product-type.application' }
abort 'Expected original App target' unless app
abort 'Unexpected App bundle ID' unless app.build_configurations.all? { |c| c.build_settings['PRODUCT_BUNDLE_IDENTIFIER'] == 'tw.mars.islandtransport' }
test_dir = File.join(workspace, 'ios/App/NativeScreenshotTests')
FileUtils.mkdir_p(test_dir)
FileUtils.cp(File.join(source_root, 'tests/native-ios/NativeScreenshotTests.swift'), test_dir)
tests = project.new_target(:ui_test_bundle, 'NativeScreenshotTests', :ios, '16.4')
tests.add_dependency(app)
group = project.main_group.new_group('NativeScreenshotTests', 'NativeScreenshotTests')
tests.add_file_references([group.new_file('NativeScreenshotTests.swift')])
project.targets.each do |target|
  target.build_configurations.each do |config|
    config.build_settings['DEVELOPMENT_TEAM'] = ''
    config.build_settings['CODE_SIGN_STYLE'] = 'Manual'
    config.build_settings['CODE_SIGN_IDENTITY[sdk=iphonesimulator*]'] = '-'
    config.build_settings['CODE_SIGNING_ALLOWED[sdk=iphonesimulator*]'] = 'YES'
    config.build_settings['MARKETING_VERSION'] = '1.0.0'
    config.build_settings['CURRENT_PROJECT_VERSION'] = '1'
  end
end
tests.build_configurations.each do |config|
  config.build_settings.merge!({
    'PRODUCT_BUNDLE_IDENTIFIER' => 'tw.mars.islandtransport.screenshottests',
    'GENERATE_INFOPLIST_FILE' => 'YES', 'SWIFT_VERSION' => '5.0',
    'TEST_TARGET_NAME' => 'App', 'TARGETED_DEVICE_FAMILY' => '1,2',
    'IPHONEOS_DEPLOYMENT_TARGET' => '16.4',
    'FRAMEWORK_SEARCH_PATHS' => ['$(inherited)', '$(PLATFORM_DIR)/Developer/Library/Frameworks'],
    'LD_RUNPATH_SEARCH_PATHS' => ['$(inherited)', '@executable_path/Frameworks', '@loader_path/Frameworks']
  })
end
project.root_object.attributes['TargetAttributes'] ||= {}
project.root_object.attributes['TargetAttributes'][tests.uuid] = { 'TestTargetID' => app.uuid }
project.save
scheme = Xcodeproj::XCScheme.new
scheme.configure_with_targets(app, tests, launch_target: true)
scheme.test_action.build_configuration = 'Release'
scheme.launch_action.build_configuration = 'Release'
scheme.save_as(path, 'NativeScreenshotProof', true)
puts 'Prepared temporary native UI-test target; production project untouched.'
